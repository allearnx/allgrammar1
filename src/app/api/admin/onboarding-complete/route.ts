import { NextResponse } from 'next/server';
import { createApiHandler, dbResult, ForbiddenError } from '@/lib/api';

export const POST = createApiHandler(
  { roles: ['admin', 'boss'], hasBody: false },
  async ({ user, supabase }) => {
    if (!user.academy_id) {
      throw new ForbiddenError('학원에 소속되어 있지 않습니다.');
    }
    dbResult(await supabase
      .from('academies')
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq('id', user.academy_id));

    return NextResponse.json({ success: true });
  }
);
