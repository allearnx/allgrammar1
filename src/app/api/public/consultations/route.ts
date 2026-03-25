import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { sendTelegram } from '@/lib/telegram';
import { GRADE_OPTIONS } from '@/types/public';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_name, grade, parent_phone, interest_course_ids } = body;

    if (!student_name || !grade || !parent_phone) {
      return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Insert consultation
    const { error: insertError } = await admin.from('consultations').insert({
      student_name,
      grade,
      parent_phone,
      interest_course_ids: interest_course_ids || [],
    });

    if (insertError) {
      logger.error('consultation.insert', { error: insertError.message });
      return NextResponse.json({ error: '신청 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // Resolve course names for telegram
    let courseNames: string[] = [];
    if (interest_course_ids?.length > 0) {
      const { data: courses } = await admin
        .from('courses')
        .select('title')
        .in('id', interest_course_ids);
      courseNames = (courses || []).map((c) => c.title);
    }

    // Send telegram (non-blocking)
    const gradeLabel = GRADE_OPTIONS.find((o) => o.value === grade)?.label || grade;
    const coursesText = courseNames.length > 0 ? courseNames.join(', ') : '미선택';
    sendTelegram(
      [
        '📩 새 상담 신청',
        '',
        `👤 학생: ${student_name}`,
        `📚 학년: ${gradeLabel}`,
        `📞 연락처: ${parent_phone}`,
        `🎯 관심 수업: ${coursesText}`,
        '',
        '👉 https://www.allrounderenglish.co.kr/boss/consultations',
      ].join('\n'),
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
