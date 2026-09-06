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
  createNoticeSchema,
  updateNoticeSchema,
  noticeQuerySchema,
} from "./notice.validator.js";
import {
  createNoticeController,
  listNoticesController,
  listPublishedNoticesController,
  getNoticeController,
  getNoticeBySlugController,
  updateNoticeController,
  deleteNoticeController,
  publishNoticeController,
  archiveNoticeController,
} from "./notice.controller.js";
import { auditLog } from "../../middlewares/auditLog.middleware.js";
import { uploadSingle } from "../../middlewares/upload.middleware.js";

const router = Router();

const adminAuth = createAuthMiddleware(env.ADMIN_JWT_SECRET, async (adminId) =>
  Admin.findById(adminId),
);

// Public routes (service handles caching)
router.get(
  "/published",
  validateQuery(noticeQuerySchema),
  listPublishedNoticesController,
);
router.get("/slug/:slug", getNoticeBySlugController);

// Admin routes (no cache)
router.get(
  "/",
  adminAuth,
  requirePermission(PERMISSIONS.NOTICES_MANAGE),
  validateQuery(noticeQuerySchema),
  listNoticesController,
);

router.post(
  "/",
  adminAuth,
  requirePermission(PERMISSIONS.NOTICES_MANAGE),
  uploadSingle,
  validateBody(createNoticeSchema),
  auditLog("notice.create"),
  createNoticeController,
);

router.get(
  "/:id",
  adminAuth,
  requirePermission(PERMISSIONS.NOTICES_MANAGE),
  validateObjectIdParam("id"),
  getNoticeController,
);

router.put(
  "/:id",
  adminAuth,
  requirePermission(PERMISSIONS.NOTICES_MANAGE),
  validateObjectIdParam("id"),
  uploadSingle,
  validateBody(updateNoticeSchema),
  auditLog("notice.update"),
  updateNoticeController,
);

router.delete(
  "/:id",
  adminAuth,
  requirePermission(PERMISSIONS.NOTICES_MANAGE),
  validateObjectIdParam("id"),
  auditLog("notice.delete"),
  deleteNoticeController,
);

router.patch(
  "/:id/publish",
  adminAuth,
  requirePermission(PERMISSIONS.NOTICES_MANAGE),
  validateObjectIdParam("id"),
  auditLog("notice.publish"),
  publishNoticeController,
);

router.patch(
  "/:id/archive",
  adminAuth,
  requirePermission(PERMISSIONS.NOTICES_MANAGE),
  validateObjectIdParam("id"),
  auditLog("notice.archive"),
  archiveNoticeController,
);

export default router;
