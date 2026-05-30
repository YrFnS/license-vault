# License Vault — AI Agent Documentation

> **Guide for AI agents (Claude, GPT, etc.) working on this codebase**
> This document provides everything an AI coding agent needs to understand, navigate, and modify the License Vault application effectively.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Development Environment](#2-development-environment)
3. [Critical Rules & Constraints](#3-critical-rules--constraints)
4. [Codebase Navigation Map](#4-codebase-navigation-map)
5. [Common Development Patterns](#5-common-development-patterns)
6. [How to Add a New Feature](#6-how-to-add-a-new-feature)
7. [How to Add a New API Route](#7-how-to-add-a-new-api-route)
8. [How to Add a New Page](#8-how-to-add-a-new-page)
9. [How to Add i18n Keys](#9-how-to-add-i18n-keys)
10. [How to Add a Prisma Model](#10-how-to-add-a-prisma-model)
11. [How to Add a Dashboard Widget](#11-how-to-add-a-dashboard-widget)
12. [Testing & Verification](#12-testing--verification)
13. [Common Pitfalls](#13-common-pitfalls)
14. [Architecture Decision Records](#14-architecture-decision-records)
15. [Quick Reference](#15-quick-reference)

---

## 1. Project Overview

**License Vault** is a contractor license compliance SaaS platform. Think of it as the "compliance operating system" for construction companies — they use it to track every license, insurance policy, bond, CE credit, and regulatory requirement across their organization and subcontractors.

**Key business domain concepts:**
- **License**: A contractor's license (GC, Electrical, Plumbing, HVAC, Specialty) issued by a state board
- **Insurance/Bond**: COIs, surety bonds, and insurance policies with coverage limits
- **CE Tracking**: Continuing education credits required to renew licenses
- **Qualifier**: A licensed individual who qualifies a business entity to hold a license
- **Compliance Score**: Calculated percentage showing how compliant an organization is
- **Expiration Thresholds**: 60-day, 30-day, and 5-day alerts before something expires
- **Multi-state**: Organizations operate across multiple US states, each with different requirements

---

## 2. Development Environment

### Runtime & Tools
| Tool | Version | Purpose |
|------|---------|---------|
| Bun | Latest | JavaScript runtime & package manager |
| Next.js | 16 | Framework (App Router) |
| TypeScript | 5 | Type system |
| Prisma | 6.11 | ORM with SQLite |
| Caddy | - | Reverse proxy (port 81 → 3000) |

### Port Allocation
| Port | Service |
|------|---------|
| 81 | Caddy gateway (external) |
| 3000 | Next.js app (internal) |
| 3003+ | Mini-services (if any) |

### Key Commands
```bash
bun run dev          # Start dev server (port 3000, outputs to dev.log)
bun run lint         # ESLint check
bun run db:push      # Push Prisma schema to DB
bun run db:generate  # Generate Prisma client
```

### Important Files
| File | Purpose |
|------|---------|
| `/home/z/my-project/dev.log` | Dev server output (check for errors) |
| `/home/z/my-project/worklog.md` | Agent work history (read before starting) |
| `/home/z/my-project/.env` | Environment variables |
| `/home/z/my-project/prisma/schema.prisma` | Database schema (35+ models) |
| `/home/z/my-project/improvement-plan.md` | Feature tracking (49/50 complete) |

### Default Credentials
- **Email**: `admin@licensevault.com`
- **Password**: `Admin1234!`

---

## 3. Critical Rules & Constraints

### ⛳ MUST FOLLOW

1. **Only modify `/` route and pages under `src/app/`** — The user only sees the app through the Next.js App Router.

2. **Use API routes, NOT server actions** — All backend logic goes in `src/app/api/` route handlers. Never use `'use server'` directives.

3. **Use existing shadcn/ui components** — All components in `src/components/ui/` are already installed. Use them instead of building from scratch.

4. **z-ai-web-dev-sdk MUST be used in the backend only** — Never import it in client-side code.

5. **Port 3000 only** — The Next.js app must use port 3000. Never use `bun run build`.

6. **No hardcoded values** — Use environment variables with `process.env`. Never hardcode URLs, secrets, or credentials. Fallbacks should be empty strings or sensible defaults, not real domains.

7. **i18n for all user-facing text** — Every string a user sees must come from the language files in `src/messages/`. Never hardcode English text in components.

8. **Read worklog.md before starting** — Check `/home/z/my-project/worklog.md` for previous agent work.

9. **Write to worklog.md when done** — Always append your work record.

10. **API requests through gateway** — When making cross-service requests from frontend, use `?XTransformPort=<port>` query parameter. Never use `http://localhost:<port>` in fetch URLs.

### 🚫 NEVER DO

- Never use `bun run build` — it's too slow and unnecessary in dev
- Never write test files (no `*.test.ts`, `*.spec.ts`)
- Never create documentation files unless explicitly asked
- Never use indigo or blue as primary colors
- Never hardcode `localhost:3000` as a URL fallback
- Never use `'use server'` server actions
- Never use `http://localhost:<port>` in frontend fetch calls
- Never modify files in `src/components/ui/` unless fixing a bug
- Never add a new locale without adding all 58 namespace files

---

## 4. Codebase Navigation Map

### Where to Find Things

| I need to... | Look in... |
|-------------|-----------|
| Add a new page | `src/app/[locale]/(dashboard)/<page-name>/page.tsx` |
| Add an auth page | `src/app/[locale]/(auth)/<page-name>/page.tsx` |
| Add an API endpoint | `src/app/api/<resource>/route.ts` |
| Add a reusable component | `src/components/<domain>/<ComponentName>.tsx` |
| Add a UI primitive | Already in `src/components/ui/` — use existing |
| Add business logic | `src/lib/<feature>.ts` |
| Add a database model | `prisma/schema.prisma` |
| Add i18n strings | `src/messages/en/<namespace>.json` + `src/messages/ar/<namespace>.json` |
| Add a custom hook | `src/hooks/use-<name>.ts` |
| Add a seed script | `src/scripts/seed-<name>.ts` |
| Fix auth issues | `src/lib/auth.ts` |
| Fix middleware issues | `src/middleware.ts` |
| Fix email issues | `src/lib/email.ts` or `src/lib/email-templates.ts` |
| Fix rate limiting | `src/lib/rate-limit.ts` or `src/middleware.ts` |
| Fix a sidebar link | `src/components/layout/Sidebar.tsx` |
| Fix a top nav item | `src/components/layout/TopNav.tsx` |
| Fix the landing page | `src/app/[locale]/page.tsx` |
| Fix PWA issues | `src/components/pwa/` or `public/sw.js` |
| Fix styling | Check Tailwind classes first, then `src/app/globals.css` |

### Route Groups Explained

```
src/app/[locale]/
├── (auth)/         → No sidebar, split-screen layout, public access
├── (dashboard)/    → Full dashboard shell (sidebar + topnav), auth required
├── (public)/       → No sidebar, public access
├── sign/[token]/   → E-signature page, token-based access
├── compliance/[token]/ → Public compliance share, token-based access
└── page.tsx        → Landing page (public)
```

- `(auth)`, `(dashboard)`, `(public)` are Next.js route groups (parentheses = not in URL)
- `[locale]` is a dynamic segment for i18n (`en` or `ar`)
- `[token]` is a dynamic segment for token-based access

---

## 5. Common Development Patterns

### Pattern: Dashboard Page Component

Every dashboard page follows this pattern:

```typescript
'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import usePageTitle from '@/hooks/use-page-title';

export default function MyFeaturePage() {
  const t = useTranslations('myFeature');
  const { data: session } = useSession();
  usePageTitle(t('pageTitle'));
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/my-feature')
      .then(res => res.json())
      .then(data => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error(t('loadError'));
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div className="p-6">Loading...</div>;
  
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      {/* Content */}
    </div>
  );
}
```

### Pattern: API Route Handler

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  // ... more fields with validation
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const items = await db.myModel.findMany({
      where: { orgId: session.user.orgId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const validated = createSchema.parse(body);
    
    const item = await db.myModel.create({
      data: {
        ...validated,
        orgId: session.user.orgId,
      },
    });
    
    // Audit log
    await db.auditLog.create({
      data: {
        orgId: session.user.orgId,
        userId: session.user.id,
        action: 'create',
        entityType: 'myModel',
        entityId: item.id,
        entityName: item.name,
        details: 'Created new item',
      },
    });
    
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Pattern: i18n Translation Usage

```typescript
// In a component
const t = useTranslations('licenses');  // references messages/en/licenses.json
const common = useTranslations('common');

// Usage
<h1>{t('title')}</h1>
<Button>{common('save')}</Button>

// With interpolation (if supported by the JSON)
<p>{t('expiresIn', { days: 30 })}</p>
```

### Pattern: Prisma Database Access

```typescript
import { db } from '@/lib/db';

// Always import db from '@/lib/db' — it's a singleton

// Read
const license = await db.license.findUnique({ where: { id } });
const licenses = await db.license.findMany({ where: { orgId } });

// Create
const license = await db.license.create({ data: { ... } });

// Update
await db.license.update({ where: { id }, data: { ... } });

// Delete
await db.license.delete({ where: { id } });

// Include relations
const org = await db.organization.findUnique({
  where: { id },
  include: { members: true, licenses: true },
});
```

### Pattern: Authentication Check

```typescript
// Server-side (API routes)
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
const userId = session.user.id;
const userRole = (session.user as any).role;

// Client-side (pages/components)
import { useSession } from 'next-auth-react';

const { data: session, status } = useSession();
if (status === 'unauthenticated') redirect('/login');
```

### Pattern: API Key Authentication (Public API v1)

```typescript
import { authenticateApiKey } from '@/lib/api-auth';

export async function GET(request: Request) {
  const authResult = await authenticateApiKey(request);
  if (!authResult) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }
  const { orgId, permissions, apiKeyId } = authResult;
  // permissions: 'read' | 'write' | 'admin'
  if (permissions === 'read') {
    // Only allow GET
  }
}
```

---

## 6. How to Add a New Feature

Complete checklist for adding a new feature:

### Step 1: Database Model
1. Add model to `prisma/schema.prisma`
2. Include: `id String @id @default(cuid())`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
3. Include: `orgId String` and `org Organization @relation(fields: [orgId], references: [id])` for multi-tenancy
4. Run: `bun run db:push`

### Step 2: API Routes
1. Create `src/app/api/<resource>/route.ts`
2. Implement GET (list), POST (create)
3. Create `src/app/api/<resource>/[id]/route.ts`
4. Implement GET (detail), PUT (update), DELETE (remove)
5. Add Zod validation schemas
6. Add authentication checks
7. Add audit logging for mutations

### Step 3: i18n Strings
1. Create `src/messages/en/<feature>.json` with all UI strings
2. Create `src/messages/ar/<feature>.json` with Arabic translations
3. Add the namespace to `src/messages/en/index.ts` and `src/messages/ar/index.ts`

### Step 4: UI Page
1. Create `src/app/[locale]/(dashboard)/<feature>/page.tsx`
2. Use `'use client'` directive
3. Use `useTranslations('<feature>')` for all text
4. Use `usePageTitle()` for the page title
5. Follow the dashboard page pattern above

### Step 5: Navigation
1. Add entry to sidebar: `src/components/layout/Sidebar.tsx`
2. Add i18n keys to `src/messages/en/sidebar.json` and `src/messages/ar/sidebar.json`
3. Add page title to `src/messages/en/pageTitles.json` and `src/messages/ar/pageTitles.json`

### Step 6: Dashboard Widget (Optional)
1. Create component in `src/components/dashboard/`
2. Add to the dashboard page: `src/app/[locale]/(dashboard)/dashboard/page.tsx`
3. Add API endpoint for widget data: `src/app/api/dashboard/<widget>/route.ts`

---

## 7. How to Add a New API Route

### Basic Route
```
src/app/api/<resource>/route.ts    → GET (list), POST (create)
src/app/api/<resource>/[id]/route.ts → GET, PUT, DELETE
```

### Dynamic Sub-routes
```
src/app/api/<resource>/[id]/<sub>/route.ts    → Sub-resource operations
src/app/api/<resource>/[id]/<sub>/[subId]/route.ts → Nested sub-resource
```

### Auth Requirements
- **Dashboard APIs**: Use `getServerSession(authOptions)` — requires session cookie
- **Public API v1**: Use `authenticateApiKey(request)` — requires Bearer token
- **Cron endpoints**: Use `CRON_SECRET` query parameter — `?secret=<CRON_SECRET>`
- **Public pages**: No auth (e.g., compliance share, e-signature signing)

### Important: Response Format
```typescript
// Success
return NextResponse.json({ item });          // Single item
return NextResponse.json({ items });         // List
return NextResponse.json({ item }, { status: 201 }); // Created

// Error
return NextResponse.json({ error: 'Message' }, { status: 400 });
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
return NextResponse.json({ error: 'Not found' }, { status: 404 });
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
```

---

## 8. How to Add a New Page

### Dashboard Page (Auth Required)
```bash
# Create the page file
src/app/[locale]/(dashboard)/<feature>/page.tsx
```

The dashboard layout (`(dashboard)/layout.tsx`) automatically:
- Checks authentication (redirects to `/login` if unauthenticated)
- Renders the sidebar and topnav
- Adds PWA support
- Adds keyboard shortcuts

### Auth Page (Public)
```bash
src/app/[locale]/(auth)/<feature>/page.tsx
```

The auth layout (`(auth)/layout.tsx`) provides:
- Split-screen design (gradient left, form right)
- Mobile-responsive layout
- No sidebar/topnav

### Public Page (No Auth)
```bash
src/app/[locale]/(public)/<feature>/page.tsx
```

### Token-Based Page
```bash
src/app/[locale]/<action>/[token]/page.tsx
```

---

## 9. How to Add i18n Keys

### 1. Add keys to English file
```json
// src/messages/en/myFeature.json
{
  "pageTitle": "My Feature",
  "title": "Feature Management",
  "description": "Manage your features here",
  "create": "Create Feature",
  "edit": "Edit Feature",
  "delete": "Delete Feature",
  "loadError": "Failed to load features",
  "saveSuccess": "Feature saved successfully",
  "deleteSuccess": "Feature deleted successfully",
  "name": "Name",
  "status": "Status",
  "noFeatures": "No features found",
  "noFeaturesDesc": "Create your first feature to get started"
}
```

### 2. Add Arabic translations
```json
// src/messages/ar/myFeature.json
{
  "pageTitle": "ميزتي",
  "title": "إدارة الميزات",
  "description": "قم بإدارة ميزاتك هنا",
  // ... translate all keys
}
```

### 3. Register the namespace
```typescript
// src/messages/en/index.ts — add to the import and export
import myFeature from './myFeature.json';
export default { ..., myFeature };

// src/messages/ar/index.ts — same
import myFeature from './myFeature.json';
export default { ..., myFeature };
```

### 4. Use in components
```typescript
const t = useTranslations('myFeature');
```

---

## 10. How to Add a Prisma Model

### Template
```prisma
model MyModel {
  id        String   @id @default(cuid())
  orgId     String
  org       Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  
  // Your fields
  name      String
  status    String   @default("active")
  metadata  Json?
  
  // Standard fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([orgId])
  @@map("my_models")
}
```

### After Adding a Model
```bash
bun run db:push      # Push schema to DB
bun run db:generate  # Regenerate Prisma client
```

### Field Type Reference
| TypeScript | Prisma | SQLite |
|-----------|--------|--------|
| `string` | `String` | TEXT |
| `number` | `Int` / `Float` | INTEGER / REAL |
| `boolean` | `Boolean` | INTEGER (0/1) |
| `Date` | `DateTime` | TEXT (ISO 8601) |
| `object` | `Json` | TEXT (JSON string) |
| `string | null` | `String?` | TEXT (nullable) |

### Important Notes
- Prisma primitive types CANNOT be lists. Use `Json` for arrays: `tags Json @default("[]")`
- Always add `@@index([orgId])` for multi-tenant queries
- Use `@@map("table_name")` for explicit table naming
- Use `onDelete: Cascade` on org relations to delete all org data when org is deleted

---

## 11. How to Add a Dashboard Widget

### 1. Create the Widget Component
```typescript
// src/components/dashboard/MyWidget.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

export function MyWidget() {
  const t = useTranslations('dashboard');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t('myWidgetTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Widget content */}
      </CardContent>
    </Card>
  );
}
```

### 2. Add Data API
```typescript
// src/app/api/dashboard/my-widget/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Query data
  const data = await db.myModel.groupBy({ ... });
  
  return NextResponse.json({ data });
}
```

### 3. Add to Dashboard Page
```typescript
// src/app/[locale]/(dashboard)/dashboard/page.tsx
// Import and add the widget in the appropriate grid section
import { MyWidget } from '@/components/dashboard/MyWidget';
```

---

## 12. Testing & Verification

### Lint Check
```bash
bun run lint
```

### Dev Server Log
```bash
tail -20 /home/z/my-project/dev.log
```

### Browser Testing
Use the `agent-browser` tool for end-to-end testing:
```bash
agent-browser --help              # View available commands
agent-browser navigate <url>      # Navigate to a page
agent-browser screenshot          # Take a screenshot
agent-browser click <selector>    # Click an element
agent-browser type <selector> <text>  # Type into an input
```

### Manual API Testing
```bash
# Login to get session cookie
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -d 'email=admin@licensevault.com&password=Admin1234!'

# Test API endpoint
curl http://localhost:3000/api/licenses

# Test public API with Bearer token
curl -H "Authorization: Bearer lv_live_your_key" http://localhost:3000/api/v1/licenses

# Test cron endpoint
curl "http://localhost:3000/api/cron/check-expirations?secret=YOUR_CRON_SECRET"
```

### Common Checks
1. **Does the page load?** → Check dev.log for compilation errors
2. **Does auth work?** → Try logging in with default credentials
3. **Does i18n work?** → Switch to Arabic (`/ar/`) and verify RTL
4. **Does the API work?** → Check Network tab in browser dev tools
5. **Are there TypeScript errors?** → Run `bun run lint`

---

## 13. Common Pitfalls

### 1. Forgetting `'use client'`
Most dashboard pages need `'use client'` because they use hooks (useState, useEffect, useTranslations, useSession). Without it, you'll get build errors.

### 2. Hardcoded Strings
❌ Wrong:
```tsx
<h1>License Management</h1>
<Button>Delete</Button>
```

✅ Correct:
```tsx
const t = useTranslations('licenses');
<h1>{t('title')}</h1>
<Button>{t('delete')}</Button>
```

### 3. Missing Auth Check
❌ Wrong:
```typescript
// API route without auth check
export async function GET() {
  const data = await db.license.findMany();
  return NextResponse.json({ data });
}
```

✅ Correct:
```typescript
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await db.license.findMany({
    where: { orgId: (session.user as any).orgId },
  });
  return NextResponse.json({ data });
}
```

### 4. Missing Zod Validation
❌ Wrong:
```typescript
const body = await request.json();
const item = await db.myModel.create({ data: body });
```

✅ Correct:
```typescript
const body = await request.json();
const schema = z.object({ name: z.string().min(1), status: z.string() });
const validated = schema.parse(body);
const item = await db.myModel.create({ data: validated });
```

### 5. Missing Audit Log
Always create audit logs for mutations:
```typescript
await db.auditLog.create({
  data: {
    orgId: session.user.orgId,
    userId: session.user.id,
    action: 'create', // or 'update', 'delete'
    entityType: 'license',
    entityId: item.id,
    entityName: item.name,
    details: 'Created new license',
  },
});
```

### 6. Using `localhost:<port>` in Frontend Fetch
❌ Wrong:
```typescript
fetch('http://localhost:3000/api/licenses')
```

✅ Correct:
```typescript
fetch('/api/licenses')
// Or for mini-services:
fetch('/api/test?XTransformPort=3030')
```

### 7. Not Using Multi-Tenant Filtering
Always filter by `orgId` when querying data:
```typescript
// ❌ Wrong - returns ALL orgs' data
const licenses = await db.license.findMany();

// ✅ Correct - only this org's data
const licenses = await db.license.findMany({
  where: { orgId: session.user.orgId },
});
```

### 8. Forgetting to Handle Loading States
Always show loading state while fetching data:
```typescript
const [loading, setLoading] = useState(true);
// ... in useEffect
setLoading(false);
// ... in render
if (loading) return <Skeleton className="h-48 w-full" />;
```

### 9. Missing Error Handling in useEffect
```typescript
// ❌ Wrong - no error handling
useEffect(() => {
  fetch('/api/licenses').then(r => r.json()).then(setData);
}, []);

// ✅ Correct
useEffect(() => {
  fetch('/api/licenses')
    .then(r => r.json())
    .then(data => { setData(data); setLoading(false); })
    .catch(() => { toast.error(t('loadError')); setLoading(false); });
}, []);
```

### 10. Not Adding i18n to Both Languages
Every key in `messages/en/*.json` must have a corresponding key in `messages/ar/*.json`. Missing keys will cause runtime errors.

---

## 14. Architecture Decision Records

### ADR-001: Next.js App Router with i18n Dynamic Segments
**Decision**: Use `[locale]` dynamic segment for i18n instead of domain-based or cookie-based locale detection.
**Rationale**: Simpler URL structure, SEO-friendly, works with static generation, no cookie dependency.

### ADR-002: SQLite via Prisma
**Decision**: Use SQLite as the database with Prisma ORM.
**Rationale**: Zero-configuration, file-based, perfect for single-instance SaaS, easy backup, Prisma provides type-safe queries.

### ADR-003: JWT Sessions (No Database Sessions)
**Decision**: Use JWT strategy for NextAuth sessions instead of database sessions.
**Rationale**: Stateless, no database queries for session validation, works well with API routes.

### ADR-004: API Routes Instead of Server Actions
**Decision**: All backend logic uses API routes (`/api/*`), not React Server Actions.
**Rationale**: Clear separation of concerns, RESTful design, testable, supports external API consumers, works with Bearer token auth.

### ADR-005: Modular i18n with Namespace Files
**Decision**: Split translation files by feature namespace (58 files per language) instead of one monolithic file.
**Rationale**: Easier to maintain, reduces merge conflicts, faster loading, clear ownership per feature.

### ADR-006: Caddy Gateway with XTransformPort
**Decision**: Use Caddy as a reverse proxy with `XTransformPort` query parameter for service routing.
**Rationale**: Single external port (81), transparent service routing, supports WebSocket, easy SSL termination.

### ADR-007: Rate Limiting in Middleware
**Decision**: Implement rate limiting in Next.js middleware instead of a separate service.
**Rationale**: Edge-compatible, no external dependency, consistent with app architecture, in-memory store is sufficient for single-instance.

### ADR-008: OpenRouter for AI Features
**Decision**: Use OpenRouter API via z-ai-web-dev-sdk for AI features.
**Rationale**: Access to multiple LLM models, unified API, configurable via environment variable, built-in SDK support.

---

## 15. Quick Reference

### File Template: New Dashboard Page
```typescript
'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Search } from 'lucide-react';
import usePageTitle from '@/hooks/use-page-title';

interface Item {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export default function FeaturePage() {
  const t = useTranslations('feature');
  const common = useTranslations('common');
  usePageTitle(t('pageTitle'));

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/feature');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDelete = async (id: string) => {
    if (!confirm(common('confirmDelete'))) return;
    try {
      const res = await fetch(`/api/feature/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success(t('deleteSuccess'));
      fetchItems();
    } catch {
      toast.error(t('deleteError'));
    }
  };

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button>
          <Plus className="h-4 w-4 me-2" />
          {t('create')}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ps-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">{t('noItems')}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{t('noItemsDesc')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map(item => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.status}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                  {common('delete')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

### File Template: New API Route
```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  status: z.string().default('active'),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const items = await db.feature.findMany({
      where: { orgId: (session.user as any).orgId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET /api/feature error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = createSchema.parse(body);
    const orgId = (session.user as any).orgId;

    const item = await db.feature.create({
      data: { ...validated, orgId },
    });

    await db.auditLog.create({
      data: {
        orgId,
        userId: session.user.id,
        action: 'create',
        entityType: 'feature',
        entityId: item.id,
        entityName: item.name,
        details: 'Created feature',
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('POST /api/feature error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### File Template: New i18n File
```json
{
  "pageTitle": "Feature",
  "title": "Feature Management",
  "create": "Create Feature",
  "searchPlaceholder": "Search features...",
  "loadError": "Failed to load features",
  "deleteSuccess": "Feature deleted successfully",
  "deleteError": "Failed to delete feature",
  "noItems": "No features found",
  "noItemsDesc": "Create your first feature to get started",
  "name": "Name",
  "status": "Status",
  "active": "Active",
  "inactive": "Inactive"
}
```

---

*This document is maintained for AI agents working on the License Vault codebase. Last updated: 2025*
