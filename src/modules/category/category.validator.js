import { z } from 'zod';

const coercedBoolean = z.preprocess((v) => {
  if (typeof v === 'string') {
    if (v === 'true') return true;
    if (v === 'false') return false;
  }
  return v;
}, z.boolean());

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional().default(''),
  image: z.string().optional().default(''),
  imageId: z.string().optional().default(''),
  isActive: coercedBoolean.optional().default(true),
  displayOrder: z.coerce.number().int().optional().default(0),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  imageId: z.string().optional(),
  isActive: coercedBoolean.optional(),
  displayOrder: z.coerce.number().int().optional(),
});

export const categoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  isActive: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['name', 'displayOrder', 'createdAt']).default('displayOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
