import { Food } from "./food.model.js";
import { Category } from "../category/category.model.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { ConflictError } from "../../errors/ConflictError.js";
import { BadRequestError } from "../../errors/BadRequestError.js";
import { logger } from "../../utils/logger.js";
import { generateSlug } from "../../utils/slug.js";

export const createFood = async (foodData) => {
  const { name, category } = foodData;

  const existingFood = await Food.findOne({ name });
  if (existingFood) {
    throw new ConflictError("Food with this name already exists");
  }

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    throw new BadRequestError("Category not found");
  }

  const slug = generateSlug(name);
  const existingSlug = await Food.findOne({ slug });
  if (existingSlug) {
    throw new ConflictError("Food slug already exists");
  }

  const food = await Food.create({
    ...foodData,
    slug,
  });

  logger.info("Food created", { foodId: food._id });

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
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter = {};

  if (category) filter.category = category;
  if (isAvailable !== undefined) filter.isAvailable = isAvailable === "true";
  if (isVegetarian !== undefined) filter.isVegetarian = isVegetarian === "true";
  if (isSpicy !== undefined) filter.isSpicy = isSpicy === "true";

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  if (search) {
    filter.$text = { $search: search };
  }

  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
  const skip = (page - 1) * limit;

  const [foods, total] = await Promise.all([
    Food.find(filter)
      .populate("category", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Food.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
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
};

export const getFoodById = async (foodId) => {
  const food = await Food.findById(foodId).populate("category", "name slug");

  if (!food) {
    throw new NotFoundError("Food not found");
  }

  return food;
};

export const updateFood = async (foodId, updateData) => {
  const food = await Food.findById(foodId);

  if (!food) {
    throw new NotFoundError("Food not found");
  }

  if (updateData.name && updateData.name !== food.name) {
    const existingFood = await Food.findOne({ name: updateData.name });
    if (existingFood && existingFood._id.toString() !== foodId) {
      throw new ConflictError("Food with this name already exists");
    }
    updateData.slug = generateSlug(updateData.name);
  }

  if (updateData.category) {
    const categoryExists = await Category.findById(updateData.category);
    if (!categoryExists) {
      throw new BadRequestError("Category not found");
    }
  }

  Object.assign(food, updateData);
  await food.save();

  logger.info("Food updated", { foodId });

  return food;
};

export const deleteFood = async (foodId) => {
  const food = await Food.findById(foodId);

  if (!food) {
    throw new NotFoundError("Food not found");
  }

  await Food.findByIdAndDelete(foodId);

  logger.info("Food deleted", { foodId });

  return true;
};
