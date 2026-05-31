# Refactor Plan — God Page Decomposition

> **Project:** license-vault  
> **Generated:** 2026-05-31  
> **Target maximum file size:** ~200 lines per file  
> **Naming convention:** `kebab-case.tsx` for component files  
> **Shared components** that appear across multiple pages should be placed in a shared directory (e.g., `@/components/ui/` for generic UI or `@/components/shared/` for domain-specific shared components).

---

## Summary Table

| # | File | Lines | Proposed Splits |
|---|------|-------|-----------------|
| 1 | contractor-network/page.tsx | 2,501 | 15 |
| 2 | insurance/page.tsx | 1,462 | 9 |
| 3 | subcontractors/page.tsx | 1,357 | 10 |
| 4 | qualifiers/page.tsx | 1,344 | 10 |
| 5 | settings/branding/page.tsx | 1,336 | 10 |
| 6 | analytics/page.tsx | 1,271 | 10 |
| 7 | projects/page.tsx | 1,224 | 10 |
| 8 | approvals/page.tsx | 1,213 | 9 |
| 9 | projects/[id]/page.tsx | 1,199 | 8 |
| 10 | settings/organization/page.tsx | 1,118 | 8 |
| 11 | licenses/[id]/page.tsx | 1,116 | 8 |
| 12 | settings/api/page.tsx | 1,106 | 8 |
| 13 | board-submissions/page.tsx | 1,096 | 9 |

---

## 1. contractor-network/page.tsx (2,501 lines)

### Purpose
Full contractor directory management: browsing contractors in grid/table views, searching/filtering, verified/preferred/blacklisted status management, add/edit/detail dialogs, bulk operations (verify, blacklist), CSV import/export, compliance score scoring, and contractor detail view with score breakdown.

### Proposed Splits

| # | Component / Module | Suggested Path | Responsibility |
|---|-------------------|----------------|----------------|
| 1 | **Page shell** (main export, state orchestration) | `contractor-network/page.tsx` (~150 lines) | Imports all sub-components, orchestrates global state (fetchContractors, fetchStats, pagination, search), renders layout composition |
| 2 | **Types & constants** | `contractor-network/types.ts` (~80 lines) | All interfaces (Contractor, PaginationInfo, ScoreBreakdown, DirectoryStats), US_STATES, TRADE_TYPES, LIMIT constant, animation variants |
| 3 | **ScoreRing** | `contractor-network/components/ScoreRing.tsx` (~60 lines) | SVG circular score indicator with color thresholds |
| 4 | **StarRating** | `contractor-network/components/StarRating.tsx` (~25 lines) | 5-star display component |
| 5 | **TradeBadge** | `contractor-network/components/TradeBadge.tsx` (~45 lines) | Color-coded trade type badge |
| 6 | **LicenseStatusBadge** | `contractor-network/components/LicenseStatusBadge.tsx` (~35 lines) | License status badge (active/expired/suspended/revoked) |
| 7 | **InsuranceStatusBadge** | `contractor-network/components/InsuranceStatusBadge.tsx` (~35 lines) | Insurance compliance badge |
| 8 | **StatsCards** | `contractor-network/components/StatsCards.tsx` (~80 lines) | Directory statistics cards (total/verified/preferred/avgScore) |
| 9 | **SearchFilterBar** | `contractor-network/components/SearchFilterBar.tsx` (~80 lines) | Search input, filter toggle, grid/table view toggle, filter panel (trade/state/license/insurance dropdowns) |
| 10 | **ContractorGridView** | `contractor-network/components/ContractorGridView.tsx` (~150 lines) | Grid cards with ScoreRing, badges, action buttons |
| 11 | **ContractorTableView** | `contractor-network/components/ContractorTableView.tsx` (~150 lines) | Table rows with selection checkboxes, all columns, actions |
| 12 | **AddContractorDialog** | `contractor-network/components/AddContractorDialog.tsx` (~200 lines) | Full add contractor form dialog with all ~18 fields |
| 13 | **ContractorDetailDialog** | `contractor-network/components/ContractorDetailDialog.tsx` (~200 lines) | Detail view with score breakdown, contact info, badges |
| 14 | **BulkActionBar** | `contractor-network/components/BulkActionBar.tsx` (~60 lines) | Floating bottom action bar for bulk verify/blacklist |
| 15 | **ImportDialog + CSV parsing** | `contractor-network/components/ImportHandler.tsx` (~120 lines) | CSV file import logic and dialog |

---

## 2. insurance/page.tsx (1,462 lines)

### Purpose
Insurance policy management: list/add/edit/delete insurance records and bonds, compliance tracking (compliant/deficient), policy type badges, endorsement tracking (AI, PNC, WoS, CG series), coverage details, premium tracking, auto-renew flag, verification of compliance, responsive table (desktop/tablet/mobile card views).

### Proposed Splits

