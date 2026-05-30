// Email service for License Vault
// Uses z-ai-web-dev-sdk for AI-enhanced email content + Nodemailer for SMTP delivery
// Logs all attempts to the EmailLog Prisma model

import nodemailer from 'nodemailer';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';
import {
  expirationAlertTemplate,
  insuranceExpirationAlertTemplate,
  passwordResetTemplate,
  teamInvitationTemplate,
  renewalConfirmationTemplate,
  renewalReminderTemplate,
  complianceReportTemplate,
  subcontractorPortalInviteTemplate,
  welcomeEmailTemplate,
  testEmailTemplate,
  type ExpirationAlertData,
  type InsuranceExpirationAlertData,
  type PasswordResetData,
  type TeamInvitationData,
  type RenewalConfirmationData,
  type RenewalReminderData,
  type ComplianceReportData,
  type SubcontractorPortalInviteData,
  type WelcomeEmailData,
  type TestEmailData,
} from '@/lib/email-templates';

// ─── SMTP Configuration ────────────────────────────────────────────────────

const SMTP_HOST = process.env.SMTP_HOST || 'localhost'; // falls back to dev mode
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || `License Vault <${process.env.SMTP_FROM_EMAIL || 'noreply@localhost'}>`; // Configure SMTP_FROM env var for production email
const APP_URL = process.env.NEXTAUTH_URL || process.env.APP_URL || '';

/** Whether we are in "development mode" — emails log to console instead of sending */
const isDevMode = !process.env.SMTP_HOST || process.env.SMTP_HOST === 'localhost';

// ─── Types ─────────────────────────────────────────────────────────────────

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  providerId?: string;
  error?: string;
}

// ─── Rate Limiting ─────────────────────────────────────────────────────────

const emailTimestamps: Map<string, number[]> = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // Max 10 emails per minute per recipient

function checkRateLimit(recipient: string): boolean {
  const now = Date.now();
  const timestamps = emailTimestamps.get(recipient) || [];

  // Clean up old timestamps
  const recent = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    return false; // Rate limited
  }

  recent.push(now);
  emailTimestamps.set(recipient, recent);
  return true;
}

// ─── Console logger for development ────────────────────────────────────────

export function consoleLogEmail(params: EmailOptions): void {
  const divider = '═'.repeat(60);
  const thinDivider = '─'.repeat(60);

  console.log(`
${divider}
  📧  EMAIL (Development Mode — not sent)
${divider}
  From:    ${SMTP_FROM}
  To:      ${params.to}
  Subject: ${params.subject}
${thinDivider}
  ${params.text || '(plain text not provided)'}
${thinDivider}
  HTML body available (${params.html.length} chars)
${divider}
`);
}

// ─── Transporter (lazy init) ───────────────────────────────────────────────

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });

  return _transporter;
}

// ─── AI-Enhanced Subject Generation ────────────────────────────────────────

let _zai: InstanceType<typeof ZAI> | null = null;

async function getZAI(): Promise<InstanceType<typeof ZAI>> {
  if (!_zai) {
    _zai = await ZAI.create();
  }
  return _zai;
}

/**
 * Uses z-ai-web-dev-sdk to generate a more engaging, personalized email subject line.
 * Falls back to the original subject if AI fails.
 */
async function enhanceSubjectWithAI(
  originalSubject: string,
  emailType: string,
  context?: Record<string, string>
): Promise<string> {
  try {
    const zai = await getZAI();
    const contextStr = context ? ` Context: ${JSON.stringify(context)}` : '';

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content:
            'You are an expert email copywriter for a compliance management platform called License Vault. Generate concise, professional, and engaging email subject lines. Return ONLY the subject line text, nothing else. Keep it under 60 characters. Use urgency appropriately based on the email type. Never use ALL CAPS. Do not include brackets or quotation marks.',
        },
        {
          role: 'user',
          content: `Generate a better subject line for this ${emailType} email. Original: "${originalSubject}".${contextStr}`,
        },
      ],
      thinking: { type: 'disabled' },
    });

    const enhanced = completion.choices[0]?.message?.content?.trim();
    if (enhanced && enhanced.length > 0 && enhanced.length <= 80) {
      return enhanced;
    }
    return originalSubject;
  } catch {
    // Silently fall back to original subject
    return originalSubject;
  }
}

// ─── Core send function ────────────────────────────────────────────────────

