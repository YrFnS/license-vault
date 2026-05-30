import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';
import { sanitizeString } from '@/lib/sanitize';

function computeComplianceStatus(licenseExpiry: Date | null, insuranceExpiry: Date | null): string {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const licenseExpired = licenseExpiry ? licenseExpiry < now : true;
  const licenseExpiring = licenseExpiry ? licenseExpiry <= thirtyDaysFromNow : true;
  const insuranceExpired = insuranceExpiry ? insuranceExpiry < now : true;
  const insuranceExpiring = insuranceExpiry ? insuranceExpiry <= thirtyDaysFromNow : true;

  if ((licenseExpiry && !licenseExpired && !licenseExpiring) && (insuranceExpiry && !insuranceExpired && !insuranceExpiring)) {
    return 'compliant';
  }
  if (licenseExpired || insuranceExpired) {
    return 'non_compliant';
  }
  return 'pending';
}

function computeInsuranceStatus(insuranceExpiry: Date | null): string {
  if (!insuranceExpiry) return 'unknown';
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  if (insuranceExpiry < now) return 'expired';
  if (insuranceExpiry <= thirtyDaysFromNow) return 'expiring';
  return 'active';
}

// GET: List subcontractors for the user's organization
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
    const search = searchParams.get('search') || undefined;
    const statusFilter = searchParams.get('status') || undefined;
    const complianceFilter = searchParams.get('compliance') || undefined;

    // Build where clause
    const where: any = { orgId: orgMember.orgId };

    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { contactName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter;
    }

    if (complianceFilter && complianceFilter !== 'all') {
      where.complianceStatus = complianceFilter;
    }

    const total = await db.subcontractor.count({ where });

    const subcontractors = await db.subcontractor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        projectSubs: {
          include: {
            project: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Add computed insurance status
    const enriched = subcontractors.map((sub) => ({
      ...sub,
      computedInsuranceStatus: computeInsuranceStatus(sub.insuranceExpiry),
    }));

    // Compute counts for stats
    const orgWhere = { orgId: orgMember.orgId };
    const [countTotal, countActive, countCompliant, countNonCompliant] = await Promise.all([
      db.subcontractor.count({ where: orgWhere }),
      db.subcontractor.count({ where: { ...orgWhere, status: 'active' } }),
      db.subcontractor.count({ where: { ...orgWhere, complianceStatus: 'compliant' } }),
      db.subcontractor.count({ where: { ...orgWhere, complianceStatus: 'non_compliant' } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      subcontractors: enriched,
      pagination: { page, limit, total, totalPages },
      counts: {
        total: countTotal,
        active: countActive,
        compliant: countCompliant,
        non_compliant: countNonCompliant,
      },
    });
  } catch (error) {
    console.error('Get subcontractors error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createSubcontractorSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseState: z.string().optional(),
  licenseExpiry: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  insuranceStatus: z.string().optional(),
  notes: z.string().optional(),
});

// POST: Create a subcontractor
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
        { error: 'Insufficient permissions. Only owners and admins can create subcontractors.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = createSubcontractorSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = result.data;

    // Sanitize string inputs
    const sanitizedCompanyName = sanitizeString(data.companyName);
    const sanitizedContactName = data.contactName ? sanitizeString(data.contactName) : null;
    const sanitizedEmail = data.email || null;
    const sanitizedPhone = data.phone ? sanitizeString(data.phone) : null;
    const sanitizedLicenseNumber = data.licenseNumber ? sanitizeString(data.licenseNumber) : null;
    const sanitizedLicenseState = data.licenseState ? sanitizeString(data.licenseState) : null;
    const sanitizedNotes = data.notes ? sanitizeString(data.notes) : null;

    const licenseExpiry = data.licenseExpiry ? new Date(data.licenseExpiry) : null;
    const insuranceExpiry = data.insuranceExpiry ? new Date(data.insuranceExpiry) : null;

    // Auto-calculate compliance status
    const complianceStatus = computeComplianceStatus(licenseExpiry, insuranceExpiry);
    const computedInsuranceStatus = computeInsuranceStatus(insuranceExpiry);

    // Auto-generate upload token
    const uploadToken = crypto.randomUUID();

    const subcontractor = await db.subcontractor.create({
      data: {
        orgId: orgMember.orgId,
        companyName: sanitizedCompanyName,
        contactName: sanitizedContactName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        licenseNumber: sanitizedLicenseNumber,
        licenseState: sanitizedLicenseState,
        licenseExpiry,
        insuranceExpiry,
        insuranceStatus: data.insuranceStatus || computedInsuranceStatus,
        complianceStatus,
        uploadToken,
        notes: sanitizedNotes,
      },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'subcontractor',
        entityId: subcontractor.id,
        entityName: subcontractor.companyName,
        details: `Created subcontractor: ${subcontractor.companyName}`,
      },
    });

    return NextResponse.json(
      {
        subcontractor: {
          ...subcontractor,
          computedInsuranceStatus: computeInsuranceStatus(subcontractor.insuranceExpiry),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create subcontractor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
