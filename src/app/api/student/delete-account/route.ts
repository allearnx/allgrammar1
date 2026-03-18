import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createApiHandler, dbResult } from '@/lib/api';
import { deleteAccountSchema } from '@/lib/api/schemas';
import { auditLog } from '@/lib/api/audit';
import { createAdminClient } from '@/lib/supabase/admin';
import { env } from '@/lib/env';

export const POST = createApiHandler(
  { roles: ['student'], schema: deleteAccountSchema },
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

    // 2. audit log 기록 (삭제 전에 기록)
    await auditLog(supabase, user.id, 'student.self_delete', {
      type: 'user', id: user.id, details: { email: user.email },
    });

    // 3. users 테이블 삭제 (CASCADE로 모든 학생 데이터 자동 정리)
    dbResult(await supabase.from('users').delete().eq('id', user.id));

    // 4. auth.users 삭제
    const adminClient = createAdminClient();
    await adminClient.auth.admin.deleteUser(user.id);

    return NextResponse.json({ success: true });
  },
);
