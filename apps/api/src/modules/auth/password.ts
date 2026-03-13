import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const DEFAULT_N = 16384;
const DEFAULT_R = 8;
const DEFAULT_P = 1;
const DEFAULT_KEYLEN = 32;

type Parsed = {
  n: number;
  r: number;
  p: number;
  keyLen: number;
  salt: Buffer;
  hash: Buffer;
};

function encode(params: Parsed) {
  return [
    'scrypt',
    params.n,
    params.r,
    params.p,
    params.keyLen,
    params.salt.toString('base64url'),
    params.hash.toString('base64url'),
  ].join('$');
}

function decode(value: string): Parsed | null {
  const parts = value.split('$');
  if (parts.length !== 7) return null;
  if (parts[0] !== 'scrypt') return null;

  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const keyLen = Number(parts[4]);
  if (![n, r, p, keyLen].every((x) => Number.isInteger(x) && x > 0))
    return null;

  try {
    const salt = Buffer.from(parts[5] ?? '', 'base64url');
    const hash = Buffer.from(parts[6] ?? '', 'base64url');
    if (salt.length < 8 || hash.length < 16) return null;
    return { n, r, p, keyLen, salt, hash };
  } catch {
    return null;
  }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, DEFAULT_KEYLEN, {
    N: DEFAULT_N,
    r: DEFAULT_R,
    p: DEFAULT_P,
    maxmem: 64 * 1024 * 1024,
  });
  return encode({
    n: DEFAULT_N,
    r: DEFAULT_R,
    p: DEFAULT_P,
    keyLen: DEFAULT_KEYLEN,
    salt,
    hash,
  });
}

export function verifyPassword(password: string, stored: string) {
  const parsed = decode(stored);
  if (!parsed) return false;

  const computed = scryptSync(password, parsed.salt, parsed.keyLen, {
    N: parsed.n,
    r: parsed.r,
    p: parsed.p,
    maxmem: 64 * 1024 * 1024,
  });

  if (computed.length !== parsed.hash.length) return false;
  return timingSafeEqual(computed, parsed.hash);
}
