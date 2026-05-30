import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: List workflow definitions with category filtering and instance counts
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
    const category = searchParams.get('category') || undefined;
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: any = { orgId: orgMember.orgId };
    if (!includeInactive) where.isActive = true;
    if (category) where.category = category;

    const definitions = await db.workflowDefinition.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { instances: true } },
      },
    });

    // Count active instances for each definition
    const enriched = await Promise.all(
      definitions.map(async (def) => {
        const activeInstances = await db.workflowInstance.count({
          where: { definitionId: def.id, status: 'active' },
        });
        const completedInstances = await db.workflowInstance.count({
          where: { definitionId: def.id, status: 'completed' },
        });
        return {
          ...def,
          steps: JSON.parse(def.steps),
          _count: {
            instances: def._count.instances,
            activeInstances,
            completedInstances,
          },
        };
      })
    );

    // Stats
    const [total, active, runningInstances, completed] = await Promise.all([
      db.workflowDefinition.count({ where: { orgId: orgMember.orgId } }),
      db.workflowDefinition.count({ where: { orgId: orgMember.orgId, isActive: true } }),
      db.workflowInstance.count({ where: { orgId: orgMember.orgId, status: 'active' } }),
      db.workflowInstance.count({ where: { orgId: orgMember.orgId, status: 'completed' } }),
    ]);

    return NextResponse.json({
      definitions: enriched,
      stats: { total, active, runningInstances, completed },
    });
  } catch (error) {
    console.error('Get workflow definitions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const templateSteps: Record<string, Array<{ id: string; name: string; type: string; assignee: string; actions: string[]; conditions: string[]; order: number }>> = {
  license_renewal: [
    { id: 'step_1', name: 'Initiate Renewal', type: 'action', assignee: 'owner', actions: ['start_renewal'], conditions: [], order: 0 },
    { id: 'step_2', name: 'Review Requirements', type: 'review', assignee: 'admin', actions: ['check_requirements'], conditions: [], order: 1 },
    { id: 'step_3', name: 'Complete Continuing Education', type: 'action', assignee: 'member', actions: ['complete_ce'], conditions: [], order: 2 },
    { id: 'step_4', name: 'Submit Renewal Application', type: 'approval', assignee: 'admin', actions: ['submit_application'], conditions: ['ce_complete'], order: 3 },
    { id: 'step_5', name: 'Verify New License', type: 'review', assignee: 'owner', actions: ['verify_license'], conditions: [], order: 4 },
  ],
  onboarding: [
    { id: 'step_1', name: 'Submit Credentials', type: 'action', assignee: 'member', actions: ['upload_credentials'], conditions: [], order: 0 },
    { id: 'step_2', name: 'Admin Review', type: 'approval', assignee: 'admin', actions: ['review_credentials'], conditions: [], order: 1 },
    { id: 'step_3', name: 'Upload Documents', type: 'action', assignee: 'member', actions: ['upload_documents'], conditions: ['credentials_approved'], order: 2 },
    { id: 'step_4', name: 'Compliance Check', type: 'review', assignee: 'owner', actions: ['verify_compliance'], conditions: [], order: 3 },
  ],
  audit: [
    { id: 'step_1', name: 'Schedule Audit', type: 'action', assignee: 'admin', actions: ['schedule_audit'], conditions: [], order: 0 },
    { id: 'step_2', name: 'Conduct Review', type: 'review', assignee: 'admin', actions: ['conduct_review'], conditions: [], order: 1 },
    { id: 'step_3', name: 'Generate Report', type: 'action', assignee: 'owner', actions: ['generate_report'], conditions: [], order: 2 },
  ],
};

const createDefinitionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.enum(['license_renewal', 'onboarding', 'audit', 'document_review', 'custom']).default('custom'),
  triggerType: z.enum(['manual', 'automatic', 'scheduled', 'event']).default('manual'),
  triggerConfig: z.string().optional(),
  steps: z.string().optional(),
  template: z.enum(['license_renewal', 'onboarding', 'audit']).optional(),
});

// POST: Create workflow definition (supports templates)
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

    // Only admins/owners can create workflows
    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const result = createDefinitionSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, description, category, triggerType, triggerConfig, steps, template } = result.data;

    // Determine steps: from template, from provided steps, or empty
    let stepsData: Array<{ id: string; name: string; type: string; assignee: string; actions: string[]; conditions: string[]; order: number }> = [];
    if (template && templateSteps[template]) {
      stepsData = templateSteps[template];
    } else if (steps) {
      try {
        stepsData = JSON.parse(steps);
      } catch {
        return NextResponse.json({ error: 'Invalid steps JSON' }, { status: 400 });
      }
    }

    const definition = await db.workflowDefinition.create({
      data: {
        orgId: orgMember.orgId,
        name,
        description: description || null,
        category,
        triggerType,
        triggerConfig: triggerConfig || null,
        steps: JSON.stringify(stepsData),
      },
    });

    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'workflow_definition',
        entityId: definition.id,
        entityName: definition.name,
        details: `Created workflow definition: ${definition.name} (${category})`,
      },
    });

    return NextResponse.json({
      ...definition,
      steps: stepsData,
    }, { status: 201 });
  } catch (error) {
    console.error('Create workflow definition error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
