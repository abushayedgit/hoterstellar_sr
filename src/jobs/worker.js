import {
  getWorker,
  QUEUE_NAMES,
  closeAllQueues,
  closeAllWorkers,
} from "./src/config/queue.js";
import { connectDB, disconnectDatabase } from "./src/config/database.js";
import { connectRedis } from "./src/config/redis.js";
import { emailProcessor } from "./src/jobs/email/email.worker.js";
import { analyticsRollupProcessor } from "./src/jobs/analytics/analyticsRollup.worker.js";
import { mediaCleanupProcessor } from "./src/jobs/media/mediaCleanup.worker.js";
import { logger, chalk } from "./src/utils/logger.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const startWorker = async () => {
  try {
    console.log("");
    console.log(chalk.hex("#6366f1")("═".repeat(65)));
    console.log("");
    console.log(
      chalk.hex("#8b5cf6").bold("   Hoterstellar — Background Worker"),
    );
    console.log("");
    console.log(chalk.hex("#6366f1")("═".repeat(65)));
    console.log("");

    // Connect to MongoDB
    logger.info(chalk.cyan("▶ Connecting to MongoDB..."));
    await connectDB();
    logger.info(chalk.green("  ✓ MongoDB connected"));

    // Connect to Redis
    logger.info(chalk.cyan("▶ Connecting to Redis..."));
    await connectRedis();
    logger.info(chalk.green("  ✓ Redis connected"));

    // Initialize workers
    logger.info(chalk.cyan("▶ Starting workers..."));

    const emailWorker = getWorker(QUEUE_NAMES.EMAIL, emailProcessor, 10);
    const analyticsWorker = getWorker(
      QUEUE_NAMES.ANALYTICS_ROLLUP,
      analyticsRollupProcessor,
      2,
    );
    const mediaWorker = getWorker(
      QUEUE_NAMES.MEDIA_CLEANUP,
      mediaCleanupProcessor,
      5,
    );

    if (emailWorker) logger.info(chalk.green("  ✓ Email worker started"));
    if (analyticsWorker)
      logger.info(chalk.green("  ✓ Analytics worker started"));
    if (mediaWorker)
      logger.info(chalk.green("  ✓ Media cleanup worker started"));

    console.log("");
    logger.info(chalk.green.bold("  ✓ Worker process ready"));
    console.log("");

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(
        chalk.yellow(`\n  ${signal} received. Shutting down worker...`),
      );

      const forceExit = setTimeout(() => {
        logger.error(chalk.red("  ✗ Forced shutdown after timeout"));
        process.exit(1);
      }, SHUTDOWN_TIMEOUT_MS);
      forceExit.unref();

      try {
        await closeAllWorkers();
        await closeAllQueues();
        await disconnectDatabase();

        logger.info(chalk.green("  ✓ Worker shutdown complete"));
        process.exit(0);
      } catch (error) {
        logger.error(chalk.red("  ✗ Error during shutdown"), {
          error: error.message,
        });
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error(chalk.red("  ✗ Worker failed to start"), {
      error: error.message,
    });
    process.exit(1);
  }
};

startWorker();
