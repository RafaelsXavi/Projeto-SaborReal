import { z } from 'zod';

const boolFromString = z.preprocess((v) => {
  if (typeof v !== 'string') return v;
  const raw = v.trim().toLowerCase();
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return v;
}, z.boolean());

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    LOG_LEVEL: z.string().default('info'),
    TRUST_PROXY: boolFromString.default(false),
    CORS_ORIGINS: z.string().optional(),
  })
  .passthrough();

const parsed = envSchema.parse(process.env);

export const env = {
  NODE_ENV: parsed.NODE_ENV,
  PORT: parsed.PORT,
  LOG_LEVEL: parsed.LOG_LEVEL,
  TRUST_PROXY: parsed.TRUST_PROXY,
  CORS_ORIGINS: (parsed.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
