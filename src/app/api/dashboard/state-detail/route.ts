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

// GET: Detailed compliance info for a specific state
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
    const state = searchParams.get('state');

    if (!state) {
      return NextResponse.json({ error: 'State parameter is required' }, { status: 400 });
    }

    // Fetch all licenses for this state in the org
    const licenses = await db.license.findMany({
      where: {
        orgId: orgMember.orgId,
        state: state,
      },
      include: {
        ceTrackings: true,
      },
    });

    // Fetch insurance bonds for this org (insurance isn't state-specific in schema, but we include org-level ones)
    const insuranceBonds = await db.insuranceBond.findMany({
      where: { orgId: orgMember.orgId },
    });

    // Fetch state requirements for this state
    const stateRequirements = await db.stateRequirement.findMany({
      where: { state: state },
    });

    const now = new Date();

    // Map licenses with computed status and CE info
    const licensesWithDetails = licenses.map(license => {
      const status = computeLicenseStatus(license.expirationDate);
      const daysRemaining = Math.ceil(
        (new Date(license.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // CE tracking info
      const ceHoursEarned = license.ceTrackings.reduce((sum, ce) => sum + ce.hoursEarned, 0);
      const ceHoursRequired = license.ceTrackings.length > 0
        ? license.ceTrackings[0].hoursRequired
        : 0;

      // Find matching state requirement
      const matchingReq = stateRequirements.find(r => r.licenseType === license.type);

      return {
        id: license.id,
        name: license.name,
        type: license.type,
        licenseNumber: license.licenseNumber,
        issuedBy: license.issuedBy,
        issueDate: license.issueDate.toISOString(),
        expirationDate: license.expirationDate.toISOString(),
        status,
        daysRemaining,
        isRenewed: license.isRenewed,
        autoRenew: license.autoRenew,
        ceHoursEarned,
        ceHoursRequired: matchingReq?.ceHoursRequired || ceHoursRequired,
        ceHoursMissing: Math.max(0, (matchingReq?.ceHoursRequired || ceHoursRequired) - ceHoursEarned),
        renewalFee: matchingReq ? (matchingReq.renewalFeeMin + matchingReq.renewalFeeMax) / 2 : 0,
      };
    });

    // Missing requirements
    const missingRequirements: string[] = [];
    const expiredLicenses = licensesWithDetails.filter(l => l.status === 'expired');
    const expiringLicenses = licensesWithDetails.filter(l => l.status === 'expiring_soon');
    const insufficientCE = licensesWithDetails.filter(l => l.ceHoursMissing > 0);

    if (expiredLicenses.length > 0) {
      missingRequirements.push(`${expiredLicenses.length} expired license(s) need renewal`);
    }
    if (expiringLicenses.length > 0) {
      missingRequirements.push(`${expiringLicenses.length} license(s) expiring within 30 days`);
    }
    if (insufficientCE.length > 0) {
      missingRequirements.push(`${insufficientCE.length} license(s) with insufficient CE hours`);
    }

    // Risk assessment
    const riskScore = calculateStateRiskScore(licensesWithDetails);
    const riskLevel = riskScore >= 75 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 25 ? 'moderate' : 'low';

    // Compliance rate
    const activeLicenses = licensesWithDetails.filter(l => l.status === 'active').length;
    const complianceRate = licensesWithDetails.length > 0
      ? Math.round((activeLicenses / licensesWithDetails.length) * 100)
      : 100;

    // Insurance compliance
    const activeInsurance = insuranceBonds.filter(ib => {
      const status = ib.expirationDate > now ? 'active' : 'expired';
      return status === 'active';
    });

    return NextResponse.json({
      state,
      licenses: licensesWithDetails,
      insurance: insuranceBonds.map(ib => ({
        id: ib.id,
        name: ib.name,
        type: ib.type,
        policyNumber: ib.policyNumber,
        provider: ib.provider,
        expirationDate: ib.expirationDate.toISOString(),
        status: ib.expirationDate > now ? 'active' : 'expired',
        complianceStatus: ib.complianceStatus,
      })),
      stateRequirements: stateRequirements.map(req => ({
        licenseType: req.licenseType,
        renewPeriodMonths: req.renewPeriodMonths,
        ceHoursRequired: req.ceHoursRequired,
        renewalFeeMin: req.renewalFeeMin,
        renewalFeeMax: req.renewalFeeMax,
        bondRequired: req.bondRequired,
        insuranceRequired: req.insuranceRequired,
        boardName: req.boardName,
      })),
      summary: {
        totalLicenses: licensesWithDetails.length,
        activeLicenses,
        expiringLicenses: expiringLicenses.length,
        expiredLicenses: expiredLicenses.length,
        complianceRate,
        totalInsurance: insuranceBonds.length,
        activeInsurance: activeInsurance.length,
      },
      missingRequirements,
      riskAssessment: {
        score: riskScore,
        level: riskLevel,
      },
    });
  } catch (error) {
    console.error('State detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateStateRiskScore(licenses: Array<{ status: string; daysRemaining: number }>): number {
  if (licenses.length === 0) return 0;

  let totalRisk = 0;
  for (const license of licenses) {
    if (license.status === 'expired') {
      totalRisk += 100;
    } else if (license.daysRemaining < 30) {
      totalRisk += 75;
    } else if (license.daysRemaining < 60) {
      totalRisk += 50;
    } else if (license.daysRemaining < 90) {
      totalRisk += 25;
    }
    // 0 = safe, >90 days
  }

  return Math.round(totalRisk / licenses.length);
}
