import {
  getWorker,
  QUEUE_NAMES,
  closeAllQueues,
  closeAllWorkers,
  closeBullMQConnection,
} from "./src/config/queue.js";
import { connectDB, disconnectDatabase } from "./src/config/database.js";
import { connectRedis } from "./src/config/redis.js";
import { emailProcessor } from "./src/jobs/email/email.worker.js";
import { analyticsRollupProcessor } from "./src/jobs/analytics/analyticsRollup.worker.js";
import { mediaCleanupProcessor } from "./src/jobs/media/mediaCleanup.worker.js";
import { logger, chalk } from "./src/utils/logger.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;
let isShuttingDown = false;

const printDivider = () => {
  console.log(chalk.hex("#334155")("─".repeat(65)));
};

const printStep = (step, total, label, status, details) => {
  const icon =
    status === "pass"
      ? chalk.green(" ✓")
      : status === "fail"
        ? chalk.red(" ✗")
        : status === "warn"
          ? chalk.yellow(" ⚠")
          : chalk.cyan(" ⓘ");

  const stepLabel = `[${String(step).padStart(2, "0")}/${total}]`;
  console.log(
    `  ${chalk.hex("#6366f1")(stepLabel)}${icon}  ${chalk.hex("#e2e8f0")(label)}`,
  );
  if (details) {
    console.log(`       ${chalk.hex("#64748b")(details)}`);
  }
};

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

    const totalSteps = 4;
    let currentStep = 0;

    // Step 1: Connect to MongoDB
    currentStep++;
    printStep(currentStep, totalSteps, "Connecting to MongoDB...", "info");
    await connectDB();
    printStep(currentStep, totalSteps, "MongoDB connected", "pass");
    printDivider();

    // Step 2: Connect to Redis REST
    currentStep++;
    printStep(currentStep, totalSteps, "Connecting to Redis REST...", "info");
    await connectRedis();
    printStep(currentStep, totalSteps, "Redis REST connected", "pass");
    printDivider();

    // Step 3: Start workers (await each one)
    currentStep++;
    printStep(currentStep, totalSteps, "Starting workers...", "info");

    const emailWorker = await getWorker(QUEUE_NAMES.EMAIL, emailProcessor, 5);
    const analyticsWorker = await getWorker(
      QUEUE_NAMES.ANALYTICS_ROLLUP,
      analyticsRollupProcessor,
      2,
    );
    const mediaWorker = await getWorker(
      QUEUE_NAMES.MEDIA_CLEANUP,
      mediaCleanupProcessor,
      3,
    );

    if (emailWorker) console.log(chalk.green("  ✓ Email worker started"));
    if (analyticsWorker)
      console.log(chalk.green("  ✓ Analytics worker started"));
    if (mediaWorker)
      console.log(chalk.green("  ✓ Media cleanup worker started"));
    printDivider();

    // Step 4: Ready
    currentStep++;
    printStep(currentStep, totalSteps, "Worker process ready", "pass");
    console.log("");
    console.log(
      chalk.hex("#64748b")(
        `  Press ${chalk.hex("#e2e8f0")("CTRL+C")} to stop the worker`,
      ),
    );
    console.log("");

    // Graceful shutdown
    const shutdown = async (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log("");
      printDivider();
      console.log(
        chalk.yellow.bold(`  ${signal} received — Shutting down worker...`),
      );
      console.log("");

      const forceExit = setTimeout(() => {
        console.log(chalk.red("  ✗ Forced shutdown after timeout"));
        process.exit(1);
      }, SHUTDOWN_TIMEOUT_MS);
      forceExit.unref();

      try {
        await closeAllWorkers();
        await closeAllQueues();
        await closeBullMQConnection();
        await disconnectDatabase();

        console.log("");
        console.log(chalk.green.bold("  ✓ Worker shutdown complete"));
        console.log("");
        printDivider();
        process.exit(0);
      } catch (error) {
        console.log(chalk.red(`  ✗ Error during shutdown: ${error.message}`));
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("unhandledRejection", (reason) => {
      console.log(
        chalk.red(
          `Unhandled Rejection: ${reason instanceof Error ? reason.message : String(reason)}`,
        ),
      );
    });

    process.on("uncaughtException", (error) => {
      console.log(chalk.red(`Uncaught Exception: ${error.message}`));
      shutdown("uncaughtException");
    });
  } catch (error) {
    console.log(chalk.red(`  ✗ Worker failed to start: ${error.message}`));
    process.exit(1);
  }
};

startWorker();
