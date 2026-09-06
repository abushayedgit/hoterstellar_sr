import { z } from "zod";

export const trackVisitorSchema = z.object({
  guestId: z.string().min(1, "Guest ID is required"),
  consentStatus: z.enum(["accepted", "declined"]),
});

export const trackPageViewSchema = z.object({
  guestId: z.string().min(1, "Guest ID is required"),
  page: z.string().min(1, "Page is required"),
  referrer: z.string().optional().default(""),
  ip: z.string().optional().default(""),
  userAgent: z.string().optional().default(""),
});

export const visitorQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  consentStatus: z.enum(["accepted", "declined", "pending"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(["createdAt", "consentStatus"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
