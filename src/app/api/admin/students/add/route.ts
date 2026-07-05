import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { createApiHandler, ForbiddenError } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { studentAddSchema } from '@/lib/api/schemas';
import { checkServiceGate } from '@/lib/billing/check-plan-api';

// 원장이 학생에게 전달할 수 있게 읽기 쉬운 임시 비밀번호 생성
// 혼동되는 글자(0/O/1/l/I) 제외
function generateReadablePassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const body = Array.from({ length: 8 }, () => chars[randomInt(0, chars.length)]).join('');
  return `${body}!1`;
}

export const POST = createApiHandler(
  { roles: ['admin', 'boss'], schema: studentAddSchema, rateLimit: { max: 30, windowMs: 60_000 } },
  async ({ user, body }) => {
    if (!user.academy_id) {
      throw new ForbiddenError('학원에 소속되어 있지 않습니다.');
    }

    // 무료/유료 플랜 모두 허용 — 단일 학생 추가는 번들 가입과 동일한 권한
    if (body.services && body.services.length > 0) {
      const serviceBlocked = await checkServiceGate(user.academy_id, body.services);
      if (serviceBlocked) return serviceBlocked;
    }

    const admin = createAdminClient();
    const academyId = user.academy_id;

    // 좌석 제한 체크
    const { data: academy } = await admin
      .from('academies')
      .select('max_students')
      .eq('id', academyId)
      .single();

    if (academy?.max_students) {
      const { count: currentCount } = await admin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('academy_id', academyId)
        .eq('role', 'student')
        .eq('is_active', true);

      if ((currentCount || 0) >= academy.max_students) {
        return NextResponse.json(
          { error: `좌석이 부족합니다. 현재 요금제는 최대 ${academy.max_students}명까지 등록 가능합니다.` },
          { status: 400 }
        );
      }
    }

    // 이메일 중복 체크 (에러 메시지 친절하게)
    const { data: existing } = await admin
      .from('users')
      .select('id, academy_id, full_name')
      .eq('email', body.email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다. 다른 이메일을 사용하거나 초대 코드를 전달해주세요.' },
        { status: 409 }
      );
    }

    // Supabase Auth에 사용자 생성
    const tempPassword = generateReadablePassword();
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: body.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: body.full_name,
        role: 'student',
      },
    });

    if (authError || !authUser.user) {
      return NextResponse.json(
        { error: authError?.message || '학생 계정 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // public.users 레코드 업데이트 (트리거로 자동 생성된 row에 academy_id, phone 설정)
    const updates: Record<string, unknown> = {
      academy_id: academyId,
      role: 'student',
      full_name: body.full_name,
    };
    if (body.phone) updates.phone = body.phone;

    await admin
      .from('users')
      .update(updates)
      .eq('id', authUser.user.id);

    // 서비스 배정 (선택)
    if (body.services && body.services.length > 0) {
      for (const service of body.services) {
        await admin
          .from('service_assignments')
          .upsert(
            {
              student_id: authUser.user.id,
              service,
              assigned_by: user.id,
              source: 'manual',
            },
            { onConflict: 'student_id,service' }
          );
      }
    }

    return NextResponse.json({
      success: true,
      student: {
        id: authUser.user.id,
        full_name: body.full_name,
        email: body.email,
      },
      tempPassword,
    });
  }
);
