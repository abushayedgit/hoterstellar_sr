import { Router } from "express";
import { validateBody } from "../../../middlewares/validate.middleware.js";
import { authRateLimiter } from "../../../middlewares/rateLimiter.middleware.js";
import {
  adminLoginSchema,
  changePasswordSchema,
  createAdminSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "./admin.auth.validator.js";
import {
  loginController,
  refreshController,
  logoutController,
  changePasswordController,
  createAdminController,
  requestPasswordResetController,
  resetPasswordController,
} from "./admin.auth.controller.js";
import { requirePermission } from "../../../middlewares/authorize.middleware.js";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { createAuthMiddleware } from "../../../middlewares/auth.base.middleware.js";
import { env } from "../../../config/env.js";
import { Admin } from "./admin.model.js";

const router = Router();

// Admin authentication middleware
const adminAuth = createAuthMiddleware(
  env.ADMIN_JWT_SECRET,
  async (adminId) => {
    return Admin.findById(adminId);
  },
);

// Public routes
router.post(
  "/login",
  authRateLimiter,
  validateBody(adminLoginSchema),
  loginController,
);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);
router.post(
  "/request-reset-password",
  authRateLimiter,
  validateBody(requestPasswordResetSchema),
  requestPasswordResetController,
);
router.post(
  "/reset-password",
  authRateLimiter,
  validateBody(resetPasswordSchema),
  resetPasswordController,
);

// Protected routes
router.use(adminAuth);
router.post(
  "/change-password",
  validateBody(changePasswordSchema),
  changePasswordController,
);
router.post(
  "/create",
  requirePermission(PERMISSIONS.ADMINS_MANAGE),
  validateBody(createAdminSchema),
  createAdminController,
);

export default router;
