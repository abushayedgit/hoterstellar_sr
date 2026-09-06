import { z } from "zod";

export const analyticsQuerySchema = z.object({
  period: z
    .enum(["daily", "weekly", "monthly", "yearly", "halfYearly"])
    .default("daily"),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  day: z.coerce.number().int().min(1).max(31).optional(),
  foodId: z.string().optional(),
  categoryId: z.string().optional(),
});

export const deleteAnalyticsSchema = z.object({
  code: z.string().length(6, "Confirmation code must be 6 digits"),
});
