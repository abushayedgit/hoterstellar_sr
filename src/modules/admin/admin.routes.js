import { Router } from "express";
import { createAuthMiddleware } from "../../middlewares/auth.base.middleware.js";
import {
  requirePermission,
  requireRoles,
} from "../../middlewares/authorize.middleware.js";
import {
  validateBody,
  validateQuery,
} from "../../middlewares/validate.middleware.js";
import { validateObjectIdParam } from "../../middlewares/objectId.middleware.js";
import { env } from "../../config/env.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { ROLES } from "../../constants/roles.js";
import { Admin } from "../auth/admin/admin.model.js";
import { updateAdminSchema, adminQuerySchema } from "./admin.validator.js";
import {
  getAdminController,
  listAdminsController,
  updateAdminController,
  deactivateAdminController,
  activateAdminController,
  deleteAdminController,
} from "./admin.controller.js";
import { auditLog } from "../../middlewares/auditLog.middleware.js";

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

// Get all admins (super_admin and admin only)
router.get(
  "/",
  requirePermission(PERMISSIONS.USERS_READ),
  validateQuery(adminQuerySchema),
  listAdminsController,
);

// Get admin by ID
router.get(
  "/:id",
  requirePermission(PERMISSIONS.USERS_READ),
  validateObjectIdParam("id"),
  getAdminController,
);

// Update admin
router.put(
  "/:id",
  requirePermission(PERMISSIONS.ADMINS_MANAGE),
  validateObjectIdParam("id"),
  validateBody(updateAdminSchema),
  auditLog("admin.update"),
  updateAdminController,
);

// Deactivate admin
router.patch(
  "/:id/deactivate",
  requirePermission(PERMISSIONS.ADMINS_MANAGE),
  validateObjectIdParam("id"),
  auditLog("admin.deactivate"),
  deactivateAdminController,
);

// Activate admin
router.patch(
  "/:id/activate",
  requirePermission(PERMISSIONS.ADMINS_MANAGE),
  validateObjectIdParam("id"),
  auditLog("admin.activate"),
  activateAdminController,
);

// Delete admin (super_admin only)
router.delete(
  "/:id",
  requireRoles([ROLES.SUPER_ADMIN]),
  validateObjectIdParam("id"),
  auditLog("admin.delete"),
  deleteAdminController,
);

export default router;
