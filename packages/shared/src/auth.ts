import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(3).max(200),
  password: z.string().min(8).max(200),
});

export const registerSchema = z.object({
  identifier: z.string().min(3).max(200),
  password: z.string().min(8).max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
