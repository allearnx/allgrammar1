import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Helpers ──

type ChainResult = { data: unknown; error: unknown; count?: number | null };

/**
 * Build a Supabase-like chainable mock.
 * `tableResults` maps table names to their resolved values.
 * If a table is not listed, it resolves with `{ data: [], error: null }`.
 */
function createMockSupabase(tableResults: Record<string, ChainResult | ChainResult[]>) {
  const callCounters: Record<string, number> = {};

  function buildChain(tableName: string): Record<string, ReturnType<typeof vi.fn>> {
    const results = tableResults[tableName];
    let result: ChainResult;

    if (Array.isArray(results)) {
      callCounters[tableName] = (callCounters[tableName] ?? 0);
      result = results[callCounters[tableName]] ?? { data: [], error: null };
      callCounters[tableName]++;
    } else {
      result = results ?? { data: [], error: null };
    }

    const chain: Record<string, ReturnType<typeof vi.fn>> = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(result),
      then: vi.fn((resolve: (v: unknown) => void) => resolve(result)),
    };

    // select('id', { count: 'exact', head: true }) should return count
    if (result.count !== undefined) {
      chain.then = vi.fn((resolve: (v: unknown) => void) =>
        resolve({ data: null, error: null, count: result.count }),
      );
    }

    for (const key of Object.keys(chain)) {
      if (key !== 'single' && key !== 'then') chain[key].mockReturnValue(chain);
    }

    return chain;
  }

  const from = vi.fn((tableName: string) => buildChain(tableName));
  return { from };
}

// ── Fixtures ──

const vocaBook = {
  id: 'book-1',
  title: 'Test Book',
  description: null,
  sort_order: 0,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
};

const vocaDay = {
  id: 'day-1',
  book_id: 'book-1',
  day_number: 1,
  title: 'Day 1',
  sort_order: 0,
  created_at: '2026-01-01T00:00:00Z',
};

