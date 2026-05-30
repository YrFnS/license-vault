import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

type ExpirationStatus = 'EXPIRED' | 'EXPIRING_5_DAYS' | 'EXPIRING_30_DAYS' | 'EXPIRING_60_DAYS';

function getExpirationStatus(expirationDate: Date): ExpirationStatus | null {
  const now = new Date();
  const fiveDaysFromNow = new Date();
  fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

  if (expirationDate < now) return 'EXPIRED';
  if (expirationDate <= fiveDaysFromNow) return 'EXPIRING_5_DAYS';
  if (expirationDate <= thirtyDaysFromNow) return 'EXPIRING_30_DAYS';
  if (expirationDate <= sixtyDaysFromNow) return 'EXPIRING_60_DAYS';
  return null;
}

function getStatusLabel(status: ExpirationStatus): string {
  switch (status) {
    case 'EXPIRED':
      return 'Expired';
    case 'EXPIRING_5_DAYS':
      return 'Expiring in 5 Days';
    case 'EXPIRING_30_DAYS':
      return 'Expiring in 30 Days';
    case 'EXPIRING_60_DAYS':
      return 'Expiring in 60 Days';
  }
}

function getAlertPreferenceField(status: ExpirationStatus): keyof Pick<
  { alert60Days: boolean; alert30Days: boolean; alert5Days: boolean; alertInApp: boolean },
  'alert5Days' | 'alert30Days' | 'alert60Days'
> {
  switch (status) {
    case 'EXPIRED':
      return 'alert5Days';
    case 'EXPIRING_5_DAYS':
      return 'alert5Days';
    case 'EXPIRING_30_DAYS':
      return 'alert30Days';
    case 'EXPIRING_60_DAYS':
      return 'alert60Days';
  }
}

// GET: Check all licenses for expiration and generate notifications
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Find user's org membership
    const orgMember = await db.orgMember.findFirst({
      where: { userId },
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const orgId = orgMember.orgId;

    // Fetch all licenses in the org
    const licenses = await db.license.findMany({
      where: { orgId },
    });

    // Get user's alert preferences (create defaults if none exist)
    let preferences = await db.alertPreference.findUnique({
      where: {
        orgId_userId: { orgId, userId },
      },
    });

    if (!preferences) {
      preferences = await db.alertPreference.create({
        data: {
          orgId,
          userId,
          alert60Days: true,
          alert30Days: true,
          alert5Days: true,
          alertEmail: true,
          alertInApp: true,
        },
      });
    }

    // Counters
    let expired = 0;
    let expiring5Days = 0;
    let expiring30Days = 0;
    let expiring60Days = 0;
    let notificationsCreated = 0;

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    for (const license of licenses) {
      const status = getExpirationStatus(license.expirationDate);
      if (!status) continue; // Active license, no alert needed

      // Count by status
      switch (status) {
        case 'EXPIRED':
          expired++;
          break;
        case 'EXPIRING_5_DAYS':
          expiring5Days++;
          break;
        case 'EXPIRING_30_DAYS':
          expiring30Days++;
          break;
        case 'EXPIRING_60_DAYS':
          expiring60Days++;
          break;
      }

      // Check if the user has in-app alerts enabled for this threshold
      const thresholdField = getAlertPreferenceField(status);
      const isThresholdEnabled = preferences[thresholdField];
      const isInAppEnabled = preferences.alertInApp;

      if (!isThresholdEnabled || !isInAppEnabled) {
        continue;
      }

      // Build notification title and message
      const statusLabel = getStatusLabel(status);
      const notificationTitle = `[${status}] ${license.name} (${license.licenseNumber})`;

      // Check for duplicate notification within the last 24 hours
      const existingNotification = await db.notification.findFirst({
        where: {
          userId,
          title: notificationTitle,
          createdAt: { gte: twentyFourHoursAgo },
        },
      });

      if (existingNotification) {
        continue; // Skip to avoid duplicates
      }

      // Build the notification message
      const expirationDateStr = license.expirationDate.toLocaleDateString();
      let notificationMessage: string;

      switch (status) {
        case 'EXPIRED':
          notificationMessage = `License "${license.name}" (${license.licenseNumber}) has expired on ${expirationDateStr}. Immediate action is required.`;
          break;
        case 'EXPIRING_5_DAYS':
          notificationMessage = `License "${license.name}" (${license.licenseNumber}) will expire in 5 days on ${expirationDateStr}. Renewal is urgent.`;
          break;
        case 'EXPIRING_30_DAYS':
          notificationMessage = `License "${license.name}" (${license.licenseNumber}) will expire in 30 days on ${expirationDateStr}. Please plan for renewal.`;
          break;
        case 'EXPIRING_60_DAYS':
          notificationMessage = `License "${license.name}" (${license.licenseNumber}) will expire in 60 days on ${expirationDateStr}. Consider starting the renewal process.`;
          break;
      }

      // Create the notification
      await db.notification.create({
        data: {
          orgId,
          userId,
          title: notificationTitle,
          message: notificationMessage,
          read: false,
        },
      });

      notificationsCreated++;
    }

    return NextResponse.json({
      checked: licenses.length,
      expired,
      expiring5Days,
      expiring30Days,
      expiring60Days,
      notificationsCreated,
    });
  } catch (error) {
    console.error('Check expirations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
