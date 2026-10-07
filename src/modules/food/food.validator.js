import { z } from 'zod';

const coercedBoolean = z.preprocess((v) => {
  if (typeof v === 'string') {
    if (v === 'true') return true;
    if (v === 'false') return false;
  }
  return v;
}, z.boolean());

const coercedJson = (schema) =>
  z.preprocess((v) => {
    if (typeof v === 'string' && v.trim() !== '') {
      try {
        return JSON.parse(v);
      } catch {
        return v;
      }
    }
    return v;
  }, schema);

const nutritionalInfoSchema = z.object({
  calories: z.coerce.number().min(0).nullable().optional(),
  protein: z.coerce.number().min(0).nullable().optional(),
  carbs: z.coerce.number().min(0).nullable().optional(),
  fat: z.coerce.number().min(0).nullable().optional(),
});

export const createFoodSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  isAvailable: coercedBoolean.optional().default(true),
  isVegetarian: coercedBoolean.optional().default(false),
  isSpicy: coercedBoolean.optional().default(false),
  preparationTime: z.coerce.number().int().min(1).optional().default(15),
  discount: z.coerce.number().min(0).max(100).optional().default(0),
  ingredients: coercedJson(z.array(z.string())).optional().default([]),
  tags: coercedJson(z.array(z.string())).optional().default([]),
  nutritionalInfo: coercedJson(nutritionalInfoSchema).optional(),
});

export const updateFoodSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  price: z.coerce.number().min(0).optional(),
  category: z.string().optional(),
  isAvailable: coercedBoolean.optional(),
  isVegetarian: coercedBoolean.optional(),
  isSpicy: coercedBoolean.optional(),
  preparationTime: z.coerce.number().int().min(1).optional(),
  discount: z.coerce.number().min(0).max(100).optional(),
  ingredients: coercedJson(z.array(z.string())).optional(),
  tags: coercedJson(z.array(z.string())).optional(),
  nutritionalInfo: coercedJson(nutritionalInfoSchema).optional(),
});

export const foodQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  category: z.string().optional(),
  isAvailable: z.enum(['true', 'false']).optional(),
  isVegetarian: z.enum(['true', 'false']).optional(),
  isSpicy: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['name', 'price', 'rating', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export const imageIdParamSchema = z.object({
  imageId: z
    .string()
    .min(1, 'Image ID is required')
    .max(200, 'Image ID is too long'),
});

export const foodIdParamSchema = z.object({
  id: z.string(),
});
