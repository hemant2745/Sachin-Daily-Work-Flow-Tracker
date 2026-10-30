-- ==============================================================================
-- Migration: 20261104000000_create_counselor_calling_checkpoints.sql
-- Project: Sachin Behera Daily Workflow (Dedicated Project)
-- Purpose: Phase 6 Counsellor Daily Calling Performance and APR Tracking
-- ==============================================================================

-- 1. Create counselor_calling_checkpoints table
CREATE TABLE IF NOT EXISTS public.counselor_calling_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counselor_id UUID NOT NULL REFERENCES public.counselors(id) ON DELETE RESTRICT,
    checkpoint_date DATE NOT NULL,
    calls_made INTEGER NOT NULL DEFAULT 0,
    calls_connected INTEGER NOT NULL DEFAULT 0,
    talk_time_minutes NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    follow_ups INTEGER NOT NULL DEFAULT 0,
    admissions_converted INTEGER NOT NULL DEFAULT 0,
    call_achievement_percent NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    talk_time_achievement_percent NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    apr_percent NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    apr_reason TEXT,
    daily_notes TEXT,
    created_by TEXT NOT NULL DEFAULT 'sachin.behera@collegevidya.com',
    updated_by TEXT NOT NULL DEFAULT 'sachin.behera@collegevidya.com',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Integrity Constraints
    CONSTRAINT uq_counselor_calling_checkpoint UNIQUE (counselor_id, checkpoint_date),
    CONSTRAINT chk_calling_calls_made_non_negative CHECK (calls_made >= 0),
    CONSTRAINT chk_calling_calls_connected_valid CHECK (calls_connected >= 0 AND calls_connected <= calls_made),
    CONSTRAINT chk_calling_talk_time_non_negative CHECK (talk_time_minutes >= 0),
    CONSTRAINT chk_calling_follow_ups_non_negative CHECK (follow_ups >= 0),
    CONSTRAINT chk_calling_admissions_non_negative CHECK (admissions_converted >= 0)
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_calling_checkpoint_counselor ON public.counselor_calling_checkpoints(counselor_id);
CREATE INDEX IF NOT EXISTS idx_calling_checkpoint_date ON public.counselor_calling_checkpoints(checkpoint_date);
CREATE INDEX IF NOT EXISTS idx_calling_checkpoint_counselor_date ON public.counselor_calling_checkpoints(counselor_id, checkpoint_date);

-- 3. Automatic updated_at Trigger
DROP TRIGGER IF EXISTS set_counselor_calling_checkpoints_updated_at ON public.counselor_calling_checkpoints;
CREATE TRIGGER set_counselor_calling_checkpoints_updated_at
    BEFORE UPDATE ON public.counselor_calling_checkpoints
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.counselor_calling_checkpoints ENABLE ROW LEVEL SECURITY;

-- 5. Strict Administrator Authorization Policy
DROP POLICY IF EXISTS "Admin full access to counselor calling checkpoints" ON public.counselor_calling_checkpoints;
CREATE POLICY "Admin full access to counselor calling checkpoints"
    ON public.counselor_calling_checkpoints
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
