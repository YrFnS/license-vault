---
Task ID: 4
Agent: api-webhooks-agent
Task: Build Phase 9.5 - Public API & Webhooks

Work Log:

### 1. Created API Key Authentication Middleware (`src/lib/api-auth.ts`)
- `authenticateApiKey()` - Extracts Bearer token from Authorization header, hashes with SHA-256, looks up in DB via `findFirst`, checks isActive and expiry, updates lastUsedAt
- `hasPermission()` - Checks permission level hierarchy (read < write < admin)

### 2. Created API Key Management Routes
- **GET /api/api-keys** (`src/app/api/api-keys/route.ts`) - Lists API keys for org (never returns keyHash), requires owner/admin role
- **POST /api/api-keys** - Creates API key with Zod validation (name, permissions, expiresAt), generates `lv_live_` + 32-byte hex key, stores SHA-256 hash, returns full key only once, creates audit log
- **PUT /api/api-keys/[id]** (`src/app/api/api-keys/[id]/route.ts`) - Updates name, permissions, isActive with Zod validation
- **DELETE /api/api-keys/[id]** - Soft-deletes (sets isActive=false), creates audit log

### 3. Created Webhook Management Routes
- **GET /api/webhooks** (`src/app/api/webhooks/route.ts`) - Lists webhooks for org, requires owner/admin role
- **POST /api/webhooks** - Creates webhook with Zod validation (name, https URL, comma-separated events from 10 valid types), generates `whsec_` + 24-byte hex secret, creates audit log
- **PUT /api/webhooks/[id]** (`src/app/api/webhooks/[id]/route.ts`) - Updates name, url, events, isActive
- **DELETE /api/webhooks/[id]** - Hard deletes webhook, creates audit log
- **POST /api/webhooks/[id]/test** (`src/app/api/webhooks/[id]/test/route.ts`) - Sends test payload with HMAC-SHA256 signature, 10-second timeout, updates lastTriggeredAt and failureCount

### 4. Created Public API v1 Endpoints
- **GET /api/v1/licenses** (`src/app/api/v1/licenses/route.ts`) - Lists licenses with pagination and status filter, requires API key with read permission
- **GET /api/v1/licenses/[id]** (`src/app/api/v1/licenses/[id]/route.ts`) - Gets single license details
- **GET /api/v1/compliance** (`src/app/api/v1/compliance/route.ts`) - Gets compliance status (total, active, expiring, expired, complianceRate)
- **GET /api/v1/projects** (`src/app/api/v1/projects/route.ts`) - Lists projects with pagination and status filter
- All endpoints return standard format: `{ data: [...], pagination: { page, limit, total, totalPages } }`

### 5. Created Frontend Developer Settings Page (`src/app/[locale]/(dashboard)/settings/api/page.tsx`)
- **API Keys Section**: List with name, permissions badge (color-coded), key prefix badge, last used, expires, status; Create dialog with name, permissions dropdown, expiry date; Created key display with copyable field and warning; Revoke with confirmation; Copy prefix
- **Webhooks Section**: List with name, URL, event badges, status, last triggered, failure count; Create/edit dialog with name, URL, multi-checkbox events selector; Test button with loading spinner; Copy secret; Delete with confirmation
- **API Documentation Section**: Collapsible section with base URL, authentication instructions, endpoint table (4 endpoints), example curl command, webhook event types reference

### 6. Updated Sidebar Navigation (`src/components/layout/Sidebar.tsx`)
- Added `Key` icon import from lucide-react
- Added `{ key: 'apiAccess', icon: Key, href: '/settings/api' }` to management section (after approvals)
- Added role filter: `if (item.key === 'apiAccess' && !canManage) return false;`

### 7. Added Translation Keys
- **en.json**: Added `nav.apiAccess` = "API & Webhooks" + full `apiAccess` namespace with apiKeys (25 keys), webhooks (21 keys), events (10 keys), docs (8 keys)
- **ar.json**: Added `nav.apiAccess` = "واجهة برمجة التطبيقات" + full `apiAccess` namespace with Arabic translations

### 8. Verification
- `bun run lint` passes cleanly with no errors
- All API endpoints return 401 for unauthenticated requests (correct behavior)
- Frontend page `/en/settings/api` returns HTTP 200
- Frontend page `/ar/settings/api` returns HTTP 200
- Public API v1 endpoints return proper unauthorized message with invalid keys
- Prisma Client regenerated with `bun run db:push`

Stage Summary:
- Complete API key CRUD with SHA-256 hashing, never stores plaintext
- Full webhook CRUD with 10 event types, HMAC-SHA256 signed test payloads
- 4 public API v1 endpoints with Bearer token authentication and pagination
- Professional Developer Settings page with 3 sections (API Keys, Webhooks, Documentation)
- Sidebar navigation updated with API & Webhooks link (owner/admin only)
- Full i18n support (EN + AR) with 64+ new translation keys per language
