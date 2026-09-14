import { baseLayout } from './baseLayout.js';

export const adminPasswordResetTemplate = ({
  name,
  email,
  resetUrl,
  expiresInMinutes = 60,
  requestedIp = '',
  requestedDevice = '',
  requestedAt = new Date(),
  supportEmail = 'support@hoterstellar.com',
}) => {
  const formattedDate = new Date(requestedAt).toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka',
  });

  const content = `
    <p class="content-text">Dear ${name},</p>

    <p class="content-text">
      We received a request to reset the password for your
      <strong>Hoterstellar Admin</strong> account associated with
      <strong>${email}</strong>.
    </p>

    <p class="content-text">
      To proceed, click the button below to set a new password. This link is
      valid for <strong>${expiresInMinutes} minutes</strong> and can only be
      used once.
    </p>

    <div style="text-align: center; margin: 35px 0;">
      <a href="${resetUrl}" class="button" style="
        display: inline-block;
        background: linear-gradient(135deg, #C9A96E 0%, #B8955E 100%);
        color: #FFFFFF;
        text-decoration: none;
        padding: 16px 48px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        box-shadow: 0 6px 20px rgba(201, 169, 110, 0.35);
      ">
        Reset My Password
      </a>
    </div>

    <div class="card">
      <div class="card-title">Request Details</div>
      <div class="info-row">
        <span class="info-label">Requested At</span>
        <span class="info-value">${formattedDate}</span>
      </div>
      ${
        requestedIp
          ? `
      <div class="info-row">
        <span class="info-label">IP Address</span>
        <span class="info-value" style="font-family: monospace;">${requestedIp}</span>
      </div>
      `
          : ''
      }
      ${
        requestedDevice
          ? `
      <div class="info-row">
        <span class="info-label">Device / Browser</span>
        <span class="info-value" style="font-size: 12px;">${requestedDevice}</span>
      </div>
      `
          : ''
      }
      <div class="info-row">
        <span class="info-label">Link Expires In</span>
        <span class="info-value">${expiresInMinutes} minutes</span>
      </div>
      <div class="info-row">
        <span class="info-label">One-Time Use</span>
        <span class="info-value">Yes — cannot be reused</span>
      </div>
    </div>

    <div class="card" style="background: #FFF4E5; border: 1px solid #C9A96E;">
      <div class="card-title" style="color: #8B5E00;">⚠️ Didn't Request This?</div>
      <p style="font-size: 14px; color: #5A4A2A; margin: 10px 0;">
        If you did not request a password reset, please <strong>ignore this email</strong>.
        Your password will remain unchanged. No further action is required.
      </p>
      <p style="font-size: 13px; color: #8B5E00; margin-top: 15px;">
        If you're concerned about account security, contact us immediately at
        <a href="mailto:${supportEmail}" style="color: #8B5E00; font-weight: 600;">
          ${supportEmail}
        </a>
      </p>
    </div>

    <p class="content-text" style="font-size: 12px; color: #888; margin-top: 30px;">
      For security, this link will expire in <strong>${expiresInMinutes} minutes</strong>.
      If it expires, you can request a new password reset link.
    </p>

    <p class="content-text" style="font-size: 11px; color: #AAA; word-break: break-all; margin-top: 20px;">
      If the button above doesn't work, copy and paste this URL into your browser:<br>
      <a href="${resetUrl}" style="color: #C9A96E;">${resetUrl}</a>
    </p>
  `;

  return baseLayout({
    title: 'Password Reset Request',
    preheader: `Reset your Hoterstellar Admin password — link expires in ${expiresInMinutes} minutes`,
    content,
  });
};
