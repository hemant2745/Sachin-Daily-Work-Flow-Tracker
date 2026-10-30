-- ==============================================================================
-- Migration: 20261103000000_create_app_settings.sql
-- Project: Sachin Behera Daily Workflow (Dedicated Project)
-- Purpose: Persistent Application Settings & Configuration with RLS
-- ==============================================================================

-- 1. Create public.app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_by TEXT
);

-- 2. Attach updated_at trigger
DROP TRIGGER IF EXISTS set_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER set_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 4. Strict Administrator-Only Access Policy
DROP POLICY IF EXISTS "Admin full access to app_settings" ON public.app_settings;
CREATE POLICY "Admin full access to app_settings"
    ON public.app_settings
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. Seed default configuration idempotently
INSERT INTO public.app_settings (key, value, description, updated_by)
VALUES
    ('admin_profile', '{"name": "Sachin Behera", "email": "sachin.behera@collegevidya.com", "role": "Team Leader", "organization": "College Vidya"}', 'Administrator identity and contact profile', 'system'),
    ('regional_preferences', '{"timezone": "Asia/Kolkata", "timezone_label": "Indian Standard Time (IST, UTC+05:30)", "currency": "INR", "currency_symbol": "₹", "date_format": "YYYY-MM-DD"}', 'Regional formatting preferences', 'system'),
    ('notification_preferences', '{"offsets": [-60, -30, -15, 15, 30, 60], "sender_email": "onboarding@resend.dev", "recipient_fallback": "sachin.behera@collegevidya.com", "frequency": "5 minutes"}', 'Task email reminder preferences', 'system'),
    ('target_defaults', '{"default_collection_target": 550000, "default_admission_target": 6, "team_target_amount": 4750000, "team_target_admissions": 52}', 'Default monthly target allocations', 'system'),
    ('export_preferences', '{"default_format": "xlsx", "include_audit_stamps": true, "csv_delimiter": ","}', 'Report export defaults', 'system')
ON CONFLICT (key) DO NOTHING;
