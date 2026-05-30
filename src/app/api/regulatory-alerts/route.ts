import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET: List alerts with filtering
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const orgMember = await db.orgMember.findFirst({ where: { userId } });
    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity') || undefined;
    const state = searchParams.get('state') || undefined;
    const changeType = searchParams.get('changeType') || undefined;
    const isRead = searchParams.get('isRead');

    const where: any = { orgId: orgMember.orgId, isDismissed: false };
    if (severity) where.severity = severity;
    if (state) where.state = state;
    if (changeType) where.changeType = changeType;
    if (isRead !== null && isRead !== undefined && isRead !== '') {
      where.isRead = isRead === 'true';
    }

    const alerts = await db.regulatoryAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = await db.regulatoryAlert.count({
      where: { orgId: orgMember.orgId, isRead: false, isDismissed: false },
    });

    const criticalCount = await db.regulatoryAlert.count({
      where: { orgId: orgMember.orgId, severity: 'critical', isDismissed: false },
    });

    const watchedStates = await db.regulatoryWatch.count({
      where: { orgId: orgMember.orgId, isActive: true },
    });

    return NextResponse.json({
      alerts,
      stats: {
        total: alerts.length,
        unread: unreadCount,
        critical: criticalCount,
        watchedStates,
      },
    });
  } catch (error) {
    console.error('Get regulatory alerts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createAlertSchema = z.object({
  state: z.string().min(1, 'State is required'),
  licenseType: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  changeType: z.string().default('regulatory_update'),
  severity: z.string().default('info'),
  sourceUrl: z.string().optional(),
  effectiveDate: z.string().optional(),
});

// POST: Create alert (admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const orgMember = await db.orgMember.findFirst({ where: { userId } });
    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Only owner/admin can create
    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const result = createAlertSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = result.data;
    const alert = await db.regulatoryAlert.create({
      data: {
        orgId: orgMember.orgId,
        state: data.state,
        licenseType: data.licenseType || null,
        title: data.title,
        description: data.description,
        changeType: data.changeType || 'regulatory_update',
        severity: data.severity || 'info',
        sourceUrl: data.sourceUrl || null,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
      },
    });

    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'create',
        entityType: 'regulatory_alert',
        entityId: alert.id,
        entityName: alert.title,
        details: `Created regulatory alert: ${alert.title}`,
      },
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error('Create regulatory alert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