export async function sendEmail(
  params: EmailOptions,
  options?: {
    orgId?: string;
    emailType?: string;
    enhanceSubject?: boolean;
    context?: Record<string, string>;
  }
): Promise<EmailResult> {
  const { orgId, emailType, enhanceSubject: shouldEnhance, context } = options || {};

  // Check rate limiting
  if (!checkRateLimit(params.to)) {
    const error = 'Rate limit exceeded: too many emails to this recipient';
    console.warn(`Email rate limited for ${params.to}`);

    // Log the rate-limited attempt
    if (orgId) {
      await logEmailAttempt(orgId, params.to, params.subject, 'rate_limited', 'smtp', undefined, error);
    }

    return { success: false, error };
  }

  let subject = params.subject;

  // Optionally enhance subject with AI
  if (shouldEnhance && emailType) {
    subject = await enhanceSubjectWithAI(params.subject, emailType, context);
  }

  try {
    if (isDevMode) {
      consoleLogEmail({ ...params, subject });
      const result = { success: true, providerId: 'dev-console-log' };

      // Log successful dev-mode send
      if (orgId) {
        await logEmailAttempt(orgId, params.to, subject, 'sent', 'dev', 'dev-console-log', undefined);
      }

      return result;
    }

    const transporter = getTransporter();
    const result = await transporter.sendMail({
      from: SMTP_FROM,
      to: params.to,
      subject,
      html: params.html,
      text: params.text,
    });

    // Log successful send
    if (orgId) {
      await logEmailAttempt(orgId, params.to, subject, 'sent', 'smtp', result.messageId, undefined);
    }

    return { success: true, providerId: result.messageId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error sending email';
    console.error('Email send error:', message);

    // Log failed send
    if (orgId) {
      await logEmailAttempt(orgId, params.to, subject, 'failed', 'smtp', undefined, message);
    }

    return { success: false, error: message };
  }
}

// ─── Email Log Helper ──────────────────────────────────────────────────────

async function logEmailAttempt(
  orgId: string,
  to: string,
  subject: string,
  status: string,
  provider: string,
  providerId?: string,
  error?: string
): Promise<void> {
  try {
    await db.emailLog.create({
      data: {
        orgId,
        to,
        subject,
        status,
        provider,
        providerId: providerId || null,
        error: error || null,
        sentAt: status === 'sent' ? new Date() : null,
      },
    });
  } catch (logError) {
    // Don't fail the email send if logging fails
    console.error('Failed to log email attempt:', logError);
  }
}

// ─── Specialized email functions ───────────────────────────────────────────

/**
 * Send a license expiration alert email.
 */
export async function sendExpirationAlert(
  to: string,
  data: Omit<ExpirationAlertData, 'appUrl'>,
  orgId?: string
): Promise<EmailResult> {
  const templateData = { ...data, appUrl: APP_URL };
  const { html, text } = expirationAlertTemplate(templateData);
  const daysLabel = data.daysUntil <= 0 ? 'EXPIRED' : `${data.daysUntil} day${data.daysUntil !== 1 ? 's' : ''}`;

  return sendEmail(
    {
      to,
      subject: `[License Vault] License Expiration Alert: ${data.licenseName} — ${daysLabel}`,
      html,
      text,
    },
    {
      orgId,
      emailType: 'expiration_alert',
      enhanceSubject: true,
      context: { licenseName: data.licenseName, daysUntil: String(data.daysUntil) },
    }
  );
}

/**
 * Send an insurance/COI expiration alert email.
 */
export async function sendInsuranceExpirationAlert(
  to: string,
  data: Omit<InsuranceExpirationAlertData, 'appUrl'>,
  orgId?: string
): Promise<EmailResult> {
  const templateData = { ...data, appUrl: APP_URL };
  const { html, text } = insuranceExpirationAlertTemplate(templateData);
  const typeLabel = data.type === 'bond' ? 'Bond' : data.type === 'certificate' ? 'Certificate' : 'Insurance';
  const daysLabel = data.daysUntil <= 0 ? 'EXPIRED' : `${data.daysUntil} day${data.daysUntil !== 1 ? 's' : ''}`;

  return sendEmail(
    {
      to,
      subject: `[License Vault] ${typeLabel} Expiration Alert: ${data.name} — ${daysLabel}`,
      html,
      text,
    },
    {
      orgId,
      emailType: 'insurance_expiration',
      enhanceSubject: true,
      context: { name: data.name, type: data.type, daysUntil: String(data.daysUntil) },
    }
  );
}

/**
 * Send a password reset email.
 */
export async function sendPasswordReset(
  to: string,
  data: PasswordResetData,
  orgId?: string
): Promise<EmailResult> {
  const { html, text } = passwordResetTemplate(data);

  return sendEmail(
    {
      to,
      subject: '[License Vault] Reset Your Password',
      html,
      text,
    },
    {
      orgId,
      emailType: 'password_reset',
      // Don't enhance password reset subjects — security emails should be consistent
    }
  );
}

/**
 * Send a team invitation email.
 */
export async function sendTeamInvitation(
  to: string,
  data: TeamInvitationData,
  orgId?: string
): Promise<EmailResult> {
  const { html, text } = teamInvitationTemplate(data);

  return sendEmail(
    {
      to,
      subject: `[License Vault] ${data.inviterName} invited you to join ${data.orgName}`,
      html,
      text,
    },
    {
      orgId,
      emailType: 'team_invitation',
      enhanceSubject: true,
      context: { inviterName: data.inviterName, orgName: data.orgName },
    }
  );
}

/**
 * Send a license renewal confirmation email.
 */
export async function sendRenewalConfirmation(
  to: string,
  data: Omit<RenewalConfirmationData, 'appUrl'>,
  orgId?: string
): Promise<EmailResult> {
  const templateData = { ...data, appUrl: APP_URL };
  const { html, text } = renewalConfirmationTemplate(templateData);

  return sendEmail(
    {
      to,
      subject: `[License Vault] License Renewed: ${data.licenseName}`,
      html,
      text,
    },
    {
      orgId,
      emailType: 'renewal_confirmation',
      enhanceSubject: true,
      context: { licenseName: data.licenseName },
    }
  );
}

/**
 * Send a license renewal reminder email.
 */
export async function sendRenewalReminder(
  to: string,
  data: Omit<RenewalReminderData, 'appUrl'>,
  orgId?: string
): Promise<EmailResult> {
  const templateData = { ...data, appUrl: APP_URL };
  const { html, text } = renewalReminderTemplate(templateData);

  return sendEmail(
    {
      to,
      subject: `[License Vault] Renewal Reminder: ${data.licenseName}`,
      html,
      text,
    },
    {
      orgId,
      emailType: 'renewal_reminder',
      enhanceSubject: true,
      context: { licenseName: data.licenseName, daysUntil: String(data.daysUntil) },
    }
  );
}

/**
 * Send a compliance report ready email.
 */
export async function sendComplianceReport(
  to: string,
  data: ComplianceReportData,
  orgId?: string
): Promise<EmailResult> {
  const { html, text } = complianceReportTemplate(data);

  return sendEmail(
    {
      to,
      subject: `[License Vault] Compliance Report Ready — ${data.orgName} (${data.complianceScore}%)`,
      html,
      text,
    },
    {
      orgId,
      emailType: 'compliance_report',
      enhanceSubject: true,
      context: { orgName: data.orgName, score: String(data.complianceScore) },
    }
  );
}

/**
 * Send a subcontractor portal invite email.
 */
export async function sendSubcontractorPortalInvite(
  to: string,
  data: SubcontractorPortalInviteData,
  orgId?: string
): Promise<EmailResult> {
  const { html, text } = subcontractorPortalInviteTemplate(data);

  return sendEmail(
    {
      to,
      subject: `[License Vault] Portal Access: ${data.orgName}`,
      html,
      text,
    },
    {
      orgId,
      emailType: 'subcontractor_portal_invite',
      enhanceSubject: true,
      context: { orgName: data.orgName },
    }
  );
}

/**
 * Send a welcome email to new users.
 */
export async function sendWelcomeEmail(
  to: string,
  data: WelcomeEmailData,
  orgId?: string
): Promise<EmailResult> {
  const { html, text } = welcomeEmailTemplate(data);

  return sendEmail(
    {
      to,
      subject: `[License Vault] Welcome to License Vault!`,
      html,
      text,
    },
    {
      orgId,
      emailType: 'welcome',
      enhanceSubject: true,
      context: { orgName: data.orgName, userName: data.userName },
    }
  );
}

/**
 * Send a test email (development only).
 */
export async function sendTestEmail(
  to: string,
  data: TestEmailData,
  orgId?: string
): Promise<EmailResult> {
  const { html, text } = testEmailTemplate(data);

  return sendEmail(
    {
      to,
      subject: '[License Vault] Test Email',
      html,
      text,
    },
    {
      orgId,
      emailType: 'test',
    }
  );
}

// ─── Template Name Mapping ─────────────────────────────────────────────────

export type TemplateName =
  | 'expiration_alert'
  | 'insurance_expiration'
  | 'password_reset'
  | 'team_invitation'
  | 'renewal_confirmation'
  | 'renewal_reminder'
  | 'compliance_report'
  | 'subcontractor_portal_invite'
  | 'welcome'
  | 'test';

/**
 * Map template names to their send functions.
 * Used by the /api/email/send endpoint.
 */
export async function sendTemplateEmail(
  template: TemplateName,
  to: string,
  data: Record<string, unknown>,
  orgId?: string
): Promise<EmailResult> {
  switch (template) {
    case 'expiration_alert':
      return sendExpirationAlert(to, data as Omit<ExpirationAlertData, 'appUrl'>, orgId);
    case 'insurance_expiration':
      return sendInsuranceExpirationAlert(to, data as Omit<InsuranceExpirationAlertData, 'appUrl'>, orgId);
    case 'password_reset':
      return sendPasswordReset(to, data as PasswordResetData, orgId);
    case 'team_invitation':
      return sendTeamInvitation(to, data as TeamInvitationData, orgId);
    case 'renewal_confirmation':
      return sendRenewalConfirmation(to, data as Omit<RenewalConfirmationData, 'appUrl'>, orgId);
    case 'renewal_reminder':
      return sendRenewalReminder(to, data as Omit<RenewalReminderData, 'appUrl'>, orgId);
    case 'compliance_report':
      return sendComplianceReport(to, data as ComplianceReportData, orgId);
    case 'subcontractor_portal_invite':
      return sendSubcontractorPortalInvite(to, data as SubcontractorPortalInviteData, orgId);
    case 'welcome':
      return sendWelcomeEmail(to, data as WelcomeEmailData, orgId);
    case 'test':
      return sendTestEmail(to, data as TestEmailData, orgId);
    default:
      return { success: false, error: `Unknown template: ${template}` };
  }
}
