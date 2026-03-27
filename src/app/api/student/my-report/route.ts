import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildStudentReport } from '@/lib/reports/build-student-report';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  let targetStudentId: string;
  let services: ('naesin' | 'voca')[] = [];
  let user: Awaited<ReturnType<typeof getUser>> = null;

  if (token) {
    // Token-based access (parent share)
    const admin = createAdminClient();
    const { data: tokenRow } = await admin
      .from('parent_share_tokens')
      .select('student_id')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (!tokenRow) {
      return NextResponse.json({ error: '유효하지 않은 링크입니다.' }, { status: 404 });
    }
    targetStudentId = tokenRow.student_id;

    const { data: svcData } = await admin
      .from('service_assignments')
      .select('service')
      .eq('student_id', targetStudentId);
    services = (svcData || []).map((s) => s.service as 'naesin' | 'voca');
  } else {
    // Authenticated access
    user = await getUser();
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const studentIdParam = searchParams.get('studentId');

    if (user.role === 'student') {
      targetStudentId = user.id;
    } else if (['teacher', 'admin', 'boss'].includes(user.role)) {
      if (!studentIdParam) {
        return NextResponse.json({ error: 'studentId가 필요합니다.' }, { status: 400 });
      }
      targetStudentId = studentIdParam;

      // 학원 범위 검증: boss는 무조건 통과, teacher/admin은 같은 학원만
      if (user.role !== 'boss') {
        const supabaseForCheck = await createClient();
        const { data: student } = await supabaseForCheck
          .from('users')
          .select('academy_id')
          .eq('id', targetStudentId)
          .single();
        if (!student || student.academy_id !== user.academy_id) {
          return NextResponse.json({ error: '해당 학생에 대한 접근 권한이 없습니다.' }, { status: 403 });
        }
      }
    } else {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: svcData } = await supabase
      .from('service_assignments')
      .select('service')
      .eq('student_id', targetStudentId);
    services = (svcData || []).map((s) => s.service as 'naesin' | 'voca');
  }

  // Choose client: student viewing own data → RLS, otherwise → admin bypass
  const queryClient = !token && user?.role === 'student'
    ? await createClient()
    : createAdminClient();

  const report = await buildStudentReport(queryClient, targetStudentId, services);
  return NextResponse.json(report);
}
