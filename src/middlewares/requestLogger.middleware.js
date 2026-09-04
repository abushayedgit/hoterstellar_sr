import { logger } from "../utils/logger.js";

export function requestLoggerMiddleware(req, res, next) {
  const start = Date.now();
  const { method, originalUrl } = req;
  const requestId = req.requestId;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const logPayload = {
      requestId,
      method,
      url: originalUrl,
      status,
      duration,
      actorType: req.admin ? "admin" : req.user ? "user" : "guest",
      actorId: req.admin?.id || req.user?.id || null,
    };
    if (status >= 500) {
      logger.error(logPayload, "Request failed");
    } else if (status >= 400) {
      logger.warn(logPayload, "Request error");
    } else {
      logger.info(logPayload, "Request completed");
    }
  });
  next();
}
