import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      try {
        const userPayload = jwt.verify(token, env.USER_JWT_SECRET);
        req.auth = { ...userPayload, type: "user" };
      } catch (userError) {
        try {
          const adminPayload = jwt.verify(token, env.ADMIN_JWT_SECRET);
          req.auth = { ...adminPayload, type: "admin" };
        } catch (adminError) {
          // Invalid token, continue as guest
        }
      }
    }
  } catch (error) {
    // Continue as guest
  }

  next();
};