| # | Component / Module | Suggested Path | Responsibility |
|---|-------------------|----------------|----------------|
| 1 | **Page shell** | `insurance/page.tsx` (~120 lines) | State orchestration, fetchData, filteredRecords, layout composition |
| 2 | **Types & constants** | `insurance/types.ts` (~80 lines) | InsuranceRecord, InsuranceSummary, FormData interfaces, ENDORSEMENT_OPTIONS, filterTabs |
| 3 | **Badge components** | `insurance/components/InsuranceBadges.tsx` (~120 lines) | getStatusBadge, getComplianceBadge, getTypeBadge, getEndorsementBadges |
| 4 | **Summary cards** | `insurance/components/InsuranceSummaryCards.tsx` (~80 lines) | Summary stat cards (total/active/expiring/expired/deficient) |
| 5 | **Filter tabs & search** | `insurance/components/InsuranceFilters.tsx` (~80 lines) | Filter tab buttons and search input |
| 6 | **Desktop/Medium/Mobile views** | `insurance/components/InsuranceTableView.tsx` (~200 lines) | All three responsive table views in one component or split further |
| 7 | **Add/Edit dialog** | `insurance/components/InsuranceFormDialog.tsx` (~200 lines) | Full form dialog with coverage details, endorsements, requirements |
| 8 | **Utility functions** | `insurance/utils.ts` (~30 lines) | formatCurrency, formatDate, parseEndorsementTypes |
| 9 | **Delete confirmation** | Shared AlertDialog (reuse `@/components/ui/alert-dialog`) | — |

---

## 3. subcontractors/page.tsx (1,357 lines)

### Purpose
Subcontractor management: list/add/edit/delete subcontractors, compliance status tracking, COI document request workflow, upload link generation, bulk document requests, license/insurance expiry tracking, detail view with contact/license/insurance info.

### Proposed Splits

| # | Component / Module | Suggested Path | Responsibility |
|---|-------------------|----------------|----------------|
| 1 | **Page shell** | `subcontractors/page.tsx` (~120 lines) | Orchestration, fetchSubcontractors, state, layout |
| 2 | **Types & constants** | `subcontractors/types.ts` (~60 lines) | Subcontractor, PaginationInfo, StatusCounts interfaces, US_STATES |
| 3 | **Badge components** | `subcontractors/components/SubcontractorBadges.tsx` (~60 lines) | ComplianceBadge, InsuranceBadge |
| 4 | **Stats cards** | `subcontractors/components/SubcontractorStats.tsx` (~80 lines) | Total/active/compliant/non-compliant stat cards |
| 5 | **Filter tabs** | `subcontractors/components/SubcontractorFilters.tsx` (~60 lines) | Status filter tabs (all/compliant/pending review/non-compliant) |
| 6 | **TableView** | `subcontractors/components/SubcontractorTable.tsx` (~120 lines) | Desktop table view with selection, action buttons |
| 7 | **CardView** | `subcontractors/components/SubcontractorCards.tsx` (~120 lines) | Mobile/desktop card grid view |
| 8 | **Add/Edit dialog** | `subcontractors/components/SubcontractorFormDialog.tsx` (~200 lines) | Form with company/contact/license/insurance fields |
| 9 | **Detail dialog** | `subcontractors/components/SubcontractorDetailDialog.tsx` (~150 lines) | Full detail display with contact/license/insurance sections |
| 10 | **Bulk operations** | `subcontractors/components/BulkActionBar.tsx` (~80 lines) | Floating bulk request bar + COI request dialog |

---

## 4. qualifiers/page.tsx (1,344 lines)

### Purpose
Qualifier (licensed personnel) management: list/add/edit/delete qualifiers, CE hour tracking with progress bars, license expiry monitoring, status badges, qualifier-to-license linking, detail view with linked licenses, un-linking licenses.

### Proposed Splits

| # | Component / Module | Suggested Path | Responsibility |
|---|-------------------|----------------|----------------|
| 1 | **Page shell** | `qualifiers/page.tsx` (~120 lines) | Orchestration, fetchQualifiers, layout |
| 2 | **Types & constants** | `qualifiers/types.ts` (~60 lines) | Qualifier, LinkedLicense, OrgLicense, StatusCounts interfaces, US_STATES |
| 3 | **CE progress bar** | `qualifiers/components/CEProgressBar.tsx` (~55 lines) | CE hours earned/required progress indicator |
| 4 | **StatusBadge** | `qualifiers/components/QualifierStatusBadge.tsx` (~35 lines) | active/expiring/expired/ce_deficient badge |
| 5 | **Stats cards** | `qualifiers/components/QualifierStats.tsx` (~80 lines) | Total/active/at-risk/CE-deficient cards |
| 6 | **Qualifier filters** | `qualifiers/components/QualifierFilters.tsx` (~40 lines) | Search + status dropdown |
| 7 | **Table/Card views** | `qualifiers/components/QualifierListViews.tsx` (~150 lines) | Desktop table (with CE progress) and mobile card grid |
| 8 | **Add/Edit dialog** | `qualifiers/components/QualifierFormDialog.tsx` (~200 lines) | Form with personal info, license details, CE hours |
| 9 | **Detail dialog** | `qualifiers/components/QualifierDetailDialog.tsx` (~180 lines) | Detail display + linked licenses list + link license functionality |
| 10 | **Link license dialog** | `qualifiers/components/LinkLicenseDialog.tsx` (~80 lines) | License selection + role assignment |

