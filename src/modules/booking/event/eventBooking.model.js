import mongoose from "mongoose";
import { baseSchemaOptions } from "../../../models/base.model.js";

const eventBookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, required: true, unique: true, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    eventType: {
      type: String,
      enum: [
        "wedding",
        "corporate",
        "birthday",
        "anniversary",
        "conference",
        "other",
      ],
      required: true,
    },
    eventDate: { type: Date, required: true, index: true },
    guestCount: { type: Number, required: true, min: 1, max: 500 },
    eventDetails: { type: String, default: "", maxlength: 2000 },
    specialRequirements: { type: String, default: "", maxlength: 2000 },
    budgetRange: {
      type: String,
      enum: ["economy", "standard", "premium", "luxury", ""],
      default: "",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "under_review",
        "quotation_sent",
        "confirmed",
        "deposit_paid",
        "completed",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },
    quotationAmount: { type: Number, default: null, min: 0 },
    depositAmount: { type: Number, default: null, min: 0 },
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "pending",
            "under_review",
            "quotation_sent",
            "confirmed",
            "deposit_paid",
            "completed",
            "cancelled",
          ],
          required: true,
        },
        at: { type: Date, default: Date.now },
        byAdminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
          default: null,
        },
        note: { type: String, default: "" },
      },
    ],
  },
  baseSchemaOptions,
);

eventBookingSchema.index({ eventDate: 1 });
eventBookingSchema.index({ status: 1, eventDate: 1 });
eventBookingSchema.index({ userId: 1, createdAt: -1 });
eventBookingSchema.index({ bookingNumber: 1 });

export const EventBooking = mongoose.model("EventBooking", eventBookingSchema);
