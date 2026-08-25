import type { NaesinProblemQuestion } from '@/types/naesin';
import { stripOptionSelfNumbering } from '@/lib/validation/problem-validator';

export interface GeneratedQuestion {
  number: number;
  question: string;
  options: string[] | null;
  answer: string;
  explanation: string;
  acceptedAnswers?: string[];
  imageUrl?: string | null;
}

export function hasOptions(q: GeneratedQuestion): boolean {
  return q.options !== null && q.options.length > 0;
}

/** AI 응답을 정규화: options/explanation을 일관된 타입으로 */
export function normalizeQuestions(raw: Record<string, unknown>[]): GeneratedQuestion[] {
  return raw.map((q, i) => ({
    number: (q.number as number) || i + 1,
    question: (q.question as string) || '',
    options: Array.isArray(q.options) && q.options.length > 0
      ? stripOptionSelfNumbering((q.options as unknown[]).map(String))
      : null,
    answer: String(q.answer ?? ''),
    explanation: (q.explanation as string) || '',
    acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers as string[] : undefined,
  }));
}

/** 연속 문항이 같은 공통 지문/보기 상자를 공유하는지 (세트 분할 시 안 쪼개기 위함) */
function sharesQuestionGroup(a: GeneratedQuestion, b: GeneratedQuestion): boolean {
  const la = a.question.split('\n', 1)[0].trim();
  const lb = b.question.split('\n', 1)[0].trim();
  if (la.startsWith('[보기]') && la === lb) return true;
  if (a.question.length < 120 || b.question.length < 120) return false;
  return a.question.slice(0, 100) === b.question.slice(0, 100);
}

/** 대량 문제를 학생용 세트(시트) 단위로 분할. 같은 지문/word bank 그룹은 경계에서 안 쪼갬. */
export function splitQuestionsIntoSets(questions: GeneratedQuestion[], size = 30): GeneratedQuestion[][] {
  if (questions.length <= size) return [questions];
  const sets: GeneratedQuestion[][] = [];
  let i = 0;
  while (i < questions.length) {
    let end = Math.min(i + size, questions.length);
    while (end < questions.length && sharesQuestionGroup(questions[end - 1], questions[end])) end++;
    sets.push(questions.slice(i, end));
    i = end;
  }
  return sets;
}

/** DB question → GeneratedQuestion 변환 */
export function toGenerated(q: NaesinProblemQuestion): GeneratedQuestion {
  return {
    number: q.number,
    question: q.question,
    options: q.options && q.options.length > 0 ? q.options : null,
    answer: String(q.answer ?? ''),
    explanation: q.explanation || '',
    acceptedAnswers: q.acceptedAnswers,
    imageUrl: q.imageUrl || null,
  };
}

/** GeneratedQuestion → DB question 변환 */
export function toDbQuestion(q: GeneratedQuestion, idx: number): NaesinProblemQuestion {
  return {
    number: idx + 1,
    question: q.question,
    ...(hasOptions(q) ? { options: q.options! } : {}),
    answer: q.answer,
    ...(q.explanation ? { explanation: q.explanation } : {}),
    ...(q.acceptedAnswers && q.acceptedAnswers.length > 0 ? { acceptedAnswers: q.acceptedAnswers } : {}),
    ...(q.imageUrl ? { imageUrl: q.imageUrl } : {}),
  };
}
