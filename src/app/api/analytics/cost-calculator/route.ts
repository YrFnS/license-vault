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
    const avgFineParam = searchParams.get('avgFine');
    const dailyPenaltyParam = searchParams.get('dailyPenalty');

    const avgFine = avgFineParam ? parseFloat(avgFineParam) : 2500;
    const dailyPenaltyRate = dailyPenaltyParam ? parseFloat(dailyPenaltyParam) : 100;

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Get all licenses
    const licenses = await db.license.findMany({
      where: { orgId: orgMember.orgId },
    });

    const expiredLicenses = licenses.filter((l) => l.expirationDate < now);
    const expiringLicenses = licenses.filter(
      (l) => l.expirationDate >= now && l.expirationDate <= thirtyDaysFromNow
    );

    // Calculate costs for expired licenses
    const expiredCosts = expiredLicenses.map((l) => {
      const daysOverdue = Math.ceil(
        (now.getTime() - new Date(l.expirationDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const fine = Math.min(avgFine + daysOverdue * dailyPenaltyRate, avgFine * 3);
      const riskLevel = daysOverdue > 90 ? 'high' : daysOverdue > 30 ? 'medium' : 'low';
      return {
        id: l.id,
        name: l.name,
        status: 'expired',
        daysOverdue,
        estimatedFine: Math.round(fine),
        riskLevel,
      };
    });

    // Calculate costs for expiring licenses (projected)
    const expiringCosts = expiringLicenses.map((l) => {
      const daysUntilExpiry = Math.ceil(
        (new Date(l.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const riskLevel = daysUntilExpiry <= 5 ? 'high' : daysUntilExpiry <= 15 ? 'medium' : 'low';
      return {
        id: l.id,
        name: l.name,
        status: 'expiring',
        daysOverdue: -daysUntilExpiry,
        estimatedFine: 0,
        riskLevel,
      };
    });

    const totalFinesRisk = expiredCosts.reduce((sum, l) => sum + l.estimatedFine, 0);
    const projectDelayCost = expiredLicenses.length * 5000;
    const lostContractsValue = expiredLicenses.length * 8000;
    const totalExposure = totalFinesRisk + projectDelayCost + lostContractsValue;

    return NextResponse.json({
      totalExposure,
      breakdown: {
        finesRisk: totalFinesRisk,
        projectDelayCost,
        lostContracts: lostContractsValue,
      },
      licenses: [...expiredCosts, ...expiringCosts],
      parameters: {
        avgFine,
        dailyPenaltyRate,
      },
    });
  } catch (error) {
    console.error('Cost calculator error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
