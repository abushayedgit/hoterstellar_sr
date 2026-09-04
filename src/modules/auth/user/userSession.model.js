import mongoose from "mongoose";
import { baseSchemaOptions } from "../../../models/base.model.js";
import { SECURITY } from "../../../constants/security.js";

const userSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      select: false,
    },
    deviceInfo: {
      type: String,
      default: "",
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    replacedBySessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserSession",
      default: null,
    },
  },
  baseSchemaOptions,
);

userSessionSchema.index({ userId: 1, revokedAt: 1 });

userSessionSchema.methods.isActive = function () {
  return !this.revokedAt && this.expiresAt > new Date();
};

export const UserSession = mongoose.model("UserSession", userSessionSchema);
