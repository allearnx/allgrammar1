import { describe, it, expect, vi } from 'vitest';
import { computeClassReview } from '@/lib/reports/compute-class-review';

function mockSupabase(responses: Record<string, { data: unknown[] | null }>) {
  const callCounts: Record<string, number> = {};
  return {
    from: (table: string) => {
      callCounts[table] = (callCounts[table] || 0) + 1;
      const chain = {
        select: () => chain,
        eq: () => chain,
        in: () => chain,
        gte: () => chain,
        then: undefined as unknown,
      };
      // Make it thenable to resolve with mock data
      const result = responses[`${table}_${callCounts[table]}`] ?? responses[table] ?? { data: [] };
      Object.defineProperty(chain, 'then', {
        get() {
          return (resolve: (v: unknown) => void) => resolve(result);
        },
      });
      return chain;
    },
  } as never;
}

describe('computeClassReview', () => {
  it('returns empty array when no students', async () => {
    const supabase = mockSupabase({ users: { data: [] } });
    const result = await computeClassReview(supabase, 'academy-1');
    expect(result).toEqual([]);
  });

  it('returns empty array when no attempts', async () => {
    const supabase = mockSupabase({
      users: { data: [{ id: 's1', name: '김철수' }] },
      naesin_problem_attempts: { data: [] },
    });
    const result = await computeClassReview(supabase, 'academy-1');
    expect(result).toEqual([]);
  });

  it('identifies students needing review with urgent topics', async () => {
    const oldDate = new Date(Date.now() - 60 * 86400000).toISOString();
    const supabase = mockSupabase({
      users: { data: [{ id: 's1', name: '김철수' }, { id: 's2', name: '이영희' }] },
      naesin_problem_attempts: {
        data: [
          { student_id: 's1', score: 5, total_questions: 10, created_at: oldDate, sheet_id: 'sh1' },
          { student_id: 's1', score: 3, total_questions: 10, created_at: oldDate, sheet_id: 'sh2' },
          { student_id: 's2', score: 8, total_questions: 10, created_at: oldDate, sheet_id: 'sh1' },
        ],
      },
      naesin_problem_sheets: {
        data: [
          { id: 'sh1', source_template_id: 't1' },
          { id: 'sh2', source_template_id: 't2' },
        ],
      },
      naesin_templates: {
        data: [
          { id: 't1', template_topic: '수여동사' },
          { id: 't2', template_topic: '관계대명사' },
        ],
      },
    });

    const result = await computeClassReview(supabase, 'academy-1');

    // Both students should have review items (60 days old, low-mid accuracy)
    expect(result.length).toBeGreaterThanOrEqual(1);

    // Student s1 should have more urgent topics (lower accuracy)
    const s1 = result.find((r) => r.studentId === 's1');
    expect(s1).toBeDefined();
    expect(s1!.reviewCount).toBeGreaterThanOrEqual(1);
    expect(s1!.urgentTopics.length).toBeGreaterThanOrEqual(1);
    expect(s1!.urgentTopics[0].retention).toBeLessThan(50);
  });

  it('sorts by reviewCount descending', async () => {
    const oldDate = new Date(Date.now() - 60 * 86400000).toISOString();
    const supabase = mockSupabase({
      users: {
        data: [
          { id: 's1', name: '김철수' },
          { id: 's2', name: '이영희' },
        ],
      },
      naesin_problem_attempts: {
        data: [
          { student_id: 's1', score: 3, total_questions: 10, created_at: oldDate, sheet_id: 'sh1' },
          { student_id: 's1', score: 2, total_questions: 10, created_at: oldDate, sheet_id: 'sh2' },
          { student_id: 's2', score: 4, total_questions: 10, created_at: oldDate, sheet_id: 'sh1' },
        ],
      },
      naesin_problem_sheets: {
        data: [
          { id: 'sh1', source_template_id: 't1' },
          { id: 'sh2', source_template_id: 't2' },
        ],
      },
      naesin_templates: {
        data: [
          { id: 't1', template_topic: '수여동사' },
          { id: 't2', template_topic: '관계대명사' },
        ],
      },
    });

    const result = await computeClassReview(supabase, 'academy-1');

    if (result.length >= 2) {
      expect(result[0].reviewCount).toBeGreaterThanOrEqual(result[1].reviewCount);
    }
  });

  it('limits urgentTopics to 3', async () => {
    const oldDate = new Date(Date.now() - 60 * 86400000).toISOString();
    const sheets = ['sh1', 'sh2', 'sh3', 'sh4', 'sh5'].map((id, i) => ({
      id,
      source_template_id: `t${i + 1}`,
    }));
    const templates = [1, 2, 3, 4, 5].map((i) => ({
      id: `t${i}`,
      template_topic: `Topic${i}`,
    }));
    const attempts = sheets.map((s) => ({
      student_id: 's1',
      score: 2,
      total_questions: 10,
      created_at: oldDate,
      sheet_id: s.id,
    }));

    const supabase = mockSupabase({
      users: { data: [{ id: 's1', name: '김철수' }] },
      naesin_problem_attempts: { data: attempts },
      naesin_problem_sheets: { data: sheets },
      naesin_templates: { data: templates },
    });

    const result = await computeClassReview(supabase, 'academy-1');
    expect(result).toHaveLength(1);
    expect(result[0].urgentTopics.length).toBeLessThanOrEqual(3);
    expect(result[0].reviewCount).toBe(5);
  });

  it('excludes students with no review-needed topics', async () => {
    const recentDate = new Date().toISOString(); // today = high retention
    const supabase = mockSupabase({
      users: { data: [{ id: 's1', name: '김철수' }] },
      naesin_problem_attempts: {
        data: [
          { student_id: 's1', score: 10, total_questions: 10, created_at: recentDate, sheet_id: 'sh1' },
        ],
      },
      naesin_problem_sheets: { data: [{ id: 'sh1', source_template_id: 't1' }] },
      naesin_templates: { data: [{ id: 't1', template_topic: '수여동사' }] },
    });

    const result = await computeClassReview(supabase, 'academy-1');
    expect(result).toEqual([]);
  });
});
