import { Router } from "express";
import { createAuthMiddleware } from "../../middlewares/auth.base.middleware.js";
import { requirePermission } from "../../middlewares/authorize.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { env } from "../../config/env.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { Admin } from "../auth/admin/admin.model.js";
import {
  updateBillboardSchema,
  addCarouselItemSchema,
  updateCarouselItemSchema,
  reorderCarouselsSchema,
  updateBillboardSchema as popupUpdateSchema,
} from "./billboard.validator.js";
import {
  getBillboardController,
  getPublicBillboardController,
  updateBillboardController,
  addCarouselItemController,
  updateCarouselItemController,
  removeCarouselItemController,
  reorderCarouselsController,
  updatePopupImageController,
} from "./billboard.controller.js";
import { auditLog } from "../../middlewares/auditLog.middleware.js";

const router = Router();

// Admin authentication middleware
const adminAuth = createAuthMiddleware(
  env.ADMIN_JWT_SECRET,
  async (adminId) => {
    return Admin.findById(adminId);
  },
);

// Public route
router.get("/public", getPublicBillboardController);

// Admin routes (all require auth + permission)
router.get(
  "/",
  adminAuth,
  requirePermission(PERMISSIONS.BILLBOARD_MANAGE),
  getBillboardController,
);
router.put(
  "/",
  adminAuth,
  requirePermission(PERMISSIONS.BILLBOARD_MANAGE),
  validateBody(updateBillboardSchema),
  auditLog("billboard.update"),
  updateBillboardController,
);

// Carousel item management
router.post(
  "/carousels",
  adminAuth,
  requirePermission(PERMISSIONS.BILLBOARD_MANAGE),
  validateBody(addCarouselItemSchema),
  auditLog("billboard.carousel.add"),
  addCarouselItemController,
);
router.put(
  "/carousels/:imgId",
  adminAuth,
  requirePermission(PERMISSIONS.BILLBOARD_MANAGE),
  validateBody(updateCarouselItemSchema),
  auditLog("billboard.carousel.update"),
  updateCarouselItemController,
);
router.delete(
  "/carousels/:imgId",
  adminAuth,
  requirePermission(PERMISSIONS.BILLBOARD_MANAGE),
  auditLog("billboard.carousel.remove"),
  removeCarouselItemController,
);
router.put(
  "/carousels/reorder",
  adminAuth,
  requirePermission(PERMISSIONS.BILLBOARD_MANAGE),
  validateBody(reorderCarouselsSchema),
  auditLog("billboard.carousel.reorder"),
  reorderCarouselsController,
);

// Popup image management
router.put(
  "/popup",
  adminAuth,
  requirePermission(PERMISSIONS.BILLBOARD_MANAGE),
  validateBody(popupUpdateSchema.pick({ billBoardImg: true })),
  auditLog("billboard.popup.update"),
  updatePopupImageController,
);

export default router;
