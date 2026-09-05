import { z } from "zod";

export const createOrderSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone is required"),
  email: z.string().email("Valid email is required").optional().default(""),
  address: z
    .object({
      street: z.string().min(1, "Street is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().optional().default(""),
      zipCode: z.string().optional().default(""),
      country: z.string().optional().default("Bangladesh"),
    })
    .optional(),
  orderType: z.enum(["pickup", "delivery", "dine_in"]),
  paymentMethod: z.enum(["cash", "card", "online"]),
  specialInstructions: z.string().max(1000).optional().default(""),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "out_for_delivery",
    "delivered",
    "completed",
    "cancelled",
  ]),
  note: z.string().max(500).optional().default(""),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(5, "Cancellation reason is required").max(500),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z
    .enum([
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "out_for_delivery",
      "delivered",
      "completed",
      "cancelled",
    ])
    .optional(),
  orderType: z.enum(["pickup", "delivery", "dine_in"]).optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "totalAmount", "orderNumber"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
