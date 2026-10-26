# Sachin Behera Daily Workflow

> Private, single-administrator workflow management portal for **Sachin Behera**, Team Leader at College Vidya.

---

## Overview

**Sachin Behera Daily Workflow** is an administrative system designed for:
- Daily task and subtask allocation
- Counselor performance record tracking (counselors are managed as records; no individual counselor login accounts exist)
- Monthly targets and verified revenue tracking
- Admissions pipeline management
- Projection evaluations and operational reporting

This project replaces a legacy implementation with an architectural foundation built on Next.js 14 (App Router), TypeScript (Strict Mode), and Tailwind CSS, prepared for future Supabase authentication and PostgreSQL database integration.

---

## Tech Stack (Phase 1)

- **Framework**: Next.js 14.2.15 (App Router)
- **Language**: TypeScript 5.6.3 (Strict Mode)
- **Styling**: Tailwind CSS 3.4.14
- **Icons**: Lucide React 0.453.0
- **Database / Auth Client**: Supabase JS 2.45.6 & Supabase SSR 0.5.1 (Prepared for Phase 2 integration)
- **Design System Palette**:
  - Dark Navy: `#142536` (`#09121B`, `#0E1A26`, `#142536`, `#1D3248`)
  - Primary Orange: `#FF7A00` (`#E86B00`, `#FFA856`)
  - Light Gray Canvas: `#F3F5F7`
  - Crisp White: `#FFFFFF`

---

## Phase 1 Status & Safeguards

- **Authentication UI Only**: The login page displays full validation, loading, error, and notice states. Supabase backend auth is intentionally not connected in Phase 1, and no mock session/login simulation is permitted.
- **Zero Fabricated Business Data**: The dashboard preview features 6 required metric cards (Team Monthly Target, Team Revenue Achieved, Team Achievement Percentage, Total Admissions, Pending Tasks, Pending Projection Evaluations) all displaying neutral placeholders (`"Not configured"` / `"Data will appear after setup"`).
- **Supplied Hero Image**: The exact reference image (`C:\sachin\photo.png`) has been placed in `public/images/sachin-workflow-hero.png` and is utilized as the visual hero banner across both the login and dashboard pages without distortion or facial cropping.
- **Previous Project & Database Preservation**: The legacy directory `C:\Sachin Daily Work Flow Tracker` and any previous databases have been preserved untouched.

---

## Directory Structure

```
c:\sachin to-do-list/
├── public/
│   └── images/
│       └── sachin-workflow-hero.png    # Supplied reference image (2048x768)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx            # Administrator login page
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx            # Dashboard visual preview & placeholder cards
│   │   │   └── layout.tsx              # Dashboard layout with responsive sidebar
│   │   ├── globals.css                 # Base Tailwind styling & color variables
│   │   ├── layout.tsx                  # Root layout
│   │   └── page.tsx                    # Root redirection to /login
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginForm.tsx           # Form with validation, visibility toggle & states
│   │   ├── dashboard/
│   │   │   ├── Header.tsx              # Dashboard top header
│   │   │   ├── MetricCard.tsx          # Reusable placeholder metric card component
│   │   │   └── Sidebar.tsx             # 8 navigation items with mobile drawer
│   │   └── ui/
│   ├── lib/
│   │   ├── supabase.ts                 # Supabase client setup (reserved for Phase 2)
│   │   └── utils.ts                    # Class name utility (clsx + twMerge)
│   └── types/
│       └── index.ts                    # TypeScript definitions
├── .env.example                        # Environment variables template
├── .gitignore
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node.js v20.18.0)
- npm 9+ (tested on npm 10.8.2)

### 2. Installation
Dependencies are already installed. If needed on a new machine:
```bash
npm install
```

### 3. Environment Variables (Optional in Phase 1)
Copy the example environment template:
```bash
cp .env.example .env.local
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Login Page**: [http://localhost:3000/login](http://localhost:3000/login)
- **Dashboard Preview**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

### 5. Running the Production Build & Verification
```bash
# Type check
npm run typecheck

# Production build
npm run build

# Start production server
npm run start
```
