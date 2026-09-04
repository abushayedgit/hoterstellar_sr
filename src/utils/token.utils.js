import crypto from "crypto";
import jwt from "jsonwebtoken";

export const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const generateAccessToken = (payload, secret, expiresIn) => {
  return jwt.sign(payload, secret, { expiresIn });
};

export const generateTokenPair = (payload, secret, accessExpiresIn = "15m") => {
  const accessToken = generateAccessToken(payload, secret, accessExpiresIn);
  const refreshToken = generateRandomToken(48);
  const refreshTokenHash = hashToken(refreshToken);

  return {
    accessToken,
    refreshToken,
    refreshTokenHash,
  };
};

export const verifyAccessToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error("Invalid or expired access token");
  }
};
