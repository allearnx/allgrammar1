import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { settingsSchema } from '@/lib/api/schemas';
import { requireAcademyScope } from '@/lib/api/require-academy-scope';

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
    return NextResponse.json({ success: true });
  }
);
