import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: List instances
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
    const entityType = searchParams.get('entityType') || undefined;
    const status = searchParams.get('status') || undefined;

    const where: any = { orgId: orgMember.orgId };
    if (entityType) where.entityType = entityType;
    if (status) where.status = status;

    const instances = await db.checklistInstance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        template: { select: { name: true, category: true } },
      },
    });

    // Stats
    const allInstances = await db.checklistInstance.findMany({
      where: { orgId: orgMember.orgId },
      select: { status: true, createdAt: true, completedAt: true },
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedThisMonth = allInstances.filter(
      i => i.status === 'completed' && i.completedAt && i.completedAt >= monthStart
    ).length;

    const counts = {
      total: allInstances.length,
      in_progress: allInstances.filter(i => i.status === 'in_progress').length,
      completed: allInstances.filter(i => i.status === 'completed').length,
      cancelled: allInstances.filter(i => i.status === 'cancelled').length,
      completedThisMonth,
    };

    return NextResponse.json({ instances, counts });
  } catch (error) {
    console.error('Get checklist instances error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createInstanceSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  entityType: z.enum(['license', 'application', 'project', 'subcontractor']).default('license'),
  entityId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  dueDate: z.string().optional(),
});

// POST: Create instance from template
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
    const result = createInstanceSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json({ error: firstError?.message || 'Validation failed' }, { status: 400 });
    }

    const data = result.data;

    // Get template items
    const template = await db.checklistTemplate.findFirst({
      where: { id: data.templateId, orgId: orgMember.orgId },
    });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Convert template items to instance items (add completed state)
    const templateItems = JSON.parse(template.items);
    const instanceItems = templateItems.map((item: any, idx: number) => ({
      ...item,
      id: item.id || String(idx + 1),
      completed: false,
      completedAt: null,
      completedBy: null,
      order: item.order ?? idx,
    }));

    const totalCount = instanceItems.length;

    const instance = await db.checklistInstance.create({
      data: {
        orgId: orgMember.orgId,
        templateId: data.templateId,
        entityType: data.entityType,
        entityId: data.entityId || null,
        title: data.title,
        items: JSON.stringify(instanceItems),
        totalCount,
        completedCount: 0,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });

    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'checklist_instance',
        entityId: instance.id,
        entityName: data.title,
        details: `Created checklist instance from template: ${template.name}`,
      },
    });

    return NextResponse.json({ instance }, { status: 201 });
  } catch (error) {
    console.error('Create checklist instance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
