import { Router } from 'express';
import { createAuthMiddleware } from '../../middlewares/auth.base.middleware.js';
import {
  requirePermission,
  requireRoles,
} from '../../middlewares/authorize.middleware.js';
import {
  validateBody,
  validateQuery,
} from '../../middlewares/validate.middleware.js';
import { validateObjectIdParam } from '../../middlewares/objectId.middleware.js';
import { env } from '../../config/env.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { ROLES } from '../../constants/roles.js';
import { Admin } from '../auth/admin/admin.model.js';
import { updateAdminSchema, adminQuerySchema } from './admin.validator.js';
import {
  getAdminController,
  listAdminsController,
  updateAdminController,
  deactivateAdminController,
  activateAdminController,
  deleteAdminController,
  getMeController,
} from './admin.controller.js';
import { auditLog } from '../../middlewares/auditLog.middleware.js';
import { adminDestructiveRateLimiter } from '../../middlewares/rateLimiter.middleware.js';

const router = Router();

const adminAuth = createAuthMiddleware(env.ADMIN_JWT_SECRET, async (adminId) =>
  Admin.findById(adminId),
);

router.use(adminAuth);

router.get(
  '/',
  requirePermission(PERMISSIONS.ADMINS_READ),
  validateQuery(adminQuerySchema),
  listAdminsController,
);
router.get('/me', getMeController);
router.get(
  '/:id',
  requirePermission(PERMISSIONS.ADMINS_READ),
  validateObjectIdParam('id'),
  getAdminController,
);

router.put(
  '/:id',
  requirePermission(PERMISSIONS.ADMINS_MANAGE),
  validateObjectIdParam('id'),
  validateBody(updateAdminSchema),
  auditLog('admin.update'),
  updateAdminController,
);

router.patch(
  '/:id/deactivate',
  requirePermission(PERMISSIONS.ADMINS_MANAGE),
  validateObjectIdParam('id'),
  auditLog('admin.deactivate'),
  deactivateAdminController,
);

router.patch(
  '/:id/activate',
  requirePermission(PERMISSIONS.ADMINS_MANAGE),
  validateObjectIdParam('id'),
  auditLog('admin.activate'),
  activateAdminController,
);

router.delete(
  '/:id',
  adminDestructiveRateLimiter,
  requireRoles([ROLES.SUPER_ADMIN]),
  validateObjectIdParam('id'),
  auditLog('admin.delete'),
  deleteAdminController,
);

export default router;
