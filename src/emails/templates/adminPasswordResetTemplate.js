import { baseLayout } from "./baseLayout.js";

export const adminPasswordResetTemplate = ({
  name,
  resetUrl,
  expiryTime = "1 hour",
}) => {
  const content = `
    <p class="content-text">Dear ${name},</p>
    <p class="content-text">
      We received a request to reset your admin password. Click the button below to create a new password:
    </p>
    
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    
    <div class="card">
      <div class="card-title">Security Notice</div>
      <div class="info-row">
        <span class="info-label">Link Expires In</span>
        <span class="info-value">${expiryTime}</span>
      </div>
      <div class="info-row">
        <span class="info-label">One-time Use</span>
        <span class="info-value">Yes</span>
      </div>
    </div>
    
    <p class="content-text" style="font-size: 12px; color: #888;">
      If you did not request this password reset, please ignore this email or contact the super administrator immediately.
    </p>
  `;

  return baseLayout({
    title: "Password Reset Request",
    preheader: "Reset your admin password",
    content,
  });
};
