import { baseEmailTemplate } from '../service';

interface RenewalReminderData {
  licenseName: string;
  licenseNumber: string;
  licenseType: string;
  issuedBy: string;
  expirationDate: string;
  daysRemaining: number;
  orgName: string;
  recipientName?: string;
  renewalUrl?: string;
}

export function generateRenewalReminderEmail(data: RenewalReminderData): { html: string; text: string; subject: string } {
  const subject = `🔄 Renewal Reminder: ${data.licenseName} (${data.licenseNumber})`;

  const renewalLink = data.renewalUrl || `${process.env.NEXTAUTH_URL || ''}/licenses`;

  const content = `
    <h2>License Renewal Reminder</h2>
    <p>Hello${data.recipientName ? ` ${data.recipientName}` : ''},</p>
    <p>This is a friendly reminder that your contractor license is approaching its expiration date. It's time to start the renewal process to ensure uninterrupted compliance.</p>
    
    <div class="info-box">
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
          <td style="padding: 4px 0; color: #059669; font-weight: 600;">${data.expirationDate}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-weight: 600; color: #374151;">Days Remaining:</td>
          <td style="padding: 4px 0; color: ${data.daysRemaining <= 14 ? '#d97706' : '#059669'}; font-weight: 600;">${data.daysRemaining} days</td>
        </tr>
      </table>
    </div>

    <p><strong>Recommended next steps:</strong></p>
    <ul style="color: #374151; padding-inline-start: 20px;">
      <li>Contact the issuing authority (${data.issuedBy}) for renewal requirements</li>
      <li>Gather required documentation and continuing education credits</li>
      <li>Submit renewal application before the expiration date</li>
      <li>Update your LicenseVault record once renewed</li>
    </ul>

    <div style="text-align: center;">
      <a href="${renewalLink}" class="btn">Manage License</a>
    </div>

    <div class="divider"></div>
    <p style="font-size: 13px; color: #6b7280;">Organization: ${data.orgName}</p>
  `;

  const html = baseEmailTemplate(content, subject);

  const text = `
License Renewal Reminder

Hello${data.recipientName ? ` ${data.recipientName}` : ''},

This is a friendly reminder that your contractor license is approaching its expiration date.

License Name: ${data.licenseName}
License Number: ${data.licenseNumber}
Type: ${data.licenseType}
Issuing Authority: ${data.issuedBy}
Expiration Date: ${data.expirationDate}
Days Remaining: ${data.daysRemaining} days

Recommended next steps:
- Contact the issuing authority for renewal requirements
- Gather required documentation and continuing education credits
- Submit renewal application before the expiration date
- Update your LicenseVault record once renewed

Manage your license: ${renewalLink}

Organization: ${data.orgName}

---
Powered by LicenseVault — Contractor License Compliance
  `.trim();

  return { html, text, subject };
}
