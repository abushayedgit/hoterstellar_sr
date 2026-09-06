import { Category } from "./category.model.js";
import { Food } from "../food/food.model.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { ConflictError } from "../../errors/ConflictError.js";
import { BadRequestError } from "../../errors/BadRequestError.js";
import { logger } from "../../utils/logger.js";
import { generateSlug } from "../../utils/slug.js";
import { getCache, setCache, deleteCache } from "../../utils/cache.js";
import { uploadToImageKit, deleteFromImageKit } from "../../config/storage.js";

let trackedCategoryCacheKeys = new Set();

const invalidateAllCategoryCaches = async () => {
  for (const key of trackedCategoryCacheKeys) {
    await deleteCache(key);
  }
  trackedCategoryCacheKeys.clear();
};

export const createCategory = async (categoryData, imageFile) => {
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

  let image = "";
  let imageId = "";

  if (imageFile) {
    const fileName = `category-${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const result = await uploadToImageKit(
      imageFile.buffer,
      fileName,
      "categories",
    );
    image = result.url;
    imageId = result.fileId;
  }

  const category = await Category.create({
    ...categoryData,
    slug,
    image,
    imageId,
  });

  await invalidateAllCategoryCaches();

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

  const cacheKey = `cache:categories:public:${page}:${limit}:${isActive || ""}:${sortBy}:${sortOrder}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return cached;
  }

  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === "true";

  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
  const skip = (page - 1) * limit;

  const [categories, total] = await Promise.all([
    Category.find(filter).sort(sort).skip(skip).limit(limit),
    Category.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  const data = {
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

  trackedCategoryCacheKeys.add(cacheKey);
  await setCache(cacheKey, data, 600);

  return data;
};

export const getCategoryById = async (categoryId) => {
  const cacheKey = `cache:categories:${categoryId}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return cached;
  }

  const category = await Category.findById(categoryId);

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  const categoryData = category.toJSON();
  await setCache(cacheKey, categoryData, 600);

  return categoryData;
};

export const updateCategory = async (categoryId, updateData, imageFile) => {
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

  // Replace image if new one uploaded
  if (imageFile) {
    // Delete old image
    if (category.imageId) {
      await deleteFromImageKit(category.imageId);
    }

    // Upload new image
    const fileName = `category-${category.slug || "update"}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const result = await uploadToImageKit(
      imageFile.buffer,
      fileName,
      "categories",
    );
    category.image = result.url;
    category.imageId = result.fileId;
  }

  Object.assign(category, updateData);
  await category.save();

  await deleteCache(`cache:categories:${categoryId}`);
  await invalidateAllCategoryCaches();

  logger.info("Category updated", { categoryId });

  return category;
};

export const deleteCategory = async (categoryId) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  const foodCount = await Food.countDocuments({ category: categoryId });
  if (foodCount > 0) {
    throw new BadRequestError(
      `Cannot delete category with ${foodCount} foods. Move or delete foods first.`,
    );
  }

  // Delete image from ImageKit
  if (category.imageId) {
    await deleteFromImageKit(category.imageId);
  }

  await Category.findByIdAndDelete(categoryId);

  await deleteCache(`cache:categories:${categoryId}`);
  await invalidateAllCategoryCaches();

  logger.info("Category deleted", { categoryId });

  return true;
};
