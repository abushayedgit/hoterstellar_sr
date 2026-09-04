import mongoose from "mongoose";
import { baseSchemaOptions } from "../../models/base.model.js";

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    images: [
      {
        url: { type: String, required: true },
        fileId: { type: String, required: true },
        _id: false,
      },
    ],
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVegetarian: {
      type: Boolean,
      default: false,
    },
    isSpicy: {
      type: Boolean,
      default: false,
    },
    preparationTime: {
      type: Number,
      default: 15,
      min: 1,
    },
    ingredients: {
      type: [String],
      default: [],
    },
    nutritionalInfo: {
      calories: { type: Number, default: null },
      protein: { type: Number, default: null },
      carbs: { type: Number, default: null },
      fat: { type: Number, default: null },
      _id: false,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    tags: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  baseSchemaOptions,
);

foodSchema.index({ category: 1, isAvailable: 1 });
foodSchema.index({
  name: "text",
  description: "text",
  ingredients: "text",
  tags: "text",
});

foodSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

export const Food = mongoose.model("Food", foodSchema);
