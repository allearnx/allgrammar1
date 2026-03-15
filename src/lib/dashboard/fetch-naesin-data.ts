import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  NaesinUnit,
  NaesinStudentProgress,
  NaesinExamAssignment,
  NaesinContentAvailability,
} from '@/types/naesin';

export interface NaesinDashboardData {
  textbookName: string;
  units: NaesinUnit[];
  progressList: NaesinStudentProgress[];
  examAssignments: NaesinExamAssignment[];
  contentMap: Record<string, NaesinContentAvailability>;
  vocabQuizSetCounts: Record<string, number>;
  grammarVideoCounts: Record<string, number>;
  quizHistory: { date: string; score: number }[];
}

export async function fetchNaesinDashboardData(
  supabase: SupabaseClient,
  userId: string,
  textbookId: string,
): Promise<NaesinDashboardData> {
  // 1. Textbook name + units + exams in parallel
  const [textbookRes, unitsRes, examsRes] = await Promise.all([
    supabase.from('naesin_textbooks').select('display_name').eq('id', textbookId).single(),
    supabase.from('naesin_units').select('*').eq('textbook_id', textbookId).eq('is_active', true).order('sort_order'),
    supabase.from('naesin_exam_assignments').select('*').eq('student_id', userId).eq('textbook_id', textbookId),
  ]);

  const textbookName = textbookRes.data?.display_name || '교과서';
  const units: NaesinUnit[] = unitsRes.data || [];
  const examAssignments: NaesinExamAssignment[] = examsRes.data || [];
  const unitIds = units.map((u) => u.id);

  // 2. Progress
  let progressList: NaesinStudentProgress[] = [];
  if (unitIds.length > 0) {
    const { data } = await supabase
      .from('naesin_student_progress')
      .select('*')
      .eq('student_id', userId)
      .in('unit_id', unitIds);
    progressList = data || [];
  }

  // 3. Content availability + quiz set counts + grammar video counts
  const contentMap: Record<string, NaesinContentAvailability> = {};
  const vocabQuizSetCounts: Record<string, number> = {};
  const grammarVideoCounts: Record<string, number> = {};

  if (unitIds.length > 0) {
    const [vocabRes, passageRes, grammarRes, problemRes, lastReviewRes, quizSetRes, similarRes] =
      await Promise.all([
        supabase.from('naesin_vocabulary').select('unit_id').in('unit_id', unitIds),
        supabase.from('naesin_passages').select('unit_id').in('unit_id', unitIds),
        supabase.from('naesin_grammar_lessons').select('unit_id, content_type').in('unit_id', unitIds),
        supabase.from('naesin_problem_sheets').select('unit_id').in('unit_id', unitIds).eq('category', 'problem'),
        supabase.from('naesin_last_review_content').select('unit_id').in('unit_id', unitIds),
        supabase.from('naesin_vocab_quiz_sets').select('unit_id').in('unit_id', unitIds),
        supabase.from('naesin_similar_problems').select('unit_id').in('unit_id', unitIds).eq('status', 'approved'),
      ]);

    const vocabUnits = new Set((vocabRes.data || []).map((r: { unit_id: string }) => r.unit_id));
    const passageUnits = new Set((passageRes.data || []).map((r: { unit_id: string }) => r.unit_id));
    const grammarUnits = new Set((grammarRes.data || []).map((r: { unit_id: string }) => r.unit_id));
    const problemUnits = new Set((problemRes.data || []).map((r: { unit_id: string }) => r.unit_id));
    const lastReviewUnits = new Set((lastReviewRes.data || []).map((r: { unit_id: string }) => r.unit_id));
    const similarUnits = new Set((similarRes.data || []).map((r: { unit_id: string }) => r.unit_id));

    for (const row of quizSetRes.data || []) {
      vocabQuizSetCounts[row.unit_id] = (vocabQuizSetCounts[row.unit_id] || 0) + 1;
    }
    for (const row of (grammarRes.data || []) as { unit_id: string; content_type: string }[]) {
      if (row.content_type === 'video') {
        grammarVideoCounts[row.unit_id] = (grammarVideoCounts[row.unit_id] || 0) + 1;
      }
    }

    for (const uid of unitIds) {
      contentMap[uid] = {
        hasVocab: vocabUnits.has(uid),
        hasPassage: passageUnits.has(uid),
        hasGrammar: grammarUnits.has(uid),
        hasProblem: problemUnits.has(uid),
        hasLastReview: lastReviewUnits.has(uid) || similarUnits.has(uid),
      };
    }
  }

  // 4. Quiz history
  const { data: historyData } = unitIds.length > 0
    ? await supabase.from('naesin_problem_attempts').select('score, total_questions, created_at').eq('student_id', userId).order('created_at', { ascending: false }).limit(20)
    : { data: null };

  const quizHistory = (historyData || []).reverse().map((r: { score: number; total_questions: number; created_at: string }) => ({
    date: r.created_at.slice(0, 10),
    score: r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : 0,
  }));

  return { textbookName, units, progressList, examAssignments, contentMap, vocabQuizSetCounts, grammarVideoCounts, quizHistory };
}
