import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/api/rate-limit';
import { vocaDiagnosticLeadSchema } from '@/lib/api/schemas/voca';
import { getActiveBands } from '@/lib/voca/diagnostic-sampling';
import { verifyRounds } from '@/lib/voca/diagnostic-token';
import { bandScoreFromRounds, scoreDiagnosticRounds, type ScoredRound } from '@/lib/voca/diagnostic-scoring';
import type { BandKey } from '@/lib/voca/diagnostic-bands';
import { logger } from '@/lib/logger';

function missedFromRounds(rounds: ScoredRound[]): {
  missed: { front_text: string; back_text: string }[];
  missedCount: number;
} {
  const all = rounds.flatMap((r) => r.items ?? []).filter((i) => i.result !== 'correct');
  return {
    missed: all.slice(0, 5).map((i) => ({ front_text: i.front_text, back_text: i.back_text })),
    missedCount: all.length,
  };
}

/**
 * 게이트 연락처 제출 — "결과 받을 연락처"를 남기면 결과를 돌려준다.
 * leadId(완주 시 저장된 익명 기록)에 이름·전번을 붙이는 게 기본 경로.
 * 완주 기록 저장이 실패했던 경우를 대비해 봉인 토큰 rounds로 새로 계산·저장하는 폴백도 받는다.
 */
export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = vocaDiagnosticLeadSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: '이름과 휴대폰 번호를 확인해주세요.' }, { status: 400 });
    }
    const { name, phone, leadId, grade, rounds } = parsed.data;

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limited = await checkRateLimit(`diagnostic-lead:${ip}`, '/api/public/diagnostic/lead', 5, 60_000);
    if (limited) return limited;

    const admin = createAdminClient();
    const normalizedPhone = phone.replace(/-/g, '');

    if (leadId) {
      // 연락처가 아직 없는 기록에만 붙인다 (남의 leadId 덮어쓰기 방지)
      const { data: updated, error } = await admin
        .from('voca_diagnostic_leads')
        .update({ name, phone: normalizedPhone, updated_at: new Date().toISOString() })
        .eq('id', leadId)
        .is('phone', null)
        .select('grade, start_band, final_band, final_qualifier, coverage_score, rounds')
        .maybeSingle();
      if (error) {
        logger.error('diagnostic.lead', { error: error.message });
        return NextResponse.json({ error: '저장에 실패했습니다.' }, { status: 500 });
      }
      if (updated) {
        return NextResponse.json({
          level: { band: updated.final_band, qualifier: updated.final_qualifier },
          coverageScore: updated.coverage_score,
          finalBandScore: bandScoreFromRounds(
            (updated.rounds ?? []) as ScoredRound[],
            updated.final_band as BandKey,
          ),
          startBand: updated.start_band,
          ...missedFromRounds((updated.rounds ?? []) as ScoredRound[]),
        });
      }
      // 이미 연락처가 붙었거나 없는 id → 폴백으로 진행
    }

    if (!grade || !rounds) {
      return NextResponse.json({ error: '진단 기록을 찾을 수 없습니다. 다시 진단해주세요.' }, { status: 404 });
    }

    const verified = await verifyRounds(rounds);
    if (!verified) {
      return NextResponse.json({ error: '유효하지 않은 진단 기록입니다. 다시 진단해주세요.' }, { status: 400 });
    }

    const activeBands = await getActiveBands(admin);
    const score = scoreDiagnosticRounds(verified, activeBands);
    const { error: insertError } = await admin.from('voca_diagnostic_leads').insert({
      name,
      phone: normalizedPhone,
      grade,
      start_band: score.startBand,
      final_band: score.level.band,
      final_qualifier: score.level.qualifier,
      coverage_score: score.coverageScore,
      rounds: score.rounds,
    });
    if (insertError) {
      logger.error('diagnostic.lead.insert', { error: insertError.message });
      return NextResponse.json({ error: '저장에 실패했습니다.' }, { status: 500 });
    }
    return NextResponse.json({
      level: score.level,
      coverageScore: score.coverageScore,
      finalBandScore: score.finalBandScore,
      startBand: score.startBand,
      missed: score.missed,
      missedCount: score.missedCount,
    });
  } catch {
    return NextResponse.json({ error: '저장에 실패했습니다.' }, { status: 500 });
  }
}
