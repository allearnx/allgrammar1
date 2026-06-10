import { NextResponse } from 'next/server';
import { createApiHandler, NotFoundError, dbResult } from '@/lib/api';
import { problemSubmitSchema } from '@/lib/api/schemas';
import { normalize, normalizeSeparators, matchMcqAnswer, extractAnswer, isSubstringMatch } from '@/lib/naesin/normalize-answer';

export const maxDuration = 60;

export const POST = createApiHandler(
  { schema: problemSubmitSchema },
  async ({ user, body, supabase }) => {
    const { sheetId, unitId, answers, totalQuestions, aiResults, retryCorrectAnswers } = body;

    // Fetch answer key
    const { data: sheet } = await supabase
      .from('naesin_problem_sheets')
      .select('answer_key, questions, mode, category')
      .eq('id', sheetId)
      .single();

    if (!sheet) throw new NotFoundError('시험지를 찾을 수 없습니다.');

    // Grade
    const questions = sheet.questions as { number: number; question: string; answer?: string | number; options?: string[]; acceptedAnswers?: string[]; explanation?: string; imageUrl?: string; subParts?: { label: string; answer: string; acceptedAnswers?: string[] }[] }[];
    // Fallback: if answer_key is empty, rebuild from questions[].answer
    const rawAnswerKey = sheet.answer_key as (string | number)[];
    const answerKey = rawAnswerKey.length > 0
      ? rawAnswerKey
      : questions.map((q) => q.answer ?? '');
    let correctCount = 0;
    const wrongAnswers: { number: number; userAnswer: string | number; correctAnswer: string | number; question?: string }[] = [];

    for (let i = 0; i < totalQuestions; i++) {
      const userAnswer = String(answers[i] ?? '');
      const correctAnswer = extractAnswer(answerKey[i]);
      const isSubjective = !questions?.[i]?.options || questions[i].options!.length === 0;

      let isCorrect: boolean;

      if (isSubjective) {
        const q = questions?.[i];
        if (q?.subParts) {
          // subParts grading: each part must match
          const parts = userAnswer.split(' / ');
          isCorrect = q.subParts.every((sp, j) => {
            const studentNorm = normalize(parts[j]?.trim() ?? '');
            const candidates = [sp.answer, ...(sp.acceptedAnswers ?? [])];
            return candidates.some((c) => normalize(c) === studentNorm);
          });
        } else {
          // 규칙 기반 정규화 채점: 먼저 정규화 비교, AI는 보조
          const studentNorm = normalize(userAnswer);
          const candidates = [correctAnswer, ...(q?.acceptedAnswers ?? [])];
          const exactMatch = candidates.some((c) => normalize(c) === studentNorm);

          if (exactMatch) {
            isCorrect = true;
          } else if (candidates.some((c) => normalizeSeparators(userAnswer) === normalizeSeparators(c))) {
            // 구분자(쉼표/슬래시) 무시 비교
            isCorrect = true;
          } else if (candidates.some((c) => isSubstringMatch(userAnswer, c))) {
            // 배열 문제 등 부분 일치 (prefix/suffix)
            isCorrect = true;
          } else {
            const aiResult = aiResults?.[String(i)];
            isCorrect = aiResult ? aiResult.score === 100 : false;
          }
        }
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
          correctAnswer: extractAnswer(answerKey[i]),
          question: questions?.[i]?.question,
        });
      }
    }

    const score = Math.round((correctCount / totalQuestions) * 100);

    // Merge retryCorrect items into wrong_answers JSONB for tracking
    const allWrongAnswers = [
      ...wrongAnswers,
      ...(retryCorrectAnswers ?? []).map((rc: { number: number; userAnswer: string | number; correctAnswer: string | number; question?: string }) => ({
        ...rc,
        retryCorrect: true,
      })),
    ];

    // Save attempt
    const attempt = dbResult(await supabase
      .from('naesin_problem_attempts')
      .insert({
        student_id: user.id,
        sheet_id: sheetId,
        answers,
        score,
        total_questions: totalQuestions,
        wrong_answers: allWrongAnswers,
      })
      .select()
      .single());

    // Save wrong answers to unified table with enriched data
    if (wrongAnswers.length > 0) {
      // 같은 시트의 이전 오답 정리 (재시도 시 중복 방지)
      dbResult(await supabase
        .from('naesin_wrong_answers')
        .delete()
        .eq('student_id', user.id)
        .eq('sheet_id', sheetId));

      const wrongRows = wrongAnswers.map((wa) => {
        const idx = wa.number - 1;
        const q = questions?.[idx];
        return {
          student_id: user.id,
          unit_id: unitId || null,
          stage: sheet.category === 'mock_exam' ? 'mockExam' : 'problem',
          source_type: sheet.mode,
          question_data: {
            ...wa,
            ...(q?.options ? { options: q.options } : {}),
            ...(q?.explanation ? { explanation: q.explanation } : {}),
            ...(q?.imageUrl ? { imageUrl: q.imageUrl } : {}),
            ...(q?.subParts ? { subParts: q.subParts } : {}),
          },
          sheet_id: sheetId,
        };
      });

      dbResult(await supabase.from('naesin_wrong_answers').insert(wrongRows));
    }

    // Delete server draft on successful submit
    dbResult(await supabase
      .from('naesin_problem_drafts')
      .delete()
      .eq('student_id', user.id)
      .eq('sheet_id', sheetId));

    // Update progress: mark completed only when all sheets in the unit have been attempted
    if (unitId) {
      const isMockExam = sheet.category === 'mock_exam';
      const problemGroupCategories = ['problem', 'external_passage', 'eng_eng_def'];
      const targetCategories = isMockExam ? ['mock_exam'] : problemGroupCategories;
      const progressField = isMockExam ? 'mock_exam_completed' : 'problem_completed';

      const { data: allSheets } = await supabase
        .from('naesin_problem_sheets')
        .select('id')
        .eq('unit_id', unitId)
        .in('category', targetCategories);
      const sheetIds = (allSheets || []).map((s) => s.id);

      const { data: attemptRows } = await supabase
        .from('naesin_problem_attempts')
        .select('sheet_id')
        .eq('student_id', user.id)
        .in('sheet_id', sheetIds.length > 0 ? sheetIds : ['__none__']);
      const attemptedIds = new Set((attemptRows || []).map((r) => r.sheet_id));

      const allCompleted = sheetIds.length > 0 && sheetIds.every((id) => attemptedIds.has(id));

      dbResult(await supabase
        .from('naesin_student_progress')
        .upsert(
          { student_id: user.id, unit_id: unitId, [progressField]: allCompleted },
          { onConflict: 'student_id,unit_id' }
        ));
    }

    return NextResponse.json({ attempt, score, correctCount, wrongAnswers });
  }
);
