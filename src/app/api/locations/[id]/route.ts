import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required').optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
});

// PUT: Update a location
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
        { error: 'Insufficient permissions. Only owners and admins can update locations.' },
        { status: 403 }
      );
    }

    // Check location exists and belongs to org
    const existingLocation = await db.location.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existingLocation) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateLocationSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    Object.entries(result.data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    const location = await db.location.update({
      where: { id },
      data: updateData,
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'location',
        entityId: location.id,
        entityName: location.name,
        details: `Updated location: ${location.name}`,
      },
    });

    return NextResponse.json({ location });
  } catch (error) {
    console.error('Update location error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a location
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
        { error: 'Insufficient permissions. Only owners and admins can delete locations.' },
        { status: 403 }
      );
    }

    // Check location exists and belongs to org
    const existingLocation = await db.location.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existingLocation) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Create audit log entry before deletion
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'delete',
        entityType: 'location',
        entityId: existingLocation.id,
        entityName: existingLocation.name,
        details: `Deleted location: ${existingLocation.name}`,
      },
    });

    await db.location.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete location error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
