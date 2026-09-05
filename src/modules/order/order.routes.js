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
import { User } from "../auth/user/user.model.js";
import { Admin } from "../auth/admin/admin.model.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
  orderQuerySchema,
} from "./order.validator.js";
import {
  createOrderController,
  getOrderController,
  getUserOrdersController,
  listOrdersController,
  updateOrderStatusController,
  cancelOrderController,
} from "./order.controller.js";
import { auditLog } from "../../middlewares/auditLog.middleware.js";

const router = Router();

// User authentication middleware
const userAuth = createAuthMiddleware(env.USER_JWT_SECRET, async (userId) => {
  return User.findById(userId);
});

// Admin authentication middleware
const adminAuth = createAuthMiddleware(
  env.ADMIN_JWT_SECRET,
  async (adminId) => {
    return Admin.findById(adminId);
  },
);

// User routes
router.post(
  "/",
  userAuth,
  validateBody(createOrderSchema),
  createOrderController,
);
router.get(
  "/my-orders",
  userAuth,
  validateQuery(orderQuerySchema),
  getUserOrdersController,
);
router.get("/:id", userAuth, validateObjectIdParam("id"), getOrderController);
router.post(
  "/:id/cancel",
  userAuth,
  validateObjectIdParam("id"),
  validateBody(cancelOrderSchema),
  cancelOrderController,
);

// Admin routes
router.get(
  "/",
  adminAuth,
  requirePermission(PERMISSIONS.ORDERS_READ_ALL),
  validateQuery(orderQuerySchema),
  listOrdersController,
);
router.patch(
  "/:id/status",
  adminAuth,
  requirePermission(PERMISSIONS.ORDERS_UPDATE_STATUS),
  validateObjectIdParam("id"),
  validateBody(updateOrderStatusSchema),
  auditLog("order.status.update"),
  updateOrderStatusController,
);

export default router;
