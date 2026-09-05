import mongoose from "mongoose";
import { baseSchemaOptions } from "../../models/base.model.js";

const cartItemSchema = new mongoose.Schema(
  {
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    specialInstructions: {
      type: String,
      default: "",
      maxlength: 500,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  baseSchemaOptions,
);

cartSchema.index({ userId: 1 }, { unique: true });

cartSchema.methods.recalculateTotals = function () {
  this.subtotal = this.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  this.discountTotal = this.items.reduce(
    (sum, item) => sum + (item.unitPrice * item.quantity * item.discount) / 100,
    0,
  );
  this.totalAmount = this.subtotal - this.discountTotal;
  this.updatedAt = new Date();
};

export const Cart = mongoose.model("Cart", cartSchema);
