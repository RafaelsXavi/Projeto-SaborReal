import {
  type CatalogItem,
  createCatalogItemSchema,
  updateCatalogItemSchema,
} from '@saborreal/shared';
import type { RequestHandler } from 'express';
import { AppError } from '../../middleware/error.js';
import * as catalogService from './catalog.service.js';

function isDbConnectionError(err: unknown) {
  const code = (err as { code?: unknown } | null)?.code;
  const errno = (err as { errno?: unknown } | null)?.errno;
  return code === 'ECONNREFUSED' || errno === -4078;
}

export const adminCreateCatalogItem: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const validated = createCatalogItemSchema.safeParse(req.body);
    if (!validated.success) {
      return next(new AppError('INVALID_INPUT', 400));
    }

    const item = await catalogService.adminCreateItem({
      ...validated.data,
      description: validated.data.description ?? '',
      imageUrl: validated.data.imageUrl ?? '',
    });
    res.status(201).json({ ok: true, item });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    if (isDbConnectionError(err)) {
      return next(new AppError('DATABASE_UNAVAILABLE', 503));
    }
    if (err instanceof Error && err.message === 'CATALOG_CATEGORY_NOT_FOUND') {
      return next(new AppError('CATEGORY_NOT_FOUND', 400));
    }
    next(err);
  }
};

export const adminUpdateCatalogItem: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') return next(new AppError('MISSING_ID', 400));

    const validated = updateCatalogItemSchema.safeParse(req.body);
    if (!validated.success) {
      return next(new AppError('INVALID_INPUT', 400));
    }

    const item = await catalogService.adminUpdateItem(
      id,
      validated.data as Partial<Omit<CatalogItem, 'id' | 'categoryName'>>,
    );
    res.json({ ok: true, item });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    if (isDbConnectionError(err)) {
      return next(new AppError('DATABASE_UNAVAILABLE', 503));
    }
    if (err instanceof Error && err.message === 'CATALOG_ITEM_NOT_FOUND') {
      return next(new AppError('NOT_FOUND', 404));
    }
    if (err instanceof Error && err.message === 'CATALOG_CATEGORY_NOT_FOUND') {
      return next(new AppError('CATEGORY_NOT_FOUND', 400));
    }
    next(err);
  }
};

export const adminDeleteCatalogItem: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') return next(new AppError('MISSING_ID', 400));

    await catalogService.adminDeleteItem(id);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    if (isDbConnectionError(err)) {
      return next(new AppError('DATABASE_UNAVAILABLE', 503));
    }
    if (err instanceof Error && err.message === 'CATALOG_ITEM_NOT_FOUND') {
      return next(new AppError('NOT_FOUND', 404));
    }
    next(err);
  }
};
