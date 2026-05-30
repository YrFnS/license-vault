import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { runFullCheck, createAutomationRun, completeAutomationRun, updateLastRunAt } from '@/lib/automation';

// POST /api/automation/run — Manually trigger automation run
export async function POST() {
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

    // Create automation run record
    const run = await createAutomationRun(orgId, 'full_check');

    try {
      // Run the full check
      const results = await runFullCheck(orgId);

      // Complete the run record
      await completeAutomationRun(run.id, results as unknown as Record<string, unknown>, 'completed');

      // Update lastRunAt
      await updateLastRunAt(orgId);

      // Log to audit
      await db.auditLog.create({
        data: {
          orgId,
          userId,
          action: 'automation_run',
          entityType: 'automation',
          entityId: run.id,
          entityName: 'Full Compliance Check',
          details: `Manual automation run completed. ${results.notificationsCreated} notifications created.`,
        },
      });

      return NextResponse.json({
        success: true,
        runId: run.id,
        results,
      });
    } catch (checkError) {
      // Mark run as failed
      await completeAutomationRun(
        run.id,
        { error: checkError instanceof Error ? checkError.message : 'Unknown error' },
        'failed'
      );

      throw checkError;
    }
  } catch (error) {
    console.error('Automation run error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
