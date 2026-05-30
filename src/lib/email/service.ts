import { db } from '@/lib/db';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  type: string;
  orgId?: string;
}

export interface EmailResult {
  success: boolean;
  error?: string;
  logId?: string;
}

/**
 * Send an email using the configured email provider.
 * In development/sandbox mode, emails are logged to console and stored in the EmailLog table.
 * When SMTP is configured, emails will be sent via the provider.
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const { to, subject, html, text, type, orgId } = options;

  try {
    // Check if SMTP is configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      // Production: Send via SMTP
      // We'll implement this when a real SMTP provider is available
      // For now, fall through to dev mode
    }

    // Development/Sandbox mode: Log to console and store in DB
    console.log('📧 Email Service - Sending email:');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Type: ${type}`);
    console.log(`  HTML length: ${html.length} chars`);

    // Store in EmailLog (only if orgId is provided)
    const emailLog = orgId ? await db.emailLog.create({
      data: {
        orgId,
        to,
        subject,
        status: 'sent',
      },
    }) : null;

    return {
      success: true,
      logId: emailLog?.id,
    };
  } catch (error) {
    console.error('📧 Email Service - Failed to send email:', error);

    // Try to log the failure
    try {
      const emailLog = orgId ? await db.emailLog.create({
        data: {
          orgId,
          to,
          subject,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }) : null;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        logId: emailLog?.id,
      };
    } catch {
      // If even logging fails, just return the error
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Generate a base HTML email template with LicenseVault branding
 */
export function baseEmailTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f9fafb;
      color: #1f2937;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #059669, #0d9488);
      padding: 24px 32px;
      border-radius: 12px 12px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.025em;
    }
    .header .shield-icon {
      font-size: 28px;
      margin-bottom: 4px;
    }
    .content {
      background-color: #ffffff;
      padding: 32px;
      border-left: 1px solid #e5e7eb;
      border-right: 1px solid #e5e7eb;
    }
    .content h2 {
      margin: 0 0 16px;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }
    .content p {
      margin: 0 0 12px;
      font-size: 15px;
      color: #374151;
    }
    .btn {
      display: inline-block;
      padding: 12px 28px;
      background: linear-gradient(135deg, #059669, #0d9488);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      margin: 16px 0;
    }
    .info-box {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    .warning-box {
      background-color: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    .danger-box {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 32px;
      border-radius: 0 0 12px 12px;
      border: 1px solid #e5e7eb;
      border-top: none;
      text-align: center;
    }
    .footer p {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
    }
    .footer a {
      color: #059669;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 16px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="shield-icon">🛡️</div>
      <h1>LicenseVault</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Powered by <a href="${process.env.NEXTAUTH_URL || '#'}">LicenseVault</a> — Contractor License Compliance</p>
      <p style="margin-top: 8px;">This email was sent to {{recipient}}. If you prefer not to receive these emails, you can update your notification preferences in your account settings.</p>
    </div>
  </div>
</body>
</html>`.replace('{{recipient}}', '${to}');
}
