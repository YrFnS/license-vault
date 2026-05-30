# Task 7: Global Search Upgrade

## Summary
Upgraded the global search (Cmd+K) to search across all entities using a new `/api/search` API endpoint.

## What Was Done

### API Endpoint
- Created `src/app/api/search/route.ts` - GET endpoint with `?q=xxx` parameter
- Searches across licenses, team members, audit logs, and locations
- Returns max 5 results per category with hasMore flags
- Requires authentication

### Frontend Component
- Created `src/components/layout/GlobalSearchDialog.tsx` - Full-featured search dialog
- Uses shadcn/ui Command component (cmdk-based)
- 300ms debounced search with AbortController
- Grouped results with emoji headings (🔑👥📋📍)
- Navigation on click to appropriate pages
- Loading spinner, no results state, view all links
- StatusBadge and RoleBadge mini components for result display

### TopNav Update
- Updated `src/components/layout/TopNav.tsx`
- Replaced old simple search dialog with GlobalSearchDialog
- Added mobile search button
- Preserved Cmd+K shortcut and all existing functionality

### i18n
- Added `search` namespace with 8 keys to both en.json and ar.json

## Files Created
- `src/app/api/search/route.ts`
- `src/components/layout/GlobalSearchDialog.tsx`

## Files Modified
- `src/components/layout/TopNav.tsx`
- `src/messages/en.json`
- `src/messages/ar.json`
