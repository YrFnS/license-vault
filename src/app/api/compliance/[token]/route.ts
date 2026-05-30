import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const share = await db.complianceShare.findUnique({
      where: { token },
      include: {
        org: {
          select: {
            id: true,
            name: true,
            tradeType: true,
          },
        },
      },
    });

    if (!share) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }

    // Fetch all licenses for the org
    const licenses = await db.license.findMany({
      where: { orgId: share.orgId },
      select: {
        name: true,
        type: true,
        expirationDate: true,
      },
      orderBy: { expirationDate: 'asc' },
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Determine status for each license
    const licensesWithStatus = licenses.map((lic) => {
      let status: 'active' | 'expiring' | 'expired' = 'active';
      if (lic.expirationDate < now) {
        status = 'expired';
      } else if (lic.expirationDate <= thirtyDaysFromNow) {
        status = 'expiring';
      }
      return {
        name: lic.name,
        type: lic.type,
        status,
        expirationDate: lic.expirationDate.toISOString(),
      };
    });

    // Calculate compliance rate (active + expiring out of total)
    const activeCount = licensesWithStatus.filter(
      (l) => l.status === 'active' || l.status === 'expiring'
    ).length;
    const complianceRate = licenses.length > 0
      ? Math.round((activeCount / licenses.length) * 100)
      : 0;

    return NextResponse.json({
      organization: {
        name: share.org.name,
        tradeType: share.org.tradeType,
      },
      complianceRate,
      licenses: licensesWithStatus,
    });
  } catch (error) {
    console.error('Compliance share lookup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