const vocaProgress = {
  id: 'vp-1',
  student_id: 'student-1',
  day_id: 'day-1',
  flashcard_completed: true,
  quiz_score: 90,
  spelling_score: 85,
  matching_score: 95,
  matching_attempt: 1,
  matching_completed: true,
  round2_flashcard_completed: false,
  round2_quiz_score: null,
  round2_matching_score: null,
  round2_matching_attempt: 0,
  round2_matching_completed: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const naesinUnit = {
  id: 'unit-1',
  textbook_id: 'textbook-1',
  unit_number: 1,
  title: 'Lesson 1',
  sort_order: 0,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
};

const naesinProgress = {
  id: 'np-1',
  student_id: 'student-1',
  unit_id: 'unit-1',
  vocab_flashcard_count: 10,
  vocab_quiz_score: 80,
  vocab_spelling_score: 75,
  vocab_completed: true,
  passage_fill_blanks_best: null,
  passage_ordering_best: null,
  passage_completed: false,
  grammar_video_completed: false,
  grammar_text_read: false,
  grammar_completed: false,
  omr_completed: false,
  vocab_quiz_sets_completed: 0,
  vocab_total_quiz_sets: 0,
  passage_translation_best: null,
  passage_grammar_vocab_best: null,
  dialogue_translation_best: null,
  dialogue_completed: false,
  grammar_videos_completed: 0,
  grammar_total_videos: 0,
  problem_completed: false,
  last_review_unlocked: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

// ── Tests ──

describe('fetchVocaDashboardData', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('교재 배정 있을 때 데이터 정상 반환', async () => {
    const supabase = createMockSupabase({
      voca_book_assignments: { data: { book_id: 'book-1' }, error: null },
      voca_books: { data: [vocaBook], error: null },
      voca_days: { data: [vocaDay], error: null },
      voca_student_progress: { data: [vocaProgress], error: null },
      voca_vocabulary: { data: null, error: null, count: 25 },
      voca_quiz_results: [
        { data: [{ wrong_words: [{ front_text: 'apple' }] }], error: null },
        { data: [{ score: 90, created_at: '2026-01-15T10:00:00Z' }], error: null },
      ],
      voca_matching_submissions: { data: [{ wrong_words: [{ word: 'banana' }] }], error: null },
    });

    const { fetchVocaDashboardData } = await import('@/lib/dashboard/fetch-voca-data');
    const result = await fetchVocaDashboardData(supabase as never, 'student-1');

    expect(result.books).toHaveLength(1);
    expect(result.books[0].id).toBe('book-1');
    expect(result.days).toHaveLength(1);
    expect(result.progressList).toHaveLength(1);
    expect(result.wrongWordCounts).toHaveProperty('apple');
    expect(result.wrongWordCounts).toHaveProperty('banana');
    expect(result.quizHistory).toHaveLength(1);
    expect(result.quizHistory[0].score).toBe(90);
  });

  it('교재 배정 없을 때 전체 교재 반환', async () => {
    const supabase = createMockSupabase({
      voca_book_assignments: { data: null, error: { message: 'no rows' } },
      voca_books: { data: [vocaBook], error: null },
      voca_days: { data: [], error: null },
      voca_student_progress: { data: [], error: null },
      voca_vocabulary: { data: null, error: null, count: 0 },
      voca_quiz_results: { data: [], error: null },
      voca_matching_submissions: { data: [], error: null },
    });

    const { fetchVocaDashboardData } = await import('@/lib/dashboard/fetch-voca-data');
    const result = await fetchVocaDashboardData(supabase as never, 'student-1');

    expect(result.books).toHaveLength(1);
    expect(result.days).toHaveLength(0);
    expect(result.wordCount).toBe(0);
    expect(result.quizHistory).toHaveLength(0);
  });
});

describe('fetchNaesinDashboardData', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('교과서 있을 때 내신 데이터 정상 반환', async () => {
    const supabase = createMockSupabase({
      naesin_textbooks: { data: { display_name: '동아 중1' }, error: null },
      naesin_units: { data: [naesinUnit], error: null },
      naesin_exam_assignments: { data: [], error: null },
      naesin_student_progress: { data: [naesinProgress], error: null },
      naesin_vocabulary: { data: [{ unit_id: 'unit-1' }], error: null },
      naesin_passages: { data: [{ unit_id: 'unit-1' }], error: null },
      naesin_dialogues: { data: [], error: null },
      naesin_grammar_lessons: { data: [{ unit_id: 'unit-1', content_type: 'video' }], error: null },
      naesin_problem_sheets: { data: [], error: null },
      naesin_last_review_content: { data: [], error: null },
      naesin_vocab_quiz_sets: { data: [{ unit_id: 'unit-1' }, { unit_id: 'unit-1' }], error: null },
      naesin_similar_problems: { data: [], error: null },
      naesin_problem_attempts: { data: [{ score: 8, total_questions: 10, created_at: '2026-01-15T10:00:00Z' }], error: null },
    });

    const { fetchNaesinDashboardData } = await import('@/lib/dashboard/fetch-naesin-data');
    const result = await fetchNaesinDashboardData(supabase as never, 'student-1', 'textbook-1');

    expect(result.textbookName).toBe('동아 중1');
    expect(result.units).toHaveLength(1);
    expect(result.progressList).toHaveLength(1);
    expect(result.contentMap['unit-1']).toEqual({
      hasVocab: true,
      hasPassage: true,
      hasDialogue: false,
      hasGrammar: true,
      hasProblem: false,
      hasLastReview: false,
    });
    expect(result.vocabQuizSetCounts['unit-1']).toBe(2);
    expect(result.grammarVideoCounts['unit-1']).toBe(1);
    expect(result.quizHistory).toHaveLength(1);
    expect(result.quizHistory[0].score).toBe(80); // 8/10 * 100
  });

  it('빈 단원 → contentMap 비어있음', async () => {
    const supabase = createMockSupabase({
      naesin_textbooks: { data: { display_name: '교과서' }, error: null },
      naesin_units: { data: [], error: null },
      naesin_exam_assignments: { data: [], error: null },
      naesin_student_progress: { data: [], error: null },
      naesin_problem_attempts: { data: [], error: null },
    });

    const { fetchNaesinDashboardData } = await import('@/lib/dashboard/fetch-naesin-data');
    const result = await fetchNaesinDashboardData(supabase as never, 'student-1', 'textbook-1');

    expect(result.units).toHaveLength(0);
    expect(result.contentMap).toEqual({});
    expect(result.quizHistory).toHaveLength(0);
  });
});
