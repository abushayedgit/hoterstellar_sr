import { Redis } from "@upstash/redis";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let redisClient = null;
let redisReady = false;

export const connectRedis = async () => {
  if (redisReady) {
    return true;
  }

  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    logger.warn("Upstash Redis credentials not set");
    redisReady = false;
    return false;
  }

  try {
    redisClient = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });

    await redisClient.ping();
    redisReady = true;
    logger.info("Upstash Redis connected");
    return true;
  } catch (error) {
    logger.warn("Upstash Redis connection failed", { error: error.message });
    redisReady = false;
    return false;
  }
};

export const isRedisReady = () => {
  return redisReady;
};

export const getRedis = () => {
  if (!redisReady || !redisClient) {
    return null;
  }
  return redisClient;
};

export const checkRedis = async () => {
  if (!redisClient) {
    return false;
  }
  try {
    await redisClient.ping();
    redisReady = true;
    return true;
  } catch (error) {
    redisReady = false;
    return false;
  }
};
