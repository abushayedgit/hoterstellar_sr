import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

export const seedDevData = async () => {
  if (env.NODE_ENV !== "development") {
    logger.info("Not in development, skipping dev data seed");
    return;
  }

  logger.info("Dev data seeding will be implemented in later phases");
};
