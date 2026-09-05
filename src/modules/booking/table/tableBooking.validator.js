import { z } from "zod";

export const createTableBookingSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone is required"),
  email: z.string().email("Valid email is required").optional().default(""),
  date: z.string().min(1, "Date is required"),
  time: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  guestCount: z.number().int().min(1).max(50),
  tablePreference: z
    .enum(["window", "outdoor", "private", "regular", ""])
    .optional()
    .default(""),
  occasion: z
    .enum([
      "birthday",
      "anniversary",
      "business",
      "date",
      "family",
      "other",
      "",
    ])
    .optional()
    .default(""),
  specialOccasion: z.string().max(200).optional().default(""),
  specialRequests: z.string().max(1000).optional().default(""),
  duration: z.number().int().min(30).max(240).optional().default(90),
});

export const updateTableBookingSchema = z.object({
  customerName: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional(),
  date: z.string().optional(),
  time: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  guestCount: z.number().int().min(1).max(50).optional(),
  tablePreference: z
    .enum(["window", "outdoor", "private", "regular", ""])
    .optional(),
  occasion: z
    .enum([
      "birthday",
      "anniversary",
      "business",
      "date",
      "family",
      "other",
      "",
    ])
    .optional(),
  specialOccasion: z.string().max(200).optional(),
  specialRequests: z.string().max(1000).optional(),
  tableNumber: z.string().optional(),
  duration: z.number().int().min(30).max(240).optional(),
});

export const updateTableBookingStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "seated",
    "completed",
    "cancelled",
    "no_show",
  ]),
  tableNumber: z.string().optional(),
  note: z.string().max(500).optional().default(""),
});

export const cancelTableBookingSchema = z.object({
  reason: z.string().min(5, "Cancellation reason is required").max(500),
});

export const tableBookingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z
    .enum([
      "pending",
      "confirmed",
      "seated",
      "completed",
      "cancelled",
      "no_show",
    ])
    .optional(),
  date: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "date", "time", "guestCount"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});
