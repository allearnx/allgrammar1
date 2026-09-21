import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { passageSubmitSchema } from '@/lib/api/schemas';

export const maxDuration = 60;

export const POST = createApiHandler(
  { schema: passageSubmitSchema },
  async ({ user, body, supabase }) => {
    const { sheetId, unitId, orderingScore, translationScore, fillBlanksScore, wrongSentences } = body;

    const hasFillBlanks = fillBlanksScore != null;
    const score = hasFillBlanks
      ? Math.round((fillBlanksScore + orderingScore + translationScore) / 3)
      : Math.round((orderingScore + translationScore) / 2);
    const totalQuestions = hasFillBlanks ? 3 : 2;

    // Save attempt in the standard problem attempts table
    const attempt = dbResult(await supabase
      .from('naesin_problem_attempts')
      .insert({
        student_id: user.id,
        sheet_id: sheetId,
        answers: hasFillBlanks ? [fillBlanksScore, orderingScore, translationScore] : [orderingScore, translationScore],
        score,
        total_questions: totalQuestions,
        wrong_answers: wrongSentences.map((ws) => ({
          number: ws.number,
          userAnswer: ws.userAnswer,
          correctAnswer: ws.correctAnswer,
          question: `[${ws.type === 'ordering' ? '순서배열' : ws.type === 'fill_blank' ? '빈칸채우기' : '영작'}] #${ws.number}`,
        })),
      })
      .select()
      .single());

    // Clean previous wrong answers for this sheet
    dbResult(await supabase
      .from('naesin_wrong_answers')
      .delete()
      .eq('student_id', user.id)
      .eq('sheet_id', sheetId));

    // Save wrong answers
    if (wrongSentences.length > 0) {
      const wrongRows = wrongSentences.map((ws) => ({
        student_id: user.id,
        unit_id: unitId,
        stage: 'problem' as const,
        source_type: 'external_passage',
        question_data: {
          number: ws.number,
          userAnswer: ws.userAnswer,
          correctAnswer: ws.correctAnswer,
          question: `[${ws.type === 'ordering' ? '순서배열' : ws.type === 'fill_blank' ? '빈칸채우기' : '영작'}] #${ws.number}`,
        },
        sheet_id: sheetId,
      }));

      dbResult(await supabase.from('naesin_wrong_answers').insert(wrongRows));
    }

    // 외부지문은 교과서 암기 단계의 부가 연습 — 어떤 단계의 완료 조건에도 포함하지 않고
    // 시도·점수·오답 기록만 남긴다 (2026-09-22 사장님 결정). problem_completed는 건드리지 않음.

    return NextResponse.json({
      attempt,
      score,
      fillBlanksScore: fillBlanksScore ?? null,
      orderingScore,
      translationScore,
      wrongCount: wrongSentences.length,
    });
  },
);
