-- ==============================================================================
-- Migration: 20261029000000_create_admissions.sql
-- Project: Sachin Behera Daily Workflow (Dedicated Project)
-- Purpose: Phase 4 Admissions Pipeline, Actual Collections & Revenue Schema with RLS
-- ==============================================================================

-- 1. Create admissions table
CREATE TABLE IF NOT EXISTS public.admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counselor_id UUID NOT NULL REFERENCES public.counselors(id) ON DELETE RESTRICT,
    admission_date DATE NOT NULL,
    university_name TEXT NOT NULL,
    program_name TEXT NOT NULL,
    amount_collected NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_mode TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_admissions_university_non_empty CHECK (length(trim(university_name)) > 0),
    CONSTRAINT chk_admissions_program_non_empty CHECK (length(trim(program_name)) > 0),
    CONSTRAINT chk_admissions_amount_non_negative CHECK (amount_collected >= 0),
    CONSTRAINT chk_admissions_payment_mode CHECK (payment_mode IN ('semester_fees', 'annual_fees', 'full_fees'))
);

-- Indexes for rapid counselor filtering, date range queries, and monthly aggregations
CREATE INDEX IF NOT EXISTS idx_admissions_counselor_id ON public.admissions(counselor_id);
CREATE INDEX IF NOT EXISTS idx_admissions_admission_date ON public.admissions(admission_date);
CREATE INDEX IF NOT EXISTS idx_admissions_counselor_date ON public.admissions(counselor_id, admission_date);
CREATE INDEX IF NOT EXISTS idx_admissions_payment_mode ON public.admissions(payment_mode);

-- Attach updated_at trigger (reuses handle_updated_at function created in Phase 2)
DROP TRIGGER IF EXISTS set_admissions_updated_at ON public.admissions;
CREATE TRIGGER set_admissions_updated_at
    BEFORE UPDATE ON public.admissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 2. Row-Level Security (RLS) Policies
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;

-- Deny all access to anonymous users by default
-- Allow read and write operations exclusively to active verified administrators via public.is_admin()
DROP POLICY IF EXISTS "Admin full access to admissions" ON public.admissions;
CREATE POLICY "Admin full access to admissions"
    ON public.admissions
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
