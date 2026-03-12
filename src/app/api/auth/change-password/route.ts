import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createApiHandler } from '@/lib/api';
import { changePasswordSchema } from '@/lib/api/schemas';
import { env } from '@/lib/env';

export const POST = createApiHandler(
  { schema: changePasswordSchema },
  async ({ user, body }) => {
    const { oldPassword, newPassword } = body;

    // 1. 현재 비밀번호 확인 — 별도 클라이언트로 signIn 시도
    const verifyClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { error: signInError } = await verifyClient.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { error: '현재 비밀번호가 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    // 2. 새 비밀번호로 업데이트 (admin client)
    const adminClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      { password: newPassword },
    );

    if (updateError) {
      return NextResponse.json(
        { error: '비밀번호 변경에 실패했습니다.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  },
);
