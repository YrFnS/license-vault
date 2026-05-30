import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { sanitizeString } from '@/lib/sanitize';

// GET: List qualifiers for the user's organization
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const statusFilter = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const where: any = { orgId: orgMember.orgId };

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { licenseNumber: { contains: search } },
      ];
    }

    if (statusFilter) {
      where.status = statusFilter;
    }

    const total = await db.qualifier.count({ where });

    const qualifiers = await db.qualifier.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        licenseLinks: {
          select: { id: true },
        },
      },
    });

    // Add computed fields
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const qualifiersWithStats = qualifiers.map((q) => {
      let computedStatus = q.status;
      if (q.licenseExpiry) {
        if (q.licenseExpiry < now) {
          computedStatus = 'expired';
        } else if (q.licenseExpiry <= thirtyDaysFromNow) {
          computedStatus = 'expiring';
        }
      }
      if (q.ceHoursRequired > 0 && q.ceHoursEarned < q.ceHoursRequired) {
        computedStatus = 'ce_deficient';
      }

      return {
        ...q,
        computedStatus,
        linkedLicensesCount: q.licenseLinks.length,
      };
    });

    const totalPages = Math.ceil(total / limit);

    // Compute global counts for stats
    const orgWhere = { orgId: orgMember.orgId };
    const allQualifiers = await db.qualifier.findMany({
      where: orgWhere,
    });

    const countActive = allQualifiers.filter((q) => q.status === 'active').length;
    const countExpiring = allQualifiers.filter((q) => {
      if (!q.licenseExpiry) return false;
      return q.licenseExpiry > now && q.licenseExpiry <= thirtyDaysFromNow;
    }).length;
    const countCeDeficient = allQualifiers.filter(
      (q) => q.ceHoursRequired > 0 && q.ceHoursEarned < q.ceHoursRequired
    ).length;

    return NextResponse.json({
      qualifiers: qualifiersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      counts: {
        all: allQualifiers.length,
        active: countActive,
        expiring: countExpiring,
        ce_deficient: countCeDeficient,
      },
    });
  } catch (error) {
    console.error('Get qualifiers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createQualifierSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseState: z.string().optional(),
  licenseType: z.string().optional(),
  licenseExpiry: z.string().optional(),
  ceHoursEarned: z.number().min(0).default(0),
  ceHoursRequired: z.number().min(0).default(0),
  status: z.string().default('active'),
  notes: z.string().optional(),
});

// POST: Create a new qualifier
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can create qualifiers.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = createQualifierSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      licenseNumber,
      licenseState,
      licenseType,
      licenseExpiry,
      ceHoursEarned,
      ceHoursRequired,
      status,
      notes,
    } = result.data;

    // Sanitize string inputs
    const sanitizedFirstName = sanitizeString(firstName);
    const sanitizedLastName = sanitizeString(lastName);
    const sanitizedEmail = email || null;
    const sanitizedPhone = phone ? sanitizeString(phone) : null;
    const sanitizedLicenseNumber = licenseNumber ? sanitizeString(licenseNumber) : null;
    const sanitizedLicenseState = licenseState ? sanitizeString(licenseState) : null;
    const sanitizedLicenseType = licenseType ? sanitizeString(licenseType) : null;
    const sanitizedNotes = notes ? sanitizeString(notes) : null;

    const qualifier = await db.qualifier.create({
      data: {
        orgId: orgMember.orgId,
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        licenseNumber: sanitizedLicenseNumber,
        licenseState: sanitizedLicenseState,
        licenseType: sanitizedLicenseType,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        ceHoursEarned,
        ceHoursRequired,
        status: status || 'active',
        notes: sanitizedNotes,
      },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'qualifier',
        entityId: qualifier.id,
        entityName: `${qualifier.firstName} ${qualifier.lastName}`,
        details: `Created qualifier: ${qualifier.firstName} ${qualifier.lastName}`,
      },
    });

    return NextResponse.json(
      { qualifier },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create qualifier error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
