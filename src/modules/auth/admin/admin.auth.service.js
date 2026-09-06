import crypto from "crypto";
import { Admin } from "./admin.model.js";
import { AdminSession } from "./adminSession.model.js";
import { env } from "../../../config/env.js";
import { SECURITY } from "../../../constants/security.js";
import {
  generateRandomToken,
  hashToken,
  generateTokenPair,
} from "../../../utils/token.utils.js";
import { AuthenticationError } from "../../../errors/AuthenticationError.js";
import { NotFoundError } from "../../../errors/NotFoundError.js";
import { BadRequestError } from "../../../errors/BadRequestError.js";
import { ConflictError } from "../../../errors/ConflictError.js";
import { logger } from "../../../utils/logger.js";
import { getBrevoClient } from "../../../config/brevo.js";
import { emitAdminEvent } from "../../utils/socketEmitter.js";
import { SOCKET_EVENTS } from "../../constants/socketEvents.js";

export const adminLogin = async ({ email, password, deviceInfo }) => {
  const admin = await Admin.findOne({ email }).select("+password");

  if (!admin) {
    throw new AuthenticationError("Invalid email or password");
  }

  if (!admin.isActive) {
    throw new AuthenticationError("Account is deactivated");
  }

  const isPasswordValid = await admin.comparePassword(password);

  if (!isPasswordValid) {
    throw new AuthenticationError("Invalid email or password");
  }

  const payload = {
    sub: admin._id.toString(),
    adminId: admin._id.toString(),
    role: admin.role,
    type: "admin",
  };

  const { accessToken, refreshToken, refreshTokenHash } = generateTokenPair(
    payload,
    env.ADMIN_JWT_SECRET,
    env.ADMIN_ACCESS_TOKEN_EXPIRES_IN,
  );

  await AdminSession.create({
    adminId: admin._id,
    refreshTokenHash,
    deviceInfo: deviceInfo || "Unknown device",
    issuedAt: new Date(),
    expiresAt: new Date(
      Date.now() + SECURITY.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    ),
  });

  admin.lastLoginAt = new Date();
  await admin.save();

  logger.info("Admin logged in", { adminId: admin._id, email: admin.email });

  return {
    accessToken,
    refreshToken,
    admin: admin.toSafeObject(),
    mustChangePassword: admin.mustChangePassword,
  };
};

export const adminRefresh = async (refreshToken, deviceInfo) => {
  const refreshTokenHash = hashToken(refreshToken);
  const session = await AdminSession.findOne({ refreshTokenHash }).select(
    "+refreshTokenHash",
  );

  if (!session || !session.isActive()) {
    throw new AuthenticationError("Invalid refresh token");
  }

  const admin = await Admin.findById(session.adminId);

  if (!admin || !admin.isActive) {
    throw new AuthenticationError("Account is deactivated");
  }

  // Rotate refresh token
  session.revokedAt = new Date();
  await session.save();

  const payload = {
    sub: admin._id.toString(),
    adminId: admin._id.toString(),
    role: admin.role,
    type: "admin",
  };

  const {
    accessToken,
    refreshToken: newRefreshToken,
    refreshTokenHash: newRefreshTokenHash,
  } = generateTokenPair(
    payload,
    env.ADMIN_JWT_SECRET,
    env.ADMIN_ACCESS_TOKEN_EXPIRES_IN,
  );

  const newSession = await AdminSession.create({
    adminId: admin._id,
    refreshTokenHash: newRefreshTokenHash,
    deviceInfo: deviceInfo || "Unknown device",
    issuedAt: new Date(),
    expiresAt: new Date(
      Date.now() + SECURITY.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    ),
  });

  session.replacedBySessionId = newSession._id;
  await session.save();

  return {
    accessToken,
    refreshToken: newRefreshToken,
    admin: admin.toSafeObject(),
  };
};

export const adminLogout = async (refreshToken) => {
  if (!refreshToken) {
    return true;
  }

  const refreshTokenHash = hashToken(refreshToken);
  const session = await AdminSession.findOne({ refreshTokenHash });

  if (session && session.isActive()) {
    session.revokedAt = new Date();
    await session.save();
  }

  return true;
};

export const changePassword = async (adminId, currentPassword, newPassword) => {
  const admin = await Admin.findById(adminId).select("+password");

  if (!admin) {
    throw new NotFoundError("Admin not found");
  }

  const isPasswordValid = await admin.comparePassword(currentPassword);

  if (!isPasswordValid) {
    throw new AuthenticationError("Current password is incorrect");
  }

  admin.password = newPassword;
  admin.mustChangePassword = false;
  await admin.save();

  // Revoke all sessions
  await AdminSession.updateMany(
    { adminId: admin._id, revokedAt: null },
    { revokedAt: new Date() },
  );

  logger.info("Admin changed password", { adminId: admin._id });

  return true;
};

export const createAdmin = async (adminData, createdByAdminId) => {
  const { email, name, role } = adminData;

  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    throw new ConflictError("Admin with this email already exists");
  }

  // Generate temporary password
  const tempPassword = crypto.randomBytes(12).toString("base64").slice(0, 16);

  const admin = await Admin.create({
    email,
    name,
    role,
    password: tempPassword,
    mustChangePassword: true,
    createdBy: createdByAdminId,
  });

  // Send email with temp password
  const brevoClient = getBrevoClient();
  if (brevoClient) {
    try {
      await brevoClient.sendEmail({
        to: email,
        subject: "Your Hoterstellar Admin Account",
        html: `
          <h2>Welcome to Hoterstellar</h2>
          <p>Your admin account has been created.</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p>You will be required to change this password on first login.</p>
        `,
      });
    } catch (error) {
      logger.error("Failed to send admin welcome email", {
        error: error.message,
      });
    }
  }
  emitAdminEvent(SOCKET_EVENTS.ADMIN_CREATED, {
    adminId: admin._id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });
  logger.info("Admin created", {
    adminId: admin._id,
    createdBy: createdByAdminId,
  });

  return admin.toSafeObject();
};

export const requestPasswordReset = async (email) => {
  const admin = await Admin.findOne({ email });

  // Always return success to prevent email enumeration
  if (!admin) {
    return true;
  }

  const resetToken = generateRandomToken(32);
  const resetTokenHash = hashToken(resetToken);

  // Store reset token in Redis (will implement in Phase 16)
  // For now, store in a simple way
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Send email
  const brevoClient = getBrevoClient();
  if (brevoClient) {
    try {
      const resetUrl = `${env.CLIENT_DASHBOARD_URL}/reset-password?token=${resetToken}`;
      await brevoClient.sendEmail({
        to: email,
        subject: "Reset Your Admin Password",
        html: `
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
        `,
      });
    } catch (error) {
      logger.error("Failed to send password reset email", {
        error: error.message,
      });
    }
  }

  logger.info("Password reset requested", { email });

  return true;
};

export const resetPassword = async (token, newPassword) => {
  // In production, verify token from Redis
  // For now, just update password
  throw new BadRequestError("Password reset not fully implemented yet");
};
