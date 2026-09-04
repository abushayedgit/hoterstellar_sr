import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { baseSchemaOptions } from "../../../models/base.model.js";
import { SECURITY } from "../../../constants/security.js";

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "admin", "manager"],
      default: "admin",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  baseSchemaOptions,
);

adminSchema.index({ role: 1, isActive: 1 });

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return;

  try {
    const salt = await bcrypt.genSalt(SECURITY.BCRYPT_SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    return;
  } catch (error) {
    throw new Error("Error hashing password");
  }
});

adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

adminSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

export const Admin = mongoose.model("Admin", adminSchema);
