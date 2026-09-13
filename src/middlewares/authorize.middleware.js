import mongoose from 'mongoose';
import { AuthorizationError } from '../errors/AuthorizationError.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import {
  ROLE_PERMISSIONS,
  hasAnyPermission,
} from '../constants/permissions.js';

/**
 * Require ALL given permissions.
 */
export const requirePermission = (requiredPermissions) => {
  const permissions = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  return (req, res, next) => {
    const userRole = req.auth?.user?.role || req.auth?.role;

    if (!userRole) {
      return next(new AuthorizationError('No role assigned'));
    }

    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    const hasAll = permissions.every((p) => userPermissions.includes(p));

    if (!hasAll) {
      return next(new AuthorizationError('Insufficient permissions'));
    }

    return next();
  };
};

/**
 * Require ANY of the given permissions.
 */
export const requireAnyPermission = (permissionsList) => {
  return (req, res, next) => {
    const userRole = req.auth?.user?.role || req.auth?.role;

    if (!userRole) {
      return next(new AuthorizationError('No role assigned'));
    }

    if (!hasAnyPermission(userRole, permissionsList)) {
      return next(new AuthorizationError('Insufficient permissions'));
    }

    return next();
  };
};

/**
 * Require specific role(s).
 */
export const requireRoles = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    const userRole = req.auth?.user?.role || req.auth?.role;

    if (!userRole || !roles.includes(userRole)) {
      return next(new AuthorizationError('Access denied'));
    }

    return next();
  };
};

/**
 * Require ownership of a resource.
 * resourceUserIdGetter: async (req) => userId
 */
export const requireOwnership = (resourceUserIdGetter) => {
  return async (req, res, next) => {
    try {
      const authenticatedUserId = req.auth?.user?.id || req.auth?.user?._id;
      const resourceUserId = await resourceUserIdGetter(req);

      if (!authenticatedUserId || !resourceUserId) {
        return next(new AuthorizationError('Cannot verify ownership'));
      }

      if (authenticatedUserId.toString() !== resourceUserId.toString()) {
        return next(new AuthorizationError('You do not own this resource'));
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

/**
 * Combined ownership-or-elevated-permission check.
 *
 * Logic:
 * 1. If user has `anyPermission` (e.g. notices.update.any) → allow.
 * 2. Else if user has `ownPermission` (e.g. notices.update.own) → check ownership via `ownerField`.
 * 3. Else → 403.
 *
 * @param {string} anyPermission    - Elevated permission (bypasses ownership)
 * @param {string} ownPermission    - Ownership-scoped permission
 * @param {string} modelName        - Mongoose model name (e.g. 'Notice')
 * @param {string} ownerField       - Field on document holding owner admin ID (e.g. 'authorAdminId')
 */
export const requireOwnershipOrPermission = (
  anyPermission,
  ownPermission,
  modelName,
  ownerField = 'authorAdminId',
) => {
  return async (req, res, next) => {
    try {
      const role = req.auth?.user?.role || req.auth?.role;
      const adminId = req.auth?.user?.id || req.auth?.adminId;

      if (!role || !adminId) {
        return next(new AuthorizationError('Authentication required'));
      }

      const userPermissions = ROLE_PERMISSIONS[role] || [];

      // Case 1: "any" permission — bypass ownership
      if (userPermissions.includes(anyPermission)) {
        return next();
      }

      // Case 2: "own" permission — enforce ownership
      if (userPermissions.includes(ownPermission)) {
        const Model = mongoose.model(modelName);
        const doc = await Model.findById(req.params.id).select(ownerField);

        if (!doc) {
          return next(new NotFoundError(`${modelName} not found`));
        }

        const ownerId = doc[ownerField];
        if (!ownerId || ownerId.toString() !== adminId.toString()) {
          return next(new AuthorizationError('You do not own this resource'));
        }

        req.resource = doc;
        return next();
      }

      return next(new AuthorizationError('Insufficient permissions'));
    } catch (error) {
      return next(error);
    }
  };
};
