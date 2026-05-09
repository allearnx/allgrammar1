import { z } from 'zod';

// ── Shared Limits ──
export const ID = z.string().trim().max(100);
export const SHORT = z.string().trim().max(200);
export const MEDIUM = z.string().trim().max(1000);
export const LONG = z.string().trim().max(10000);
export const URL_STR = z.string().trim().max(2000);
