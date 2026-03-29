import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createApiHandler, dbResult } from '@/lib/api';
import { deleteAccountSchema } from '@/lib/api/schemas';
import { auditLog } from '@/lib/api/audit';
import { createAdminClient } from '@/lib/supabase/admin';
import { env } from '@/lib/env';

export const POST = createApiHandler(
  { roles: ['admin'], schema: deleteAccountSchema },
  async ({ user, body, supabase }) => {
    const { password } = body;

    // 1. 비밀번호 확인
    const verifyClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { error: signInError } = await verifyClient.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: '비밀번호가 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();

    // 2. 학원에 소속된 다른 회원 확인 (adminClient로 RLS 우회)
    if (user.academy_id) {
      const { count } = await adminClient
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('academy_id', user.academy_id)
        .eq('is_active', true)
        .neq('id', user.id);

      if (count && count > 0) {
        return NextResponse.json(
          { error: `학원에 ${count}명의 회원이 있습니다. 먼저 모든 회원을 제거한 후 탈퇴해주세요.` },
          { status: 400 },
        );
      }
    }

    // 3. audit log 기록
    await auditLog(supabase, user.id, 'admin.self_delete', {
      type: 'user', id: user.id, details: { email: user.email, academy_id: user.academy_id },
    });

    // 4. 학원 삭제 (CASCADE로 subscriptions, exams 등 정리)
    try {
      if (user.academy_id) {
        dbResult(await adminClient.from('academies').delete().eq('id', user.academy_id));
      }

      // 5. users 테이블 삭제
      dbResult(await adminClient.from('users').delete().eq('id', user.id));

      // 6. auth.users 삭제
      await adminClient.auth.admin.deleteUser(user.id);
    } catch {
      return NextResponse.json(
        { error: '계정 삭제 중 오류가 발생했습니다. 다시 시도해주세요.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  },
);
