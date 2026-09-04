import { logger } from "../utils/logger.js";

export const auditLog = (action, getResourceId = null) => {
  return async (req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      const resourceId = getResourceId
        ? getResourceId(req)
        : req.params.id || null;

      logger.info(
        {
          type: "AUDIT",
          action,
          actor: {
            id: req.auth?.user?.id || req.auth?.user?._id || null,
            role: req.auth?.user?.role || req.auth?.role || "guest",
            ip: req.ip,
          },
          resource: resourceId,
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration,
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
        "Audit log",
      );
    });

    next();
  };
};
