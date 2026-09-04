import { Category } from "./category.model.js";
import { Food } from "../food/food.model.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { ConflictError } from "../../errors/ConflictError.js";
import { BadRequestError } from "../../errors/BadRequestError.js";
import { logger } from "../../utils/logger.js";
import { generateSlug } from "../../utils/slug.js";

export const createCategory = async (categoryData) => {
  const { name } = categoryData;

  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    throw new ConflictError("Category with this name already exists");
  }

  const slug = generateSlug(name);
  const existingSlug = await Category.findOne({ slug });
  if (existingSlug) {
    throw new ConflictError("Category slug already exists");
  }

  const category = await Category.create({
    ...categoryData,
    slug,
  });

  logger.info("Category created", { categoryId: category._id });

  return category;
};

export const listCategories = async (query) => {
  const {
    page = 1,
    limit = 10,
    isActive,
    sortBy = "displayOrder",
    sortOrder = "asc",
  } = query;

  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === "true";

  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
  const skip = (page - 1) * limit;

  const [categories, total] = await Promise.all([
    Category.find(filter).sort(sort).skip(skip).limit(limit),
    Category.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: categories,
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

export const getCategoryById = async (categoryId) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  return category;
};

export const updateCategory = async (categoryId, updateData) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  if (updateData.name && updateData.name !== category.name) {
    const existingCategory = await Category.findOne({ name: updateData.name });
    if (existingCategory && existingCategory._id.toString() !== categoryId) {
      throw new ConflictError("Category with this name already exists");
    }
    updateData.slug = generateSlug(updateData.name);
  }

  Object.assign(category, updateData);
  await category.save();

  logger.info("Category updated", { categoryId });

  return category;
};

export const deleteCategory = async (categoryId) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  // Check if foods exist in this category
  const foodCount = await Food.countDocuments({ category: categoryId });
  if (foodCount > 0) {
    throw new BadRequestError(
      `Cannot delete category with ${foodCount} foods. Move or delete foods first.`,
    );
  }

  await Category.findByIdAndDelete(categoryId);

  logger.info("Category deleted", { categoryId });

  return true;
};
