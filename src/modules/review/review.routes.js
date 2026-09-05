import { Router } from 'express';
import { createAuthMiddleware } from '../../middlewares/auth.base.middleware.js';
import { requirePermission } from '../../middlewares/authorize.middleware.js';
import {
  validateBody,
  validateQuery,
} from '../../middlewares/validate.middleware.js';
import { validateObjectIdParam } from '../../middlewares/objectId.middleware.js';
import { env } from '../../config/env.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { User } from '../auth/user/user.model.js';
import { Admin } from '../auth/admin/admin.model.js';

import {
  createFoodReviewSchema,
  createTableReviewSchema,
  createEventReviewSchema,
  updateReviewSchema,
  moderateReviewSchema,
  respondToReviewSchema,
  reviewQuerySchema,
} from './review.validator.js';

import {
  createFoodReviewController,
  createTableReviewController,
  createEventReviewController,
  getEligibleOrdersController,
  getUserReviewsController,
  listReviewsController,
  getPublicReviewsForFoodController,
  updateReviewController,
  deleteReviewController,
  moderateReviewController,
  respondToReviewController,
  markReviewHelpfulController,
} from './review.controller.js';

import { auditLog } from '../../middlewares/auditLog.middleware.js';

const router = Router();

const userAuth = createAuthMiddleware(
  env.USER_JWT_SECRET,
  async (userId) => User.findById(userId)
);

const adminAuth = createAuthMiddleware(
  env.ADMIN_JWT_SECRET,
  async (adminId) => Admin.findById(adminId)
);

// Public routes
router.get(
  '/food/:foodId',
  validateObjectIdParam('foodId'),
  validateQuery(reviewQuerySchema),
  getPublicReviewsForFoodController
);

router.post(
  '/:id/helpful',
  validateObjectIdParam('id'),
  markReviewHelpfulController
);

// User routes
router.get(
  '/eligible-orders',
  userAuth,
  getEligibleOrdersController
);

router.get(
  '/my-reviews',
  userAuth,
  validateQuery(reviewQuerySchema),
  getUserReviewsController
);

router.post(
  '/food',
  userAuth,
  validateBody(createFoodReviewSchema),
  createFoodReviewController
);

router.post(
  '/table',
  userAuth,
  validateBody(createTableReviewSchema),
  createTableReviewController
);

router.post(
  '/event',
  userAuth,
  validateBody(createEventReviewSchema),
  createEventReviewController
);

router.put(
  '/:id',
  userAuth,
  validateObjectIdParam('id'),
  validateBody(updateReviewSchema),
  updateReviewController
);

router.delete(
  '/:id',
  userAuth,
  validateObjectIdParam('id'),
  deleteReviewController
);

// Admin routes
router.get(
  '/',
  adminAuth,
  requirePermission(PERMISSIONS.REVIEWS_MODERATE),
  validateQuery(reviewQuerySchema),
  listReviewsController
);

router.patch(
  '/:id/moderate',
  adminAuth,
  requirePermission(PERMISSIONS.REVIEWS_MODERATE),
  validateObjectIdParam('id'),
  validateBody(moderateReviewSchema),
  auditLog('review.moderate'),
  moderateReviewController
);

router.post(
  '/:id/respond',
  adminAuth,
  requirePermission(PERMISSIONS.REVIEWS_MODERATE),
  validateObjectIdParam('id'),
  validateBody(respondToReviewSchema),
  auditLog('review.respond'),
  respondToReviewController
);

export default router;
