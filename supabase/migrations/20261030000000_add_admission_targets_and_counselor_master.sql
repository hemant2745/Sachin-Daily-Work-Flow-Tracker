-- ==============================================================================
-- Migration: 20261030000000_add_admission_targets_and_counselor_master.sql
-- Project: Sachin Behera Daily Workflow (Dedicated Project)
-- Purpose: Phase 4.3 Additive schema for admission targets & Counselor Master Data Import
-- ==============================================================================

-- 1. Add monthly_admission_target column to counselors table
ALTER TABLE public.counselors 
ADD COLUMN IF NOT EXISTS monthly_admission_target INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.counselors 
DROP CONSTRAINT IF EXISTS chk_counselor_monthly_admission_target_non_negative;

ALTER TABLE public.counselors 
ADD CONSTRAINT chk_counselor_monthly_admission_target_non_negative 
CHECK (monthly_admission_target >= 0);

-- 2. Relax NOT NULL constraint on email and phone so master counselors can be imported
-- without inventing fake email addresses or phone numbers, while preserving format checks when present.
ALTER TABLE public.counselors ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.counselors ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE public.counselors DROP CONSTRAINT IF EXISTS chk_counselor_email_normalized;
ALTER TABLE public.counselors ADD CONSTRAINT chk_counselor_email_normalized 
CHECK (email IS NULL OR (length(trim(email)) > 0 AND email = lower(trim(email))));

ALTER TABLE public.counselors DROP CONSTRAINT IF EXISTS chk_counselor_phone_non_empty;
ALTER TABLE public.counselors ADD CONSTRAINT chk_counselor_phone_non_empty 
CHECK (phone IS NULL OR length(trim(phone)) > 0);

-- 3. Add target_admissions column to counselor_monthly_targets table
ALTER TABLE public.counselor_monthly_targets 
ADD COLUMN IF NOT EXISTS target_admissions INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.counselor_monthly_targets 
DROP CONSTRAINT IF EXISTS chk_target_admissions_non_negative;

ALTER TABLE public.counselor_monthly_targets 
ADD CONSTRAINT chk_target_admissions_non_negative 
CHECK (target_admissions >= 0);

-- 4. Idempotently insert/update the 9 authorized counselors matching by employee_code
-- Preserves existing email, phone, and historical dependencies.
INSERT INTO public.counselors (
    employee_code,
    full_name,
    monthly_target,
    monthly_admission_target,
    is_active
) VALUES
    ('BL1707', 'Shikha', 550000.00, 6, true),
    ('BL2683', 'Shivalika', 550000.00, 6, true),
    ('BL2857', 'Vansh', 450000.00, 5, true),
    ('BL3077', 'Kanika', 550000.00, 6, true),
    ('BL2719', 'Bhawana Sharma', 450000.00, 5, true),
    ('BL2849', 'Munesh', 550000.00, 6, true),
    ('BL2720', 'Sameer', 550000.00, 6, true),
    ('BL2170', 'Bharat', 550000.00, 6, true),
    ('BL3462', 'Divya', 550000.00, 6, true)
ON CONFLICT (employee_code) DO UPDATE
SET monthly_admission_target = CASE 
        WHEN public.counselors.monthly_admission_target IS NULL OR public.counselors.monthly_admission_target = 0 
        THEN EXCLUDED.monthly_admission_target 
        ELSE public.counselors.monthly_admission_target 
    END,
    monthly_target = CASE
        WHEN public.counselors.monthly_target IS NULL OR public.counselors.monthly_target = 0 
        THEN EXCLUDED.monthly_target
        ELSE public.counselors.monthly_target
    END,
    is_active = true,
    updated_at = timezone('utc'::text, now());
