import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// POST: Trigger manual sync (simulated)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const orgMember = await db.orgMember.findFirst({ where: { userId } });
    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const integration = await db.integration.findFirst({
      where: { id, orgId: orgMember.orgId, isActive: true },
    });
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Set status to syncing
    await db.integration.update({
      where: { id },
      data: { status: 'syncing' },
    });

    // Create sync log entry (running)
    const syncLog = await db.integrationSyncLog.create({
      data: {
        integrationId: id,
        orgId: orgMember.orgId,
        type: 'manual',
        status: 'running',
        recordsSynced: 0,
      },
    });

    // Simulate sync by completing it after a brief delay
    // In production, this would be a background job
    const recordsSynced = Math.floor(Math.random() * 50) + 10;
    const hasError = Math.random() < 0.15; // 15% chance of simulated error

    if (hasError) {
      // Simulate a failed sync
      await db.integrationSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'failed',
          recordsSynced: 0,
          errors: JSON.stringify(['Connection timeout', 'API rate limit exceeded']),
          completedAt: new Date(),
        },
      });

      await db.integration.update({
        where: { id },
        data: {
          status: 'error',
          errorCount: integration.errorCount + 1,
          lastError: 'Connection timeout',
        },
      });

      return NextResponse.json({
        success: false,
        status: 'failed',
        message: 'Sync failed: Connection timeout',
      });
    }

    // Simulate successful sync
    await db.integrationSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'completed',
        recordsSynced,
        completedAt: new Date(),
      },
    });

    await db.integration.update({
      where: { id },
      data: {
        status: 'connected',
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
        syncCount: integration.syncCount + 1,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'integration_sync',
        entityType: 'integration',
        entityId: integration.id,
        entityName: integration.name,
        details: `Manual sync completed for ${integration.name}: ${recordsSynced} records`,
      },
    });

    return NextResponse.json({
      success: true,
      status: 'completed',
      recordsSynced,
      message: `Sync completed: ${recordsSynced} records synced`,
    });
  } catch (error) {
    console.error('Error triggering sync:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
