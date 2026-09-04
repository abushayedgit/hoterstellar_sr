import mongoose from "mongoose";
import { BadRequestError } from "../errors/BadRequestError.js";

/**
 * Validates that a route parameter is a valid MongoDB ObjectId
 * @param {string} paramName - Name of the route parameter
 * @returns {Function} Express middleware
 */
export const validateObjectIdParam = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new BadRequestError(`Invalid ${paramName} format`));
    }
    next();
  };
};

/**
 * Validates ObjectId in request body or query
 * @param {string} fieldName - Name of the field to validate
 * @returns {Function} Express middleware
 */
export const validateObjectIdField = (fieldName) => {
  return (req, res, next) => {
    const value = req.body?.[fieldName] || req.query?.[fieldName];
    if (value && !mongoose.Types.ObjectId.isValid(value)) {
      return next(new BadRequestError(`Invalid ${fieldName} format`));
    }
    next();
  };
};
