import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getOrCreateAutomationSettings, updateAutomationSettings } from '@/lib/automation';
import { z } from 'zod';

const settingsSchema = z.object({
  enabled: z.boolean().optional(),
  checkFrequency: z.enum(['hourly', 'daily', 'weekly']).optional(),
  escalationDays: z.number().min(1).max(90).optional(),
  notifyExpired: z.boolean().optional(),
  notifyExpiring: z.boolean().optional(),
  notifyInsurance: z.boolean().optional(),
});

// GET /api/automation/settings — Get automation settings
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

    const settings = await getOrCreateAutomationSettings(orgMember.orgId);

    return NextResponse.json({
      enabled: settings.enabled,
      checkFrequency: settings.checkFrequency,
      escalationDays: settings.escalationDays,
      notifyExpired: settings.notifyExpired,
      notifyExpiring: settings.notifyExpiring,
      notifyInsurance: settings.notifyInsurance,
      lastRunAt: settings.lastRunAt?.toISOString() || null,
      nextRunAt: settings.nextRunAt?.toISOString() || null,
    });
  } catch (error) {
    console.error('Automation settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/automation/settings — Update automation settings
export async function PUT(request: Request) {
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

    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid settings', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const orgId = orgMember.orgId;
    const settings = await updateAutomationSettings(orgId, parsed.data);

    // Log to audit
    await db.auditLog.create({
      data: {
        orgId,
        userId,
        action: 'update',
        entityType: 'automation_settings',
        entityId: settings.id,
        entityName: 'Automation Settings',
        details: `Updated automation settings: ${JSON.stringify(parsed.data)}`,
      },
    });

    return NextResponse.json({
      enabled: settings.enabled,
      checkFrequency: settings.checkFrequency,
      escalationDays: settings.escalationDays,
      notifyExpired: settings.notifyExpired,
      notifyExpiring: settings.notifyExpiring,
      notifyInsurance: settings.notifyInsurance,
      lastRunAt: settings.lastRunAt?.toISOString() || null,
      nextRunAt: settings.nextRunAt?.toISOString() || null,
    });
  } catch (error) {
    console.error('Automation settings PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
