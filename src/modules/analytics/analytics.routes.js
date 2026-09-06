import { Router } from "express";
import { createAuthMiddleware } from "../../middlewares/auth.base.middleware.js";
import { requirePermission } from "../../middlewares/authorize.middleware.js";
import {
  validateBody,
  validateQuery,
} from "../../middlewares/validate.middleware.js";
import { env } from "../../config/env.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { Admin } from "../auth/admin/admin.model.js";
import {
  analyticsQuerySchema,
  deleteAnalyticsSchema,
} from "./analytics.validator.js";
import {
  getOrderAnalyticsController,
  getFoodAnalyticsController,
  getBookingAnalyticsController,
  getReviewAnalyticsController,
  getIncomeAnalyticsController,
  requestAnalyticsDeletionController,
  deleteAnalyticsController,
} from "./analytics.controller.js";
import { auditLog } from "../../middlewares/auditLog.middleware.js";
import { adminDestructiveRateLimiter } from "../../middlewares/rateLimiter.middleware.js";

const router = Router();

const adminAuth = createAuthMiddleware(
  env.ADMIN_JWT_SECRET,
  async (adminId) => {
    return Admin.findById(adminId);
  },
);

// All routes require admin auth + analytics read permission
router.use(adminAuth, requirePermission(PERMISSIONS.ANALYTICS_READ));

// Analytics endpoints
router.get(
  "/orders",
  validateQuery(analyticsQuerySchema),
  getOrderAnalyticsController,
);
router.get(
  "/foods",
  validateQuery(analyticsQuerySchema),
  getFoodAnalyticsController,
);
router.get(
  "/bookings",
  validateQuery(analyticsQuerySchema),
  getBookingAnalyticsController,
);
router.get(
  "/reviews",
  validateQuery(analyticsQuerySchema),
  getReviewAnalyticsController,
);
router.get(
  "/income",
  validateQuery(analyticsQuerySchema),
  getIncomeAnalyticsController,
);

// Destructive analytics deletion (super_admin only)
router.post(
  "/request-deletion",
  requirePermission(PERMISSIONS.ANALYTICS_DELETE),
  requestAnalyticsDeletionController,
);
router.delete(
  "/",
  adminDestructiveRateLimiter,
  requirePermission(PERMISSIONS.ANALYTICS_DELETE),
  validateBody(deleteAnalyticsSchema),
  auditLog("analytics.delete"),
  deleteAnalyticsController,
);

export default router;
