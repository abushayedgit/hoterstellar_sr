import { User } from "./user.model.js";
import { UserAuthChallenge } from "./userAuthChallenge.model.js";
import { UserSession } from "./userSession.model.js";
import { env } from "../../../config/env.js";
import { SECURITY } from "../../../constants/security.js";
import {
  hashToken,
  generateTokenPair,
  generateOTP,
} from "../../../utils/token.utils.js";
import { AuthenticationError } from "../../../errors/AuthenticationError.js";
import { NotFoundError } from "../../../errors/NotFoundError.js";
import { BadRequestError } from "../../../errors/BadRequestError.js";
import { ConflictError } from "../../../errors/ConflictError.js";
import { logger } from "../../../utils/logger.js";
import { getBrevoClient } from "../../../config/brevo.js";
import { emitAdminEvent } from "../../utils/socketEmitter.js";
import { SOCKET_EVENTS } from "../../constants/socketEvents.js";

const sendOTPEmail = async (email, otp, purpose) => {
  const brevoClient = getBrevoClient();
  if (!brevoClient) {
    logger.warn("Brevo not configured, OTP email not sent", { email });
    return;
  }

  const subject =
    purpose === "signup"
      ? "Verify Your Email - Hoterstellar"
      : "Sign In to Hoterstellar";
  const title =
    purpose === "signup" ? "Welcome to Hoterstellar!" : "Sign In Verification";

  try {
    await brevoClient.sendEmail({
      to: email,
      subject,
      html: `
        <h2>${title}</h2>
        <p>Your verification code is:</p>
        <h1 style="font-size: 32px; letter-spacing: 5px; color: #6366f1;">${otp}</h1>
        <p>This code will expire in ${SECURITY.OTP_EXPIRY_MINUTES} minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });
  } catch (error) {
    logger.error("Failed to send OTP email", { error: error.message });
  }
};

export const userSignup = async (userData) => {
  const { email } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError("Email already registered");
  }

  const existingChallenge = await UserAuthChallenge.findOne({
    email,
    purpose: "signup",
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (existingChallenge) {
    throw new BadRequestError(
      "Verification code already sent. Please check your email.",
    );
  }

  const otp = generateOTP();
  const codeHash = hashToken(otp);

  await UserAuthChallenge.create({
    email,
    codeHash,
    purpose: "signup",
    pendingUserData: userData,
    expiresAt: new Date(Date.now() + SECURITY.OTP_EXPIRY_MINUTES * 60 * 1000),
  });

  await sendOTPEmail(email, otp, "signup");

  logger.info("User signup OTP sent", { email });

  return true;
};

export const userSignupVerify = async (email, code, deviceInfo) => {
  const challenge = await UserAuthChallenge.findOne({
    email,
    purpose: "signup",
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).select("+codeHash");

  if (!challenge) {
    throw new BadRequestError("Verification code expired or not found");
  }

  if (challenge.hasExceededAttempts()) {
    throw new BadRequestError("Too many attempts. Please request a new code.");
  }

  const codeHash = hashToken(code);
  if (codeHash !== challenge.codeHash) {
    challenge.attempts += 1;
    await challenge.save();
    throw new AuthenticationError("Invalid verification code");
  }

  challenge.consumedAt = new Date();
  await challenge.save();

  const userData = challenge.pendingUserData;
  const user = await User.create(userData);

  const payload = {
    sub: user._id.toString(),
    userId: user._id.toString(),
    type: "user",
  };

  const { accessToken, refreshToken, refreshTokenHash } = generateTokenPair(
    payload,
    env.USER_JWT_SECRET,
    env.USER_ACCESS_TOKEN_EXPIRES_IN,
  );

  await UserSession.create({
    userId: user._id,
    refreshTokenHash,
    deviceInfo: deviceInfo || "Unknown device",
    issuedAt: new Date(),
    expiresAt: new Date(
      Date.now() + SECURITY.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    ),
  });

  logger.info("User signed up", { userId: user._id, email: user.email });

  emitAdminEvent(SOCKET_EVENTS.USER_NEW, {
    userId: user._id,
    name: user.name,
    email: user.email,
  });
  return {
    accessToken,
    refreshToken,
    user: user.toSafeObject(),
  };
};

export const userSignin = async (email) => {
  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user || !user.isActive || user.isDeleted()) {
    return true;
  }

  const existingChallenge = await UserAuthChallenge.findOne({
    email,
    purpose: "signin",
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (existingChallenge) {
    throw new BadRequestError(
      "Verification code already sent. Please check your email.",
    );
  }

  const otp = generateOTP();
  const codeHash = hashToken(otp);

  await UserAuthChallenge.create({
    email,
    codeHash,
    purpose: "signin",
    expiresAt: new Date(Date.now() + SECURITY.OTP_EXPIRY_MINUTES * 60 * 1000),
  });

  await sendOTPEmail(email, otp, "signin");

  logger.info("User signin OTP sent", { email });

  return true;
};

export const userSigninVerify = async (email, code, deviceInfo) => {
  const challenge = await UserAuthChallenge.findOne({
    email,
    purpose: "signin",
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).select("+codeHash");

  if (!challenge) {
    throw new BadRequestError("Verification code expired or not found");
  }

  if (challenge.hasExceededAttempts()) {
    throw new BadRequestError("Too many attempts. Please request a new code.");
  }

  const codeHash = hashToken(code);
  if (codeHash !== challenge.codeHash) {
    challenge.attempts += 1;
    await challenge.save();
    throw new AuthenticationError("Invalid verification code");
  }

  challenge.consumedAt = new Date();
  await challenge.save();

  const user = await User.findOne({ email });
  if (!user || !user.isActive || user.isDeleted()) {
    throw new AuthenticationError("Account not found or deactivated");
  }

  const payload = {
    sub: user._id.toString(),
    userId: user._id.toString(),
    type: "user",
  };

  const { accessToken, refreshToken, refreshTokenHash } = generateTokenPair(
    payload,
    env.USER_JWT_SECRET,
    env.USER_ACCESS_TOKEN_EXPIRES_IN,
  );

  await UserSession.create({
    userId: user._id,
    refreshTokenHash,
    deviceInfo: deviceInfo || "Unknown device",
    issuedAt: new Date(),
    expiresAt: new Date(
      Date.now() + SECURITY.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    ),
  });

  logger.info("User signed in", { userId: user._id, email: user.email });

  return {
    accessToken,
    refreshToken,
    user: user.toSafeObject(),
  };
};

export const userRefresh = async (refreshToken, deviceInfo) => {
  const refreshTokenHash = hashToken(refreshToken);
  const session = await UserSession.findOne({ refreshTokenHash }).select(
    "+refreshTokenHash",
  );

  if (!session || !session.isActive()) {
    throw new AuthenticationError("Invalid refresh token");
  }

  const user = await User.findById(session.userId);

  if (!user || !user.isActive || user.isDeleted()) {
    throw new AuthenticationError("Account is deactivated");
  }

  session.revokedAt = new Date();
  await session.save();

  const payload = {
    sub: user._id.toString(),
    userId: user._id.toString(),
    type: "user",
  };

  const {
    accessToken,
    refreshToken: newRefreshToken,
    refreshTokenHash: newRefreshTokenHash,
  } = generateTokenPair(
    payload,
    env.USER_JWT_SECRET,
    env.USER_ACCESS_TOKEN_EXPIRES_IN,
  );

  const newSession = await UserSession.create({
    userId: user._id,
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
    user: user.toSafeObject(),
  };
};

export const userLogout = async (refreshToken) => {
  if (!refreshToken) {
    return true;
  }

  const refreshTokenHash = hashToken(refreshToken);
  const session = await UserSession.findOne({ refreshTokenHash });

  if (session && session.isActive()) {
    session.revokedAt = new Date();
    await session.save();
  }

  return true;
};

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user || user.isDeleted()) {
    throw new NotFoundError("User not found");
  }

  return user.toSafeObject();
};

export const updateUserProfile = async (userId, updateData) => {
  const user = await User.findById(userId);

  if (!user || user.isDeleted()) {
    throw new NotFoundError("User not found");
  }

  Object.assign(user, updateData);
  await user.save();

  logger.info("User profile updated", { userId });

  return user.toSafeObject();
};
