---
Task ID: 22-33
Agent: Main Agent
Task: Implement NASCLA Exam Tracking (Feature #22) and Business Entity Compliance Enhancement (Feature #33)

Work Log:

### Feature #22: NASCLA Exam Tracking

#### 1. Prisma Schema Updates
- Added `ExamTracking` model with fields: id, orgId, qualifierId, examType, examName, examProvider, state, status, examDate, score, passingScore, resultsReceived, registrationId, studyHours, notes, certificateUrl, createdAt, updatedAt
- Added `exams ExamTracking[]` relation to Organization model
- Added `exams ExamTracking[]` relation to Qualifier model
- Also added `WorkflowDefinition` and `WorkflowInstance` models that were referenced but missing from schema
- Ran `bun run db:push` successfully

#### 2. Exam Tracking API
- Created `src/app/api/exams/route.ts`:
  - GET: List exams with filtering by type, status, state, qualifierId. Includes stats (total, passed, failed, scheduled, pass rate)
  - POST: Create exam entry with Zod validation, audit logging
- Created `src/app/api/exams/[id]/route.ts`:
  - GET: Get exam details with qualifier info
  - PUT: Update exam (status, score, results, etc.) with audit logging
  - DELETE: Delete exam entry with audit logging
- Created `src/app/api/exams/stats/route.ts`:
  - GET: Aggregated stats - pass rate, upcoming exams, average study hours, exams by state, exams by type

#### 3. Exam Tracking Page
- Created `src/app/[locale]/(dashboard)/exams/page.tsx`:
  - Stat cards: Total Exams, Scheduled, Passed, Failed, Pass Rate %
  - Filter tabs: All, Scheduled, Passed, Failed
  - Exam list with exam type badges (NASCLA teal, state-specific amber, trade emerald)
  - Status badges (scheduled=sky, passed=emerald, failed=red, expired=gray)
  - Score display with pass/fail indicator
  - Exam date with countdown for upcoming exams
  - Qualifier name display (if linked)
  - State badges
  - Create exam dialog with: exam type dropdown, exam name, provider dropdown (PSI/Prometric/ICC/Other), state selection, date picker, qualifier linking, notes
  - Upcoming exams section with countdown timers
  - Study hours tracking display
  - Dark mode, responsive, emerald/teal color scheme

### Feature #33: Business Entity Compliance Enhancement

#### 1. Prisma Schema Updates
- Added `BusinessEntity` model with fields: id, orgId, name, entityType, formationState, formationDate, ein, registeredAgent, registeredAgentState, entityStatus, annualReportDue, annualReportFiled, franchiseTaxDue, franchiseTaxPaid, complianceScore, notes, parentId, createdAt, updatedAt
- Added `EntityLicense` model with fields: id, entityId, licenseId, role, createdAt (with @@unique on entityId+licenseId)
- Added `businessEntities BusinessEntity[]` relation to Organization model
- Added `entityLinks EntityLicense[]` relation to License model
- Self-referential hierarchy via "EntityHierarchy" relation (parent → subsidiaries)
- Ran `bun run db:push` successfully

#### 2. Business Entity API
- Created `src/app/api/business-entities/route.ts`:
  - GET: List entities with compliance scores, stats (total, active, atRisk, inactive), filtering by type/status
  - POST: Create entity with Zod validation, audit logging
- Created `src/app/api/business-entities/[id]/route.ts`:
  - GET: Get entity with parent, subsidiaries, linked licenses
  - PUT: Update entity with audit logging
  - DELETE: Delete entity with audit logging
- Created `src/app/api/business-entities/[id]/compliance/route.ts`:
  - GET: Detailed compliance check: annual report, franchise tax, license status, registered agent, entity status
  - Returns checks array with status (compliant/warning/critical/info), calculated score, overall status
- Created `src/app/api/business-entities/[id]/licenses/route.ts`:
  - POST: Link license to entity with role (holder/qualifier/additional)
  - DELETE: Unlink license from entity

#### 3. Business Entity Pages
- Created `src/app/[locale]/(dashboard)/business-entities/page.tsx`:
  - Stat cards: Total Entities, Active, At Risk, Inactive
  - Entity list with: entity type badge (LLC emerald, Corp teal, Sole Prop amber, Partnership slate), compliance score ring, status badge, formation state, annual report/franchise tax indicators, linked license count
  - Create entity dialog with all fields
  - Filter by type and status (Tabs + Select)
  - Delete action
  - Dark mode, responsive, emerald/teal colors
- Created `src/app/[locale]/(dashboard)/business-entities/[id]/page.tsx`:
  - Entity detail view with: entity info card, compliance score breakdown with SVG ring, compliance check cards (compliant/warning/critical/info), annual report & franchise tax status with due date warnings, linked licenses section, entity hierarchy (parent + subsidiaries)
  - Edit/delete actions
  - Dark mode, responsive

### Navigation Updates
- Updated `src/components/layout/Sidebar.tsx`:
  - Added "Exam Tracking" with GraduationCap icon under "Main" section → /exams
  - Added "Business Entities" with Building2 icon under "Management" section → /business-entities

### Translation Keys
- Added `exams` namespace with 30+ keys to both en.json and ar.json:
  - title, description, createExam, examType, nasclaGeneral, nasclaElectrical, nasclaPlumbing, nasclaHVAC, stateSpecific, tradeExam
  - status, scheduled, passed, failed, expired, cancelled
  - examDate, score, passingScore, provider, studyHours, registrationId
  - resultsReceived, certificate, qualifier, upcomingExams, passRate, totalExams
  - noExams, noExamsDesc, examName, examProvider, state, linkQualifier, notes
  - daysUntil, today, tomorrow, avgStudyHours, examDetails
  - deleteConfirm, deleteSuccess, createSuccess, updateSuccess, error
- Added `businessEntities` namespace with 30+ keys to both en.json and ar.json:
  - title, description, createEntity, entityType, llc, corporation, soleProprietor, partnership, llp
  - formationState, formationDate, ein, registeredAgent, entityStatus
  - active, dissolved, suspended, revoked
  - annualReport, franchiseTax, complianceScore, linkedLicenses
  - entityHierarchy, parentEntity, subsidiaries
  - totalEntities, atRisk, inactive, noEntities, noEntitiesDesc, entityName, notes
  - complianceCheck, overallStatus, compliant, warning, critical
  - annualReportDue, franchiseTaxDue, filed, paid, overdue, dueIn, noDueDate
  - linkedLicensesCount, linkLicense, unlinkLicense, licenseRole, holder, qualifierRole, additional
  - deleteConfirm, deleteSuccess, createSuccess, updateSuccess, error
  - registeredAgentState, complianceBreakdown, entityInfo
- Added nav keys: `nav.exams`, `nav.businessEntities`

### Verification
- `bun run lint` passes cleanly with no errors
- `bun run db:push` succeeds - schema in sync
- All pages return HTTP 200 in both EN and AR:
  - /en/exams → 200
  - /en/business-entities → 200
  - /ar/exams → 200
  - /ar/business-entities → 200
- No compilation errors

### Files Created
- `src/app/api/exams/route.ts`
- `src/app/api/exams/[id]/route.ts`
- `src/app/api/exams/stats/route.ts`
- `src/app/api/business-entities/route.ts`
- `src/app/api/business-entities/[id]/route.ts`
- `src/app/api/business-entities/[id]/compliance/route.ts`
- `src/app/api/business-entities/[id]/licenses/route.ts`
- `src/app/[locale]/(dashboard)/exams/page.tsx`
- `src/app/[locale]/(dashboard)/business-entities/page.tsx`
- `src/app/[locale]/(dashboard)/business-entities/[id]/page.tsx`

### Files Modified
- `prisma/schema.prisma` - Added ExamTracking, BusinessEntity, EntityLicense, WorkflowDefinition, WorkflowInstance models; added relations to Organization, License, Qualifier
- `src/components/layout/Sidebar.tsx` - Added Exam Tracking and Business Entities navigation entries
- `src/messages/en.json` - Added exams and businessEntities namespaces, nav keys
- `src/messages/ar.json` - Added exams and businessEntities namespaces, nav keys
