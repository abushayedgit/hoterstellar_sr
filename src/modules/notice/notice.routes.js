import { Router } from 'express';
import { createAuthMiddleware } from '../../middlewares/auth.base.middleware.js';
import {
  requirePermission,
  requireOwnershipOrPermission,
} from '../../middlewares/authorize.middleware.js';
import {
  validateBody,
  validateQuery,
} from '../../middlewares/validate.middleware.js';
import { validateObjectIdParam } from '../../middlewares/objectId.middleware.js';
import { env } from '../../config/env.js';
import { PERMISSIONS } from '../../constants/permissions.js';
import { Admin } from '../auth/admin/admin.model.js';
import {
  createNoticeSchema,
  updateNoticeSchema,
  noticeQuerySchema,
} from './notice.validator.js';
import {
  createNoticeController,
  listNoticesController,
  listPublishedNoticesController,
  getNoticeController,
  getNoticeBySlugController,
  updateNoticeController,
  deleteNoticeController,
  publishNoticeController,
  archiveNoticeController,
} from './notice.controller.js';
import { auditLog } from '../../middlewares/auditLog.middleware.js';
import { uploadSingle } from '../../middlewares/upload.middleware.js';
import { adminDestructiveRateLimiter } from '../../middlewares/rateLimiter.middleware.js';

const router = Router();

const adminAuth = createAuthMiddleware(env.ADMIN_JWT_SECRET, async (adminId) =>
  Admin.findById(adminId),
);

// Public
router.get(
  '/published',
  validateQuery(noticeQuerySchema),
  listPublishedNoticesController,
);
router.get('/slug/:slug', getNoticeBySlugController);

// Admin — Read (all roles)
router.get(
  '/',
  adminAuth,
  requirePermission(PERMISSIONS.NOTICES_READ),
  validateQuery(noticeQuerySchema),
  listNoticesController,
);

router.get(
  '/:id',
  adminAuth,
  requirePermission(PERMISSIONS.NOTICES_READ),
  validateObjectIdParam('id'),
  getNoticeController,
);

// Admin — Create (all roles)
router.post(
  '/',
  adminAuth,
  requirePermission(PERMISSIONS.NOTICES_CREATE),
  uploadSingle,
  validateBody(createNoticeSchema),
  auditLog('notice.create'),
  createNoticeController,
);

// Admin — Update (Super Admin + Admin bypass ownership; Manager only own)
router.put(
  '/:id',
  adminAuth,
  requireOwnershipOrPermission(
    PERMISSIONS.NOTICES_UPDATE_ANY,
    PERMISSIONS.NOTICES_UPDATE_OWN,
    'Notice',
    'authorAdminId',
  ),
  validateObjectIdParam('id'),
  uploadSingle,
  validateBody(updateNoticeSchema),
  auditLog('notice.update'),
  updateNoticeController,
);

// Admin — Delete (Super Admin + Admin bypass ownership; Manager only own)
router.delete(
  '/:id',
  adminDestructiveRateLimiter,
  adminAuth,
  requireOwnershipOrPermission(
    PERMISSIONS.NOTICES_DELETE_ANY,
    PERMISSIONS.NOTICES_DELETE_OWN,
    'Notice',
    'authorAdminId',
  ),
  validateObjectIdParam('id'),
  auditLog('notice.delete'),
  deleteNoticeController,
);

// Admin — Publish (Super Admin + Admin)
router.patch(
  '/:id/publish',
  adminAuth,
  requirePermission(PERMISSIONS.NOTICES_PUBLISH),
  validateObjectIdParam('id'),
  auditLog('notice.publish'),
  publishNoticeController,
);

// Admin — Archive (Super Admin + Admin)
router.patch(
  '/:id/archive',
  adminAuth,
  requirePermission(PERMISSIONS.NOTICES_PUBLISH),
  validateObjectIdParam('id'),
  auditLog('notice.archive'),
  archiveNoticeController,
);

export default router;
