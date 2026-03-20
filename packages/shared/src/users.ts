import { z } from 'zod';
import type { Role } from './roles.js';

export type User = {
  id: string;
  email: string | null;
  phone: string | null;
  role: Role;
};

export const createMotoboySchema = z.object({
  identifier: z.string().min(3).max(200),
  password: z.string().min(8).max(200),
  phone: z.string().max(30).optional(),
});

export const updateMotoboySchema = z.object({
  email: z.string().email().max(200).optional(),
  phone: z.string().max(30).optional(),
  password: z.string().min(8).max(200).optional(),
});
