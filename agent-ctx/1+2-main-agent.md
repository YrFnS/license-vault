# Task 1+2: Email Delivery + Webhook Dispatch Fixes

## Task ID: 1+2
## Agent: main-agent

## Summary
Fixed two critical gaps: (1) Team invite and subcontractor doc request flows now send emails, (2) Webhooks are now dispatched when key mutation events occur, with a test endpoint.

## Changes Made

### Gap 1: Email Delivery

**Fix 1a** - `src/app/api/team/route.ts` (POST handler):
- Added `sendTeamInvitation()` import from `@/lib/email`
- After creating the org member and audit log, fetches inviter user and org for name/org data
- Constructs accept URL from NEXTAUTH_URL/env or request headers origin
- Fires `sendTeamInvitation()` as fire-and-forget (`.catch(console.error)`)

**Fix 1b** - `src/app/api/team/[id]/resend/route.ts` (POST handler):
- Added `sendTeamInvitation()` import from `@/lib/email`
- After updating invitedAt and audit log, fetches inviter user and org
- Fires `sendTeamInvitation()` as fire-and-forget with the target member's email, role, and accept URL

**Fix 1c** - `src/app/api/subcontractors/[id]/request-docs/route.ts` (POST handler):
- Added `sendSubcontractorPortalInvite()` import from `@/lib/email`
- Replaced the TODO comment with actual email sending
- Constructs full upload URL with appUrl prefix (not just relative path)
- Only sends email if subcontractor has an email address
- Fetches org name for the email template
- Fires as fire-and-forget

### Gap 2: Webhook Dispatch

**Fix 2a** - Created `src/lib/webhook-delivery.ts`:
- `dispatchWebhook(orgId, event, data)` function
- Queries all active webhooks for the org
- Filters by event subscription (comma-separated events string, supports "*" wildcard)
- Constructs payload with event, data, timestamp, orgId
- Signs payload with HMAC-SHA256 using webhook secret
- Sends POST to webhook URL with signature, event, and delivery-ID headers
- 10s timeout via AbortSignal
- Updates webhook stats: lastTriggeredAt, failureCount
- Returns Promise.allSettled results

**Fix 2b** - Created `src/app/api/webhooks/[id]/test/route.ts`:
- POST endpoint for testing webhook delivery
- Auth + role check (owner/admin only)
- Verifies webhook belongs to user's org
- Uses first subscribed event for test payload
- Dispatches test via `dispatchWebhook()`
- Returns success status and results

**Fix 2c** - Integrated `dispatchWebhook()` into key mutation routes:
1. `src/app/api/licenses/route.ts` POST → `license.created`
2. `src/app/api/licenses/[id]/route.ts` PUT → `license.updated`, DELETE → `license.deleted`
3. `src/app/api/licenses/[id]/renew/route.ts` POST → `license.renewed`
4. `src/app/api/insurance/route.ts` POST → `insurance.created`
5. `src/app/api/insurance/[id]/route.ts` PUT → `insurance.updated`, DELETE → `insurance.deleted`

All dispatches are fire-and-forget (`.catch(console.error)`) to avoid blocking the response.

**Fix 2c-update** - Updated VALID_EVENTS in webhook routes:
- Added `license.deleted`, `license.renewed`, `insurance.created`, `insurance.updated`, `insurance.deleted`
- Both `src/app/api/webhooks/route.ts` and `src/app/api/webhooks/[id]/route.ts`

## Verification
- `bun run lint` passes cleanly
- Dev server running without compilation errors
