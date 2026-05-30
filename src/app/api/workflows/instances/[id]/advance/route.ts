import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const advanceSchema = z.object({
  action: z.enum(['approve', 'reject', 'request_changes', 'delegate']),
  notes: z.string().optional(),
  delegateTo: z.string().optional(),
});

// POST: Advance workflow instance to next step
export async function POST(
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
      where: { id, orgId: orgMember.orgId, status: 'active' },
      include: { definition: { select: { name: true, steps: true } } },
    });

    if (!instance) {
      return NextResponse.json({ error: 'Active workflow instance not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = advanceSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { action, notes, delegateTo } = result.data;

    const steps = JSON.parse(instance.definition.steps);
    const currentStepData = steps[instance.currentStep] as { id: string; name: string } | undefined;
    const stepName = currentStepData?.name || `Step ${instance.currentStep + 1}`;
    const stepId = currentStepData?.id || `step_${instance.currentStep}`;

    // Build history entry
    const historyEntry = {
      stepId,
      stepName,
      action,
      userId,
      timestamp: new Date().toISOString(),
      notes: notes || null,
    };

    const existingHistory = instance.stepHistory ? JSON.parse(instance.stepHistory) : [];
    existingHistory.push(historyEntry);

    let newCurrentStep = instance.currentStep;
    let newStatus = 'active' as string;
    let completedAt = null as Date | null;

    if (action === 'approve') {
      // Advance to next step
      newCurrentStep = instance.currentStep + 1;
      if (newCurrentStep >= steps.length) {
        newStatus = 'completed';
        completedAt = new Date();
      }
    } else if (action === 'reject') {
      newStatus = 'failed';
      completedAt = new Date();
    } else if (action === 'request_changes') {
      // Go back one step
      newCurrentStep = Math.max(0, instance.currentStep - 1);
    } else if (action === 'delegate') {
      // Stay on same step but log delegation
      // (in a real system, this would reassign)
    }

    const updated = await db.workflowInstance.update({
      where: { id },
      data: {
        currentStep: newCurrentStep,
        status: newStatus,
        stepHistory: JSON.stringify(existingHistory),
        completedAt,
      },
      include: {
        definition: { select: { name: true, category: true, steps: true } },
      },
    });

    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'workflow_instance',
        entityId: updated.id,
        entityName: `${stepName} - ${action}`,
        details: `Workflow step "${stepName}" action: ${action}${notes ? ` - ${notes}` : ''}`,
      },
    });

    return NextResponse.json({
      ...updated,
      stepHistory: existingHistory,
      variables: updated.variables ? JSON.parse(updated.variables) : {},
      definition: {
        ...updated.definition,
        steps: JSON.parse(updated.definition.steps),
        totalSteps: JSON.parse(updated.definition.steps).length,
      },
    });
  } catch (error) {
    console.error('Advance workflow instance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
