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

    // 교과서 변경 정책:
    // - 학생 본인: 한 번 선택하면 변경 불가 (기존 정책 유지)
    // - teacher/admin/boss: 변경 허용 — /api/naesin/* 게이트가 teacher/admin을
    //   naesin_enabled 학원(올라영)으로 제한하므로 외부 학원 스태프는 여기 못 옴
    const { data: existing } = await supabase
      .from('naesin_student_settings')
      .select('textbook_id')
      .eq('student_id', targetId)
      .maybeSingle();

    const isStaff = ['teacher', 'admin', 'boss'].includes(user.role);
    if (existing?.textbook_id && !isStaff) {
      return NextResponse.json(
        { error: '교과서는 한 번 선택하면 변경할 수 없습니다. 선생님께 문의해 주세요.' },
        { status: 400 }
      );
    }
    if (existing?.textbook_id === textbookId) {
      return NextResponse.json({ success: true });
    }

    dbResult(await supabase
      .from('naesin_student_settings')
      .upsert(
        { student_id: targetId, textbook_id: textbookId },
        { onConflict: 'student_id' }
      ));
    invalidateStudent(targetId);

    // Auto-create default exam assignment (paid academies only)
    const admin = createAdminClient();
    const { data: student } = await admin
      .from('users')
      .select('academy_id')
      .eq('id', targetId)
      .single();

    if (student?.academy_id) {
      const { data: sub } = await admin
        .from('subscriptions')
        .select('status, tier')
        .eq('academy_id', student.academy_id)
        .in('status', ['trialing', 'active', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const isPaid = sub && sub.tier !== 'free';

      if (isPaid) {
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
      }
    }

    return NextResponse.json({ success: true });
  }
);
