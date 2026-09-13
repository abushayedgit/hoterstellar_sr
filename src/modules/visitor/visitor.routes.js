import { Router } from 'express';
import { createAuthMiddleware } from '../../middlewares/auth.base.middleware.js';
import { requirePermission } from '../../middlewares/authorize.middleware.js';
import {
  validateBody,
  validateQuery,
} from '../../middlewares/validate.middleware.js';
import { optionalAuthMiddleware } from '../../middlewares/optionalAuth.middleware.js';
import { env } from '../../config/env.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { Admin } from '../auth/admin/admin.model.js';
import {
  trackVisitorSchema,
  trackPageViewSchema,
  visitorQuerySchema,
} from './visitor.validator.js';
import {
  trackVisitorController,
  trackPageViewController,
  listVisitorsController,
  listPageViewsController,
  getVisitorStatsController,
} from './visitor.controller.js';

const router = Router();

const adminAuth = createAuthMiddleware(env.ADMIN_JWT_SECRET, async (adminId) =>
  Admin.findById(adminId),
);

// Public
router.post('/track', validateBody(trackVisitorSchema), trackVisitorController);
router.post(
  '/page-view',
  optionalAuthMiddleware,
  validateBody(trackPageViewSchema),
  trackPageViewController,
);

// Admin — Read (all roles)
router.get(
  '/',
  adminAuth,
  requirePermission(PERMISSIONS.VISITOR_READ),
  validateQuery(visitorQuerySchema),
  listVisitorsController,
);

router.get(
  '/page-views',
  adminAuth,
  requirePermission(PERMISSIONS.VISITOR_READ),
  validateQuery(visitorQuerySchema),
  listPageViewsController,
);

router.get(
  '/stats',
  adminAuth,
  requirePermission(PERMISSIONS.VISITOR_READ),
  getVisitorStatsController,
);

export default router;
