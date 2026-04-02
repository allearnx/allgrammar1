import { z } from 'zod';

// ── Shared Limits ──
export const ID = z.string().max(100);
export const SHORT = z.string().max(200);
export const MEDIUM = z.string().max(1000);
export const LONG = z.string().max(10000);
export const URL_STR = z.string().max(2000);
