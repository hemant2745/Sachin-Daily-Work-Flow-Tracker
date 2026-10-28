# Database Schema Architecture Blueprint
### Project: Sachin Behera Daily Workflow
### Dedicated Supabase PostgreSQL Database

---

## Architecture Principles
1. **Single-Administrator Access**: Only Sachin Behera (Team Leader) logs in. Counselors are modeled strictly as database records and do not receive login accounts.
2. **Row-Level Security (RLS)**: Every application table has RLS enabled. No anonymous or unauthorized authenticated access is permitted.
3. **Phased Implementation**: In Phase 2, only the minimum viable authorization structure (`admin_users`) is applied. The future entities detailed below will be created during their respective implementation phases.

---

## 1. Implemented in Phase 2: Administrator Authorization

### `public.admin_users`
- `id` (UUID, PK, references `auth.users(id) ON DELETE CASCADE`)
- `email` (TEXT, UNIQUE, NOT NULL)
- `full_name` (TEXT, NOT NULL, DEFAULT `'Sachin Behera'`)
- `role` (TEXT, NOT NULL, CHECK: `'super_admin'`, `'admin'`)
- `is_active` (BOOLEAN, NOT NULL, DEFAULT `true`)
- `created_at` (TIMESTAMPTZ, NOT NULL)
- `updated_at` (TIMESTAMPTZ, NOT NULL)

---

## 2. Implemented in Phase 3: Counselor Management & Monthly Targets

### `public.counselors`
- `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
- `employee_code` (TEXT, UNIQUE, NOT NULL, CHECK: non-empty)
- `full_name` (TEXT, NOT NULL, CHECK: non-empty)
- `email` (TEXT, UNIQUE, NOT NULL, normalized lowercase)
- `phone` (TEXT, NOT NULL, CHECK: non-empty)
- `monthly_target` (NUMERIC(12,2), NOT NULL, DEFAULT 0.00, CHECK >= 0) -- Base quota
- `is_active` (BOOLEAN, NOT NULL, DEFAULT true)
- `created_at` (TIMESTAMPTZ, NOT NULL)
- `updated_at` (TIMESTAMPTZ, NOT NULL)
- *RLS*: Enabled. Read/write access strictly restricted to verified administrators via `public.is_admin()`.

### `public.counselor_monthly_targets` (Authoritative Source for Monthly Targets)
- `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
- `counselor_id` (UUID, references `counselors(id) ON DELETE RESTRICT`)
- `target_month` (DATE, NOT NULL) -- Normalized to first day of month (YYYY-MM-01)
- `target_amount` (NUMERIC(12,2), NOT NULL, DEFAULT 0.00, CHECK >= 0)
- `created_at` (TIMESTAMPTZ, NOT NULL)
- `updated_at` (TIMESTAMPTZ, NOT NULL)
- *Constraint*: `UNIQUE(counselor_id, target_month)`
- *Foreign Key Rule*: `ON DELETE RESTRICT` (Prevents silent deletion of historical targets)
- *RLS*: Enabled. Restricted to active administrators via `public.is_admin()`.

---

## 3. Implemented in Phase 4: Admissions Pipeline & Verified Collections

### `public.admissions`
- `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
- `counselor_id` (UUID, NOT NULL, references `counselors(id) ON DELETE RESTRICT`)
- `admission_date` (DATE, NOT NULL) -- Primary reporting date for monthly revenue attribution
- `university_name` (TEXT, NOT NULL, CHECK: non-empty)
- `program_name` (TEXT, NOT NULL, CHECK: non-empty)
- `amount_collected` (NUMERIC(12,2), NOT NULL, DEFAULT 0.00, CHECK >= 0) -- Actual verified collection amount
- `payment_mode` (TEXT, NOT NULL, CHECK: `'semester_fees'`, `'annual_fees'`, `'full_fees'`)
- `notes` (TEXT, optional)
- `created_at` (TIMESTAMPTZ, NOT NULL)
- `updated_at` (TIMESTAMPTZ, NOT NULL)
- *Foreign Key Rule*: `ON DELETE RESTRICT` (Protects historical admissions from silent cascade deletion)
- *RLS*: Enabled. Read/write operations strictly restricted to verified administrators via `public.is_admin()`.

---

## 4. Planned for Phase 5: Daily Tracker & Collections

### `public.daily_collections`
- `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
- `admission_id` (UUID, references `admissions(id)`)
- `counselor_id` (UUID, references `counselors(id)`)
- `collection_date` (DATE NOT NULL)
- `amount_collected` (NUMERIC(12,2) NOT NULL)
- `payment_mode` (TEXT, CHECK: `'online'`, `'gateway'`, `'loan'`, `'dd'`)
- `confirmation_status` (TEXT, CHECK: `'confirmed'`, `'pending_verification'`)
- `created_at` (TIMESTAMPTZ)

---

## 5. Planned for Phase 6: Projections & Forecasting

### `public.projection_evaluations`
- `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
- `counselor_id` (UUID, references `counselors(id)`)
- `evaluation_date` (DATE NOT NULL)
- `projected_admissions` (INTEGER NOT NULL)
- `projected_revenue` (NUMERIC(12,2) NOT NULL)
- `confidence_score` (NUMERIC(3,2)) -- 0.00 to 1.00
- `evaluation_notes` (TEXT)
- `status` (TEXT, CHECK: `'draft'`, `'submitted'`, `'reviewed'`)
- `created_at` (TIMESTAMPTZ)

---

## 6. Planned for Phase 7: Tasks & Subtasks

### `public.tasks`
- `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
- `title` (TEXT NOT NULL)
- `description` (TEXT)
- `assigned_counselor_id` (UUID, references `counselors(id)`)
- `due_date` (TIMESTAMPTZ)
- `priority` (TEXT, CHECK: `'low'`, `'medium'`, `'high'`, `'urgent'`)
- `status` (TEXT, CHECK: `'pending'`, `'in_progress'`, `'completed'`, `'deferred'`)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### `public.subtasks`
- `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
- `task_id` (UUID, references `tasks(id) ON DELETE CASCADE`)
- `title` (TEXT NOT NULL)
- `is_completed` (BOOLEAN NOT NULL DEFAULT false)
- `completed_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)

---

## 7. Planned for Phase 8: Reminders & Notification Logs

### `public.reminder_jobs`
- `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
- `target_type` (TEXT, CHECK: `'task'`, `'projection'`, `'target_deadline'`)
- `target_id` (UUID NOT NULL)
- `scheduled_time` (TIMESTAMPTZ NOT NULL)
- `channel` (TEXT, CHECK: `'dashboard'`, `'email'`, `'system'`)
- `status` (TEXT, CHECK: `'scheduled'`, `'sent'`, `'failed'`, `'cancelled'`)
- `delivery_log` (JSONB)
- `created_at` (TIMESTAMPTZ)
