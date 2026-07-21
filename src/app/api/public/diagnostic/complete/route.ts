import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/api/rate-limit';
import { vocaDiagnosticCompleteSchema } from '@/lib/api/schemas/voca';
import { getActiveBands } from '@/lib/voca/diagnostic-sampling';
import { verifyRounds } from '@/lib/voca/diagnostic-token';
import { scoreDiagnosticRounds } from '@/lib/voca/diagnostic-scoring';
import { logger } from '@/lib/logger';

/**
 * 비로그인 진단 완주 기록 (value-first 게이트 도달 시점).
 * 가입·연락처와 무관하게 익명으로 저장한다 — 이탈자 레벨 분포 파악 + 이후 연락처/계정 연결의 앵커.
 * 결과(레벨)는 반환하지 않는다 — 결과 공개는 연락처 제출(/lead) 또는 가입 제출에서만.
 */
export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = vocaDiagnosticCompleteSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limited = await checkRateLimit(`diagnostic-complete:${ip}`, '/api/public/diagnostic/complete', 10, 60_000);
    if (limited) return limited;

    const verified = await verifyRounds(parsed.data.rounds);
    if (!verified) {
      return NextResponse.json({ error: '유효하지 않은 진단 기록입니다.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const activeBands = await getActiveBands(admin);
    const score = scoreDiagnosticRounds(verified, activeBands);

    const { data: saved, error } = await admin
      .from('voca_diagnostic_leads')
      .insert({
        grade: parsed.data.grade,
        start_band: score.startBand,
        final_band: score.level.band,
        final_qualifier: score.level.qualifier,
        coverage_score: score.coverageScore,
        rounds: score.rounds,
      })
      .select('id')
      .single();
    if (error) {
      logger.error('diagnostic.complete', { error: error.message });
      return NextResponse.json({ error: '기록 저장에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ leadId: saved.id });
  } catch {
    return NextResponse.json({ error: '기록 저장에 실패했습니다.' }, { status: 500 });
  }
}
