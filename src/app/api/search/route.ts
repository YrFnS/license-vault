import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

function computeLicenseStatus(expirationDate: Date): string {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (expirationDate < now) return 'expired';
  if (expirationDate <= thirtyDaysFromNow) return 'expiring_soon';
  return 'active';
}

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
    const q = searchParams.get('q') || '';
    const limit = 5;

    if (!q.trim()) {
      return NextResponse.json({
        licenses: [],
        members: [],
        auditLogs: [],
        locations: [],
      });
    }

    const orgId = orgMember.orgId;

    // Search across all entities in parallel
    // Note: SQLite's LIKE operator is case-insensitive for ASCII by default,
    // so Prisma's `contains` filter provides case-insensitive search on SQLite.
    // We fetch limit+1 records to determine if there are more results beyond the limit.
    const [licenses, members, auditLogs, locations] = await Promise.all([
      // Search licenses by name, licenseNumber, or issuedBy
      db.license.findMany({
        where: {
          orgId,
          OR: [
            { name: { contains: q } },
            { licenseNumber: { contains: q } },
            { issuedBy: { contains: q } },
          ],
        },
        select: {
          id: true,
          name: true,
          licenseNumber: true,
          type: true,
          expirationDate: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
      }),

      // Search team members by email or fullName
      db.orgMember.findMany({
        where: {
          orgId,
          OR: [
            { email: { contains: q } },
            { fullName: { contains: q } },
          ],
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
        },
        orderBy: { invitedAt: 'desc' },
        take: limit + 1,
      }),

      // Search audit logs by action, entityName, or details
      db.auditLog.findMany({
        where: {
          orgId,
          OR: [
            { action: { contains: q } },
            { entityName: { contains: q } },
            { details: { contains: q } },
          ],
        },
        select: {
          id: true,
          action: true,
          entityName: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
      }),

      // Search locations by name, city, or state
      db.location.findMany({
        where: {
          orgId,
          OR: [
            { name: { contains: q } },
            { city: { contains: q } },
            { state: { contains: q } },
          ],
        },
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
      }),
    ]);

    // Add computed status to licenses, limit to max results
    const licensesWithStatus = licenses.slice(0, limit).map((license) => ({
      ...license,
      status: computeLicenseStatus(license.expirationDate),
    }));

    return NextResponse.json({
      licenses: licensesWithStatus,
      licensesHasMore: licenses.length > limit,
      members: members.slice(0, limit),
      membersHasMore: members.length > limit,
      auditLogs: auditLogs.slice(0, limit).map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
      auditLogsHasMore: auditLogs.length > limit,
      locations: locations.slice(0, limit),
      locationsHasMore: locations.length > limit,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
