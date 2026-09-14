import mongoose from 'mongoose';
import { baseSchemaOptions } from '../../../models/base.model.js';

const adminPasswordResetSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    requestedIp: {
      type: String,
      default: '',
    },
    requestedUserAgent: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL auto-cleanup
    },
    usedAt: {
      type: Date,
      default: null,
    },
    invalidatedAt: {
      type: Date,
      default: null,
    },
  },
  baseSchemaOptions,
);

adminPasswordResetSchema.index({ adminId: 1, usedAt: 1 });

adminPasswordResetSchema.methods.isValid = function () {
  return !this.usedAt && !this.invalidatedAt && this.expiresAt > new Date();
};

export const AdminPasswordReset = mongoose.model(
  'AdminPasswordReset',
  adminPasswordResetSchema,
);
