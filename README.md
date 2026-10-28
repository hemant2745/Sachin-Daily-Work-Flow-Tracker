# Sachin Behera Daily Workflow

> Private, single-administrator workflow management portal for **Sachin Behera**, Team Leader at College Vidya.

---

## Overview

**Sachin Behera Daily Workflow** is a dedicated administrative system engineered for:
- Daily task and subtask allocation (Scheduled for Phase 7)
- Counselor performance record tracking (counselors are managed as records; no individual counselor login accounts exist)
- Monthly targets and verified revenue tracking (Phase 3 & Phase 4)
- Admissions pipeline & actual collections management (Phase 4)
- Projection evaluations and operational reporting (Scheduled for Phase 6 & Phase 8)

This project replaces the legacy implementation with an architectural foundation built on Next.js 14 (App Router), TypeScript (Strict Mode), Tailwind CSS, and isolated Supabase authentication with PostgreSQL Row-Level Security (RLS).

---

## Tech Stack

- **Framework**: Next.js 14.2.15 (App Router)
- **Language**: TypeScript 5.6.3 (Strict Mode)
- **Authentication**: Supabase Auth via `@supabase/ssr` 0.5.1 with Server Actions & Middleware session refresh
- **Database**: Dedicated PostgreSQL (Supabase) with strict Row-Level Security (RLS)
- **Styling**: Tailwind CSS 3.4.14
- **Icons**: Lucide React 0.453.0
- **Design System Palette**:
  - Dark Navy: `#142536` (`#09121B`, `#0E1A26`, `#142536`, `#1D3248`)
  - Primary Orange: `#FF7A00` (`#E86B00`, `#FFA856`)
  - Light Gray Canvas: `#F3F5F7`
  - Crisp White: `#FFFFFF`

---

## Phase 4 Architecture: Admissions Pipeline & Verified Collections

### 1. Database Schema (`public.admissions`)
Migration: `supabase/migrations/20261029000000_create_admissions.sql`

| Field | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Auto-generated UUID (`gen_random_uuid()`) |
| `counselor_id` | UUID (FK) | References `public.counselors(id) ON DELETE RESTRICT` |
| `admission_date` | DATE | Primary reporting date for monthly revenue attribution |
| `university_name` | TEXT | Enrolled university name (non-empty constraint) |
| `program_name` | TEXT | Enrolled degree / program name (non-empty constraint) |
| `amount_collected` | NUMERIC(12, 2) | Actual verified money collected (>= 0 constraint) |
| `payment_mode` | TEXT | Validated: `'semester_fees'`, `'annual_fees'`, `'full_fees'` |
| `notes` | TEXT | Context notes regarding the transaction or student |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Auto-updated via `handle_updated_at()` trigger |

### 2. Business Rules & Revenue Calculation Hierarchy

1. **Reporting Date Rule**:
   - `admission_date` (`YYYY-MM-DD`) is the authoritative date used for attributing collections to monthly reporting periods (`YYYY-MM-01`).
   - Month range is calculated inclusively from the 1st of the month (`YYYY-MM-01`) through the final calendar day (`YYYY-MM-LastDay`).
2. **Counselor Actual Revenue**:
   - Equal to the exact sum of `amount_collected` from eligible admission records attributed to that counselor within the selected month.
   - If a counselor has zero admissions in the selected month, revenue displays as `₹0`.
3. **Applicable Monthly Target (Fallback Hierarchy)**:
   - When a month-specific target exists in `counselor_monthly_targets`, that value overrides the base quota.
   - If no custom monthly target exists, the counselor's baseline quota (`counselors.monthly_target`) is used.
4. **Achievement Percentage Calculation**:
   $$\text{Achievement \%} = \left(\frac{\text{Actual Revenue}}{\text{Applicable Monthly Target}}\right) \times 100$$
   - **Zero Target Handling**: If the applicable target is ₹0, achievement displays as **`"N/A"`** rather than dividing by zero, displaying infinity, or producing runtime errors.
5. **Team Metrics Aggregation**:
   - `Team Monthly Target`: Sum of applicable monthly targets across all active counselors.
   - `Team Actual Revenue`: Sum of actual collections across all active counselors for the selected month.
   - `Team Achievement \%`: `(Team Actual Revenue / Team Monthly Target) * 100`, or `"N/A"` if team target is ₹0.
6. **Counselor Deletion Guard**:
   - Foreign key constraint `counselor_id REFERENCES public.counselors(id) ON DELETE RESTRICT` guarantees that counselors with admissions cannot be accidentally deleted.
   - The deletion server action actively inspects historical dependencies in both `counselor_monthly_targets` and `admissions`. If dependencies exist, permanent deletion is blocked and safe deactivation (`is_active = false`) is enforced to preserve historical reports.

