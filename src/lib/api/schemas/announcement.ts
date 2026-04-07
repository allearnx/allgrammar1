import { z } from 'zod';
import { ID, SHORT, LONG } from './_shared';

export const announcementCreateSchema = z.object({
  title: SHORT,
  content: LONG,
  type: z.enum(['info', 'warning', 'important']).default('info'),
  target_roles: z.array(z.enum(['admin', 'teacher'])).min(1),
  is_published: z.boolean().default(false),
});

export const announcementPatchSchema = z.object({
  id: ID,
  title: SHORT.nullish(),
  content: LONG.nullish(),
  type: z.enum(['info', 'warning', 'important']).nullish(),
  target_roles: z.array(z.enum(['admin', 'teacher'])).min(1).nullish(),
  is_published: z.boolean().nullish(),
});

export const announcementReadSchema = z.object({
  announcementId: ID,
});
