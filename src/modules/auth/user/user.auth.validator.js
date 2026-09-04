import { z } from "zod";

export const userSignupSchema = z.object({
  email: z.string().email("Valid email is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Valid phone number is required"),
  district: z.string().optional().default(""),
  area: z.string().optional().default(""),
  address: z.string().optional().default(""),
  gender: z.enum(["male", "female", "other", ""]).optional().default(""),
  age: z.number().int().min(0).max(150).optional().nullable(),
});

export const userSignupVerifySchema = z.object({
  email: z.string().email("Valid email is required"),
  code: z.string().length(6, "OTP must be 6 digits"),
});

export const userSigninSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const userSigninVerifySchema = z.object({
  email: z.string().email("Valid email is required"),
  code: z.string().length(6, "OTP must be 6 digits"),
});

export const userRefreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const updateUserProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().min(10, "Valid phone number is required").optional(),
  district: z.string().optional(),
  area: z.string().optional(),
  address: z.string().optional(),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  age: z.number().int().min(0).max(150).optional().nullable(),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional(),
  joinedAfter: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "name", "email", "joinedAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
