import type { Section, Question } from '@/app/(public)/trial/_data';

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?;:'"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function gradeSubjective(userAnswer: string, correct: string, acceptable?: string[]): boolean {
  const norm = normalize(userAnswer);
  if (!norm) return false;
  const allAnswers = [correct, ...(acceptable ?? [])];
  return allAnswers.some((a) => normalize(a) === norm);
}

export function flattenQuestions(sections: Section[]): { question: Question; passage?: string }[] {
  const result: { question: Question; passage?: string }[] = [];
  for (const section of sections) {
    for (const q of section.questions) {
      result.push({ question: q, passage: section.passage });
    }
  }
  return result;
}
