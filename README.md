# Sachin Behera Daily Workflow

> Private, single-administrator workflow management portal for **Sachin Behera**, Team Leader at College Vidya.

---

## Overview

**Sachin Behera Daily Workflow** is a dedicated administrative system engineered for:
- Daily task and subtask allocation
- Counselor performance record tracking (counselors are managed as records; no individual counselor login accounts exist)
- Monthly targets and verified revenue tracking
- Admissions pipeline management
- Projection evaluations and operational reporting

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

## Phase 2 Architecture: Supabase Auth & Database Foundation

### 1. Server-Side Single-Administrator Authorization
- Only Sachin Behera's explicitly configured administrator account can access the portal.
- All authorization decisions are strictly enforced server-side via trusted environment variable allowlists (`ADMIN_EMAIL`) and database policies.
- Client browser code has no ability to elevate privileges.
- Any authenticated session whose email does not match the administrator allowlist is immediately terminated and redirected with `Access Denied`.

### 2. SSR Cookie-Based Session Pattern
- Session cookies are securely read and refreshed on every request using Next.js Middleware (`src/middleware.ts`).
- Server actions (`src/app/auth/actions.ts`) manage sign-in and sign-out cleanly.
- Unauthenticated requests to `/dashboard` are redirected to `/login?redirect=/dashboard&error=unauthenticated`.
- Authenticated administrator requests to `/login` are automatically redirected to `/dashboard`.

### 3. Isolated Dedicated Supabase Project
- Complete isolation from legacy databases.
- Initial migration created in `supabase/migrations/20261026000000_create_admin_authorization.sql`.
- Complete blueprint for future entities documented in `supabase/SCHEMA_BLUEPRINT.md`.

---

## Directory Structure

```
c:\sachin to-do-list/
├── public/
│   └── images/
│       └── sachin-workflow-hero.png          # Supplied reference image (2048x768)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx                  # Administrator login page
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx                  # Dashboard preview & placeholder cards
│   │   │   └── layout.tsx                    # Protected dashboard layout with server auth
│   │   ├── auth/
│   │   │   └── actions.ts                    # Server actions (signInAction, signOutAction)
│   │   ├── globals.css                       # Base Tailwind styling & variables
│   │   ├── layout.tsx                        # Root layout
│   │   └── page.tsx                          # Root route redirect
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginForm.tsx                 # Supabase Auth form with validation & states
│   │   └── dashboard/
│   │       ├── Header.tsx                    # Header with sign-out action & admin status
│   │       ├── MetricCard.tsx                # Reusable placeholder metric card component
│   │       └── Sidebar.tsx                   # 8 navigation items with sign-out
│   ├── lib/
│   │   ├── auth/
│   │   │   └── admin.ts                      # Server-side admin authorization & allowlist
│   │   ├── supabase/
│   │   │   ├── client.ts                     # Browser Supabase client
│   │   │   ├── config.ts                     # Configuration detection & validation
│   │   │   ├── middleware.ts                 # SSR cookie session update logic
│   │   │   └── server.ts                     # Server-side Supabase client (cookies)
│   │   └── utils.ts                          # Class name utility (cn)
│   ├── types/
│   │   └── index.ts                          # TypeScript definitions
│   └── middleware.ts                         # Edge route protection & session refresh
├── supabase/
│   ├── migrations/
│   │   └── 20261026000000_create_admin_authorization.sql
│   ├── README.md                             # Step-by-step setup guide
│   └── SCHEMA_BLUEPRINT.md                   # Future database entities blueprint
├── tests/
│   └── auth-authorization.test.mjs           # Automated test suite (9 test cases)
├── .env.example                              # Environment variables template
├── .gitignore
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Getting Started

### 1. Configuration
Create `.env.local` using `.env.example` as a template:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-dedicated-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dedicated-project-anon-key
ADMIN_EMAIL=sachin.behera@collegevidya.com
```

### 2. Running Automated Tests
```powershell
npm test
```

### 3. Type Checking & Production Build
```powershell
npm run typecheck
npm run build
npm run start
```
