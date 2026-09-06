import { getRedis, isRedisReady } from "../config/redis.js";
import { logger } from "./logger.js";

export const getCache = async (key) => {
  try {
    if (!isRedisReady()) {
      return null;
    }
    const redis = getRedis();
    if (!redis) return null;

    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    logger.warn(`Cache get error for key ${key}: ${error.message}`);
    return null;
  }
};

export const setCache = async (key, data, ttlSeconds) => {
  try {
    if (!isRedisReady()) {
      return;
    }
    const redis = getRedis();
    if (!redis) return;

    await redis.set(key, JSON.stringify(data), { ex: ttlSeconds });
  } catch (error) {
    logger.warn(`Cache set error for key ${key}: ${error.message}`);
  }
};

export const deleteCache = async (key) => {
  try {
    if (!isRedisReady()) {
      return;
    }
    const redis = getRedis();
    if (!redis) return;

    await redis.del(key);
  } catch (error) {
    logger.warn(`Cache delete error for key ${key}: ${error.message}`);
  }
};
