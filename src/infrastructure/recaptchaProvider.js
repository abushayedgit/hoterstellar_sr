import axios from "axios";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export const verifyRecaptcha = async (token, ip = "") => {
  if (!env.RECAPTCHA_SECRET_KEY) {
    logger.warn("RECAPTCHA_SECRET_KEY not configured, skipping verification");
    return true; // Allow in development if not configured
  }

  try {
    const response = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: env.RECAPTCHA_SECRET_KEY,
          response: token,
          remoteip: ip || undefined,
        },
        timeout: 5000,
      },
    );

    return response.data.success === true;
  } catch (error) {
    logger.error("reCAPTCHA verification failed", { error: error.message });
    return false;
  }
};
