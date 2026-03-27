import { NextResponse } from 'next/server';
import { createApiHandler, NotFoundError } from '@/lib/api';
import { requireAcademyScope } from '@/lib/api/require-academy-scope';
import { auditLog } from '@/lib/api/audit';

export const DELETE = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'] },
  async ({ user, params, supabase }) => {
    const { reportId } = params;

    // 리포트의 student_id 조회 후 학원 범위 검증
    const { data: report } = await supabase
      .from('weekly_reports')
      .select('student_id')
      .eq('id', reportId)
      .single();

    if (!report) {
      throw new NotFoundError('리포트를 찾을 수 없습니다.');
    }

    await requireAcademyScope(user, report.student_id, supabase);

    const { data, error } = await supabase
      .from('weekly_reports')
      .delete()
      .eq('id', reportId)
      .select('id')
      .single();

    if (error || !data) {
      throw new NotFoundError('리포트를 찾을 수 없습니다.');
    }

    await auditLog(supabase, user.id, 'report.delete', {
      type: 'report', id: reportId,
    });

    return NextResponse.json({ success: true });
  }
);
