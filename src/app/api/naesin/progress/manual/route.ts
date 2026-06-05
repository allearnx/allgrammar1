import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAcademyScope } from '@/lib/api/require-academy-scope';
import { invalidateStudent } from '@/lib/cache/invalidate';
import { z } from 'zod';

const TOGGLEABLE_FIELDS = [
  'vocab_completed',
  'passage_completed',
  'dialogue_completed',
  'grammar_completed',
  'problem_completed',
  'mock_exam_completed',
  'round2_passage_completed',
  'round2_dialogue_completed',
] as const;

const manualProgressSchema = z.object({
  studentId: z.string().uuid(),
  unitId: z.string().uuid(),
  field: z.enum(TOGGLEABLE_FIELDS),
  value: z.boolean(),
});

export const PATCH = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: manualProgressSchema },
  async ({ body, user, supabase }) => {
    const { studentId, unitId, field, value } = body;

    await requireAcademyScope(user, studentId, supabase);
    const admin = createAdminClient();

    dbResult(await admin
      .from('naesin_student_progress')
      .upsert(
        { student_id: studentId, unit_id: unitId, [field]: value },
        { onConflict: 'student_id,unit_id' },
      ));

    invalidateStudent(studentId);
    return NextResponse.json({ success: true, field, value });
  },
);
