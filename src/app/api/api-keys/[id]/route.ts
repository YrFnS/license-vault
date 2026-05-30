import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateApiKeySchema = z.object({
  name: z.string().min(1, 'Key name is required').optional(),
  permissions: z.enum(['read', 'write', 'admin']).optional(),
  isActive: z.boolean().optional(),
});

// PUT: Update an API key
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
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const existingKey = await db.apiKey.findUnique({
      where: { id },
    });

    if (!existingKey || existingKey.orgId !== orgMember.orgId) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateApiKeySchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};
    if (result.data.name !== undefined) updateData.name = result.data.name;
    if (result.data.permissions !== undefined) updateData.permissions = result.data.permissions;
    if (result.data.isActive !== undefined) updateData.isActive = result.data.isActive;

    const apiKey = await db.apiKey.update({
      where: { id },
      data: updateData,
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'apiKey',
        entityId: apiKey.id,
        entityName: apiKey.name,
        details: `Updated API key: ${apiKey.name}`,
      },
    });

    return NextResponse.json({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        lastUsedAt: apiKey.lastUsedAt,
        expiresAt: apiKey.expiresAt,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error) {
    console.error('Update API key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Revoke an API key (soft delete)
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
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const existingKey = await db.apiKey.findUnique({
      where: { id },
    });

    if (!existingKey || existingKey.orgId !== orgMember.orgId) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Soft delete - set isActive to false
    await db.apiKey.update({
      where: { id },
      data: { isActive: false },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'delete',
        entityType: 'apiKey',
        entityId: existingKey.id,
        entityName: existingKey.name,
        details: `Revoked API key: ${existingKey.name}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Revoke API key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
