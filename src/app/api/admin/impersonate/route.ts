import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const schema = z.object({
  studentId: z.string().uuid(),
});

export const POST = createApiHandler(
  { roles: ['boss', 'admin', 'teacher'], schema },
  async ({ body, request, user }) => {
    const { studentId } = body;
    const adminClient = createAdminClient();

    const { data: student } = await adminClient
      .from('users')
      .select('id, email, role, academy_id')
      .eq('id', studentId)
      .single();

    if (!student) {
      return NextResponse.json({ error: '학생을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (student.role !== 'student') {
      return NextResponse.json({ error: '학생 계정만 대리 로그인할 수 있습니다.' }, { status: 400 });
    }

    // admin은 같은 학원 학생만 조회 가능
    if (user.role !== 'boss' && student.academy_id !== user.academy_id) {
      return NextResponse.json({ error: '다른 학원의 학생은 조회할 수 없습니다.' }, { status: 403 });
    }

    // Magic link 생성
    const { data: linkData, error } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: student.email,
    });

    if (error || !linkData) {
      return NextResponse.json({ error: '로그인 링크 생성에 실패했습니다.' }, { status: 500 });
    }

    // action_link의 redirect_to가 Supabase Site URL(localhost:3000 등)을 사용하므로
    // 요청 origin으로 통째로 교체 (허용된 origin만)
    const rawOrigin = request.headers.get('origin')
      || request.headers.get('referer')?.replace(/\/[^/]*$/, '')
      || '';
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(request.url).origin : '',
      'http://localhost:3000',
    ].filter(Boolean);
    const origin = allowedOrigins.some((o) => rawOrigin === o || rawOrigin.endsWith('.vercel.app'))
      ? rawOrigin
      : new URL(request.url).origin;
    let url = linkData.properties.action_link;
    const parsed = new URL(url);
    parsed.searchParams.set('redirect_to', `${origin}/impersonate`);
    url = parsed.toString();

    return NextResponse.json({
      url,
      studentName: student.email,
    });
  },
);
