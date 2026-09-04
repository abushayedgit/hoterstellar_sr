import mongoose from "mongoose";
import { baseSchemaOptions } from "../../../models/base.model.js";
import { SECURITY } from "../../../constants/security.js";

const userAuthChallengeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    codeHash: {
      type: String,
      required: true,
      select: false,
    },
    purpose: {
      type: String,
      enum: ["signup", "signin"],
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: SECURITY.OTP_MAX_ATTEMPTS,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    consumedAt: {
      type: Date,
      default: null,
    },
    pendingUserData: {
      type: Object,
      default: null,
    },
  },
  baseSchemaOptions,
);

userAuthChallengeSchema.index({ email: 1, purpose: 1 });

userAuthChallengeSchema.methods.isValid = function () {
  return (
    !this.consumedAt &&
    this.attempts < SECURITY.OTP_MAX_ATTEMPTS &&
    this.expiresAt > new Date()
  );
};

userAuthChallengeSchema.methods.isExpired = function () {
  return this.expiresAt <= new Date();
};

userAuthChallengeSchema.methods.hasExceededAttempts = function () {
  return this.attempts >= SECURITY.OTP_MAX_ATTEMPTS;
};

export const UserAuthChallenge = mongoose.model(
  "UserAuthChallenge",
  userAuthChallengeSchema,
);
