import { baseEmailTemplate } from '../service';

interface TeamInviteData {
  inviteeEmail: string;
  inviteeName?: string;
  inviterName: string;
  orgName: string;
  role: string;
  inviteUrl?: string;
}

export function generateTeamInviteEmail(data: TeamInviteData): { html: string; text: string; subject: string } {
  const subject = `🤝 You're Invited to Join ${data.orgName} on LicenseVault`;

  const inviteLink = data.inviteUrl || `${process.env.NEXTAUTH_URL || ''}/login`;

  const roleLabel = data.role === 'owner' ? 'Owner' : data.role === 'admin' ? 'Administrator' : 'Team Member';

  const content = `
    <h2>You've Been Invited!</h2>
    <p>Hello${data.inviteeName ? ` ${data.inviteeName}` : ''},</p>
    <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.orgName}</strong> on LicenseVault as a <strong>${roleLabel}</strong>.</p>
    
    <div class="info-box">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; font-weight: 600; color: #374151; width: 140px;">Organization:</td>
          <td style="padding: 4px 0; color: #111827;">${data.orgName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-weight: 600; color: #374151;">Invited By:</td>
          <td style="padding: 4px 0; color: #111827;">${data.inviterName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-weight: 600; color: #374151;">Your Role:</td>
          <td style="padding: 4px 0; color: #059669; font-weight: 600;">${roleLabel}</td>
        </tr>
      </table>
    </div>

    <p>As a ${roleLabel} of ${data.orgName}, you'll be able to:</p>
    <ul style="color: #374151; padding-inline-start: 20px;">
      <li>Track and manage contractor licenses</li>
      <li>Receive expiration alerts and compliance notifications</li>
      ${data.role !== 'member' ? '<li>Invite and manage team members</li>' : ''}
      ${data.role !== 'member' ? '<li>Access compliance reports and analytics</li>' : ''}
      <li>Collaborate with your team on license compliance</li>
    </ul>

    <div style="text-align: center;">
      <a href="${inviteLink}" class="btn">Accept Invitation</a>
    </div>

    <p style="font-size: 13px; color: #6b7280;">If you already have a LicenseVault account, you'll be added to the organization automatically upon login. If not, you'll be prompted to create an account.</p>

    <div class="divider"></div>
    <p style="font-size: 13px; color: #6b7280;">If you weren't expecting this invitation, you can safely ignore this email.</p>
  `;

  const html = baseEmailTemplate(content, subject);

  const text = `
You're Invited to Join ${data.orgName} on LicenseVault!

Hello${data.inviteeName ? ` ${data.inviteeName}` : ''},

${data.inviterName} has invited you to join ${data.orgName} on LicenseVault as a ${roleLabel}.

Organization: ${data.orgName}
Invited By: ${data.inviterName}
Your Role: ${roleLabel}

As a ${roleLabel}, you'll be able to:
- Track and manage contractor licenses
- Receive expiration alerts and compliance notifications
${data.role !== 'member' ? '- Invite and manage team members\n- Access compliance reports and analytics' : ''}
- Collaborate with your team on license compliance

Accept your invitation: ${inviteLink}

If you already have a LicenseVault account, you'll be added to the organization automatically. If not, you'll be prompted to create an account.

If you weren't expecting this invitation, you can safely ignore this email.

---
Powered by LicenseVault — Contractor License Compliance
  `.trim();

  return { html, text, subject };
}
