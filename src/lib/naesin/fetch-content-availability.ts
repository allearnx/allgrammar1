import type { createClient } from '@/lib/supabase/server';
import type { NaesinContentAvailability } from '@/types/database';
import type { NaesinStudentProgress } from '@/types/naesin';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface ContentAvailabilityResult {
  progress: NaesinStudentProgress | null;
  contentAvailability: NaesinContentAvailability;
  videoLessons: { id: string; content_type: string }[];
  quizSetIds: string[];
  examDate: string | null;
}

export async function fetchContentAvailability(
  supabase: SupabaseClient,
  userId: string,
  unitId: string,
  textbookId: string | null,
): Promise<ContentAvailabilityResult> {
  const [
    progressRes,
    vocabCountRes,
    passageCountRes,
    dialogueCountRes,
    grammarRes,
    problemCountRes,
    lastReviewSheetCountRes,
    similarProblemCountRes,
    reviewContentCountRes,
    examDateRes,
    quizSetsRes,
  ] = await Promise.all([
    supabase.from('naesin_student_progress').select('*').eq('student_id', userId).eq('unit_id', unitId).single(),
    supabase.from('naesin_vocabulary').select('id', { count: 'exact', head: true }).eq('unit_id', unitId),
    supabase.from('naesin_passages').select('id', { count: 'exact', head: true }).eq('unit_id', unitId),
    supabase.from('naesin_dialogues').select('id', { count: 'exact', head: true }).eq('unit_id', unitId),
    supabase.from('naesin_grammar_lessons').select('id, content_type').eq('unit_id', unitId),
    supabase.from('naesin_problem_sheets').select('id', { count: 'exact', head: true }).eq('unit_id', unitId).eq('category', 'problem'),
    supabase.from('naesin_problem_sheets').select('id', { count: 'exact', head: true }).eq('unit_id', unitId).eq('category', 'last_review'),
    supabase.from('naesin_similar_problems').select('id', { count: 'exact', head: true }).eq('unit_id', unitId).eq('status', 'approved'),
    supabase.from('naesin_last_review_content').select('id', { count: 'exact', head: true }).eq('unit_id', unitId),
    textbookId
      ? supabase.from('naesin_exam_dates').select('exam_date').eq('student_id', userId).eq('textbook_id', textbookId).single()
      : Promise.resolve({ data: null }),
    supabase.from('naesin_vocab_quiz_sets').select('id').eq('unit_id', unitId),
  ]);

  const grammarLessonsAll = grammarRes.data || [];
  const hasLastReviewContent =
    (lastReviewSheetCountRes.count ?? 0) > 0 ||
    (similarProblemCountRes.count ?? 0) > 0 ||
    (reviewContentCountRes.count ?? 0) > 0;

  const examDate = examDateRes.data?.exam_date || null;

  return {
    progress: progressRes.data,
    contentAvailability: {
      hasVocab: (vocabCountRes.count ?? 0) > 0,
      hasPassage: (passageCountRes.count ?? 0) > 0,
      hasDialogue: (dialogueCountRes.count ?? 0) > 0,
      hasGrammar: grammarLessonsAll.length > 0,
      hasProblem: (problemCountRes.count ?? 0) > 0,
      hasLastReview: hasLastReviewContent || !!examDate,
    },
    videoLessons: grammarLessonsAll.filter((l) => l.content_type === 'video'),
    quizSetIds: (quizSetsRes.data || []).map((s) => s.id),
    examDate,
  };
}