---

## 5. settings/branding/page.tsx (1,336 lines)

### Purpose
Organization branding customization: logo/favicon uploads, company name/tagline, color theme (primary/secondary/accent/dark mode), font selection (heading/body with size scale), login page customization, email template customization, portal settings (subdomain, welcome message, compliance score toggle, footer), custom CSS/JS injection, import/export/reset config, live previews.

### Proposed Splits

| # | Component / Module | Suggested Path | Responsibility |
|---|-------------------|----------------|----------------|
| 1 | **Page shell** | `settings/branding/page.tsx` (~100 lines) | State orchestration, fetchBranding, save, layout with Tabs |
| 2 | **Types & constants** | `settings/branding/types.ts` (~80 lines) | BrandingColors, BrandingFonts, BrandingLoginPage, BrandingEmailTemplates, BrandingPortal, BrandingConfig, DEFAULT_COLORS, THEME_PRESETS, FONT_OPTIONS |
| 3 | **ColorPicker component** | `settings/branding/components/ColorPicker.tsx` (~25 lines) | Hex color input with visual swatch |
| 4 | **Logo/Identity tab** | `settings/branding/components/LogoIdentityTab.tsx` (~100 lines) | Logo upload, favicon, company name, tagline |
| 5 | **Color Theme tab** | `settings/branding/components/ColorThemeTab.tsx` (~150 lines) | Primary/secondary/accent/dark color pickers, swatches, presets |
| 6 | **Typography tab** | `settings/branding/components/TypographyTab.tsx` (~100 lines) | Heading/body font selection, scale, live preview |
| 7 | **Login/Email/Portal tabs** | `settings/branding/components/LoginEmailPortalTabs.tsx` (~250 lines) | Login page, email template, portal settings forms with previews |
| 8 | **Preview components** | `settings/branding/components/Previews.tsx` (~150 lines) | MiniPreview, LoginPagePreview, EmailPreview, PortalPreview |
| 9 | **Advanced tab** | `settings/branding/components/AdvancedTab.tsx` (~80 lines) | Custom CSS, Head JS, Body JS textareas |
| 10 | **Import/Export/Reset actions** | `settings/branding/components/BrandingActions.tsx` (~80 lines) | Export JSON, import JSON, reset to defaults |

---

## 6. analytics/page.tsx (1,271 lines)

### Purpose
Analytics dashboard: overview cards (compliance score, financial exposure, risk items, portfolio health), compliance trend line chart, cost of non-compliance calculator with parameters, team activity analytics (user bar chart, action pie chart, most active users), portfolio optimization (recommendations, state coverage grid), custom report builder (type/date/state/format filters, PDF/CSV generation), scheduled report configuration.

### Proposed Splits

| # | Component / Module | Suggested Path | Responsibility |
|---|-------------------|----------------|----------------|
| 1 | **Page shell** | `analytics/page.tsx` (~80 lines) | Orchestration of all fetch functions, layout |
| 2 | **Types & constants** | `analytics/types.ts` (~50 lines) | OverviewData, TrendPoint, CostData, CostLicense, interface definitions, US_STATES, CHART_COLORS, PIE_COLORS |
| 3 | **Overview cards** | `analytics/components/OverviewCards.tsx` (~80 lines) | 4 stat cards with icons and gradient backgrounds |
| 4 | **Compliance trend chart** | `analytics/components/ComplianceTrendChart.tsx` (~100 lines) | Line chart with period selector |
| 5 | **Cost calculator** | `analytics/components/CostCalculator.tsx` (~200 lines) | Cost summary cards, parameters, license breakdown table |
| 6 | **Team activity** | `analytics/components/TeamActivity.tsx` (~180 lines) | Bar chart, pie chart, most active users |
| 7 | **Portfolio optimization** | `analytics/components/PortfolioOptimization.tsx` (~180 lines) | Recommendations list, state coverage grid |
| 8 | **Report builder** | `analytics/components/ReportBuilder.tsx` (~200 lines) | Type/date/state/format selectors, generate handler |
| 9 | **Scheduled reports** | `analytics/components/ScheduledReports.tsx` (~150 lines) | Frequency, report type, format, recipients management |
| 10 | **Shared helper components** | `analytics/components/AnalyticsHelpers.tsx` (~60 lines) | OverviewCard, CostCard, getTrendIcon, getSeverityBadge |

