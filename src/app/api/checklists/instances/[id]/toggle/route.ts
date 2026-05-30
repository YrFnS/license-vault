import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// PUT: Toggle a single checklist item
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
    const instance = await db.checklistInstance.findFirst({
      where: { id, orgId: orgMember.orgId },
    });
    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    const body = await request.json();
    const { itemId } = body;
    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    // Parse and toggle item
    const items = JSON.parse(instance.items);
    const itemIndex = items.findIndex((i: any) => i.id === itemId);
    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    items[itemIndex].completed = !items[itemIndex].completed;
    items[itemIndex].completedAt = items[itemIndex].completed ? new Date().toISOString() : null;
    items[itemIndex].completedBy = items[itemIndex].completed ? userId : null;

    const completedCount = items.filter((i: any) => i.completed).length;
    const totalCount = items.length;

    const updateData: any = {
      items: JSON.stringify(items),
      completedCount,
      totalCount,
    };

    // Auto-complete if all items done
    if (completedCount === totalCount) {
      updateData.status = 'completed';
      updateData.completedAt = new Date();
    } else if (instance.status === 'completed') {
      updateData.status = 'in_progress';
      updateData.completedAt = null;
    }

    const updated = await db.checklistInstance.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ instance: updated, toggledItem: items[itemIndex] });
  } catch (error) {
    console.error('Toggle checklist item error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
