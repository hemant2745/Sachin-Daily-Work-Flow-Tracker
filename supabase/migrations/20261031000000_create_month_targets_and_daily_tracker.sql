-- ==============================================================================
-- Migration: 20261031000000_create_month_targets_and_daily_tracker.sql
-- Project: Sachin Behera Daily Workflow (Dedicated Project)
-- Purpose: Month-wise target management, audit trails, and daily tracker confirmations
-- ==============================================================================

-- 1. Extend counselor_monthly_targets with notes, updater, and assignment flag
ALTER TABLE public.counselor_monthly_targets 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS updated_by_email TEXT,
ADD COLUMN IF NOT EXISTS is_explicitly_assigned BOOLEAN NOT NULL DEFAULT true;

-- 2. Create Target Revision Audit Log Table
CREATE TABLE IF NOT EXISTS public.counselor_target_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counselor_id UUID NOT NULL REFERENCES public.counselors(id) ON DELETE CASCADE,
    target_month DATE NOT NULL,
    old_target_amount NUMERIC(12, 2),
    new_target_amount NUMERIC(12, 2) NOT NULL,
    old_target_admissions INTEGER,
    new_target_admissions INTEGER NOT NULL,
    notes TEXT,
    changed_by_email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_target_audit_counselor ON public.counselor_target_audit_logs(counselor_id);
CREATE INDEX IF NOT EXISTS idx_target_audit_month ON public.counselor_target_audit_logs(target_month);
CREATE INDEX IF NOT EXISTS idx_target_audit_counselor_month ON public.counselor_target_audit_logs(counselor_id, target_month);

ALTER TABLE public.counselor_target_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to target audit logs" ON public.counselor_target_audit_logs;
CREATE POLICY "Admin full access to target audit logs"
    ON public.counselor_target_audit_logs
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 3. Seed October 2026 targets explicitly for the 9 counselors into counselor_monthly_targets
-- Safe insert-if-missing: Preserves any already-assigned or revised October targets.
-- Will NOT overwrite existing October targets upon migration re-execution.
INSERT INTO public.counselor_monthly_targets (
    counselor_id,
    target_month,
    target_amount,
    target_admissions,
    notes,
    updated_by_email,
    is_explicitly_assigned
)
SELECT 
    c.id,
    '2026-10-01'::DATE,
    t.target_amount,
    t.target_admissions,
    'Initial October 2026 target allocation from spreadsheet',
    'sachin.behera@collegevidya.com',
    true
FROM (
    VALUES 
        ('BL1707', 550000.00, 6),
        ('BL2683', 550000.00, 6),
        ('BL2857', 450000.00, 5),
        ('BL3077', 550000.00, 6),
        ('BL2719', 450000.00, 5),
        ('BL2849', 550000.00, 6),
        ('BL2720', 550000.00, 6),
        ('BL2170', 550000.00, 6),
        ('BL3462', 550000.00, 6)
) AS t(employee_code, target_amount, target_admissions)
JOIN public.counselors c ON c.employee_code = t.employee_code
ON CONFLICT (counselor_id, target_month) DO NOTHING;

-- 4. Create Daily Confirmations Table for Explicit Zero Collection
CREATE TABLE IF NOT EXISTS public.counselor_daily_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counselor_id UUID NOT NULL REFERENCES public.counselors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('zero_confirmed', 'cleared')),
    confirmed_by_email TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_counselor_daily_confirmation UNIQUE (counselor_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_conf_counselor ON public.counselor_daily_confirmations(counselor_id);
CREATE INDEX IF NOT EXISTS idx_daily_conf_date ON public.counselor_daily_confirmations(date);
CREATE INDEX IF NOT EXISTS idx_daily_conf_counselor_date ON public.counselor_daily_confirmations(counselor_id, date);

-- Attach updated_at trigger
DROP TRIGGER IF EXISTS set_counselor_daily_confirmations_updated_at ON public.counselor_daily_confirmations;
CREATE TRIGGER set_counselor_daily_confirmations_updated_at
    BEFORE UPDATE ON public.counselor_daily_confirmations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.counselor_daily_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to counselor daily confirmations" ON public.counselor_daily_confirmations;
CREATE POLICY "Admin full access to counselor daily confirmations"
    ON public.counselor_daily_confirmations
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. Create Daily Status Audit Logs Table (tracks confirmations, revocations, and late-admission conflict overrides)
CREATE TABLE IF NOT EXISTS public.counselor_daily_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counselor_id UUID NOT NULL REFERENCES public.counselors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    action TEXT NOT NULL, -- 'CONFIRMED_ZERO', 'REVOKED_ZERO', 'LATE_ADMISSION_OVERRIDE'
    previous_status TEXT,
    new_status TEXT,
    details TEXT,
    actor_email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_daily_audit_counselor_date ON public.counselor_daily_audit_logs(counselor_id, date);

ALTER TABLE public.counselor_daily_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to counselor daily audit logs" ON public.counselor_daily_audit_logs;
CREATE POLICY "Admin full access to counselor daily audit logs"
    ON public.counselor_daily_audit_logs
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
