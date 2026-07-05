import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireAcademyScope } from '@/lib/api/require-academy-scope';
import { ForbiddenError } from '@/lib/api/errors';

const ALLOWED_ROLES = ['teacher', 'admin', 'boss', 'student'];

/** 학생은 본인 것만, 스태프는 자기 학원 학생만. 통과 시 대상 studentId 반환 */
async function resolveStudentId(
  user: Awaited<ReturnType<typeof getUser>> & object,
  requestedId: string | null,
): Promise<string | NextResponse> {
  // 셀프스터디 학생: 선생님 없이 본인 링크 직접 발급
  if (user.role === 'student') return user.id;

  if (!requestedId) {
    return NextResponse.json({ error: 'studentId가 필요합니다.' }, { status: 400 });
  }
  try {
    const supabase = await createClient();
    await requireAcademyScope(user, requestedId, supabase);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }
  return requestedId;
}

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const resolved = await resolveStudentId(user, new URL(request.url).searchParams.get('studentId'));
  if (resolved instanceof NextResponse) return resolved;
  const studentId = resolved;

  const admin = createAdminClient();
  const { data } = await admin
    .from('parent_share_tokens')
    .select('token')
    .eq('student_id', studentId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ token: data?.token || null });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const resolved = await resolveStudentId(user, body.studentId ?? null);
  if (resolved instanceof NextResponse) return resolved;
  const studentId = resolved;

  const admin = createAdminClient();

  // 학생 셀프 발급은 get-or-create — 재클릭해도 기존 링크 유지 (부모가 저장한 링크가 끊기지 않게).
  // 스태프는 회전(기존 무효화 + 새 토큰) 유지 — 링크 재발급이 목적인 동선이므로.
  if (user.role === 'student') {
    const { data: existing } = await admin
      .from('parent_share_tokens')
      .select('token')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing?.token) return NextResponse.json({ token: existing.token });
  } else {
    // Deactivate existing active tokens
    await admin
      .from('parent_share_tokens')
      .update({ is_active: false })
      .eq('student_id', studentId)
      .eq('is_active', true);
  }

  // Create new token
  const { data, error } = await admin
    .from('parent_share_tokens')
    .insert({
      student_id: studentId,
      created_by: user.id,
    })
    .select('token')
    .single();

  if (error) {
    return NextResponse.json({ error: '토큰 생성 실패' }, { status: 500 });
  }

  return NextResponse.json({ token: data.token });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  // 비활성화는 스태프 전용 (학생이 실수로 학부모 링크를 끊는 것 방지)
  if (!user || !['teacher', 'admin', 'boss'].includes(user.role)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const body = await request.json();
  const studentId = body.studentId;
  if (!studentId) {
    return NextResponse.json({ error: 'studentId가 필요합니다.' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    await requireAcademyScope(user, studentId, supabase);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  const admin = createAdminClient();

  await admin
    .from('parent_share_tokens')
    .update({ is_active: false })
    .eq('student_id', studentId)
    .eq('is_active', true);

  return NextResponse.json({ success: true });
}
