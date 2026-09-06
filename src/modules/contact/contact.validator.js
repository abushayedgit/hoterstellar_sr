import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  email: z.string().email("Valid email is required"),
  phone: z.string().max(20).optional().default(""),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(300),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000),
  recaptchaToken: z.string().min(1, "reCAPTCHA token is required"),
});

export const updateContactStatusSchema = z.object({
  status: z.enum(["new", "read", "responded", "archived"]),
});

export const contactQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(["new", "read", "responded", "archived"]).optional(),
  isSpam: z.enum(["true", "false"]).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "name", "email"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
