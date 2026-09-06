import mongoose from "mongoose";
import { baseSchemaOptions } from "../../models/base.model.js";

const pageTrackingSchema = new mongoose.Schema(
  {
    guestId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    ip: {
      type: String,
      default: "",
    },
    referrer: {
      type: String,
      default: "",
    },
    page: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  baseSchemaOptions,
);

pageTrackingSchema.index({ page: 1, createdAt: -1 });
pageTrackingSchema.index({ guestId: 1, createdAt: -1 });
pageTrackingSchema.index({ userId: 1, createdAt: -1 });

export const PageTracking = mongoose.model("PageTracking", pageTrackingSchema);
