import mongoose from "mongoose";
import { baseSchemaOptions } from "../../models/base.model.js";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["food", "table", "event"],
      required: true,
    },
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      default: null,
    },
    tableBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TableBooking",
      default: null,
    },
    eventBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventBooking",
      default: null,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      enum: ["food", "service", "ambiance", "overall", "event"],
      default: "overall",
    },
    isApproved: {
      type: Boolean,
      default: true,
      index: true,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    adminResponse: {
      response: {
        type: String,
        default: "",
      },
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        default: null,
      },
      respondedAt: {
        type: Date,
        default: null,
      },
    },
  },
  baseSchemaOptions,
);

// Unique indexes for one review per user per item
reviewSchema.index(
  { userId: 1, food: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "food", food: { $ne: null } },
  },
);

// For table reviews: unique only when tableBooking is provided (non-null)
reviewSchema.index(
  { userId: 1, tableBooking: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "table", tableBooking: { $ne: null } },
  },
);

// For event reviews: unique only when eventBooking is provided (non-null)
reviewSchema.index(
  { userId: 1, eventBooking: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "event", eventBooking: { $ne: null } },
  },
);

// Query indexes
reviewSchema.index({ food: 1, isApproved: 1, createdAt: -1 });
reviewSchema.index({ tableBooking: 1, isApproved: 1 });
reviewSchema.index({ eventBooking: 1, isApproved: 1 });
reviewSchema.index({ userId: 1, createdAt: -1 });

export const Review = mongoose.model("Review", reviewSchema);
