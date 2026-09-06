import { Router } from "express";
import { createAuthMiddleware } from "../../middlewares/auth.base.middleware.js";
import { requirePermission } from "../../middlewares/authorize.middleware.js";
import {
  validateBody,
  validateQuery,
} from "../../middlewares/validate.middleware.js";
import { validateObjectIdParam } from "../../middlewares/objectId.middleware.js";
import { env } from "../../config/env.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { Admin } from "../auth/admin/admin.model.js";
import {
  createContactSchema,
  updateContactStatusSchema,
  contactQuerySchema,
} from "./contact.validator.js";
import {
  createContactController,
  listContactsController,
  getContactController,
  updateContactStatusController,
  deleteContactController,
} from "./contact.controller.js";
import { mutationRateLimiter } from "../../middlewares/rateLimiter.middleware.js";
import { auditLog } from "../../middlewares/auditLog.middleware.js";
import { adminDestructiveRateLimiter } from "../../middlewares/rateLimiter.middleware.js";

const router = Router();

const adminAuth = createAuthMiddleware(
  env.ADMIN_JWT_SECRET,
  async (adminId) => {
    return Admin.findById(adminId);
  },
);

// Public route (rate limited + reCAPTCHA in service)
router.post(
  "/",
  mutationRateLimiter,
  validateBody(createContactSchema),
  createContactController,
);

// Admin routes
router.get(
  "/",
  adminAuth,
  requirePermission(PERMISSIONS.USERS_READ),
  validateQuery(contactQuerySchema),
  listContactsController,
);

router.get(
  "/:id",
  adminAuth,
  requirePermission(PERMISSIONS.USERS_READ),
  validateObjectIdParam("id"),
  getContactController,
);

router.patch(
  "/:id/status",
  adminAuth,
  requirePermission(PERMISSIONS.USERS_READ),
  validateObjectIdParam("id"),
  validateBody(updateContactStatusSchema),
  auditLog("contact.status.update"),
  updateContactStatusController,
);

router.delete(
  "/:id",
  adminDestructiveRateLimiter,
  adminAuth,
  requirePermission(PERMISSIONS.USERS_DELETE),
  validateObjectIdParam("id"),
  auditLog("contact.delete"),
  deleteContactController,
);

export default router;
