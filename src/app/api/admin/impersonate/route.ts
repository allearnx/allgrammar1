import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const schema = z.object({
  studentId: z.string().uuid(),
});

export const POST = createApiHandler(
  { roles: ['admin', 'boss'], schema },
  async ({ user, body }) => {
    const { studentId } = body;
    const adminClient = createAdminClient();

    // 1. 같은 학원 소속 학생인지 확인
    const { data: student } = await adminClient
      .from('users')
      .select('id, email, academy_id, role')
      .eq('id', studentId)
      .single();

    if (!student) {
      return NextResponse.json({ error: '학생을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (student.academy_id !== user.academy_id) {
      return NextResponse.json({ error: '같은 학원 소속 학생만 조회할 수 있습니다.' }, { status: 403 });
    }

    if (student.role !== 'student') {
      return NextResponse.json({ error: '학생 계정만 대리 로그인할 수 있습니다.' }, { status: 400 });
    }

    // 2. Magic link 생성
    const { data: linkData, error } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: student.email,
    });

    if (error || !linkData) {
      return NextResponse.json({ error: '로그인 링크 생성에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      url: linkData.properties.action_link,
      studentName: student.email,
    });
  },
);
