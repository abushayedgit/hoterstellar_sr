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

const router = Router();

// Admin authentication middleware
const adminAuth = createAuthMiddleware(
  env.ADMIN_JWT_SECRET,
  async (adminId) => {
    return Admin.findById(adminId);
  },
);

// Public routes (no auth required)
router.get("/", validateQuery(categoryQuerySchema), listCategoriesController);
router.get("/:id", validateObjectIdParam("id"), getCategoryController);

// Admin routes
router.post(
  "/",
  adminAuth,
  requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  validateBody(createCategorySchema),
  auditLog("category.create"),
  createCategoryController,
);

router.put(
  "/:id",
  adminAuth,
  requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  validateObjectIdParam("id"),
  validateBody(updateCategorySchema),
  auditLog("category.update"),
  updateCategoryController,
);

router.delete(
  "/:id",
  adminAuth,
  requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  validateObjectIdParam("id"),
  auditLog("category.delete"),
  deleteCategoryController,
);

export default router;
