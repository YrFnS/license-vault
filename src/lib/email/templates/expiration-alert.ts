import { baseEmailTemplate } from '../service';

interface ExpirationAlertData {
  licenseName: string;
  licenseNumber: string;
  licenseType: string;
  issuedBy: string;
  expirationDate: string;
  daysRemaining: number;
  orgName: string;
  recipientName?: string;
}

export function generateExpirationAlertEmail(data: ExpirationAlertData): { html: string; text: string; subject: string } {
  const isExpired = data.daysRemaining <= 0;
  const absDays = Math.abs(data.daysRemaining);
  
  const urgencyText = isExpired
    ? `has expired ${absDays} day${absDays !== 1 ? 's' : ''} ago`
    : data.daysRemaining <= 7
    ? `expires in just ${data.daysRemaining} day${data.daysRemaining !== 1 ? 's' : ''}`
    : data.daysRemaining <= 30
    ? `expires in ${data.daysRemaining} days`
    : `expires in ${data.daysRemaining} days`;

  const boxClass = isExpired ? 'danger-box' : data.daysRemaining <= 7 ? 'danger-box' : data.daysRemaining <= 30 ? 'warning-box' : 'info-box';
  const actionText = isExpired ? 'Renew Now' : 'Start Renewal Process';

  const subject = isExpired
    ? `⚠️ EXPIRED: ${data.licenseName} (${data.licenseNumber})`
    : data.daysRemaining <= 7
    ? `🚨 URGENT: ${data.licenseName} expires in ${data.daysRemaining} days`
    : `📋 Action Required: ${data.licenseName} ${urgencyText}`;

  const content = `
    <h2>License Expiration Alert</h2>
    <p>Hello${data.recipientName ? ` ${data.recipientName}` : ''},</p>
    <p>This is a reminder that the following contractor license <strong>${urgencyText}</strong>:</p>
    
    <div class="${boxClass}">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; font-weight: 600; color: #374151; width: 140px;">License Name:</td>
          <td style="padding: 4px 0; color: #111827;">${data.licenseName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-weight: 600; color: #374151;">License Number:</td>
          <td style="padding: 4px 0; color: #111827;">${data.licenseNumber}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-weight: 600; color: #374151;">Type:</td>
          <td style="padding: 4px 0; color: #111827;">${data.licenseType}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-weight: 600; color: #374151;">Issuing Authority:</td>
          <td style="padding: 4px 0; color: #111827;">${data.issuedBy}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-weight: 600; color: #374151;">Expiration Date:</td>
          <td style="padding: 4px 0; color: ${isExpired ? '#dc2626' : '#111827'}; font-weight: ${isExpired ? '700' : '400'};">${data.expirationDate}</td>
        </tr>
      </table>
    </div>

    ${isExpired ? '<p style="color: #dc2626; font-weight: 600;">⚠️ Operating with an expired license may result in penalties, fines, or legal action. Please renew immediately.</p>' : ''}

    <p>To manage this license or initiate the renewal process, log in to your LicenseVault account.</p>
    
    <div style="text-align: center;">
      <a href="${process.env.NEXTAUTH_URL || ''}/licenses" class="btn">${actionText}</a>
    </div>

    <div class="divider"></div>
    <p style="font-size: 13px; color: #6b7280;">Organization: ${data.orgName}</p>
  `;

  const html = baseEmailTemplate(content, subject);
  
  const text = `
License Expiration Alert

Hello${data.recipientName ? ` ${data.recipientName}` : ''},

This is a reminder that the following contractor license ${urgencyText}:

License Name: ${data.licenseName}
License Number: ${data.licenseNumber}
Type: ${data.licenseType}
Issuing Authority: ${data.issuedBy}
Expiration Date: ${data.expirationDate}

${isExpired ? '⚠️ Operating with an expired license may result in penalties. Please renew immediately.' : 'Please initiate the renewal process to maintain compliance.'}

Log in to LicenseVault to manage this license:
${process.env.NEXTAUTH_URL || ''}/licenses

Organization: ${data.orgName}

---
Powered by LicenseVault — Contractor License Compliance
  `.trim();

  return { html, text, subject };
}
