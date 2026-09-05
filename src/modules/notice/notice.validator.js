import { z } from 'zod';

export const createNoticeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(300),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  cause: z.string().max(500).optional().default(''),
  day: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  thumbnail: z.string().optional().default(''),
  thumbnailId: z.string().optional().default(''),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export const updateNoticeSchema = z.object({
  title: z.string().min(3).max(300).optional(),
  content: z.string().min(10).optional(),
  cause: z.string().max(500).optional(),
  day: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  thumbnail: z.string().optional(),
  thumbnailId: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export const noticeQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['createdAt', 'publishedAt', 'title']).default('publishedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
