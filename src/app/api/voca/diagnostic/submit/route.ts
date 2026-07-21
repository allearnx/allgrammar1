import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaDiagnosticSubmitSchema } from '@/lib/api/schemas/voca';
import { getActiveBands } from '@/lib/voca/diagnostic-sampling';
import { scoreDiagnosticRounds } from '@/lib/voca/diagnostic-scoring';
import { createAdminClient } from '@/lib/supabase/admin';
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
    const activeBands = await getActiveBands(supabase);
    const { rounds, level, coverageScore } = scoreDiagnosticRounds(body.rounds, activeBands);

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

    // /level-test 익명 완주 기록이 있으면 이 계정과 연결 (실패해도 결과 반환에는 영향 없음)
    if (body.leadId) {
      const admin = createAdminClient();
      await admin
        .from('voca_diagnostic_leads')
        .update({ linked_student_id: user.id, updated_at: new Date().toISOString() })
        .eq('id', body.leadId)
        .is('linked_student_id', null);
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
