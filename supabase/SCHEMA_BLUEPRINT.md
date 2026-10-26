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

## 2. Planned for Phase 3: Counselor Management

### `public.counselors`
- `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
- `employee_id` (TEXT, UNIQUE, NOT NULL)
- `full_name` (TEXT, NOT NULL)
- `work_email` (TEXT, NOT NULL)
- `phone_number` (TEXT)
- `team_leader_id` (UUID, references `admin_users(id)`)
- `status` (TEXT, NOT NULL, CHECK: `'active'`, `'inactive'`, `'on_leave'`)
- `joined_date` (DATE NOT NULL)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

---

## 3. Planned for Phase 4: Monthly Targets & Admissions

### `public.monthly_targets`
- `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
- `counselor_id` (UUID, references `counselors(id) ON DELETE CASCADE`)
- `target_month` (DATE NOT NULL) -- Normalized to 1st of month
- `target_revenue` (NUMERIC(12,2) NOT NULL DEFAULT 0.00)
- `target_admissions` (INTEGER NOT NULL DEFAULT 0)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- *Constraint*: `UNIQUE(counselor_id, target_month)`

### `public.admissions`
- `id` (UUID, PK, DEFAULT `gen_random_uuid()`)
- `admission_id` (TEXT, UNIQUE, NOT NULL)
- `counselor_id` (UUID, references `counselors(id)`)
- `student_name` (TEXT NOT NULL)
- `university_name` (TEXT NOT NULL)
- `course_name` (TEXT NOT NULL)
- `fee_amount` (NUMERIC(12,2) NOT NULL)
- `admission_date` (DATE NOT NULL)
- `status` (TEXT, CHECK: `'verified'`, `'pending_fee'`, `'cancelled'`)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

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
