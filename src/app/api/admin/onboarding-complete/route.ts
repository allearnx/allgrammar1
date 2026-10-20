import { NextResponse } from 'next/server';
import { createApiHandler, dbResult, ForbiddenError } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';

export const POST = createApiHandler(
  { roles: ['admin', 'boss'], hasBody: false },
  async ({ user }) => {
    if (!user.academy_id) {
      throw new ForbiddenError('학원에 소속되어 있지 않습니다.');
    }
    // 원장의 academies 직접 UPDATE 정책은 119에서 제거 — 서버(admin 클라이언트)가 본인 학원만 갱신
    dbResult(await createAdminClient()
      .from('academies')
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq('id', user.academy_id));

    return NextResponse.json({ success: true });
  }
);
