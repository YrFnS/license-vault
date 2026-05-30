import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: Get single qualifier with linked licenses
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

    const qualifier = await db.qualifier.findFirst({
      where: { id, orgId: orgMember.orgId },
      include: {
        licenseLinks: {
          include: {
            license: {
              select: {
                id: true,
                name: true,
                type: true,
                licenseNumber: true,
                state: true,
                expirationDate: true,
              },
            },
          },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });

    if (!qualifier) {
      return NextResponse.json({ error: 'Qualifier not found' }, { status: 404 });
    }

    return NextResponse.json({ qualifier });
  } catch (error) {
    console.error('Get qualifier error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const updateQualifierSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseState: z.string().optional(),
  licenseType: z.string().optional(),
  licenseExpiry: z.string().optional(),
  ceHoursEarned: z.number().min(0).optional(),
  ceHoursRequired: z.number().min(0).optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

// PUT: Update a qualifier
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
        { error: 'Insufficient permissions. Only owners and admins can update qualifiers.' },
        { status: 403 }
      );
    }

    const existing = await db.qualifier.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Qualifier not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateQualifierSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data: any = {};

    if (result.data.firstName !== undefined) data.firstName = result.data.firstName;
    if (result.data.lastName !== undefined) data.lastName = result.data.lastName;
    if (result.data.email !== undefined) data.email = result.data.email || null;
    if (result.data.phone !== undefined) data.phone = result.data.phone || null;
    if (result.data.licenseNumber !== undefined) data.licenseNumber = result.data.licenseNumber || null;
    if (result.data.licenseState !== undefined) data.licenseState = result.data.licenseState || null;
    if (result.data.licenseType !== undefined) data.licenseType = result.data.licenseType || null;
    if (result.data.licenseExpiry !== undefined) data.licenseExpiry = result.data.licenseExpiry ? new Date(result.data.licenseExpiry) : null;
    if (result.data.ceHoursEarned !== undefined) data.ceHoursEarned = result.data.ceHoursEarned;
    if (result.data.ceHoursRequired !== undefined) data.ceHoursRequired = result.data.ceHoursRequired;
    if (result.data.status !== undefined) data.status = result.data.status;
    if (result.data.notes !== undefined) data.notes = result.data.notes || null;

    const qualifier = await db.qualifier.update({
      where: { id },
      data,
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'qualifier',
        entityId: qualifier.id,
        entityName: `${qualifier.firstName} ${qualifier.lastName}`,
        details: `Updated qualifier: ${qualifier.firstName} ${qualifier.lastName}`,
      },
    });

    return NextResponse.json({ qualifier });
  } catch (error) {
    console.error('Update qualifier error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a qualifier
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
        { error: 'Insufficient permissions. Only owners and admins can delete qualifiers.' },
        { status: 403 }
      );
    }

    const existing = await db.qualifier.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Qualifier not found' }, { status: 404 });
    }

    // Delete linked QualifierLicense entries first (cascade should handle this, but explicit for safety)
    await db.qualifierLicense.deleteMany({
      where: { qualifierId: id },
    });

    await db.qualifier.delete({
      where: { id },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'delete',
        entityType: 'qualifier',
        entityId: id,
        entityName: `${existing.firstName} ${existing.lastName}`,
        details: `Deleted qualifier: ${existing.firstName} ${existing.lastName}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete qualifier error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
