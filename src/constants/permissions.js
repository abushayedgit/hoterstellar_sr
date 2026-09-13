import { ROLES } from './roles.js';

/**
 * Granular permission set.
 * Format: resource.action[.scope]
 */
export const PERMISSIONS = {
  // Admin management
  ADMINS_READ: 'admins.read',
  ADMINS_MANAGE: 'admins.manage',
  ADMINS_DELETE: 'admins.delete',

  // User management
  USERS_READ: 'users.read',
  USERS_BAN: 'users.ban',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  // Food
  FOODS_READ: 'foods.read',
  FOODS_CREATE: 'foods.create',
  FOODS_UPDATE: 'foods.update',
  FOODS_DELETE: 'foods.delete',

  // Category
  CATEGORIES_READ: 'categories.read',
  CATEGORIES_CREATE: 'categories.create',
  CATEGORIES_UPDATE: 'categories.update',
  CATEGORIES_DELETE: 'categories.delete',

  // Orders
  ORDERS_READ: 'orders.read',
  ORDERS_ACCEPT: 'orders.accept',
  ORDERS_UPDATE_STATUS: 'orders.update.status',

  // Bookings
  BOOKINGS_READ: 'bookings.read',
  BOOKINGS_ACCEPT: 'bookings.accept',
  BOOKINGS_UPDATE: 'bookings.update',
  BOOKINGS_DELETE: 'bookings.delete',

  // Reviews
  REVIEWS_READ: 'reviews.read',
  REVIEWS_ACCEPT: 'reviews.accept',
  REVIEWS_MODERATE: 'reviews.moderate',
  REVIEWS_RESPOND: 'reviews.respond',
  REVIEWS_DELETE: 'reviews.delete',
  REVIEWS_CREATE_MANUAL: 'reviews.create.manual',

  // Notices (with ownership scopes)
  NOTICES_READ: 'notices.read',
  NOTICES_CREATE: 'notices.create',
  NOTICES_UPDATE_ANY: 'notices.update.any',
  NOTICES_UPDATE_OWN: 'notices.update.own',
  NOTICES_DELETE_ANY: 'notices.delete.any',
  NOTICES_DELETE_OWN: 'notices.delete.own',
  NOTICES_PUBLISH: 'notices.publish',

  // Billboard
  BILLBOARD_READ: 'billboard.read',
  BILLBOARD_CREATE: 'billboard.create',
  BILLBOARD_UPDATE: 'billboard.update',
  BILLBOARD_DELETE: 'billboard.delete',

  // Contact
  CONTACT_READ: 'contact.read',
  CONTACT_DELETE: 'contact.delete',

  // Visitor
  VISITOR_READ: 'visitor.read',
  VISITOR_DELETE: 'visitor.delete',

  // Analytics
  ANALYTICS_READ: 'analytics.read',
  ANALYTICS_DELETE: 'analytics.delete',
};

/**
 * Role → Permissions mapping.
 * Super Admin: ALL permissions (computed below, no need to list).
 */
const ADMIN_PERMISSIONS = [
  PERMISSIONS.ADMINS_READ,

  PERMISSIONS.USERS_READ,
  PERMISSIONS.USERS_BAN,

  PERMISSIONS.FOODS_READ,
  PERMISSIONS.FOODS_CREATE,
  PERMISSIONS.FOODS_UPDATE,
  PERMISSIONS.FOODS_DELETE,

  PERMISSIONS.CATEGORIES_READ,
  PERMISSIONS.CATEGORIES_CREATE,
  PERMISSIONS.CATEGORIES_UPDATE,
  PERMISSIONS.CATEGORIES_DELETE,

  PERMISSIONS.ORDERS_READ,
  PERMISSIONS.ORDERS_ACCEPT,
  PERMISSIONS.ORDERS_UPDATE_STATUS,

  PERMISSIONS.BOOKINGS_READ,
  PERMISSIONS.BOOKINGS_ACCEPT,
  PERMISSIONS.BOOKINGS_UPDATE,

  PERMISSIONS.REVIEWS_READ,
  PERMISSIONS.REVIEWS_ACCEPT,
  PERMISSIONS.REVIEWS_MODERATE,
  PERMISSIONS.REVIEWS_RESPOND,
  PERMISSIONS.REVIEWS_DELETE,

  PERMISSIONS.NOTICES_READ,
  PERMISSIONS.NOTICES_CREATE,
  PERMISSIONS.NOTICES_UPDATE_ANY,
  PERMISSIONS.NOTICES_UPDATE_OWN,
  PERMISSIONS.NOTICES_DELETE_ANY,
  PERMISSIONS.NOTICES_DELETE_OWN,
  PERMISSIONS.NOTICES_PUBLISH,

  PERMISSIONS.BILLBOARD_READ,

  PERMISSIONS.CONTACT_READ,

  PERMISSIONS.VISITOR_READ,

  PERMISSIONS.ANALYTICS_READ,
];

const MANAGER_PERMISSIONS = [
  PERMISSIONS.USERS_READ,

  PERMISSIONS.FOODS_READ,

  PERMISSIONS.CATEGORIES_READ,

  PERMISSIONS.ORDERS_READ,
  PERMISSIONS.ORDERS_ACCEPT,

  PERMISSIONS.BOOKINGS_READ,
  PERMISSIONS.BOOKINGS_ACCEPT,

  PERMISSIONS.REVIEWS_READ,
  PERMISSIONS.REVIEWS_ACCEPT,

  PERMISSIONS.NOTICES_READ,
  PERMISSIONS.NOTICES_CREATE,
  PERMISSIONS.NOTICES_UPDATE_OWN,
  PERMISSIONS.NOTICES_DELETE_OWN,

  PERMISSIONS.BILLBOARD_READ,

  PERMISSIONS.CONTACT_READ,

  PERMISSIONS.VISITOR_READ,

  PERMISSIONS.ANALYTICS_READ,
];

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // All
  [ROLES.ADMIN]: ADMIN_PERMISSIONS,
  [ROLES.MANAGER]: MANAGER_PERMISSIONS,
};

/**
 * Helper: check if a role has a given permission.
 */
export const hasPermission = (role, permission) => {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
};

/**
 * Helper: check if a role has ANY of the given permissions.
 */
export const hasAnyPermission = (role, permissions) => {
  const perms = ROLE_PERMISSIONS[role] || [];
  return permissions.some((p) => perms.includes(p));
};
