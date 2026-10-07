import { Food } from './food.model.js';
import { Category } from '../category/category.model.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { BadRequestError } from '../../errors/BadRequestError.js';
import { logger } from '../../utils/logger.js';
import { generateSlug } from '../../utils/slug.js';
import { getCache, setCache, deleteCache } from '../../utils/cache.js';
import { uploadToImageKit, deleteFromImageKit } from '../../config/storage.js';

import { emitAdminEvent } from '../../utils/socketEmitter.js';
import { SOCKET_EVENTS } from '../../constants/socketEvents.js';

let trackedFoodCacheKeys = new Set();

const invalidateAllFoodCaches = async () => {
  for (const key of trackedFoodCacheKeys) {
    await deleteCache(key);
  }
  trackedFoodCacheKeys.clear();
};

export const createFood = async (foodData, imageFiles) => {
  const { name, category } = foodData;

  if (!imageFiles || imageFiles.length === 0) {
    throw new BadRequestError('At least one image is required');
  }

  const existingFood = await Food.findOne({ name });
  if (existingFood) {
    throw new ConflictError('Food with this name already exists');
  }

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    throw new BadRequestError('Category not found');
  }

  const slug = generateSlug(name);
  const existingSlug = await Food.findOne({ slug });
  if (existingSlug) {
    throw new ConflictError('Food slug already exists');
  }

  // Upload images to ImageKit
  const uploadedImages = [];
  for (const file of imageFiles) {
    const fileName = `food-${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const result = await uploadToImageKit(file.buffer, fileName, 'foods');
    uploadedImages.push({ url: result.url, fileId: result.fileId });
  }

  const food = await Food.create({
    ...foodData,
    slug,
    images: uploadedImages,
  });

  await invalidateAllFoodCaches();

  logger.info('Food created', { foodId: food._id });

  emitAdminEvent(SOCKET_EVENTS.FOOD_CREATED, {
    foodId: food._id,
    name: food.name,
    slug: food.slug,
    price: food.price,
  });

  return food;
};

export const listFoods = async (query) => {
  const {
    page = 1,
    limit = 10,
    category,
    isAvailable,
    isVegetarian,
    isSpicy,
    search,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const cacheKey = `cache:foods:public:${page}:${limit}:${category || ''}:${isAvailable || ''}:${isVegetarian || ''}:${isSpicy || ''}:${search || ''}:${minPrice || ''}:${maxPrice || ''}:${sortBy}:${sortOrder}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return cached;
  }

  const filter = {};

  if (category) filter.category = category;
  if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
  if (isVegetarian !== undefined) filter.isVegetarian = isVegetarian === 'true';
  if (isSpicy !== undefined) filter.isSpicy = isSpicy === 'true';

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  if (search) {
    filter.$text = { $search: search };
  }

  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
  const skip = (page - 1) * limit;

  const [foods, total] = await Promise.all([
    Food.find(filter)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Food.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  const data = {
    data: foods,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };

  trackedFoodCacheKeys.add(cacheKey);
  await setCache(cacheKey, data, 60);

  return data;
};

export const getFoodById = async (foodId) => {
  const cacheKey = `cache:foods:${foodId}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return cached;
  }

  const food = await Food.findById(foodId).populate('category', 'name slug');

  if (!food) {
    throw new NotFoundError('Food not found');
  }

  const foodData = food.toJSON();
  await setCache(cacheKey, foodData, 300);

  return foodData;
};

// ============================================================
// UPDATE FOOD — Appends new images, never deletes existing ones
// ============================================================
export const updateFood = async (foodId, updateData, imageFiles) => {
  const food = await Food.findById(foodId);

  if (!food) {
    throw new NotFoundError('Food not found');
  }

  // ---------- Name change → new slug ----------
  if (updateData.name && updateData.name !== food.name) {
    const existingFood = await Food.findOne({ name: updateData.name });
    if (existingFood && existingFood._id.toString() !== foodId) {
      throw new ConflictError('Food with this name already exists');
    }
    updateData.slug = generateSlug(updateData.name);
  }

  // ---------- Category existence check ----------
  if (updateData.category) {
    const categoryExists = await Category.findById(updateData.category);
    if (!categoryExists) {
      throw new BadRequestError('Category not found');
    }
  }

  // ---------- Append new images (never replace) ----------
  if (imageFiles && imageFiles.length > 0) {
    const MAX_IMAGES_PER_FOOD = 8;
    const currentCount = food.images.length;
    const incomingCount = imageFiles.length;

    if (currentCount + incomingCount > MAX_IMAGES_PER_FOOD) {
      throw new BadRequestError(
        `Cannot add ${incomingCount} image(s). Max ${MAX_IMAGES_PER_FOOD} images per food. Currently has ${currentCount}.`,
      );
    }

    const uploadedImages = [];

    try {
      for (const file of imageFiles) {
        const fileName = `food-${food.slug}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        const result = await uploadToImageKit(file.buffer, fileName, 'foods');
        uploadedImages.push({ url: result.url, fileId: result.fileId });
      }
    } catch (error) {
      // Rollback uploaded images if any upload failed mid-way
      for (const img of uploadedImages) {
        await deleteFromImageKit(img.fileId).catch(() => {});
      }
      logger.error('Image upload failed during food update', {
        foodId,
        error: error.message,
      });
      throw new BadRequestError('Failed to upload images. Please try again.');
    }

    // Append to existing images — do NOT overwrite
    food.images.push(...uploadedImages);
  }

  // ---------- Apply other field updates ----------
  // Remove images from updateData so it can't accidentally overwrite
  const { images: _ignoredImages, ...safeUpdateData } = updateData;
  Object.assign(food, safeUpdateData);

  await food.save();

  await deleteCache(`cache:foods:${foodId}`);
  await invalidateAllFoodCaches();

  logger.info('Food updated', {
    foodId,
    addedImages: imageFiles?.length || 0,
    totalImages: food.images.length,
  });

  emitAdminEvent(SOCKET_EVENTS.FOOD_UPDATED, {
    foodId,
    name: food.name,
    slug: food.slug,
    price: food.price,
  });

  return food;
};

