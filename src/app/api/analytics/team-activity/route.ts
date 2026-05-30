import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
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

    // Get audit logs for the org
    const auditLogs = await db.auditLog.findMany({
      where: { orgId: orgMember.orgId },
      orderBy: { createdAt: 'desc' },
    });

    // Get org members
    const orgMembers = await db.orgMember.findMany({
      where: { orgId: orgMember.orgId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // Actions by user
    const userActionMap = new Map<string, { name: string; email: string; count: number }>();
    for (const member of orgMembers) {
      const name = member.user?.name || member.fullName || member.email;
      const email = member.user?.email || member.email;
      userActionMap.set(member.userId || member.id, { name, email, count: 0 });
    }

    for (const log of auditLogs) {
      if (log.userId) {
        const existing = userActionMap.get(log.userId);
        if (existing) {
          existing.count += 1;
        } else {
          const user = orgMembers.find((m) => m.userId === log.userId);
          const name = user?.user?.name || user?.fullName || log.userId;
          const email = user?.user?.email || user?.email || '';
          userActionMap.set(log.userId, { name, email, count: 1 });
        }
      }
    }

    const actionsByUser = Array.from(userActionMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count);

    // Most active users (top 5)
    const mostActiveUsers = actionsByUser.slice(0, 5);

    // Action type distribution
    const actionTypeMap = new Map<string, number>();
    for (const log of auditLogs) {
      const action = log.action || 'other';
      actionTypeMap.set(action, (actionTypeMap.get(action) || 0) + 1);
    }
    const actionTypes = Array.from(actionTypeMap.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count);

    // Activity timeline (last 30 days, grouped by day)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timelineMap = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      timelineMap.set(key, 0);
    }

    for (const log of auditLogs) {
      if (new Date(log.createdAt) >= thirtyDaysAgo) {
        const key = new Date(log.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        const existing = timelineMap.get(key);
        if (existing !== undefined) {
          timelineMap.set(key, existing + 1);
        }
      }
    }

    const timeline = Array.from(timelineMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    return NextResponse.json({
      actionsByUser,
      mostActiveUsers,
      actionTypes,
      timeline,
      totalActions: auditLogs.length,
    });
  } catch (error) {
    console.error('Team activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
