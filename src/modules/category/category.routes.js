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
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
} from "./category.validator.js";
import {
  createCategoryController,
  listCategoriesController,
  getCategoryController,
  updateCategoryController,
  deleteCategoryController,
} from "./category.controller.js";
import { auditLog } from "../../middlewares/auditLog.middleware.js";
import { uploadSingle } from "../../middlewares/upload.middleware.js";
import { adminDestructiveRateLimiter } from "../../middlewares/rateLimiter.middleware.js";

const router = Router();

const adminAuth = createAuthMiddleware(
  env.ADMIN_JWT_SECRET,
  async (adminId) => {
    return Admin.findById(adminId);
  },
);

// Public routes (service handles caching)
router.get("/", validateQuery(categoryQuerySchema), listCategoriesController);
router.get("/:id", validateObjectIdParam("id"), getCategoryController);

// Admin routes (no cache)
router.post(
  "/",
  adminAuth,
  requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  uploadSingle,
  validateBody(createCategorySchema),
  auditLog("category.create"),
  createCategoryController,
);

router.put(
  "/:id",
  adminAuth,
  requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  validateObjectIdParam("id"),
  uploadSingle,
  validateBody(updateCategorySchema),
  auditLog("category.update"),
  updateCategoryController,
);

router.delete(
  "/:id",
  adminDestructiveRateLimiter,
  adminAuth,
  requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  validateObjectIdParam("id"),
  auditLog("category.delete"),
  deleteCategoryController,
);

export default router;
