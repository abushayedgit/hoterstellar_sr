import { z } from "zod";

export const addToCartSchema = z.object({
  foodId: z.string().min(1, "Food ID is required"),
  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .max(20, "Maximum 20 per item"),
  specialInstructions: z
    .string()
    .max(500, "Instructions too long")
    .optional()
    .default(""),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .max(20, "Maximum 20 per item"),
  specialInstructions: z.string().max(500, "Instructions too long").optional(),
});

export const mergeCartSchema = z.object({
  items: z
    .array(
      z.object({
        foodId: z.string().min(1, "Food ID is required"),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .max(50, "Maximum 50 items in cart"),
});

export const removeCartItemSchema = z.object({
  foodId: z.string().min(1, "Food ID is required"),
});