---

## 7. projects/page.tsx (1,224 lines)

### Purpose
Project management: list/create/edit/delete projects, compliance score tracking, project detail view with linked licenses and subcontractors, link/unlink operations for both, search/filter by status, stats cards (total/active/compliance rate/at risk).

### Proposed Splits

| # | Component / Module | Suggested Path | Responsibility |
|---|-------------------|----------------|----------------|
| 1 | **Page shell** | `projects/page.tsx` (~100 lines) | Orchestration, fetchProjects, layout |
| 2 | **Types** | `projects/types.ts` (~60 lines) | Project, ProjectLicense, ProjectSub, OrgLicense, OrgSubcontractor interfaces |
| 3 | **Score circle component** | `projects/components/ComplianceScoreCircle.tsx` (~60 lines) | SVG compliance ring |
| 4 | **Status badge** | `projects/components/ProjectStatusBadge.tsx` (~30 lines) | active/completed/on_hold badge |
| 5 | **Stats & filter bar** | `projects/components/ProjectStatsAndFilters.tsx` (~80 lines) | Stats cards + search + status dropdown |
| 6 | **Project card grid** | `components/projects/ProjectCardGrid.tsx` (~120 lines) | Card items with compliance scores, click-to-detail |
| 7 | **Add/Edit project dialog** | `components/projects/ProjectFormDialog.tsx` (~180 lines) | Form with client, location, dates, requirements |
| 8 | **Project detail dialog** | `components/projects/ProjectDetailDialog.tsx` (~250 lines) | Tabs: overview, licenses, subcontractors with link/unlink |
| 9 | **Link dialogs** | `components/projects/LinkLicenseDialog.tsx` + `LinkSubDialog.tsx` (~80 lines each) | License/subcontractor selection dialogs |
| 10 | **Delete confirmation** | Shared AlertDialog | — |

---

## 8. approvals/page.tsx (1,213 lines)

### Purpose
Approval workflow: list/create approval requests (license renewal, document review, CE verification, insurance update), status management (pending/approved/rejected/cancelled), priority levels (urgent/high/medium/low), type badges, review with notes, detail view with timeline, cancel requests, stats pagination.

### Proposed Splits

| # | Component / Module | Suggested Path | Responsibility |
|---|-------------------|----------------|----------------|
| 1 | **Page shell** | `approvals/page.tsx` (~80 lines) | Orchestration, fetchApprovals/fetchStats, layout |
| 2 | **Types & badge helpers** | `approvals/types.ts` (~80 lines) | ApprovalItem, ApprovalStats interfaces + getTypeBadge, getPriorityBadge, getStatusBadge, formatRelativeTime |
| 3 | **Stats cards** | `approvals/components/ApprovalStats.tsx` (~80 lines) | Total/pending/approved/rejected cards |
| 4 | **Filter bar** | `approvals/components/ApprovalFilters.tsx` (~60 lines) | Status tabs, search, type/priority filter dropdowns |
| 5 | **Desktop table** | `approvals/components/ApprovalTable.tsx` (~120 lines) | Table rows with all columns, action buttons, dropdown menu |
| 6 | **Mobile cards** | `approvals/components/ApprovalCards.tsx` (~120 lines) | Card layout for mobile |
| 7 | **New request dialog** | `approvals/components/NewRequestDialog.tsx` (~100 lines) | Title, description, type, priority form |
| 8 | **Review dialog** | `approvals/components/ReviewDialog.tsx` (~100 lines) | Approve/reject with notes textarea |
| 9 | **Detail dialog** | `approvals/components/ApprovalDetailDialog.tsx` (~150 lines) | Info grid, timeline, action buttons |

---

## 9. projects/[id]/page.tsx (1,199 lines)

### Purpose
Single project detail view: gradient header with project info, compliance score with ring visualization, project info (client, dates, location), license tab with link/unlink, subcontractor tab with link/unlink, compliance tab with license/sub compliance scores, heatmap, gap analysis.

### Proposed Splits

| # | Component / Module | Suggested Path | Responsibility |
|---|-------------------|----------------|----------------|
| 1 | **Page shell** | `projects/[id]/page.tsx` (~80 lines) | Orchestration, fetchProject, layout with Tabs |
| 2 | **Types** | `projects/[id]/types.ts` (~40 lines) | ComplianceData, LicenseOption, SubOption interfaces |
| 3 | **Header** | `components/projects/ProjectDetailHeader.tsx` (~60 lines) | Gradient header with back button, name, status badge, description |
| 4 | **Overview tab** | `components/projects/ProjectOverviewTab.tsx` (~120 lines) | Compliance ring, info grid, timeline bar, key metrics, notes |
| 5 | **Licenses tab** | `components/projects/ProjectLicensesTab.tsx` (~130 lines) | Linked licenses list, status indicators, remove buttons |
| 6 | **Subcontractors tab** | `components/projects/ProjectSubsTab.tsx` (~130 lines) | Linked subcontractors list, compliance status, remove buttons |
| 7 | **Compliance tab** | `components/projects/ProjectComplianceTab.tsx` (~150 lines) | Score breakdown, risk level, heatmap grid, gaps list |
| 8 | **Add link dialogs** | `components/projects/AddLicenseDialog.tsx` + `AddSubDialog.tsx` (~100 lines each) | Link forms with selection, role, notes |

