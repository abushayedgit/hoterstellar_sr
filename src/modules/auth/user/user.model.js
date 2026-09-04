import mongoose from "mongoose";
import { baseSchemaOptions } from "../../../models/base.model.js";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    district: {
      type: String,
      trim: true,
      default: "",
    },
    area: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
      default: "",
    },
    age: {
      type: Number,
      min: 0,
      max: 150,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  baseSchemaOptions,
);

userSchema.index({ joinedAt: -1 });
userSchema.index({ phone: 1 });

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

userSchema.methods.isDeleted = function () {
  return this.deletedAt !== null;
};

export const User = mongoose.model("User", userSchema);
