import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  CORS_ORIGIN: z.string().default('*'),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  DATABASE_URL: z.string().default('sqlite://dev.db'),
  REDIS_URL: z.string().optional(),
  REDIS_CLUSTER_NODES: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  ENABLE_SWAGGER: z.string().transform(v => v !== 'false').default('true')
});

export const env = EnvSchema.parse(process.env);
