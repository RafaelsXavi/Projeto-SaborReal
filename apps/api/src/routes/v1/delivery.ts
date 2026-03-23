import { Router } from 'express';
import { AppError } from '../../middleware/error.js';
import { quoteDelivery } from '../../modules/delivery/delivery.service.js';

export const deliveryRouter = Router();

deliveryRouter.get('/quote', async (req, res, next) => {
  try {
    const cep = typeof req.query.cep === 'string' ? req.query.cep : '';
    const number =
      typeof req.query.number === 'string' ? req.query.number : '';

    if (!cep || !number) {
      return next(new AppError('INVALID_INPUT', 400));
    }

    try {
      const quote = await quoteDelivery({ cep, number });
      res.json({ ok: true, ...quote });
    } catch (err) {
      if (!(err instanceof Error)) throw err;
      if (err.message === 'INVALID_CEP') return next(new AppError('INVALID_CEP', 400));
      if (err.message === 'CEP_NOT_FOUND') return next(new AppError('CEP_NOT_FOUND', 404));
      if (err.message === 'GEOCODE_NOT_FOUND') return next(new AppError('DELIVERY_ADDRESS_NOT_FOUND', 404));
      if (err.message === 'ROUTE_NOT_FOUND') return next(new AppError('DELIVERY_ROUTE_NOT_FOUND', 404));
      return next(new AppError('DELIVERY_QUOTE_FAILED', 502));
    }
  } catch (err) {
    next(err);
  }
});

