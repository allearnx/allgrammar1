import { NextResponse } from 'next/server';
import { createApiHandler, NotFoundError } from '@/lib/api';

export const DELETE = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'] },
  async ({ params, supabase }) => {
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

    return NextResponse.json({ success: true });
  }
);
