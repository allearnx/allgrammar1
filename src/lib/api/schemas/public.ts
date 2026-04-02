import { z } from 'zod';
import { ID, SHORT, MEDIUM, LONG, URL_STR } from './_shared';

// ── 홈페이지 관리 (Public Pages CRUD) Schemas ──

export const consultationPatchSchema = z.object({
  id: ID,
  status: z.enum(['new', 'contacted', 'enrolled', 'closed']).nullish(),
  memo: MEDIUM.nullish(),
});

export const faqCreateSchema = z.object({
  question: MEDIUM,
  answer: LONG,
  category: z.enum(['general', 'enrollment', 'payment', 'refund']).default('general'),
  display_order: z.number().nullish(),
  is_visible: z.boolean().nullish(),
});

export const faqPatchSchema = z.object({
  id: ID,
  question: MEDIUM.nullish(),
  answer: LONG.nullish(),
  category: z.enum(['general', 'enrollment', 'payment', 'refund']).nullish(),
  display_order: z.number().nullish(),
  is_visible: z.boolean().nullish(),
});

export const reviewCreateSchema = z.object({
  student_grade: SHORT,
  course_name: SHORT,
  content: LONG,
  achievement: SHORT.nullish(),
  display_order: z.number().nullish(),
  is_visible: z.boolean().nullish(),
});

export const reviewPatchSchema = z.object({
  id: ID,
  student_grade: SHORT.nullish(),
  course_name: SHORT.nullish(),
  content: LONG.nullish(),
  achievement: SHORT.nullish(),
  display_order: z.number().nullish(),
  is_visible: z.boolean().nullish(),
});

export const teacherProfileCreateSchema = z.object({
  display_name: SHORT,
  bio: LONG,
  image_url: URL_STR.nullish(),
  image_position: z.enum(['center', 'top', 'bottom']).nullish(),
  is_visible: z.boolean().nullish(),
  sort_order: z.number().nullish(),
});

export const teacherProfilePatchSchema = z.object({
  id: ID,
  display_name: SHORT.nullish(),
  bio: LONG.nullish(),
  image_url: URL_STR.nullish(),
  image_position: z.enum(['center', 'top', 'bottom']).nullish(),
  is_visible: z.boolean().nullish(),
  sort_order: z.number().nullish(),
});

export const courseCreateSchema = z.object({
  title: SHORT,
  category: z.enum(['grammar', 'school_exam', 'international', 'voca', 'reading']).default('grammar'),
  description: LONG.default(''),
  price: z.number().min(0),
  thumbnail_url: URL_STR.nullish(),
  detail_image_url: z.string().max(50000).nullish(),
  teacher_id: ID.nullish(),
  is_active: z.boolean().nullish(),
  sort_order: z.number().nullish(),
});

export const coursePatchSchema = z.object({
  id: ID,
  title: SHORT.nullish(),
  category: z.enum(['grammar', 'school_exam', 'international', 'voca', 'reading']).nullish(),
  description: LONG.nullish(),
  price: z.number().min(0).nullish(),
  thumbnail_url: URL_STR.nullish(),
  detail_image_url: z.string().max(50000).nullish(),
  teacher_id: ID.nullish(),
  is_active: z.boolean().nullish(),
  sort_order: z.number().nullish(),
});
