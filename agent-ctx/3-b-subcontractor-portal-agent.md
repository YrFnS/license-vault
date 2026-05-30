# Task 3-b: Subcontractor Onboarding Portal

## Status: Completed

## Files Created
- `src/app/api/subcontractors/route.ts` - GET (list with pagination/search/filters/counts) + POST (create with validation)
- `src/app/api/subcontractors/[id]/route.ts` - GET (single) + PUT (update) + DELETE
- `src/app/api/subcontractors/[id]/request-docs/route.ts` - POST (generate upload link)
- `src/app/api/subcontractors/upload/[token]/route.ts` - GET (validate token) + POST (public upload)
- `src/app/[locale]/(dashboard)/subcontractors/page.tsx` - Main management page
- `src/app/[locale]/(public)/layout.tsx` - Public route layout
- `src/app/[locale]/(public)/subcontractor-upload/page.tsx` - Public upload portal

## Files Modified
- `src/messages/en.json` - Added nav.subcontractors + subcontractors namespace (60+ keys)
- `src/messages/ar.json` - Added nav.subcontractors + subcontractors namespace (60+ Arabic keys)
- `src/components/layout/Sidebar.tsx` - Added HardHat icon + subcontractors nav item

## Key Features
- Full CRUD API with pagination, search, status/compliance filters
- Auto-calculate compliance status based on license/insurance expiry
- Auto-generate uploadToken for self-service portal
- Public token-based upload (no auth required)
- Bulk Request COIs feature
- Copy Upload Link feature
- Detail dialog with linked projects
- Compliance and insurance status badges (emerald/amber/red/gray)
- framer-motion animations, i18n, dark mode, RTL-safe
