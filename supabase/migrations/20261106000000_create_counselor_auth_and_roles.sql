-- ==============================================================================
-- Migration: 20261106000000_create_counselor_auth_and_roles.sql
-- Project: Sachin Daily Work Flow Tracker
-- Purpose: Phase 4 Counselor Authentication, Role-Based Access Control & Scoped RLS
-- ==============================================================================

-- 1. Add auth_user_id to public.counselors to associate authenticated auth.users
ALTER TABLE public.counselors
    ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_counselors_auth_user_id
    ON public.counselors(auth_user_id)
    WHERE auth_user_id IS NOT NULL;

-- 2. Security Definer Function to resolve current user's counselor_id
CREATE OR REPLACE FUNCTION public.get_counselor_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT id
    FROM public.counselors
    WHERE (auth_user_id = auth.uid() OR lower(email) = lower(auth.jwt()->>'email'))
      AND is_active = true
    LIMIT 1;
$$;

-- Grant execution to authenticated users
REVOKE EXECUTE ON FUNCTION public.get_counselor_id() FROM public;
GRANT EXECUTE ON FUNCTION public.get_counselor_id() TO authenticated;

-- 3. Security Definer Function to check if current user is an active counselor
CREATE OR REPLACE FUNCTION public.is_counselor()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.counselors
        WHERE (auth_user_id = auth.uid() OR lower(email) = lower(auth.jwt()->>'email'))
          AND is_active = true
    );
$$;

REVOKE EXECUTE ON FUNCTION public.is_counselor() FROM public;
GRANT EXECUTE ON FUNCTION public.is_counselor() TO authenticated;

-- 4. Automatic link trigger: Links auth_user_id when counselor auth user is created
CREATE OR REPLACE FUNCTION public.link_counselor_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.counselors
    SET auth_user_id = NEW.id,
        updated_at = timezone('utc'::text, now())
    WHERE lower(email) = lower(NEW.email)
      AND (auth_user_id IS NULL OR auth_user_id = NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_link_counselor_auth_user ON auth.users;
CREATE TRIGGER trg_link_counselor_auth_user
    AFTER INSERT OR UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.link_counselor_auth_user();

-- 5. Update RLS Policies for counselors table
ALTER TABLE public.counselors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to counselors" ON public.counselors;
CREATE POLICY "Admin full access to counselors"
    ON public.counselors
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Counselors can view own profile" ON public.counselors;
CREATE POLICY "Counselors can view own profile"
    ON public.counselors
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = auth_user_id 
        OR lower(email) = lower(auth.jwt()->>'email')
        OR public.is_admin()
    );

-- 6. Update RLS Policies for admissions table
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to admissions" ON public.admissions;
CREATE POLICY "Admin full access to admissions"
    ON public.admissions
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Counselors view own admissions" ON public.admissions;
CREATE POLICY "Counselors view own admissions"
    ON public.admissions
    FOR SELECT
    TO authenticated
    USING (
        counselor_id = public.get_counselor_id()
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Counselors insert own admissions" ON public.admissions;
CREATE POLICY "Counselors insert own admissions"
    ON public.admissions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        counselor_id = public.get_counselor_id()
        AND (verification_status IS NULL OR verification_status = 'unverified')
    );

-- (Note: No UPDATE or DELETE policies for counselors on admissions - strictly forbidden)

-- 7. Update RLS Policies for projections table
ALTER TABLE public.projections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to projections" ON public.projections;
CREATE POLICY "Admin full access to projections"
    ON public.projections
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Counselors view own projections" ON public.projections;
CREATE POLICY "Counselors view own projections"
    ON public.projections
    FOR SELECT
    TO authenticated
    USING (
        counselor_id = public.get_counselor_id()
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Counselors submit own projections" ON public.projections;
CREATE POLICY "Counselors submit own projections"
    ON public.projections
    FOR INSERT
    TO authenticated
    WITH CHECK (
        counselor_id = public.get_counselor_id()
    );

DROP POLICY IF EXISTS "Counselors update own pending projections" ON public.projections;
CREATE POLICY "Counselors update own pending projections"
    ON public.projections
    FOR UPDATE
    TO authenticated
    USING (
        counselor_id = public.get_counselor_id()
        AND status = 'pending'
    )
    WITH CHECK (
        counselor_id = public.get_counselor_id()
        AND status = 'pending'
    );
