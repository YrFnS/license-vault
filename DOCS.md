# License Vault — Application Documentation

> **Contractor License Compliance Management Platform**
> Track, manage, and automate contractor licenses, insurance, CE credits, and compliance across your entire organization.

---

## Table of Contents

1. [What Is License Vault?](#1-what-is-license-vault)
2. [Problem It Solves](#2-problem-it-solves)
3. [Key Features](#3-key-features)
4. [Architecture Overview](#4-architecture-overview)
5. [Technology Stack](#5-technology-stack)
6. [Getting Started](#6-getting-started)
7. [Application Structure](#7-application-structure)
8. [Feature Deep-Dives](#8-feature-deep-dives)
9. [API Reference](#9-api-reference)
10. [Security Model](#10-security-model)
11. [Internationalization (i18n)](#11-internationalization-i18n)
12. [Environment Variables](#12-environment-variables)
13. [Database Schema](#13-database-schema)

---

## 1. What Is License Vault?

License Vault is a **SaaS compliance management platform** built for construction companies, contractors, and organizations that need to manage multiple contractor licenses, insurance certificates, bonds, continuing education credits, and regulatory requirements across multiple US states.

It provides a centralized dashboard to track every license, insurance policy, and bond across your organization, with automated expiration alerts, renewal workflows, AI-powered compliance advice, and a public API for integrations.

### Who Is It For?

| Role | Use Case |
|------|----------|
| **Compliance Officers** | Track all licenses/insurance across the org, ensure no gaps |
| **Operations Managers** | Manage subcontractor compliance for projects |
| **Business Owners** | Get alerts before licenses expire, avoid penalties |
| **Qualifiers** | Track CE hours, exam scores, and credential status |
| **Subcontractors** | Upload compliance documents through a self-service portal |
| **Developers** | Integrate via REST API v1, webhooks, and third-party connectors |

---

## 2. Problem It Solves

### Without License Vault
- 📋 Spreadsheets and paper tracking for licenses across 50 states
- ⚠️ Missed renewal deadlines → fines, suspended licenses, project delays
- 🔍 No visibility into subcontractor compliance before starting projects
- 📧 Manual email reminders that get ignored
- 📎 Scattered insurance certificates and bonds in email inboxes
- 🏗️ No centralized view of multi-state compliance requirements
- 🤝 No standardized process for collecting subcontractor documents
- 📊 No analytics on compliance trends or risk exposure

### With License Vault
- ✅ **Single dashboard** for all licenses, insurance, bonds, CE, and qualifications
- ✅ **Automated alerts** at 60, 30, and 5 days before expiration (email + in-app)
- ✅ **Subcontractor portal** for self-service document upload
- ✅ **AI compliance advisor** that answers questions about state-specific requirements
- ✅ **50-state requirement database** with renewal periods, CE hours, fees, and board contacts
- ✅ **Multi-state compliance** view with forecasting and trend analysis
- ✅ **Vendor scoring** with 6-category risk assessment (license, insurance, documents, compliance, experience, responsiveness)
- ✅ **Board submission automation** with pre-built templates for common states
- ✅ **E-signatures** for compliance documents with full audit trail
- ✅ **Public REST API** with Bearer token auth for custom integrations
- ✅ **Webhooks** with HMAC-SHA256 signing for real-time event notifications
- ✅ **Third-party integrations** (Procore, QuickBooks, Sage, ADP, and more)

---

## 3. Key Features

### License & Permit Management
- Track unlimited licenses across all 50 US states
- License types: General Contractor, Electrical, Plumbing, HVAC, Specialty
- Expiration tracking with automated 60/30/5-day alerts
- Renewal workflow with history logging
- License document upload and management
- License compliance reporting with PDF export
- Bulk import via CSV
- License application wizard (draft → submitted → approved/denied)

### Insurance & Bond Tracking
- Track insurance policies, bonds, and COIs
- Coverage amount, per-occurrence limit, aggregate limit
- Endorsement type tracking (additional insured, waiver of subrogation, etc.)
- Insurance deficiency detection and flagging
- Insurance verification workflow
- Expiration alerts matching license alert schedule

### Continuing Education (CE) Tracking
- Per-license CE hour tracking (earned vs. required)
- Course completion logging with certificate upload
- Category tracking (mandatory, elective, etc.)
- CE compliance dashboard widgets

### Exam Tracking (NASCLA)
- Track NASCLA and state-specific exams
- Exam types: General, Electrical, Plumbing, HVAC, State-Specific, Trade
- Score tracking vs. passing score
- Exam statistics dashboard

### Business Entity Compliance
- Entity types: LLC, Corporation, Sole Proprietor, Partnership, LLP
- Annual report and franchise tax tracking
- Entity-to-license linking (holder, qualifier, additional)
- Parent-child entity hierarchy
- Entity compliance score calculation

### Qualifier Management
- Track qualifiers and their credentials
- Qualifier-to-license linking
- CE hour tracking per qualifier
- Status management (active, inactive, pending)

### Project Compliance
- Create projects with required license/insurance types
- Assign licenses and verify compliance per project
- Subcontractor compliance tracking per project
- Project compliance score calculation

### Subcontractor Portal
- Self-service document upload portal (token-based access)
- Document review workflow
- Compliance status tracking
- Automated document request emails

### Multi-State Compliance
- Dashboard showing compliance across all states
- State requirement comparison tool
- Compliance forecasting with trend analysis
- Reciprocity mapping between states

### Workflow & Approvals
- Custom workflow builder with manual/automatic/scheduled/event triggers
- Step-based workflow execution with variables
- Approval routing with priority levels
- Workflow instance history

### Automation Engine
- Configurable check frequency per organization
- Automated expiration checking (cron-based)
- Escalation rules (days until escalation)
- Automation run history with results
- Email + in-app notification generation

### AI Compliance Advisor
- Chat-based AI assistant (powered by OpenRouter)
- Context-aware responses using your compliance data
- Proactive compliance alerts and recommendations
- State-specific licensing guidance

### Contractor Network
- Pre-populated contractor directory
- Verification workflow
- Compliance scoring
- Specialty and certification tracking
- Service area management
- Preferred/blacklist flags

### Vendor Scoring
- 6-category risk assessment (license, insurance, document, compliance, experience, responsiveness)
- Overall risk level (low/medium/high/critical)
- Bulk assessment capability
- Risk matrix visualization
- Flag system for high-risk vendors

### Board Submissions
- Pre-built templates for common states (CA, TX, FL, etc.)
- Submission type: New License, Renewal, Reciprocity, Name Change, Reinstatement
- Checklist tracking per submission
- Filing fee tracking
- Full audit trail

### E-Signatures
- Document signing requests with token-based access
- Signing status tracking (pending, signed, declined, expired)
- Full audit trail with timestamps and IP
- Cancel/expire workflow

### Integrations Hub
- Supported: Procore, QuickBooks, Sage, ADP, Salesforce, HubSpot, Buildertrend, CoConstruct
- Integration categories: Accounting, Project Management, HR/Payroll, CRM, Construction
- Per-integration configuration (API key, base URL)
- Sync logging with record counts
- Test connection endpoint

### Reporting & Analytics
- Compliance overview dashboard with trend charts
- Team activity analytics
- Compliance trend analysis (30/60/90 day)
- Cost calculator for renewal budgets
- Portfolio view
- PDF report generation (jsPDF)
- Scheduled email reports (weekly/monthly/quarterly)
- Organization compliance report

### Public REST API (v1)
- Bearer token authentication
- API key management with permissions (read/write/admin)
- Endpoints: Licenses, Projects, Compliance
- Rate limited: 60 req/min
- API documentation page with live try-it

### Webhooks
- Event-driven notifications with HMAC-SHA256 signing
- Configurable events per webhook
- Delivery retry with failure tracking
- Webhook secret management

### White-Label Branding
- Custom logo, favicon, colors, fonts
- Custom email templates
- Custom portal subdomain
- Custom footer text

### Multi-Tenant Organization Hierarchy
- Parent-child organization relationships
- Cross-organization compliance view
- Per-organization branding and settings
- Subsidiary management

### Security & Compliance
- NextAuth.js with credentials provider
- Account lockout (5 failed attempts → 15-min lock)
- Rate limiting (3 tiers: auth, API, general)
- CSRF protection (origin-based validation)
- Input sanitization (DOMPurify)
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Full audit logging
- Bcrypt password hashing (12 salt rounds)
- Password complexity requirements (8+ chars, uppercase, lowercase, number)

### PWA & Mobile
- Service worker with offline support
- Push notification prompt
- Offline indicator
- Installable as native app
- Responsive design for all screen sizes

### Internationalization
- English (LTR) and Arabic (RTL) fully supported
- 1,100+ translation keys per language
- Modular language file structure (58 namespace JSON files per language)
- Dynamic RTL layout switching

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Caddy Gateway                         │
│                    (Port 81 → Port 3000)                     │
│              XTransformPort for mini-services                │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Next.js 16 App Router                      │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐  │
│  │  Landing  │  │   Auth   │  │ Dashboard  │  │  Public   │  │
│  │   Page    │  │  Pages   │  │   Pages    │  │  Pages    │  │
│  │ /[locale] │  │(login/   │  │ (40+ pages)│  │(sign/     │  │
│  │           │  │ signup/  │  │            │  │ compliance)│  │
│  │           │  │ forgot/  │  │            │  │           │  │
│  │           │  │ reset)   │  │            │  │           │  │
│  └──────────┘  └──────────┘  └───────────┘  └───────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    Middleware                           │  │
│  │  i18n routing │ Rate limiting │ CSRF │ Security headers│  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    API Routes (160+)                    │  │
│  │  /api/licenses  /api/insurance  /api/team              │  │
│  │  /api/compliance  /api/projects  /api/reports          │  │
│  │  /api/ai/chat  /api/webhooks  /api/v1/*               │  │
│  │  /api/cron/*  /api/signatures  /api/integrations      │  │
│  │  ... and 100+ more                                     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Prisma ORM  │  │  NextAuth.js  │  │   z-ai-sdk (AI)  │  │
│  │   (SQLite)    │  │   (JWT auth)  │  │   (OpenRouter)   │  │
│  └──────┬───────┘  └──────────────┘  └──────────────────┘  │
│         │                                                    │
└─────────┼────────────────────────────────────────────────────┘
          │
    ┌─────▼──────┐
    │  SQLite DB  │
    │ (custom.db) │
    └─────────────┘
```

### Request Flow

1. **Incoming request** → Caddy gateway (port 81) → Next.js (port 3000)
2. **Middleware** processes: i18n locale detection → rate limit check → CSRF validation → security headers
3. **App Router** matches the route to a page or API handler
4. **Dashboard pages** check authentication (redirect to `/login` if unauthenticated)
5. **API routes** use NextAuth session or Bearer token for auth
6. **Prisma ORM** handles all database operations
7. **AI features** use z-ai-web-dev-sdk → OpenRouter API

---

## 5. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 16 |
| **Language** | TypeScript | 5 |
| **ORM** | Prisma | 6.11 |
| **Database** | SQLite | - |
| **Authentication** | NextAuth.js | v4 |
| **Styling** | Tailwind CSS + shadcn/ui | 4 / New York |
| **Icons** | Lucide React | - |
| **Animations** | Framer Motion | - |
| **State (Client)** | Zustand | - |
| **State (Server)** | TanStack Query | 5 |
| **Data Viz** | Recharts | 2 |
| **i18n** | next-intl | 4.12 |
| **PDF Generation** | jsPDF | 4 |
| **Email** | Nodemailer | 8 |
| **AI** | z-ai-web-dev-sdk | 0.0.18 |
| **Forms** | React Hook Form + Zod | 7 / 4 |
| **Tables** | TanStack React Table | 8 |
| **Theme** | next-themes (dark/light) | - |
| **PWA** | Service Worker + manifest.json | - |
| **Security** | bcryptjs, DOMPurify | - |
| **Gateway** | Caddy | - |
| **Runtime** | Bun | - |

---

## 6. Getting Started

### Prerequisites
- **Bun** runtime installed
- **Node.js** 18+ (for some tooling)

### Installation

```bash
# Install dependencies
bun install

# Set up environment variables (see Environment Variables section)
cp .env.example .env
# Edit .env with your values

# Push database schema
bun run db:push

# Generate Prisma client
bun run db:generate

# (Optional) Seed demo data
bun run seed:demo

# Start development server
bun run dev
```

### Default Login
- **Email**: `admin@licensevault.com`
- **Password**: `Admin1234!`

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `bun run dev` | Start dev server on port 3000 |
| `build` | `bun run build` | Production build (standalone) |
| `start` | `bun run start` | Start production server |
| `lint` | `bun run lint` | Run ESLint |
| `db:push` | `bun run db:push` | Push schema to database |
| `db:generate` | `bun run db:generate` | Generate Prisma client |
| `db:migrate` | `bun run db:migrate` | Run migrations |
| `db:reset` | `bun run db:reset` | Reset database |
| `seed:demo` | `bun run seed:demo` | Seed demo data |

---

## 7. Application Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── [locale]/                 # i18n dynamic segment (en/ar)
│   │   ├── (auth)/               # Auth route group (no sidebar)
│   │   │   ├── login/            # Login page
│   │   │   ├── signup/           # Signup page
│   │   │   ├── forgot-password/  # Forgot password
│   │   │   └── reset-password/   # Reset password
│   │   ├── (dashboard)/          # Dashboard route group (sidebar + topnav)
│   │   │   ├── dashboard/        # Main dashboard
│   │   │   ├── licenses/         # License management
│   │   │   ├── insurance/        # Insurance & bonds
│   │   │   ├── projects/         # Project compliance
│   │   │   ├── team/             # Team management
│   │   │   ├── subcontractors/   # Subcontractor management
│   │   │   ├── compliance/       # Compliance overview
│   │   │   ├── analytics/        # Analytics & reports
│   │   │   ├── reports/          # Report generation
│   │   │   ├── ai-chat/          # AI compliance advisor
│   │   │   ├── workflows/        # Workflow builder
│   │   │   ├── approvals/        # Approval routing
│   │   │   ├── signatures/       # E-signatures
│   │   │   ├── board-submissions/# Board submissions
│   │   │   ├── vendor-scores/    # Vendor scoring
│   │   │   ├── contractor-network/ # Contractor directory
│   │   │   ├── integrations/     # Integration hub
│   │   │   ├── qualifications/   # Qualifier tracking
│   │   │   ├── business-entities/ # Business entities
│   │   │   ├── ce-tracking/      # CE tracking
│   │   │   ├── exams/            # Exam tracking
│   │   │   ├── checklists/       # Checklist management
│   │   │   ├── state-requirements/ # State requirements
│   │   │   ├── regulatory-alerts/ # Regulatory monitoring
│   │   │   ├── import/           # CSV import
│   │   │   ├── audit-log/        # Audit log viewer
│   │   │   ├── onboarding/       # Onboarding wizard
│   │   │   ├── notifications/    # Notification center
│   │   │   ├── alerts/           # Alert preferences
│   │   │   ├── admin/            # Admin panel
│   │   │   │   ├── security/     # Security dashboard
│   │   │   │   └── automation/   # Automation settings
│   │   │   ├── settings/         # Settings
│   │   │   │   ├── profile/      # Profile settings
│   │   │   │   ├── organization/ # Org settings
│   │   │   │   ├── branding/     # White-label branding
│   │   │   │   ├── locations/    # Location management
│   │   │   │   ├── api/          # API keys & webhooks
│   │   │   │   └── email-logs/   # Email delivery logs
│   │   │   ├── developer-settings/
│   │   │   │   └── api-docs/     # API documentation
│   │   │   └── documents/
│   │   │       ├── generate/     # AI document generation
│   │   │       └── scan/         # AI document scanning
│   │   ├── (public)/             # Public pages
│   │   │   └── subcontractor-upload/ # Sub portal
│   │   ├── sign/[token]/         # E-signature signing page
│   │   ├── compliance/[token]/   # Public compliance share
│   │   └── page.tsx              # Landing page
│   ├── api/                      # API routes (160+)
│   │   ├── licenses/             # License CRUD + export + renew
│   │   ├── insurance/            # Insurance CRUD + verify
│   │   ├── compliance/           # Compliance + forecast
│   │   ├── dashboard/            # Dashboard data
│   │   ├── team/                 # Team management
│   │   ├── projects/             # Project compliance
│   │   ├── subcontractors/       # Subcontractor management
│   │   ├── ai/                   # AI chat + proactive alerts
│   │   ├── auth/                 # NextAuth + password reset
│   │   ├── webhooks/             # Webhook CRUD
│   │   ├── api-keys/             # API key management
│   │   ├── integrations/         # Third-party integrations
│   │   ├── signatures/           # E-signature management
│   │   ├── reports/              # Reports + PDF + schedule
│   │   ├── workflows/            # Workflow engine
│   │   ├── approvals/            # Approval routing
│   │   ├── automation/           # Automation engine
│   │   ├── board-submissions/    # Board submissions
│   │   ├── contractor-directory/ # Contractor network
│   │   ├── vendor-scores/        # Vendor scoring
│   │   ├── regulatory-alerts/    # Regulatory monitoring
│   │   ├── ce-tracking/          # CE tracking
│   │   ├── exams/                # Exam tracking
│   │   ├── qualifiers/           # Qualifier management
│   │   ├── business-entities/    # Business entities
│   │   ├── checklists/           # Checklist engine
│   │   ├── notifications/        # Notifications
│   │   ├── alerts/               # Alert preferences
│   │   ├── email/                # Email sending
│   │   ├── email-logs/           # Email logs
│   │   ├── search/               # Global search
│   │   ├── audit-log/            # Audit log
│   │   ├── org/                  # Organization management
│   │   ├── profile/              # User profile
│   │   ├── settings/             # App settings
│   │   ├── admin/                # Admin functions
│   │   ├── files/                # File serving
│   │   ├── cron/                 # Cron jobs
│   │   ├── v1/                   # Public REST API v1
│   │   └── ...                   # And more
│   ├── layout.tsx                # Root layout (metadata only)
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui primitives (30+)
│   ├── layout/                   # Sidebar, TopNav, NotificationDrawer, etc.
│   ├── dashboard/                # Dashboard widgets
│   ├── licenses/                 # License components
│   ├── compliance/               # Compliance components
│   ├── projects/                 # Project components
│   ├── insurance/                # Insurance components
│   ├── qualifiers/               # Qualifier components
│   ├── subcontractors/           # Subcontractor components
│   ├── applications/             # Application wizard
│   ├── workflows/                # Workflow builder
│   ├── checklists/               # Checklist editor
│   ├── documents/                # Document scanner
│   ├── pwa/                      # PWA components
│   ├── common/                   # Shared components
│   └── Providers.tsx             # Global providers
│
├── lib/                          # Business logic & utilities
│   ├── auth.ts                   # NextAuth configuration
│   ├── auth-utils.ts             # Auth helper functions
│   ├── api-auth.ts               # API key authentication
│   ├── db.ts                     # Prisma client singleton
│   ├── rate-limit.ts             # Rate limiting
│   ├── csrf.ts                   # CSRF protection
│   ├── sanitize.ts               # Input sanitization
│   ├── email.ts                  # Email service (Nodemailer)
│   ├── email-templates.ts        # Email template builder
│   ├── email/                    # Modular email templates
│   ├── pdf-report.ts             # PDF report generation
│   ├── automation.ts             # Automation engine
│   ├── webhook-delivery.ts       # Webhook dispatch
│   ├── ai-context.ts             # AI context builder
│   ├── ai-proactive-alerts.ts    # AI alert generation
│   ├── regulatory-monitor.ts     # Regulatory change monitor
│   ├── insurance-compliance.ts   # Insurance compliance checks
│   ├── document-scanner.ts       # Document scanning logic
│   ├── document-generator.ts     # Document generation logic
│   ├── backup.ts                 # Database backup
│   └── utils.ts                  # General utilities
│
├── hooks/                        # Custom React hooks
│   ├── use-mobile.ts             # Mobile detection
│   ├── use-page-title.ts         # Page title management
│   ├── use-keyboard-shortcuts.ts # Keyboard shortcuts
│   ├── useRole.ts                # Role-based access
│   └── use-toast.ts              # Toast notifications
│
├── messages/                     # i18n language files
│   ├── en/                       # English (58 namespace files)
│   │   ├── index.ts              # Aggregator
│   │   ├── common.json           # Shared strings
│   │   ├── auth.json             # Auth pages
│   │   ├── dashboard.json        # Dashboard
│   │   ├── licenses.json         # Licenses
│   │   └── ...                   # 54 more namespace files
│   ├── ar/                       # Arabic (58 namespace files)
│   │   └── ...                   # Mirror of en/
│   ├── en.json                   # Legacy English (deprecated)
│   └── ar.json                   # Legacy Arabic (deprecated)
│
├── i18n/                         # i18n configuration
│   ├── routing.ts                # Locale routing config
│   ├── request.ts                # Request-level i18n
│   └── navigation.ts            # i18n-aware navigation
│
├── scripts/                      # Database seed scripts
│   ├── seed-demo.ts              # Demo data seeder
│   ├── seed-notifications.ts     # Notification seeder
│   ├── seed-checklists.ts        # Checklist seeder
│   └── seed-state-requirements.ts # 50-state requirements seeder
│
├── middleware.ts                  # Next.js middleware (rate limit, CSRF, i18n, security)
└── app/globals.css               # Tailwind CSS + custom styles
```

---

## 8. Feature Deep-Dives

### 8.1 Dashboard

The main dashboard (`/dashboard`) provides a real-time compliance overview:

- **Summary Cards**: Total licenses, active, expiring, expired, compliance score
- **Expiration Chart**: Donut chart showing license status breakdown
- **Monthly Trends**: Bar chart of expirations by month
- **Multi-State Compliance**: Compliance status across all states
- **Compliance Forecast**: Predictive compliance trends
- **Risk Score Gauge**: Visual risk assessment
- **Activity Timeline**: Recent compliance events
- **Proactive Alerts**: AI-generated compliance recommendations
- **Notification Summary**: Unread notification count and recent items

### 8.2 License Lifecycle

```
Create → Active → Expiring (60/30/5 day alerts) → Expired → Renewed
   │                                                    │
   └── Application (draft → submitted → approved/denied) ┘
```

### 8.3 Automation Engine

The automation engine runs on a cron schedule and performs:

1. **Full compliance check** per organization
2. **License expiration scanning** (60/30/5-day thresholds)
3. **Insurance/bond expiration scanning**
4. **Email alert dispatch** (based on user alert preferences)
5. **In-app notification creation** (with deduplication)
6. **Escalation rules** (if unresolved for N days)

Triggered via: `POST /api/cron/check-expirations?secret=CRON_SECRET`

### 8.4 AI Compliance Advisor

The AI chat (`/ai-chat`) uses:

1. **Context builder** (`lib/ai-context.ts`): Gathers user's licenses, compliance data, and state requirements
2. **OpenRouter API**: Sends context + user message to LLM
3. **Response**: State-specific compliance advice with references to the user's actual data
4. **Fallback**: If AI_API_KEY is not configured, returns a helpful static message

### 8.5 Public REST API (v1)

Base URL: `/api/v1/`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/licenses` | GET | List licenses |
| `/licenses` | POST | Create license |
| `/licenses/[id]` | GET | Get license |
| `/licenses/[id]` | PUT | Update license |
| `/licenses/[id]` | DELETE | Delete license |
| `/projects` | GET | List projects |
| `/projects` | POST | Create project |
| `/compliance` | GET | Get compliance data |

Authentication: `Authorization: Bearer lv_live_<your_api_key>`

### 8.6 Webhook System

Webhooks are signed using HMAC-SHA256:

```typescript
const signature = crypto
  .createHmac('sha256', webhook.secret)
  .update(JSON.stringify(payload))
  .digest('hex');
// Header: X-Webhook-Signature: sha256=<signature>
```

Events: `license.expired`, `license.expiring`, `insurance.expired`, `compliance.changed`, etc.

---

## 9. API Reference

### Authentication

All dashboard API routes use **NextAuth session cookies**. The public API v1 uses **Bearer token** authentication.

#### Session Auth (Dashboard)
```typescript
// Automatically handled by NextAuth middleware
// Session is available in API routes via:
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
const session = await getServerSession(authOptions);
```

#### API Key Auth (v1)
```typescript
// Pass via Authorization header
fetch('/api/v1/licenses', {
  headers: { 'Authorization': 'Bearer lv_live_your_api_key_here' }
});
```

### Common API Patterns

All API routes follow these conventions:

- **GET** → List/retrieve resources (with pagination, filtering, sorting)
- **POST** → Create resources or trigger actions
- **PUT** → Update resources (full or partial)
- **DELETE** → Delete resources
- **Responses**: JSON with consistent structure
- **Errors**: `{ error: string }` with appropriate HTTP status codes
- **Validation**: Zod schemas on all mutation endpoints

### Key API Endpoints

| Category | Endpoints | Auth |
|----------|-----------|------|
| Licenses | `/api/licenses`, `/api/licenses/[id]`, `/api/licenses/[id]/renew`, `/api/licenses/[id]/documents`, `/api/licenses/[id]/report`, `/api/licenses/export`, `/api/licenses/check-expirations` | Session |
| Insurance | `/api/insurance`, `/api/insurance/[id]`, `/api/insurance/verify`, `/api/insurance/deficiencies` | Session |
| Compliance | `/api/compliance`, `/api/compliance/forecast`, `/api/compliance/multi-state`, `/api/compliance/[token]` | Session/Public |
| Dashboard | `/api/dashboard`, `/api/dashboard/forecast`, `/api/dashboard/multi-state`, `/api/dashboard/state-detail` | Session |
| Team | `/api/team`, `/api/team/[id]`, `/api/team/[id]/invite`, `/api/team/[id]/role`, `/api/team/[id]/resend` | Session |
| Projects | `/api/projects`, `/api/projects/[id]`, `/api/projects/[id]/licenses`, `/api/projects/[id]/compliance`, `/api/projects/[id]/subcontractors` | Session |
| AI | `/api/ai/chat`, `/api/ai/proactive-alerts` | Session |
| Reports | `/api/reports`, `/api/reports/pdf`, `/api/reports/schedule`, `/api/reports/send-scheduled`, `/api/reports/org-compliance` | Session |
| Webhooks | `/api/webhooks`, `/api/webhooks/[id]` | Session |
| API Keys | `/api/api-keys`, `/api/api-keys/[id]` | Session |
| Signatures | `/api/signatures`, `/api/signatures/[id]`, `/api/signatures/[id]/cancel`, `/api/signatures/sign/[token]` | Session/Public |
| Integrations | `/api/integrations`, `/api/integrations/[id]`, `/api/integrations/[id]/sync`, `/api/integrations/catalog`, `/api/integrations/test-connection` | Session |
| Cron | `/api/cron/check-expirations` | CRON_SECRET |
| Public API | `/api/v1/licenses`, `/api/v1/projects`, `/api/v1/compliance` | Bearer Token |

---

## 10. Security Model

### Authentication
- **NextAuth.js v4** with credentials provider (email + password)
- JWT-based sessions (no database sessions)
- Bcrypt password hashing with 12 salt rounds
- Password complexity: 8+ chars, uppercase, lowercase, number required

### Account Protection
- **Brute-force lockout**: 5 failed login attempts → 15-minute account lock
- **Rate limiting on auth**: 10 requests per 15 minutes per IP
- Automatic lockout reset on successful login

### Rate Limiting (3 Tiers)

| Tier | Routes | Limit | Window |
|------|--------|-------|--------|
| Auth | `/api/auth/*` | 10 req | 15 min |
| Public API | `/api/v1/*` | 60 req | 1 min |
| General | `/api/*` | 120 req | 1 min |

### CSRF Protection
- Origin-based validation for all mutation requests (POST, PUT, DELETE, PATCH)
- Bearer token requests bypass CSRF (API users authenticate differently)
- Exemptions: auth callbacks, cron endpoints, public compliance shares

### Security Headers (Applied to ALL responses)

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' `<AI_DOMAIN>`; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; |
| `Strict-Transport-Security` | max-age=63072000; includeSubDomains; preload |
| `X-Content-Type-Options` | nosniff |
| `X-Frame-Options` | DENY |
| `X-XSS-Protection` | 1; mode=block |
| `Referrer-Policy` | strict-origin-when-cross-origin |
| `Permissions-Policy` | camera=(), microphone=(), geolocation=() |

### Input Sanitization
- DOMPurify used on all user-generated HTML content
- Zod validation schemas on all mutation API endpoints
- File upload validation (MIME type + 10MB max size)

### Audit Logging
- Every significant action is logged to the `AuditLog` model
- Captures: userId, action, entityType, entityId, entityName, details, timestamp
- Viewable in the admin security dashboard

---

## 11. Internationalization (i18n)

### Supported Locales
- **English (en)** — LTR layout
- **Arabic (ar)** — RTL layout

### URL Pattern
All URLs include a locale prefix:
- English: `/en/dashboard`
- Arabic: `/ar/dashboard`

### Language File Structure
```
messages/
├── en/                          # English
│   ├── index.ts                 # Aggregates all namespace files
│   ├── common.json              # Shared strings (save, cancel, delete, etc.)
│   ├── auth.json                # Login, signup, forgot password
│   ├── dashboard.json           # Dashboard widgets and labels
│   ├── licenses.json            # License management
│   ├── insurance.json           # Insurance & bonds
│   ├── sidebar.json             # Sidebar navigation
│   ├── topNav.json              # Top navigation bar
│   ├── footer.json              # Footer content
│   ├── aiChat.json              # AI chat interface
│   ├── compliance.json          # Compliance pages
│   ├── projects.json            # Project management
│   ├── team.json                # Team management
│   ├── settings.json            # Settings pages
│   ├── reports.json             # Reports & analytics
│   ├── alerts.json              # Alert management
│   ├── notifications.json       # Notification center
│   ├── workflows.json           # Workflow builder
│   ├── approvals.json           # Approval routing
│   ├── signatures.json          # E-signatures
│   ├── integrations.json        # Integration hub
│   ├── vendorScores.json        # Vendor scoring
│   ├── contractorNetwork.json   # Contractor directory
│   ├── boardSubmissions.json    # Board submissions
│   ├── qualifiers.json          # Qualifier tracking
│   ├── businessEntities.json    # Business entities
│   ├── ceTracking.json          # CE tracking
│   ├── exams.json               # Exam tracking
│   ├── checklists.json          # Checklists
│   ├── stateRequirements.json   # State requirements
│   ├── regulatoryAlerts.json    # Regulatory monitoring
│   ├── import.json              # CSV import
│   ├── auditLog.json            # Audit log
│   ├── onboarding.json          # Onboarding wizard
│   ├── profile.json             # Profile settings
│   ├── organization.json        # Org settings
│   ├── branding.json            # White-label branding
│   ├── locations.json           # Location management
│   ├── apiAccess.json           # API & webhook settings
│   ├── apiDocs.json             # API documentation
│   ├── emailLogs.json           # Email delivery logs
│   ├── email.json               # Email templates
│   ├── admin.json               # Admin panel
│   ├── security.json            # Security settings
│   ├── automation.json          # Automation engine
│   ├── documentGenerator.json   # Document generation
│   ├── documentScanner.json     # Document scanning
│   ├── licenseReport.json       # License reports
│   ├── licenseApplications.json # License applications
│   ├── renewal.json             # Renewal workflow
│   ├── subcontractors.json      # Subcontractor management
│   ├── insurance.json           # Insurance management
│   ├── search.json              # Global search
│   ├── shortcuts.json           # Keyboard shortcuts
│   ├── pwa.json                 # PWA features
│   ├── quickView.json           # Quick view modals
│   ├── pageTitles.json          # Page titles
│   ├── nav.json                 # Navigation
│   ├── calendar.json            # Calendar view
│   ├── analytics.json           # Analytics
│   ├── bulkActions.json         # Bulk actions
│   ├── reciprocity.json         # Reciprocity mapping
│   └── landing.json             # Landing page
├── ar/                          # Arabic (mirror of en/)
│   └── ...                      # Same 58 namespace files
```

### Usage in Components
```typescript
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('licenses');
  return <h1>{t('title')}</h1>;
}
```

### Adding a New Language
1. Create a new directory under `messages/` (e.g., `messages/fr/`)
2. Copy all 58 namespace JSON files from `messages/en/`
3. Translate all values to the new language
4. Update `src/i18n/routing.ts` to add the locale
5. Update `messages/[new-locale]/index.ts` to aggregate the files

---

## 12. Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | SQLite database path (e.g., `file:./db/custom.db`) |
| `NEXTAUTH_SECRET` | ✅ | - | Secret for JWT signing (generate: `openssl rand -hex 32`) |
| `NEXTAUTH_URL` | ✅ | - | App base URL (e.g., `http://localhost:3000` or `https://app.licensevault.app`) |
| `CRON_SECRET` | ✅ | - | Secret for cron endpoint auth (generate: `openssl rand -hex 16`) |
| `SMTP_HOST` | ❌ | localhost | SMTP server hostname |
| `SMTP_PORT` | ❌ | 587 | SMTP server port |
| `SMTP_USER` | ❌ | - | SMTP username |
| `SMTP_PASS` | ❌ | - | SMTP password |
| `SMTP_FROM` | ❌ | `License Vault <noreply@localhost>` | Default sender email address |
| `OPENROUTER_API_KEY` | ❌ | - | API key for OpenRouter AI (for AI chat) |
| `AI_API_URL` | ❌ | `https://openrouter.ai/api/v1/chat/completions` | AI API endpoint URL |
| `NEXT_PUBLIC_APP_URL` | ❌ | - | Public app URL (for client-side use) |
| `NEXT_PUBLIC_API_URL` | ❌ | - | Public API URL (for client-side API docs) |
| `NEXT_PUBLIC_HELP_URL` | ❌ | - | Help/documentation URL |
| `APP_URL` | ❌ | - | Alternative app URL fallback |

---

## 13. Database Schema

The application uses **35+ Prisma models** organized by domain. See the full schema in `prisma/schema.prisma`.

### Entity Relationships (Simplified)

```
Organization ──┬── User (via OrgMember)
               ├── License ──┬── LicenseDocument
               │             ├── LicenseApplication ─── LicenseApplicationDocument
               │             └── CETracking
               ├── InsuranceBond
               ├── Project ──┬── ProjectLicense
               │             └── ProjectSubcontractor
               ├── Subcontractor ─── SubcontractorDocument
               ├── BusinessEntity ──┬── EntityLicense
               │                     └── BusinessEntity (self-hierarchy)
               ├── Qualifier ──── QualifierLicense
               ├── ApprovalWorkflow
               ├── WorkflowDefinition ─── WorkflowInstance
               ├── AutomationSetting
               ├── ContractorDirectory
               ├── VendorScore
               ├── BoardSubmission
               ├── SignatureRequest
               ├── Integration ─── IntegrationSyncLog
               ├── Webhook
               ├── ApiKey
               ├── Location
               ├── ScheduledReport
               ├── AlertPreference
               ├── Notification
               ├── EmailLog
               ├── AuditLog
               ├── ChecklistTemplate ─── ChecklistInstance
               ├── RegulatoryAlert
               ├── RegulatoryWatch
               ├── DocumentScan
               ├── GeneratedDocument
               ├── ExamTracking
               ├── StateRequirement
               ├── ComplianceShare
               ├── AiChatMessage
               └── PasswordResetToken
```

### Key Model: StateRequirement

The `StateRequirement` model contains **255 records** covering:

- **51 jurisdictions** (50 states + Washington DC)
- **5 license types** per state: General Contractor, Electrical, Plumbing, HVAC, Specialty
- Fields: renewal period, CE hours, fee range, bond requirements, insurance requirements, board contact info, reciprocity states, NASCLA acceptance

---

*Generated for License Vault — Contractor License Compliance Management Platform*
