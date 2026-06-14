import type { createClient } from '@/lib/supabase/server';
import type { NaesinStudentProgress } from '@/types/naesin';
import { SHEET_LITE_COLUMNS, NAESIN_VOCABULARY_COLUMNS, NAESIN_PASSAGES_COLUMNS, NAESIN_DIALOGUES_COLUMNS, NAESIN_VOCAB_QUIZ_SETS_COLUMNS } from '@/types/naesin';

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
      return fetchProblemData(supabase, unitId, userId);
    case 'mockExam':
      return fetchMockExamData(supabase, unitId, userId);
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
    supabase.from('naesin_vocabulary').select(NAESIN_VOCABULARY_COLUMNS).eq('unit_id', unitId).order('sort_order'),
    supabase.from('naesin_vocab_quiz_sets').select(NAESIN_VOCAB_QUIZ_SETS_COLUMNS).eq('unit_id', unitId).order('set_order'),
    quizSetIds.length > 0
      ? supabase.from('naesin_vocab_quiz_set_results').select('quiz_set_id, score').eq('student_id', userId).in('quiz_set_id', quizSetIds)
      : Promise.resolve({ data: [] }),
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
    supabase.from('naesin_passages').select(NAESIN_PASSAGES_COLUMNS).eq('unit_id', unitId).order('sort_order'),
    supabase.from('naesin_student_settings').select('passage_required_stages, translation_sentences_per_page').eq('student_id', userId).single(),
    supabase.from('naesin_student_progress').select('passage_completed, passage_fill_blanks_best, passage_ordering_best, passage_translation_best, passage_grammar_vocab_best').eq('student_id', userId).eq('unit_id', unitId).single(),
  ]);
  const p = progressRes.data;
  return {
    passages: passageRes.data || [],
    passageRequiredStages: (settingsRes.data?.passage_required_stages as string[] | null) ?? ['fill_blanks', 'translation'],
    translationSentencesPerPage: (settingsRes.data?.translation_sentences_per_page as number | null) ?? 10,
    passageRound1Completed: p?.passage_completed ?? false,
    passageSubStageBests: {
      fill_blanks: (p?.passage_fill_blanks_best as number | null) ?? null,
      ordering: (p?.passage_ordering_best as number | null) ?? null,
      translation: (p?.passage_translation_best as number | null) ?? null,
      grammar_vocab: (p?.passage_grammar_vocab_best as number | null) ?? null,
    },
  };
}

async function fetchDialogueData(supabase: SupabaseClient, userId: string, unitId: string) {
  const [dialogueRes, progressRes] = await Promise.all([
    supabase.from('naesin_dialogues').select(NAESIN_DIALOGUES_COLUMNS).eq('unit_id', unitId).order('sort_order'),
    supabase.from('naesin_student_progress').select('dialogue_completed').eq('student_id', userId).eq('unit_id', unitId).single(),
  ]);
  return {
    dialogues: dialogueRes.data || [],
    dialogueRound1Completed: progressRes.data?.dialogue_completed ?? false,
  };
}

async function fetchGrammarData(supabase: SupabaseClient, userId: string, unitId: string) {
  // First get lessons, then filter video progress by lesson IDs
  const grammarRes = await supabase.from('naesin_grammar_lessons').select('id, title, content_type, youtube_video_id, text_content, sort_order').eq('unit_id', unitId).order('sort_order');
  const grammarLessons = grammarRes.data || [];
  const lessonIds = grammarLessons.map((l: { id: string }) => l.id);

  const videoProgress = lessonIds.length > 0
    ? (await supabase.from('naesin_grammar_video_progress').select('id, lesson_id, completed').eq('student_id', userId).in('lesson_id', lessonIds)).data || []
    : [];

  return { grammarLessons, videoProgress };
}

async function fetchTextbookVideoData(supabase: SupabaseClient, userId: string, unitId: string) {
  // First get videos, then filter progress by video IDs
  const videoRes = await supabase.from('naesin_textbook_videos').select('id, title, youtube_video_id, sort_order').eq('unit_id', unitId).order('sort_order');
  const textbookVideos = videoRes.data || [];
  const videoIds = textbookVideos.map((v: { id: string }) => v.id);

  const textbookVideoProgress = videoIds.length > 0
    ? (await supabase.from('naesin_textbook_video_progress').select('id, video_id, completed').eq('student_id', userId).in('video_id', videoIds)).data || []
    : [];

  return { textbookVideos, textbookVideoProgress };
}

