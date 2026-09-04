import mongoose from "mongoose";
import { BadRequestError } from "../errors/BadRequestError.js";

export const validateObjectId = (id, fieldName = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError(`Invalid ${fieldName}`);
  }
  return id;
};

export const toObjectId = (id) => new mongoose.Types.ObjectId(id);
