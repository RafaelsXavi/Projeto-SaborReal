import { Router } from 'express';
import { healthRouter } from './health.js';
import { v1Router } from './v1/index.js';

export const routes = Router();

routes.use('/healthz', healthRouter);
routes.use('/v1', v1Router);
