---
Task ID: 5
Agent: document-management-agent
Task: Implement real document management system for licenses (replace MOCK_DOCUMENTS with real API)

Work Log:

### 1. Updated Prisma Schema (`prisma/schema.prisma`)
- Added `LicenseDocument` model with fields: id, licenseId, orgId, fileName, fileType, fileSize, filePath, category, uploadedBy, createdAt
- Added `documents LicenseDocument[]` relation to License model
- Added `licenseDocuments LicenseDocument[]` relation to Organization model
- Category field defaults to "general" (supports: certificate, insurance, permit, renewal, general)
- Cascade delete on both relations (license and org)
- Ran `bun run db:push` successfully

### 2. Created Uploads Directory
- Created `uploads/` directory at project root
- Added `uploads/.gitkeep` for git tracking

### 3. Created Document List & Upload API (`src/app/api/licenses/[id]/documents/route.ts`)
- **GET**: Lists all documents for a license
  - Auth check with session + org membership
  - Verifies license belongs to user's org
  - Returns documents ordered by createdAt desc
  - Includes formatted file size
- **POST**: Upload a document via multipart form data
  - Auth check with session + org membership
  - Validates file type (pdf, jpg, jpeg, png, doc, docx only — no executables)
  - Validates file size (max 10MB)
  - Generates unique filename using crypto.randomBytes to avoid collisions
  - Stores file in uploads/ directory using fs/promises
  - Saves metadata to LicenseDocument table with uploadedBy (user name)
  - Creates audit log entry (action: DOCUMENT_UPLOADED)
  - Returns document metadata with 201 status

### 4. Created Document Download & Delete API (`src/app/api/licenses/[id]/documents/[docId]/route.ts`)
- **GET**: Download/serve a document file
  - Auth check with session + org membership
  - Verifies document belongs to user's org and license
  - Reads file from disk using fs/promises
  - Returns file with proper Content-Type and Content-Disposition headers
  - Supports inline viewing in browser for PDFs/images
- **DELETE**: Delete a document (owner/admin only)
  - Auth check with session + org membership + role check (owner/admin)
  - Deletes file from disk using fs/promises (continues if file already gone)
  - Creates audit log entry before deletion (action: DOCUMENT_DELETED)
  - Deletes metadata from database

### 5. Updated Frontend License Detail Page (`src/app/[locale]/(dashboard)/licenses/[id]/page.tsx`)
- Removed `MOCK_DOCUMENTS` constant
- Added `DocumentData` interface with real API fields (id, fileName, fileType, fileSize, fileSizeFormatted, category, uploadedBy, createdAt)
- Added state: `documents`, `documentsLoading`, `uploadingDoc`, `fileInputRef`
- Added `fetchDocuments` callback (fetches from `/api/licenses/${id}/documents`)
- Added `useEffect` to fetch documents when documents tab is active
- Added `handleFileUpload` callback:
  - Creates FormData with selected file
  - POSTs to `/api/licenses/${id}/documents`
  - Shows success/error toast
  - Refreshes document list after upload
  - Resets file input
- Added `handleDocumentDelete` callback:
  - DELETEs to `/api/licenses/${id}/documents/${docId}`
  - Shows success/error toast
  - Refreshes document list after deletion
- Added `handleDocumentView` callback:
  - Opens document in new tab via `/api/licenses/${id}/documents/${docId}`
- Updated Documents Tab UI:
  - Hidden file input with accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
  - Upload area now clickable (triggers file input)
  - Loading spinner (Loader2) shown during upload
  - "Uploading..." text during upload
  - Document loading skeleton (3 rows)
  - Real document data: fileName, uploadedBy, createdAt, fileSizeFormatted
  - View button opens document in new tab
  - Delete button with AlertDialog confirmation
  - DOCUMENT_UPLOADED and DOCUMENT_DELETED cases in activity tab description builder
- Added `Loader2` icon import from lucide-react

### 6. Added Translation Keys (EN + AR)
**English** (`src/messages/en.json`) — under `licenses.documents`:
- `uploading`: "Uploading..."
- `uploadSuccess`: "Document uploaded successfully"
- `deleteConfirmTitle`: "Delete Document"
- `deleteConfirmDesc`: "Are you sure you want to delete \"{name}\"? This action cannot be undone."
- `deleteSuccess`: "Document \"{name}\" deleted successfully"

**Arabic** (`src/messages/ar.json`) — under `licenses.documents`:
- `uploading`: "جاري الرفع..."
- `uploadSuccess`: "تم رفع المستند بنجاح"
- `deleteConfirmTitle`: "حذف المستند"
- `deleteConfirmDesc`: "هل أنت متأكد من حذف \"{name}\"؟ لا يمكن التراجع عن هذا الإجراء."
- `deleteSuccess`: "تم حذف المستند \"{name}\" بنجاح"

### Security & Validation
- All API routes require authentication (NextAuth session)
- All routes verify org membership before accessing documents
- File type validation: only pdf, jpg, jpeg, png, doc, docx allowed
- File size validation: max 10MB
- Delete restricted to owner/admin roles
- Unique filenames via crypto.randomBytes to prevent path traversal
- Audit logging for both upload and delete operations
- File path stored as relative name (not full path) for security

### Verification
- All lint checks pass cleanly
- Dev server compiles without errors
- API routes return 401 for unauthenticated requests (correct)
