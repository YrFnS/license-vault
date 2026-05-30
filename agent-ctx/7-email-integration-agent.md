---
Task ID: 7
Agent: email-integration-agent
Task: Add Real Email Sending Integration with z-ai-web-dev-sdk and Email Templates

Work Log:

### Step 1: Investigated z-ai-web-dev-sdk Capabilities

Reviewed the SDK's TypeScript definitions. The SDK provides:
- `chat.completions.create` / `createVision` — LLM chat completions
- `images.generations.create` / `edit` / `search.create` — Image generation
- `audio.tts.create` / `asr.create` — Audio
- `video.generations.create` — Video
- `functions.invoke` — Web search / page reader

**No native email sending API exists** in the SDK. Decision: Use the SDK's LLM chat completions for AI-enhanced email subject line generation, and keep Nodemailer for SMTP delivery.

### Step 2: Updated Email Service (`src/lib/email.ts`)

Complete rewrite of the email service with these enhancements:

1. **z-ai-web-dev-sdk Integration** — New `enhanceSubjectWithAI()` function uses the SDK's chat completions to generate more engaging, professional email subject lines. Falls back to the original subject if AI fails. Only applied to non-security-critical emails (password reset subjects are never modified).

2. **EmailLog Integration** — Every email attempt (sent, failed, rate-limited) is now logged to the `EmailLog` Prisma model with fields: orgId, to, subject, status, provider, providerId, error, sentAt, createdAt.

3. **Rate Limiting** — Added in-memory rate limiter: max 10 emails per minute per recipient. Rate-limited attempts are also logged to EmailLog with status "rate_limited".

4. **3 New Template Send Functions**:
   - `sendRenewalReminder()` — License renewal reminder with deadline info
   - `sendSubcontractorPortalInvite()` — Subcontractor portal access invitation
   - `sendWelcomeEmail()` — New user welcome email

5. **Template Name Mapping** — New `sendTemplateEmail()` function and `TemplateName` type for dynamic template dispatch by name (used by the API endpoint).

6. **All existing functions preserved** with backward-compatible signatures plus optional `orgId` parameter.

### Step 3: Updated Email Templates (`src/lib/email-templates.ts`)

1. **Enhanced base template** — Added gradient header, logo placeholder, footer links (manage preferences / unsubscribe), and `footerLinks` option.

2. **3 New Templates**:
   - **renewalReminderTemplate** (`RenewalReminderData`) — Shows license name, type, number, issuing authority, expiration date, days until deadline, numbered renewal steps, CTA to start renewal. Color-coded urgency.
   - **subcontractorPortalInviteTemplate** (`SubcontractorPortalInviteData`) — Portal access invitation with company name, numbered getting-started instructions, expiration warning banner.
   - **welcomeEmailTemplate** (`WelcomeEmailData`) — Welcome with org name, 4 getting-started steps with icons, AI assistant mention, CTA to dashboard.

3. **Enhanced existing templates**:
   - `passwordResetTemplate` — Added security warning banner
   - `teamInvitationTemplate` — Added role display card
   - `complianceReportTemplate` — Added stats row (total/active/expiring/expired), at-risk items list

### Step 4: Created Email Sending API Endpoint (`src/app/api/email/send/route.ts`)

New POST endpoint with:
- **Auth required** — Owner/admin role only
- **Zod validation** — Validates `to` (email), `template` (10 template names), `data` (record), `enhanceSubject` (boolean)
- **Alert preference checks**:
  - If `alertEmail` is false → 400 error
  - If `alertEmailCategories` is "none" → 400 error
  - If `alertEmailCategories` is "critical_only" → only expiration_alert, insurance_expiration, password_reset templates allowed
- **Audit log** — Creates AuditLog entry with action "email_sent" for every successful send
- **Template dispatch** — Uses `sendTemplateEmail()` to route to the correct template handler

### Step 5: Updated Alert Preferences APIs

Both `/api/alerts` and `/api/alerts/preferences` now support extended Zod enums:
- `alertEmailFrequency`: Added "none" option (was: immediate/daily/weekly)
- `alertEmailCategories`: Added "critical_only" and "none" options (was: licenses/insurance/ce/all)

These map directly to the existing Prisma `AlertPreference` model fields.

### Step 6: Added Translation Keys

Added `email` namespace with 30+ keys to both `en.json` and `ar.json`:
- Core: title, subtitle, sendEmail, sendSuccess, sendError, rateLimited
- Templates: 10 template name labels
- Frequency: 4 email frequency labels (immediate, daily, weekly, none)
- Categories: 3 category labels (all, critical_only, none)
- Logs: emailLogs, emailLogsDesc, noLogs, recipient, subject, sentAt, status (4 variants), provider
- AI: enhanceSubject, enhanceSubjectDesc
- Footer: managePreferences, unsubscribe

### Files Modified
- `src/lib/email.ts` — Complete rewrite with z-ai-web-dev-sdk + EmailLog + rate limiting
- `src/lib/email-templates.ts` — Added 3 new templates + enhanced 3 existing templates
- `src/app/api/alerts/preferences/route.ts` — Extended Zod enums for frequency/categories
- `src/app/api/alerts/route.ts` — Extended Zod enums for frequency/categories
- `src/messages/en.json` — Added email namespace (30+ keys)
- `src/messages/ar.json` — Added email namespace (30+ keys)

### Files Created
- `src/app/api/email/send/route.ts` — New POST endpoint for sending templated emails

### Verification
- All changed files pass `eslint` cleanly
- Dev server running without compilation errors
- Pre-existing lint errors in `OfflineIndicator.tsx` are unrelated
