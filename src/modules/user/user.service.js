import { User } from "../auth/user/user.model.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { logger } from "../../utils/logger.js";

export const listUsers = async (query) => {
  const {
    page = 1,
    limit = 10,
    search,
    isActive,
    joinedAfter,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter = { deletedAt: null };

  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (joinedAfter) filter.joinedAt = { $gte: new Date(joinedAfter) };
  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: users.map((user) => user.toSafeObject()),
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

export const getUserById = async (userId) => {
  const user = await User.findById(userId);

  if (!user || user.isDeleted()) {
    throw new NotFoundError("User not found");
  }

  return user.toSafeObject();
};

export const softDeleteUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user || user.isDeleted()) {
    throw new NotFoundError("User not found");
  }

  // Soft delete + anonymization
  user.isActive = false;
  user.deletedAt = new Date();
  user.name = "Deleted User";
  user.phone = "";
  user.district = "";
  user.area = "";
  user.address = "";
  user.gender = "";
  user.age = null;
  await user.save();

  logger.info("User soft deleted", { userId });

  return true;
};

export const deactivateUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user || user.isDeleted()) {
    throw new NotFoundError("User not found");
  }

  user.isActive = false;
  await user.save();

  logger.info("User deactivated", { userId });

  return user.toSafeObject();
};

export const activateUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user || user.isDeleted()) {
    throw new NotFoundError("User not found");
  }

  user.isActive = true;
  await user.save();

  logger.info("User activated", { userId });

  return user.toSafeObject();
};
