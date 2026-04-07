import type { createClient } from '@/lib/supabase/server';
import type { NaesinStudentProgress } from '@/types/naesin';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type StageKey = 'vocab' | 'passage' | 'dialogue' | 'textbookVideo' | 'grammar' | 'problem' | 'mockExam' | 'lastReview';

export async function fetchStageData(
  supabase: SupabaseClient,
  userId: string,
  unitId: string,
  stage: StageKey,
  quizSetIds: string[],
  progress: NaesinStudentProgress | null,
) {
  switch (stage) {
    case 'vocab':
      return fetchVocabData(supabase, userId, unitId, quizSetIds, progress);
    case 'passage':
      return fetchPassageData(supabase, userId, unitId);
    case 'dialogue':
      return fetchDialogueData(supabase, userId, unitId);
    case 'textbookVideo':
      return fetchTextbookVideoData(supabase, userId, unitId);
    case 'grammar':
      return fetchGrammarData(supabase, userId, unitId);
    case 'problem':
      return fetchProblemData(supabase, unitId);
    case 'mockExam':
      return fetchMockExamData(supabase, unitId);
    case 'lastReview':
      return fetchLastReviewData(supabase, unitId);
  }
}

async function fetchVocabData(
  supabase: SupabaseClient,
  userId: string,
  unitId: string,
  quizSetIds: string[],
  progress: NaesinStudentProgress | null,
) {
  const [vocabRes, quizSetsRes, quizSetResultsRes] = await Promise.all([
    supabase.from('naesin_vocabulary').select('*').eq('unit_id', unitId).order('sort_order'),
    supabase.from('naesin_vocab_quiz_sets').select('*').eq('unit_id', unitId).order('set_order'),
    supabase.from('naesin_vocab_quiz_set_results').select('quiz_set_id, score').eq('student_id', userId),
  ]);

  const allResults = quizSetResultsRes.data || [];
  const completedSetIds: string[] = [];
  for (const setId of quizSetIds) {
    const results = allResults.filter((r: { quiz_set_id: string; score: number }) => r.quiz_set_id === setId);
    const bestScore = Math.max(0, ...results.map((r: { score: number }) => r.score));
    if (bestScore >= 80) completedSetIds.push(setId);
  }

  return {
    vocabulary: vocabRes.data || [],
    quizSets: quizSetsRes.data || [],
    completedSetIds,
    vocabProgress: {
      flashcardCount: progress?.vocab_flashcard_count ?? 0,
      quizScore: progress?.vocab_quiz_score ?? null,
      spellingScore: progress?.vocab_spelling_score ?? null,
    },
  };
}

async function fetchPassageData(supabase: SupabaseClient, userId: string, unitId: string) {
  const [passageRes, settingsRes, progressRes] = await Promise.all([
    supabase.from('naesin_passages').select('*').eq('unit_id', unitId).order('sort_order'),
    supabase.from('naesin_student_settings').select('passage_required_stages, translation_sentences_per_page').eq('student_id', userId).single(),
    supabase.from('naesin_student_progress').select('passage_completed').eq('student_id', userId).eq('unit_id', unitId).single(),
  ]);
  return {
    passages: passageRes.data || [],
    passageRequiredStages: (settingsRes.data?.passage_required_stages as string[] | null) ?? ['fill_blanks', 'translation'],
    translationSentencesPerPage: (settingsRes.data?.translation_sentences_per_page as number | null) ?? 10,
    passageRound1Completed: progressRes.data?.passage_completed ?? false,
  };
}

async function fetchDialogueData(supabase: SupabaseClient, userId: string, unitId: string) {
  const [dialogueRes, progressRes] = await Promise.all([
    supabase.from('naesin_dialogues').select('*').eq('unit_id', unitId).order('sort_order'),
    supabase.from('naesin_student_progress').select('dialogue_completed').eq('student_id', userId).eq('unit_id', unitId).single(),
  ]);
  return {
    dialogues: dialogueRes.data || [],
    dialogueRound1Completed: progressRes.data?.dialogue_completed ?? false,
  };
}

async function fetchGrammarData(supabase: SupabaseClient, userId: string, unitId: string) {
  const [grammarRes, videoProgressRes] = await Promise.all([
    supabase.from('naesin_grammar_lessons').select('*').eq('unit_id', unitId).order('sort_order'),
    supabase.from('naesin_grammar_video_progress').select('*').eq('student_id', userId),
  ]);

  const grammarLessons = grammarRes.data || [];
  const lessonIds = grammarLessons.map((l: { id: string }) => l.id);
  const videoProgress = (videoProgressRes.data || []).filter(
    (vp: { lesson_id: string }) => lessonIds.includes(vp.lesson_id),
  );

  return { grammarLessons, videoProgress };
}

async function fetchTextbookVideoData(supabase: SupabaseClient, userId: string, unitId: string) {
  const [videoRes, videoProgressRes] = await Promise.all([
    supabase.from('naesin_textbook_videos').select('*').eq('unit_id', unitId).order('sort_order'),
    supabase.from('naesin_textbook_video_progress').select('*').eq('student_id', userId),
  ]);

  const textbookVideos = videoRes.data || [];
  const videoIds = textbookVideos.map((v: { id: string }) => v.id);
  const textbookVideoProgress = (videoProgressRes.data || []).filter(
    (vp: { video_id: string }) => videoIds.includes(vp.video_id),
  );

  return { textbookVideos, textbookVideoProgress };
}

async function fetchMockExamData(supabase: SupabaseClient, unitId: string) {
  const mockExamRes = await supabase
    .from('naesin_problem_sheets')
    .select('*')
    .eq('unit_id', unitId)
    .eq('category', 'mock_exam')
    .order('sort_order');
  return { mockExamSheets: mockExamRes.data || [] };
}

async function fetchProblemData(supabase: SupabaseClient, unitId: string) {
  const problemRes = await supabase
    .from('naesin_problem_sheets')
    .select('*')
    .eq('unit_id', unitId)
    .eq('category', 'problem')
    .order('sort_order');
  return { problemSheets: problemRes.data || [] };
}

async function fetchLastReviewData(supabase: SupabaseClient, unitId: string) {
  const [sheetsRes, similarRes, contentRes] = await Promise.all([
    supabase.from('naesin_problem_sheets').select('*').eq('unit_id', unitId).eq('category', 'last_review').order('sort_order'),
    supabase.from('naesin_similar_problems').select('*').eq('unit_id', unitId).eq('status', 'approved'),
    supabase.from('naesin_last_review_content').select('*').eq('unit_id', unitId).order('sort_order'),
  ]);
  return {
    lastReviewProblemSheets: sheetsRes.data || [],
    similarProblems: similarRes.data || [],
    reviewContent: contentRes.data || [],
  };
}
