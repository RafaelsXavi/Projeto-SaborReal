import type { RequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from '../../middleware/error.js';
import { requirePgPool } from './auth.pg.js';
import { hashPassword } from './password.js';
import { PgUsersRepo } from './users.repo.js';

const createMotoboySchema = z.object({
  identifier: z.string().min(3).max(200),
  password: z.string().min(8).max(200),
  phone: z.string().max(30).optional(),
});

const updateMotoboySchema = z.object({
  email: z.string().email().max(200).optional(),
  phone: z.string().max(30).optional(),
  password: z.string().min(8).max(200).optional(),
});

function parseIdentifier(raw: string) {
  const v = raw.trim();
  if (v.includes('@'))
    return { email: v.toLowerCase(), phone: null as string | null };
  return { email: null as string | null, phone: v };
}

export const listMotoboys: RequestHandler = async (_req, res, next) => {
  try {
    const pool = requirePgPool();
    const users = new PgUsersRepo(pool);
    const motoboys = await users.listByRole('motoboy');
    res.json({ ok: true, motoboys });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    next(err);
  }
};

export const createMotoboy: RequestHandler = async (req, res, next) => {
  try {
    const pool = requirePgPool();
    const users = new PgUsersRepo(pool);

    const validated = createMotoboySchema.safeParse(req.body);
    if (!validated.success) {
      return next(new AppError('INVALID_INPUT', 400));
    }

    const { identifier, password, phone } = validated.data;
    const id = parseIdentifier(identifier);
    const passwordHash = hashPassword(password);

    const user = await users.create({
      email: id.email,
      phone: phone ?? id.phone,
      passwordHash,
      role: 'motoboy',
    });

    res.status(201).json({
      ok: true,
      motoboy: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    if (
      typeof err === 'object' &&
      err &&
      'code' in err &&
      err.code === '23505'
    ) {
      return next(new AppError('USER_ALREADY_EXISTS', 409));
    }
    next(err);
  }
};

export const updateMotoboy: RequestHandler = async (req, res, next) => {
  try {
    const pool = requirePgPool();
    const users = new PgUsersRepo(pool);
    const raw = req.params.id;
    const motoboyId = typeof raw === 'string' ? raw : null;
    if (!motoboyId) return next(new AppError('INVALID_INPUT', 400));

    const validated = updateMotoboySchema.safeParse(req.body);
    if (!validated.success) {
      return next(new AppError('INVALID_INPUT', 400));
    }

    const { email, phone, password } = validated.data;
    const updated = await users.update(motoboyId, {
      ...(email !== undefined ? { email } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(password ? { passwordHash: hashPassword(password) } : {}),
    });

    if (!updated) {
      return next(new AppError('MOTOBOY_NOT_FOUND', 404));
    }

    res.json({
      ok: true,
      motoboy: {
        id: updated.id,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    if (
      typeof err === 'object' &&
      err &&
      'code' in err &&
      err.code === '23505'
    ) {
      return next(new AppError('USER_ALREADY_EXISTS', 409));
    }
    next(err);
  }
};

export const deleteMotoboy: RequestHandler = async (req, res, next) => {
  try {
    const pool = requirePgPool();
    const users = new PgUsersRepo(pool);
    const raw = req.params.id;
    const motoboyId = typeof raw === 'string' ? raw : null;
    if (!motoboyId) return next(new AppError('INVALID_INPUT', 400));

    const deleted = await users.deleteById(motoboyId, 'motoboy');
    if (!deleted) {
      return next(new AppError('MOTOBOY_NOT_FOUND', 404));
    }

    res.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    next(err);
  }
};
