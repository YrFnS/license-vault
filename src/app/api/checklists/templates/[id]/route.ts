import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: Get template
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
    const orgMember = await db.orgMember.findFirst({ where: { userId } });
    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { id } = await params;
    const template = await db.checklistTemplate.findFirst({
      where: { id, orgId: orgMember.orgId },
      include: { _count: { select: { instances: true } } },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Get checklist template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const updateTemplateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  category: z.enum(['general', 'onboarding', 'renewal', 'audit', 'custom']).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  items: z.string().optional(),
});

// PUT: Update template
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
    const orgMember = await db.orgMember.findFirst({ where: { userId } });
    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { id } = await params;
    const existing = await db.checklistTemplate.findFirst({
      where: { id, orgId: orgMember.orgId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateTemplateSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json({ error: firstError?.message || 'Validation failed' }, { status: 400 });
    }

    const template = await db.checklistTemplate.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Update checklist template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete/deactivate template
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
    const orgMember = await db.orgMember.findFirst({ where: { userId } });
    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { id } = await params;
    const existing = await db.checklistTemplate.findFirst({
      where: { id, orgId: orgMember.orgId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Soft delete - deactivate instead of removing
    await db.checklistTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete checklist template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