// ============================================================
// DELETE SPECIFIC IMAGE — Remove one image from food
// ============================================================
const MIN_IMAGES_PER_FOOD = 1;

export const deleteSpecificImage = async (foodId, imageId) => {
  const food = await Food.findById(foodId);

  if (!food) {
    throw new NotFoundError('Food not found');
  }

  // Prevent leaving food with zero images
  if (food.images.length <= MIN_IMAGES_PER_FOOD) {
    throw new BadRequestError(
      `Cannot delete the last image. Food must have at least ${MIN_IMAGES_PER_FOOD} image.`,
    );
  }

  const imageIndex = food.images.findIndex((img) => img.fileId === imageId);

  if (imageIndex === -1) {
    throw new NotFoundError('Image not found on this food');
  }

  // Step 1: Remove from array
  const [removedImage] = food.images.splice(imageIndex, 1);

  // Step 2: Save DB FIRST (source of truth)
  await food.save();

  // Step 3: THEN delete from ImageKit (after DB success)
  try {
    await deleteFromImageKit(removedImage.fileId);
  } catch (error) {
    // Non-fatal — image is removed from DB. Log and continue.
    logger.warn('Failed to delete image from ImageKit', {
      foodId,
      imageId: removedImage.fileId,
      error: error.message,
    });
  }

  await deleteCache(`cache:foods:${foodId}`);
  await invalidateAllFoodCaches();

  logger.info('Image deleted from food', {
    foodId,
    imageId,
    remainingImages: food.images.length,
  });

  emitAdminEvent(SOCKET_EVENTS.FOOD_UPDATED, {
    foodId,
    name: food.name,
    slug: food.slug,
    price: food.price,
  });

  return food.images;
};

export const deleteFood = async (foodId) => {
  const food = await Food.findById(foodId);

  if (!food) {
    throw new NotFoundError('Food not found');
  }

  // Delete images from ImageKit
  for (const image of food.images) {
    await deleteFromImageKit(image.fileId);
  }

  await Food.findByIdAndDelete(foodId);

  await deleteCache(`cache:foods:${foodId}`);
  await invalidateAllFoodCaches();

  emitAdminEvent(SOCKET_EVENTS.FOOD_DELETED, {
    foodId,
  });

  logger.info('Food deleted', { foodId });

  return true;
};
