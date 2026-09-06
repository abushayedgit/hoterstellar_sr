import mongoose from "mongoose";
import { baseSchemaOptions } from "../../models/base.model.js";

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    message: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    ip: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    referrer: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["new", "read", "responded", "archived"],
      default: "new",
      index: true,
    },
    isSpam: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  baseSchemaOptions,
);

contactSchema.index({ createdAt: -1 });
contactSchema.index({ email: 1, createdAt: -1 });
contactSchema.index({ status: 1, createdAt: -1 });

export const Contact = mongoose.model("Contact", contactSchema);
