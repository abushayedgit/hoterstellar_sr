import { baseLayout } from "./baseLayout.js";

export const userOtpTemplate = ({ name, otp, purpose, expiryMinutes = 5 }) => {
  const isSignup = purpose === "signup";
  const title = isSignup ? "Verify Your Email" : "Sign In Verification";
  const message = isSignup
    ? "Thank you for choosing Hoterstellar. Use the code below to verify your email and complete your registration:"
    : "Use the code below to securely sign in to your Hoterstellar account:";

  const content = `
    <p class="content-text">Dear ${name || "Guest"},</p>
    <p class="content-text">${message}</p>
    
    <div class="otp-box">
      <div class="otp-label">Verification Code</div>
      <div class="otp-code">${otp}</div>
    </div>
    
    <div class="card">
      <div class="card-title">Code Details</div>
      <div class="info-row">
        <span class="info-label">Expires In</span>
        <span class="info-value">${expiryMinutes} minutes</span>
      </div>
      <div class="info-row">
        <span class="info-label">Purpose</span>
        <span class="info-value">${isSignup ? "Account Registration" : "Secure Sign In"}</span>
      </div>
    </div>
    
    <p class="content-text" style="font-size: 12px; color: #888;">
      If you did not request this code, please ignore this email. Never share this code with anyone.
    </p>
  `;

  return baseLayout({
    title,
    preheader: `Your verification code is ${otp}`,
    content,
  });
};
