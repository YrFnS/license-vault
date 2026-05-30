import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// US state abbreviation to full name mapping
const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
};

function computeLicenseStatus(expirationDate: Date): string {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (expirationDate < now) return 'expired';
  if (expirationDate <= thirtyDaysFromNow) return 'expiring_soon';
  return 'active';
}

// GET: Multi-state compliance overview
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Fetch all licenses for the org
    const licenses = await db.license.findMany({
      where: { orgId: orgMember.orgId },
    });

    // Also fetch insurance bonds for state context
    const insuranceBonds = await db.insuranceBond.findMany({
      where: { orgId: orgMember.orgId },
    });

    // Group licenses by state
    const stateMap = new Map<string, {
      total: number;
      active: number;
      expiring: number;
      expired: number;
      nextExpiration: Date | null;
    }>();

    for (const license of licenses) {
      const state = license.state || 'Unknown';

      if (!stateMap.has(state)) {
        stateMap.set(state, { total: 0, active: 0, expiring: 0, expired: 0, nextExpiration: null });
      }

      const data = stateMap.get(state)!;
      data.total++;

      const status = computeLicenseStatus(license.expirationDate);
      if (status === 'active') data.active++;
      else if (status === 'expiring_soon') data.expiring++;
      else data.expired++;

      if (!data.nextExpiration || license.expirationDate < data.nextExpiration) {
        data.nextExpiration = license.expirationDate;
      }
    }

    // Build the states array
    const states = Array.from(stateMap.entries()).map(([state, data]) => {
      const complianceRate = data.total > 0 ? Math.round((data.active / data.total) * 100) : 0;

      return {
        state,
        stateName: STATE_NAMES[state] || state,
        total: data.total,
        active: data.active,
        expiring: data.expiring,
        expired: data.expired,
        complianceRate,
        nextExpiration: data.nextExpiration ? data.nextExpiration.toISOString() : null,
      };
    });

    // Sort by state name
    states.sort((a, b) => a.stateName.localeCompare(b.stateName));

    // Calculate overall multi-state coverage (unique states with licenses / 50)
    const statesWithLicenses = states.filter(s => s.state !== 'Unknown').length;
    const overallMultiStateCoverage = Math.round((statesWithLicenses / 50) * 100);

    return NextResponse.json({
      states,
      overallMultiStateCoverage,
      totalStatesWithLicenses: statesWithLicenses,
    });
  } catch (error) {
    console.error('Multi-state dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
