// Email template builder for License Vault
// Generates clean, responsive HTML emails with consistent branding

const BRAND_COLOR = '#10b981';
const BRAND_COLOR_DARK = '#059669';
const BRAND_COLOR_LIGHT = '#34d399';
const BRAND_NAME = 'License Vault';
const FOOTER_TEXT = 'Powered by License Vault';

interface EmailTemplateOptions {
  title: string;
  previewText: string;
  bodyContent: string;
  ctaButton?: {
    label: string;
    url: string;
  };
  footerLinks?: {
    managePreferencesUrl?: string;
    unsubscribeUrl?: string;
  };
}

/**
 * Builds the base HTML email template with License Vault branding.
 * Responsive design that works across email clients.
 */
export function buildEmailTemplate(options: EmailTemplateOptions): string {
  const { title, previewText, bodyContent, ctaButton, footerLinks } = options;

  const ctaHtml = ctaButton
    ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 24px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, ${BRAND_COLOR}, ${BRAND_COLOR_DARK});">
          <a href="${ctaButton.url}" target="_blank" style="
            display: inline-block;
            padding: 14px 32px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            background: linear-gradient(135deg, ${BRAND_COLOR}, ${BRAND_COLOR_DARK});
          ">${ctaButton.label}</a>
        </td>
      </tr>
    </table>`
    : '';

  const footerLinksHtml = footerLinks
    ? `
      <p style="margin: 8px 0 0 0; font-size: 12px; color: #d1d5db;">
        ${footerLinks.managePreferencesUrl ? `<a href="${footerLinks.managePreferencesUrl}" style="color: #9ca3af; text-decoration: underline;">Manage email preferences</a>` : ''}
        ${footerLinks.managePreferencesUrl && footerLinks.unsubscribeUrl ? ' · ' : ''}
        ${footerLinks.unsubscribeUrl ? `<a href="${footerLinks.unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>` : ''}
      </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .fluid { max-width: 100% !important; height: auto !important; }
      .stack-column { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="
  margin: 0;
  padding: 0;
  background-color: #f3f4f6;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
">
  <!-- Preview text (hidden in inbox) -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">
    ${previewText}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 32px 0;">
    <tr>
      <td align="center" valign="top">
        <!-- Email container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLOR}, ${BRAND_COLOR_DARK}); padding: 28px 40px; border-radius: 8px 8px 0 0; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                <tr>
                  <td style="padding-right: 12px; vertical-align: middle;">
                    <div style="width: 36px; height: 36px; background: rgba(255,255,255,0.2); border-radius: 8px; text-align: center; line-height: 36px; font-size: 20px;">&#128274;</div>
                  </td>
                  <td style="vertical-align: middle;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">
                      ${BRAND_NAME}
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background: #ffffff; padding: 36px 40px; border-radius: 0 0 8px 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
              <!-- Title -->
              <h2 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 600; color: #111827;">
                ${title}
              </h2>
              <!-- Content -->
              <div style="font-size: 15px; line-height: 1.7; color: #374151;">
                ${bodyContent}
              </div>
              <!-- CTA Button -->
              ${ctaHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #9ca3af;">
                ${FOOTER_TEXT}
              </p>
              <p style="margin: 0; font-size: 12px; color: #d1d5db;">
                This is an automated message. Please do not reply to this email.
              </p>
              ${footerLinksHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Individual template functions ──────────────────────────────────────────

export interface ExpirationAlertData {
  licenseName: string;
  expirationDate: string;
  daysUntil: number;
  licenseType: string;
  licenseNumber: string;
  appUrl?: string;
}

export function expirationAlertTemplate(data: ExpirationAlertData): { html: string; text: string } {
  const urgencyColor = data.daysUntil <= 5 ? '#ef4444' : data.daysUntil <= 30 ? '#f59e0b' : BRAND_COLOR;
  const urgencyLabel = data.daysUntil <= 0 ? 'EXPIRED' : data.daysUntil <= 5 ? 'URGENT' : data.daysUntil <= 30 ? 'WARNING' : 'NOTICE';
  const appUrl = data.appUrl || process.env.NEXTAUTH_URL || process.env.APP_URL || '';

  const html = buildEmailTemplate({
    title: 'License Expiration Alert',
    previewText: `Your license "${data.licenseName}" ${data.daysUntil <= 0 ? 'has expired' : `expires in ${data.daysUntil} days`}.`,
    bodyContent: `
      <div style="margin-bottom: 20px; padding: 12px 16px; background: ${urgencyColor}11; border-left: 4px solid ${urgencyColor}; border-radius: 4px;">
        <strong style="color: ${urgencyColor}; font-size: 14px; text-transform: uppercase;">${urgencyLabel}</strong>
        <span style="color: #374151; font-size: 14px; margin-left: 8px;">
          ${data.daysUntil <= 0 ? 'This license has expired' : `Expires in ${data.daysUntil} day${data.daysUntil !== 1 ? 's' : ''}`}
        </span>
      </div>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; width: 140px; font-weight: 600; color: #6b7280; font-size: 13px;">License Name</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 15px;">${data.licenseName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #6b7280; font-size: 13px;">License Type</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 15px;">${data.licenseType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #6b7280; font-size: 13px;">License Number</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 15px;">${data.licenseNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #6b7280; font-size: 13px;">Expiration Date</td>
          <td style="padding: 8px 0; color: ${urgencyColor}; font-weight: 600; font-size: 15px;">${data.expirationDate}</td>
        </tr>
      </table>
      <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">
        ${data.daysUntil <= 0
          ? 'This license has already expired. Please take immediate action to renew it and maintain compliance.'
          : data.daysUntil <= 5
            ? 'This license is expiring very soon. Immediate renewal is recommended to avoid compliance issues.'
            : data.daysUntil <= 30
              ? 'Please start the renewal process soon to ensure your license remains active.'
              : 'You have time to plan for renewal. Consider starting the process at your earliest convenience.'
        }
      </p>
    `,
    ctaButton: {
      label: 'View License Details',
      url: `${appUrl}/licenses`,
    },
  });

  const text = `License Expiration Alert - ${urgencyLabel}

License: ${data.licenseName}
Type: ${data.licenseType}
Number: ${data.licenseNumber}
Expiration Date: ${data.expirationDate}
Days Until Expiration: ${data.daysUntil <= 0 ? 'EXPIRED' : data.daysUntil}

${data.daysUntil <= 0
    ? 'This license has already expired. Please take immediate action.'
    : `This license expires in ${data.daysUntil} days. Please plan for renewal.`
}

View license details: ${appUrl}/licenses

${FOOTER_TEXT}`;

  return { html, text };
}

export interface InsuranceExpirationAlertData {
  name: string;
  type: string;
  expirationDate: string;
  daysUntil: number;
  policyNumber: string;
  appUrl?: string;
}

export function insuranceExpirationAlertTemplate(data: InsuranceExpirationAlertData): { html: string; text: string } {
  const urgencyColor = data.daysUntil <= 5 ? '#ef4444' : data.daysUntil <= 30 ? '#f59e0b' : BRAND_COLOR;
  const urgencyLabel = data.daysUntil <= 0 ? 'EXPIRED' : data.daysUntil <= 5 ? 'URGENT' : data.daysUntil <= 30 ? 'WARNING' : 'NOTICE';
  const typeLabel = data.type === 'bond' ? 'Bond' : data.type === 'certificate' ? 'Certificate' : 'Insurance Policy';
  const appUrl = data.appUrl || process.env.NEXTAUTH_URL || process.env.APP_URL || '';

  const html = buildEmailTemplate({
    title: `${typeLabel} Expiration Alert`,
    previewText: `Your ${typeLabel.toLowerCase()} "${data.name}" ${data.daysUntil <= 0 ? 'has expired' : `expires in ${data.daysUntil} days`}.`,
    bodyContent: `
      <div style="margin-bottom: 20px; padding: 12px 16px; background: ${urgencyColor}11; border-left: 4px solid ${urgencyColor}; border-radius: 4px;">
        <strong style="color: ${urgencyColor}; font-size: 14px; text-transform: uppercase;">${urgencyLabel}</strong>
        <span style="color: #374151; font-size: 14px; margin-left: 8px;">
          ${data.daysUntil <= 0 ? `This ${typeLabel.toLowerCase()} has expired` : `Expires in ${data.daysUntil} day${data.daysUntil !== 1 ? 's' : ''}`}
        </span>
      </div>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; width: 140px; font-weight: 600; color: #6b7280; font-size: 13px;">${typeLabel} Name</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 15px;">${data.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #6b7280; font-size: 13px;">Type</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 15px; text-transform: capitalize;">${data.type}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #6b7280; font-size: 13px;">Policy Number</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 15px;">${data.policyNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #6b7280; font-size: 13px;">Expiration Date</td>
          <td style="padding: 8px 0; color: ${urgencyColor}; font-weight: 600; font-size: 15px;">${data.expirationDate}</td>
        </tr>
      </table>
      <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">
        ${data.daysUntil <= 0
          ? `This ${typeLabel.toLowerCase()} has expired. Please renew it immediately to maintain coverage and compliance.`
          : data.daysUntil <= 5
            ? `This ${typeLabel.toLowerCase()} is expiring very soon. Immediate action is recommended.`
            : `Please plan for renewal to ensure continuous coverage.`
        }
      </p>
    `,
    ctaButton: {
      label: `View ${typeLabel} Details`,
      url: `${appUrl}/insurance`,
    },
  });

  const text = `${typeLabel} Expiration Alert - ${urgencyLabel}

${typeLabel}: ${data.name}
Type: ${data.type}
Policy Number: ${data.policyNumber}
Expiration Date: ${data.expirationDate}
Days Until Expiration: ${data.daysUntil <= 0 ? 'EXPIRED' : data.daysUntil}

${data.daysUntil <= 0
    ? `This ${typeLabel.toLowerCase()} has expired. Please renew immediately.`
    : `This ${typeLabel.toLowerCase()} expires in ${data.daysUntil} days. Please plan for renewal.`
}

View details: ${appUrl}/insurance

${FOOTER_TEXT}`;

  return { html, text };
}

export interface PasswordResetData {
  resetUrl: string;
  userName: string;
}

export function passwordResetTemplate(data: PasswordResetData): { html: string; text: string } {
  const html = buildEmailTemplate({
    title: 'Reset Your Password',
    previewText: 'You requested a password reset for your License Vault account.',
    bodyContent: `
      <p style="margin: 0 0 16px 0;">Hello ${data.userName},</p>
      <p style="margin: 0 0 16px 0;">
        We received a request to reset the password for your License Vault account. Click the button below to choose a new password:
      </p>
      <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
        This link will expire in <strong>1 hour</strong> for security purposes.
      </p>
      <div style="margin: 16px 0; padding: 12px 16px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          <strong>&#9888;&#65039; Security Notice:</strong> If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>
    `,
    ctaButton: {
      label: 'Reset Password',
      url: data.resetUrl,
    },
  });

  const text = `Reset Your Password

Hello ${data.userName},

We received a request to reset the password for your License Vault account.

Click the link below to choose a new password:
${data.resetUrl}

This link will expire in 1 hour for security purposes.

If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.

${FOOTER_TEXT}`;

  return { html, text };
}

export interface TeamInvitationData {
  inviterName: string;
  orgName: string;
  acceptUrl: string;
  role?: string;
}

export function teamInvitationTemplate(data: TeamInvitationData): { html: string; text: string } {
  const roleLabel = data.role
    ? data.role === 'owner' ? 'Owner'
      : data.role === 'admin' ? 'Admin'
        : 'Team Member'
    : 'Team Member';

  const html = buildEmailTemplate({
    title: 'You\'re Invited to Join a Team',
    previewText: `${data.inviterName} invited you to join ${data.orgName} on License Vault.`,
    bodyContent: `
      <p style="margin: 0 0 16px 0;">
        <strong style="color: #111827;">${data.inviterName}</strong> has invited you to join the organization <strong style="color: ${BRAND_COLOR};">${data.orgName}</strong> on License Vault.
      </p>
      <div style="margin-bottom: 16px; padding: 12px 16px; background: ${BRAND_COLOR}08; border-radius: 8px; text-align: center;">
        <p style="margin: 0; color: #6b7280; font-size: 13px;">Your assigned role</p>
        <p style="margin: 4px 0 0 0; color: ${BRAND_COLOR}; font-size: 18px; font-weight: 600;">${roleLabel}</p>
      </div>
      <p style="margin: 0 0 16px 0;">
        As a team member, you'll be able to:
      </p>
      <ul style="margin: 0 0 16px 0; padding-left: 20px; color: #374151;">
        <li style="margin-bottom: 8px;">Track and manage contractor licenses</li>
        <li style="margin-bottom: 8px;">Monitor insurance and bond compliance</li>
        <li style="margin-bottom: 8px;">Receive expiration alerts and notifications</li>
        <li style="margin-bottom: 8px;">Access compliance reports and dashboards</li>
      </ul>
      <p style="margin: 0 0 0 0; color: #6b7280; font-size: 14px;">
        This invitation link will expire in <strong>7 days</strong>.
      </p>
    `,
    ctaButton: {
      label: 'Accept Invitation',
      url: data.acceptUrl,
    },
  });

  const text = `You're Invited to Join a Team

${data.inviterName} has invited you to join ${data.orgName} on License Vault.

Your role: ${roleLabel}

As a team member, you'll be able to:
- Track and manage contractor licenses
- Monitor insurance and bond compliance
- Receive expiration alerts and notifications
- Access compliance reports and dashboards

Accept your invitation:
${data.acceptUrl}

This invitation will expire in 7 days.

${FOOTER_TEXT}`;

  return { html, text };
}

export interface RenewalConfirmationData {
  licenseName: string;
  newExpirationDate: string;
  appUrl?: string;
}

export function renewalConfirmationTemplate(data: RenewalConfirmationData): { html: string; text: string } {
  const appUrl = data.appUrl || process.env.NEXTAUTH_URL || process.env.APP_URL || '';

  const html = buildEmailTemplate({
    title: 'License Renewed Successfully',
    previewText: `Your license "${data.licenseName}" has been renewed successfully.`,
    bodyContent: `
      <div style="margin-bottom: 20px; padding: 12px 16px; background: ${BRAND_COLOR}11; border-left: 4px solid ${BRAND_COLOR}; border-radius: 4px;">
        <strong style="color: ${BRAND_COLOR}; font-size: 14px;">&#10003; RENEWED</strong>
        <span style="color: #374151; font-size: 14px; margin-left: 8px;">Your license has been successfully renewed</span>
      </div>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; width: 160px; font-weight: 600; color: #6b7280; font-size: 13px;">License Name</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 15px;">${data.licenseName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #6b7280; font-size: 13px;">New Expiration Date</td>
          <td style="padding: 8px 0; color: ${BRAND_COLOR}; font-weight: 600; font-size: 15px;">${data.newExpirationDate}</td>
        </tr>
      </table>
      <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">
        Your license is now active and you'll continue to receive alerts as the new expiration date approaches.
      </p>
    `,
    ctaButton: {
      label: 'View License Details',
      url: `${appUrl}/licenses`,
    },
  });

  const text = `License Renewed Successfully

License: ${data.licenseName}
New Expiration Date: ${data.newExpirationDate}

Your license has been successfully renewed and is now active. You'll continue to receive alerts as the new expiration date approaches.

View license details: ${appUrl}/licenses

${FOOTER_TEXT}`;

  return { html, text };
}

// ─── NEW: Renewal Reminder Template ────────────────────────────────────────

export interface RenewalReminderData {
  licenseName: string;
  licenseType: string;
  licenseNumber: string;
  expirationDate: string;
  daysUntil: number;
  issuingAuthority: string;
  renewalSteps?: string[];
  appUrl?: string;
}

export function renewalReminderTemplate(data: RenewalReminderData): { html: string; text: string } {
  const appUrl = data.appUrl || process.env.NEXTAUTH_URL || process.env.APP_URL || '';
  const urgencyColor = data.daysUntil <= 5 ? '#ef4444' : data.daysUntil <= 30 ? '#f59e0b' : BRAND_COLOR;

  const defaultSteps = [
    'Gather required documentation (proof of CE hours, insurance, etc.)',
    'Complete the renewal application from the issuing authority',
    'Submit renewal fees before the deadline',
    'Upload confirmation to License Vault for tracking',
  ];
  const steps = data.renewalSteps || defaultSteps;

  const stepsHtml = steps
    .map((step, i) => `
      <tr>
        <td style="padding: 8px 0; vertical-align: top; width: 32px;">
          <div style="width: 24px; height: 24px; background: ${BRAND_COLOR}15; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600; color: ${BRAND_COLOR};">${i + 1}</div>
        </td>
        <td style="padding: 8px 0; color: #374151; font-size: 14px;">${step}</td>
      </tr>
    `)
    .join('');

  const html = buildEmailTemplate({
    title: 'License Renewal Reminder',
    previewText: `Your license "${data.licenseName}" needs renewal. ${data.daysUntil} days remaining.`,
    bodyContent: `
      <div style="margin-bottom: 20px; padding: 12px 16px; background: ${urgencyColor}11; border-left: 4px solid ${urgencyColor}; border-radius: 4px;">
        <strong style="color: ${urgencyColor}; font-size: 14px;">&#128197; RENEWAL DEADLINE</strong>
        <span style="color: #374151; font-size: 14px; margin-left: 8px;">
          ${data.daysUntil <= 0 ? 'Deadline has passed' : `${data.daysUntil} day${data.daysUntil !== 1 ? 's' : ''} remaining`}
        </span>
      </div>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; width: 160px; font-weight: 600; color: #6b7280; font-size: 13px;">License Name</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 15px;">${data.licenseName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #6b7280; font-size: 13px;">License Type</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 15px;">${data.licenseType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #6b7280; font-size: 13px;">License Number</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 15px;">${data.licenseNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #6b7280; font-size: 13px;">Issuing Authority</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 15px;">${data.issuingAuthority}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #6b7280; font-size: 13px;">Expiration Date</td>
          <td style="padding: 8px 0; color: ${urgencyColor}; font-weight: 600; font-size: 15px;">${data.expirationDate}</td>
        </tr>
      </table>

      <h3 style="margin: 24px 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Renewal Steps</h3>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        ${stepsHtml}
      </table>

      <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">
        Don't wait until the last minute. Start the renewal process today to avoid any compliance gaps.
      </p>
    `,
    ctaButton: {
      label: 'Start Renewal Process',
      url: `${appUrl}/licenses`,
    },
  });

  const text = `License Renewal Reminder

License: ${data.licenseName}
Type: ${data.licenseType}
Number: ${data.licenseNumber}
Issuing Authority: ${data.issuingAuthority}
Expiration Date: ${data.expirationDate}
Days Remaining: ${data.daysUntil <= 0 ? 'PAST DUE' : data.daysUntil}

Renewal Steps:
${steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Start the renewal process: ${appUrl}/licenses

${FOOTER_TEXT}`;

  return { html, text };
}

export interface ComplianceReportData {
  orgName: string;
  complianceScore: number;
  reportUrl: string;
  totalLicenses?: number;
  activeLicenses?: number;
  expiringLicenses?: number;
  expiredLicenses?: number;
  atRiskItems?: string[];
}

export function complianceReportTemplate(data: ComplianceReportData): { html: string; text: string } {
  const scoreColor = data.complianceScore >= 80 ? BRAND_COLOR : data.complianceScore >= 60 ? '#f59e0b' : '#ef4444';
  const scoreLabel = data.complianceScore >= 80 ? 'Good Standing' : data.complianceScore >= 60 ? 'Needs Attention' : 'Critical';

  const statsHtml = data.totalLicenses !== undefined ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px;">
      <tr>
        <td style="padding: 12px; background: #f9fafb; border-radius: 8px; text-align: center; width: 25%;">
          <div style="font-size: 20px; font-weight: 700; color: #111827;">${data.totalLicenses}</div>
          <div style="font-size: 12px; color: #6b7280;">Total</div>
        </td>
        <td style="padding: 12px; background: #f9fafb; border-radius: 8px; text-align: center; width: 25%;">
          <div style="font-size: 20px; font-weight: 700; color: ${BRAND_COLOR};">${data.activeLicenses || 0}</div>
          <div style="font-size: 12px; color: #6b7280;">Active</div>
        </td>
        <td style="padding: 12px; background: #f9fafb; border-radius: 8px; text-align: center; width: 25%;">
          <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">${data.expiringLicenses || 0}</div>
          <div style="font-size: 12px; color: #6b7280;">Expiring</div>
        </td>
        <td style="padding: 12px; background: #f9fafb; border-radius: 8px; text-align: center; width: 25%;">
          <div style="font-size: 20px; font-weight: 700; color: #ef4444;">${data.expiredLicenses || 0}</div>
          <div style="font-size: 12px; color: #6b7280;">Expired</div>
        </td>
      </tr>
    </table>
  ` : '';

  const atRiskHtml = data.atRiskItems && data.atRiskItems.length > 0 ? `
    <h3 style="margin: 20px 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">&#9888;&#65039; At-Risk Items</h3>
    <ul style="margin: 0 0 16px 0; padding-left: 20px; color: #374151; font-size: 14px;">
      ${data.atRiskItems.map(item => `<li style="margin-bottom: 6px;">${item}</li>`).join('')}
    </ul>
  ` : '';

  const html = buildEmailTemplate({
    title: 'Compliance Report Ready',
    previewText: `Your compliance report for ${data.orgName} is ready. Score: ${data.complianceScore}%`,
    bodyContent: `
      <p style="margin: 0 0 20px 0;">
        The compliance report for <strong style="color: #111827;">${data.orgName}</strong> is now available.
      </p>
      <div style="text-align: center; margin-bottom: 20px; padding: 24px; background: ${scoreColor}08; border-radius: 8px; border: 1px solid ${scoreColor}22;">
        <div style="font-size: 48px; font-weight: 700; color: ${scoreColor}; line-height: 1;">
          ${data.complianceScore}%
        </div>
        <div style="font-size: 14px; font-weight: 600; color: ${scoreColor}; text-transform: uppercase; margin-top: 4px;">
          ${scoreLabel}
        </div>
      </div>
      ${statsHtml}
      ${atRiskHtml}
      <p style="margin: 0; color: #6b7280; font-size: 14px;">
        Click below to view the full compliance report with detailed insights and recommendations.
      </p>
    `,
    ctaButton: {
      label: 'View Compliance Report',
      url: data.reportUrl,
    },
  });

  const text = `Compliance Report Ready

Organization: ${data.orgName}
Compliance Score: ${data.complianceScore}% (${scoreLabel})
${data.totalLicenses !== undefined ? `
Total Licenses: ${data.totalLicenses}
Active: ${data.activeLicenses || 0}
Expiring: ${data.expiringLicenses || 0}
Expired: ${data.expiredLicenses || 0}` : ''}
${data.atRiskItems && data.atRiskItems.length > 0 ? `\nAt-Risk Items:\n${data.atRiskItems.map(item => `- ${item}`).join('\n')}` : ''}

View the full compliance report:
${data.reportUrl}

${FOOTER_TEXT}`;

  return { html, text };
}

// ─── NEW: Subcontractor Portal Invite Template ─────────────────────────────

export interface SubcontractorPortalInviteData {
  orgName: string;
  portalUrl: string;
  companyName: string;
  expiresAt?: string;
  instructions?: string[];
}

export function subcontractorPortalInviteTemplate(data: SubcontractorPortalInviteData): { html: string; text: string } {
  const defaultInstructions = [
    'Click the portal access button below',
    'Upload your license and insurance documents',
    'Verify your company information',
    'Submit for review by the compliance team',
  ];
  const instructions = data.instructions || defaultInstructions;

  const instructionsHtml = instructions
    .map((step, i) => `
      <tr>
        <td style="padding: 6px 0; vertical-align: top; width: 32px;">
          <div style="width: 24px; height: 24px; background: ${BRAND_COLOR}15; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600; color: ${BRAND_COLOR};">${i + 1}</div>
        </td>
        <td style="padding: 6px 0; color: #374151; font-size: 14px;">${step}</td>
      </tr>
    `)
    .join('');

  const html = buildEmailTemplate({
    title: 'Portal Access Invitation',
    previewText: `${data.orgName} has granted you portal access to submit compliance documents.`,
    bodyContent: `
      <p style="margin: 0 0 16px 0;">
        <strong style="color: ${BRAND_COLOR};">${data.orgName}</strong> has granted you access to their compliance portal.
      </p>
      <p style="margin: 0 0 16px 0;">
        As a subcontractor, you can use this portal to upload and manage your licenses, insurance documents, and compliance records.
      </p>
      <div style="margin-bottom: 16px; padding: 12px 16px; background: #f0fdf4; border: 1px solid ${BRAND_COLOR}33; border-radius: 8px;">
        <p style="margin: 0; font-size: 13px; color: #6b7280;">Company</p>
        <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #111827;">${data.companyName}</p>
      </div>

      <h3 style="margin: 20px 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Getting Started</h3>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        ${instructionsHtml}
      </table>

      ${data.expiresAt ? `
        <div style="margin-top: 16px; padding: 12px 16px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>&#9888;&#65039; This invitation expires on ${data.expiresAt}.</strong> Please complete your submission before the deadline.
          </p>
        </div>
      ` : ''}
    `,
    ctaButton: {
      label: 'Access Portal',
      url: data.portalUrl,
    },
  });

  const text = `Portal Access Invitation

${data.orgName} has granted you access to their compliance portal.

Company: ${data.companyName}

Getting Started:
${instructions.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Access the portal:
${data.portalUrl}
${data.expiresAt ? `\nThis invitation expires on ${data.expiresAt}.` : ''}

${FOOTER_TEXT}`;

  return { html, text };
}

// ─── NEW: Welcome Email Template ───────────────────────────────────────────

export interface WelcomeEmailData {
  userName: string;
  orgName: string;
  dashboardUrl: string;
  gettingStartedSteps?: string[];
}

export function welcomeEmailTemplate(data: WelcomeEmailData): { html: string; text: string } {
  const defaultSteps = [
    { icon: '&#127968;', title: 'Set up your organization', desc: 'Add your company details and trade type' },
    { icon: '&#128196;', title: 'Add your first license', desc: 'Start tracking your contractor licenses' },
    { icon: '&#128276;', title: 'Configure alerts', desc: 'Get notified before licenses expire' },
    { icon: '&#128101;', title: 'Invite your team', desc: 'Collaborate with your organization' },
  ];
  const steps = data.gettingStartedSteps || defaultSteps.map(s => s.title);

  const stepsHtml = defaultSteps
    .map(step => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="vertical-align: top; width: 40px;">
                <div style="font-size: 24px; line-height: 1;">${step.icon}</div>
              </td>
              <td style="vertical-align: top;">
                <p style="margin: 0; font-weight: 600; color: #111827; font-size: 15px;">${step.title}</p>
                <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">${step.desc}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `)
    .join('');

  const html = buildEmailTemplate({
    title: `Welcome to License Vault!`,
    previewText: `Get started with License Vault and never miss a license renewal again.`,
    bodyContent: `
      <p style="margin: 0 0 16px 0;">Hello ${data.userName},</p>
      <p style="margin: 0 0 16px 0;">
        Welcome to <strong style="color: ${BRAND_COLOR};">License Vault</strong>! Your organization <strong>${data.orgName}</strong> is all set up. We're excited to help you stay compliant and never miss a renewal deadline.
      </p>

      <h3 style="margin: 24px 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Getting Started</h3>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        ${stepsHtml}
      </table>

      <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
        Need help? Our AI compliance assistant is available 24/7 to answer questions about licensing requirements and best practices.
      </p>
    `,
    ctaButton: {
      label: 'Go to Dashboard',
      url: data.dashboardUrl,
    },
  });

  const text = `Welcome to License Vault!

Hello ${data.userName},

Welcome to License Vault! Your organization ${data.orgName} is all set up. We're excited to help you stay compliant and never miss a renewal deadline.

Getting Started:
${defaultSteps.map((step, i) => `${i + 1}. ${step.title} - ${step.desc}`).join('\n')}

Go to Dashboard: ${data.dashboardUrl}

Need help? Our AI compliance assistant is available 24/7.

${FOOTER_TEXT}`;

  return { html, text };
}

// ─── Test Email Template ───────────────────────────────────────────────────

export interface TestEmailData {
  userName: string;
}

export function testEmailTemplate(data: TestEmailData): { html: string; text: string } {
  const html = buildEmailTemplate({
    title: 'Test Email from License Vault',
    previewText: 'This is a test email to verify your email notification settings.',
    bodyContent: `
      <p style="margin: 0 0 16px 0;">Hello ${data.userName},</p>
      <p style="margin: 0 0 16px 0;">
        This is a test email from <strong style="color: ${BRAND_COLOR};">License Vault</strong>. If you're seeing this, your email notification settings are working correctly!
      </p>
      <div style="margin: 20px 0; padding: 16px; background: ${BRAND_COLOR}08; border-radius: 8px; text-align: center;">
        <span style="font-size: 40px;">&#10003;</span>
        <p style="margin: 8px 0 0 0; color: ${BRAND_COLOR}; font-weight: 600;">Email delivery confirmed</p>
      </div>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">
        You can safely ignore or delete this email. No action is required.
      </p>
    `,
  });

  const text = `Test Email from License Vault

Hello ${data.userName},

This is a test email from License Vault. If you're seeing this, your email notification settings are working correctly!

Email delivery confirmed.

You can safely ignore or delete this email. No action is required.

${FOOTER_TEXT}`;

  return { html, text };
}
