import { z } from "zod";

export const createFoodReviewSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  foodId: z.string().min(1, "Food ID is required"),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters")
    .max(2000),
  category: z
    .enum(["food", "service", "ambiance", "overall"])
    .default("overall"),
});

export const createTableReviewSchema = z.object({
  tableBookingId: z.string().optional(), // now optional
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters")
    .max(2000),
  category: z
    .enum(["food", "service", "ambiance", "overall"])
    .default("overall"),
});

export const createEventReviewSchema = z.object({
  eventBookingId: z.string().optional(), // now optional
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters")
    .max(2000),
  category: z
    .enum(["food", "service", "ambiance", "overall", "event"])
    .default("event"),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().min(3).max(200).optional(),
  comment: z.string().min(10).max(2000).optional(),
  category: z
    .enum(["food", "service", "ambiance", "overall", "event"])
    .optional(),
});

export const moderateReviewSchema = z.object({
  isApproved: z.boolean(),
  moderationNote: z.string().max(500).optional().default(""),
});

export const respondToReviewSchema = z.object({
  response: z
    .string()
    .min(5, "Response must be at least 5 characters")
    .max(1000),
});

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  type: z.enum(["food", "table", "event"]).optional(),
  isApproved: z.enum(["true", "false"]).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  foodId: z.string().optional(),
  sortBy: z.enum(["createdAt", "rating", "helpfulVotes"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
