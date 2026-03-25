import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { GRADE_OPTIONS } from '@/types/public';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramNotification(data: {
  student_name: string;
  grade: string;
  parent_phone: string;
  courseNames: string[];
}) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  const gradeLabel = GRADE_OPTIONS.find((o) => o.value === data.grade)?.label || data.grade;
  const coursesText = data.courseNames.length > 0 ? data.courseNames.join(', ') : '미선택';

  const message = [
    '📩 새 상담 신청',
    '',
    `👤 학생: ${data.student_name}`,
    `📚 학년: ${gradeLabel}`,
    `📞 연락처: ${data.parent_phone}`,
    `🎯 관심 수업: ${coursesText}`,
  ].join('\n');

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      logger.error('telegram.send_failed', { status: res.status, error: err });
    }
  } catch (err) {
    logger.error('telegram.error', { error: err instanceof Error ? err.message : String(err) });
  }
}

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
    sendTelegramNotification({ student_name, grade, parent_phone, courseNames });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
