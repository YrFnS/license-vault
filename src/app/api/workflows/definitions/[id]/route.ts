import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: Get single workflow definition with steps parsed
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const orgMember = await db.orgMember.findFirst({ where: { userId } });
    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const definition = await db.workflowDefinition.findFirst({
      where: { id, orgId: orgMember.orgId },
      include: {
        _count: { select: { instances: true } },
      },
    });

    if (!definition) {
      return NextResponse.json({ error: 'Workflow definition not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...definition,
      steps: JSON.parse(definition.steps),
      triggerConfig: definition.triggerConfig ? JSON.parse(definition.triggerConfig) : null,
    });
  } catch (error) {
    console.error('Get workflow definition error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const updateDefinitionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(['license_renewal', 'onboarding', 'audit', 'document_review', 'custom']).optional(),
  triggerType: z.enum(['manual', 'automatic', 'scheduled', 'event']).optional(),
  triggerConfig: z.string().optional(),
  steps: z.string().optional(),
  isActive: z.boolean().optional(),
});

// PUT: Update workflow definition (creates new version)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const orgMember = await db.orgMember.findFirst({ where: { userId } });
    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const existing = await db.workflowDefinition.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Workflow definition not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateDefinitionSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (result.data.name !== undefined) updateData.name = result.data.name;
    if (result.data.description !== undefined) updateData.description = result.data.description || null;
    if (result.data.category !== undefined) updateData.category = result.data.category;
    if (result.data.triggerType !== undefined) updateData.triggerType = result.data.triggerType;
    if (result.data.triggerConfig !== undefined) updateData.triggerConfig = result.data.triggerConfig || null;
    if (result.data.isActive !== undefined) updateData.isActive = result.data.isActive;

    // If steps are updated, increment version
    if (result.data.steps !== undefined) {
      try {
        JSON.parse(result.data.steps); // Validate JSON
        updateData.steps = result.data.steps;
        updateData.version = existing.version + 1;
      } catch {
        return NextResponse.json({ error: 'Invalid steps JSON' }, { status: 400 });
      }
    }

    const updated = await db.workflowDefinition.update({
      where: { id },
      data: updateData,
    });

    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'workflow_definition',
        entityId: updated.id,
        entityName: updated.name,
        details: `Updated workflow definition: ${updated.name} (v${updated.version})`,
      },
    });

    return NextResponse.json({
      ...updated,
      steps: JSON.parse(updated.steps),
      triggerConfig: updated.triggerConfig ? JSON.parse(updated.triggerConfig) : null,
    });
  } catch (error) {
    console.error('Update workflow definition error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Soft delete (set isActive=false)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const orgMember = await db.orgMember.findFirst({ where: { userId } });
    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const existing = await db.workflowDefinition.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Workflow definition not found' }, { status: 404 });
    }

    const updated = await db.workflowDefinition.update({
      where: { id },
      data: { isActive: false },
    });

    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'delete',
        entityType: 'workflow_definition',
        entityId: updated.id,
        entityName: updated.name,
        details: `Deactivated workflow definition: ${updated.name}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete workflow definition error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
