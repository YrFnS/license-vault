# Task 6: License Expiration Checker API + Global Search API

## Summary
Created two API endpoints for the License Vault project:

1. **`/api/licenses/check-expirations/route.ts`** (NEW) — Automated license expiration checker
   - GET endpoint, authenticated
   - Checks all org licenses for expiration status (EXPIRED, EXPIRING_5_DAYS, EXPIRING_30_DAYS, EXPIRING_60_DAYS)
   - Respects user AlertPreference settings for each threshold
   - Creates Notification records with 24-hour deduplication
   - Returns summary counts

2. **`/api/search/route.ts`** (UPDATED) — Global search API
   - Rewrote to match spec: searches licenses, members, audit logs, locations
   - Case-insensitive search via Prisma `contains` (SQLite-compatible)
   - Backward-compatible with existing GlobalSearchDialog component
   - 5 results max per category

## Key Decisions
- Used mutually exclusive expiration status ranges (EXPIRED > EXPIRING_5_DAYS > EXPIRING_30_DAYS > EXPIRING_60_DAYS)
- Notification dedup uses title pattern `[STATUS] licenseName (licenseNumber)` + 24h window
- Could not use Prisma `mode: 'insensitive'` for SQLite — TypeScript types don't support it; SQLite LIKE is already case-insensitive for ASCII
- Kept `HasMore` and `status` fields in search response for frontend compatibility

## Files
- Created: `src/app/api/licenses/check-expirations/route.ts`
- Modified: `src/app/api/search/route.ts`
