---
Task ID: 19
Agent: main-agent
Task: AI Document Intake - VLM-powered document scanning for automatic data extraction

Work Log:

### 1. Prisma Schema Update (`prisma/schema.prisma`)
- Added `DocumentScan` model with fields: id, orgId, userId, fileName, fileType, fileSize, documentType, extractedData (JSON string), rawText, confidence, status, createdAt
- Added `documentScans DocumentScan[]` relation to Organization model
- Ran `bun run db:push` successfully to sync schema with SQLite database

### 2. VLM Document Scanner Service (`src/lib/document-scanner.ts`)
- Created TypeScript interfaces: `COIExtraction`, `LicenseExtraction`, `BondExtraction`, `DocumentScanResult`
- Implemented `scanCOI()` - Extract COI data using specific COI prompt with fields: insuredName, policyNumber, insuranceProvider, effectiveDate, expirationDate, coverageAmount, perOccurrenceLimit, aggregateLimit, additionalInsured, primaryNoncontributory, waiverOfSubrogation, endorsementTypes, holderName, confidence
- Implemented `scanLicense()` - Extract license data with fields: licenseNumber, licenseType, licenseeName, state, issueDate, expirationDate, issuingBoard, restrictions, confidence
- Implemented `scanBond()` - Extract bond data with fields: bondNumber, bondType, principalName, obligeeName, suretyCompany, bondAmount, effectiveDate, expirationDate, confidence
- Implemented `scanDocument()` - Auto-detect document type and extract appropriate data
- Used z-ai-web-dev-sdk VLM API (`zai.chat.completions.createVision`) with base64 image data URLs
- Robust JSON parsing from VLM responses (handles markdown code blocks, raw JSON, embedded objects)
- Confidence scores clamped to 0-100 range
- Lazy-initialized ZAI client singleton

### 3. Document Scan API (`src/app/api/documents/scan/route.ts`)
- **POST endpoint**: Accepts FormData with file and optional `documentType` hint (coi/license/bond/auto)
  - Authentication required via `getServerSession`
  - Rate limiting: max 10 scans per hour per user using `rateLimit` utility
  - File validation: type (JPEG, PNG, WebP, GIF, PDF) and size (max 10MB)
  - Saves file temporarily, runs VLM scanner, cleans up temp file
  - Saves scan result to `DocumentScan` Prisma model
  - Creates audit log entry
  - Returns structured extraction data with confidence scores
- **GET endpoint**: Returns last 20 scan results for the organization
  - Requires authentication
  - Returns formatted scan history with parsed extractedData JSON

### 4. Document Scan Results API (`src/app/api/documents/scan/[id]/route.ts`)
- GET endpoint to retrieve a specific scan result by ID
- Requires authentication and org membership verification
- Returns full scan data with parsed extraction results

### 5. DocumentScanner Component (`src/components/documents/DocumentScanner.tsx`)
- 'use client' component with comprehensive scan UI:
  - Drag-and-drop upload area with camera icon and emerald/teal styling
  - File type selector (Auto-detect / COI / License / Bond) using shadcn Select
  - Upload progress indicator with simulated progress bar
  - Scan results display:
    - Document type detected with icon (ShieldHalf for COI, GraduationCap for License, Shield for Bond)
    - Confidence score with animated progress bar and color coding (green/amber/red)
    - Confidence label (High/Medium/Low)
    - Extracted fields in clean card layout with 2-column grid
    - Boolean fields (additionalInsured, etc.) shown as badges
    - Currency formatting for monetary amounts
    - Date formatting with locale support
    - Endorsement types as badges
    - "Copy Data" button for clipboard copy
    - "Scan Another" button to reset
    - Raw AI Response expandable section with ScrollArea
  - Error display with dismiss button
  - Scan history list showing recent scans
  - framer-motion animations (fade-in, slide, progress bar animation)
  - Dark mode support throughout
  - Emerald/teal color scheme (no indigo/blue)
  - RTL-safe positioning

### 6. ScanTips Component (`src/components/documents/DocumentScanner.tsx`)
- Best practices card with 4 tips:
  1. Use high-resolution images
  2. Ensure document is fully visible
  3. Good lighting helps accuracy
  4. Select type manually if auto-detect has low confidence

### 7. Document Scanner Page (`src/app/[locale]/(dashboard)/documents/scan/page.tsx`)
- Page component hosting DocumentScanner and ScanTips
- Header with ScanSearch icon, AI badge, title and description
- 3-column grid layout: Scanner (2 cols) + Tips sidebar (1 col)
- Fetches scan history from API on mount
- i18n support with `useTranslations('documentScanner')`

### 8. Sidebar Navigation Entry (`src/components/layout/Sidebar.tsx`)
- Added `ScanSearch` icon import from lucide-react
- Added `{ key: 'documentScanner', icon: ScanSearch, href: '/documents/scan' }` to tools section
- Placed between aiChat and analytics for logical grouping

### 9. Translation Keys Added
**English** (`src/messages/en.json`):
- Added `nav.documentScanner` = "Document Scanner"
- Added `documentScanner` namespace with 60+ keys including:
  - Core: title, description, uploadArea, uploadHint, browseFiles, scanning, scanComplete, scanFailed, scanDocument, clear, scanAnother
  - Document types: documentType, autoDetect, coi, license, bond, unknown
  - Confidence: confidence, highConfidence, mediumConfidence, lowConfidence
  - Actions: applyToForm, copyData, copiedToClipboard
  - Display: rawText, scanHistory, noHistory
  - Tips: tips, tip1, tip2, tip3, tip4
  - Errors: unsupportedFileType, fileTooLarge
  - COI fields: coiDetails, insuredName, policyNumber, insuranceProvider, holderName, effectiveDate, expirationDate, coverageAmount, perOccurrenceLimit, aggregateLimit, additionalInsured, primaryNoncontributory, waiverOfSubrogation, endorsementTypes
  - License fields: licenseDetails, licenseeName, licenseNumber, licenseTypeField, state, issueDate, issuingBoard, restrictions
  - Bond fields: bondDetails, bondNumber, bondType, principalName, obligeeName, suretyCompany, bondAmount

**Arabic** (`src/messages/ar.json`):
- Same 60+ keys with proper Arabic translations

### Verification
- `bun run lint` passes cleanly with no errors
- EN page: GET /en/documents/scan returns 200
- AR page: GET /ar/documents/scan returns 200
- API: GET /api/documents/scan returns 401 for unauthenticated users (correct)
- No compilation errors in dev server log

### Files Created
- `src/lib/document-scanner.ts` - VLM document scanner service
- `src/app/api/documents/scan/route.ts` - Scan API (POST + GET)
- `src/app/api/documents/scan/[id]/route.ts` - Individual scan result API
- `src/components/documents/DocumentScanner.tsx` - Scanner UI component
- `src/app/[locale]/(dashboard)/documents/scan/page.tsx` - Scanner page

### Files Modified
- `prisma/schema.prisma` - Added DocumentScan model + Organization relation
- `src/components/layout/Sidebar.tsx` - Added ScanSearch nav entry
- `src/messages/en.json` - Added documentScanner namespace + nav key
- `src/messages/ar.json` - Added documentScanner namespace + nav key
