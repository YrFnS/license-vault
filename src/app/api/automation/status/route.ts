import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getOrCreateAutomationSettings } from '@/lib/automation';

// GET /api/automation/status — Get automation engine status
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

    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const orgId = orgMember.orgId;
    const settings = await getOrCreateAutomationSettings(orgId);

    // Get stats from last 10 runs
    const recentRuns = await db.automationRun.findMany({
      where: { orgId },
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    const completedRuns = recentRuns.filter((r) => r.status === 'completed');
    const totalNotificationsSent = completedRuns.reduce((sum, r) => {
      try {
        const results = JSON.parse(r.results || '{}');
        return sum + (results.notificationsCreated || 0);
      } catch {
        return sum;
      }
    }, 0);

    return NextResponse.json({
      enabled: settings.enabled,
      lastRunAt: settings.lastRunAt?.toISOString() || null,
      nextRunAt: settings.nextRunAt?.toISOString() || null,
      checkFrequency: settings.checkFrequency,
      escalationDays: settings.escalationDays,
      stats: {
        totalChecks: recentRuns.length,
        notificationsSent: totalNotificationsSent,
        lastRunStatus: recentRuns[0]?.status || null,
      },
    });
  } catch (error) {
    console.error('Automation status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
