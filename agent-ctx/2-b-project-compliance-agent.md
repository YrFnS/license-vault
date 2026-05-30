---
Task ID: 2-b
Agent: project-compliance-agent
Task: Build Phase 9.4 - Project-Level Compliance

Work Log:

### 1. API Routes Created

**GET/POST /api/projects** (`src/app/api/projects/route.ts`):
- GET: Lists projects for the org with pagination, search, status filter
- Computes compliance score for each project based on linked license statuses
- Returns counts (all, active, completed, on_hold) and stats (avgCompliance, atRiskCount)
- POST: Creates a project with Zod validation (name required, all other fields optional)
- Auth + owner/admin check for create
- Creates audit log entry

**GET/PUT/DELETE /api/projects/[id]** (`src/app/api/projects/[id]/route.ts`):
- GET: Returns single project with full details (projectLicenses with License details, projectSubs with Subcontractor details)
- Computes and updates real compliance score
- PUT: Updates project with same Zod validation, auth + role check
- DELETE: Deletes project, linked ProjectLicense and ProjectSubcontractor entries, creates audit log

**POST /api/projects/[id]/licenses** (`src/app/api/projects/[id]/licenses/route.ts`):
- Links a license to a project with body { licenseId, required, notes }
- Creates ProjectLicense entry, recalculates compliance score
- Auth + role check

**DELETE /api/projects/[id]/licenses/[licenseId]** (`src/app/api/projects/[id]/licenses/[licenseId]/route.ts`):
- Unlinks a license from a project
- Deletes ProjectLicense entry, recalculates compliance score

**POST /api/projects/[id]/subcontractors** (`src/app/api/projects/[id]/subcontractors/route.ts`):
- Links a subcontractor with body { subcontractorId, role }
- Creates ProjectSubcontractor entry

**DELETE /api/projects/[id]/subcontractors/[subcontractorId]** (`src/app/api/projects/[id]/subcontractors/[subcontractorId]/route.ts`):
- Unlinks a subcontractor from a project

**GET /api/projects/[id]/compliance** (`src/app/api/projects/[id]/compliance/route.ts`):
- Returns detailed compliance breakdown: each linked license's status (compliant/expiring_soon/expired), each sub's compliance
- Overall compliance score calculation based on active linked licenses / total linked licenses * 100

**GET /api/subcontractors** (`src/app/api/subcontractors/route.ts`):
- New endpoint to list org subcontractors for the link dialog

### 2. Frontend Page (`src/app/[locale]/(dashboard)/projects/page.tsx`)

- **Header**: Title "Projects" with description, "New Project" button (emerald gradient)
- **Stats Cards**: Total Projects, Active, Compliance Rate (avg score), At Risk (score < 60) with gradient backgrounds and color-coded icons
- **Search + Filters**: Search by name/client, filter by status (all/active/completed/on_hold)
- **Project Cards**: Grid layout (2 cols desktop, 1 mobile) with:
  - Project name, client name, location
  - Status badge (active=emerald, completed=teal, on_hold=amber)
  - Compliance score circular SVG indicator (color-coded: green ≥80, yellow ≥60, red <60)
  - License count, Subcontractor count
  - Date range (start - end)
  - Click to open detail dialog
- **New/Edit Project Dialog**: Full form with all project fields
- **Project Detail View** (dialog):
  - Overview tab: compliance score, project info, edit/delete actions
  - Licenses tab: linked licenses with status icons, link/unlink functionality
  - Subcontractors tab: linked subs with compliance status, link/unlink
- **Compliance Score**: Circular SVG indicator with color coding
- **framer-motion**: Animations for card entrance, fade-in, layout transitions
- **Dark mode, RTL-safe, emerald/teal palette**: No indigo/blue

### 3. Sidebar Navigation Update (`src/components/layout/Sidebar.tsx`)
- Added `FolderKanban` icon import from lucide-react
- Added projects nav item: `{ key: 'projects', icon: FolderKanban, href: '/projects' }`
- Placed after 'calendar' item in the main section

### 4. Translation Keys
- Added `nav.projects` = "Projects" to en.json and "المشاريع" to ar.json
- Added full "projects" namespace to both en.json and ar.json with 48+ translation keys each
- Keys include: title, description, newProject, editProject, deleteProject, projectDetails, name, description, clientName, clientEmail, location, state, startDate, endDate, status, active, completed, onHold, requiredLicenses, requiredInsurance, complianceScore, linkedLicenses, linkLicense, unlinkLicense, linkedSubcontractors, linkSubcontractor, unlinkSubcontractor, noProjects, noProjectsDesc, searchPlaceholder, allStatus, totalProjects, activeProjects, complianceRate, atRisk, overview, licenses, subcontractors, licenseCount, subCount, required, verified, unverified, compliant, nonCompliant, pending, deleteConfirm, deleteWarning, createSuccess, updateSuccess, deleteSuccess, linkSuccess, unlinkSuccess, subLinkSuccess, subUnlinkSuccess, highCompliance, mediumCompliance, lowCompliance

### 5. Verification
- `bun run lint` passes with no errors
- Both /en/projects and /ar/projects return HTTP 200
- API endpoints return 401 for unauthenticated requests (correct)
- No compilation errors in dev log

Stage Summary:
- 8 API endpoints created for full project-level compliance CRUD
- Comprehensive projects management page with stats, search, filters, detail view
- Sidebar navigation updated with FolderKanban icon
- 48+ translation keys added in both EN and AR
- Full i18n, dark mode, RTL-safe, emerald/teal palette
- Compliance score calculated from real linked license data
