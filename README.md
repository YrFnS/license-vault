<div align="center">

# 🏗️ License Vault

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescript-lang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![NextAuth](https://img.shields.io/badge/NextAuth-4-000000?style=for-the-badge)](https://next-auth.js.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](LICENSE)

**Contractor license compliance management platform.** Track licenses, permits, insurance, and certifications across your entire organization. Get alerts before they expire.

[Demo](http://localhost:3000) · [API Docs](http://localhost:3000/en/settings/api) · [Report Bug](mailto:support@licensevault.com)

</div>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Internationalization](#internationalization)
- [Authentication](#authentication)

---

## Features

| Category | Features |
|----------|----------|
| **License Management** | Full CRUD, renewal tracking, auto-renewal, expiration alerts, document attachments, state requirements |
| **Insurance Tracking** | COI management, policy tracking, coverage limits, compliance verification, deficiency alerts |
| **Compliance Dashboard** | Overview charts, risk scores, multi-state compliance, CE tracking, project compliance scoring |
| **Subcontractor Portal** | External upload portal, document requests, compliance scoring, vendor risk assessment |
| **Project Management** | License/permit tracking per project, required insurance, compliance requirements by state |
| **Qualifiers** | Individual qualifier tracking, license linking, CE hours monitoring |
| **Approvals** | Configurable approval workflows, license renewal approvals, document review |
| **Regulatory Alerts** | State board updates, regulatory change tracking, watch lists |
| **Reports** | Compliance reports, PDF export, scheduled reports, custom analytics |
| **Integrations** | API keys, webhooks, REST API v1, third-party sync (Procore, QuickBooks, Sage) |
| **Team Management** | Role-based access, invitation system, audit logging |
| **i18n** | English (en) and Arabic (ar) with RTL support |
| **PWA** | Offline indicator, push notifications, service worker |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5.9
- **UI:** React 19, Tailwind CSS 4, shadcn/ui (Radix UI)
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma 6
- **Auth:** NextAuth 4 (Credentials Provider)
- **State Management:** Zustand, React Query
- **i18n:** next-intl
- **Charts:** Recharts
- **PDF:** jsPDF
- **Animation:** Framer Motion
- **Forms:** React Hook Form + Zod
- **Runtime:** Bun

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) 1.3+
- PostgreSQL database (Neon recommended)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd license-vault

# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Edit .env with your database URL and secrets
```

### Environment Setup

```bash
# Generate a secret for NextAuth
openssl rand -base64 32
# Copy the output to NEXTAUTH_SECRET in .env
```

### Database Setup

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push

# Seed with demo data
npx prisma db seed
```

### Run Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Login

```
Email: demo@licensevault.com
Password: DemoPass123!
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | JWT signing secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | ✅ | App URL (e.g., `http://localhost:3000`) |
| `APP_URL` | | Used in emails and callbacks |
| `NEXT_PUBLIC_APP_URL` | | Public-facing app URL |
| `SMTP_HOST` | | SMTP server for email delivery |
| `SMTP_PORT` | | SMTP port (default: 587) |
| `SMTP_USER` | | SMTP username |
| `SMTP_PASS` | | SMTP password |
| `SMTP_FROM` | | Sender name and email |
| `OPENROUTER_API_KEY` | | AI chat assistant API key |
| `CRON_SECRET` | | Secret for cron job authentication |

See `.env.example` for the full template.

---

## Database

### Schema

The database includes **35+ models** covering:

- **Core:** `User`, `Organization`, `OrgMember`
- **Licenses:** `License`, `LicenseDocument`, `LicenseApplication`, `CETracking`, `StateRequirement`
- **Insurance:** `InsuranceBond`
- **People:** `Qualifier`, `Subcontractor`
- **Projects:** `Project`, `ProjectLicense`, `ProjectSubcontractor`
- **Workflow:** `ApprovalWorkflow`, `WorkflowDefinition`, `WorkflowInstance`
- **Compliance:** `ComplianceShare`, `AuditLog`, `AlertPreference`, `Notification`
- **Documents:** `DocumentScan`, `GeneratedDocument`, `SignatureRequest`
- **Vendor:** `VendorScore`, `ContractorDirectory`
- **Settings:** `AutomationSetting`, `ScheduledReport`, `ApiKey`, `Webhook`
- **Admin:** `PasswordResetToken`, `AuditLog`

### Commands

```bash
bun run db:generate    # Regenerate Prisma client
bun run db:push        # Push schema changes (dev)
bun run db:migrate     # Create migration (production)
bun run db:reset       # Reset database (⚠️ destructive)
npx prisma db seed     # Run seed script
npx prisma studio      # Open Prisma Studio GUI
```

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `bun run dev` | Start development server on port 3000 |
| `build` | `bun run build` | Production build with standalone output |
| `start` | `bun run start` | Start production server |
| `lint` | `bun run lint` | Run ESLint |
| `db:push` | `bun run db:push` | Push schema to database |
| `seed:demo` | `bun run seed:demo` | Seed demo data (requires existing user) |

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/                  # i18n route group (en, ar)
│   │   ├── (auth)/                # Login, signup, forgot/reset password
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── (dashboard)/           # Authenticated dashboard layout
│   │   │   ├── dashboard/page.tsx # Main dashboard
│   │   │   ├── licenses/          # License management
│   │   │   ├── insurance/         # Insurance tracking
│   │   │   ├── projects/          # Project management
│   │   │   ├── compliance/        # Compliance overview
│   │   │   ├── subcontractors/    # Subcontractor management
│   │   │   ├── team/              # Team management
│   │   │   ├── settings/          # Organization settings
│   │   │   ├── admin/             # Admin panel
│   │   │   └── ...
│   │   ├── (public)/             # Public routes (subcontractor upload)
│   │   └── compliance/[token]/   # Public compliance page
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth API route
│   │   ├── licenses/             # License REST endpoints
│   │   ├── projects/             # Project REST endpoints
│   │   ├── cron/                 # Cron job routes
│   │   └── ...
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles + Tailwind
├── components/
│   ├── ui/                       # shadcn/ui components (60+ files)
│   ├── layout/                   # Sidebar, TopNav, Search, Notifications
│   ├── dashboard/                # Dashboard widgets
│   ├── licenses/                 # License-specific components
│   └── ...
├── hooks/                        # Custom React hooks
├── i18n/                         # Internationalization config
│   ├── routing.ts
│   └── request.ts
├── lib/                          # Server-side utilities
│   ├── auth.ts                   # NextAuth config
│   ├── db.ts                     # Prisma client singleton
│   ├── utils.ts                  # Utility functions (cn)
│   └── ...
├── messages/                     # i18n translation files
│   ├── en/                       # English (45+ namespaces)
│   └── ar/                       # Arabic (45+ namespaces)
├── scripts/
│   ├── seed-demo.ts              # Demo data seeder
│   └── seed-state-requirements.ts
└── middleware.ts                 # Intl middleware + rate limiting
```

---

## Architecture

### Authentication

License Vault uses **NextAuth 4** with the **Credentials Provider**:

- Email + password authentication
- Account lockout after 5 failed attempts (15-minute cooldown)
- JWT-based sessions
- Role stored in JWT token (`admin`, `member`)
- Protected routes redirect to `/login`
- Session status drives dashboard layout hydration

### API

- RESTful API under `/api/`
- Rate limiting in middleware (auth: 10/15min, public API: 60/min, general: 120/min)
- CSRF protection via Origin/Referer header validation
- API key support under `/api/v1/` (Bearer token)
- Security headers (HSTS, CSP, X-Frame-Options, etc.)

### Database

- PostgreSQL on **Neon** (serverless)
- Prisma ORM with 35+ models
- Cascade deletes configured on all relations
- Indexes on frequently queried fields (`orgId`, `expirationDate`, `status`)

### Deployment

The app builds as a standalone Next.js output:

```bash
bun run build
# Output: .next/standalone/
```

---

## Internationalization

Supported locales: **English (en)** and **Arabic (ar)**

- Route-based locale prefix: `/en/dashboard`, `/ar/dashboard`
- RTL layout for Arabic (automatic via `dir` attribute)
- 45+ translation namespaces per locale
- Language switcher in the header

---

## License

Proprietary. All rights reserved.

---

<div align="center">

Built with ❤️ for the construction industry.

</div>
