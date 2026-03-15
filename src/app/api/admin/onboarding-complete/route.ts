import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';

export const POST = createApiHandler(
  { roles: ['admin', 'boss'], hasBody: false },
  async ({ user, supabase }) => {
    if (!user.academy_id) {
      return NextResponse.json({ error: '학원에 소속되어 있지 않습니다.' }, { status: 400 });
    }
    dbResult(await supabase
      .from('academies')
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq('id', user.academy_id));

    return NextResponse.json({ success: true });
  }
);
