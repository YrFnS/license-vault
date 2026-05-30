# Task 2-a: Subcontractor Onboarding Portal

## Agent: subcontractor-portal-agent
## Status: COMPLETED

## Work Log

### 1. Translation Keys Added (EN + AR)
- Added `subcontractors` namespace with 50+ keys to both `src/messages/en.json` and `src/messages/ar.json`
- Added `nav.subcontractors` and `sidebar.subcontractors` navigation keys
- Portal-specific translation keys under `subcontractors.portal.*`
- All Arabic translations are proper Arabic (not transliterations)

### 2. Subcontractor CRUD API (`/api/subcontractors`)
- **GET `/api/subcontractors`** - List all subcontractors for org (auth required, owner/admin only)
  - Supports filtering by `complianceStatus` and `tradeType` query params
  - Returns sub details with `_count.documents` for document counts
  - Returns `counts` object: total, compliant, pending, nonCompliant
- **POST `/api/subcontractors`** - Create new subcontractor (auth required, owner/admin)
  - Zod validation for name (required), email (required, email format), company, phone, tradeType
  - Auto-generates `portalToken` (crypto.randomUUID())
  - Sets `portalExpiresAt` to 7 days from now
  - Creates audit log entry
- **GET `/api/subcontractors/[id]`** - Get single subcontractor with all their documents
- **PUT `/api/subcontractors/[id]`** - Update subcontractor (auth required, owner/admin)
  - Supports updating all fields including license/insurance info and complianceStatus
  - Creates audit log entry
- **DELETE `/api/subcontractors/[id]`** - Delete subcontractor (auth required, owner/admin)
  - Creates audit log entry

### 3. Subcontractor Document API (`/api/subcontractors/[id]/documents`)
- **POST** - Upload document for subcontractor (multipart form)
  - Validates file type (PDF, JPG, PNG, DOC, DOCX) and size (10MB max)
  - Stores in `uploads/` directory with unique filename
  - Creates `SubcontractorDocument` record with category and pending reviewStatus
  - Updates `lastSubmittedAt` on the subcontractor
  - Creates audit log entry
- **PUT** - Review a document (set reviewStatus, reviewedBy, reviewedAt, reviewNotes)
  - Zod validation for documentId, reviewStatus (approved/rejected)
  - Auto-updates subcontractor compliance status based on all document reviews:
    - All approved → compliant
    - Any rejected → non_compliant
  - Creates audit log entry

### 4. Subcontractor Portal API (`/api/subcontractors/[id]/portal`)
- **GET** - Public endpoint (no auth) using portal token as the `[id]` parameter
  - Finds subcontractor by `portalToken`
  - Checks if portal link has expired (returns 410)
  - Returns subcontractor data with all documents and org name
- **PUT** - Update subcontractor info from portal (public, uses portal token)
  - Allows updating licenseNumber, licenseState, licenseExpiry, insuranceProvider, insuranceExpiry, insuranceAmount, phone
  - Sets complianceStatus back to 'pending' when info is updated
  - Updates lastSubmittedAt

### 5. Subcontractor Public Portal Page (`/subcontractor-portal/[token]/page.tsx`)
- Public page (no auth required)
- Professional emerald/teal branded design
- Features:
  - Welcome card with subcontractor name, company, and org name
  - Compliance completeness progress bar with 4-step indicator
  - License information form (license number, state, expiry, phone)
  - Insurance information form (provider, expiry)
  - License/insurance expiry status with color coding (red/amber/green)
  - Document upload section with category selection (License Copy, COI, Bond Certificate, Other)
  - Required documents checklist showing submitted/missing status
  - Document review status display (pending/approved/rejected with badges)
  - Save Information button that calls the portal PUT API
  - Invalid/expired portal link error states
  - Responsive mobile-first layout
  - Loading and error states
  - Footer with "Powered by LicenseVault"

### 6. Subcontractor Management Dashboard (`/[locale]/(dashboard)/subcontractors/page.tsx`)
- Auth-required dashboard page with full i18n support
- Features:
  - Summary cards: Total, Compliant, Pending, Non-Compliant (with gradient backgrounds, left border accents, icons)
  - Search bar for filtering by name, company, email, trade type
  - Filter tabs: All, Compliant, Pending, Non-Compliant with counts
  - Subcontractor cards with:
    - Name, company, trade type, email, phone
    - Compliance status badge (emerald/amber/red)
    - License expiry date with color coding (red if expired, amber if <30d, green if OK)
    - Insurance expiry date with same color coding
    - Quick actions: View Details, Send Portal Link, Delete
  - Add Subcontractor dialog (name, company, email, phone, trade type)
  - Send Portal Link action (generates new portal token, copies link to clipboard)
  - Detail dialog showing:
    - All subcontractor info in grid layout
    - Portal link section with copy button and expiry date
    - Documents list with review status badges and review button
  - Document review dialog (approve/reject with notes)
  - Delete confirmation dialog
  - Empty state with descriptive text
  - Framer Motion animations on cards
  - Full useTranslations('subcontractors') and useTranslations('common') for i18n

### 7. Sidebar Navigation Updated
- Added `subcontractors` nav item to Management section with HardHat icon
- Only visible to users with `canManage` role (owner/admin)
- Added corresponding nav and sidebar translation keys

### 8. Bug Fix
- Fixed missing `Input` import in `/src/app/[locale]/(dashboard)/projects/[id]/page.tsx` (pre-existing lint error)

### Color & Style Compliance
- No indigo or blue colors used
- Primary palette: emerald/teal for interactive elements and accents
- Status colors: emerald (compliant), amber (pending), red (non-compliant), teal (total)
- All RTL-safe: uses start/end/s/e instead of left/right
- Dark mode fully supported
- shadcn/ui components throughout (Card, Button, Badge, Dialog, Tabs, Select, Input, Label, Textarea, Progress, ScrollArea, Separator)

### Files Created
- `src/app/api/subcontractors/route.ts` - List/Create subcontractors
- `src/app/api/subcontractors/[id]/route.ts` - Get/Update/Delete subcontractor
- `src/app/api/subcontractors/[id]/documents/route.ts` - Upload/Review documents
- `src/app/api/subcontractors/[id]/portal/route.ts` - Public portal access
- `src/app/[locale]/(dashboard)/subcontractors/page.tsx` - Management dashboard
- `src/app/subcontractor-portal/[token]/page.tsx` - Public portal page

### Files Modified
- `src/messages/en.json` - Added subcontractors namespace with 50+ keys
- `src/messages/ar.json` - Added subcontractors namespace with 50+ keys
- `src/components/layout/Sidebar.tsx` - Added subcontractors nav item
- `src/app/[locale]/(dashboard)/projects/[id]/page.tsx` - Fixed missing Input import

### Verification
- All lint checks pass cleanly
- All pages return HTTP 200 (EN: /en/subcontractors, AR: /ar/subcontractors, Portal: /subcontractor-portal/test)
- API endpoints return correct status codes (401 for unauthenticated, etc.)
- No compilation errors
