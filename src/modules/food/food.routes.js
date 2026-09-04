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

const router = Router();

// Admin authentication middleware
const adminAuth = createAuthMiddleware(
  env.ADMIN_JWT_SECRET,
  async (adminId) => {
    return Admin.findById(adminId);
  },
);

// Public routes
router.get("/", validateQuery(foodQuerySchema), listFoodsController);
router.get("/:id", validateObjectIdParam("id"), getFoodController);

// Admin routes
router.post(
  "/",
  adminAuth,
  requirePermission(PERMISSIONS.FOODS_CREATE),
  validateBody(createFoodSchema),
  auditLog("food.create"),
  createFoodController,
);

router.put(
  "/:id",
  adminAuth,
  requirePermission(PERMISSIONS.FOODS_UPDATE),
  validateObjectIdParam("id"),
  validateBody(updateFoodSchema),
  auditLog("food.update"),
  updateFoodController,
);

router.delete(
  "/:id",
  adminAuth,
  requirePermission(PERMISSIONS.FOODS_DELETE),
  validateObjectIdParam("id"),
  auditLog("food.delete"),
  deleteFoodController,
);

export default router;
