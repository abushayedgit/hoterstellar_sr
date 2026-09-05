import { Router } from "express";
import { createAuthMiddleware } from "../../../middlewares/auth.base.middleware.js";
import { requirePermission } from "../../../middlewares/authorize.middleware.js";
import {
  validateBody,
  validateQuery,
} from "../../../middlewares/validate.middleware.js";
import { validateObjectIdParam } from "../../../middlewares/objectId.middleware.js";
import { optionalAuthMiddleware } from "../../../middlewares/optionalAuth.middleware.js";
import { env } from "../../../config/env.js";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { User } from "../../auth/user/user.model.js";
import { Admin } from "../../auth/admin/admin.model.js";
import {
  createTableBookingSchema,
  updateTableBookingSchema,
  updateTableBookingStatusSchema,
  cancelTableBookingSchema,
  tableBookingQuerySchema,
} from "./tableBooking.validator.js";
import {
  createTableBookingController,
  getTableBookingController,
  getUserTableBookingsController,
  listTableBookingsController,
  updateTableBookingController,
  updateTableBookingStatusController,
  cancelTableBookingController,
} from "./tableBooking.controller.js";
import { auditLog } from "../../../middlewares/auditLog.middleware.js";

const router = Router();

const userAuth = createAuthMiddleware(env.USER_JWT_SECRET, async (userId) =>
  User.findById(userId),
);

const adminAuth = createAuthMiddleware(env.ADMIN_JWT_SECRET, async (adminId) =>
  Admin.findById(adminId),
);

router.post(
  "/",
  optionalAuthMiddleware,
  validateBody(createTableBookingSchema),
  createTableBookingController,
);

router.get(
  "/my-bookings",
  userAuth,
  validateQuery(tableBookingQuerySchema),
  getUserTableBookingsController,
);

router.get(
  "/:id",
  optionalAuthMiddleware,
  validateObjectIdParam("id"),
  getTableBookingController,
);

router.post(
  "/:id/cancel",
  userAuth,
  validateObjectIdParam("id"),
  validateBody(cancelTableBookingSchema),
  cancelTableBookingController,
);

router.get(
  "/",
  adminAuth,
  requirePermission(PERMISSIONS.BOOKINGS_READ_ALL),
  validateQuery(tableBookingQuerySchema),
  listTableBookingsController,
);

router.put(
  "/:id",
  adminAuth,
  requirePermission(PERMISSIONS.BOOKINGS_UPDATE),
  validateObjectIdParam("id"),
  validateBody(updateTableBookingSchema),
  auditLog("tableBooking.update"),
  updateTableBookingController,
);

router.patch(
  "/:id/status",
  adminAuth,
  requirePermission(PERMISSIONS.BOOKINGS_UPDATE),
  validateObjectIdParam("id"),
  validateBody(updateTableBookingStatusSchema),
  auditLog("tableBooking.status.update"),
  updateTableBookingStatusController,
);

export default router;
