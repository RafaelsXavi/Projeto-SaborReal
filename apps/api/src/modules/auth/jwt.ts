import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { ROLES, type Role } from '@saborreal/shared';
import { z } from 'zod';

function base64UrlEncodeJson(value: unknown) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function base64UrlDecodeJson(value: string) {
  const raw = Buffer.from(value, 'base64url').toString('utf8');
  return JSON.parse(raw) as unknown;
}

function hmacSha256Base64Url(secret: string, data: string) {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

function constantTimeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

const jwtHeaderSchema = z.object({
  alg: z.literal('HS256'),
  typ: z.literal('JWT').optional(),
});

const jwtClaimsSchema = z.object({
  iss: z.string().min(1),
  aud: z.string().min(1),
  sub: z.string().min(1),
  role: z.enum(ROLES),
  iat: z.number().int().nonnegative(),
  exp: z.number().int().nonnegative(),
  jti: z.string().min(1),
});

export type AccessTokenClaims = z.infer<typeof jwtClaimsSchema>;

export function signAccessToken(input: {
  secret: string;
  issuer: string;
  audience: string;
  ttlSeconds: number;
  userId: string;
  role: Role;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const iat = Math.floor(now.getTime() / 1000);
  const exp = iat + input.ttlSeconds;

  const header = { alg: 'HS256', typ: 'JWT' as const };
  const payload: AccessTokenClaims = {
    iss: input.issuer,
    aud: input.audience,
    sub: input.userId,
    role: input.role,
    iat,
    exp,
    jti: randomUUID(),
  };

  const encodedHeader = base64UrlEncodeJson(header);
  const encodedPayload = base64UrlEncodeJson(payload);
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = hmacSha256Base64Url(input.secret, signingInput);

  return `${signingInput}.${signature}`;
}

export function verifyAccessToken(input: {
  secret: string;
  issuer: string;
  audience: string;
  token: string;
  now?: Date;
}): AccessTokenClaims {
  const parts = input.token.split('.');
  if (parts.length !== 3) throw new Error('JWT_INVALID_FORMAT');

  const encodedHeader = parts.at(0);
  const encodedPayload = parts.at(1);
  const signature = parts.at(2);
  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error('JWT_INVALID_FORMAT');
  }
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expected = hmacSha256Base64Url(input.secret, signingInput);

  if (!constantTimeEqual(signature, expected)) throw new Error('JWT_BAD_SIG');

  const header = jwtHeaderSchema.parse(base64UrlDecodeJson(encodedHeader));
  if (header.alg !== 'HS256') throw new Error('JWT_UNSUPPORTED_ALG');

  const payload = jwtClaimsSchema.parse(base64UrlDecodeJson(encodedPayload));

  if (payload.iss !== input.issuer) throw new Error('JWT_BAD_ISS');
  if (payload.aud !== input.audience) throw new Error('JWT_BAD_AUD');

  const now = input.now ?? new Date();
  const nowSec = Math.floor(now.getTime() / 1000);
  if (nowSec >= payload.exp) throw new Error('JWT_EXPIRED');

  return payload;
}
