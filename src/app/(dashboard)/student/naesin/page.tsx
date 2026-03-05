import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { NaesinHome } from './client';

export default async function NaesinPage() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  // Get student's textbook setting
  const { data: setting } = await supabase
    .from('naesin_student_settings')
    .select('*, textbook:naesin_textbooks(*)')
    .eq('student_id', user.id)
    .single();

  // Get all active textbooks
  const { data: textbooks } = await supabase
    .from('naesin_textbooks')
    .select('*')
    .eq('is_active', true)
    .order('grade')
    .order('sort_order');

  // Get exam date if textbook selected
  let examDate: string | null = null;
  if (setting?.textbook_id) {
    const { data: examDateData } = await supabase
      .from('naesin_exam_dates')
      .select('exam_date')
      .eq('student_id', user.id)
      .eq('textbook_id', setting.textbook_id)
      .single();
    examDate = examDateData?.exam_date || null;
  }

  // If student has a textbook selected, get the units with progress
  let units: Array<{
    id: string;
    unit_number: number;
    title: string;
    sort_order: number;
    hasVocab: boolean;
    hasPassage: boolean;
    hasGrammar: boolean;
    hasProblem: boolean;
    hasLastReview: boolean;
    vocabQuizSetCount: number;
    grammarVideoCount: number;
    progress: {
      vocab_completed: boolean;
      passage_completed: boolean;
      grammar_completed: boolean;
      problem_completed: boolean;
      vocab_quiz_sets_completed: number;
      vocab_total_quiz_sets: number;
      passage_fill_blanks_best: number | null;
      passage_translation_best: number | null;
      grammar_videos_completed: number;
      grammar_total_videos: number;
    } | null;
  }> = [];

  if (setting?.textbook_id) {
    const { data: rawUnits } = await supabase
      .from('naesin_units')
      .select('id, unit_number, title, sort_order')
      .eq('textbook_id', setting.textbook_id)
      .eq('is_active', true)
      .order('sort_order');

    if (rawUnits && rawUnits.length > 0) {
      const unitIds = rawUnits.map((u) => u.id);

      const [vocabRes, passageRes, grammarRes, problemRes, lastReviewRes, quizSetRes, progressRes] = await Promise.all([
        supabase.from('naesin_vocabulary').select('unit_id').in('unit_id', unitIds),
        supabase.from('naesin_passages').select('unit_id').in('unit_id', unitIds),
        supabase.from('naesin_grammar_lessons').select('unit_id, content_type').in('unit_id', unitIds),
        supabase.from('naesin_problem_sheets').select('unit_id').eq('category', 'problem').in('unit_id', unitIds),
        supabase.from('naesin_last_review_content').select('unit_id').in('unit_id', unitIds),
        supabase.from('naesin_vocab_quiz_sets').select('unit_id').in('unit_id', unitIds),
        supabase
          .from('naesin_student_progress')
          .select('unit_id, vocab_completed, passage_completed, grammar_completed, problem_completed, vocab_quiz_sets_completed, vocab_total_quiz_sets, passage_fill_blanks_best, passage_translation_best, grammar_videos_completed, grammar_total_videos')
          .eq('student_id', user.id)
          .in('unit_id', unitIds),
      ]);

      const vocabSet = new Set(vocabRes.data?.map((v) => v.unit_id) || []);
      const passageSet = new Set(passageRes.data?.map((p) => p.unit_id) || []);
      const grammarSet = new Set(grammarRes.data?.map((g) => g.unit_id) || []);
      const problemSet = new Set(problemRes.data?.map((p) => p.unit_id) || []);
      const lastReviewSet = new Set(lastReviewRes.data?.map((l) => l.unit_id) || []);
      const progressMap = new Map(
        progressRes.data?.map((p) => [p.unit_id, p]) || []
      );

      // Count quiz sets and video lessons per unit
      const quizSetCounts: Record<string, number> = {};
      quizSetRes.data?.forEach((qs) => {
        quizSetCounts[qs.unit_id] = (quizSetCounts[qs.unit_id] || 0) + 1;
      });

      const videoLessonCounts: Record<string, number> = {};
      grammarRes.data?.forEach((g) => {
        if (g.content_type === 'video') {
          videoLessonCounts[g.unit_id] = (videoLessonCounts[g.unit_id] || 0) + 1;
        }
      });

      units = rawUnits.map((u) => ({
        id: u.id,
        unit_number: u.unit_number,
        title: u.title,
        sort_order: u.sort_order,
        hasVocab: vocabSet.has(u.id),
        hasPassage: passageSet.has(u.id),
        hasGrammar: grammarSet.has(u.id),
        hasProblem: problemSet.has(u.id),
        hasLastReview: lastReviewSet.has(u.id) || !!examDate,
        vocabQuizSetCount: quizSetCounts[u.id] || 0,
        grammarVideoCount: videoLessonCounts[u.id] || 0,
        progress: progressMap.get(u.id) || null,
      }));
    }
  }

  return (
    <>
      <Topbar user={user} title="내신 대비" />
      <div className="p-4 md:p-6">
        <NaesinHome
          textbooks={textbooks || []}
          selectedTextbook={setting?.textbook ? setting.textbook : null}
          units={units}
          examDate={examDate}
          textbookId={setting?.textbook_id || null}
        />
      </div>
    </>
  );
}
