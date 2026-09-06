import mongoose from "mongoose";
import { baseSchemaOptions } from "../../models/base.model.js";

const analyticsDeletionConfirmationSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    codeHash: {
      type: String,
      required: true,
      select: false,
    },
    passwordVerifiedAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
  },
  baseSchemaOptions,
);

export const AnalyticsDeletionConfirmation = mongoose.model(
  "AnalyticsDeletionConfirmation",
  analyticsDeletionConfirmationSchema,
);
