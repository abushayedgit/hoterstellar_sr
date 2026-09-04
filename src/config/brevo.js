import axios from "axios";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let brevoConfigured = false;

export const isBrevoConfigured = () => {
  return brevoConfigured;
};

export const verifyBrevoOnStartup = async () => {
  if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
    logger.warn("Brevo not configured - email features disabled");
    brevoConfigured = false;
    return false;
  }

  try {
    const response = await axios.get("https://api.brevo.com/v3/account", {
      headers: {
        "api-key": env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 5000,
    });

    if (response.status === 200) {
      logger.info("Brevo email service verified");
      brevoConfigured = true;
      return true;
    }
  } catch (error) {
    logger.warn("Brevo verification failed", { error: error.message });
    brevoConfigured = false;
    return false;
  }

  brevoConfigured = false;
  return false;
};

export const getBrevoClient = () => {
  if (!brevoConfigured) {
    return null;
  }

  return {
    sendEmail: async ({ to, subject, html, text }) => {
      try {
        const response = await axios.post(
          "https://api.brevo.com/v3/smtp/email",
          {
            sender: {
              email: env.BREVO_SENDER_EMAIL,
              name: env.BREVO_SENDER_NAME || "Hoterstellar",
            },
            to: [{ email: to }],
            subject,
            htmlContent: html,
            textContent: text || "",
          },
          {
            headers: {
              "api-key": env.BREVO_API_KEY,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          },
        );
        return response.data;
      } catch (error) {
        logger.error("Brevo email send failed", { error: error.message });
        throw error;
      }
    },
  };
};
