import rateLimit from "express-rate-limit";
import { RateLimitError } from "../errors/RateLimitError.js";

export const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = "Too many requests, please try again later",
    standardHeaders = true,
    legacyHeaders = false,
  } = options;

  return rateLimit({
    windowMs,
    max,
    standardHeaders,
    legacyHeaders,
    handler: (req, res) => {
      throw new RateLimitError(message);
    },
  });
};

export const globalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: "Global rate limit exceeded",
});

export const authRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: "Too many authentication attempts",
});

export const mutationRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: "Too many requests, please slow down",
});
