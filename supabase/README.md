# Supabase Setup Guide & Migration Instructions
### Project: Sachin Behera Daily Workflow

This guide details how to configure a brand new, isolated Supabase project for **Sachin Behera Daily Workflow**.

> **CRITICAL**: Do NOT connect to or reuse credentials from any previous application or database.

---

## 1. Create a Dedicated Supabase Project

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project**.
3. Enter the project details:
   - **Name**: `Sachin Behera Daily Workflow`
   - **Database Password**: Choose a strong, secure password (store safely).
   - **Region**: Select your preferred region (e.g. `ap-south-1` Mumbai or nearest).
   - **Pricing Plan**: Free tier is sufficient for this stage.
4. Wait for the project initialization to complete.

---

## 2. Obtain Project Credentials

1. In your new Supabase project dashboard, navigate to **Project Settings** (gear icon) &rarr; **API**.
2. Locate the following values:
   - **Project URL**: (e.g., `https://abcdefghijklm.supabase.co`)
   - **Project API Keys**:
     - `anon` / `public` key: Copy the anon public key.
3. In your local project directory `c:\sachin to-do-list\`, create a file named `.env.local` (do not commit this file):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
   ADMIN_EMAIL=sachin.behera@collegevidya.com
   ```

---

## 3. Apply the Database Migrations

### Migration 1: Phase 2 Admin Authorization
1. In your Supabase dashboard, click on **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Open and copy the contents of:
   [`supabase/migrations/20261026000000_create_admin_authorization.sql`](./migrations/20261026000000_create_admin_authorization.sql)
4. Paste into the SQL Editor and click **Run**.
5. Verify that `public.admin_users` and the `is_admin()` function are created successfully.

### Migration 2: Phase 3 Counselors & Monthly Targets
1. Click **New Query** in the SQL Editor.
2. Open and copy the contents of:
   [`supabase/migrations/20261028000000_create_counselors_and_targets.sql`](./migrations/20261028000000_create_counselors_and_targets.sql)
3. Paste into the SQL Editor and click **Run**.
4. Verify that `public.counselors` and `public.counselor_monthly_targets` are created with RLS enabled.

### Migration 3: Phase 4 Admissions Pipeline & Verified Collections
1. Click **New Query** in the SQL Editor.
2. Open and copy the contents of:
   [`supabase/migrations/20261029000000_create_admissions.sql`](./migrations/20261029000000_create_admissions.sql)
3. Paste into the SQL Editor and click **Run**.
4. Verify that `public.admissions` is created with RLS enabled, `is_admin()` policy attached, and `ON DELETE RESTRICT` constraint referencing `counselors(id)`.

---

## 4. Create the Administrator Account (No Public Sign-Up)

Because public sign-up is disabled for security:

1. In your Supabase dashboard, go to **Authentication** &rarr; **Users**.
2. Click **Invite user** or **Add user** &rarr; **Create user**.
3. Enter:
   - **Email**: `sachin.behera@collegevidya.com` (or your configured `ADMIN_EMAIL`)
   - **Password**: Create a strong initial password
   - **Auto Confirm Email**: Checked (Active)
4. Click **Create User**.
5. The PostgreSQL trigger `on_auth_user_created` will automatically populate the `public.admin_users` record with `role = 'super_admin'`.

---

## 5. Disable Public Sign-ups (Security Hardening)

To ensure no unauthorized accounts can ever register:
1. In the Supabase Dashboard, go to **Authentication** &rarr; **Providers** &rarr; **Email**.
2. Toggle **Enable Sign Up** to **OFF** (disabled).
3. Ensure **Enable Email Provider** remains **ON**.
4. Click **Save**.
