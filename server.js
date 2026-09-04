import http from "http";
import mongoose from "mongoose";
import dayjs from "dayjs";
import { connectDB } from "./src/config/database.js";
import { env } from "./src/config/env.js";
import { connectRedis, isRedisReady } from "./src/config/redis.js";
import { initializeSocket } from "./src/config/socket.js";
import { verifyBrevoOnStartup, isBrevoConfigured } from "./src/config/brevo.js";
import { logger, chalk } from "./src/utils/logger.js";
import app from "./src/app/app.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const printDivider = () => {
  console.log(chalk.hex("#334155")("─".repeat(65)));
};

const printBanner = () => {
  console.log("");
  console.log(chalk.hex("#6366f1")("═".repeat(65)));
  console.log("");
  console.log(
    chalk.hex("#8b5cf6").bold("   Hoterstellar — Backend API Server"),
  );
  console.log("");
  console.log(
    chalk.hex("#a78bfa")("   Hotel & Restaurant Management Platform"),
  );
  console.log("");
  console.log(chalk.hex("#6366f1")("═".repeat(65)));
  console.log("");
};

const printStartupHeader = () => {
  console.log("");
  console.log(chalk.hex("#06b6d4").bold("▶ Starting Server..."));
  console.log("");
  printKeyValue("Environment", env.NODE_ENV);
  printKeyValue("Port", env.PORT.toString());
  printKeyValue("Time", dayjs().format("YYYY-MM-DD HH:mm:ss Z"));
  printDivider();
};

const printKeyValue = (
  key,
  value,
  keyColor = "#94a3b8",
  valueColor = "#e2e8f0",
) => {
  console.log(
    `  ${chalk.hex(keyColor)(key.padEnd(20))} ${chalk.hex(valueColor)(value)}`,
  );
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

const getServicesHealth = () => {
  const services = [];

  const mongoState = mongoose.connection.readyState;
  services.push({
    name: "MongoDB",
    status:
      mongoState === 1
        ? "healthy"
        : mongoState === 2
          ? "degraded"
          : "unhealthy",
    details:
      mongoState === 0
        ? "Disconnected"
        : mongoState === 1
          ? "Connected"
          : mongoState === 2
            ? "Connecting..."
            : "Disconnecting...",
  });

  services.push({
    name: "Redis",
    status: isRedisReady() ? "healthy" : "degraded",
    details: isRedisReady()
      ? "Connected & ready"
      : "Not available — cache disabled",
  });

  services.push({
    name: "Brevo Email",
    status: isBrevoConfigured() ? "healthy" : "degraded",
    details: isBrevoConfigured()
      ? "Configured & verified"
      : "Not configured — email disabled",
  });

  return services;
};

const setupGracefulShutdown = (server) => {
  let isShuttingDown = false;

  const gracefulShutdown = (signal) => {
    if (isShuttingDown) {
      logger.warn("Shutdown already in progress — forcing exit...");
      process.exit(1);
    }

    isShuttingDown = true;

    console.log("");
    printDivider();
    console.log("");
    logger.info(
      chalk.yellow.bold(`  ${signal} received — Starting graceful shutdown...`),
    );
    console.log("");

    server.close(() => {
      logger.info(chalk.blue("  ✓ HTTP server closed"));
    });

    const forceExit = setTimeout(() => {
      logger.error(
        chalk.red(
          `  ✗ Could not close all connections within ${SHUTDOWN_TIMEOUT_MS / 1000}s — forcing exit`,
        ),
      );
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    void (async () => {
      try {
        if (mongoose.connection.readyState !== 0) {
          await mongoose.connection.close();
          logger.info(chalk.blue("  ✓ MongoDB connection closed"));
        } else {
          logger.info(chalk.gray("  - MongoDB already disconnected"));
        }

        logger.info(chalk.gray("  - Redis (Upstash REST) — no cleanup needed"));

        clearTimeout(forceExit);

        console.log("");
        logger.info(
          chalk.green.bold("  ✓ Graceful shutdown complete. Goodbye! 👋"),
        );
        console.log("");
        printDivider();
        console.log("");

        process.exit(0);
      } catch (err) {
        clearTimeout(forceExit);
        logger.error(
          chalk.red("  ✗ Error during shutdown:"),
          err instanceof Error ? err.message : "Unknown error",
        );
        process.exit(1);
      }
    })();
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise);
    logger.error(
      "Reason:",
      reason instanceof Error ? reason.message : String(reason),
    );
  });

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception:", error.message);
    logger.error(error.stack || "No stack trace");
    gracefulShutdown("uncaughtException");
  });
};

