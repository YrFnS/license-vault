import { baseEmailTemplate } from '../service';

interface WelcomeData {
  recipientEmail: string;
  recipientName?: string;
  orgName?: string;
  loginUrl?: string;
}

export function generateWelcomeEmail(data: WelcomeData): { html: string; text: string; subject: string } {
  const subject = '🎉 Welcome to LicenseVault!';

  const loginLink = data.loginUrl || `${process.env.NEXTAUTH_URL || ''}/login`;

  const content = `
    <h2>Welcome to LicenseVault! 🎉</h2>
    <p>Hello${data.recipientName ? ` ${data.recipientName}` : ''},</p>
    <p>Thank you for joining LicenseVault — the trusted platform for contractor license compliance management. We're excited to help you stay on top of your licenses and keep your business compliant.</p>
    
    <div class="info-box">
      <p style="margin: 0; font-weight: 600; color: #059669; font-size: 16px;">Here's what you can do with LicenseVault:</p>
    </div>

    <ul style="color: #374151; padding-inline-start: 20px;">
      <li><strong>Track Licenses</strong> — Monitor all your contractor licenses, permits, and certifications in one place</li>
      <li><strong>Smart Alerts</strong> — Get notified 60, 30, and 7 days before any license expires</li>
      <li><strong>Team Management</strong> — Invite team members and manage roles and permissions</li>
      <li><strong>Compliance Portal</strong> — Share your compliance status with clients and partners</li>
      <li><strong>AI Assistant</strong> — Ask questions about licensing requirements and compliance</li>
      <li><strong>Reports & Analytics</strong> — Generate compliance reports and track trends</li>
    </ul>

    <p><strong>Get started in 3 easy steps:</strong></p>
    <ol style="color: #374151; padding-inline-start: 20px;">
      <li>Complete your organization profile</li>
      <li>Add your first contractor license</li>
      <li>Set up your alert preferences</li>
    </ol>

    <div style="text-align: center;">
      <a href="${loginLink}" class="btn">Go to Dashboard</a>
    </div>

    ${data.orgName ? `<div class="divider"></div><p style="font-size: 13px; color: #6b7280;">You've been added to the <strong>${data.orgName}</strong> organization.</p>` : ''}

    <p style="font-size: 13px; color: #6b7280;">Need help getting started? Check out our onboarding wizard when you log in for the first time.</p>
  `;

  const html = baseEmailTemplate(content, subject);

  const text = `
Welcome to LicenseVault!

Hello${data.recipientName ? ` ${data.recipientName}` : ''},

Thank you for joining LicenseVault — the trusted platform for contractor license compliance management.

Here's what you can do:
- Track Licenses — Monitor all your contractor licenses in one place
- Smart Alerts — Get notified before any license expires
- Team Management — Invite team members and manage permissions
- Compliance Portal — Share your compliance status with clients
- AI Assistant — Ask questions about licensing requirements
- Reports & Analytics — Generate compliance reports and track trends

Get started in 3 easy steps:
1. Complete your organization profile
2. Add your first contractor license
3. Set up your alert preferences

Go to Dashboard: ${loginLink}
${data.orgName ? `\nYou've been added to the ${data.orgName} organization.` : ''}

Need help? Check out our onboarding wizard when you log in for the first time.

---
Powered by LicenseVault — Contractor License Compliance
  `.trim();

  return { html, text, subject };
}
