-- ==============================================================================
-- Migration: 20261028000000_create_counselors_and_targets.sql
-- Project: Sachin Behera Daily Workflow (Dedicated Project)
-- Purpose: Phase 3 Counselor Management and Monthly Targets Schema with RLS
-- ==============================================================================

-- 1. Create counselors table
CREATE TABLE IF NOT EXISTS public.counselors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    monthly_target NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_counselor_employee_code_non_empty CHECK (length(trim(employee_code)) > 0),
    CONSTRAINT chk_counselor_full_name_non_empty CHECK (length(trim(full_name)) > 0),
    CONSTRAINT chk_counselor_email_normalized CHECK (length(trim(email)) > 0 AND email = lower(trim(email))),
    CONSTRAINT chk_counselor_phone_non_empty CHECK (length(trim(phone)) > 0),
    CONSTRAINT chk_counselor_monthly_target_non_negative CHECK (monthly_target >= 0)
);

-- Indexes for rapid lookup and filtering
CREATE INDEX IF NOT EXISTS idx_counselors_is_active ON public.counselors(is_active);
CREATE INDEX IF NOT EXISTS idx_counselors_employee_code ON public.counselors(employee_code);
CREATE INDEX IF NOT EXISTS idx_counselors_email ON public.counselors(email);
CREATE INDEX IF NOT EXISTS idx_counselors_full_name ON public.counselors(full_name);

-- Attach updated_at trigger
DROP TRIGGER IF EXISTS set_counselors_updated_at ON public.counselors;
CREATE TRIGGER set_counselors_updated_at
    BEFORE UPDATE ON public.counselors
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 2. Create counselor_monthly_targets table (Authoritative source for month-specific targets)
CREATE TABLE IF NOT EXISTS public.counselor_monthly_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counselor_id UUID NOT NULL REFERENCES public.counselors(id) ON DELETE RESTRICT,
    target_month DATE NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_counselor_monthly_target UNIQUE (counselor_id, target_month),
    CONSTRAINT chk_target_amount_non_negative CHECK (target_amount >= 0)
);

-- Indexes for month-based aggregation and counselor lookups
CREATE INDEX IF NOT EXISTS idx_targets_counselor_id ON public.counselor_monthly_targets(counselor_id);
CREATE INDEX IF NOT EXISTS idx_targets_target_month ON public.counselor_monthly_targets(target_month);
CREATE INDEX IF NOT EXISTS idx_targets_counselor_month ON public.counselor_monthly_targets(counselor_id, target_month);

-- Attach updated_at trigger
DROP TRIGGER IF EXISTS set_counselor_monthly_targets_updated_at ON public.counselor_monthly_targets;
CREATE TRIGGER set_counselor_monthly_targets_updated_at
    BEFORE UPDATE ON public.counselor_monthly_targets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Row-Level Security (RLS) Policies
ALTER TABLE public.counselors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselor_monthly_targets ENABLE ROW LEVEL SECURITY;

-- Deny all access to anonymous users by default
-- Allow read and write operations exclusively to active verified administrators via public.is_admin()
DROP POLICY IF EXISTS "Admin full access to counselors" ON public.counselors;
CREATE POLICY "Admin full access to counselors"
    ON public.counselors
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin full access to counselor_monthly_targets" ON public.counselor_monthly_targets;
CREATE POLICY "Admin full access to counselor_monthly_targets"
    ON public.counselor_monthly_targets
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