const startServer = async () => {
  const totalSteps = 6;
  let currentStep = 0;

  printBanner();
  printStartupHeader();

  currentStep++;
  printStep(currentStep, totalSteps, "Validating environment", "pass");
  logger.info(
    `    Node ${process.version} | ${process.platform} ${process.arch}`,
  );
  logger.info(`    Public URL: ${env.CLIENT_PUBLIC_URL}`);
  logger.info(`    Dashboard URL: ${env.CLIENT_DASHBOARD_URL}`);
  printDivider();

  currentStep++;
  printStep(currentStep, totalSteps, "Connecting to MongoDB...", "info");
  try {
    await connectDB();
    printStep(currentStep, totalSteps, "MongoDB connected", "pass");
    const dbName = mongoose.connection.db?.databaseName || "unknown";
    const host = mongoose.connection.host || "unknown";
    logger.info(`    Database: ${dbName} @ ${host}`);
  } catch (error) {
    printStep(currentStep, totalSteps, "MongoDB connection failed", "fail");
    logger.error(
      `    ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    console.log("");
    logger.error("  ✗ Cannot start without MongoDB. Exiting.");
    process.exit(1);
  }
  printDivider();

  currentStep++;
  printStep(currentStep, totalSteps, "Checking email configuration...", "info");
  let emailReady = false;
  try {
    emailReady = await verifyBrevoOnStartup();
  } catch (error) {
    logger.warn(
      `  Email verification threw an error: ${error instanceof Error ? error.message : "Unknown"}`,
    );
  }

  if (emailReady) {
    printStep(currentStep, totalSteps, "Email service ready", "pass");
  } else {
    printStep(
      currentStep,
      totalSteps,
      "Email service not configured",
      "warn",
      "Transactional emails will be disabled",
    );
  }
  printDivider();

  currentStep++;
  printStep(currentStep, totalSteps, "Connecting to Redis...", "info");
  try {
    await connectRedis();
    if (isRedisReady()) {
      printStep(currentStep, totalSteps, "Redis connected", "pass");
      logger.info(
        `    URL: ${env.UPSTASH_REDIS_REST_URL.replace(/\/\/.*@/, "//***@")}`,
      );
    } else {
      printStep(
        currentStep,
        totalSteps,
        "Redis unavailable",
        "warn",
        "Continuing without cache — rate limiting in memory",
      );
    }
  } catch {
    printStep(
      currentStep,
      totalSteps,
      "Redis unavailable",
      "warn",
      "Continuing without cache — rate limiting in memory",
    );
  }
  printDivider();

  currentStep++;
  printStep(currentStep, totalSteps, "Initializing WebSocket...", "info");
  const server = http.createServer(app);
  initializeSocket(server);
  printStep(currentStep, totalSteps, "WebSocket ready", "pass");
  logger.info("    Socket.IO attached to HTTP server");
  printDivider();

  currentStep++;
  printStep(currentStep, totalSteps, "Starting HTTP server...", "info");

  server.listen(env.PORT, () => {
    printStep(
      currentStep,
      totalSteps,
      `Server listening on port ${env.PORT}`,
      "pass",
    );

    console.log("");
    console.log(
      chalk
        .hex("#10b981")
        .bold("  ╭────────────────────────────────────────────────────╮"),
    );
    console.log(
      chalk.hex("#10b981").bold("  │") +
        chalk.hex("#e2e8f0").bold("  🚀 Server Started Successfully") +
        "                     " +
        chalk.hex("#10b981").bold("│"),
    );
    console.log(
      chalk
        .hex("#10b981")
        .bold("  ╰────────────────────────────────────────────────────╯"),
    );
    console.log("");
    printKeyValue(
      "Environment",
      env.NODE_ENV.toUpperCase(),
      "#94a3b8",
      "#10b981",
    );
    printKeyValue("Port", env.PORT.toString(), "#94a3b8", "#e2e8f0");
    printKeyValue("Public URL", env.CLIENT_PUBLIC_URL, "#94a3b8", "#6366f1");
    printKeyValue(
      "Dashboard URL",
      env.CLIENT_DASHBOARD_URL,
      "#94a3b8",
      "#8b5cf6",
    );
    printKeyValue("WebSocket", "Enabled (same port)", "#94a3b8", "#e2e8f0");
    printKeyValue("API Version", "/api/v1", "#94a3b8", "#e2e8f0");
    console.log("");

    const services = getServicesHealth();
    console.log(chalk.hex("#94a3b8")("  Services:"));
    services.forEach((svc) => {
      const icon =
        svc.status === "healthy"
          ? chalk.green(" ●")
          : svc.status === "degraded"
            ? chalk.yellow(" ◐")
            : chalk.red(" ○");
      console.log(
        `  ${icon}  ${chalk.hex("#e2e8f0")(svc.name.padEnd(15))} ${chalk.hex("#64748b")(svc.details)}`,
      );
    });

    console.log("");
    console.log(chalk.hex("#6366f1")("═".repeat(65)));
    console.log("");
    console.log(
      chalk.hex("#64748b")(
        `  Press ${chalk.hex("#e2e8f0")("CTRL+C")} to stop the server`,
      ),
    );
    console.log("");
  });

  setupGracefulShutdown(server);
};

startServer().catch((error) => {
  console.log("");
  console.log(
    chalk.red.bold(
      "╔══════════════════════════════════════════════════════════╗",
    ),
  );
  console.log(
    chalk.red.bold("║") +
      chalk.white.bold("  ✗ FATAL: Server failed to start") +
      "                        " +
      chalk.red.bold("║"),
  );
  console.log(
    chalk.red.bold(
      "╚══════════════════════════════════════════════════════════╝",
    ),
  );
  console.log("");
  logger.error(error instanceof Error ? error.message : "Unknown error");
  if (error instanceof Error && error.stack) {
    logger.error(error.stack);
  }
  console.log("");
  process.exit(1);
});
