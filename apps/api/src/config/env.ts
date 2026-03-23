import 'dotenv/config';
import { z } from 'zod';

const boolFromString = z.preprocess((v) => {
  if (typeof v !== 'string') return v;
  const raw = v.trim().toLowerCase();
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return v;
}, z.boolean());

function envWithAliases(src: NodeJS.ProcessEnv) {
  const env = { ...src } as Record<string, string | undefined>;

  // Allow PT-BR aliases (seen in some Vercel setups)
  env.TRUST_PROXY ??= env.PROXY_DE_CONFIANCA;
  env.CORS_ORIGINS ??= env.ORIGENS_CORS;
  env.COOKIE_SAMESITE ??= env.COOKIE_MESITE;
  env.DATABASE_URL ??= env.URL_DO_BANCO_DE_DADOS;

  return env;
}

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    LOG_LEVEL: z.string().default('info'),
    TRUST_PROXY: boolFromString.default(false),
    CORS_ORIGINS: z.string().optional(),

    // Auth (JWT)
    JWT_SECRET: z.string().optional(),
    JWT_ISSUER: z.string().default('saborreal-api'),
    JWT_AUDIENCE: z.string().default('saborreal-web'),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .default(15 * 60),
    ACCESS_TOKEN_COOKIE_NAME: z.string().default('sr_at'),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).default(30),
    REFRESH_TOKEN_COOKIE_NAME: z.string().default('sr_rt'),
    CSRF_COOKIE_NAME: z.string().default('sr_csrf'),
    COOKIE_SAMESITE: z
      .enum(['lax', 'strict', 'none'])
      .optional()
      .transform((v) => (typeof v === 'string' ? v.toLowerCase() : v)),
    COOKIE_DOMAIN: z.string().optional(),
    DEV_AUTH_ENABLED: boolFromString.optional(),

    // DBs
    DATABASE_URL: z.string().url().optional(),
    // Some Postgres providers require TLS; local Docker typically does not.
    PG_SSL: boolFromString.optional(),
    PG_SSL_REJECT_UNAUTHORIZED: boolFromString.optional(),
    MONGO_URI: z.string().optional(),
    MONGO_DB: z.string().default('saborreal'),

    // Diagnostics
    // If set, allows GET /healthz/readyz?token=... to return detailed readiness info even in production.
    READYZ_TOKEN: z.string().optional(),
  })
  .passthrough();

const parsed = envSchema.parse(envWithAliases(process.env));

const devAuthEnabled =
  typeof parsed.DEV_AUTH_ENABLED === 'boolean'
    ? parsed.DEV_AUTH_ENABLED
    : parsed.NODE_ENV !== 'production';

// In production, JWT_SECRET must be explicitly provided.
// In dev/test, allow running without it (fallback is insecure but unblocks DX).
let jwtSecret = parsed.JWT_SECRET;
if (!jwtSecret) {
  if (parsed.NODE_ENV === 'production') {
    throw new Error(
      'Missing JWT_SECRET (required when NODE_ENV=production). Set it to a long random value.',
    );
  }
  jwtSecret = 'dev-insecure-secret';
}

export const env = {
  NODE_ENV: parsed.NODE_ENV,
  PORT: parsed.PORT,
  LOG_LEVEL: parsed.LOG_LEVEL,
  TRUST_PROXY: parsed.TRUST_PROXY,
  CORS_ORIGINS: (parsed.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  JWT_SECRET: jwtSecret,
  JWT_ISSUER: parsed.JWT_ISSUER,
  JWT_AUDIENCE: parsed.JWT_AUDIENCE,
  ACCESS_TOKEN_TTL_SECONDS: parsed.ACCESS_TOKEN_TTL_SECONDS,
  ACCESS_TOKEN_COOKIE_NAME: parsed.ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_TTL_DAYS: parsed.REFRESH_TOKEN_TTL_DAYS,
  REFRESH_TOKEN_COOKIE_NAME: parsed.REFRESH_TOKEN_COOKIE_NAME,
  CSRF_COOKIE_NAME: parsed.CSRF_COOKIE_NAME,
  COOKIE_SAMESITE: parsed.COOKIE_SAMESITE ?? 'lax',
  COOKIE_DOMAIN: parsed.COOKIE_DOMAIN,
  DEV_AUTH_ENABLED: devAuthEnabled,

  DATABASE_URL: parsed.DATABASE_URL,
  PG_SSL: parsed.PG_SSL ?? false,
  PG_SSL_REJECT_UNAUTHORIZED: parsed.PG_SSL_REJECT_UNAUTHORIZED ?? true,
  MONGO_URI: parsed.MONGO_URI,
  MONGO_DB: parsed.MONGO_DB,

  READYZ_TOKEN: parsed.READYZ_TOKEN,
};
