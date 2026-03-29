import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const schema = z.object({
  studentId: z.string().uuid(),
});

export const POST = createApiHandler(
  { roles: ['boss'], schema },
  async ({ body, request }) => {
    const { studentId } = body;
    const adminClient = createAdminClient();

    // boss는 모든 학원 학생 조회 가능
    const { data: student } = await adminClient
      .from('users')
      .select('id, email, role')
      .eq('id', studentId)
      .single();

    if (!student) {
      return NextResponse.json({ error: '학생을 찾을 수 없습니다.' }, { status: 404 });
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

    // action_link의 redirect_to가 Supabase Site URL(localhost)을 사용할 수 있으므로
    // 요청 origin으로 교체
    const origin = request.headers.get('origin') || request.headers.get('referer')?.replace(/\/+$/, '') || '';
    let url = linkData.properties.action_link;
    if (origin && url.includes('redirect_to=')) {
      const parsed = new URL(url);
      const redirectTo = parsed.searchParams.get('redirect_to');
      if (redirectTo) {
        try {
          const redirectParsed = new URL(redirectTo);
          const originParsed = new URL(origin);
          redirectParsed.protocol = originParsed.protocol;
          redirectParsed.host = originParsed.host;
          parsed.searchParams.set('redirect_to', redirectParsed.toString());
          url = parsed.toString();
        } catch {
          // URL 파싱 실패 시 원본 유지
        }
      }
    }

    return NextResponse.json({
      url,
      studentName: student.email,
    });
  },
);
