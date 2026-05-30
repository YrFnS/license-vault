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

// GET: Get single license details
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

    // Find user's org membership
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const license = await db.license.findFirst({
      where: {
        id,
        orgId: orgMember.orgId,
      },
    });

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    return NextResponse.json({
      license: {
        ...license,
        status: computeLicenseStatus(license.expirationDate),
      },
    });
  } catch (error) {
    console.error('Get license error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const updateLicenseSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  licenseNumber: z.string().min(1).optional(),
  issuedBy: z.string().min(1).optional(),
  state: z.string().nullable().optional(),
  issueDate: z.string().min(1).optional(),
  expirationDate: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
  isRenewed: z.boolean().optional(),
});

// PUT: Update license (owner/admin only)
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

    // Find user's org membership and check role
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can update licenses.' },
        { status: 403 }
      );
    }

    // Check license exists and belongs to org
    const existingLicense = await db.license.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existingLicense) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateLicenseSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const { issueDate, expirationDate, ...restFields } = result.data;

    // Sanitize string fields before updating
    Object.entries(restFields).forEach(([key, value]) => {
      if (value !== undefined) {
        // Sanitize string values
        if (typeof value === 'string') {
          updateData[key] = sanitizeString(value);
        } else {
          updateData[key] = value;
        }
      }
    });

    if (issueDate !== undefined) {
      updateData.issueDate = new Date(issueDate);
    }
    if (expirationDate !== undefined) {
      updateData.expirationDate = new Date(expirationDate);
    }

    const license = await db.license.update({
      where: { id },
      data: updateData,
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'license',
        entityId: license.id,
        entityName: license.name,
        details: `Updated license: ${license.name} (${license.licenseNumber})`,
      },
    });

    // Fire webhook event (fire-and-forget)
    dispatchWebhook(orgMember.orgId, 'license.updated', {
      id: license.id,
      name: license.name,
      type: license.type,
      licenseNumber: license.licenseNumber,
      issuedBy: license.issuedBy,
      state: license.state,
      expirationDate: license.expirationDate,
    }).catch(console.error);

    return NextResponse.json({
      license: {
        ...license,
        status: computeLicenseStatus(license.expirationDate),
      },
    });
  } catch (error) {
    console.error('Update license error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete license (owner/admin only)
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

    // Find user's org membership and check role
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can delete licenses.' },
        { status: 403 }
      );
    }

    // Check license exists and belongs to org
    const existingLicense = await db.license.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existingLicense) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    // Create audit log entry before deletion
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'delete',
        entityType: 'license',
        entityId: existingLicense.id,
        entityName: existingLicense.name,
        details: `Deleted license: ${existingLicense.name} (${existingLicense.licenseNumber})`,
      },
    });

    // Fire webhook event (fire-and-forget)
    dispatchWebhook(orgMember.orgId, 'license.deleted', {
      id: existingLicense.id,
      name: existingLicense.name,
      licenseNumber: existingLicense.licenseNumber,
    }).catch(console.error);

    await db.license.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete license error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
