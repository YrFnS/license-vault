import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getRateLimiterStats } from '@/lib/rate-limit';
import { getCsrfStats } from '@/lib/csrf';
import { getSanitizationStats } from '@/lib/sanitize';

// GET: Get security stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Find user's org membership and check admin role
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const rateLimitStats = getRateLimiterStats();
    const csrfStats = getCsrfStats();
    const sanitizationStats = getSanitizationStats();

    // Get failed auth attempts from audit logs
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const failedAuthCount = await db.auditLog.count({
      where: {
        orgId: orgMember.orgId,
        action: { contains: 'login_failed' },
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Security headers info
    const securityHeaders = [
      { name: 'X-Content-Type-Options', value: 'nosniff', enabled: true },
      { name: 'X-Frame-Options', value: 'DENY', enabled: true },
      { name: 'X-XSS-Protection', value: '1; mode=block', enabled: true },
      {
        name: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
        enabled: true,
      },
      {
        name: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
        enabled: true,
      },
      {
        name: 'Content-Security-Policy',
        value: "default-src 'self'; ...",
        enabled: true,
      },
    ];

    // Recent security audit events
    const recentSecurityEvents = await db.auditLog.findMany({
      where: {
        orgId: orgMember.orgId,
        OR: [
          { action: { contains: 'login_failed' } },
          { action: { contains: 'delete' } },
          { action: { contains: 'security' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const auditEvents = recentSecurityEvents.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityName: log.entityName,
      details: log.details,
      userId: log.userId,
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({
      rateLimiting: rateLimitStats,
      csrf: csrfStats,
      sanitization: sanitizationStats,
      securityHeaders,
      failedAuthCount,
      recentSecurityEvents: auditEvents,
    });
  } catch (error) {
    console.error('Security stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