---

## 10. settings/organization/page.tsx (1,118 lines)

### Purpose
Organization settings: profile editing (name, trade type, state, company name), branding & customization (logo, primary color, login message with live preview), organization hierarchy management (parent/subsidiary visual tree, add/unlink subsidiaries), cross-org compliance dashboard (summary cards, bar chart, comparison table), plan & billing info with usage bars.

### Proposed Splits

| # | Component / Module | Suggested Path | Responsibility |
|---|-------------------|----------------|----------------|
| 1 | **Page shell** | `settings/organization/page.tsx` (~80 lines) | Orchestration, fetchSettings/fetchHierarchy/fetchCrossCompliance |
| 2 | **Types & constants** | `settings/organization/types.ts` (~60 lines) | OrgSettings, HierarchyData, CrossComplianceData, SubsidiaryInfo interfaces, US_STATES, TRADE_TYPES |
| 3 | **Profile card** | `settings/organization/components/OrgProfileCard.tsx` (~120 lines) | Form with name, company name, trade type, state fields |
| 4 | **Branding card** | `settings/organization/components/OrgBrandingCard.tsx` (~150 lines) | Logo URL, color picker, login message + preview |
| 5 | **Hierarchy card** | `settings/organization/components/OrgHierarchyCard.tsx` (~200 lines) | Visual tree, subsidiary cards, add subsidiary dialog |
| 6 | **Cross-compliance card** | `settings/organization/components/CrossComplianceCard.tsx` (~180 lines) | Summary cards, bar chart, comparison table |
| 7 | **Plan & billing card** | `settings/organization/components/PlanBillingCard.tsx` (~120 lines) | Plan badge, upgrade button, usage bars |
| 8 | **Helper functions** | `settings/organization/utils.ts` (~40 lines) | getComplianceColor, getComplianceIcon, getPlanBadge |

---

## 11. licenses/[id]/page.tsx (1,116 lines)

### Purpose
License detail view: breadcrumb navigation, header with status/renewal badges, tabbed interface (overview/documents/activity), quick stats cards, renewal preview banner, editable license details form, auto-renew toggle, renewal history timeline, activity log timeline, mobile sticky action bar.

### Proposed Splits

| # | Component / Module | Suggested Path | Responsibility |
|---|-------------------|----------------|----------------|
| 1 | **Page shell** | `licenses/[id]/page.tsx` (~100 lines) | Orchestration, fetchLicense, fetchActivity, layout with Tabs, RenewalDialog |
| 2 | **Types & constants** | `licenses/[id]/types.ts` (~40 lines) | LicenseData, ActivityEntry interfaces, ACTIVITY_CONFIG |
| 3 | **Header** | `components/licenses/LicenseDetailHeader.tsx` (~80 lines) | Breadcrumb, back button, title, status badges, edit mode badge |
| 4 | **Overview tab** | `components/licenses/LicenseOverviewTab.tsx` (~200 lines) | Quick stats, renewal preview, detail display/edit form |
| 5 | **Activity config & helpers** | `components/licenses/ActivityConfig.tsx` (~60 lines) | ACTIVITY_CONFIG map, DEFAULT_ACTIVITY_CONFIG, getRelativeTime |
| 6 | **Activity timeline** | `components/licenses/ActivityTimeline.tsx` (~120 lines) | Timeline display with icons, descriptions, relative times |
| 7 | **Renewal history** | `components/licenses/RenewalHistory.tsx` (~60 lines) | Parsed renewal history display |
| 8 | **Mobile action bar** | `components/licenses/MobileActionBar.tsx` (~70 lines) | Sticky bottom bar for mobile with edit/renew/delete buttons |
| 9 | **Shared sub-components** | `components/licenses/DetailRow.tsx` + `QuickStatCard.tsx` (~25+30 lines) | Reusable display components |

---

## 12. settings/api/page.tsx (1,106 lines)

### Purpose
API access management: API key CRUD (create, list, revoke) with permissions (read/write/admin), webhook CRUD (create, edit, delete, test) with event selection, API documentation section (base URL, auth header reference, endpoint list, curl example, event types reference), collapsible docs panel.

### Proposed Splits

