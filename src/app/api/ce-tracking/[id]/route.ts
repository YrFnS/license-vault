import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: Get single CE record
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

    const record = await db.cETracking.findFirst({
      where: { id, orgId: orgMember.orgId },
      include: {
        license: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    if (!record) {
      return NextResponse.json({ error: 'CE record not found' }, { status: 404 });
    }

    return NextResponse.json({ record });
  } catch (error) {
    console.error('Get CE record error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const updateCESchema = z.object({
  licenseId: z.string().min(1).optional(),
  courseName: z.string().min(1).optional(),
  provider: z.string().min(1).optional(),
  hoursEarned: z.number().min(0).optional(),
  hoursRequired: z.number().min(0).optional(),
  completionDate: z.string().min(1).optional(),
  category: z.string().optional(),
  certificateUrl: z.string().optional(),
  notes: z.string().nullable().optional(),
});

// PUT: Update CE record
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
        { error: 'Insufficient permissions. Only owners and admins can update CE records.' },
        { status: 403 }
      );
    }

    const existing = await db.cETracking.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'CE record not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateCESchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const { completionDate, ...restFields } = result.data;

    Object.entries(restFields).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    if (completionDate !== undefined) {
      updateData.completionDate = new Date(completionDate);
    }

    const record = await db.cETracking.update({
      where: { id },
      data: updateData,
      include: {
        license: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'ce_tracking',
        entityId: record.id,
        entityName: record.courseName,
        details: `Updated CE record: ${record.courseName}`,
      },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error('Update CE record error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete CE record
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
        { error: 'Insufficient permissions. Only owners and admins can delete CE records.' },
        { status: 403 }
      );
    }

    const existing = await db.cETracking.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'CE record not found' }, { status: 404 });
    }

    // Create audit log entry before deletion
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'delete',
        entityType: 'ce_tracking',
        entityId: existing.id,
        entityName: existing.courseName,
        details: `Deleted CE record: ${existing.courseName}`,
      },
    });

    await db.cETracking.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete CE record error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
