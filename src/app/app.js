import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "../config/env.js";
import { requestIdMiddleware } from "../middlewares/requestId.middleware.js";
import { requestLoggerMiddleware } from "../middlewares/requestLogger.middleware.js";
import { errorHandlerMiddleware } from "../middlewares/errorHandler.middleware.js";
import {
  securityHeadersMiddleware,
  sanitizeRequestMiddleware,
} from "../middlewares/security.middleware.js";
import { globalRateLimiter } from "../middlewares/rateLimiter.middleware.js";
import { apiRoutes } from "./routes.js";
import {
  setCsrfCookie,
  csrfProtection,
} from "../middlewares/csrf.middleware.js";

const app = express();

app.use(helmet());
app.use(securityHeadersMiddleware);

app.use(
  cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
  }),
);

app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(sanitizeRequestMiddleware);
app.use(globalRateLimiter);

app.use("/api/v1", apiRoutes);

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    statusCode: 200,
    code: "OK",
    message: "Server is healthy",
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

app.get("/ready", async (req, res) => {
  try {
    const { checkRedis } = await import("../config/redis.js");
    const dbConnected = mongoose.connection.readyState === 1;
    const redisOk = await checkRedis();

    if (dbConnected) {
      return res.status(200).json({
        success: true,
        statusCode: 200,
        code: "OK",
        message: "Server is ready",
        data: {
          dependencies: {
            mongodb: "connected",
            redis: redisOk ? "connected" : "unavailable",
          },
        },
      });
    } else {
      return res.status(503).json({
        success: false,
        statusCode: 503,
        code: "NOT_READY",
        message: "Server is not ready",
        data: {
          dependencies: {
            mongodb: "disconnected",
            redis: redisOk ? "connected" : "unavailable",
          },
        },
      });
    }
  } catch (err) {
    return res.status(503).json({
      success: false,
      statusCode: 503,
      code: "NOT_READY",
      message: "Dependency check failed",
    });
  }
});

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    statusCode: 404,
    code: "NOT_FOUND",
    message: "Route not found",
  });
});

app.use(errorHandlerMiddleware);

// After cookie parser (if using), before routes
app.use(setCsrfCookie);

// Apply CSRF protection to auth refresh endpoints
app.use("/api/v1/auth/admin/refresh", csrfProtection);
app.use("/api/v1/auth/user/refresh", csrfProtection);
export default app;
