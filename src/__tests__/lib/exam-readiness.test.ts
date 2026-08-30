import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { computeExamReadiness } from '@/lib/reports/compute-exam-readiness';

const U1 = 'unit-1', U2 = 'unit-2', U3 = 'unit-3';

const TABLES: Record<string, unknown[]> = {
  naesin_exam_assignments: [
    { id: 'ea1', textbook_id: 'tb1', exam_round: 1, exam_label: '중간고사', exam_date: '2026-10-01', unit_ids: [U1, U2] },
    { id: 'ea2', textbook_id: 'tb1', exam_round: 2, exam_label: null, exam_date: null, unit_ids: [U3] },
  ],
  naesin_textbooks: [{ id: 'tb1', display_name: '중2 천재소' }],
  naesin_units: [
    { id: U1, unit_number: 1, title: 'Lesson 1' },
    { id: U2, unit_number: 2, title: 'Lesson 2' },
    { id: U3, unit_number: 3, title: 'Lesson 3' },
  ],
  naesin_student_progress: [
    { unit_id: U1, vocab_completed: true, passage_completed: true, dialogue_completed: false, grammar_completed: true, problem_completed: true, mock_exam_completed: true },
    { unit_id: U2, vocab_completed: true, passage_completed: false, dialogue_completed: false, grammar_completed: false, problem_completed: false, mock_exam_completed: false },
  ],
  naesin_problem_sheets: [
    { id: 'sh1', unit_id: U1 },
    { id: 'sh2', unit_id: U2 },
    { id: 'sh3', unit_id: U3 },
  ],
  naesin_wrong_answers: [
    { unit_id: U1, resolved: true },
    { unit_id: U1, resolved: false },
    { unit_id: U2, resolved: false },
    { unit_id: U3, resolved: false },
  ],
  naesin_problem_attempts: [
    { sheet_id: 'sh1', score: 8, total_questions: 10 },  // 80% (U1)
    { sheet_id: 'sh2', score: 6, total_questions: 10 },  // 60% (U2)
    { sheet_id: 'sh3', score: 10, total_questions: 10 }, // 100% (U3)
    { sheet_id: 'sh-other', score: 0, total_questions: 10 }, // 스코프 밖 시트 — 무시
  ],
};

function stubClient(): SupabaseClient {
  const from = (table: string) => {
    const rows = TABLES[table] ?? [];
    const builder = {
      select: () => builder,
      eq: () => builder,
      in: () => builder,
      order: () => builder,
      limit: () => builder,
      then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
        resolve({ data: rows, error: null }),
    };
    return builder;
  };
  return { from } as unknown as SupabaseClient;
}

describe('computeExamReadiness', () => {
  it('시험 배정별로 범위 스코프 집계를 계산한다', async () => {
    const result = await computeExamReadiness(stubClient(), 'student-1');
    expect(result).toHaveLength(2);

    const mid = result[0];
    expect(mid.examLabel).toBe('중간고사');
    expect(mid.textbookName).toBe('중2 천재소');
    expect(mid.units.map((u) => u.title)).toEqual(['Lesson 1', 'Lesson 2']);
    expect(mid.unitsStarted).toBe(2);
    expect(mid.unitsCompleted).toBe(1);            // U1만 문제풀이+모의고사 완료
    expect(mid.problemAttempts).toBe(2);           // sh1, sh2
    expect(mid.problemAvgScore).toBe(70);          // (80+60)/2
    expect(mid.wrongTotal).toBe(3);
    expect(mid.wrongUnresolved).toBe(2);

    const fin = result[1];
    expect(fin.examRound).toBe(2);
    expect(fin.examDate).toBeNull();
    expect(fin.units.map((u) => u.title)).toEqual(['Lesson 3']);
    expect(fin.unitsStarted).toBe(0);
    expect(fin.problemAvgScore).toBe(100);         // sh3
    expect(fin.wrongUnresolved).toBe(1);
  });

  it('배정이 없으면 빈 배열', async () => {
    const empty = { from: () => ({ select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }) }) } as unknown as SupabaseClient;
    expect(await computeExamReadiness(empty, 's')).toEqual([]);
  });
});
