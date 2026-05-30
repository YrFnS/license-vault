import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET: Get instance with items
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
    const instance = await db.checklistInstance.findFirst({
      where: { id, orgId: orgMember.orgId },
      include: { template: { select: { name: true, category: true, description: true } } },
    });

    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    return NextResponse.json({ instance });
  } catch (error) {
    console.error('Get checklist instance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update instance items or status
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
    const existing = await db.checklistInstance.findFirst({
      where: { id, orgId: orgMember.orgId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.items) {
      const items = typeof body.items === 'string' ? body.items : JSON.stringify(body.items);
      updateData.items = items;

      // Recalculate counts
      const parsedItems = JSON.parse(items);
      updateData.completedCount = parsedItems.filter((i: any) => i.completed).length;
      updateData.totalCount = parsedItems.length;

      // Auto-complete if all items done
      if (updateData.completedCount === updateData.totalCount) {
        updateData.status = 'completed';
        updateData.completedAt = new Date();
      }
    }

    if (body.status) {
      updateData.status = body.status;
      if (body.status === 'completed') {
        updateData.completedAt = new Date();
      }
    }

    if (body.title) updateData.title = body.title;
    if (body.dueDate) updateData.dueDate = new Date(body.dueDate);

    const instance = await db.checklistInstance.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ instance });
  } catch (error) {
    console.error('Update checklist instance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Cancel instance
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
    const existing = await db.checklistInstance.findFirst({
      where: { id, orgId: orgMember.orgId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    await db.checklistInstance.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel checklist instance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
