import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Find user's org membership
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const actionFilter = searchParams.get('action') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      orgId: orgMember.orgId,
    };

    if (actionFilter) {
      where.action = actionFilter;
    }

    if (search) {
      where.OR = [
        { entityName: { contains: search } },
        { details: { contains: search } },
        { entityType: { contains: search } },
      ];
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          org: {
            select: { name: true },
          },
        },
      }),
      db.auditLog.count({ where }),
    ]);

    // Fetch user names for the audit logs that have a userId
    const userIds = [...new Set(logs.filter((l) => l.userId).map((l) => l.userId!))];
    const users = userIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        })
      : [];

    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      entityName: log.entityName,
      details: log.details,
      createdAt: log.createdAt.toISOString(),
      user: log.userId ? userMap.get(log.userId) || null : null,
    }));

    return NextResponse.json({
      logs: enrichedLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
