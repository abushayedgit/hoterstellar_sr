import mongoose from "mongoose";
import { baseSchemaOptions } from "../../models/base.model.js";

const visitorSchema = new mongoose.Schema(
  {
    guestId: {
      type: String,
      required: true,
      index: true,
    },
    ip: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    region: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    postalCode: {
      type: String,
      default: "",
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    device: {
      type: String,
      default: "",
    },
    browser: {
      type: String,
      default: "",
    },
    consentStatus: {
      type: String,
      enum: ["accepted", "declined", "pending"],
      default: "pending",
      index: true,
    },
  },
  baseSchemaOptions,
);

visitorSchema.index({ guestId: 1, createdAt: -1 });
visitorSchema.index({ createdAt: -1 });

export const Visitor = mongoose.model("Visitor", visitorSchema);
