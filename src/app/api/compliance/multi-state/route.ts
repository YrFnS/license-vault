import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET: Multi-state compliance breakdown
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
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Get all licenses with their locations
    const licenses = await db.license.findMany({
      where: { orgId },
      include: {
        location: { select: { state: true } },
      },
    });

    // Get insurance
    const insuranceBonds = await db.insuranceBond.findMany({
      where: { orgId },
    });

    // Get qualifiers
    const qualifiers = await db.qualifier.findMany({
      where: { orgId },
    });

    // Group licenses by state
    const stateMap = new Map<string, {
      state: string;
      licenses: typeof licenses;
      total: number;
      active: number;
      expiring: number;
      expired: number;
    }>();

    for (const license of licenses) {
      const state = license.state || license.location?.state || 'Unknown';
      if (!stateMap.has(state)) {
        stateMap.set(state, {
          state,
          licenses: [],
          total: 0,
          active: 0,
          expiring: 0,
          expired: 0,
        });
      }
      const entry = stateMap.get(state)!;
      entry.licenses.push(license);
      entry.total++;

      if (license.expirationDate < now) {
        entry.expired++;
      } else if (license.expirationDate <= thirtyDaysFromNow) {
        entry.expiring++;
      } else {
        entry.active++;
      }
    }

    // Calculate state compliance scores
    const stateBreakdown = Array.from(stateMap.values()).map((entry) => {
      const score = entry.total > 0
        ? Math.round(((entry.total - entry.expired) / entry.total) * 100)
        : 100;
      return {
        state: entry.state,
        total: entry.total,
        active: entry.active,
        expiring: entry.expiring,
        expired: entry.expired,
        score,
        licenses: entry.licenses.map((l) => ({
          id: l.id,
          name: l.name,
          type: l.type,
          licenseNumber: l.licenseNumber,
          expirationDate: l.expirationDate.toISOString(),
          status: l.expirationDate < now ? 'expired' : l.expirationDate <= thirtyDaysFromNow ? 'expiring_soon' : 'active',
          daysUntil: Math.ceil((l.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        })),
      };
    }).sort((a, b) => a.score - b.score); // Worst compliance first

    // Multi-state summary
    const totalStates = stateBreakdown.length;
    const fullyCompliantStates = stateBreakdown.filter((s) => s.score === 100).length;
    const atRiskStates = stateBreakdown.filter((s) => s.score < 80).length;
    const criticalStates = stateBreakdown.filter((s) => s.score < 50);

    // State comparison data (for the comparison table)
    const stateComparison = stateBreakdown.map((s) => ({
      state: s.state,
      totalLicenses: s.total,
      active: s.active,
      expiring: s.expiring,
      expired: s.expired,
      score: s.score,
      riskLevel: s.score >= 80 ? 'low' : s.score >= 50 ? 'medium' : 'high',
    }));

    // Cross-state license gaps (states where you have expired licenses but could be operational)
    const expansionOpportunities = stateBreakdown
      .filter((s) => s.expired > 0)
      .map((s) => ({
        state: s.state,
        expiredCount: s.expired,
        licenseTypes: [...new Set(s.licenses.filter(l => l.status === 'expired').map(l => l.type))],
      }));

    return NextResponse.json({
      stateBreakdown,
      stateComparison,
      summary: {
        totalStates,
        fullyCompliantStates,
        atRiskStates,
        criticalStatesCount: criticalStates.length,
        totalLicenses: licenses.length,
        totalInsurance: insuranceBonds.length,
        totalQualifiers: qualifiers.length,
      },
      expansionOpportunities,
    });
  } catch (error) {
    console.error('Multi-state compliance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
