import mongoose from "mongoose";
import { baseSchemaOptions } from "./base.model.js";

const counterSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    seq: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  baseSchemaOptions,
);

counterSchema.index({ key: 1 }, { unique: true });

export const Counter = mongoose.model("Counter", counterSchema);

export const getNextSequence = async (key) => {
  const result = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  return result.seq;
};
