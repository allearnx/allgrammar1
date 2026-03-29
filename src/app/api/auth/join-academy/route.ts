import { NextResponse } from 'next/server';
import { createApiHandler, ValidationError, NotFoundError } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';

export const POST = createApiHandler(
  { roles: ['student', 'teacher'] },
  async ({ user, body }) => {
    const { inviteCode } = body as { inviteCode?: string };

    if (!inviteCode || typeof inviteCode !== 'string') {
      throw new ValidationError('초대 코드를 입력해주세요.');
    }

    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 6 || !/^[A-Z0-9]+$/.test(code)) {
      throw new ValidationError('유효하지 않은 코드 형식입니다.');
    }

    // Already has academy
    if (user.academy_id) {
      return NextResponse.json(
        { error: '이미 학원에 소속되어 있습니다.' },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Find academy by invite code
    const { data: academy, error } = await admin
      .from('academies')
      .select('id, name, max_students')
      .eq('invite_code', code)
      .single();

    if (error || !academy) {
      throw new NotFoundError('유효하지 않은 초대 코드입니다.');
    }

    // Enforce seat limit for students
    if (user.role === 'student' && academy.max_students) {
      const { count } = await admin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('academy_id', academy.id)
        .eq('role', 'student')
        .eq('is_active', true);

      if ((count || 0) >= academy.max_students) {
        throw new ValidationError(
          '학원의 최대 학생 수에 도달했습니다. 관리자에게 문의하세요.',
        );
      }
    }

    // Update user's academy_id
    const { error: updateError } = await admin
      .from('users')
      .update({ academy_id: academy.id })
      .eq('id', user.id);

    if (updateError) {
      throw new Error('학원 연결에 실패했습니다.');
    }

    // Invalidate middleware profile cache
    const response = NextResponse.json({
      success: true,
      academyName: academy.name,
    });
    response.cookies.set('x-user-profile', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  },
);
