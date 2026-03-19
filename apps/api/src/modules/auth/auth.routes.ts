import { ROLES } from '@saborreal/shared';
import { Router } from 'express';
import { z } from 'zod';

import { validateBody } from '../../middleware/validate.js';
import {
  devCreateUser,
  login,
  logout,
  refresh,
  register,
  session,
} from './auth.controller.js';

export const authRouter = Router();

const identifierSchema = z
  .string()
  .min(3)
  .max(200)
  .refine((v) => v.includes('@') || /^\+?[0-9][0-9 ()-]{5,}$/.test(v), {
    message: 'identifier must be an email or phone number',
  });

const passwordSchema = z.string().min(8).max(200);

const registerSchema = z.object({
  identifier: identifierSchema,
  password: passwordSchema,
});

const loginSchema = registerSchema;

const devCreateUserSchema = z.object({
  identifier: identifierSchema,
  password: passwordSchema,
  role: z.enum(ROLES),
});

authRouter.post('/register', validateBody(registerSchema), register);
authRouter.post('/login', validateBody(loginSchema), login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
authRouter.get('/session', session);

// DEV ONLY: create admin/motoboy accounts without seeding.
authRouter.post(
  '/dev-create-user',
  validateBody(devCreateUserSchema),
  devCreateUser,
);
