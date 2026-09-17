import { createAdminClient } from '@/lib/supabase/admin';
import { normalize, normalizeSeparators, matchMcqAnswer, extractAnswer, isSubstringMatch, matchSubParts, matchFilledBlanks, uncircle } from '@/lib/naesin/normalize-answer';

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

  // 2. 해당 시트의 모든 시도 조회 (created_at 오름차순 → 마지막=최신 시도의 오답이 테이블에 남음)
  const { data: attempts } = await admin
    .from('naesin_problem_attempts')
    .select('id, student_id, answers, score, total_questions, wrong_answers')
    .eq('sheet_id', sheetId)
    .order('created_at', { ascending: true });

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

  // AI·선생님 채점 결과 (subjective_grading_logs): 규칙 채점이 놓치는 서술형 정답을 보존한다.
  // key = 학생|문항번호|정규화한 답, 값 = 선생님 교정 점수(있으면) 아니면 AI 점수. 최신 로그가 이긴다.
  const { data: gradingLogs } = await admin
    .from('subjective_grading_logs')
    .select('user_id, question_number, student_answer, ai_score, teacher_score')
    .eq('sheet_id', sheetId)
    .order('created_at', { ascending: true });
  const verdictMap = new Map<string, number>();
  for (const l of gradingLogs ?? []) {
    if (l.question_number == null) continue;
    verdictMap.set(`${l.user_id}|${l.question_number}|${normalize(String(l.student_answer))}`, l.teacher_score ?? l.ai_score);
  }

  let changed = 0;

  for (const attempt of attempts) {
    const answers = attempt.answers as (string | number)[];
    const totalQuestions = attempt.total_questions;
    let correctCount = 0;
    // 제출 당시 오답이 아니었던 문항 (retryCorrect는 재도전 정답이므로 정답으로 취급)
    const oldWrongNums = new Set(
      ((attempt.wrong_answers ?? []) as { number: number; retryCorrect?: boolean }[])
        .filter((w) => !w.retryCorrect)
        .map((w) => w.number),
    );
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
        const q = questions?.[i];
        if (q?.subParts) {
          // 파트별 비교 → 실패 시 전체 문자열(구분자 무시) 폴백
          isCorrect = matchSubParts(userAnswer, q.subParts, [correctAnswer, ...(q.acceptedAnswers ?? [])])
            || matchFilledBlanks(userAnswer, q.question, correctAnswer, q.acceptedAnswers, q.subParts);
        } else {
          const studentNorm = normalize(userAnswer);
          const candidates = [
            correctAnswer,
            ...(q?.acceptedAnswers ?? []),
          ];
          isCorrect = candidates.some((c) => normalize(c) === studentNorm);
          // 구분자(쉼표/슬래시) 무시 비교
          if (!isCorrect) {
            isCorrect = candidates.some((c) => normalizeSeparators(userAnswer) === normalizeSeparators(c));
          }
          // 배열 문제 등 부분 일치 (prefix/suffix)
          if (!isCorrect) {
            isCorrect = candidates.some((c) => isSubstringMatch(userAnswer, c));
          }
          // 빈칸을 채운 완전한 문장을 쓴 경우
          if (!isCorrect) {
            isCorrect = matchFilledBlanks(userAnswer, q?.question, correctAnswer, q?.acceptedAnswers);
          }
        }
        // 규칙 채점 실패 → AI/선생님 판정 보존 (subParts 문항 포함 — 문항을 subParts로 바꾼 뒤
        // AI가 100점 준 답이 오답으로 뒤집히던 문제, 2026-09-14 이동현 명령문 Step1 #31).
        // 제출 시엔 AI가 정답(100)으로 준 답이 재채점(정답처리·정답 수정 후 자동 실행)에서
        // 규칙 채점만 거쳐 오답으로 뒤집히던 문제 (2026-09-13 김유민 3단계 Q20, 86%→81%).
        // 로그가 있으면 로그 판정, 없으면(구 시도) 제출 당시 정답이었던 결과를 유지한다.
        if (!isCorrect) {
          const verdict = verdictMap.get(`${attempt.student_id}|${q?.number ?? i + 1}|${normalize(userAnswer)}`);
          if (verdict !== undefined) isCorrect = verdict === 100;
          else if (userAnswer.trim() !== '' && !oldWrongNums.has(i + 1)) isCorrect = true;
        }
      } else {
        isCorrect = matchMcqAnswer(userAnswer, correctAnswer, questions?.[i]?.options);
        // acceptedAnswers 체크 (정답처리된 답도 정답으로 인정)
        if (!isCorrect && questions?.[i]?.acceptedAnswers?.length) {
          const studentNorm = normalize(userAnswer);
          isCorrect = questions[i].acceptedAnswers!.some((c) => normalize(c) === studentNorm);
        }
        // 문항이 나중에 복수정답("1, 5")으로 바뀐 경우: 바뀌기 전에 풀어 정답이었고 학생 답이
        // 정답 집합의 일부("1")면 유지. (so that Step 2 Q2 — 재채점마다 100→98로 깎이던 사고)
        if (!isCorrect && correctAnswer.includes(',') && !oldWrongNums.has(i + 1)) {
          const keySet = new Set(uncircle(correctAnswer).split(',').map((v) => v.trim()).filter(Boolean));
          const userParts = uncircle(userAnswer).split(',').map((v) => v.trim()).filter(Boolean);
          isCorrect = userParts.length > 0 && userParts.every((v) => keySet.has(v));
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
    const oldWrongKey = [...oldWrongNums].sort((a, b) => a - b).join(',');
    const newWrongKey = wrongAnswers
      .map((w) => w.number).sort((a, b) => a - b).join(',');
    const hasChange = newScore !== attempt.score || oldWrongKey !== newWrongKey;

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
          if (q?.subParts) {
            isCorrect = matchSubParts(String(userAnswer), q.subParts, [correctAnswer, ...(q.acceptedAnswers ?? [])])
              || matchFilledBlanks(String(userAnswer), q.question, correctAnswer, q.acceptedAnswers, q.subParts);
          } else {
            const aiResult = aiResultsMap[idxStr];
            if (aiResult && aiResult.score === 100) {
              isCorrect = true;
            } else {
              const studentNorm = normalize(String(userAnswer));
              const candidates = [correctAnswer, ...(q?.acceptedAnswers ?? [])];
              isCorrect = candidates.some((c) => normalize(c) === studentNorm);
              // 구분자(쉼표/슬래시) 무시 비교
              if (!isCorrect) {
                isCorrect = candidates.some((c) => normalizeSeparators(String(userAnswer)) === normalizeSeparators(c));
              }
              // 배열 문제 등 부분 일치 (prefix/suffix)
              if (!isCorrect) {
                isCorrect = candidates.some((c) => isSubstringMatch(String(userAnswer), c));
              }
              if (!isCorrect) {
                isCorrect = matchFilledBlanks(String(userAnswer), q?.question, correctAnswer, q?.acceptedAnswers);
              }
            }
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
