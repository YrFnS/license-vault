import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
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

    const orgId = orgMember.orgId;
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Get all licenses
    const licenses = await db.license.findMany({ where: { orgId } });
    const total = licenses.length;
    const active = licenses.filter((l) => l.expirationDate > thirtyDaysFromNow).length;
    const expiring = licenses.filter(
      (l) => l.expirationDate >= now && l.expirationDate <= thirtyDaysFromNow
    ).length;
    const expired = licenses.filter((l) => l.expirationDate < now).length;

    // Compliance score
    const complianceScore = total === 0 ? 100 : Math.round((active / total) * 100);

    // Portfolio health (based on coverage and compliance)
    const coveredStates = new Set(
      licenses.filter((l) => l.expirationDate > now).map((l) => l.state).filter(Boolean)
    );
    const portfolioHealth = Math.min(
      100,
      Math.round((complianceScore * 0.6 + Math.min(coveredStates.size * 5, 100) * 0.4))
    );

    // Financial exposure (simple estimate)
    const avgFine = 2500;
    const financialExposure = expired * avgFine + expired * 5000 + expired * 8000;

    // Active risk items
    const activeRiskItems = expired + expiring;

    // Fetch other analytics data
    // Compliance trend (last 6 months)
    const trendData: { month: string; rate: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
      const existing = licenses.filter((l) => new Date(l.createdAt) <= monthEnd);
      const notExpired = existing.filter((l) => l.expirationDate > monthEnd).length;
      const rate = existing.length === 0 ? 100 : Math.round((notExpired / existing.length) * 100);
      trendData.push({
        month: monthDate.toLocaleString('en-US', { month: 'short' }),
        rate,
      });
    }

    // Team activity summary
    const auditLogs = await db.auditLog.findMany({ where: { orgId } });
    const orgMembers = await db.orgMember.findMany({
      where: { orgId },
      include: { user: { select: { id: true, name: true } } },
    });

    const userActions = new Map<string, number>();
    for (const log of auditLogs) {
      if (log.userId) {
        userActions.set(log.userId, (userActions.get(log.userId) || 0) + 1);
      }
    }

    const topUsers = orgMembers
      .map((m) => ({
        name: m.user?.name || m.fullName || m.email,
        actions: userActions.get(m.userId || '') || 0,
      }))
      .sort((a, b) => b.actions - a.actions)
      .slice(0, 5);

    // Cost breakdown
    const costBreakdown = {
      totalExposure: financialExposure,
      finesRisk: expired * avgFine,
      projectDelayCost: expired * 5000,
      lostContracts: expired * 8000,
    };

    // Cost per license
    const costLicenses = licenses
      .filter((l) => l.expirationDate < now || (l.expirationDate >= now && l.expirationDate <= thirtyDaysFromNow))
      .map((l) => {
        const isExpired = l.expirationDate < now;
        const daysOverdue = isExpired
          ? Math.ceil((now.getTime() - new Date(l.expirationDate).getTime()) / (1000 * 60 * 60 * 24))
          : -Math.ceil((new Date(l.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: l.id,
          name: l.name,
          status: isExpired ? 'expired' : 'expiring',
          daysOverdue,
          estimatedFine: isExpired ? Math.min(avgFine + daysOverdue * 100, avgFine * 3) : 0,
          riskLevel: isExpired ? (daysOverdue > 90 ? 'high' : daysOverdue > 30 ? 'medium' : 'low') : 'medium',
        };
      });

    return NextResponse.json({
      overview: {
        complianceScore,
        financialExposure,
        activeRiskItems,
        portfolioHealth,
        total,
        active,
        expiring,
        expired,
      },
      trends: trendData,
      cost: {
        ...costBreakdown,
        licenses: costLicenses,
        parameters: { avgFine, dailyPenaltyRate: 100 },
      },
      team: {
        totalActions: auditLogs.length,
        totalMembers: orgMembers.length,
        topUsers,
      },
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
