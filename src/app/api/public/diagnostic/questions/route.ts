import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/api/rate-limit';
import { vocaDiagnosticQuestionsSchema } from '@/lib/api/schemas/voca';
import { sampleDiagnosticQuestions } from '@/lib/voca/diagnostic-sampling';

/**
 * 비로그인 어휘 레벨 진단 문항 (value-first 퍼널: /level-test).
 * 가입 전에 진단을 끝까지 풀 수 있어야 하므로 인증 없이 IP 레이트리밋만 건다.
 * 결과 저장은 여전히 가입 후 인증 라우트(/api/voca/diagnostic/submit)에서만.
 */
export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = vocaDiagnosticQuestionsSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }

    // 라운드마다 1회 호출 — 정상 사용은 분당 최대 5~6회
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limited = await checkRateLimit(`diagnostic-q:${ip}`, '/api/public/diagnostic/questions', 30, 60_000);
    if (limited) return limited;

    const admin = createAdminClient();
    const questions = await sampleDiagnosticQuestions(admin, parsed.data.band, parsed.data.excludeIds);
    if (!questions) {
      return NextResponse.json(
        { error: '이 레벨의 단어가 아직 준비되지 않았습니다.' },
        { status: 404 },
      );
    }
    return NextResponse.json({ band: parsed.data.band, questions });
  } catch {
    return NextResponse.json({ error: '문제를 불러오지 못했습니다.' }, { status: 500 });
  }
}
