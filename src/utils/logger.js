import pino from "pino";
import chalk from "chalk";
import { env } from "../config/env.js";

const loggerConfig = {
  level: env.NODE_ENV === "development" ? "debug" : "info",
  redact: {
    paths: [
      "password",
      "accessToken",
      "refreshToken",
      "otp",
      "token",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "***",
  },
};

const pinoLogger = pino(
  env.NODE_ENV === "development"
    ? {
        ...loggerConfig,
        transport: { target: "pino-pretty", options: { colorize: true } },
      }
    : loggerConfig,
);

export const logger = {
  info: (message, ...args) => {
    if (typeof message === "string") {
      pinoLogger.info(message, ...args);
    } else {
      pinoLogger.info(message);
    }
  },
  warn: (message, ...args) => {
    if (typeof message === "string") {
      pinoLogger.warn(message, ...args);
    } else {
      pinoLogger.warn(message);
    }
  },
  error: (message, ...args) => {
    if (typeof message === "string") {
      pinoLogger.error(message, ...args);
    } else {
      pinoLogger.error(message);
    }
  },
  debug: (message, ...args) => {
    if (typeof message === "string") {
      pinoLogger.debug(message, ...args);
    } else {
      pinoLogger.debug(message);
    }
  },
};

export { chalk };
