import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

/**
 * 클리닉 배정 다이얼로그용 학생 명단. teacher/admin은 소속 학원, boss는 ?academyId= 로 학원을
 * 지정하지 않으면 전체(무학원 개인 가입자 제외 — 배정 대상은 항상 특정 학원 소속 학생).
 */
export const GET = createApiHandler(
  { roles: [...ADMIN_ROLES] },
  async ({ supabase, user, request }) => {
    const academyId = request.nextUrl.searchParams.get('academyId') || user.academy_id;
    if (!academyId) {
      return NextResponse.json({ error: '학원을 지정해야 합니다.' }, { status: 400 });
    }
    if (user.role !== 'boss' && academyId !== user.academy_id) {
      return NextResponse.json({ error: '다른 학원의 학생은 조회할 수 없습니다.' }, { status: 403 });
    }

    const students = dbResult(await supabase
      .from('users')
      .select('id, full_name')
      .eq('role', 'student')
      .eq('academy_id', academyId)
      .order('full_name')) ?? [];

    return NextResponse.json({ students });
  }
);
