import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let queues = {};
let workers = {};
let sharedConnection = null;
let connectionReadyPromise = null;

export const QUEUE_NAMES = {
  EMAIL: "email",
  ANALYTICS_ROLLUP: "analyticsRollup",
  MEDIA_CLEANUP: "mediaCleanup",
};

/**
 * Wait for BullMQ Redis connection to be ready
 */
const waitForConnection = async () => {
  if (!sharedConnection) {
    return false;
  }

  if (sharedConnection.status === "ready") {
    return true;
  }

  if (
    sharedConnection.status === "connecting" ||
    sharedConnection.status === "connect"
  ) {
    try {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Redis connection timeout"));
        }, 10000);

        sharedConnection.once("ready", () => {
          clearTimeout(timeout);
          resolve();
        });

        sharedConnection.once("error", (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      return true;
    } catch (error) {
      logger.error(`Failed to wait for Redis connection: ${error.message}`);
      return false;
    }
  }

  return false;
};

/**
 * Get or create a SINGLE shared native Redis connection for BullMQ
 */
const getSharedConnection = () => {
  if (sharedConnection && sharedConnection.status === "ready") {
    return sharedConnection;
  }

  if (!env.UPSTASH_REDIS_NATIVE_URL) {
    logger.warn(
      "UPSTASH_REDIS_NATIVE_URL not set. BullMQ requires native Redis connection.",
    );
    return null;
  }

  if (!sharedConnection) {
    try {
      sharedConnection = new Redis(env.UPSTASH_REDIS_NATIVE_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        connectTimeout: 10000,
        lazyConnect: false,
        retryStrategy(times) {
          if (times > 3) {
            logger.warn("BullMQ Redis giving up after 3 retries");
            return null;
          }
          const delay = Math.min(times * 2000, 6000);
          logger.warn(`BullMQ Redis retry ${times} in ${delay}ms`);
          return delay;
        },
      });

      sharedConnection.on("connect", () => {
        logger.info("BullMQ Redis connected");
      });

      sharedConnection.on("ready", () => {
        logger.info("BullMQ Redis ready for operations");
      });

      sharedConnection.on("error", (error) => {
        logger.error(`BullMQ Redis error: ${error.message}`);
      });

      sharedConnection.on("close", () => {
        logger.warn("BullMQ Redis connection closed");
        sharedConnection = null;
      });
    } catch (error) {
      logger.error(
        `Failed to create BullMQ Redis connection: ${error.message}`,
      );
      return null;
    }
  }

  return sharedConnection;
};

export const getQueue = async (queueName) => {
  const connection = getSharedConnection();

  if (!connection) {
    logger.warn(`BullMQ Redis not available, queue ${queueName} unavailable`);
    return null;
  }

  // Wait for connection to be ready
  const isReady = await waitForConnection();
  if (!isReady) {
    logger.warn(`BullMQ Redis not ready, queue ${queueName} unavailable`);
    return null;
  }

  if (!queues[queueName]) {
    try {
      queues[queueName] = new Queue(queueName, {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: 50,
          removeOnFail: 200,
        },
      });
      logger.info(`✓ Queue initialized: ${queueName}`);
    } catch (error) {
      logger.error(`Failed to initialize queue ${queueName}: ${error.message}`);
      return null;
    }
  }

  return queues[queueName];
};

export const getWorker = async (queueName, processor, concurrency = 3) => {
  const connection = getSharedConnection();

  if (!connection) {
    logger.warn(`BullMQ Redis not available, worker ${queueName} unavailable`);
    return null;
  }

  // Wait for connection to be ready
  const isReady = await waitForConnection();
  if (!isReady) {
    logger.warn(`BullMQ Redis not ready, worker ${queueName} unavailable`);
    return null;
  }

  if (!workers[queueName]) {
    try {
      workers[queueName] = new Worker(queueName, processor, {
        connection,
        concurrency,
      });

      workers[queueName].on("completed", (job) => {
        logger.info(`✓ Job completed: ${queueName}:${job.id}`);
      });

      workers[queueName].on("failed", (job, error) => {
        logger.error(
          `✗ Job failed: ${queueName}:${job?.id} - ${error.message}`,
        );
      });

      workers[queueName].on("error", (error) => {
        logger.error(`✗ Worker error: ${queueName} - ${error.message}`);
      });

      logger.info(`✓ Worker initialized: ${queueName}`);
    } catch (error) {
      logger.error(
        `Failed to initialize worker ${queueName}: ${error.message}`,
      );
      return null;
    }
  }

  return workers[queueName];
};

export const enqueueJob = async (queueName, jobName, data, options = {}) => {
  const queue = await getQueue(queueName);

  if (!queue) {
    logger.warn(`Queue ${queueName} not available`);
    return null;
  }

  try {
    const job = await queue.add(jobName, data, options);
    logger.info(`✓ Job enqueued: ${queueName}:${job.id}`);
    return job;
  } catch (error) {
    logger.error(`Failed to enqueue job: ${error.message}`);
    return null;
  }
};

export const closeAllQueues = async () => {
  for (const queueName of Object.keys(queues)) {
    try {
      await queues[queueName].close();
      logger.info(`Queue closed: ${queueName}`);
    } catch (error) {
      logger.warn(`Failed to close queue ${queueName}`);
    }
  }
  queues = {};
};

export const closeAllWorkers = async () => {
  for (const workerName of Object.keys(workers)) {
    try {
      await workers[workerName].close();
      logger.info(`Worker closed: ${workerName}`);
    } catch (error) {
      logger.warn(`Failed to close worker ${workerName}`);
    }
  }
  workers = {};
};

export const closeBullMQConnection = async () => {
  if (sharedConnection) {
    try {
      await sharedConnection.quit();
      logger.info("BullMQ Redis connection closed");
    } catch (error) {
      logger.warn("Failed to close BullMQ Redis connection");
    }
    sharedConnection = null;
  }
};
