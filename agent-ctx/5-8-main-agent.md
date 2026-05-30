# Task 5-8 Agent Work Log

## Task ID: 5, 6, 7, 8
## Agent: main-agent

### Gap 5: Custom Report Builder - Wire Up Generate Button + Scheduled Reports

#### 5a: Wired up the Report Builder Generate Button
- **File**: `src/app/[locale]/(dashboard)/analytics/page.tsx`
- Added state variables: `reportType`, `dateRange`, `stateFilter`, `licenseTypeFilter`, `reportFormat`, `generating`
- Added `handleGenerateReport` callback that:
  - Computes date range params from the selected range (last7/30/90/year/all)
  - Maps report type to API type parameter
  - For PDF: calls `GET /api/reports/pdf?type={type}&state={state}&licenseType={licenseType}&startDate={startDate}&endDate={endDate}`
  - For CSV: calls `GET /api/licenses/export?format=csv&state={state}&type={licenseType}`
  - Downloads the result as a file using blob URL
  - Shows toast notification on success/failure
- Changed all Select components from `defaultValue` to controlled `value` + `onValueChange`
- Generate button now shows "Generating..." when in progress and is disabled during generation

#### 5b: Updated PDF Report API to Support Filters
- **File**: `src/app/api/reports/pdf/route.ts`
- Changed `GET()` to `GET(request: Request)` to access URL params
- Added query parameter parsing: `type`, `state`, `licenseType`, `startDate`, `endDate`
- Applied filters to license queries (state, type, date range)
- Applied date range filters to insurance and CE tracking queries
- Report title now varies by report type (compliance/licenses/insurance/ce/full)
- Applied filter information is displayed on the PDF cover page

#### 5c: Scheduled Email Reports
- **New model**: `ScheduledReport` in `prisma/schema.prisma` with fields: frequency, recipients (JSON), reportType, format, enabled, lastSentAt
- **New API**: `src/app/api/reports/schedule/route.ts`
  - GET: Returns current schedule config for the org
  - POST: Creates/updates scheduled report config (upsert by orgId)
  - Validates frequency, reportType, format, recipients
  - Creates audit log entry
- **New API**: `src/app/api/reports/send-scheduled/route.ts`
  - POST: Cron-triggered endpoint (requires CRON_SECRET)
  - Finds all orgs with scheduled reports enabled
  - Checks if report is due based on frequency and lastSentAt
  - Generates compliance data and sends via `sendComplianceReport()`
  - Updates lastSentAt on successful send
- **UI**: Added "Schedule Reports" section to analytics page with:
  - Frequency selector (weekly/monthly/quarterly)
  - Report type selector (compliance/full/licenses)
  - Format selector (pdf/csv)
  - Recipient email input with add/remove
  - Enable/disable switch
  - Save button with loading state
  - Fetches existing config on page load

### Gap 6: Apply Rate Limiting Middleware

- **File**: `src/middleware.ts` (rewritten)
- Added rate limiting for API routes:
  - `/api/auth/*` → authLimiter (5 req/15 min)
  - `/api/v1/*` → publicApiLimiter (30 req/min)
  - `/api/*` → apiLimiter (60 req/min)
- Uses IP address from `x-forwarded-for` or `x-real-ip` header
- Returns 429 Too Many Requests with `Retry-After` and `X-RateLimit-*` headers
- Skips rate limiting for non-API routes
- Preserves security headers on all routes

### Gap 7: Apply CSRF Validation

- **In middleware**: For POST/PUT/DELETE/PATCH to `/api/*` (except `/api/auth/*`, `/api/v1/*`, `/api/csrf-token`, `/api/cron/*`, `/api/reports/send-scheduled`):
  - Checks for `X-CSRF-Token` header
  - Validates using `validateCsrfToken()` from `@/lib/csrf`
  - Uses next-auth session token as session identifier
  - Returns 403 with error message if token is missing or invalid
- **New API**: `src/app/api/csrf-token/route.ts`
  - GET: Returns a new CSRF token (requires authentication)
  - Uses userId as session identifier for token generation

### Gap 8: Apply Input Sanitization

Applied `sanitizeString()` from `@/lib/sanitize` to these routes:

1. `src/app/api/licenses/route.ts` - POST: sanitizes name, type, licenseNumber, issuedBy, state, notes
2. `src/app/api/licenses/[id]/route.ts` - PUT: sanitizes all string fields in restFields before updating
3. `src/app/api/insurance/route.ts` - POST: sanitizes name, policyNumber, provider, holderName, notes
4. `src/app/api/insurance/[id]/route.ts` - PUT: sanitizes all string fields in restFields before updating
5. `src/app/api/subcontractors/route.ts` - POST: sanitizes companyName, contactName, phone, licenseNumber, licenseState, notes
6. `src/app/api/qualifiers/route.ts` - POST: sanitizes firstName, lastName, phone, licenseNumber, licenseState, licenseType, notes
7. `src/app/api/projects/route.ts` - POST: sanitizes name, description, clientName, location, state, requiredLicenses, requiredInsurance
8. `src/app/api/team/route.ts` - POST: sanitizes fullName

### Verification
- `bun run lint` passes with no errors
- All pages return HTTP 200 (EN and AR)
- API GET requests work without CSRF tokens
- API POST requests return 403 when CSRF token is missing (correct)
- Rate limiting headers present on API responses
- Dev server compiles without errors
