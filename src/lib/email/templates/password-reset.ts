import { baseEmailTemplate } from '../service';

interface PasswordResetData {
  recipientEmail: string;
  recipientName?: string;
  resetUrl: string;
  tokenExpiry: string;
}

export function generatePasswordResetEmail(data: PasswordResetData): { html: string; text: string; subject: string } {
  const subject = '🔐 Reset Your LicenseVault Password';

  const content = `
    <h2>Password Reset Request</h2>
    <p>Hello${data.recipientName ? ` ${data.recipientName}` : ''},</p>
    <p>We received a request to reset your password for your LicenseVault account. Click the button below to create a new password:</p>
    
    <div style="text-align: center;">
      <a href="${data.resetUrl}" class="btn">Reset Password</a>
    </div>

    <p style="font-size: 13px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="font-size: 13px; color: #059669; word-break: break-all;">${data.resetUrl}</p>

    <div class="warning-box">
      <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>⏱️ This link expires in ${data.tokenExpiry}.</strong> If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.</p>
    </div>

    <div class="divider"></div>
    <p style="font-size: 13px; color: #6b7280;">For security reasons, we recommend choosing a strong, unique password that you don't use for other services.</p>
  `;

  const html = baseEmailTemplate(content, subject);

  const text = `
Reset Your LicenseVault Password

Hello${data.recipientName ? ` ${data.recipientName}` : ''},

We received a request to reset your password for your LicenseVault account.

Reset your password by visiting this link:
${data.resetUrl}

This link expires in ${data.tokenExpiry}.

If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.

For security reasons, we recommend choosing a strong, unique password that you don't use for other services.

---
Powered by LicenseVault — Contractor License Compliance
  `.trim();

  return { html, text, subject };
}
