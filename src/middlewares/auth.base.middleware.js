import { AuthenticationError } from "../errors/AuthenticationError.js";

export const verifyAccessToken = (token, secret) => {
  try {
    const jwt = require("jsonwebtoken");
    return jwt.verify(token, secret);
  } catch (error) {
    throw new AuthenticationError("Invalid or expired access token");
  }
};

export const extractBearerToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthenticationError("Access token required");
  }
  return authHeader.split(" ")[1];
};

export const createAuthMiddleware = (secret, getUserById) => {
  return async (req, res, next) => {
    try {
      const token = extractBearerToken(req);
      const payload = verifyAccessToken(token, secret);

      const user = await getUserById(
        payload.sub || payload.id || payload.adminId,
      );

      if (!user) {
        throw new AuthenticationError("Account not found");
      }

      if (user.isActive === false) {
        throw new AuthenticationError("Account is deactivated");
      }

      req.auth = {
        ...payload,
        user,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
