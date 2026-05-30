import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendComplianceReport } from '@/lib/email';

const CRON_SECRET = process.env.CRON_SECRET;
if (!CRON_SECRET) {
  throw new Error('CRON_SECRET environment variable is required');
}

// POST: Triggered by cron to send scheduled reports
export async function POST(request: Request) {
  try {
    // Verify CRON_SECRET
    const { searchParams } = new URL(request.url);
    const providedSecret = searchParams.get('secret');

    if (providedSecret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all orgs with scheduled reports enabled
    const scheduledReports = await db.scheduledReport.findMany({
      where: { enabled: true },
      include: { org: true },
    });

    const results: { orgId: string; orgName: string; sent: number; errors: string[] }[] = [];

    for (const schedule of scheduledReports) {
      const errors: string[] = [];
      let sent = 0;

      try {
        // Check if we should send based on frequency
        const now = new Date();
        const shouldSend = shouldSendReport(schedule.frequency, schedule.lastSentAt, now);

        if (!shouldSend) {
          results.push({
            orgId: schedule.orgId,
            orgName: schedule.org.name,
            sent: 0,
            errors: ['Skipped - not due yet'],
          });
          continue;
        }

        // Get org compliance data for the email
        const org = schedule.org;
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const totalLicenses = await db.license.count({ where: { orgId: org.id } });
        const activeLicenses = await db.license.count({
          where: { orgId: org.id, expirationDate: { gt: thirtyDaysFromNow } },
        });
        const expiringLicenses = await db.license.count({
          where: {
            orgId: org.id,
            expirationDate: { gt: new Date(), lte: thirtyDaysFromNow },
          },
        });
        const expiredLicenses = await db.license.count({
          where: { orgId: org.id, expirationDate: { lte: new Date() } },
        });

        const complianceScore = totalLicenses > 0
          ? Math.round(((totalLicenses - expiredLicenses) / totalLicenses) * 100)
          : 100;

        // Parse recipients
        let recipients: string[] = [];
        try {
          recipients = JSON.parse(schedule.recipients);
        } catch {
          recipients = [];
        }

        if (recipients.length === 0) {
          results.push({
            orgId: schedule.orgId,
            orgName: org.name,
            sent: 0,
            errors: ['No recipients configured'],
          });
          continue;
        }

        // Get org members for fallback
        if (recipients.length === 0) {
          const members = await db.orgMember.findMany({
            where: { orgId: org.id, userId: { not: null } },
            include: { user: true },
          });
          recipients = members
            .filter((m) => m.user && ['owner', 'admin'].includes(m.role))
            .map((m) => m.user!.email);
        }

        const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || '';

        // Send report email to each recipient
        for (const email of recipients) {
          try {
            await sendComplianceReport(
              email,
              {
                orgName: org.name,
                complianceScore,
                reportUrl: `${appUrl}/analytics`,
                totalLicenses,
                activeLicenses,
                expiringLicenses,
                expiredLicenses,
              },
              org.id
            );
            sent++;
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to send email';
            errors.push(`${email}: ${msg}`);
          }
        }

        // Update lastSentAt
        await db.scheduledReport.update({
          where: { id: schedule.id },
          data: { lastSentAt: new Date() },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(msg);
      }

      results.push({
        orgId: schedule.orgId,
        orgName: schedule.org.name,
        sent,
        errors,
      });
    }

    return NextResponse.json({
      success: true,
      processed: scheduledReports.length,
      results,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Send scheduled reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Determine if a scheduled report should be sent based on its frequency and lastSentAt.
 */
function shouldSendReport(frequency: string, lastSentAt: Date | null, now: Date): boolean {
  if (!lastSentAt) return true;

  const diffMs = now.getTime() - lastSentAt.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  switch (frequency) {
    case 'weekly':
      return diffDays >= 7;
    case 'monthly':
      return diffDays >= 30;
    case 'quarterly':
      return diffDays >= 90;
    default:
      return diffDays >= 30;
  }
}
