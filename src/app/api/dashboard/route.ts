import { NextResponse } from 'next/server';
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

// GET: Dashboard summary data
export async function GET(request: Request) {
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

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Get all licenses for the org
    const licenses = await db.license.findMany({
      where: { orgId: orgMember.orgId },
      orderBy: { createdAt: 'desc' },
    });

    const total = licenses.length;
    const active = licenses.filter(
      (l) => l.expirationDate > thirtyDaysFromNow
    ).length;
    const expiringSoon = licenses.filter(
      (l) => l.expirationDate >= now && l.expirationDate <= thirtyDaysFromNow
    ).length;
    const expired = licenses.filter(
      (l) => l.expirationDate < now
    ).length;

    // Recent 5 licenses
    const recentLicenses = licenses.slice(0, 5).map((license) => ({
      ...license,
      status: computeLicenseStatus(license.expirationDate),
    }));

    // License distribution for pie/donut chart
    const licenseDistribution = [
      { name: 'active', value: active, color: '#10b981' },
      { name: 'expiring', value: expiringSoon, color: '#f59e0b' },
      { name: 'expired', value: expired, color: '#ef4444' },
    ];

    // Monthly license activity for bar chart (last 6 months)
    const monthlyActivity: { month: string; created: number } = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();

      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const createdInMonth = licenses.filter((l) => {
        const created = new Date(l.createdAt);
        return created >= monthStart && created <= monthEnd;
      }).length;

      // Use short month name based on user's locale
      const acceptLanguage = request.headers.get('accept-language') || 'en';
      const userLocale = acceptLanguage.split(',')[0]?.split(';')[0]?.trim() || 'en';
      const monthLabel = monthDate.toLocaleString(userLocale, { month: 'short' });
      monthlyActivity.push({ month: monthLabel, created: createdInMonth });
    }

    // Recent 8 audit log entries with user name
    const recentAuditLogs = await db.auditLog.findMany({
      where: { orgId: orgMember.orgId },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    // Collect unique userIds to batch-fetch user names
    const userIds = [...new Set(recentAuditLogs.map((log) => log.userId).filter(Boolean))] as string[];
    const users = userIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const recentActivity = recentAuditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityName: log.entityName,
      details: log.details,
      userName: log.userId ? (userMap.get(log.userId) ?? null) : null,
      createdAt: log.createdAt.toISOString(),
    }));

    // Expiring licenses for compliance forecast (sorted by expiration date ascending)
    const expiringLicenses = licenses
      .filter((l) => l.expirationDate <= thirtyDaysFromNow || l.expirationDate < now)
      .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())
      .slice(0, 5)
      .map((license) => ({
        id: license.id,
        name: license.name,
        expirationDate: license.expirationDate.toISOString(),
        status: computeLicenseStatus(license.expirationDate),
      }));

    return NextResponse.json({
      summary: {
        total,
        active,
        expiringSoon,
        expired,
      },
      recentLicenses,
      licenseDistribution,
      monthlyActivity,
      recentActivity,
      expiringLicenses,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
