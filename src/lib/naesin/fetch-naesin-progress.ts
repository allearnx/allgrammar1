import { createAdminClient } from '@/lib/supabase/admin';
import type { NaesinExamData } from './fetch-exam-data';

export interface NaesinProgressResult {
  naesinProgress: {
    unit_id: string;
    vocab_completed: boolean;
    vocab_quiz_score: number | null;
    vocab_spelling_score: number | null;
    passage_completed: boolean;
    passage_fill_blanks_best: number | null;
    passage_ordering_best: number | null;
    passage_translation_best: number | null;
    passage_grammar_vocab_best: number | null;
    dialogue_ordering_best: number | null;
    dialogue_first_letter_best: number | null;
    dialogue_translation_best: number | null;
    dialogue_completed: boolean;
    grammar_completed: boolean;
    grammar_videos_completed: number;
    grammar_total_videos: number;
    problem_completed: boolean;
    total_learning_seconds?: number;
    updated_at: string;
    // Round 2
    round2_passage_fill_blanks_best: number | null;
    round2_passage_ordering_best: number | null;
    round2_passage_translation_best: number | null;
    round2_passage_grammar_vocab_best: number | null;
    round2_passage_completed: boolean;
    round2_dialogue_ordering_best: number | null;
    round2_dialogue_first_letter_best: number | null;
    round2_dialogue_translation_best: number | null;
    round2_dialogue_completed: boolean;
  }[];
  hours: number;
  minutes: number;
  fillBlanksByUnit: Record<string, Record<string, number>>;
  problemSheetsByUnit: Record<string, { id: string; title: string; category: string }[]>;
  problemAttemptsBySheet: Record<string, { score: number; total: number; pct: number }>;
  grammarContentByUnit: Record<string, boolean>;
}

/**
 * Fetch naesin progress data for a student: unit progress, video watch time,
 * fill-blanks attempts, problem sheets, and problem attempts.
 * Shared between student-detail and parent page.
 */
export async function fetchNaesinProgress(
  studentId: string,
  naesinData: NaesinExamData,
  /** Extra watched seconds from legacy grammar videos (student-detail only). */
  legacyWatchedSeconds = 0,
): Promise<NaesinProgressResult> {
  const admin = createAdminClient();
  const unitIds = naesinData.units.map((u) => u.id);

  const [progressRes, videoRes, fillBlanksRes, sheetsRes, attemptsRes, grammarLessonsRes] = await Promise.all([
    admin
      .from('naesin_student_progress')
      .select('unit_id, vocab_completed, vocab_quiz_score, vocab_spelling_score, passage_completed, passage_fill_blanks_best, passage_ordering_best, passage_translation_best, passage_grammar_vocab_best, dialogue_ordering_best, dialogue_first_letter_best, dialogue_translation_best, dialogue_completed, grammar_completed, grammar_videos_completed, grammar_total_videos, problem_completed, total_learning_seconds, updated_at, round2_passage_fill_blanks_best, round2_passage_ordering_best, round2_passage_translation_best, round2_passage_grammar_vocab_best, round2_passage_completed, round2_dialogue_ordering_best, round2_dialogue_first_letter_best, round2_dialogue_translation_best, round2_dialogue_completed')
      .eq('student_id', studentId),
    admin
      .from('naesin_grammar_video_progress')
      .select('cumulative_watch_seconds')
      .eq('student_id', studentId),
    admin
      .from('naesin_passage_attempts')
      .select('unit_id, difficulty, score')
      .eq('student_id', studentId)
      .eq('type', 'fill_blanks')
      .not('difficulty', 'is', null),
    admin
      .from('naesin_problem_sheets')
      .select('id, unit_id, title, sort_order, category')
      .in('category', ['problem', 'mock_exam', 'external_passage', 'eng_eng_def'])
      .in('unit_id', unitIds)
      .order('sort_order'),
    admin
      .from('naesin_problem_attempts')
      .select('sheet_id, score, total_questions')
      .eq('student_id', studentId),
    admin
      .from('naesin_grammar_lessons')
      .select('unit_id')
      .in('unit_id', unitIds)
      .eq('content_type', 'video'),
  ]);

  const naesinProgress = progressRes.data || [];

  // Learning time
  const naesinWatchedSeconds = videoRes.data?.reduce((a, p) => a + (p.cumulative_watch_seconds || 0), 0) || 0;
  const naesinSessionSeconds = naesinProgress.reduce((a, p) => a + (p.total_learning_seconds || 0), 0);
  const totalSeconds = legacyWatchedSeconds + naesinWatchedSeconds + naesinSessionSeconds;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  // Fill blanks best scores by unit + difficulty
  const fillBlanksByUnit: Record<string, Record<string, number>> = {};
  for (const a of fillBlanksRes.data || []) {
    if (!a.difficulty) continue;
    if (!fillBlanksByUnit[a.unit_id]) fillBlanksByUnit[a.unit_id] = {};
    const cur = fillBlanksByUnit[a.unit_id][a.difficulty] ?? 0;
    fillBlanksByUnit[a.unit_id][a.difficulty] = Math.max(cur, a.score);
  }

  // Problem sheets grouped by unit
  const problemSheetsByUnit: Record<string, { id: string; title: string; category: string }[]> = {};
  for (const s of sheetsRes.data || []) {
    if (!problemSheetsByUnit[s.unit_id]) problemSheetsByUnit[s.unit_id] = [];
    problemSheetsByUnit[s.unit_id].push({ id: s.id, title: s.title, category: s.category });
  }

  // Best attempt per sheet
  const problemAttemptsBySheet: Record<string, { score: number; total: number; pct: number }> = {};
  for (const a of attemptsRes.data || []) {
    const cur = problemAttemptsBySheet[a.sheet_id];
    const pct = a.score ?? 0;
    if (!cur || pct > cur.pct) {
      problemAttemptsBySheet[a.sheet_id] = { score: a.score, total: a.total_questions, pct };
    }
  }

  // Grammar content availability per unit (units with at least one grammar video)
  const grammarContentByUnit: Record<string, boolean> = {};
  for (const lesson of grammarLessonsRes.data || []) {
    grammarContentByUnit[lesson.unit_id] = true;
  }

  return { naesinProgress, hours, minutes, fillBlanksByUnit, problemSheetsByUnit, problemAttemptsBySheet, grammarContentByUnit };
}
