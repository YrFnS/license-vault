# Task 4-6: API Documentation Page + Reusable Components

## Task 6: API Documentation Page

### Created Files
- `src/app/[locale]/(dashboard)/developer-settings/api-docs/page.tsx` — Interactive API documentation page

### Features
- **Getting Started tab**: Base URL info, Authentication method (Bearer token), Rate limits (100 req/min, 429 status, 60s retry)
- **Endpoints tab** with 4 v1 API endpoints:
  - `GET /api/v1/licenses` — List licenses (with page, limit, status query params)
  - `GET /api/v1/licenses/{id}` — Get license details (with id path param)
  - `GET /api/v1/projects` — List projects (with page, limit query params)
  - `GET /api/v1/compliance` — Get compliance status
- Each endpoint shows:
  - Color-coded method badge (GET=emerald, POST=amber, PUT=teal, DELETE=red)
  - Path with parameter highlights
  - Description
  - Query parameters table (name, description, required)
  - Sample response (JSON in dark code block with copy button)
  - "Try It" section with API key input, send request button, and live response viewer
- **Webhooks tab**: 6 webhook events (license.created, license.updated, license.expired, license.renewed, insurance.expired, compliance.changed) with descriptions and JSON payload format example
- **API Key Management** card linking to existing /settings/api page
- Uses shadcn/ui components: Card, Badge, Tabs, Accordion, Button, Input, Separator
- Framer-motion animations (fadeIn, stagger)
- Emerald/teal color scheme, no indigo/blue
- Dark mode support
- RTL-safe (start/end instead of left/right)
- Responsive design
- Code blocks with bg-slate-950 even in light mode

## Task 4: Extract Reusable Components

### Created Files

1. **`src/components/common/StatusBadge.tsx`**
   - Maps common statuses to colors: active/compliant/approved=emerald, expiring/pending/warning=amber, expired/non_compliant/rejected=red, inactive/draft=teal, unknown=slate
   - Supports custom label override
   - Uses shadcn Badge component
   - Automatically formats status strings (snake_case → Title Case)

2. **`src/components/common/ComplianceScoreRing.tsx`**
   - SVG circle with animated stroke-dashoffset
   - Color coding: >=80% emerald, >=60% amber, <60% red
   - Size prop (sm=64px, md=88px, lg=112px)
   - Smooth animation on value change (1s ease-out)
   - Optional label text below percentage

3. **`src/components/projects/ProjectCard.tsx`**
   - Project name, status badge, location, client name
   - Compliance score with ComplianceScoreRing
   - Dates (start/end) with Calendar icon
   - Number of linked licenses and subcontractors
   - Hover effects (shadow, translate, accent bar), dark mode support

4. **`src/components/subcontractors/SubcontractorCard.tsx`**
   - Company name, contact name, trade type
   - Compliance status badge (uses StatusBadge)
   - Insurance status indicator badge
   - License info (number, state, expiry with color coding)
   - Portal link indicator
   - Hover effects, dark mode support

5. **`src/components/qualifiers/QualifierCard.tsx`**
   - Name, email, phone
   - License number, state, type, expiry
   - CE progress bar (hoursEarned/hoursRequired) with color-coded progress
   - Status badge (uses StatusBadge)
   - Number of linked licenses
   - Hover effects, dark mode support

6. **`src/components/insurance/InsuranceCard.tsx`**
   - Policy name, number, provider
   - Type badge (insurance/bond — emerald for insurance, teal for bond)
   - Coverage amount, premium, per occurrence limit, aggregate limit
   - COI endorsements (Additional Insured, Primary Non-Contrib, Waiver of Subrogation) with check/x icons
   - Compliance status badge (uses StatusBadge)
   - Expiry date with color coding
   - Endorsement types text
   - Hover effects, dark mode support

## i18n Translation Keys

### Added 36 keys to `apiDocs` namespace in both en.json and ar.json:
- title, subtitle, version, v1
- gettingStarted, baseUrl, baseUrlDesc
- authentication, authDesc
- rateLimits, rateLimitsDesc
- endpoints, queryParams, sampleResponse
- tryIt, tryItDesc, sendRequest, response, statusCode, noApiKey
- webhooks, webhooksDesc, webhookPayload, webhookPayloadDesc
- 6 webhook event labels + descriptions (eventLicenseExpired, eventLicenseRenewed, eventInsuranceExpired, eventComplianceChanged, eventLicenseCreated, eventLicenseUpdated)
- manageApiKeys, manageApiKeysDesc, goToSettings
- 4 endpoint descriptions + 5 param descriptions

## Verification
- `bun run lint` passes cleanly with no errors
- Dev server compiling successfully
