import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { normalize, matchMcqAnswer, extractAnswer } from '@/lib/naesin/normalize-answer';

export const GET = createApiHandler(
  {},
  async ({ user, supabase, request }) => {
    const sheetId = request.nextUrl.searchParams.get('sheetId');
    if (!sheetId) {
      return NextResponse.json({ error: 'Missing sheetId' }, { status: 400 });
    }

    const { data } = await supabase
      .from('naesin_problem_drafts')
      .select('*')
      .eq('student_id', user.id)
      .eq('sheet_id', sheetId)
      .single();

    if (!data?.draft_data || data.draft_data.mode !== 'interactive') {
      return NextResponse.json(data);
    }

    // 정답처리 반영: 현재 시트의 answer_key + acceptedAnswers로 재평가
    const { data: sheet } = await supabase
      .from('naesin_problem_sheets')
      .select('answer_key, questions')
      .eq('id', sheetId)
      .single();

    if (!sheet) return NextResponse.json(data);

    const draft = data.draft_data;
    const answersMap = draft.answersMap as Record<number, string | number> | undefined;
    if (!answersMap || Object.keys(answersMap).length === 0) {
      return NextResponse.json(data);
    }

    const answerKey = sheet.answer_key as (string | number)[];
    const questions = sheet.questions as {
      number: number;
      question: string;
      options?: string[];
      acceptedAnswers?: string[];
    }[];
    const aiResultsMap = (draft.aiResultsMap ?? {}) as Record<string, { score: number; feedback?: string; correctedAnswer?: string }>;

    let correct = 0;
    let wrong = 0;
    const newWrongList: {
      number: number;
      userAnswer: string | number;
      correctAnswer: string | number;
      question: string;
      aiFeedback?: { score: number; feedback?: string; correctedAnswer?: string };
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
          number: (q?.number ?? i + 1),
          userAnswer,
          correctAnswer: extractAnswer(answerKey[i]),
          question: q?.question ?? '',
          ...(aiResultsMap[idxStr] ? { aiFeedback: aiResultsMap[idxStr] } : {}),
        });
      }
    }

    data.draft_data = {
      ...draft,
      score: { correct, wrong },
      wrongList: newWrongList,
    };

    return NextResponse.json(data);
  }
);
