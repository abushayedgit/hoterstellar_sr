import { Admin } from "../auth/admin/admin.model.js";
import { adminRepository } from "./admin.repository.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { AuthorizationError } from "../../errors/AuthorizationError.js";
import { BadRequestError } from "../../errors/BadRequestError.js";
import { logger } from "../../utils/logger.js";
import { emitAdminEvent } from "../../utils/socketEmitter.js";
import { SOCKET_EVENTS } from "../../constants/socketEvents.js";
export const getAdminById = async (adminId) => {
  const admin = await adminRepository.findById(adminId);

  if (!admin) {
    throw new NotFoundError("Admin not found");
  }

  return admin.toSafeObject();
};

export const listAdmins = async (query) => {
  const {
    page = 1,
    limit = 10,
    role,
    isActive,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter = {};

  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
    ];
  }

  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [admins, total] = await adminRepository.findAll(filter, {
    page,
    limit,
    sort,
    select: "-password",
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: admins.map((admin) => admin.toSafeObject()),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export const updateAdmin = async (
  adminId,
  updateData,
  actorAdminId,
  actorRole,
) => {
  const admin = await adminRepository.findById(adminId);

  if (!admin) {
    throw new NotFoundError("Admin not found");
  }

  // Prevent self-deactivation
  if (adminId === actorAdminId && updateData.isActive === false) {
    throw new BadRequestError("You cannot deactivate your own account");
  }

  // Only super_admin can change roles to super_admin
  if (updateData.role === "super_admin" && actorRole !== "super_admin") {
    throw new AuthorizationError(
      "Only super admin can assign super admin role",
    );
  }

  // Prevent removing last super_admin
  if (
    admin.role === "super_admin" &&
    updateData.role &&
    updateData.role !== "super_admin"
  ) {
    const superAdminCount = await Admin.countDocuments({
      role: "super_admin",
      isActive: true,
    });
    if (superAdminCount <= 1) {
      throw new BadRequestError("Cannot change role of the last super admin");
    }
  }

  const updatedAdmin = await adminRepository.updateById(adminId, updateData);

  logger.info("Admin updated", {
    adminId,
    actorAdminId,
    updates: Object.keys(updateData),
  });

  return updatedAdmin.toSafeObject();
};

export const deactivateAdmin = async (adminId, actorAdminId) => {
  const admin = await adminRepository.findById(adminId);

  if (!admin) {
    throw new NotFoundError("Admin not found");
  }

  if (adminId === actorAdminId) {
    throw new BadRequestError("You cannot deactivate your own account");
  }

  if (admin.role === "super_admin") {
    const superAdminCount = await Admin.countDocuments({
      role: "super_admin",
      isActive: true,
    });
    if (superAdminCount <= 1) {
      throw new BadRequestError("Cannot deactivate the last super admin");
    }
  }

  admin.isActive = false;
  await admin.save();
  emitAdminEvent(SOCKET_EVENTS.ADMIN_DELETED, {
    adminId,
    email: admin.email,
    name: admin.name,
  });

  logger.info("Admin deactivated", { adminId, actorAdminId });

  return admin.toSafeObject();
};

export const activateAdmin = async (adminId, actorAdminId) => {
  const admin = await adminRepository.findById(adminId);

  if (!admin) {
    throw new NotFoundError("Admin not found");
  }

  admin.isActive = true;
  await admin.save();
  emitAdminEvent(SOCKET_EVENTS.ADMIN_CREATED, {
    adminId: admin._id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });
  logger.info("Admin activated", { adminId, actorAdminId });

  return admin.toSafeObject();
};

export const deleteAdmin = async (adminId, actorAdminId) => {
  const admin = await adminRepository.findById(adminId);

  if (!admin) {
    throw new NotFoundError("Admin not found");
  }

  if (adminId === actorAdminId) {
    throw new BadRequestError("You cannot delete your own account");
  }

  if (admin.role === "super_admin") {
    const superAdminCount = await Admin.countDocuments({ role: "super_admin" });
    if (superAdminCount <= 1) {
      throw new BadRequestError("Cannot delete the last super admin");
    }
  }

  await adminRepository.deleteById(adminId);
  emitAdminEvent(SOCKET_EVENTS.ADMIN_DELETED, {
    adminId,
  });
  logger.info("Admin deleted", { adminId, actorAdminId });

  return true;
};
