import { Queue, Worker } from "bullmq";
import { isRedisReady } from "./redis.js";
import { logger } from "../utils/logger.js";

let queues = {};
let workers = {};

export const QUEUE_NAMES = {
  EMAIL: "email",
  ANALYTICS_ROLLUP: "analyticsRollup",
  MEDIA_CLEANUP: "mediaCleanup",
};

export const getQueue = (queueName) => {
  if (!isRedisReady()) {
    logger.warn(`Redis not ready, queue ${queueName} unavailable`);
    return null;
  }

  if (!queues[queueName]) {
    try {
      queues[queueName] = new Queue(queueName, {
        connection: {
          url:
            process.env.UPSTASH_REDIS_NATIVE_URL ||
            process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        },
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: "exponential",
            delay: 10000,
          },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      });
      logger.info(`Queue initialized: ${queueName}`);
    } catch (error) {
      logger.error(`Failed to initialize queue ${queueName}`, {
        error: error.message,
      });
      return null;
    }
  }

  return queues[queueName];
};

export const getWorker = (queueName, processor, concurrency = 5) => {
  if (!isRedisReady()) {
    logger.warn(`Redis not ready, worker ${queueName} unavailable`);
    return null;
  }

  if (!workers[queueName]) {
    try {
      workers[queueName] = new Worker(queueName, processor, {
        connection: {
          url:
            process.env.UPSTASH_REDIS_NATIVE_URL ||
            process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        },
        concurrency,
      });

      workers[queueName].on("completed", (job) => {
        logger.info(`Job completed: ${queueName}:${job.id}`);
      });

      workers[queueName].on("failed", (job, error) => {
        logger.error(`Job failed: ${queueName}:${job?.id}`, {
          error: error.message,
        });
      });

      logger.info(`Worker initialized: ${queueName}`);
    } catch (error) {
      logger.error(`Failed to initialize worker ${queueName}`, {
        error: error.message,
      });
      return null;
    }
  }

  return workers[queueName];
};

export const enqueueJob = async (queueName, jobName, data, options = {}) => {
  const queue = getQueue(queueName);

  if (!queue) {
    logger.warn(`Queue ${queueName} not available, job not enqueued`);
    return null;
  }

  try {
    const job = await queue.add(jobName, data, options);
    logger.info(`Job enqueued: ${queueName}:${jobName}:${job.id}`);
    return job;
  } catch (error) {
    logger.error(`Failed to enqueue job ${queueName}:${jobName}`, {
      error: error.message,
    });
    return null;
  }
};

export const closeAllQueues = async () => {
  for (const queueName of Object.keys(queues)) {
    try {
      await queues[queueName].close();
      logger.info(`Queue closed: ${queueName}`);
    } catch (error) {
      logger.warn(`Failed to close queue ${queueName}`, {
        error: error.message,
      });
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
      logger.warn(`Failed to close worker ${workerName}`, {
        error: error.message,
      });
    }
  }
  workers = {};
};
