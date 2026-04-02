import { z } from 'zod';
import { ID, SHORT, MEDIUM, URL_STR } from './_shared';

// ── Boss/Admin Schemas ──

export const academyCreateSchema = z.object({
  name: z.string().min(1).max(100),
});

export const inviteCodeSchema = z.object({
  code: z.string().length(6).regex(/^[A-Z0-9]+$/),
});

export const userPatchSchema = z.object({
  role: z.enum(['student', 'teacher', 'admin', 'boss']).nullish(),
  academy_id: ID.nullish(),
  is_active: z.boolean().nullish(),
});

export const teacherPatchSchema = z.object({
  is_active: z.boolean(),
});

// ── 서비스 배정 Schemas ──

export const serviceAssignmentCreateSchema = z.object({
  studentId: ID,
  service: z.enum(['naesin', 'voca']),
});

export const serviceAssignmentDeleteSchema = z.object({
  studentId: ID,
  service: z.enum(['naesin', 'voca']),
});

export const serviceAssignmentPatchSchema = z.object({
  studentId: ID,
  round2Unlocked: z.boolean(),
});

// ── Academy Settings Schemas ──

export const academySettingsSchema = z.object({
  name: z.string().min(1).max(100).nullish(),
  contact_phone: z.string().max(20).nullish(),
  contact_email: z.string().email().max(200).nullish(),
  address: z.string().max(500).nullish(),
  logo_url: URL_STR.nullish(),
  business_number: z.string().max(20).nullish(),
  naesin_required_rounds: z.number().min(1).max(2).nullish(),
});

export const academyPatchSchema = z.object({
  name: z.string().min(1).max(100).nullish(),
  max_students: z.number().min(1).nullish(),
  services: z.array(z.enum(['naesin', 'voca'])).nullish(),
});

export const studentBulkImportSchema = z.object({
  students: z.array(z.object({
    full_name: z.string().min(1).max(100),
    email: z.string().email().max(200),
    phone: z.string().max(20).nullish(),
  })).min(1).max(100),
  services: z.array(z.enum(['naesin', 'voca'])).nullish(),
});

export const studentBulkAssignSchema = z.object({
  studentIds: z.array(ID).min(1).max(100),
  services: z.array(z.enum(['naesin', 'voca'])).min(1),
  action: z.enum(['assign', 'revoke']),
});

// ── 학원 만들기 (교사->원장 전환) ──

export const createAcademySchema = z.object({
  academyName: z.string().min(1).max(100),
  freeService: z.enum(['naesin', 'voca']),
});
