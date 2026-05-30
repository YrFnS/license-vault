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

    // Get user's org
    const orgMember = await db.orgMember.findFirst({
      where: { userId: (session.user as any).id },
      include: { org: true },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const orgId = orgMember.orgId;
    const primaryState = orgMember.org.primaryState;

    // Get all licenses for the org
    const licenses = await db.license.findMany({
      where: { orgId },
      orderBy: { expirationDate: 'asc' },
    });

    // Get all locations for the org (to determine which states they operate in)
    const locations = await db.location.findMany({
      where: { orgId, state: { not: null } },
    });

    // Determine all states the org operates in
    const orgStates = new Set<string>();
    if (primaryState) orgStates.add(primaryState);
    locations.forEach(l => { if (l.state) orgStates.add(l.state); });

    // Get state requirements for all org states
    const stateRequirements = await db.stateRequirement.findMany({
      where: { state: { in: Array.from(orgStates) } },
    });

    // Get CE tracking for the org
    const ceTrackings = await db.cETracking.findMany({
      where: { orgId },
    });

    // Get insurance bonds for the org
    const insuranceBonds = await db.insuranceBond.findMany({
      where: { orgId },
    });

    // Group licenses by state (using locationId → Location → state)
    const locationMap = new Map(locations.map(l => [l.id, l.state]));
    const licensesByState: Record<string, typeof licenses> = {};
    
    for (const license of licenses) {
      const state = license.locationId 
        ? (locationMap.get(license.locationId) || primaryState || 'Unknown')
        : primaryState || 'Unknown';
      if (!licensesByState[state]) licensesByState[state] = [];
      licensesByState[state].push(license);
    }

    // Build compliance data per state
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const stateCompliance = Array.from(orgStates).map(state => {
      const stateLicenses = licensesByState[state] || [];
      const stateReqs = stateRequirements.filter(r => r.state === state);

      const activeCount = stateLicenses.filter(l => l.expirationDate > now).length;
      const expiringCount = stateLicenses.filter(l => 
        l.expirationDate > now && l.expirationDate <= thirtyDaysFromNow
      ).length;
      const expiredCount = stateLicenses.filter(l => l.expirationDate <= now).length;

      // Calculate compliance score for this state
      const complianceScore = stateLicenses.length > 0
        ? Math.round((activeCount / stateLicenses.length) * 100)
        : 100;

      // Check requirement gaps
      const requiredLicenseTypes = stateReqs.map(r => r.licenseType);
      const existingLicenseTypes = new Set(stateLicenses.map(l => l.type));
      const missingLicenseTypes = requiredLicenseTypes.filter(t => !existingLicenseTypes.has(t));

      // CE hours tracking
      const ceHoursCompleted = ceTrackings
        .filter(ce => {
          const lic = licenses.find(l => l.id === ce.licenseId);
          if (!lic) return false;
          const licState = lic.locationId 
            ? (locationMap.get(lic.locationId) || primaryState)
            : primaryState;
          return licState === state;
        })
        .reduce((sum, ce) => sum + ce.hoursEarned, 0);
      const ceHoursRequired = stateReqs.reduce((sum, r) => sum + r.ceHoursRequired, 0);

      // Insurance/Bond requirements
      const bondRequired = stateReqs.some(r => r.bondRequired);
      const insuranceRequired = stateReqs.some(r => r.insuranceRequired);
      const hasBond = insuranceBonds.some(ib => ib.type === 'bond' && ib.status === 'active');
      const hasInsurance = insuranceBonds.some(ib => ib.type === 'insurance' && ib.status === 'active');

      return {
        state,
        isPrimary: state === primaryState,
        totalLicenses: stateLicenses.length,
        activeLicenses: activeCount,
        expiringLicenses: expiringCount,
        expiredLicenses: expiredCount,
        complianceScore,
        requirements: stateReqs.length,
        missingLicenseTypes,
        ceHoursCompleted: Math.round(ceHoursCompleted * 10) / 10,
        ceHoursRequired: Math.round(ceHoursRequired * 10) / 10,
        bondRequired,
        insuranceRequired,
        hasBond,
        hasInsurance,
        licenses: stateLicenses.map(l => ({
          id: l.id,
          name: l.name,
          type: l.type,
          expirationDate: l.expirationDate.toISOString(),
          status: l.expirationDate <= now ? 'expired' : l.expirationDate <= thirtyDaysFromNow ? 'expiring_soon' : 'active',
        })),
      };
    });

    // Overall stats
    const totalLicenses = licenses.length;
    const totalActive = licenses.filter(l => l.expirationDate > now).length;
    const overallScore = totalLicenses > 0 ? Math.round((totalActive / totalLicenses) * 100) : 100;

    // Gaps across all states
    const allGaps = stateCompliance.flatMap(sc => 
      sc.missingLicenseTypes.map(lt => ({
        state: sc.state,
        licenseType: lt,
      }))
    );

    return NextResponse.json({
      primaryState,
      totalStates: orgStates.size,
      overallScore,
      stateCompliance: stateCompliance.sort((a, b) => {
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        return a.complianceScore - b.complianceScore;
      }),
      complianceGaps: allGaps,
    });
  } catch (error) {
    console.error('Multi-state compliance API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
