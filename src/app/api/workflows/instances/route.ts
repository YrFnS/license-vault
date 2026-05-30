import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: List workflow instances with status filtering
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const orgMember = await db.orgMember.findFirst({ where: { userId } });
    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const definitionId = searchParams.get('definitionId') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const where: any = { orgId: orgMember.orgId };
    if (status) where.status = status;
    if (definitionId) where.definitionId = definitionId;

    const total = await db.workflowInstance.count({ where });

    const instances = await db.workflowInstance.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        definition: {
          select: { name: true, category: true, steps: true },
        },
      },
    });

    const enriched = instances.map((inst) => {
      const steps = JSON.parse(inst.definition.steps);
      return {
        ...inst,
        stepHistory: inst.stepHistory ? JSON.parse(inst.stepHistory) : [],
        variables: inst.variables ? JSON.parse(inst.variables) : {},
        definition: {
          ...inst.definition,
          steps,
          totalSteps: steps.length,
        },
      };
    });

    // Status counts
    const [active, completed, cancelled, failed] = await Promise.all([
      db.workflowInstance.count({ where: { orgId: orgMember.orgId, status: 'active' } }),
      db.workflowInstance.count({ where: { orgId: orgMember.orgId, status: 'completed' } }),
      db.workflowInstance.count({ where: { orgId: orgMember.orgId, status: 'cancelled' } }),
      db.workflowInstance.count({ where: { orgId: orgMember.orgId, status: 'failed' } }),
    ]);

    return NextResponse.json({
      instances: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      counts: { active, completed, cancelled, failed },
    });
  } catch (error) {
    console.error('Get workflow instances error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const startInstanceSchema = z.object({
  definitionId: z.string().min(1, 'Definition ID is required'),
  entityType: z.enum(['license', 'application', 'document', 'subcontractor']),
  entityId: z.string().optional(),
  variables: z.string().optional(),
});

// POST: Start a workflow instance from a definition
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const orgMember = await db.orgMember.findFirst({ where: { userId } });
    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const body = await request.json();
    const result = startInstanceSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { definitionId, entityType, entityId, variables } = result.data;

    const definition = await db.workflowDefinition.findFirst({
      where: { id: definitionId, orgId: orgMember.orgId, isActive: true },
    });

    if (!definition) {
      return NextResponse.json({ error: 'Active workflow definition not found' }, { status: 404 });
    }

    const instance = await db.workflowInstance.create({
      data: {
        orgId: orgMember.orgId,
        definitionId,
        entityType,
        entityId: entityId || null,
        status: 'active',
        currentStep: 0,
        stepHistory: JSON.stringify([{
          stepId: 'started',
          stepName: 'Workflow Started',
          action: 'start',
          userId,
          timestamp: new Date().toISOString(),
          notes: `Started from definition: ${definition.name}`,
        }]),
        variables: variables || null,
      },
      include: {
        definition: { select: { name: true, category: true, steps: true } },
      },
    });

    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'workflow_instance',
        entityId: instance.id,
        entityName: `Instance of ${definition.name}`,
        details: `Started workflow instance for: ${definition.name}`,
      },
    });

    return NextResponse.json({
      ...instance,
      stepHistory: JSON.parse(instance.stepHistory || '[]'),
      variables: instance.variables ? JSON.parse(instance.variables) : {},
      definition: {
        ...instance.definition,
        steps: JSON.parse(instance.definition.steps),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Start workflow instance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
