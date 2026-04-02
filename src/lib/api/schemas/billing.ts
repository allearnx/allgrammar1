import { z } from 'zod';
import { ID, SHORT, MEDIUM } from './_shared';

// ── 결제/구독 Schemas ──

export const subscriptionPlanCreateSchema = z.object({
  name: SHORT,
  target: z.enum(['academy', 'individual']),
  services: z.array(z.enum(['naesin', 'voca'])).min(1),
  price_per_unit: z.number().min(0),
  min_students: z.number().min(1).nullish(),
  description: MEDIUM.nullish(),
  sort_order: z.number().nullish(),
});

export const subscriptionPlanPatchSchema = z.object({
  id: ID,
  name: SHORT.nullish(),
  services: z.array(z.enum(['naesin', 'voca'])).min(1).nullish(),
  price_per_unit: z.number().min(0).nullish(),
  min_students: z.number().min(1).nullish(),
  description: MEDIUM.nullish(),
  is_active: z.boolean().nullish(),
  sort_order: z.number().nullish(),
});

export const billingRegisterCardSchema = z.object({
  authKey: z.string().min(1),
  customerKey: z.string().min(1),
});

export const subscriptionCancelSchema = z.object({
  subscriptionId: ID,
});

export const paymentConfirmSchema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().int().min(100),
  orderName: z.string().min(1),
  courseId: z.string().uuid().optional(),
});

// ── 업그레이드 결제 Schemas ──

export const upgradePlanSchema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().int().min(100),
  planId: z.string().uuid(),
});
