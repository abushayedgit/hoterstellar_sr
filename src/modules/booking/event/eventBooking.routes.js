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
  createEventBookingSchema,
  updateEventBookingSchema,
  updateEventBookingStatusSchema,
  cancelEventBookingSchema,
  eventBookingQuerySchema,
} from "./eventBooking.validator.js";
import {
  createEventBookingController,
  getEventBookingController,
  getUserEventBookingsController,
  listEventBookingsController,
  updateEventBookingController,
  updateEventBookingStatusController,
  cancelEventBookingController,
} from "./eventBooking.controller.js";
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
  validateBody(createEventBookingSchema),
  createEventBookingController,
);

router.get(
  "/my-bookings",
  userAuth,
  validateQuery(eventBookingQuerySchema),
  getUserEventBookingsController,
);

router.get(
  "/:id",
  optionalAuthMiddleware,
  validateObjectIdParam("id"),
  getEventBookingController,
);

router.post(
  "/:id/cancel",
  userAuth,
  validateObjectIdParam("id"),
  validateBody(cancelEventBookingSchema),
  cancelEventBookingController,
);

router.get(
  "/",
  adminAuth,
  requirePermission(PERMISSIONS.BOOKINGS_READ_ALL),
  validateQuery(eventBookingQuerySchema),
  listEventBookingsController,
);

router.put(
  "/:id",
  adminAuth,
  requirePermission(PERMISSIONS.BOOKINGS_UPDATE),
  validateObjectIdParam("id"),
  validateBody(updateEventBookingSchema),
  auditLog("eventBooking.update"),
  updateEventBookingController,
);

router.patch(
  "/:id/status",
  adminAuth,
  requirePermission(PERMISSIONS.BOOKINGS_UPDATE),
  validateObjectIdParam("id"),
  validateBody(updateEventBookingStatusSchema),
  auditLog("eventBooking.status.update"),
  updateEventBookingStatusController,
);

export default router;
