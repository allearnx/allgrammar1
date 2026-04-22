import { createAdminClient } from '@/lib/supabase/admin';
import { normalize, matchMcqAnswer, extractAnswer } from '@/lib/naesin/normalize-answer';

/**
 * 시트 1개를 재채점하고 오답 테이블을 갱신한다.
 * admin client를 사용하므로 RLS를 우회한다.
 */
export async function regradeSheet(
  sheetId: string
): Promise<{ total: number; changed: number }> {
  const admin = createAdminClient();

  // 1. 시트 정보 조회
  const { data: sheet } = await admin
    .from('naesin_problem_sheets')
    .select('id, unit_id, answer_key, questions, mode, category')
    .eq('id', sheetId)
    .single();

  if (!sheet) return { total: 0, changed: 0 };

  const wrongStage = sheet.category === 'mock_exam' ? 'mockExam' : 'problem';

  // 2. 해당 시트의 모든 시도 조회
  const { data: attempts } = await admin
    .from('naesin_problem_attempts')
    .select('id, student_id, answers, score, total_questions, wrong_answers')
    .eq('sheet_id', sheetId);

  if (!attempts || attempts.length === 0) {
    return { total: 0, changed: 0 };
  }

  const answerKey = sheet.answer_key as (string | number)[];
  const questions = sheet.questions as {
    number: number;
    question: string;
    options?: string[];
    acceptedAnswers?: string[];
    explanation?: string;
    subParts?: { label: string; answer: string; acceptedAnswers?: string[] }[];
  }[];

  let changed = 0;

  for (const attempt of attempts) {
    const answers = attempt.answers as (string | number)[];
    const totalQuestions = attempt.total_questions;
    let correctCount = 0;
    const wrongAnswers: {
      number: number;
      userAnswer: string | number;
      correctAnswer: string | number;
      question?: string;
    }[] = [];

    for (let i = 0; i < totalQuestions; i++) {
      const userAnswer = String(answers[i] ?? '');
      const correctAnswer = extractAnswer(answerKey[i]);
      const isSubjective =
        !questions?.[i]?.options || questions[i].options!.length === 0;

      let isCorrect: boolean;

      if (isSubjective) {
        const studentNorm = normalize(userAnswer);
        const candidates = [
          correctAnswer,
          ...(questions?.[i]?.acceptedAnswers ?? []),
        ];
        isCorrect = candidates.some((c) => normalize(c) === studentNorm);
      } else {
        isCorrect = matchMcqAnswer(userAnswer, correctAnswer, questions?.[i]?.options);
        // acceptedAnswers 체크 (정답처리된 답도 정답으로 인정)
        if (!isCorrect && questions?.[i]?.acceptedAnswers?.length) {
          const studentNorm = normalize(userAnswer);
          isCorrect = questions[i].acceptedAnswers!.some((c) => normalize(c) === studentNorm);
        }
      }

      if (isCorrect) {
        correctCount++;
      } else {
        wrongAnswers.push({
          number: i + 1,
          userAnswer: (answers[i] as string | number) ?? '',
          correctAnswer,
          question: questions?.[i]?.question,
        });
      }
    }

    const newScore = Math.round((correctCount / totalQuestions) * 100);

    // 점수 또는 오답 목록이 바뀌었는지 확인
    const oldWrongNums = ((attempt.wrong_answers ?? []) as { number: number }[])
      .map((w) => w.number).sort((a, b) => a - b).join(',');
    const newWrongNums = wrongAnswers
      .map((w) => w.number).sort((a, b) => a - b).join(',');
    const hasChange = newScore !== attempt.score || oldWrongNums !== newWrongNums;

    // JSONB 항상 동기화 (backfill이 stale JSONB에서 오답 재생성하는 것 방지)
    await admin
      .from('naesin_problem_attempts')
      .update({ score: newScore, wrong_answers: wrongAnswers })
      .eq('id', attempt.id);

    if (hasChange) {
      changed++;
    }

    // 오답 테이블 항상 동기화 (이전 버그로 stage 불일치 레코드가 남아있을 수 있음)
    // stage='problem'과 'mockExam' 모두 삭제하여 orphan 정리
    await admin
      .from('naesin_wrong_answers')
      .delete()
      .eq('student_id', attempt.student_id)
      .eq('sheet_id', sheetId);

    if (wrongAnswers.length > 0) {
      const wrongRows = wrongAnswers.map((wa) => {
        const idx = wa.number - 1;
        const q = questions?.[idx];
        return {
          student_id: attempt.student_id,
          unit_id: sheet.unit_id,
          stage: wrongStage,
          source_type: sheet.mode,
          question_data: {
            ...wa,
            ...(q?.options ? { options: q.options } : {}),
            ...(q?.explanation ? { explanation: q.explanation } : {}),
            ...(q?.subParts ? { subParts: q.subParts } : {}),
          },
          sheet_id: sheetId,
        };
      });
      await admin.from('naesin_wrong_answers').insert(wrongRows);
    }
  }

  // 중간 저장된 draft도 재평가
  const { data: drafts } = await admin
    .from('naesin_problem_drafts')
    .select('id, draft_data')
    .eq('sheet_id', sheetId);

  if (drafts && drafts.length > 0) {
    for (const draft of drafts) {
      const d = draft.draft_data;
      if (!d || d.mode !== 'interactive') continue;
      const answersMap = d.answersMap as Record<number, string | number> | undefined;
      if (!answersMap || Object.keys(answersMap).length === 0) continue;

      const aiResultsMap = (d.aiResultsMap ?? {}) as Record<string, { score: number }>;
      let correct = 0;
      let wrong = 0;
      const newWrongList: {
        number: number;
        userAnswer: string | number;
        correctAnswer: string | number;
        question: string;
        aiFeedback?: unknown;
      }[] = [];

      for (const [idxStr, userAnswer] of Object.entries(answersMap)) {
        const i = Number(idxStr);
        if (i < 0 || i >= answerKey.length) continue;

        const correctAnswer = extractAnswer(answerKey[i]);
        const q = questions?.[i];
        const isSubjective = !q?.options || q.options.length === 0;

        let isCorrect: boolean;
        if (isSubjective) {
          const aiResult = aiResultsMap[idxStr];
          if (aiResult && aiResult.score === 100) {
            isCorrect = true;
          } else {
            const studentNorm = normalize(String(userAnswer));
            const candidates = [correctAnswer, ...(q?.acceptedAnswers ?? [])];
            isCorrect = candidates.some((c) => normalize(c) === studentNorm);
          }
        } else {
          isCorrect = matchMcqAnswer(String(userAnswer), correctAnswer, q?.options);
          if (!isCorrect && q?.acceptedAnswers?.length) {
            const studentNorm = normalize(String(userAnswer));
            isCorrect = q.acceptedAnswers.some((c) => normalize(c) === studentNorm);
          }
        }

        if (isCorrect) {
          correct++;
        } else {
          wrong++;
          newWrongList.push({
            number: q?.number ?? i + 1,
            userAnswer,
            correctAnswer: extractAnswer(answerKey[i]),
            question: q?.question ?? '',
            ...(aiResultsMap[idxStr] ? { aiFeedback: aiResultsMap[idxStr] } : {}),
          });
        }
      }

      const oldScore = d.score as { correct: number; wrong: number };
      if (oldScore.correct !== correct || oldScore.wrong !== wrong) {
        await admin
          .from('naesin_problem_drafts')
          .update({
            draft_data: { ...d, score: { correct, wrong }, wrongList: newWrongList },
          })
          .eq('id', draft.id);
      }
    }
  }

  return { total: attempts.length, changed };
}
