import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * 일회성 백필: naesin_problem_attempts에 있지만
 * naesin_wrong_answers에 없는 오답을 복구한다.
 */
export const POST = createApiHandler(
  { roles: ['boss'] },
  async () => {
    const admin = createAdminClient();

    // 1. 모든 problem attempts 조회 (오답이 있는 것만)
    const { data: attempts, error: attErr } = await admin
      .from('naesin_problem_attempts')
      .select('id, student_id, sheet_id, wrong_answers')
      .not('wrong_answers', 'eq', '[]')
      .order('created_at', { ascending: true });

    if (attErr) {
      return NextResponse.json({ error: attErr.message }, { status: 500 });
    }

    if (!attempts || attempts.length === 0) {
      return NextResponse.json({ message: 'No attempts found', inserted: 0 });
    }

    // 2. 이미 존재하는 오답의 (student_id, sheet_id) 쌍 조회
    const { data: existing } = await admin
      .from('naesin_wrong_answers')
      .select('student_id, sheet_id')
      .not('sheet_id', 'is', null);

    const existingSet = new Set(
      (existing || []).map((e) => `${e.student_id}:${e.sheet_id}`)
    );

    // 3. 시트 → unit_id 매핑
    const sheetIds = [...new Set(attempts.map((a) => a.sheet_id))];
    const { data: sheets } = await admin
      .from('naesin_problem_sheets')
      .select('id, unit_id, mode, category, questions')
      .in('id', sheetIds);

    const sheetMap = new Map(
      (sheets || []).map((s) => [s.id, s])
    );

    // 4. 누락된 오답 생성
    const rowsToInsert: Record<string, unknown>[] = [];
    let skipped = 0;

    for (const attempt of attempts) {
      const key = `${attempt.student_id}:${attempt.sheet_id}`;
      if (existingSet.has(key)) {
        skipped++;
        continue;
      }

      const sheet = sheetMap.get(attempt.sheet_id);
      if (!sheet) continue;

      const wrongAnswers = attempt.wrong_answers as {
        number: number;
        userAnswer: string | number;
        correctAnswer: string | number;
        question?: string;
      }[];

      if (!wrongAnswers || wrongAnswers.length === 0) continue;

      const questions = (sheet.questions || []) as {
        options?: string[];
        explanation?: string;
      }[];

      for (const wa of wrongAnswers) {
        const idx = wa.number - 1;
        const q = questions[idx];
        rowsToInsert.push({
          student_id: attempt.student_id,
          unit_id: sheet.unit_id,
          stage: sheet.category === 'mock_exam' ? 'mockExam' : 'problem',
          source_type: sheet.mode || 'interactive',
          question_data: {
            ...wa,
            ...(q?.options ? { options: q.options } : {}),
            ...(q?.explanation ? { explanation: q.explanation } : {}),
          },
          sheet_id: attempt.sheet_id,
        });
      }

      existingSet.add(key); // 같은 시트의 중복 attempt 방지
    }

    // 5. 배치 insert (500개씩)
    let inserted = 0;
    for (let i = 0; i < rowsToInsert.length; i += 500) {
      const batch = rowsToInsert.slice(i, i + 500);
      const { error: insErr } = await admin
        .from('naesin_wrong_answers')
        .insert(batch);
      if (insErr) {
        return NextResponse.json({
          error: insErr.message,
          insertedSoFar: inserted,
          remaining: rowsToInsert.length - inserted,
        }, { status: 500 });
      }
      inserted += batch.length;
    }

    return NextResponse.json({
      message: 'Backfill complete',
      totalAttempts: attempts.length,
      skipped,
      inserted,
    });
  }
);
