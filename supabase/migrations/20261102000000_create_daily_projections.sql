-- ==============================================================================
-- Migration: 20261102000000_create_daily_projections.sql
-- Project: Sachin Behera Daily Workflow (Dedicated Project)
-- Purpose: Daily Projection & Completion Tracking Module Schema with RLS
-- ==============================================================================

-- 1. Create public.projections table
CREATE TABLE IF NOT EXISTS public.projections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projection_date DATE NOT NULL,
    counselor_id UUID NOT NULL REFERENCES public.counselors(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE RESTRICT,
    projected_revenue NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'met', 'not_met')),
    notes TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_projected_revenue_positive CHECK (projected_revenue > 0)
);

-- 2. Create indexes for high performance querying, filtering, and aggregation
CREATE INDEX IF NOT EXISTS idx_projections_projection_date ON public.projections(projection_date);
CREATE INDEX IF NOT EXISTS idx_projections_counselor_id ON public.projections(counselor_id);
CREATE INDEX IF NOT EXISTS idx_projections_university_id ON public.projections(university_id);
CREATE INDEX IF NOT EXISTS idx_projections_status ON public.projections(status);
CREATE INDEX IF NOT EXISTS idx_projections_date_counselor ON public.projections(projection_date, counselor_id);
CREATE INDEX IF NOT EXISTS idx_projections_pending_reviews ON public.projections(status, projection_date) WHERE status = 'pending';

-- 3. Attach updated_at trigger
DROP TRIGGER IF EXISTS set_projections_updated_at ON public.projections;
CREATE TRIGGER set_projections_updated_at
    BEFORE UPDATE ON public.projections
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.projections ENABLE ROW LEVEL SECURITY;

-- 5. Strict Administrator-Only Access Policy
DROP POLICY IF EXISTS "Admin full access to projections" ON public.projections;
CREATE POLICY "Admin full access to projections"
    ON public.projections
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
