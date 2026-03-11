import { NextResponse } from 'next/server';
import { createApiHandler, NotFoundError } from '@/lib/api';
import { auditLog } from '@/lib/api/audit';

export const DELETE = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'] },
  async ({ user, params, supabase }) => {
    const { reportId } = params;

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
