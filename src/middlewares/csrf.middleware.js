import crypto from "crypto";
import { BadRequestError } from "../errors/BadRequestError.js";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

export const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const csrfProtection = (req, res, next) => {
  // Only for POST, PUT, PATCH, DELETE methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] || req.body._csrf;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new BadRequestError("CSRF token validation failed"));
  }

  next();
};

export const setCsrfCookie = (req, res, next) => {
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    const token = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  }
  next();
};
