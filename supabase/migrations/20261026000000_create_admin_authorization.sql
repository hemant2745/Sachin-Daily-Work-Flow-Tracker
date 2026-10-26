-- ==============================================================================
-- Migration: 20261026000000_create_admin_authorization.sql
-- Project: Sachin Behera Daily Workflow (Dedicated Project)
-- Purpose: Minimum viable database foundation for single-administrator authorization
-- ==============================================================================

-- 1. Create table for tracking verified administrators linked to auth.users
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT 'Sachin Behera',
    role TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for rapid email lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON public.admin_users(is_active) WHERE is_active = true;

-- 2. Trigger to keep updated_at synchronized
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER set_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Security Definer Helper Function to check if calling session is an active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE id = auth.uid()
          AND is_active = true
    );
$$;

-- Grant execution permission to authenticated users only
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 4. Row-Level Security (RLS) Policies
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Deny all access to anonymous users by default
-- Authenticated admins can view their own record or other admin records
CREATE POLICY "Admins can view admin_users"
    ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (public.is_admin() OR auth.uid() = id);

-- Only existing active super_admin can create or update admin records
CREATE POLICY "Super admins can manage admin_users"
    ON public.admin_users
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.admin_users
            WHERE id = auth.uid()
              AND role = 'super_admin'
              AND is_active = true
        )
    );

-- 5. Helper trigger to automatically record the initial administrator when created via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    target_admin_email CONSTANT TEXT := 'sachin.behera@collegevidya.com';
BEGIN
    -- Only auto-register if the newly signed-up user matches the authorized admin email
    IF LOWER(NEW.email) = LOWER(target_admin_email) THEN
        INSERT INTO public.admin_users (id, email, full_name, role, is_active)
        VALUES (
            NEW.id,
            LOWER(NEW.email),
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'Sachin Behera'),
            'super_admin',
            true
        )
        ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            is_active = true,
            updated_at = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();
