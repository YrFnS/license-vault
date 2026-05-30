import { NextResponse } from 'next/server';
import { authenticateApiKey, hasPermission } from '@/lib/api-auth';
import { db } from '@/lib/db';

// GET /api/v1/compliance - Get compliance status
export async function GET() {
  try {
    const auth = await authenticateApiKey();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized. Include a valid API key in the Authorization header.' }, { status: 401 });
    }

    if (!hasPermission(auth.permissions, 'read')) {
      return NextResponse.json({ error: 'Insufficient permissions. API key requires read access.' }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [total, active, expiring, expired] = await Promise.all([
      db.license.count({ where: { orgId: auth.orgId } }),
      db.license.count({ where: { orgId: auth.orgId, expirationDate: { gt: thirtyDaysFromNow } } }),
      db.license.count({ where: { orgId: auth.orgId, expirationDate: { gt: now, lte: thirtyDaysFromNow } } }),
      db.license.count({ where: { orgId: auth.orgId, expirationDate: { lte: now } } }),
    ]);

    const complianceRate = total > 0 ? Math.round((active / total) * 100) : 100;

    const org = await db.organization.findUnique({
      where: { id: auth.orgId },
      select: { name: true, tradeType: true, primaryState: true },
    });

    return NextResponse.json({
      data: {
        organization: org,
        compliance: {
          total,
          active,
          expiringSoon: expiring,
          expired,
          complianceRate,
        },
        lastChecked: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('API v1 compliance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
