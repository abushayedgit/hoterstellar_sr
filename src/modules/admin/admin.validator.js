import { z } from "zod";

export const updateAdminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  role: z.enum(["super_admin", "admin", "manager"]).optional(),
  isActive: z.boolean().optional(),
});

export const adminQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  role: z.enum(["super_admin", "admin", "manager"]).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "email", "name", "lastLoginAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
