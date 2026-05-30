import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { sendTemplateEmail, type TemplateName } from '@/lib/email';

// ─── Request Schema ────────────────────────────────────────────────────────

const sendEmailSchema = z.object({
  to: z.string().email('Invalid recipient email address'),
  template: z.enum([
    'expiration_alert',
    'insurance_expiration',
    'password_reset',
    'team_invitation',
    'renewal_confirmation',
    'renewal_reminder',
    'compliance_report',
    'subcontractor_portal_invite',
    'welcome',
    'test',
  ] as const),
  data: z.record(z.string(), z.unknown()),
  enhanceSubject: z.boolean().optional().default(false),
});

// ─── POST: Send a templated email ──────────────────────────────────────────

export async function POST(request: Request) {
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

    // Only owner/admin can send emails
    if (!['owner', 'admin'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions. Only owners and admins can send emails.' }, { status: 403 });
    }

    const body = await request.json();
    const result = sendEmailSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { to, template, data, enhanceSubject } = result.data;

    // Check alert preferences — respect emailCategories setting
    const preferences = await db.alertPreference.findUnique({
      where: {
        orgId_userId: {
          orgId: orgMember.orgId,
          userId,
        },
      },
    });

    // If user has email disabled, don't send
    if (preferences && !preferences.alertEmail) {
      return NextResponse.json(
        { error: 'Email notifications are disabled in your alert preferences.' },
        { status: 400 }
      );
    }

    // If user set emailCategories to 'none', don't send
    if (preferences?.alertEmailCategories === 'none') {
      return NextResponse.json(
        { error: 'Email category is set to "none" in your alert preferences.' },
        { status: 400 }
      );
    }

    // If user set emailCategories to 'critical_only', only allow urgent templates
    if (preferences?.alertEmailCategories === 'critical_only') {
      const criticalTemplates: TemplateName[] = ['expiration_alert', 'insurance_expiration', 'password_reset'];
      if (!criticalTemplates.includes(template)) {
        return NextResponse.json(
          { error: 'Your email preferences are set to critical-only. This template type is not critical.' },
          { status: 400 }
        );
      }
    }

    // Send the email
    const emailResult = await sendTemplateEmail(
      template,
      to,
      data,
      orgMember.orgId
    );

    if (!emailResult.success) {
      return NextResponse.json(
        {
          error: 'Failed to send email',
          details: emailResult.error,
        },
        { status: 500 }
      );
    }

    // Create audit log entry
    await db.auditLog.create({
      data: {
        orgId: orgMember.orgId,
        userId,
        action: 'email_sent',
        entityType: 'email',
        entityName: template,
        details: `Sent ${template} email to ${to}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      providerId: emailResult.providerId,
      template,
      to,
    });
  } catch (error) {
    console.error('Send email API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Internal server error', debug: message },
      { status: 500 }
    );
  }
}
