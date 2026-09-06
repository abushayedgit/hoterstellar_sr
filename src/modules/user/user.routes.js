import { Router } from "express";
import { createAuthMiddleware } from "../../middlewares/auth.base.middleware.js";
import { requirePermission } from "../../middlewares/authorize.middleware.js";
import { validateQuery } from "../../middlewares/validate.middleware.js";
import { validateObjectIdParam } from "../../middlewares/objectId.middleware.js";
import { env } from "../../config/env.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { Admin } from "../auth/admin/admin.model.js";
import { userQuerySchema } from "../auth/user/user.auth.validator.js";
import {
  listUsersController,
  getUserController,
  softDeleteUserController,
  deactivateUserController,
  activateUserController,
} from "./user.controller.js";
import { auditLog } from "../../middlewares/auditLog.middleware.js";
import { adminDestructiveRateLimiter } from "../../middlewares/rateLimiter.middleware.js";

const router = Router();

// Admin authentication middleware
const adminAuth = createAuthMiddleware(
  env.ADMIN_JWT_SECRET,
  async (adminId) => {
    return Admin.findById(adminId);
  },
);

// All routes require admin authentication
router.use(adminAuth);

// List users
router.get(
  "/",
  requirePermission(PERMISSIONS.USERS_READ),
  validateQuery(userQuerySchema),
  listUsersController,
);

// Get user by ID
router.get(
  "/:id",
  requirePermission(PERMISSIONS.USERS_READ),
  validateObjectIdParam("id"),
  getUserController,
);

// Soft delete user
router.delete(
  "/:id",
  adminDestructiveRateLimiter,
  requirePermission(PERMISSIONS.USERS_DELETE),
  validateObjectIdParam("id"),
  auditLog("user.delete"),
  softDeleteUserController,
);

// Deactivate user
router.patch(
  "/:id/deactivate",
  requirePermission(PERMISSIONS.USERS_DELETE),
  validateObjectIdParam("id"),
  auditLog("user.deactivate"),
  deactivateUserController,
);

// Activate user
router.patch(
  "/:id/activate",
  requirePermission(PERMISSIONS.USERS_DELETE),
  validateObjectIdParam("id"),
  auditLog("user.activate"),
  activateUserController,
);

export default router;
