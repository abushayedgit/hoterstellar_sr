import mongoose from "mongoose";
import { baseSchemaOptions } from "../../../models/base.model.js";

const tableBookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    time: {
      type: String,
      required: true,
    },
    guestCount: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
    },
    tablePreference: {
      type: String,
      enum: ["window", "outdoor", "private", "regular", ""],
      default: "",
    },
    occasion: {
      type: String,
      enum: [
        "birthday",
        "anniversary",
        "business",
        "date",
        "family",
        "other",
        "",
      ],
      default: "",
    },
    specialOccasion: {
      type: String,
      default: "",
    },
    specialRequests: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "seated",
        "completed",
        "cancelled",
        "no_show",
      ],
      default: "pending",
      index: true,
    },
    tableNumber: {
      type: String,
      default: "",
    },
    duration: {
      type: Number,
      default: 90,
      min: 30,
      max: 240,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "pending",
            "confirmed",
            "seated",
            "completed",
            "cancelled",
            "no_show",
          ],
          required: true,
        },
        at: {
          type: Date,
          default: Date.now,
        },
        byAdminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
          default: null,
        },
        note: {
          type: String,
          default: "",
        },
      },
    ],
  },
  baseSchemaOptions,
);

// Indexes for conflict detection
tableBookingSchema.index({ date: 1, time: 1 });
tableBookingSchema.index({ status: 1, date: 1 });
tableBookingSchema.index({ userId: 1, createdAt: -1 });
tableBookingSchema.index({ bookingNumber: 1 });

// Partial unique index for active bookings on same date/time
tableBookingSchema.index(
  { date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "confirmed", "seated"] },
    },
  },
);

export const TableBooking = mongoose.model("TableBooking", tableBookingSchema);
