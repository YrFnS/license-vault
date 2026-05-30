import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

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
    const { id } = await params;

    // Get user's org membership
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const orgId = orgMember.orgId;

    // Verify license belongs to user's org
    const license = await db.license.findFirst({
      where: { id, orgId },
    });

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    // Query audit logs for this license
    const auditLogs = await db.auditLog.findMany({
      where: {
        orgId,
        entityId: id,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Batch fetch user names
    const userIds = [...new Set(auditLogs.filter(log => log.userId).map(log => log.userId!))];
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map(u => [u.id, u.name]));

    const activity = auditLogs.map(log => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityName: log.entityName,
      details: log.details,
      userName: log.userId ? userMap.get(log.userId) || null : null,
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('License activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
