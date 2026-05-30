import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: Get single workflow instance with full step history
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

    const instance = await db.workflowInstance.findFirst({
      where: { id, orgId: orgMember.orgId },
      include: {
        definition: {
          select: { name: true, category: true, steps: true, triggerType: true },
        },
      },
    });

    if (!instance) {
      return NextResponse.json({ error: 'Workflow instance not found' }, { status: 404 });
    }

    const steps = JSON.parse(instance.definition.steps);
    const stepHistory = instance.stepHistory ? JSON.parse(instance.stepHistory) : [];

    return NextResponse.json({
      ...instance,
      stepHistory,
      variables: instance.variables ? JSON.parse(instance.variables) : {},
      definition: {
        ...instance.definition,
        steps,
        totalSteps: steps.length,
      },
    });
  } catch (error) {
    console.error('Get workflow instance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const updateInstanceSchema = z.object({
  currentStep: z.number().optional(),
  status: z.enum(['active', 'completed', 'cancelled', 'failed']).optional(),
  notes: z.string().optional(),
});

// PUT: Update workflow instance (revert step, update status)
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

    const existing = await db.workflowInstance.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Workflow instance not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateInstanceSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (result.data.currentStep !== undefined) updateData.currentStep = result.data.currentStep;
    if (result.data.status !== undefined) {
      updateData.status = result.data.status;
      if (result.data.status === 'completed' || result.data.status === 'cancelled' || result.data.status === 'failed') {
        updateData.completedAt = new Date();
      }
    }

    const updated = await db.workflowInstance.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...updated,
      stepHistory: updated.stepHistory ? JSON.parse(updated.stepHistory) : [],
      variables: updated.variables ? JSON.parse(updated.variables) : {},
    });
  } catch (error) {
    console.error('Update workflow instance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Cancel workflow instance
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

    const existing = await db.workflowInstance.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Workflow instance not found' }, { status: 404 });
    }

    const updated = await db.workflowInstance.update({
      where: { id },
      data: { status: 'cancelled', completedAt: new Date() },
    });

    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'workflow_instance',
        entityId: updated.id,
        entityName: 'Cancelled workflow instance',
        details: `Cancelled workflow instance ${id}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel workflow instance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
