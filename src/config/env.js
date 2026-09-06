import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "staging", "production"])
    .default("development"),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  ADMIN_JWT_SECRET: z
    .string()
    .min(32, "ADMIN_JWT_SECRET must be at least 32 characters"),
  ADMIN_ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),

  USER_JWT_SECRET: z
    .string()
    .min(32, "USER_JWT_SECRET must be at least 32 characters"),
  USER_ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),

  ADMIN_REFRESH_COOKIE_NAME: z.string().default("admin_refresh_token"),
  USER_REFRESH_COOKIE_NAME: z.string().default("user_refresh_token"),

  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  CLIENT_PUBLIC_URL: z.string().url().default("http://localhost:3000"),
  CLIENT_DASHBOARD_URL: z.string().url().default("http://localhost:3001"),

  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  UPSTASH_REDIS_NATIVE_URL: z.string().optional(),

  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().email().optional(),
  BREVO_SENDER_NAME: z.string().optional(),

  IMAGEKIT_PUBLIC_KEY: z.string().optional(),
  IMAGEKIT_PRIVATE_KEY: z.string().optional(),
  IMAGEKIT_URL_ENDPOINT: z.string().url().optional(),

  RECAPTCHA_SECRET_KEY: z.string().optional(),
  RECAPTCHA_SITE_KEY: z.string().optional(),

  BUSINESS_TIMEZONE: z.string().default("UTC"),

  ADMIN_SEED_EMAIL: z.string().email().optional(),
  ADMIN_SEED_PASSWORD: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const corsOrigins = parsed.data.CORS_ORIGINS.split(",").map((origin) =>
  origin.trim(),
);

export const env = {
  ...parsed.data,
  CORS_ORIGINS: corsOrigins,
};
