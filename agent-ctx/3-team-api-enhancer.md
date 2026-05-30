# Task 3: Team Management API Enhancement

## Task ID: 3
## Agent: team-api-enhancer

## Summary
Enhanced the team management API with four new endpoints for member operations: remove member, change role, cancel invite, and resend invite.

## Work Completed

### 1. DELETE /api/team/[id] — Remove Team Member
**File:** `src/app/api/team/[id]/route.ts`
- Only owner/admin can remove members (403 if not)
- Cannot remove yourself — must use leave org instead (400)
- Cannot remove the last owner — must transfer ownership first (400)
- Verifies target member exists and belongs to same org (404)
- Deletes the OrgMember record
- Creates audit log entry with action `remove_member`

### 2. PUT /api/team/[id]/role — Change Member Role
**File:** `src/app/api/team/[id]/role/route.ts`
- Only owner can change roles (403 if not)
- Zod validation for role field (must be 'owner', 'admin', or 'member')
- Cannot change your own role (400)
- Cannot change the last owner's role (400)
- No-op detection: returns 400 if role is already the same
- Creates audit log entry with action `change_role`, includes previous and new role in details

### 3. DELETE /api/team/[id]/invite — Cancel Pending Invite
**File:** `src/app/api/team/[id]/invite/route.ts`
- Only owner/admin can cancel invites (403 if not)
- Only works for members without `joinedAt` (pending invites only)
- Returns 400 if invite already accepted (suggests remove member instead)
- Deletes the OrgMember record
- Creates audit log entry with action `cancel_invite`

### 4. POST /api/team/[id]/resend — Resend Invite
**File:** `src/app/api/team/[id]/resend/route.ts`
- Only owner/admin can resend invites (403 if not)
- Only works for pending invites (no `joinedAt`)
- Returns 400 if invite already accepted
- Updates `invitedAt` to current date
- Creates audit log entry with action `resend_invite`

## Patterns Followed
- Same auth pattern as existing code: `getServerSession(authOptions)` + `(session.user as any).id`
- Same error handling style: try/catch with console.error and NextResponse.json
- Same import structure: `next-auth`, `@/lib/auth`, `@/lib/db`, `zod`
- Consistent HTTP status codes: 401 (unauthorized), 403 (forbidden), 404 (not found), 400 (bad request), 500 (internal error)
- All endpoints use async params pattern: `{ params }: { params: Promise<{ id: string }> }` with `await params`

## Verification
- Lint passes cleanly (no errors)
- Dev server running successfully
- All files created in correct directory structure
