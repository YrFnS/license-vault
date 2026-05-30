# Task 6-a: Add Server-Side Auth Protection to API Routes

## Agent: api-auth-agent

## Summary

Added server-side authentication protection to all API routes that need it. Found that most routes already had proper auth checks, but identified and fixed one critical bug and one missing auth check.

## Changes Made

### 1. Created `src/lib/auth-utils.ts`
New helper module with:
- `getAuthSession()`: Returns session or null using `getServerSession(authOptions)`
- `requireAuth()`: Returns `{ session, error }` with 401 response if unauthenticated

### 2. Fixed `src/app/api/licenses/[id]/activity/route.ts` (CRITICAL)
- **Bug**: Was calling `getServerSession()` WITHOUT `authOptions` parameter
- **Impact**: Session validation was not working correctly — the session check was effectively bypassed
- **Fix**: Added `import { authOptions } from '@/lib/auth'`, changed to `getServerSession(authOptions)`, updated session check pattern to match all other routes

### 3. Fixed `src/app/api/route.ts`
- **Issue**: Root API endpoint had no auth protection
- **Fix**: Added `getServerSession(authOptions)` check with 401 response

### 4. Verified All Other Routes
All 22 protected API routes confirmed to have proper `getServerSession(authOptions)` + 401 checks. Public endpoints (`/api/compliance/[token]`, `/api/auth/*`) correctly remain unprotected.

## Lint Status
- `bun run lint` passes cleanly with no errors
