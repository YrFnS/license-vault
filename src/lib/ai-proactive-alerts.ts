import { db } from '@/lib/db';

export interface ProactiveAlert {
  id: string;
  type: 'expiration' | 'ce_gap' | 'insurance_deficiency' | 'renewal_needed' | 'compliance_risk';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  actionItems: string[];
  relatedItemId?: string;
  relatedItemType?: 'license' | 'insurance' | 'ce';
  dueDate?: string;
}

const severityOrder: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

/**
 * Generates proactive compliance alerts for a user based on their
 * licenses, insurance, CE tracking, and overall compliance status.
 */
export async function generateProactiveAlerts(userId: string): Promise<ProactiveAlert[]> {
  const alerts: ProactiveAlert[] = [];
  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Get user's organization
  const membership = await db.orgMember.findFirst({
    where: { userId },
    include: { org: true },
  });

  if (!membership || !membership.org) {
    return alerts;
  }

  const orgId = membership.org.id;

  // Fetch all licenses with CE trackings
  const licenses = await db.license.findMany({
    where: { orgId },
    include: { ceTrackings: true },
    orderBy: { expirationDate: 'asc' },
  });

  // Fetch insurance & bonds
  const insuranceBonds = await db.insuranceBond.findMany({
    where: { orgId },
    orderBy: { expirationDate: 'asc' },
  });

  // Calculate compliance score
  const activeLicenses = licenses.filter((l) => l.expirationDate > now);
  const complianceScore = licenses.length > 0
    ? Math.round((activeLicenses.length / licenses.length) * 100)
    : 100;

  // 1. Check licenses expiring within 90 days → expiration alerts
  for (const license of licenses) {
    const daysRemaining = Math.ceil(
      (license.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining <= 0) {
      // Already expired - critical
      alerts.push({
        id: `expired-${license.id}`,
        type: 'expiration',
        severity: 'critical',
        title: `${license.name} has expired`,
        description: `Your ${license.type} license "${license.name}" expired on ${license.expirationDate.toLocaleDateString()}. Operating with an expired license may result in fines and penalties.`,
        actionItems: [
          'Contact the issuing board immediately to initiate renewal',
          'Stop any work requiring this license until renewed',
          'Check if late renewal fees apply',
        ],
        relatedItemId: license.id,
        relatedItemType: 'license',
        dueDate: license.expirationDate.toISOString(),
      });
    } else if (daysRemaining <= 30) {
      // Expiring within 30 days - critical
      alerts.push({
        id: `expiring-30-${license.id}`,
        type: 'expiration',
        severity: 'critical',
        title: `${license.name} expires in ${daysRemaining} days`,
        description: `Your ${license.type} license "${license.name}" expires on ${license.expirationDate.toLocaleDateString()}. Immediate action required.`,
        actionItems: [
          'Submit renewal application immediately',
          'Verify all CE requirements are met',
          'Prepare renewal payment',
        ],
        relatedItemId: license.id,
        relatedItemType: 'license',
        dueDate: license.expirationDate.toISOString(),
      });
    } else if (daysRemaining <= 60) {
      // Expiring within 60 days - warning
      alerts.push({
        id: `expiring-60-${license.id}`,
        type: 'expiration',
        severity: 'warning',
        title: `${license.name} expires in ${daysRemaining} days`,
        description: `Your ${license.type} license "${license.name}" expires on ${license.expirationDate.toLocaleDateString()}. Start the renewal process now.`,
        actionItems: [
          'Begin renewal application process',
          'Complete any outstanding CE hours',
          'Gather required documentation',
        ],
        relatedItemId: license.id,
        relatedItemType: 'license',
        dueDate: license.expirationDate.toISOString(),
      });
    } else if (daysRemaining <= 90) {
      // Expiring within 90 days - info
      alerts.push({
        id: `expiring-90-${license.id}`,
        type: 'renewal_needed',
        severity: 'info',
        title: `${license.name} expires in ${daysRemaining} days`,
        description: `Your ${license.type} license "${license.name}" expires on ${license.expirationDate.toLocaleDateString()}. Consider starting renewal preparation.`,
        actionItems: [
          'Review renewal requirements for this license',
          'Plan CE completion if needed',
          'Set a reminder for renewal submission',
        ],
        relatedItemId: license.id,
        relatedItemType: 'license',
        dueDate: license.expirationDate.toISOString(),
      });
    }

    // 2. For expiring licenses, check CE requirements vs completed → CE gap alerts
    if (daysRemaining > 0 && daysRemaining <= 90 && license.ceTrackings.length > 0) {
      const ceCompleted = license.ceTrackings.reduce((sum, ce) => sum + ce.hoursEarned, 0);
      const ceRequired = Math.max(...license.ceTrackings.map((ce) => ce.hoursRequired));

      if (ceRequired > 0 && ceCompleted < ceRequired) {
        const ceGap = ceRequired - ceCompleted;
        const ceSeverity = daysRemaining <= 30 ? 'critical' : daysRemaining <= 60 ? 'warning' : 'info';

        alerts.push({
          id: `ce-gap-${license.id}`,
          type: 'ce_gap',
          severity: ceSeverity as 'critical' | 'warning' | 'info',
          title: `${ceGap} CE hours needed for ${license.name}`,
          description: `You have completed ${ceCompleted} of ${ceRequired} required CE hours for "${license.name}". ${ceGap} hours remaining before renewal deadline.`,
          actionItems: [
            `Complete ${ceGap} more CE hours before ${license.expirationDate.toLocaleDateString()}`,
            'Check available CE courses in your area',
            'Verify CE hours are in required categories',
          ],
          relatedItemId: license.id,
          relatedItemType: 'ce',
          dueDate: license.expirationDate.toISOString(),
        });
      }
    }
  }

  // 3. Check insurance with compliance status 'deficient' → insurance alerts
  for (const ib of insuranceBonds) {
    const daysRemaining = Math.ceil(
      (ib.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (ib.complianceStatus === 'deficient') {
      alerts.push({
        id: `insurance-deficient-${ib.id}`,
        type: 'insurance_deficiency',
        severity: 'critical',
        title: `${ib.name} is deficient`,
        description: `Your ${ib.type} "${ib.name}" from ${ib.provider} has a compliance status of "deficient". This may result in coverage gaps or contract violations.`,
        actionItems: [
          'Contact your insurance provider to resolve deficiencies',
          'Review required coverage amounts vs current coverage',
          'Update endorsement types as required',
          'Request updated certificate of insurance',
        ],
        relatedItemId: ib.id,
        relatedItemType: 'insurance',
      });
    }

    // Insurance expiring soon
    if (daysRemaining > 0 && daysRemaining <= 30) {
      alerts.push({
        id: `insurance-expiring-${ib.id}`,
        type: 'insurance_deficiency',
        severity: daysRemaining <= 5 ? 'critical' : 'warning',
        title: `${ib.name} expires in ${daysRemaining} days`,
        description: `Your ${ib.type} "${ib.name}" from ${ib.provider} expires on ${ib.expirationDate.toLocaleDateString()}.`,
        actionItems: [
          'Contact your provider to renew the policy',
          'Obtain an updated certificate of insurance',
          'Notify holders and additional insured parties',
        ],
        relatedItemId: ib.id,
        relatedItemType: 'insurance',
        dueDate: ib.expirationDate.toISOString(),
      });
    } else if (daysRemaining > 30 && daysRemaining <= 90) {
      alerts.push({
        id: `insurance-expiring-90-${ib.id}`,
        type: 'insurance_deficiency',
        severity: 'info',
        title: `${ib.name} expires in ${daysRemaining} days`,
        description: `Your ${ib.type} "${ib.name}" from ${ib.provider} expires on ${ib.expirationDate.toLocaleDateString()}.`,
        actionItems: [
          'Review policy terms and coverage',
          'Contact your provider about renewal options',
        ],
        relatedItemId: ib.id,
        relatedItemType: 'insurance',
        dueDate: ib.expirationDate.toISOString(),
      });
    }

    // Expired insurance
    if (daysRemaining <= 0) {
      alerts.push({
        id: `insurance-expired-${ib.id}`,
        type: 'insurance_deficiency',
        severity: 'critical',
        title: `${ib.name} has expired`,
        description: `Your ${ib.type} "${ib.name}" from ${ib.provider} expired on ${ib.expirationDate.toLocaleDateString()}. You may be operating without required coverage.`,
        actionItems: [
          'Renew or obtain replacement coverage immediately',
          'Notify project owners and general contractors',
          'Verify no claims are pending on the expired policy',
        ],
        relatedItemId: ib.id,
        relatedItemType: 'insurance',
      });
    }
  }

  // 4. Check overall compliance score → compliance risk alerts if score < 70
  if (complianceScore < 70 && licenses.length > 0) {
    alerts.push({
      id: 'compliance-risk-low',
      type: 'compliance_risk',
      severity: complianceScore < 50 ? 'critical' : 'warning',
      title: `Compliance score is ${complianceScore}%`,
      description: `Your organization's compliance score is ${complianceScore}%. This indicates significant compliance risks that need immediate attention. ${expiredLicensesCount(licenses, now)} license(s) are expired and ${expiringLicensesCount(licenses, now, thirtyDaysFromNow)} are expiring within 30 days.`,
      actionItems: [
        'Prioritize renewing expired licenses',
        'Set up renewal reminders for expiring licenses',
        'Review compliance gaps and create an action plan',
        'Consider using auto-renewal where available',
      ],
    });
  } else if (complianceScore >= 70 && complianceScore < 90 && licenses.length > 0) {
    alerts.push({
      id: 'compliance-risk-moderate',
      type: 'compliance_risk',
      severity: 'info',
      title: `Compliance score is ${complianceScore}%`,
      description: `Your compliance score is ${complianceScore}%. While acceptable, there are areas that could be improved to reach full compliance.`,
      actionItems: [
        'Review expiring licenses and begin renewal early',
        'Ensure CE requirements are on track',
        'Verify insurance policies meet all requirements',
      ],
    });
  }

  // Sort by severity (critical first), then by due date
  alerts.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    // If severity is the same, sort by due date (earlier first)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  return alerts;
}

function expiredLicensesCount(licenses: { expirationDate: Date }[], now: Date): number {
  return licenses.filter((l) => l.expirationDate <= now).length;
}

function expiringLicensesCount(licenses: { expirationDate: Date }[], now: Date, threshold: Date): number {
  return licenses.filter((l) => l.expirationDate > now && l.expirationDate <= threshold).length;
}
