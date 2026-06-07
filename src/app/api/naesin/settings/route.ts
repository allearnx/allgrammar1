import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { settingsSchema } from '@/lib/api/schemas';
import { requireAcademyScope } from '@/lib/api/require-academy-scope';
import { createAdminClient } from '@/lib/supabase/admin';
import { invalidateStudent } from '@/lib/cache/invalidate';

export const POST = createApiHandler(
  { schema: settingsSchema },
  async ({ user, body, supabase }) => {
    const { textbookId, studentId } = body;

    // Teacher/admin/boss can assign for a specific student
    const targetId = studentId && ['teacher', 'admin', 'boss'].includes(user.role)
      ? studentId
      : user.id;

    if (targetId !== user.id) {
      await requireAcademyScope(user, targetId, supabase);
    }

    // Block if textbook already selected
    const { data: existing } = await supabase
      .from('naesin_student_settings')
      .select('textbook_id')
      .eq('student_id', targetId)
      .maybeSingle();

    if (existing?.textbook_id) {
      return NextResponse.json(
        { error: '교과서는 한 번 선택하면 변경할 수 없습니다. 카카오톡 채널로 문의해 주세요.' },
        { status: 400 }
      );
    }

    dbResult(await supabase
      .from('naesin_student_settings')
      .upsert(
        { student_id: targetId, textbook_id: textbookId },
        { onConflict: 'student_id' }
      ));

    // Auto-create default exam assignment with all active units
    const admin = createAdminClient();
    const { data: units } = await admin
      .from('naesin_units')
      .select('id')
      .eq('textbook_id', textbookId)
      .eq('is_active', true)
      .order('sort_order');

    if (units && units.length > 0) {
      await admin
        .from('naesin_exam_assignments')
        .upsert(
          {
            student_id: targetId,
            textbook_id: textbookId,
            exam_round: 1,
            exam_label: '1차 시험',
            unit_ids: units.map((u) => u.id),
          },
          { onConflict: 'student_id,textbook_id,exam_round' }
        );
      invalidateStudent(targetId);
    }

    return NextResponse.json({ success: true });
  }
);
