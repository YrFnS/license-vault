import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET: Compliance forecast and risk analysis
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const membership = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const orgId = membership.orgId;
    const now = new Date();

    // Define forecast windows
    const windows = {
      30: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      60: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      90: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
    };

    // Get all data
    const [licenses, insuranceBonds, ceTrackings, qualifiers] = await Promise.all([
      db.license.findMany({ where: { orgId } }),
      db.insuranceBond.findMany({ where: { orgId } }),
      db.cETracking.findMany({ where: { orgId } }),
      db.qualifier.findMany({ where: { orgId } }),
    ]);

    const totalLicenses = licenses.length;
    const activeLicensesNow = licenses.filter((l) => l.expirationDate > now).length;
    const currentScore = totalLicenses > 0
      ? Math.round((activeLicensesNow / totalLicenses) * 100)
      : 100;

    // Calculate forecast for each window
    const forecastWindows = Object.entries(windows).map(([days, date]) => {
      const dayNum = parseInt(days);

      // Licenses expiring in this window
      const expiringInWindow = licenses.filter(
        (l) => l.expirationDate > now && l.expirationDate <= date
      );
      const alreadyExpired = licenses.filter((l) => l.expirationDate <= now);

      // Active licenses after this window (assuming no renewals)
      const activeAfterWindow = licenses.filter((l) => l.expirationDate > date).length;
      // Active if all expiring ones get renewed
      const activeIfRenewed = licenses.filter((l) => l.expirationDate > now).length;

      const scoreIfNoRenewal = totalLicenses > 0
        ? Math.round((activeAfterWindow / totalLicenses) * 100)
        : 100;
      const scoreIfRenewed = totalLicenses > 0
        ? Math.round((activeIfRenewed / totalLicenses) * 100)
        : 100;
      const scoreDrop = currentScore - scoreIfNoRenewal;

      // Insurance expiring in this window
      const insuranceExpiring = insuranceBonds.filter(
        (ib) => ib.expirationDate > now && ib.expirationDate <= date
      );

      // CE hours needed by this window
      const ceNeededSoon = ceTrackings.filter((ce) => {
        if (!ce.completionDate) return false;
        return ce.completionDate <= date && ce.hoursEarned < ce.hoursRequired;
      });

      // Qualifiers at risk in this window (qualifiers only track licenseExpiry, not insuranceExpiry)
      const qualifiersAtRisk = qualifiers.filter((q) => {
        const licenseAtRisk = q.licenseExpiry && q.licenseExpiry > now && q.licenseExpiry <= date;
        return licenseAtRisk;
      });

      return {
        days: dayNum,
        date: date.toISOString(),
        licensesExpiring: expiringInWindow.map((l) => ({
          id: l.id,
          name: l.name,
          type: l.type,
          state: l.state,
          expirationDate: l.expirationDate.toISOString(),
          daysUntil: Math.ceil((l.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        })),
        expiredCount: alreadyExpired.length,
        expiringCount: expiringInWindow.length,
        scoreIfNoRenewal,
        scoreIfRenewed,
        scoreDrop,
        insuranceExpiring: insuranceExpiring.map((ib) => ({
          id: ib.id,
          name: ib.name,
          type: ib.type,
          expirationDate: ib.expirationDate.toISOString(),
          daysUntil: Math.ceil((ib.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        })),
        ceGaps: ceNeededSoon.map((ce) => ({
          id: ce.id,
          courseName: ce.courseName,
          hoursEarned: ce.hoursEarned,
          hoursRequired: ce.hoursRequired,
          deficit: ce.hoursRequired - ce.hoursEarned,
        })),
        qualifiersAtRisk: qualifiersAtRisk.map((q) => ({
          id: q.id,
          name: `${q.firstName} ${q.lastName}`,
          riskType: 'license',
        })),
      };
    });

    // Risk scores per license
    const licenseRiskScores = licenses.map((license) => {
      let riskScore = 0;
      const daysUntilExpiry = Math.ceil(
        (license.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Expiration risk
      if (daysUntilExpiry < 0) riskScore += 50;
      else if (daysUntilExpiry <= 30) riskScore += 35;
      else if (daysUntilExpiry <= 60) riskScore += 20;
      else if (daysUntilExpiry <= 90) riskScore += 10;

      // Auto-renew reduces risk
      if (license.autoRenew) riskScore -= 15;

      // No renewal history increases risk
      if (!license.renewalHistory) riskScore += 5;

      // Clamp
      riskScore = Math.max(0, Math.min(100, riskScore));

      return {
        id: license.id,
        name: license.name,
        type: license.type,
        state: license.state,
        daysUntilExpiry,
        riskScore,
        riskLevel: riskScore >= 40 ? 'critical' : riskScore >= 20 ? 'high' : riskScore >= 10 ? 'medium' : 'low',
      };
    }).sort((a, b) => b.riskScore - a.riskScore);

    // What-if scenarios
    const whatIfScenarios = [
      {
        id: 'no-renewals',
        title: 'No Renewals',
        description: 'What happens if no licenses are renewed',
        currentScore,
        projectedScore30: forecastWindows[0].scoreIfNoRenewal,
        projectedScore60: forecastWindows[1].scoreIfNoRenewal,
        projectedScore90: forecastWindows[2].scoreIfNoRenewal,
        impact: currentScore - forecastWindows[2].scoreIfNoRenewal,
      },
      {
        id: 'all-renewed',
        title: 'All Renewed On Time',
        description: 'What happens if all expiring licenses are renewed on time',
        currentScore,
        projectedScore30: forecastWindows[0].scoreIfRenewed,
        projectedScore60: forecastWindows[1].scoreIfRenewed,
        projectedScore90: forecastWindows[2].scoreIfRenewed,
        impact: 0,
      },
    ];

    // Compliance trend direction
    const trendDirection = forecastWindows[0].scoreIfNoRenewal < currentScore ? 'declining' : 'stable';

    return NextResponse.json({
      currentScore,
      trendDirection,
      forecastWindows,
      licenseRiskScores: licenseRiskScores.slice(0, 20), // Top 20 riskiest
      whatIfScenarios,
      summary: {
        totalLicensesAtRisk: licenses.filter(
          (l) => l.expirationDate > now && l.expirationDate <= windows[90]
        ).length,
        totalExpiredLicenses: licenses.filter((l) => l.expirationDate <= now).length,
        totalInsuranceAtRisk: insuranceBonds.filter(
          (ib) => ib.expirationDate > now && ib.expirationDate <= windows[90]
        ).length,
        totalCeGaps: ceTrackings.filter((ce) => ce.hoursEarned < ce.hoursRequired).length,
        totalQualifiersAtRisk: qualifiers.filter((q) => {
          const licenseRisk = q.licenseExpiry && q.licenseExpiry <= windows[90];
          return !!licenseRisk;
        }).length,
      },
    });
  } catch (error) {
    console.error('Compliance forecast error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
