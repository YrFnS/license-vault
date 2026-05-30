import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Determine number of data points and interval
    let totalDays: number;
    let intervalDays: number;
    let labelFormat: string;

    switch (period) {
      case '7d':
        totalDays = 7;
        intervalDays = 1;
        labelFormat = 'short';
        break;
      case '90d':
        totalDays = 90;
        intervalDays = 7;
        labelFormat = 'short';
        break;
      case '1y':
        totalDays = 365;
        intervalDays = 30;
        labelFormat = 'month';
        break;
      case '30d':
      default:
        totalDays = 30;
        intervalDays = 1;
        labelFormat = 'short';
        break;
    }

    // Get all licenses for the org
    const licenses = await db.license.findMany({
      where: { orgId: orgMember.orgId },
    });

    const now = new Date();
    const data: { date: string; score: number }[] = [];

    // Calculate compliance score at each time point
    for (let i = totalDays; i >= 0; i -= intervalDays) {
      const pointDate = new Date(now);
      pointDate.setDate(pointDate.getDate() - i);
      pointDate.setHours(23, 59, 59, 999);

      // Licenses that existed by this date
      const existingLicenses = licenses.filter(
        (l) => new Date(l.createdAt) <= pointDate
      );
      const total = existingLicenses.length;

      // Active licenses at this point (not expired by pointDate)
      const active = existingLicenses.filter(
        (l) => l.expirationDate > pointDate
      ).length;

      const score = total === 0 ? 100 : Math.round((active / total) * 100);

      let label: string;
      if (labelFormat === 'month') {
        label = pointDate.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      } else {
        label = pointDate.toLocaleString('en-US', { month: 'short', day: 'numeric' });
      }

      data.push({ date: label, score });
    }

    return NextResponse.json({ data, riskThreshold: 80 });
  } catch (error) {
    console.error('Compliance trends error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
