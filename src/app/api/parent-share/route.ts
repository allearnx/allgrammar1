import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireAcademyScope } from '@/lib/api/require-academy-scope';
import { ForbiddenError } from '@/lib/api/errors';

const ALLOWED_ROLES = ['teacher', 'admin', 'boss'];

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const studentId = new URL(request.url).searchParams.get('studentId');
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

  // Deactivate existing active tokens
  await admin
    .from('parent_share_tokens')
    .update({ is_active: false })
    .eq('student_id', studentId)
    .eq('is_active', true);

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
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
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
