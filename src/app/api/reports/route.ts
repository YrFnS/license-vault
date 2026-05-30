import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET: Reports data
export async function GET() {
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

    const orgId = orgMember.orgId;
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    // Get all licenses for the org
    const licenses = await db.license.findMany({
      where: { orgId },
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

    // Compliance score
    const complianceScore = total > 0
      ? Math.round(((total - expired) / total) * 100)
      : 100;

    // License distribution by type
    const typeMap = new Map<string, number>();
    for (const license of licenses) {
      const type = license.type || 'Other';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    }
    const licenseDistribution = Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Monthly compliance trend (last 6 months)
    const complianceTrend: { month: string; rate: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const licensesByMonthEnd = licenses.filter((l) => new Date(l.createdAt) <= monthEnd);
      const totalByMonthEnd = licensesByMonthEnd.length;

      if (totalByMonthEnd === 0) {
        const monthLabel = monthDate.toLocaleString('en-US', { month: 'short' });
        complianceTrend.push({ month: monthLabel, rate: 100 });
      } else {
        const notExpiredByMonthEnd = licensesByMonthEnd.filter((l) => l.expirationDate > monthEnd).length;
        const rate = Math.round((notExpiredByMonthEnd / totalByMonthEnd) * 100);
        const monthLabel = monthDate.toLocaleString('en-US', { month: 'short' });
        complianceTrend.push({ month: monthLabel, rate });
      }
    }

    // License status distribution for pie/donut chart
    const statusDistribution = [
      { name: 'active', value: active, color: '#10b981' },
      { name: 'expiring', value: expiringSoon, color: '#f59e0b' },
      { name: 'expired', value: expired, color: '#ef4444' },
    ];

    // Insurance & bond summary
    const insuranceBonds = await db.insuranceBond.findMany({
      where: { orgId },
    });

    const activeInsurance = insuranceBonds.filter(
      (ib) => ib.status === 'active' && ib.type === 'insurance'
    );
    const activeBonds = insuranceBonds.filter(
      (ib) => ib.status === 'active' && ib.type === 'bond'
    );
    const totalCoverage = insuranceBonds
      .filter((ib) => ib.status === 'active')
      .reduce((sum, ib) => sum + ib.coverageAmount, 0);
    const totalPremium = insuranceBonds
      .filter((ib) => ib.status === 'active')
      .reduce((sum, ib) => sum + ib.premiumAmount, 0);

    const insuranceSummary = {
      totalPolicies: insuranceBonds.filter((ib) => ib.type === 'insurance').length,
      activePolicies: activeInsurance.length,
      totalBonds: insuranceBonds.filter((ib) => ib.type === 'bond').length,
      activeBonds: activeBonds.length,
      totalCoverage,
      totalPremium,
    };

    // Expiring licenses (within 90 days)
    const expiringLicenses = licenses
      .filter((l) => l.expirationDate >= now && l.expirationDate <= ninetyDaysFromNow)
      .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())
      .slice(0, 10)
      .map((l) => ({
        id: l.id,
        name: l.name,
        type: l.type,
        expirationDate: l.expirationDate.toISOString(),
        daysLeft: Math.ceil((new Date(l.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      }));

    return NextResponse.json({
      summary: {
        total,
        active,
        expiringSoon,
        expired,
        complianceScore,
      },
      licenseDistribution,
      complianceTrend,
      statusDistribution,
      insuranceSummary,
      expiringLicenses,
    });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