async function fetchMockExamData(supabase: SupabaseClient, unitId: string, userId?: string) {
  // First get sheets, then filter attempts by sheet IDs
  const mockExamRes = await supabase
    .from('naesin_problem_sheets')
    .select(SHEET_LITE_COLUMNS)
    .eq('unit_id', unitId)
    .eq('category', 'mock_exam')
    .order('sort_order');

  const mockExamSheets = mockExamRes.data || [];
  const mockSheetIds = new Set(mockExamSheets.map((s) => s.id));

  const attemptsRes = userId && mockSheetIds.size > 0
    ? await supabase
        .from('naesin_problem_attempts')
        .select('sheet_id, score, total_questions, wrong_answers, created_at')
        .eq('student_id', userId)
        .in('sheet_id', [...mockSheetIds])
        .order('created_at', { ascending: false })
    : { data: [] };

  const bestScoreBySheet: Record<string, number> = {};
  const lastAttemptBySheet: Record<string, {
    score: number;
    total_questions: number;
    wrong_answers: { number: number; userAnswer: string | number; correctAnswer: string | number; question?: string }[];
    created_at: string;
  }> = {};
  for (const row of attemptsRes.data || []) {
    if (!mockSheetIds.has(row.sheet_id)) continue;
    const prev = bestScoreBySheet[row.sheet_id];
    if (prev == null || row.score > prev) {
      bestScoreBySheet[row.sheet_id] = row.score;
    }
    if (!lastAttemptBySheet[row.sheet_id]) {
      lastAttemptBySheet[row.sheet_id] = {
        score: row.score,
        total_questions: row.total_questions,
        wrong_answers: row.wrong_answers || [],
        created_at: row.created_at,
      };
    }
  }

  return { mockExamSheets, bestScoreBySheet, lastAttemptBySheet };
}

async function fetchProblemData(supabase: SupabaseClient, unitId: string, userId?: string) {
  // First get sheets, then filter attempts by sheet IDs
  const problemRes = await supabase
    .from('naesin_problem_sheets')
    .select(SHEET_LITE_COLUMNS)
    .eq('unit_id', unitId)
    .in('category', ['problem', 'external_passage', 'eng_eng_def'])
    .order('sort_order');

  const sheetIds = (problemRes.data || []).map((s) => s.id);
  const attemptsRes = userId && sheetIds.length > 0
    ? await supabase
        .from('naesin_problem_attempts')
        .select('sheet_id, score, total_questions, wrong_answers, created_at')
        .eq('student_id', userId)
        .in('sheet_id', sheetIds)
        .order('created_at', { ascending: false })
    : { data: [] };

  // Compute best score + last attempt per sheet
  const bestScoreBySheet: Record<string, number> = {};
  const lastAttemptBySheet: Record<string, {
    score: number;
    total_questions: number;
    wrong_answers: { number: number; userAnswer: string | number; correctAnswer: string | number; question?: string }[];
    created_at: string;
  }> = {};
  for (const row of attemptsRes.data || []) {
    const prev = bestScoreBySheet[row.sheet_id];
    if (prev == null || row.score > prev) {
      bestScoreBySheet[row.sheet_id] = row.score;
    }
    // 최신순 정렬이므로 첫 번째가 최근 시도
    if (!lastAttemptBySheet[row.sheet_id]) {
      lastAttemptBySheet[row.sheet_id] = {
        score: row.score,
        total_questions: row.total_questions,
        wrong_answers: row.wrong_answers || [],
        created_at: row.created_at,
      };
    }
  }

  return { problemSheets: problemRes.data || [], bestScoreBySheet, lastAttemptBySheet };
}

async function fetchLastReviewData(supabase: SupabaseClient, unitId: string) {
  const [sheetsRes, similarRes, contentRes] = await Promise.all([
    supabase.from('naesin_problem_sheets').select(SHEET_LITE_COLUMNS).eq('unit_id', unitId).eq('category', 'last_review').order('sort_order'),
    supabase.from('naesin_similar_problems').select('id, grammar_tag, question_data, status').eq('unit_id', unitId).eq('status', 'approved'),
    supabase.from('naesin_last_review_content').select('id, content_type, title, youtube_video_id, pdf_url, text_content').eq('unit_id', unitId).order('sort_order'),
  ]);
  return {
    lastReviewProblemSheets: sheetsRes.data || [],
    similarProblems: similarRes.data || [],
    reviewContent: contentRes.data || [],
  };
}
