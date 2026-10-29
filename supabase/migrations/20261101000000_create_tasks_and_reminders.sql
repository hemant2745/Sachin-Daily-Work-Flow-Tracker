-- ==============================================================================
-- Migration: 20261101000000_create_tasks_and_reminders.sql
-- Project: Sachin Behera Daily Workflow (Dedicated Project)
-- Purpose: Complete Task Management, Subtasks, University Master Table, and Email Reminders
-- ==============================================================================

-- 1. Create universities table and seed initial 23 partner universities
CREATE TABLE IF NOT EXISTS public.universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_university_name_non_empty CHECK (length(trim(name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_universities_name ON public.universities(name);
CREATE INDEX IF NOT EXISTS idx_universities_is_active ON public.universities(is_active);

-- Attach updated_at trigger
DROP TRIGGER IF EXISTS set_universities_updated_at ON public.universities;
CREATE TRIGGER set_universities_updated_at
    BEFORE UPDATE ON public.universities
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to universities" ON public.universities;
CREATE POLICY "Admin full access to universities"
    ON public.universities
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Seed initial 23 approved online universities idempotently
INSERT INTO public.universities (name) VALUES
    ('Alliance University Online'),
    ('Amity University Online'),
    ('DY Patil University Online, Pune'),
    ('Lovely Professional University (LPU) Online'),
    ('Manipal University Jaipur (MUJ) Online'),
    ('Chandigarh University Online'),
    ('Bennett University Online'),
    ('Vivekananda Global University (VGU) Online'),
    ('Sharda University Online'),
    ('Shoolini University Online'),
    ('Uttaranchal University Online'),
    ('Sikkim Manipal University Online'),
    ('Assam Down Town University Online'),
    ('Galgotias University Online'),
    ('UPES Online'),
    ('Amrita AHEAD Online'),
    ('NMIMS Online'),
    ('GLA University Online'),
    ('D. Y. Patil University Online, Navi Mumbai'),
    ('Christ University Online'),
    ('Parul University Online'),
    ('Kurukshetra University Online'),
    ('Andhra University Online')
ON CONFLICT (name) DO NOTHING;


-- 2. Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    scheduled_date DATE NOT NULL,
    scheduled_start_time TIME NOT NULL,
    scheduled_end_time TIME,
    duration_minutes INTEGER DEFAULT 30,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    scheduled_at TIMESTAMPTZ NOT NULL, -- Stored in UTC for accurate scheduling and cron triggers
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    counselor_id UUID REFERENCES public.counselors(id) ON DELETE SET NULL,
    university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
    category TEXT,
    created_by_email TEXT NOT NULL DEFAULT 'sachin.behera@collegevidya.com',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_task_title_non_empty CHECK (length(trim(title)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_at ON public.tasks(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON public.tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_counselor_id ON public.tasks(counselor_id);
CREATE INDEX IF NOT EXISTS idx_tasks_university_id ON public.tasks(university_id);

-- Attach updated_at trigger
DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to tasks" ON public.tasks;
CREATE POLICY "Admin full access to tasks"
    ON public.tasks
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- 3. Create subtasks table
CREATE TABLE IF NOT EXISTS public.subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    due_date DATE,
    due_time TIME,
    sort_order INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_subtask_title_non_empty CHECK (length(trim(title)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_status ON public.subtasks(status);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_sort ON public.subtasks(task_id, sort_order);

-- Attach updated_at trigger
DROP TRIGGER IF EXISTS set_subtasks_updated_at ON public.subtasks;
CREATE TRIGGER set_subtasks_updated_at
    BEFORE UPDATE ON public.subtasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to subtasks" ON public.subtasks;
CREATE POLICY "Admin full access to subtasks"
    ON public.subtasks
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- 4. Create task_reminders table for automated email reminder scheduling and delivery tracking
CREATE TABLE IF NOT EXISTS public.task_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN (
        'before_60m',
        'before_30m',
        'before_15m',
        'after_15m',
        'after_30m',
        'after_60m'
    )),
    scheduled_for TIMESTAMPTZ NOT NULL,
    offset_minutes INTEGER NOT NULL, -- -60, -30, -15, 15, 30, 60
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled', 'skipped')),
    sent_at TIMESTAMPTZ,
    recipient_email TEXT NOT NULL DEFAULT 'sachin.behera@collegevidya.com',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_task_reminder_type UNIQUE (task_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_reminders_task_id ON public.task_reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON public.task_reminders(scheduled_for, status) WHERE status = 'pending';

-- Attach updated_at trigger
DROP TRIGGER IF EXISTS set_task_reminders_updated_at ON public.task_reminders;
CREATE TRIGGER set_task_reminders_updated_at
    BEFORE UPDATE ON public.task_reminders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.task_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to task_reminders" ON public.task_reminders;
CREATE POLICY "Admin full access to task_reminders"
    ON public.task_reminders
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
