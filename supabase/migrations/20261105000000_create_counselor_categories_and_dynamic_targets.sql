-- ==============================================================================
-- Migration: 20261105000000_create_counselor_categories_and_dynamic_targets.sql
-- Project: Sachin Behera Daily Workflow
-- Purpose: Phase 2 Counselor Categories (CDA, SCDA, PCA) & Dynamic Target Management with RLS
-- ==============================================================================

-- 1. Add category column to counselors table
ALTER TABLE public.counselors 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'CDA';

ALTER TABLE public.counselors 
DROP CONSTRAINT IF EXISTS chk_counselor_category_valid;

ALTER TABLE public.counselors 
ADD CONSTRAINT chk_counselor_category_valid 
CHECK (category IN ('CDA', 'SCDA', 'PCA'));

CREATE INDEX IF NOT EXISTS idx_counselors_category ON public.counselors(category);

-- 2. Create category_monthly_targets table
-- Authoritative source for category base targets per month
CREATE TABLE IF NOT EXISTS public.category_monthly_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('CDA', 'SCDA', 'PCA')),
    target_month DATE NOT NULL,
    base_target NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    base_admission_target INTEGER NOT NULL DEFAULT 0,
    updated_by_email TEXT NOT NULL DEFAULT 'sachin.behera@collegevidya.com',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_category_monthly_target UNIQUE (category, target_month),
    CONSTRAINT chk_category_base_target_non_negative CHECK (base_target >= 0),
    CONSTRAINT chk_category_base_adm_target_non_negative CHECK (base_admission_target >= 0)
);

CREATE INDEX IF NOT EXISTS idx_category_targets_month ON public.category_monthly_targets(category, target_month);

-- Attach updated_at trigger
DROP TRIGGER IF EXISTS set_category_monthly_targets_updated_at ON public.category_monthly_targets;
CREATE TRIGGER set_category_monthly_targets_updated_at
    BEFORE UPDATE ON public.category_monthly_targets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row-Level Security
ALTER TABLE public.category_monthly_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to category monthly targets" ON public.category_monthly_targets;
CREATE POLICY "Admin full access to category monthly targets"
    ON public.category_monthly_targets
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 3. Extend counselor_monthly_targets table for category & additional target tracking
ALTER TABLE public.counselor_monthly_targets
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IS NULL OR category IN ('CDA', 'SCDA', 'PCA')),
ADD COLUMN IF NOT EXISTS base_target NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS additional_target NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS additional_target_reason TEXT;

-- 4. Extend counselor_target_audit_logs table with category & additional target metadata
ALTER TABLE public.counselor_target_audit_logs
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS base_target NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS additional_target NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS change_type TEXT DEFAULT 'TARGET_UPDATE';

-- 5. Create dedicated category_target_audit_logs table for audit tracking of category target revisions
CREATE TABLE IF NOT EXISTS public.category_target_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('CDA', 'SCDA', 'PCA')),
    target_month DATE NOT NULL,
    old_base_target NUMERIC(12, 2),
    new_base_target NUMERIC(12, 2) NOT NULL,
    old_base_admission_target INTEGER,
    new_base_admission_target INTEGER NOT NULL,
    changed_by_email TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cat_audit_month ON public.category_target_audit_logs(category, target_month);

ALTER TABLE public.category_target_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to category target audit logs" ON public.category_target_audit_logs;
CREATE POLICY "Admin full access to category target audit logs"
    ON public.category_target_audit_logs
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. Seed initial category targets idempotently for current and neighboring reporting months
INSERT INTO public.category_monthly_targets (category, target_month, base_target, base_admission_target, updated_by_email)
VALUES
    ('CDA', '2026-10-01'::DATE, 800000.00, 8, 'sachin.behera@collegevidya.com'),
    ('SCDA', '2026-10-01'::DATE, 600000.00, 6, 'sachin.behera@collegevidya.com'),
    ('PCA', '2026-10-01'::DATE, 400000.00, 4, 'sachin.behera@collegevidya.com'),
    ('CDA', '2026-11-01'::DATE, 800000.00, 8, 'sachin.behera@collegevidya.com'),
    ('SCDA', '2026-11-01'::DATE, 600000.00, 6, 'sachin.behera@collegevidya.com'),
    ('PCA', '2026-11-01'::DATE, 400000.00, 4, 'sachin.behera@collegevidya.com')
ON CONFLICT (category, target_month) DO NOTHING;
