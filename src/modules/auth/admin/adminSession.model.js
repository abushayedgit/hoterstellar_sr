import mongoose from "mongoose";
import { baseSchemaOptions } from "../../models/base.model.js";
import { SECURITY } from "../../../constants/security.js";

const adminSessionSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
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
      ref: "AdminSession",
      default: null,
    },
  },
  baseSchemaOptions,
);

adminSessionSchema.index({ adminId: 1, revokedAt: 1 });

adminSessionSchema.methods.isActive = function () {
  return !this.revokedAt && this.expiresAt > new Date();
};

export const AdminSession = mongoose.model("AdminSession", adminSessionSchema);
