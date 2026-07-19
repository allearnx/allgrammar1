import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaDiagnosticSubmitSchema } from '@/lib/api/schemas/voca';
import { getActiveBands } from '@/lib/voca/diagnostic-sampling';
import { resolveFinalLevel, type RoundSummary } from '@/lib/voca/diagnostic-bands';
import type { z } from 'zod';

type Body = z.infer<typeof vocaDiagnosticSubmitSchema>;

export const POST = createApiHandler<Body>(
  { roles: ['student'], schema: vocaDiagnosticSubmitSchema, rateLimit: { max: 10, windowMs: 60_000 } },
  async ({ user, body, supabase }) => {
    // 하루 1회 제한 — 같은 날 여러 번 돌려 좋은 숫자를 골라잡는 것 방지
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: todayAttempt } = await supabase
      .from('voca_diagnostic_results')
      .select('id')
      .eq('student_id', user.id)
      .gte('created_at', todayStart.toISOString())
      .limit(1)
      .maybeSingle();
    if (todayAttempt) {
      return NextResponse.json(
        { error: '오늘은 이미 진단을 마쳤습니다. 내일 다시 측정할 수 있어요.' },
        { status: 409 },
      );
    }

    // 정답 여부는 서버가 재계산 (선택한 보기의 vocabId === 문항 vocabId)
    const rounds = body.rounds.map((r) => {
      const items = r.items.map((it) => ({
        vocabId: it.vocabId,
        front_text: it.front_text,
        back_text: it.back_text,
        result: it.chosenVocabId === null ? 'unknown' : it.chosenVocabId === it.vocabId ? 'correct' : 'wrong',
      }));
      return {
        band: r.band,
        total: items.length,
        correct: items.filter((i) => i.result === 'correct').length,
        unknown: items.filter((i) => i.result === 'unknown').length,
        items,
      };
    });

    const activeBands = await getActiveBands(supabase);
    const summaries: RoundSummary[] = rounds.map((r) => ({ band: r.band, correct: r.correct, total: r.total }));
    const level = resolveFinalLevel(summaries, activeBands.length ? activeBands : [rounds[0].band]);

    // 커버리지 = 학년(시작) 밴드에서 푼 전체 문항 누적 정답률 — 확인 라운드 포함 보통 20문항
    const startBand = rounds[0].band;
    const startRounds = rounds.filter((r) => r.band === startBand);
    const cumCorrect = startRounds.reduce((s, r) => s + r.correct, 0);
    const cumTotal = startRounds.reduce((s, r) => s + r.total, 0);
    const coverageScore = Math.round((cumCorrect / cumTotal) * 100);

    const { data: prev } = await supabase
      .from('voca_diagnostic_results')
      .select('attempt_number')
      .eq('student_id', user.id)
      .order('attempt_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: saved, error } = await supabase
      .from('voca_diagnostic_results')
      .insert({
        student_id: user.id,
        grade: body.grade,
        start_band: body.rounds[0].band,
        final_band: level.band,
        final_qualifier: level.qualifier,
        coverage_score: coverageScore,
        rounds,
        attempt_number: (prev?.attempt_number ?? 0) + 1,
      })
      .select('id, attempt_number')
      .single();
    if (error) {
      return NextResponse.json({ error: '결과 저장에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      id: saved.id,
      attemptNumber: saved.attempt_number,
      level,
      coverageScore,
      rounds: rounds.map(({ items: _items, ...rest }) => rest),
    });
  },
);
