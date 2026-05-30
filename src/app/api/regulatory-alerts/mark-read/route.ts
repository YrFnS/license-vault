import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// PUT: Mark all alerts as read for the org
export async function PUT(request: Request) {
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

    const result = await db.regulatoryAlert.updateMany({
      where: { orgId: orgMember.orgId, isRead: false, isDismissed: false },
      data: { isRead: true },
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error('Mark all read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
