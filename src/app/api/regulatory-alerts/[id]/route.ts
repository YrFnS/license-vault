import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// PUT: Mark as read, dismiss alert
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
    const body = await request.json();
    const { isRead, isDismissed } = body;

    const alert = await db.regulatoryAlert.findFirst({
      where: { id, orgId: orgMember.orgId },
    });

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (typeof isRead === 'boolean') updateData.isRead = isRead;
    if (typeof isDismissed === 'boolean') updateData.isDismissed = isDismissed;

    const updated = await db.regulatoryAlert.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ alert: updated });
  } catch (error) {
    console.error('Update regulatory alert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
