import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';

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

const updateSubcontractorSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseState: z.string().optional(),
  licenseExpiry: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  insuranceStatus: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

// GET: Get single subcontractor
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = await params;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const subcontractor = await db.subcontractor.findFirst({
      where: { id, orgId: orgMember.orgId },
      include: {
        projectSubs: {
          include: {
            project: {
              select: { id: true, name: true, status: true },
            },
          },
        },
      },
    });

    if (!subcontractor) {
      return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 });
    }

    return NextResponse.json({
      subcontractor: {
        ...subcontractor,
        computedInsuranceStatus: computeInsuranceStatus(subcontractor.insuranceExpiry),
      },
    });
  } catch (error) {
    console.error('Get subcontractor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update a subcontractor
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = await params;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const existing = await db.subcontractor.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateSubcontractorSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = result.data;
    const licenseExpiry = data.licenseExpiry !== undefined
      ? (data.licenseExpiry ? new Date(data.licenseExpiry) : null)
      : existing.licenseExpiry;
    const insuranceExpiry = data.insuranceExpiry !== undefined
      ? (data.insuranceExpiry ? new Date(data.insuranceExpiry) : null)
      : existing.insuranceExpiry;

    // Recalculate compliance status
    const complianceStatus = computeComplianceStatus(licenseExpiry, insuranceExpiry);
    const computedInsuranceStatus = computeInsuranceStatus(insuranceExpiry);

    const subcontractor = await db.subcontractor.update({
      where: { id },
      data: {
        companyName: data.companyName,
        contactName: data.contactName !== undefined ? (data.contactName || null) : undefined,
        email: data.email !== undefined ? (data.email || null) : undefined,
        phone: data.phone !== undefined ? (data.phone || null) : undefined,
        licenseNumber: data.licenseNumber !== undefined ? (data.licenseNumber || null) : undefined,
        licenseState: data.licenseState !== undefined ? (data.licenseState || null) : undefined,
        licenseExpiry,
        insuranceExpiry,
        insuranceStatus: data.insuranceStatus || computedInsuranceStatus,
        complianceStatus,
        status: data.status,
        notes: data.notes !== undefined ? (data.notes || null) : undefined,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'subcontractor',
        entityId: subcontractor.id,
        entityName: subcontractor.companyName,
        details: `Updated subcontractor: ${subcontractor.companyName}`,
      },
    });

    return NextResponse.json({
      subcontractor: {
        ...subcontractor,
        computedInsuranceStatus: computeInsuranceStatus(subcontractor.insuranceExpiry),
      },
    });
  } catch (error) {
    console.error('Update subcontractor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a subcontractor
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = await params;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const existing = await db.subcontractor.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 });
    }

    await db.subcontractor.delete({
      where: { id },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'delete',
        entityType: 'subcontractor',
        entityId: id,
        entityName: existing.companyName,
        details: `Deleted subcontractor: ${existing.companyName}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete subcontractor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
