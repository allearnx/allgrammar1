import type { NaesinProblemQuestion } from '@/types/naesin';

export interface GeneratedQuestion {
  number: number;
  question: string;
  options: string[] | null;
  answer: string;
  explanation: string;
}

export function hasOptions(q: GeneratedQuestion): boolean {
  return q.options !== null && q.options.length > 0;
}

/** AI 응답을 정규화: options/explanation을 일관된 타입으로 */
export function normalizeQuestions(raw: Record<string, unknown>[]): GeneratedQuestion[] {
  return raw.map((q, i) => ({
    number: (q.number as number) || i + 1,
    question: (q.question as string) || '',
    options: Array.isArray(q.options) && q.options.length > 0 ? q.options as string[] : null,
    answer: String(q.answer ?? ''),
    explanation: (q.explanation as string) || '',
  }));
}

/** DB question → GeneratedQuestion 변환 */
export function toGenerated(q: NaesinProblemQuestion): GeneratedQuestion {
  return {
    number: q.number,
    question: q.question,
    options: q.options && q.options.length > 0 ? q.options : null,
    answer: String(q.answer ?? ''),
    explanation: q.explanation || '',
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
  };
}
