import { db } from '@/lib/db';

// ─── Types ─────────────────────────────────────────────────────────────────

interface ExpirationCheckResult {
  licensesExpiring: number;
  licensesExpired: number;
  notificationsCreated: number;
}

interface InsuranceExpirationCheckResult {
  insuranceExpiring: number;
  insuranceExpired: number;
  notificationsCreated: number;
}

interface EscalationResult {
  escalated: number;
  notificationsCreated: number;
}

export interface FullCheckResult {
  licensesExpiring: number;
  licensesExpired: number;
  insuranceExpiring: number;
  insuranceExpired: number;
  escalations: number;
  notificationsCreated: number;
  autoFlagged: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function calculateNextRunAt(frequency: string, from?: Date): Date {
  const base = from || new Date();
  const next = new Date(base);
  switch (frequency) {
    case 'hourly':
      next.setHours(next.getHours() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'daily':
    default:
      next.setDate(next.getDate() + 1);
      break;
  }
  return next;
}

// ─── Expiration Check ──────────────────────────────────────────────────────

export async function runExpirationCheck(orgId: string): Promise<ExpirationCheckResult> {
  const now = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(now.getDate() + 30);

  let licensesExpiring = 0;
  let licensesExpired = 0;
  let notificationsCreated = 0;

  // Find expiring licenses (within 30 days, not renewed)
  const expiringLicenses = await db.license.findMany({
    where: {
      orgId,
      expirationDate: { gt: now, lte: thirtyDays },
      isRenewed: false,
    },
  });

  // Find expired licenses
  const expiredLicenses = await db.license.findMany({
    where: {
      orgId,
      expirationDate: { lt: now },
      isRenewed: false,
    },
  });

  licensesExpiring = expiringLicenses.length;
  licensesExpired = expiredLicenses.length;

  // Get org admins/owners for notifications
  const members = await db.orgMember.findMany({
    where: { orgId, role: { in: ['owner', 'admin'] } },
    include: { user: true },
  });

  // Get automation settings
  const settings = await db.automationSetting.findUnique({ where: { orgId } });

  // Create notifications for expiring licenses
  if (settings?.notifyExpiring !== false) {
    for (const license of expiringLicenses) {
      const daysLeft = Math.ceil(
        (license.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if notification already exists today (dedup by title pattern + date)
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dedupTitle = `EXPIRING_${license.id}_${daysLeft}d`;

      const existingNotif = await db.notification.findFirst({
        where: {
          orgId,
          title: dedupTitle,
          createdAt: { gte: todayStart },
        },
      });

      if (!existingNotif) {
        for (const member of members) {
          if (member.user) {
            await db.notification.create({
              data: {
                orgId,
                userId: member.user.id,
                title: dedupTitle,
                message: `License "${license.name}" (${license.licenseNumber}) expires in ${daysLeft} days. Action required.`,
              },
            });
            notificationsCreated++;
          }
        }
      }
    }
  }

  // Create notifications for expired licenses
  if (settings?.notifyExpired !== false) {
    for (const license of expiredLicenses) {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dedupTitle = `EXPIRED_${license.id}`;

      const existingNotif = await db.notification.findFirst({
        where: {
          orgId,
          title: dedupTitle,
          createdAt: { gte: todayStart },
        },
      });

      if (!existingNotif) {
        for (const member of members) {
          if (member.user) {
            await db.notification.create({
              data: {
                orgId,
                userId: member.user.id,
                title: dedupTitle,
                message: `License "${license.name}" (${license.licenseNumber}) has expired. Immediate action required!`,
              },
            });
            notificationsCreated++;
          }
        }
      }
    }
  }

  return { licensesExpiring, licensesExpired, notificationsCreated };
}

// ─── Insurance/Bond Expiration Check ───────────────────────────────────────

export async function runInsuranceExpirationCheck(orgId: string): Promise<InsuranceExpirationCheckResult> {
  const now = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(now.getDate() + 30);

  let insuranceExpiring = 0;
  let insuranceExpired = 0;
  let notificationsCreated = 0;

  // Find expiring insurance/bonds (within 30 days)
  const expiringInsurance = await db.insuranceBond.findMany({
    where: {
      orgId,
      expirationDate: { gt: now, lte: thirtyDays },
      status: { not: 'expired' },
    },
  });

  // Find expired insurance/bonds
  const expiredInsurance = await db.insuranceBond.findMany({
    where: {
      orgId,
      expirationDate: { lt: now },
      status: { not: 'expired' },
    },
  });

  insuranceExpiring = expiringInsurance.length;
  insuranceExpired = expiredInsurance.length;

  // Get automation settings
  const settings = await db.automationSetting.findUnique({ where: { orgId } });

  if (settings?.notifyInsurance !== false) {
    // Get org admins/owners for notifications
    const members = await db.orgMember.findMany({
      where: { orgId, role: { in: ['owner', 'admin'] } },
      include: { user: true },
    });

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Create notifications for expiring
    for (const record of expiringInsurance) {
      const daysLeft = Math.ceil(
        (record.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const dedupTitle = `INS_EXPIRING_${record.id}_${daysLeft}d`;

      const existingNotif = await db.notification.findFirst({
        where: {
          orgId,
          title: dedupTitle,
          createdAt: { gte: todayStart },
        },
      });

      if (!existingNotif) {
        for (const member of members) {
          if (member.user) {
            const typeLabel = record.type === 'bond' ? 'Bond' : record.type === 'certificate' ? 'Certificate' : 'Insurance';
            await db.notification.create({
              data: {
                orgId,
                userId: member.user.id,
                title: dedupTitle,
                message: `${typeLabel} "${record.name}" (${record.policyNumber}) expires in ${daysLeft} days. Action required.`,
              },
            });
            notificationsCreated++;
          }
        }
      }
    }

    // Create notifications for expired
    for (const record of expiredInsurance) {
      const dedupTitle = `INS_EXPIRED_${record.id}`;

      const existingNotif = await db.notification.findFirst({
        where: {
          orgId,
          title: dedupTitle,
          createdAt: { gte: todayStart },
        },
      });

      if (!existingNotif) {
        for (const member of members) {
          if (member.user) {
            const typeLabel = record.type === 'bond' ? 'Bond' : record.type === 'certificate' ? 'Certificate' : 'Insurance';
            await db.notification.create({
              data: {
                orgId,
                userId: member.user.id,
                title: dedupTitle,
                message: `${typeLabel} "${record.name}" (${record.policyNumber}) has expired. Immediate action required!`,
              },
            });
            notificationsCreated++;
          }
        }
      }
    }
  }

  return { insuranceExpiring, insuranceExpired, notificationsCreated };
}

// ─── Auto-Flag Expired ─────────────────────────────────────────────────────

export async function autoFlagExpired(orgId: string): Promise<number> {
  const now = new Date();

  // Update insurance bonds status to expired
  const insuranceResult = await db.insuranceBond.updateMany({
    where: {
      orgId,
      expirationDate: { lt: now },
      status: { not: 'expired' },
    },
    data: { status: 'expired' },
  });

  return insuranceResult.count;
}

// ─── Escalation Rules ──────────────────────────────────────────────────────

export async function runEscalationRules(orgId: string): Promise<EscalationResult> {
  const now = new Date();

  // Get automation settings for escalation days
  const settings = await db.automationSetting.findUnique({ where: { orgId } });
  const escalationDays = settings?.escalationDays ?? 7;

  const escalationDate = new Date();
  escalationDate.setDate(now.getDate() - escalationDays);

  // Find licenses expired more than escalationDays days ago
  const overdueLicenses = await db.license.findMany({
    where: {
      orgId,
      expirationDate: { lt: escalationDate },
      isRenewed: false,
    },
  });

  let notificationsCreated = 0;
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (const license of overdueLicenses) {
    // Check if escalation notification already sent today
    const dedupTitle = `ESCALATION_${license.id}`;

    const existingNotif = await db.notification.findFirst({
      where: {
        orgId,
        title: dedupTitle,
        createdAt: { gte: todayStart },
      },
    });

    if (!existingNotif) {
      // Escalate to owners only
      const owners = await db.orgMember.findMany({
        where: { orgId, role: 'owner' },
        include: { user: true },
      });

      for (const owner of owners) {
        if (owner.user) {
          const daysOverdue = Math.ceil(
            (now.getTime() - license.expirationDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          await db.notification.create({
            data: {
              orgId,
              userId: owner.user.id,
              title: dedupTitle,
              message: `⚠️ ESCALATION: "${license.name}" (${license.licenseNumber}) has been expired for ${daysOverdue} days. Owner notification escalation.`,
            },
          });
          notificationsCreated++;
        }
      }
    }
  }

  return { escalated: overdueLicenses.length, notificationsCreated };
}

// ─── Full Check (Run All) ──────────────────────────────────────────────────

export async function runFullCheck(orgId: string): Promise<FullCheckResult> {
  const [expResult, insResult, escalationResult] = await Promise.all([
    runExpirationCheck(orgId),
    runInsuranceExpirationCheck(orgId),
    runEscalationRules(orgId),
  ]);

  const autoFlagged = await autoFlagExpired(orgId);

  return {
    licensesExpiring: expResult.licensesExpiring,
    licensesExpired: expResult.licensesExpired,
    insuranceExpiring: insResult.insuranceExpiring,
    insuranceExpired: insResult.insuranceExpired,
    escalations: escalationResult.escalated,
    notificationsCreated:
      expResult.notificationsCreated +
      insResult.notificationsCreated +
      escalationResult.notificationsCreated,
    autoFlagged,
  };
}

// ─── Automation Settings Helpers ───────────────────────────────────────────

export async function getOrCreateAutomationSettings(orgId: string) {
  let settings = await db.automationSetting.findUnique({ where: { orgId } });

  if (!settings) {
    const nextRunAt = calculateNextRunAt('daily');
    settings = await db.automationSetting.create({
      data: {
        orgId,
        enabled: true,
        checkFrequency: 'daily',
        escalationDays: 7,
        notifyExpired: true,
        notifyExpiring: true,
        notifyInsurance: true,
        nextRunAt,
      },
    });
  }

  return settings;
}

export async function updateAutomationSettings(
  orgId: string,
  data: {
    enabled?: boolean;
    checkFrequency?: string;
    escalationDays?: number;
    notifyExpired?: boolean;
    notifyExpiring?: boolean;
    notifyInsurance?: boolean;
  }
) {
  const current = await getOrCreateAutomationSettings(orgId);
  const frequency = data.checkFrequency || current.checkFrequency;
  const nextRunAt = data.enabled !== false ? calculateNextRunAt(frequency) : null;

  return db.automationSetting.update({
    where: { orgId },
    data: {
      ...data,
      nextRunAt,
    },
  });
}

// ─── Automation Run Tracking ───────────────────────────────────────────────

export async function createAutomationRun(orgId: string, type: string = 'full_check') {
  return db.automationRun.create({
    data: {
      orgId,
      type,
      status: 'running',
    },
  });
}

export async function completeAutomationRun(
  runId: string,
  results: Record<string, unknown> | { error: string },
  status: 'completed' | 'failed' = 'completed'
) {
  return db.automationRun.update({
    where: { id: runId },
    data: {
      status,
      results: JSON.stringify(results),
      completedAt: new Date(),
    },
  });
}

export async function updateLastRunAt(orgId: string) {
  const settings = await getOrCreateAutomationSettings(orgId);
  const nextRunAt = settings.enabled ? calculateNextRunAt(settings.checkFrequency) : null;

  return db.automationSetting.update({
    where: { orgId },
    data: {
      lastRunAt: new Date(),
      nextRunAt,
    },
  });
}
