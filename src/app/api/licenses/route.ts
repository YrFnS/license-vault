import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { sanitizeString } from '@/lib/sanitize';
import { dispatchWebhook } from '@/lib/webhook-delivery';

function computeLicenseStatus(expirationDate: Date): string {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (expirationDate < now) return 'expired';
  if (expirationDate <= thirtyDaysFromNow) return 'expiring_soon';
  return 'active';
}

// GET: List licenses for the user's organization (with pagination)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Find user's org membership
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const statusFilter = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const typeFilter = searchParams.get('type') || undefined;

    // Build where clause
    const where: any = { orgId: orgMember.orgId };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { licenseNumber: { contains: search } },
      ];
    }

    if (typeFilter) {
      where.type = typeFilter;
    }

    // For status filtering, we need to compute date-based ranges
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    if (statusFilter === 'active') {
      where.expirationDate = { gt: thirtyDaysFromNow };
    } else if (statusFilter === 'expiring_soon') {
      where.expirationDate = { gt: now, lte: thirtyDaysFromNow };
    } else if (statusFilter === 'expired') {
      where.expirationDate = { lte: now };
    } else if (statusFilter === 'renewalNeeded') {
      // Renewal needed = expired or expiring soon
      where.expirationDate = { lte: thirtyDaysFromNow };
    }

    // Get total count for pagination (with filters applied)
    const total = await db.license.count({ where });

    // Fetch paginated licenses
    const licenses = await db.license.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Add computed status to each license
    const licensesWithStatus = licenses.map((license) => ({
      ...license,
      status: computeLicenseStatus(license.expirationDate),
    }));

    const totalPages = Math.ceil(total / limit);

    // Compute status counts for the entire org (for tab badges)
    // These are global counts, not affected by search/type filters
    const orgWhere = { orgId: orgMember.orgId };
    const [countAll, countActive, countExpiring, countExpired] = await Promise.all([
      db.license.count({ where: orgWhere }),
      db.license.count({ where: { ...orgWhere, expirationDate: { gt: thirtyDaysFromNow } } }),
      db.license.count({ where: { ...orgWhere, expirationDate: { gt: now, lte: thirtyDaysFromNow } } }),
      db.license.count({ where: { ...orgWhere, expirationDate: { lte: now } } }),
    ]);

    return NextResponse.json({
      licenses: licensesWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      counts: {
        all: countAll,
        active: countActive,
        expiring_soon: countExpiring,
        expired: countExpired,
        renewal_needed: countExpiring + countExpired,
      },
    });
  } catch (error) {
    console.error('Get licenses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createLicenseSchema = z.object({
  name: z.string().min(1, 'License name is required'),
  type: z.string().min(1, 'License type is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  issuedBy: z.string().min(1, 'Issuing authority is required'),
  state: z.string().optional(),
  issueDate: z.string().min(1, 'Issue date is required'),
  expirationDate: z.string().min(1, 'Expiration date is required'),
  notes: z.string().optional(),
});

// POST: Create a new license
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Find user's org membership and check role
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can create licenses.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = createLicenseSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, type, licenseNumber, issuedBy, state, issueDate, expirationDate, notes } = result.data;

    // Sanitize string inputs
    const sanitizedName = sanitizeString(name);
    const sanitizedType = sanitizeString(type);
    const sanitizedLicenseNumber = sanitizeString(licenseNumber);
    const sanitizedIssuedBy = sanitizeString(issuedBy);
    const sanitizedState = state ? sanitizeString(state) : null;
    const sanitizedNotes = notes ? sanitizeString(notes) : null;

    const license = await db.license.create({
      data: {
        orgId: orgMember.orgId,
        name: sanitizedName,
        type: sanitizedType,
        licenseNumber: sanitizedLicenseNumber,
        issuedBy: sanitizedIssuedBy,
        state: sanitizedState,
        issueDate: new Date(issueDate),
        expirationDate: new Date(expirationDate),
        notes: sanitizedNotes,
        createdById: userId,
      },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'license',
        entityId: license.id,
        entityName: license.name,
        details: `Created license: ${license.name} (${license.licenseNumber})`,
      },
    });

    // Fire webhook event (fire-and-forget)
    dispatchWebhook(orgMember.orgId, 'license.created', {
      id: license.id,
      name: license.name,
      type: license.type,
      licenseNumber: license.licenseNumber,
      issuedBy: license.issuedBy,
      state: license.state,
      expirationDate: license.expirationDate,
    }).catch(console.error);

    // Auto-match: find applicable state requirements for the new license
    let suggestedRequirements: any[] = [];
    if (license.state) {
      try {
        const matchingRequirements = await db.stateRequirement.findMany({
          where: {
            state: license.state,
            licenseType: license.type,
          },
        });

        // Parse reciprocityStates JSON for convenience
        suggestedRequirements = matchingRequirements.map((req) => ({
          ...req,
          reciprocityStates: req.reciprocityStates
            ? JSON.parse(req.reciprocityStates)
            : [],
        }));
      } catch (err) {
        console.error('Error fetching suggested requirements:', err);
      }
    }

    return NextResponse.json(
      {
        license: {
          ...license,
          status: computeLicenseStatus(license.expirationDate),
        },
        suggestedRequirements,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create license error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
