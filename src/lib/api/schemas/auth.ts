import { z } from 'zod';

// ── Auth Schemas ──

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(6),
});
