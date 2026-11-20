import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),
  HOST: z.string().default('0.0.0.0'),

  // Database (Neon PostgreSQL)
  DATABASE_URL: z.string().url(),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  ARGON2_MEMORY_COST: z.coerce.number().default(19456), // 19 MB
  ARGON2_TIME_COST: z.coerce.number().default(2),
  ARGON2_PARALLELISM: z.coerce.number().default(1),

  // Google Drive
  DRIVE_PUBLIC_BASE_URL: z.string().url().default('https://drive.google.com/uc?export=download&id='),

  // Rate limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isDev = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
export const isProd = env.NODE_ENV === 'production';