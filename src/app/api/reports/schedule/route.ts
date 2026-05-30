import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET: Return the current schedule settings for the org
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

    const scheduledReport = await db.scheduledReport.findUnique({
      where: { orgId: orgMember.orgId },
    });

    if (!scheduledReport) {
      return NextResponse.json({
        config: {
          frequency: 'monthly',
          recipients: [],
          reportType: 'compliance',
          format: 'pdf',
          enabled: false,
        },
      });
    }

    let recipients: string[] = [];
    try {
      recipients = JSON.parse(scheduledReport.recipients);
    } catch {
      recipients = [];
    }

    return NextResponse.json({
      config: {
        frequency: scheduledReport.frequency,
        recipients,
        reportType: scheduledReport.reportType,
        format: scheduledReport.format,
        enabled: scheduledReport.enabled,
        lastSentAt: scheduledReport.lastSentAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create/update a scheduled report configuration
export async function POST(request: Request) {
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
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can configure scheduled reports.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { frequency, recipients, reportType, format, enabled } = body;

    // Validate
    if (frequency && !['weekly', 'monthly', 'quarterly'].includes(frequency)) {
      return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 });
    }
    if (reportType && !['compliance', 'full', 'licenses'].includes(reportType)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
    if (format && !['pdf', 'csv'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }
    if (recipients && !Array.isArray(recipients)) {
      return NextResponse.json({ error: 'Recipients must be an array' }, { status: 400 });
    }

    const recipientsJson = JSON.stringify(recipients || []);

    // Upsert: one scheduled report per org
    const scheduledReport = await db.scheduledReport.upsert({
      where: { orgId: orgMember.orgId },
      update: {
        frequency: frequency || 'monthly',
        recipients: recipientsJson,
        reportType: reportType || 'compliance',
        format: format || 'pdf',
        enabled: enabled !== undefined ? enabled : false,
      },
      create: {
        orgId: orgMember.orgId,
        frequency: frequency || 'monthly',
        recipients: recipientsJson,
        reportType: reportType || 'compliance',
        format: format || 'pdf',
        enabled: enabled !== undefined ? enabled : false,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'update',
        entityType: 'scheduled_report',
        entityId: scheduledReport.id,
        entityName: `Scheduled Report (${scheduledReport.frequency})`,
        details: `Updated scheduled report: ${scheduledReport.frequency}, enabled=${scheduledReport.enabled}, recipients=${recipientsJson}`,
      },
    });

    return NextResponse.json({
      config: {
        frequency: scheduledReport.frequency,
        recipients: JSON.parse(scheduledReport.recipients),
        reportType: scheduledReport.reportType,
        format: scheduledReport.format,
        enabled: scheduledReport.enabled,
        lastSentAt: scheduledReport.lastSentAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('Save schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
