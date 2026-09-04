import { createApp } from "./app.js";
import { connectDatabase } from "../config/database.js";
import { checkRedis } from "../config/redis.js";
import logger from "../utils/logger.js";

export async function bootstrap() {
  try {
    await connectDatabase();
    logger.info("MongoDB connected");

    const redisOk = await checkRedis();

    if (redisOk) {
      logger.info("Upstash Redis connected");
    } else {
      logger.warn("Upstash Redis unavailable - caching features disabled");
    }

    const app = createApp();
    return app;
  } catch (error) {
    logger.error("Bootstrap failed", error);
    throw error;
  }
}
