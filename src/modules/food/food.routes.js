import { Router } from 'express';
import { createAuthMiddleware } from '../../middlewares/auth.base.middleware.js';
import { requirePermission } from '../../middlewares/authorize.middleware.js';
import {
  validateBody,
  validateQuery,
  validateParams,
} from '../../middlewares/validate.middleware.js';
import { validateObjectIdParam } from '../../middlewares/objectId.middleware.js';
import { env } from '../../config/env.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { Admin } from '../auth/admin/admin.model.js';
import {
  createFoodSchema,
  updateFoodSchema,
  foodQuerySchema,
  imageDeleteParamSchema,
} from './food.validator.js';
import {
  createFoodController,
  listFoodsController,
  getFoodController,
  updateFoodController,
  deleteFoodController,
  deleteSpecificImageController,
} from './food.controller.js';
import { auditLog } from '../../middlewares/auditLog.middleware.js';
import { uploadMultiple } from '../../middlewares/upload.middleware.js';
import { adminDestructiveRateLimiter } from '../../middlewares/rateLimiter.middleware.js';

const router = Router();

const adminAuth = createAuthMiddleware(
  env.ADMIN_JWT_SECRET,
  async (adminId) => {
    return Admin.findById(adminId);
  },
);

// ============================================================
// Public routes
// ============================================================
router.get('/', validateQuery(foodQuerySchema), listFoodsController);
router.get('/:id', validateObjectIdParam('id'), getFoodController);

// ============================================================
// Admin routes — Create
// ============================================================
router.post(
  '/',
  adminAuth,
  requirePermission(PERMISSIONS.FOODS_CREATE),
  uploadMultiple,
  validateBody(createFoodSchema),
  auditLog('food.create'),
  createFoodController,
);

// ============================================================
// Admin routes — Update (appends images, doesn't replace)
// ============================================================
router.put(
  '/:id',
  adminAuth,
  requirePermission(PERMISSIONS.FOODS_UPDATE),
  validateObjectIdParam('id'),
  uploadMultiple,
  validateBody(updateFoodSchema),
  auditLog('food.update'),
  updateFoodController,
);

// ============================================================
// Admin routes — Delete specific image (NEW)
// Route order matters: must be BEFORE the generic /:id DELETE
// ============================================================
router.delete(
  '/:id/images/:imageId',
  adminDestructiveRateLimiter,
  adminAuth,
  requirePermission(PERMISSIONS.FOODS_UPDATE),
  validateObjectIdParam('id'),
  validateParams(imageDeleteParamSchema),
  auditLog('food.image.delete'),
  deleteSpecificImageController,
);

// ============================================================
// Admin routes — Delete entire food
// ============================================================
router.delete(
  '/:id',
  adminDestructiveRateLimiter,
  adminAuth,
  requirePermission(PERMISSIONS.FOODS_DELETE),
  validateObjectIdParam('id'),
  auditLog('food.delete'),
  deleteFoodController,
);

export default router;