| # | Component / Module | Suggested Path | Responsibility |
|---|-------------------|----------------|----------------|
| 1 | **Page shell** | `settings/api/page.tsx` (~80 lines) | Orchestration, fetchApiKeys/fetchWebhooks |
| 2 | **Types & constants** | `settings/api/types.ts` (~40 lines) | ApiKeyData, WebhookData interfaces, WEBHOOK_EVENTS |
| 3 | **API Keys section** | `settings/api/components/ApiKeysSection.tsx` (~150 lines) | Key list, create dialog, revoke confirmation |
| 4 | **Webhooks section** | `settings/api/components/WebhooksSection.tsx` (~180 lines) | Webhook list, create/edit dialog, delete/test actions |
| 5 | **Created key display** | `settings/api/components/CreatedKeyDialog.tsx` (~60 lines) | Warning + key display + copy |
| 6 | **Webhook form** | `settings/api/components/WebhookFormDialog.tsx` (~150 lines) | Name, URL, event checkboxes, create/update |
| 7 | **API docs section** | `settings/api/components/ApiDocsSection.tsx` (~180 lines) | Base URL, auth, endpoints, curl example, event types |
| 8 | **Helper functions** | `settings/api/utils.ts` (~40 lines) | formatDate, getEventLabel, getPermissionBadge |

---

## 13. board-submissions/page.tsx (1,096 lines)

### Purpose
Board submission management: list/create/edit/delete submissions to licensing boards, multi-step wizard (type/state → board info → form fields → checklist → cover letter → review), status tracking (draft/ready/submitted/under_review/approved/rejected/returned), priority levels, checklist management, audit trail, board response tracking, filing fee tracking, template auto-fill.

### Proposed Splits

| # | Component / Module | Suggested Path | Responsibility |
|---|-------------------|----------------|----------------|
| 1 | **Page shell** | `board-submissions/page.tsx` (~80 lines) | Orchestration, fetchSubmissions, layout with Tabs |
| 2 | **Types & constants** | `board-submissions/types.ts` (~60 lines) | BoardSubmission, SubmissionStats, StatusCounts, Template interfaces, US_STATES, SUBMISSION_TYPES, PRIORITIES |
| 3 | **Badge helpers** | `board-submissions/components/SubmissionBadges.tsx` (~60 lines) | getStatusColor, getPriorityColor, getSubmissionTypeIcon |
| 4 | **Stats & filters** | `board-submissions/components/SubmissionStatsAndFilters.tsx` (~100 lines) | Stats cards + search + state/type/priority filter dropdowns |
| 5 | **Submission list** | `board-submissions/components/SubmissionList.tsx` (~120 lines) | Card items with status/priority/type badges, action buttons |
| 6 | **Wizard (5 steps)** | `board-submissions/components/SubmissionWizard.tsx` (~300 lines) | Multi-step form: type/state → board info → form fields → checklist → cover letter → review |
| 7 | **Detail dialog** | `board-submissions/components/SubmissionDetailDialog.tsx` (~200 lines) | Info grid, board info, form fields, checklist, cover letter, response, audit trail |
| 8 | **Submit/Delete confirmations** | Shared AlertDialogs | — |
| 9 | **Status update actions** | `board-submissions/components/StatusActions.tsx` (~60 lines) | Mark under review, mark approved, mark rejected buttons |

---

## Cross-Cutting Shared Components

The following components are repeated across multiple pages and should be extracted to shared locations:

| Component | Used In | Suggested Shared Path |
|-----------|---------|----------------------|
| **StatsCard** (gradient card with icon) | contractor-network, subcontractors, qualifiers, projects, approvals, analytics, board-submissions | `@/components/shared/StatsCard.tsx` |
| **EmptyState** (icon + title + description + action button) | Nearly all pages | `@/components/shared/EmptyState.tsx` |
| **StatusBadge** (color-coded status badge) | contractor-network, subcontractors, qualifiers, projects, approvals, licenses/[id], board-submissions | `@/components/shared/StatusBadge.tsx` |
| **ComplianceScoreRing** (SVG ring) | contractor-network, projects, projects/[id] | `@/components/shared/ComplianceScoreRing.tsx` |
| **Badge helpers** (getTypeBadge, getPriorityBadge, etc.) | approvals, board-submissions | `@/components/shared/BadgeHelpers.tsx` |
| **DeleteConfirmationDialog** | All pages with delete | `@/components/shared/DeleteConfirmationDialog.tsx` |
| **useDebouncedSearch** hook | contractor-network, subcontractors, qualifiers | `@/hooks/useDebouncedSearch.ts` |
| **US_STATES constant** | contractor-network, subcontractors, qualifiers, analytics, settings/organization, board-submissions | `@/lib/constants.ts` |
| **formatDate / formatCurrency** | insurance, projects, settings/api, board-submissions | Already in `@/lib/utils.ts` — extend if needed |

---

## Recommended Refactoring Order

