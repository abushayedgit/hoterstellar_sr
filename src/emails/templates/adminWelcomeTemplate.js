import { baseLayout } from "./baseLayout.js";

export const adminWelcomeTemplate = ({
  name,
  email,
  tempPassword,
  loginUrl,
}) => {
  const content = `
    <p class="content-text">Dear ${name},</p>
    <p class="content-text">
      Welcome to the Hoterstellar administrative team. Your account has been created with the following credentials:
    </p>
    
    <div class="card">
      <div class="card-title">Account Details</div>
      <div class="info-row">
        <span class="info-label">Email</span>
        <span class="info-value">${email}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Temporary Password</span>
        <span class="info-value" style="font-family: monospace;">${tempPassword}</span>
      </div>
    </div>
    
    <div class="temp-password">${tempPassword}</div>
    
    <p class="content-text">
      <strong>Important:</strong> You will be required to change this password upon your first login for security purposes.
    </p>
    
    <div style="text-align: center;">
      <a href="${loginUrl}" class="button">Login to Dashboard</a>
    </div>
    
    <p class="content-text" style="font-size: 12px; color: #888;">
      If you did not expect this email, please contact the super administrator immediately.
    </p>
  `;

  return baseLayout({
    title: "Welcome to the Team",
    preheader: "Your admin account has been created",
    content,
  });
};
