import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

function computeLicenseStatus(expirationDate: Date): string {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (expirationDate < now) return 'expired';
  if (expirationDate <= thirtyDaysFromNow) return 'expiring_soon';
  return 'active';
}

function calculateRiskScore(daysRemaining: number): number {
  if (daysRemaining < 0) return 100; // expired
  if (daysRemaining < 30) return 75; // danger
  if (daysRemaining < 60) return 50; // caution
  if (daysRemaining < 90) return 25; // warning
  return 0; // safe
}

function getRiskLabel(score: number): string {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'moderate';
  return 'low';
}

// GET: Compliance forecast with risk analysis
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const scenario = searchParams.get('scenario');
    const skipLicenseId = searchParams.get('licenseId');

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(now.getDate() + 60);
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(now.getDate() + 90);

    // Fetch all licenses with CE tracking
    const licenses = await db.license.findMany({
      where: { orgId: orgMember.orgId },
      include: {
        ceTrackings: true,
      },
    });

    // Fetch insurance bonds
    const insuranceBonds = await db.insuranceBond.findMany({
      where: { orgId: orgMember.orgId },
    });

    // Fetch state requirements for cost estimation
    const stateRequirements = await db.stateRequirement.findMany();

    // Build forecast items from licenses
    const licenseItems = licenses.map(license => {
      const daysRemaining = Math.ceil(
        (new Date(license.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const matchingReq = stateRequirements.find(
        r => r.state === license.state && r.licenseType === license.type
      );

      const ceHoursEarned = license.ceTrackings.reduce((sum, ce) => sum + ce.hoursEarned, 0);
      const ceHoursRequired = matchingReq?.ceHoursRequired || 0;
      const renewalFee = matchingReq ? (matchingReq.renewalFeeMin + matchingReq.renewalFeeMax) / 2 : 0;

      return {
        id: license.id,
        name: license.name,
        type: 'license' as const,
        licenseType: license.type,
        state: license.state,
        expirationDate: license.expirationDate.toISOString(),
        daysRemaining,
        status: computeLicenseStatus(license.expirationDate),
        riskScore: calculateRiskScore(daysRemaining),
        renewalFee,
        ceHoursNeeded: Math.max(0, ceHoursRequired - ceHoursEarned),
        ceHoursEarned,
        ceHoursRequired,
      };
    });

    // Build forecast items from insurance bonds
    const insuranceItems = insuranceBonds.map(bond => {
      const daysRemaining = Math.ceil(
        (new Date(bond.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: bond.id,
        name: bond.name,
        type: 'insurance' as const,
        licenseType: bond.type,
        state: null,
        expirationDate: bond.expirationDate.toISOString(),
        daysRemaining,
        status: bond.expirationDate < now ? 'expired' : (bond.expirationDate <= thirtyDaysFromNow ? 'expiring_soon' : 'active'),
        riskScore: calculateRiskScore(daysRemaining),
        renewalFee: bond.premiumAmount,
        ceHoursNeeded: 0,
        ceHoursEarned: 0,
        ceHoursRequired: 0,
      };
    });

    const allItems = [...licenseItems, ...insuranceItems];

    // 30-day forecast
    const forecast30 = buildForecast(allItems, now, thirtyDaysFromNow);
    // 60-day forecast
    const forecast60 = buildForecast(allItems, now, sixtyDaysFromNow);
    // 90-day forecast
    const forecast90 = buildForecast(allItems, now, ninetyDaysFromNow);

    // Organization risk score (weighted average)
    const orgRiskScore = allItems.length > 0
      ? Math.round(allItems.reduce((sum, item) => sum + item.riskScore, 0) / allItems.length)
      : 0;

    const riskLevel = getRiskLabel(orgRiskScore);

    // Current compliance score
    const activeItems = allItems.filter(i => i.status === 'active').length;
    const totalItems = allItems.length;
    const complianceScore = totalItems > 0 ? Math.round((activeItems / totalItems) * 100) : 100;

    // "What-If" scenario analysis
    let whatIfResult = null;
    if (scenario === 'skip_renewal' && skipLicenseId) {
      const skippedItem = allItems.find(i => i.id === skipLicenseId);
      if (skippedItem) {
        // Recalculate without this item being active
        const remainingItems = allItems.filter(i => i.id !== skipLicenseId);
        const activeRemaining = remainingItems.filter(i => i.status === 'active').length;
        const newComplianceScore = remainingItems.length > 0
          ? Math.round((activeRemaining / remainingItems.length) * 100)
          : 0;

        // Find at-risk items (ones that would cascade)
        const atRiskItems = remainingItems.filter(i => i.riskScore >= 50);

        // Financial exposure
        const financialExposure = skippedItem.renewalFee + atRiskItems.reduce((sum, i) => sum + i.renewalFee, 0);

        whatIfResult = {
          skippedItem: {
            id: skippedItem.id,
            name: skippedItem.name,
            type: skippedItem.type,
          },
          originalComplianceScore: complianceScore,
          newComplianceScore,
          complianceDelta: newComplianceScore - complianceScore,
          atRiskItems: atRiskItems.map(i => ({
            id: i.id,
            name: i.name,
            type: i.type,
            riskScore: i.riskScore,
          })),
          financialExposure,
          impact: newComplianceScore < 50 ? 'critical' : newComplianceScore < 75 ? 'high' : newComplianceScore < 90 ? 'moderate' : 'low',
        };
      }
    }

    return NextResponse.json({
      forecast: {
        next30Days: forecast30,
        next60Days: forecast60,
        next90Days: forecast90,
      },
      riskScore: orgRiskScore,
      riskLevel,
      complianceScore,
      totalItems,
      activeItems,
      itemsNeedingAction: allItems.filter(i => i.riskScore >= 50).length,
      estimatedCostToMaintain: allItems
        .filter(i => i.daysRemaining <= 90 && i.daysRemaining >= 0)
        .reduce((sum, i) => sum + i.renewalFee, 0),
      totalCeHoursNeeded: allItems.reduce((sum, i) => sum + i.ceHoursNeeded, 0),
      whatIf: whatIfResult,
      allItems: allItems.map(i => ({
        id: i.id,
        name: i.name,
        type: i.type,
        expirationDate: i.expirationDate,
        daysRemaining: i.daysRemaining,
        riskScore: i.riskScore,
        renewalFee: i.renewalFee,
      })),
    });
  } catch (error) {
    console.error('Forecast error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildForecast(
  items: Array<{
    id: string;
    name: string;
    type: 'license' | 'insurance';
    licenseType: string;
    state: string | null;
    expirationDate: string;
    daysRemaining: number;
    status: string;
    riskScore: number;
    renewalFee: number;
    ceHoursNeeded: number;
    ceHoursEarned: number;
    ceHoursRequired: number;
  }>,
  startDate: Date,
  endDate: Date
) {
  const expiringItems = items.filter(i => {
    const exp = new Date(i.expirationDate);
    return exp >= startDate && exp <= endDate;
  });

  const newItemsNeeded = expiringItems.filter(i => !i.status.includes('active')).length;
  const estimatedCost = expiringItems.reduce((sum, i) => sum + i.renewalFee, 0);
  const ceHoursNeeded = expiringItems.reduce((sum, i) => sum + i.ceHoursNeeded, 0);

  return {
    expiringItems: expiringItems.map(i => ({
      id: i.id,
      name: i.name,
      type: i.type,
      licenseType: i.licenseType,
      state: i.state,
      expirationDate: i.expirationDate,
      daysRemaining: i.daysRemaining,
      status: i.status,
      riskScore: i.riskScore,
      renewalFee: i.renewalFee,
      ceHoursNeeded: i.ceHoursNeeded,
    })),
    newItemsNeeded,
    estimatedCost,
    ceHoursNeeded,
  };
}
