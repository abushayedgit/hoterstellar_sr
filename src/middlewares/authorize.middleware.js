import { AuthorizationError } from "../errors/AuthorizationError.js";
import { ROLE_PERMISSIONS } from "../constants/permissions.js";

export const requirePermission = (requiredPermissions) => {
  const permissions = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  return (req, res, next) => {
    const userRole = req.auth?.user?.role || req.auth?.role;

    if (!userRole) {
      return next(new AuthorizationError("No role assigned"));
    }

    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    const hasPermission = permissions.every((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasPermission) {
      return next(new AuthorizationError("Insufficient permissions"));
    }

    next();
  };
};

export const requireRoles = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    const userRole = req.auth?.user?.role || req.auth?.role;

    if (!userRole || !roles.includes(userRole)) {
      return next(new AuthorizationError("Access denied"));
    }

    next();
  };
};

export const requireOwnership = (resourceUserIdGetter) => {
  return async (req, res, next) => {
    const authenticatedUserId = req.auth?.user?.id || req.auth?.user?._id;
    const resourceUserId = await resourceUserIdGetter(req);

    if (!authenticatedUserId || !resourceUserId) {
      return next(new AuthorizationError("Cannot verify ownership"));
    }

    if (authenticatedUserId.toString() !== resourceUserId.toString()) {
      return next(new AuthorizationError("You do not own this resource"));
    }

    next();
  };
};
