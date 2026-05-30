import { db } from '@/lib/db';

/**
 * Builds a rich context string about the user's compliance state
 * for use in AI chat system prompts.
 */
export async function buildUserContext(userId: string): Promise<string> {
  try {
    // 1. Get user's organization membership
    const membership = await db.orgMember.findFirst({
      where: { userId },
      include: { org: true },
    });

    if (!membership || !membership.org) {
      return 'No organization found for this user.';
    }

    const org = membership.org;
    const orgId = org.id;
    const now = new Date();
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // 2. Fetch all licenses
    const licenses = await db.license.findMany({
      where: { orgId },
      include: { ceTrackings: true },
      orderBy: { expirationDate: 'asc' },
    });

    // 3. Fetch insurance & bonds
    const insuranceBonds = await db.insuranceBond.findMany({
      where: { orgId },
      orderBy: { expirationDate: 'asc' },
    });

    // 4. Fetch state requirements for relevant states/license types
    const stateLicenseTypes = [...new Set(
      licenses.map((l) => {
        const state = l.issuedBy.includes(',') ? l.issuedBy.split(',').pop()?.trim() : org.primaryState;
        return `${state || org.primaryState}|${l.type}`;
      })
    )];

    const stateRequirements = await db.stateRequirement.findMany({
      where: {
        OR: stateLicenseTypes.map((slt) => {
          const [state, licenseType] = slt.split('|');
          return { state: state || org.primaryState, licenseType: licenseType || 'general' };
        }),
      },
    });

    // 5. Fetch recent audit logs
    const auditLogs = await db.auditLog.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Calculate license statuses
    const activeLicenses = licenses.filter((l) => l.expirationDate > now && !l.isRenewed);
    const expiringLicenses = licenses.filter(
      (l) => l.expirationDate > now && l.expirationDate <= ninetyDaysFromNow && !l.isRenewed
    );
    const expiredLicenses = licenses.filter((l) => l.expirationDate <= now);

    // Calculate compliance score
    const totalLicenses = licenses.length;
    const activeCount = activeLicenses.length;
    const complianceScore = totalLicenses > 0 ? Math.round((activeCount / totalLicenses) * 100) : 100;

    // Build the context string
    let context = '';

    // Organization info
    context += `USER CONTEXT:\n`;
    context += `Organization: ${org.name}, Trade Type: ${org.tradeType}, Primary State: ${org.primaryState}\n`;
    context += `Compliance Score: ${complianceScore}%\n\n`;

    // Licenses
    context += `LICENSES (Total: ${totalLicenses}):\n`;
    for (const license of licenses) {
      const daysRemaining = Math.ceil(
        (license.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const status = daysRemaining <= 0 ? 'Expired' : daysRemaining <= 90 ? 'Expiring' : 'Active';

      // Calculate CE hours for this license
      const ceCompleted = license.ceTrackings.reduce((sum, ce) => sum + ce.hoursEarned, 0);
      const ceRequired = license.ceTrackings.length > 0
        ? Math.max(...license.ceTrackings.map((ce) => ce.hoursRequired))
        : 0;

      context += `- ${license.name} (${license.type}) - ${license.issuedBy} - Status: ${status} - Expires: ${license.expirationDate.toLocaleDateString()} - Days Remaining: ${daysRemaining}\n`;
      context += `  Renewal needed: ${!license.isRenewed ? 'Yes' : 'No'}, Auto-renew: ${license.autoRenew ? 'Yes' : 'No'}\n`;
      if (ceRequired > 0) {
        context += `  CE Hours: ${ceCompleted}/${ceRequired}\n`;
      }
    }

    // Insurance & Bonds
    context += `\nINSURANCE & BONDS (Total: ${insuranceBonds.length}):\n`;
    for (const ib of insuranceBonds) {
      const daysRemaining = Math.ceil(
        (ib.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      context += `- ${ib.name} (${ib.type}) - Provider: ${ib.provider} - Expires: ${ib.expirationDate.toLocaleDateString()} (${daysRemaining} days) - Compliance: ${ib.complianceStatus}\n`;
      if (ib.coverageAmount > 0) {
        context += `  Coverage: $${ib.coverageAmount.toLocaleString()}, Premium: $${ib.premiumAmount.toLocaleString()}\n`;
      }
    }

    // Compliance gaps
    context += `\nCOMPLIANCE GAPS:\n`;
    const gaps: string[] = [];

    for (const license of expiredLicenses) {
      gaps.push(`EXPIRED: ${license.name} (${license.type}) - expired on ${license.expirationDate.toLocaleDateString()}`);
    }

    for (const license of expiringLicenses) {
      const days = Math.ceil(
        (license.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const ceCompleted = license.ceTrackings.reduce((sum, ce) => sum + ce.hoursEarned, 0);
      const ceRequired = license.ceTrackings.length > 0
        ? Math.max(...license.ceTrackings.map((ce) => ce.hoursRequired))
        : 0;

      gaps.push(`EXPIRING SOON: ${license.name} expires in ${days} days`);
      if (ceRequired > 0 && ceCompleted < ceRequired) {
        gaps.push(`CE GAP: ${license.name} needs ${ceRequired - ceCompleted} more CE hours (${ceCompleted}/${ceRequired} completed)`);
      }
    }

    const deficientInsurance = insuranceBonds.filter((ib) => ib.complianceStatus === 'deficient');
    for (const ib of deficientInsurance) {
      gaps.push(`INSURANCE DEFICIENT: ${ib.name} (${ib.type}) - compliance status is deficient`);
    }

    const expiringInsurance = insuranceBonds.filter((ib) => {
      const days = Math.ceil(
        (ib.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return days > 0 && days <= 90;
    });
    for (const ib of expiringInsurance) {
      const days = Math.ceil(
        (ib.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      gaps.push(`INSURANCE EXPIRING: ${ib.name} expires in ${days} days`);
    }

    if (gaps.length === 0) {
      context += `- No compliance gaps found. All licenses and insurance are in good standing.\n`;
    } else {
      for (const gap of gaps) {
        context += `- ${gap}\n`;
      }
    }

    // Upcoming deadlines
    context += `\nUPCOMING DEADLINES (Next 90 days):\n`;
    const upcomingLicenses = licenses.filter((l) => {
      const days = Math.ceil(
        (l.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return days > 0 && days <= 90;
    });

    if (upcomingLicenses.length === 0 && expiringInsurance.length === 0) {
      context += `- No upcoming deadlines in the next 90 days.\n`;
    } else {
      for (const license of upcomingLicenses) {
        const days = Math.ceil(
          (license.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const ceCompleted = license.ceTrackings.reduce((sum, ce) => sum + ce.hoursEarned, 0);
        const ceRequired = license.ceTrackings.length > 0
          ? Math.max(...license.ceTrackings.map((ce) => ce.hoursRequired))
          : 0;
        const ceGap = ceRequired > 0 ? ` - needs ${Math.max(0, ceRequired - ceCompleted)} more CE hours for renewal` : '';
        context += `- ${license.name} expires in ${days} days${ceGap}\n`;
      }
      for (const ib of expiringInsurance) {
        const days = Math.ceil(
          (ib.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        context += `- ${ib.name} (${ib.type}) expires in ${days} days\n`;
      }
    }

    // State requirements
    context += `\nSTATE REQUIREMENTS:\n`;
    if (stateRequirements.length === 0) {
      context += `- No specific state requirements found for the user's licenses.\n`;
    } else {
      for (const req of stateRequirements) {
        context += `- ${req.state} ${req.licenseType}: ${req.ceHoursRequired} CE hours required, Renewal every ${req.renewPeriodMonths} months, Bond required: ${req.bondRequired ? `Yes ($${req.bondAmountMin.toLocaleString()}+)` : 'No'}`;
        if (req.boardName) {
          context += `, Board: ${req.boardName}`;
        }
        if (req.boardPhone) {
          context += `, Phone: ${req.boardPhone}`;
        }
        context += `\n`;
      }
    }

    // Recent activity
    if (auditLogs.length > 0) {
      context += `\nRECENT ACTIVITY:\n`;
      for (const log of auditLogs) {
        context += `- [${log.createdAt.toLocaleDateString()}] ${log.action} ${log.entityType}${log.entityName ? ` "${log.entityName}"` : ''}\n`;
      }
    }

    return context;
  } catch (error) {
    console.error('Error building user context:', error);
    return 'Unable to load user compliance data at this time.';
  }
}