1. **Extract shared components first** (StatsCard, EmptyState, StatusBadge, ComplianceScoreRing, US_STATES constant, useDebouncedSearch hook)
2. **Extract types/interfaces** into separate `types.ts` files for each page
3. **Extract utility functions** (badge helpers, formatters) into `utils.ts` files
4. **Decompose pages from smallest to largest** — start with files that have clearer separation:
   - `settings/api/page.tsx` (clean section separation)
   - `licenses/[id]/page.tsx` (clear tab separation)
   - `approvals/page.tsx` (clear dialog separation)
   - `settings/organization/page.tsx` (clear card separation)
   - `board-submissions/page.tsx` (wizard is naturally separable)
   - `projects/page.tsx` and `projects/[id]/page.tsx`
   - `analytics/page.tsx`
   - `settings/branding/page.tsx`
   - `insurance/page.tsx`
   - `qualifiers/page.tsx`
   - `subcontractors/page.tsx`
   - `contractor-network/page.tsx` (largest, refactor last)

---

## Additional God Files (>200 lines)

The following files also exceed the 200-line target but are smaller than the top 13 above. Each should be decomposed during the refactor phase:

| # | File | Lines | Suggested Approach |
|---|------|-------|-------------------|
| 14 | `src/app/[locale]/page.tsx` | 1,015 | Landing page: extract hero, features, testimonials, FAQ, footer sections into separate components |
| 15 | `src/app/[locale]/(dashboard)/state-requirements/page.tsx` | 944 | Extract comparison table, state detail card, requirement form |
| 16 | `src/app/[locale]/(dashboard)/integrations/page.tsx` | 936 | Extract integration catalog, connected integrations list, config forms |
| 17 | `src/app/[locale]/(dashboard)/compliance/page.tsx` | 913 | Already imports MultiStateSection and ForecastSection; extract compliance table, AI recommendations panel |
| 18 | `src/lib/email-templates.ts` | 877 | Extract individual template functions into separate files per type (expiration, renewal, invite, reset) |
| 19 | `src/app/[locale]/(dashboard)/vendor-scores/page.tsx` | 839 | Extract score cards, risk matrix, assessment form |
| 20 | `src/components/documents/DocumentScanner.tsx` | 817 | Extract upload zone, scan results, field extraction display |
| 21 | `src/app/[locale]/(dashboard)/workflows/page.tsx` | 807 | Extract workflow list, workflow detail, builder integration |
| 22 | `src/app/[locale]/(dashboard)/ce-tracking/page.tsx` | 798 | Extract CE table, progress chart, add/edit form |
| 23 | `src/lib/pdf-report.ts` | 784 | Extract report builders per type (compliance, license, expiration) |
| 24 | `src/app/[locale]/(dashboard)/checklists/page.tsx` | 778 | Extract template list, instance list, editor integration |
| 25 | `src/app/[locale]/(dashboard)/admin/automation/page.tsx` | 772 | Extract automation history, settings panel, run controls |
| 26 | `src/scripts/seed-state-requirements.ts` | 767 | Extract state data arrays into JSON data files |
| 27 | `src/app/[locale]/(dashboard)/team/page.tsx` | 746 | Extract member list, invite form, role management |
| 28 | `src/app/[locale]/(dashboard)/license-applications/[id]/page.tsx` | 724 | Extract application wizard steps, document upload, status timeline |
| 29 | `src/app/[locale]/(dashboard)/reciprocity/page.tsx` | 721 | Extract reciprocity map, state comparison table |
| 30 | `src/app/[locale]/(dashboard)/regulatory-alerts/page.tsx` | 675 | Extract alert list, detail panel, filters |
| 31 | `src/app/[locale]/(dashboard)/signatures/page.tsx` | 673 | Extract signature list, request form, audit trail |
| 32 | `src/app/[locale]/sign/[token]/page.tsx` | 672 | Extract signing canvas, document preview, status display |
| 33 | `src/app/[locale]/(dashboard)/reports/page.tsx` | 671 | Extract report builder, schedule config, history |
| 34 | `src/lib/email.ts` | 669 | Extract SMTP config, send functions, template renderer |
| 35 | `src/app/[locale]/(dashboard)/alerts/page.tsx` | 666 | Extract alert list rule editor, notification preferences |
| 36 | `src/components/licenses/DocumentManager.tsx` | 638 | Extract upload zone, document grid, preview modal |
| 37 | `src/app/[locale]/(dashboard)/admin/security/page.tsx` | 633 | Extract security stats, login attempts, session management |
| 38 | `src/app/[locale]/(dashboard)/dashboard/page.tsx` | 631 | Extract quick actions, recent licenses table; already delegates to shared components |
| 39 | `src/app/[locale]/(dashboard)/developer-settings/api-docs/page.tsx` | 622 | Extract API endpoint docs, key management, usage examples |
| 40 | `src/app/[locale]/(dashboard)/licenses/calendar/page.tsx` | 612 | Extract calendar view, month/week toggles, event popups |
| 41 | `src/app/subcontractor-portal/[token]/page.tsx` | 605 | Extract upload form, document status, compliance checklist |
| 42 | `src/app/[locale]/(dashboard)/settings/profile/page.tsx` | 598 | Extract profile form, password change, preferences |
| 43 | `src/app/[locale]/(auth)/signup/page.tsx` | 573 | Extract steps into wizard components (account, org, confirmation) |
| 44 | `src/app/[locale]/(dashboard)/admin/page.tsx` | 567 | Extract stats cards, system health, quick actions |
| 45 | `src/app/[locale]/(dashboard)/business-entities/[id]/page.tsx` | 554 | Extract entity detail, compliance status, license links |
| 46 | `src/app/[locale]/(dashboard)/licenses/page.tsx` | 546 | Already relatively well-structured; extract filters bar, bulk actions |
| 47 | `src/app/[locale]/(dashboard)/licenses/new/page.tsx` | 531 | Extract form sections (basic info, dates, location, documents) |
| 48 | `src/app/[locale]/(dashboard)/licenses/[id]/report/page.tsx` | 524 | Extract report sections, export options |
| 49 | `src/app/[locale]/(dashboard)/notifications/page.tsx` | 521 | Extract notification list, preference settings, filters |
| 50 | `src/app/api/reports/pdf/route.ts` | 513 | Separate route handler from PDF generation logic |
| 51 | `src/app/[locale]/(dashboard)/onboarding/page.tsx` | 510 | Extract wizard steps into individual components |
| 52 | `src/app/[locale]/(dashboard)/ai-chat/page.tsx` | 497 | Extract chat input, message list, suggested prompts |
| 53 | `src/app/[locale]/(dashboard)/documents/generate/page.tsx` | 496 | Extract template selector, form, preview |
| 54 | `src/app/[locale]/(dashboard)/workflows/[id]/page.tsx` | 493 | Extract step editor, variables panel, instance history |
| 55 | `src/app/[locale]/(dashboard)/settings/page.tsx` | 487 | Extract settings sections into individual panels |
| 56 | `src/lib/document-scanner.ts` | 479 | Extract OCR logic, field extraction, validation |
| 57 | `src/app/api/cron/check-expirations/route.ts` | 468 | Separate route handler from business logic |
| 58 | `src/components/dashboard/ComplianceForecastWidget.tsx` | 458 | Extract chart, summary list, action buttons |
| 59 | `src/app/[locale]/(dashboard)/exams/page.tsx` | 449 | Extract exam table, schedule form, results display |
| 60 | `src/components/dashboard/MultiStateCompliance.tsx` | 447 | Extract state cards, summary row, drill-down view |
| 61 | `src/app/[locale]/(dashboard)/license-applications/page.tsx` | 443 | Extract application list, filters, status summary |
| 62 | `src/components/layout/GlobalSearchDialog.tsx` | 426 | Extract search results by type (licenses, projects, subs) |
| 63 | `src/components/workflows/WorkflowBuilder.tsx` | 418 | Extract step node editor, connection lines, properties panel |
| 64 | `src/components/compliance/ForecastSection.tsx` | 396 | Extract timeline, chart, filter controls |
| 65 | `src/components/licenses/LicenseTable.tsx` | 389 | Extract columns, row actions, bulk selection |
| 66 | `src/components/layout/Sidebar.tsx` | 333 | Extract nav groups, collapsible sections, mobile drawer |
| 67 | `src/components/dashboard/DashboardCharts.tsx` | 296 | One chart per file |
| 68 | `src/components/dashboard/ActivityTimeline.tsx` | 296 | Extract timeline items, group headers, empty state |
| 69 | `src/components/licenses/DocumentViewer.tsx` | 286 | Extract preview modal, thumbnail grid, toolbar |
| 70 | `src/components/layout/TopNav.tsx` | 296 | Extract search trigger, notification bell, user menu, mobile toggle |
| 71 | `src/lib/ai-proactive-alerts.ts` | 295 | Extract alert generators by type |
| 72 | `src/components/layout/NotificationDrawer.tsx` | 258 | Extract notification items, empty state, mark-all-read |
| 73 | `src/app/[locale]/(auth)/login/page.tsx` | 282 | Well-structured; minor extraction of social buttons |
| 74 | `src/app/[locale]/compliance/[token]/page.tsx` | 254 | Extract score display, license list, sharing controls |
| 75 | `src/components/pwa/PushNotificationPrompt.tsx` | 239 | Borderline; could be left as-is |
| 76 | `src/components/dashboard/RiskScoreGauge.tsx` | 239 | Borderline; could be left as-is |

### Total Scope

- **76 files** exceed the 200-line threshold in `src/`
- Combined total: approximately **40,000+ lines** across these files
- Estimated **200+ component files** after full decomposition
- Priority should be given to the top 13 files listed above (contractor-network through board-submissions)
- **lib/** files should be split by extracting coherent modules
- **scripts/** files should extract data into separate JSON/TS data files
