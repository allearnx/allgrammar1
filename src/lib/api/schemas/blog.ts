import { z } from 'zod';
import { ID, SHORT, URL_STR } from './_shared';

const BLOG_CATEGORY = z.enum(['grammar_tip', 'study_method', 'exam_prep', 'news', 'general']);

export const blogCreateSchema = z.object({
  slug: z.string().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug은 소문자, 숫자, 하이픈만 가능합니다'),
  title: SHORT,
  excerpt: z.string().max(500).default(''),
  content: z.string().max(200000),
  thumbnail_url: URL_STR.nullish(),
  category: BLOG_CATEGORY.default('general'),
  meta_title: SHORT.nullish(),
  meta_description: z.string().max(300).nullish(),
  is_published: z.boolean().default(false),
  sort_order: z.number().int().default(0),
});

export const blogPatchSchema = z.object({
  id: ID,
  slug: z.string().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).nullish(),
  title: SHORT.nullish(),
  excerpt: z.string().max(500).nullish(),
  content: z.string().max(200000).nullish(),
  thumbnail_url: URL_STR.nullable().optional(),
  category: BLOG_CATEGORY.nullish(),
  meta_title: SHORT.nullable().optional(),
  meta_description: z.string().max(300).nullable().optional(),
  is_published: z.boolean().nullish(),
  sort_order: z.number().int().nullish(),
});

export const blogViewSchema = z.object({
  slug: z.string().max(200),
});
