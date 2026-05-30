import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: List templates
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

    const where: any = { orgId: orgMember.orgId, isActive: true };
    if (category) where.category = category;

    const templates = await db.checklistTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { instances: true } } },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Get checklist templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  category: z.enum(['general', 'onboarding', 'renewal', 'audit', 'custom']).default('general'),
  isDefault: z.boolean().default(false),
  items: z.string(), // JSON string of items array
});

// POST: Create template
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
    const result = createTemplateSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json({ error: firstError?.message || 'Validation failed' }, { status: 400 });
    }

    const template = await db.checklistTemplate.create({
      data: {
        orgId: orgMember.orgId,
        name: result.data.name,
        description: result.data.description || null,
        category: result.data.category,
        isDefault: result.data.isDefault,
        items: result.data.items,
      },
    });

    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'checklist_template',
        entityId: template.id,
        entityName: template.name,
        details: `Created checklist template: ${template.name}`,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Create checklist template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