### 3. Security & Row-Level Security (RLS)
- RLS is enabled on `public.admissions`.
- Read and write operations are strictly restricted to authenticated administrators via `public.is_admin()`.
- Server actions enforce `verifyAdminAuth()` before database queries.

---

## Directory Structure

```
c:\sachin to-do-list/
├── public/
│   └── images/
│       └── sachin-workflow-hero.png          # Supplied reference hero banner
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx                  # Administrator login page
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   ├── admissions/
│   │   │   │   │   ├── actions.ts            # Admissions server actions & aggregation
│   │   │   │   │   └── page.tsx              # Admissions & Collections server page
│   │   │   │   ├── counselors/
│   │   │   │   │   ├── actions.ts            # Counselor & target actions with admissions join
│   │   │   │   │   └── page.tsx              # Counselors management page
│   │   │   │   └── page.tsx                  # Dashboard overview with live telemetry metrics
│   │   │   └── layout.tsx                    # Protected dashboard layout with server auth
│   │   ├── auth/
│   │   │   └── actions.ts                    # Server actions (signInAction, signOutAction)
│   │   ├── globals.css                       # Base Tailwind styling & variables
│   │   ├── layout.tsx                        # Root layout
│   │   └── page.tsx                          # Root route redirect
│   ├── components/
│   │   ├── admissions/
│   │   │   ├── AdmissionModal.tsx            # Add/Edit admission modal with INR formatting
│   │   │   └── AdmissionsList.tsx            # Admissions management, filters, and summary
│   │   ├── auth/
│   │   │   └── LoginForm.tsx                 # Supabase Auth form with validation & states
│   │   ├── counselors/
│   │   │   ├── CounselorList.tsx             # Counselor table with live revenue & achievement
│   │   │   ├── CounselorModal.tsx            # Add/Edit counselor details modal
│   │   │   ├── DeleteConfirmModal.tsx        # Safe deletion & deactivation modal
│   │   │   └── TargetModal.tsx               # Month-specific target modal
│   │   └── dashboard/
│   │       ├── Header.tsx                    # Header with sign-out action & admin status
│   │       ├── MetricCard.tsx                # Metric card with live telemetry & neutral states
│   │       └── Sidebar.tsx                   # Sidebar navigation with active Admissions route
│   ├── lib/
│   │   ├── auth/
│   │   │   └── admin.ts                      # Server-side admin authorization & allowlist
│   │   ├── supabase/
│   │   │   ├── client.ts                     # Browser Supabase client
│   │   │   ├── config.ts                     # Configuration detection & validation
│   │   │   ├── middleware.ts                 # SSR cookie session update logic
│   │   │   └── server.ts                     # Server-side Supabase client (cookies)
│   │   ├── format.ts                         # INR currency formatting, dates & validation
│   │   └── utils.ts                          # Class name utility (cn)
│   ├── types/
│   │   ├── admissions.ts                     # Admission data types & payment modes
│   │   ├── counselor.ts                      # Counselor & target data types
│   │   └── index.ts                          # Re-exported TypeScript definitions
│   └── middleware.ts                         # Edge route protection & session refresh
├── supabase/
│   ├── migrations/
│   │   ├── 20261026000000_create_admin_authorization.sql
│   │   ├── 20261028000000_create_counselors_and_targets.sql
│   │   └── 20261029000000_create_admissions.sql
│   ├── README.md                             # Step-by-step setup and migration guide
│   └── SCHEMA_BLUEPRINT.md                   # Future database entities blueprint
├── tests/
│   ├── auth-authorization.test.mjs           # Authentication & admin authorization tests (9 tests)
│   ├── counselor-targets.test.mjs            # Counselor & monthly targets tests (11 tests)
│   └── admissions-revenue.test.mjs           # Admissions pipeline & revenue tests (19 tests)
├── .env.example                              # Environment variables template
├── package.json
└── tsconfig.json
```

---

## Instructions: Applying the Migration in Supabase

1. Open your dedicated Supabase project dashboard (`https://supabase.com/dashboard`).
2. Navigate to the **SQL Editor**.
3. Open or copy the contents of `supabase/migrations/20261029000000_create_admissions.sql`.
4. Click **Run** to execute the additive migration.
5. Verify in **Table Editor** that `public.admissions` is created with RLS enabled and the foreign key references `public.counselors(id)`.

---

## Automated Verification & Test Suite

Run the full 39-test test suite:
```powershell
npm test
```

Run TypeScript strict type checking:
```powershell
npm run typecheck
```

Build production bundle:
```powershell
npm run build
```
