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
  createFoodSchema,
  updateFoodSchema,
  foodQuerySchema,
} from "./food.validator.js";
import {
  createFoodController,
  listFoodsController,
  getFoodController,
  updateFoodController,
  deleteFoodController,
} from "./food.controller.js";
import { auditLog } from "../../middlewares/auditLog.middleware.js";
import { uploadMultiple } from "../../middlewares/upload.middleware.js";
import { adminDestructiveRateLimiter } from "../../middlewares/rateLimiter.middleware.js";

const router = Router();

const adminAuth = createAuthMiddleware(
  env.ADMIN_JWT_SECRET,
  async (adminId) => {
    return Admin.findById(adminId);
  },
);

// Public routes (service handles caching)
router.get("/", validateQuery(foodQuerySchema), listFoodsController);
router.get("/:id", validateObjectIdParam("id"), getFoodController);

// Admin routes (no cache)
router.post(
  "/",
  adminAuth,
  requirePermission(PERMISSIONS.FOODS_CREATE),
  uploadMultiple,
  validateBody(createFoodSchema),
  auditLog("food.create"),
  createFoodController,
);

router.put(
  "/:id",
  adminAuth,
  requirePermission(PERMISSIONS.FOODS_UPDATE),
  validateObjectIdParam("id"),
  uploadMultiple,
  validateBody(updateFoodSchema),
  auditLog("food.update"),
  updateFoodController,
);

router.delete(
  "/:id",
  adminDestructiveRateLimiter,
  adminAuth,
  requirePermission(PERMISSIONS.FOODS_DELETE),
  validateObjectIdParam("id"),
  auditLog("food.delete"),
  deleteFoodController,
);

export default router;
