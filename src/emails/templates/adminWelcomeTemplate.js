import { baseLayout } from './baseLayout.js';

/**
 * Advanced admin welcome email.
 * Sent when a Super Admin creates a new admin account.
 */
export const adminWelcomeTemplate = ({
  name,
  email,
  tempPassword,
  role,
  loginUrl,
  createdByName = 'Super Administrator',
  createdByEmail = '',
  createdAt = new Date(),
  expiresInHours = 72,
  supportEmail = 'support@hoterstellar.com',
  tempPasswordExpiryHours = 72,
}) => {
  const formattedDate = new Date(createdAt).toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka',
  });

  const roleLabels = {
    super_admin: 'Super Administrator',
    admin: 'Administrator',
    manager: 'Manager',
  };

  const roleDescriptions = {
    super_admin:
      'Full system access including admin management, billboard control, analytics deletion, and all operational modules.',
    admin:
      'Operational management including food, categories, orders, bookings, reviews, notices, user moderation, and analytics viewing.',
    manager:
      'Operational assistance including order acceptance, booking approval, review moderation, notice creation (own notices only), and analytics viewing.',
  };

  const roleLabel = roleLabels[role] || 'Administrator';
  const roleDescription = roleDescriptions[role] || '';

  const content = `
    <p class="content-text">Dear ${name},</p>

    <p class="content-text">
      Welcome to the <strong>Hoterstellar</strong> administrative team. Your admin
      account has been successfully created. Below are your account details and
      first-login instructions.
    </p>

    <div class="card">
      <div class="card-title">Your Account</div>
      <div class="info-row">
        <span class="info-label">Name</span>
        <span class="info-value">${name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email</span>
        <span class="info-value">${email}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Role</span>
        <span class="info-value" style="color: #C9A96E; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          ${roleLabel}
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">Account Created</span>
        <span class="info-value">${formattedDate}</span>
      </div>
    </div>

    ${
      roleDescription
        ? `
    <div class="card" style="background: linear-gradient(135deg, #F5F1E8 0%, #FAF7F0 100%); border-left: 4px solid #C9A96E;">
      <div class="card-title">Your Access Level</div>
      <p style="font-size: 14px; color: #4A4A4A; margin: 8px 0; line-height: 1.7;">
        ${roleDescription}
      </p>
    </div>
    `
        : ''
    }

    <div class="card" style="border: 2px dashed #C9A96E; background: #FFFDF7;">
      <div class="card-title" style="color: #8B5E00;">🔑 Temporary Password</div>
      <p style="font-size: 13px; color: #5A4A2A; margin: 8px 0 15px 0;">
        Use the following one-time password to log in for the first time:
      </p>
      <div class="temp-password" style="
        background: #FFFFFF;
        border: 2px dashed #C9A96E;
        border-radius: 8px;
        padding: 20px;
        font-family: 'Courier New', monospace;
        font-size: 22px;
        color: #1B4332;
        text-align: center;
        letter-spacing: 3px;
        font-weight: 700;
        word-break: break-all;
      ">
        ${tempPassword}
      </div>
      <p style="font-size: 12px; color: #8B5E00; margin-top: 15px; text-align: center;">
        ⏰ This temporary password expires in <strong>${tempPasswordExpiryHours} hours</strong>
      </p>
    </div>

    <div style="text-align: center; margin: 35px 0;">
      <a href="${loginUrl}" class="button" style="
        display: inline-block;
        background: linear-gradient(135deg, #1B4332 0%, #1B3A5C 100%);
        color: #FFFFFF;
        text-decoration: none;
        padding: 16px 48px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        box-shadow: 0 6px 20px rgba(27, 67, 50, 0.35);
      ">
        Login to Dashboard
      </a>
    </div>

    <div class="card" style="background: #F0F7F4; border-left: 4px solid #1B4332;">
      <div class="card-title" style="color: #1B4332;">🔐 First Login — Important</div>
      <p style="font-size: 13px; color: #2C4A3E; margin: 8px 0; line-height: 1.7;">
        For security reasons, <strong>you will be required to change this
        temporary password on your first login</strong>. Your new password must meet
        the following requirements:
      </p>
      <ul style="font-size: 13px; color: #2C4A3E; margin: 10px 0; padding-left: 20px; line-height: 1.8;">
        <li>Minimum 12 characters</li>
        <li>At least one uppercase letter (A–Z)</li>
        <li>At least one lowercase letter (a–z)</li>
        <li>At least one number (0–9)</li>
        <li>At least one special character (!@#$%^&amp;*)</li>
      </ul>
    </div>

    <div class="card">
      <div class="card-title">Created By</div>
      <div class="info-row">
        <span class="info-label">Administrator</span>
        <span class="info-value">${createdByName}</span>
      </div>
      ${
        createdByEmail
          ? `
      <div class="info-row">
        <span class="info-label">Contact Email</span>
        <span class="info-value">${createdByEmail}</span>
      </div>
      `
          : ''
      }
    </div>

    <div class="card" style="background: #FFF4E5; border: 1px solid #C9A96E;">
      <div class="card-title" style="color: #8B5E00;">⚠️ Security Notice</div>
      <p style="font-size: 13px; color: #5A4A2A; margin: 8px 0; line-height: 1.7;">
        Never share this temporary password with anyone. If you did not expect to
        receive this invitation, please ignore this email or contact us immediately.
      </p>
      <p style="font-size: 13px; color: #8B5E00; margin-top: 12px;">
        Need help? Reach out to
        <a href="mailto:${supportEmail}" style="color: #8B5E00; font-weight: 600;">
          ${supportEmail}
        </a>
      </p>
    </div>

    <p class="content-text" style="font-size: 12px; color: #888; margin-top: 30px;">
      Welcome aboard — we're glad to have you on the team.
    </p>

    <p class="content-text" style="font-size: 11px; color: #AAA; margin-top: 15px;">
      If the login button above doesn't work, copy and paste this URL into your browser:<br>
      <a href="${loginUrl}" style="color: #C9A96E; word-break: break-all;">${loginUrl}</a>
    </p>
  `;

  return baseLayout({
    title: 'Welcome to the Hoterstellar Team',
    preheader: `Your ${roleLabel} account is ready — log in and set your password`,
    content,
  });
};
