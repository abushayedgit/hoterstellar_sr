import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export function errorHandlerMiddleware(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let code = err.code || "INTERNAL_ERROR";
  let message = err.message || "Internal server error";
  let details = err.details || null;

  // Handle mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "Validation failed";
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 400;
    code = "INVALID_ID";
    message = "Invalid identifier format";
  } else if (err.code === 11000) {
    statusCode = 409;
    code = "DUPLICATE_KEY";
    message = "A record with that value already exists";
    const field = Object.keys(err.keyPattern)[0];
    details = { field, message: `${field} already exists` };
  }

  // Log errors appropriately
  if (statusCode >= 500) {
    logger.error(
      {
        requestId: req.requestId,
        error: err.message,
        stack: err.stack,
        isOperational: err.isOperational,
      },
      "Server error",
    );
  } else if (statusCode === 429) {
    logger.warn(
      {
        requestId: req.requestId,
        ip: req.ip,
        url: req.originalUrl,
      },
      "Rate limit exceeded",
    );
  }

  return res.status(statusCode).json({
    success: false,
    statusCode,
    code,
    message,
    ...(details && { details }),
    ...(env.NODE_ENV === "development" &&
      statusCode >= 500 && { stack: err.stack }),
  });
}
