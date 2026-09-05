import { z } from "zod";

export const createEventBookingSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone is required"),
  email: z.string().email("Valid email is required").optional().default(""),
  eventType: z.enum([
    "wedding",
    "corporate",
    "birthday",
    "anniversary",
    "conference",
    "other",
  ]),
  eventDate: z.string().min(1, "Event date is required"),
  guestCount: z.number().int().min(1).max(500),
  eventDetails: z.string().max(2000).optional().default(""),
  specialRequirements: z.string().max(2000).optional().default(""),
  budgetRange: z
    .enum(["economy", "standard", "premium", "luxury", ""])
    .optional()
    .default(""),
});

export const updateEventBookingSchema = z.object({
  customerName: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional(),
  eventType: z
    .enum([
      "wedding",
      "corporate",
      "birthday",
      "anniversary",
      "conference",
      "other",
    ])
    .optional(),
  eventDate: z.string().optional(),
  guestCount: z.number().int().min(1).max(500).optional(),
  eventDetails: z.string().max(2000).optional(),
  specialRequirements: z.string().max(2000).optional(),
  budgetRange: z
    .enum(["economy", "standard", "premium", "luxury", ""])
    .optional(),
});

export const updateEventBookingStatusSchema = z.object({
  status: z.enum([
    "pending",
    "under_review",
    "quotation_sent",
    "confirmed",
    "deposit_paid",
    "completed",
    "cancelled",
  ]),
  quotationAmount: z.number().min(0).optional(),
  depositAmount: z.number().min(0).optional(),
  note: z.string().max(500).optional().default(""),
});

export const cancelEventBookingSchema = z.object({
  reason: z.string().min(5, "Cancellation reason is required").max(500),
});

export const eventBookingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z
    .enum([
      "pending",
      "under_review",
      "quotation_sent",
      "confirmed",
      "deposit_paid",
      "completed",
      "cancelled",
    ])
    .optional(),
  eventType: z
    .enum([
      "wedding",
      "corporate",
      "birthday",
      "anniversary",
      "conference",
      "other",
    ])
    .optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "eventDate", "guestCount"]).default("eventDate"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});
