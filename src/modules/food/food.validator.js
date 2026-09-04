import { z } from "zod";

export const createFoodSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(0, "Price must be positive"),
  category: z.string().min(1, "Category is required"),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        fileId: z.string().min(1),
      }),
    )
    .min(1, "At least one image is required"),
  isAvailable: z.boolean().optional().default(true),
  isVegetarian: z.boolean().optional().default(false),
  isSpicy: z.boolean().optional().default(false),
  preparationTime: z.number().int().min(1).optional().default(15),
  ingredients: z.array(z.string()).optional().default([]),
  nutritionalInfo: z
    .object({
      calories: z.number().optional().nullable(),
      protein: z.number().optional().nullable(),
      carbs: z.number().optional().nullable(),
      fat: z.number().optional().nullable(),
    })
    .optional(),
  discount: z.number().min(0).max(100).optional().default(0),
  tags: z.array(z.string()).optional().default([]),
});

export const updateFoodSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  price: z.number().min(0).optional(),
  category: z.string().optional(),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        fileId: z.string().min(1),
      }),
    )
    .optional(),
  isAvailable: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  isSpicy: z.boolean().optional(),
  preparationTime: z.number().int().min(1).optional(),
  ingredients: z.array(z.string()).optional(),
  nutritionalInfo: z
    .object({
      calories: z.number().optional().nullable(),
      protein: z.number().optional().nullable(),
      carbs: z.number().optional().nullable(),
      fat: z.number().optional().nullable(),
    })
    .optional(),
  discount: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
});

export const foodQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  category: z.string().optional(),
  isAvailable: z.enum(["true", "false"]).optional(),
  isVegetarian: z.enum(["true", "false"]).optional(),
  isSpicy: z.enum(["true", "false"]).optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z.enum(["name", "price", "rating", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
