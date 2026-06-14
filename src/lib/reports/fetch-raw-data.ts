import type { SupabaseClient } from '@supabase/supabase-js';

/** id[] → unit_id 매핑 (해당 테이블의 unit_id 컬럼 기준) */
async function resolveUnitMap(qc: SupabaseClient, table: string, ids: string[]) {
  const m = new Map<string, string>();
  if (ids.length === 0) return m;
  const { data } = await qc.from(table).select('id, unit_id').in('id', ids);
  for (const r of (data || []) as { id: string; unit_id: string | null }[]) {
    if (r.unit_id) m.set(r.id, r.unit_id);
  }
  return m;
}

export async function fetchRawData(qc: SupabaseClient, sid: string, ninetyDaysAgo: string) {
  const [
    p1video, mem, nProg, nProb, nWrong, nVideo, nQuizSet,
    vProg, vQuizHist, vQuizWrong, vMatchWrong,
    vQuizAct, vMatchAct, nVocabAct, nProbAct, nPassAct, nVideoAct,
    nPassAll, nProbAll,
  ] = await Promise.all([
    // Phase 1
    qc.from('student_progress').select('video_completed, video_watched_seconds').eq('student_id', sid),
    qc.from('student_memory_progress').select('is_mastered, quiz_correct_count, quiz_wrong_count').eq('student_id', sid),

    // Naesin
    qc.from('naesin_student_progress').select('unit_id, vocab_completed, vocab_quiz_score, passage_completed, dialogue_completed, grammar_completed, problem_completed, mock_exam_completed, last_review_unlocked').eq('student_id', sid),
    // 시도엔 unit_id 컬럼 없음 — sheet_id 로 받아 아래에서 unit_id 유도
    qc.from('naesin_problem_attempts').select('score, total_questions, created_at, sheet_id').eq('student_id', sid).order('created_at', { ascending: false }).limit(50),
    qc.from('naesin_wrong_answers').select('id, resolved, stage, unit_id').eq('student_id', sid).limit(1000),
    // 영상 진도엔 created_at/unit_id 컬럼 없음 — 소비자는 completed/누적초만 사용
    qc.from('naesin_grammar_video_progress').select('completed, cumulative_watch_seconds').eq('student_id', sid),
    qc.from('naesin_vocab_quiz_set_results').select('score, created_at').eq('student_id', sid).order('created_at', { ascending: false }).limit(50),

    // Voca
    qc.from('voca_student_progress').select('day_id, flashcard_completed, quiz_score, spelling_score, matching_score, matching_completed, round2_flashcard_completed, round2_quiz_score, round2_matching_score, round2_matching_completed').eq('student_id', sid),

    // Trends
    qc.from('voca_quiz_results').select('score, created_at, wrong_words, day_id').eq('student_id', sid).order('created_at', { ascending: false }).limit(50),

    // Wrong words (recent 500 — enough for frequency analysis)
    qc.from('voca_quiz_results').select('wrong_words').eq('student_id', sid).order('created_at', { ascending: false }).limit(500),
    qc.from('voca_matching_submissions').select('wrong_words').eq('student_id', sid).order('created_at', { ascending: false }).limit(500),

    // Activity log (last 90 days)
    qc.from('voca_quiz_results').select('score, created_at, day_id').eq('student_id', sid).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    // 매칭 제출엔 score 컬럼 없음 (status/wrong_words/writings)
    qc.from('voca_matching_submissions').select('created_at, day_id').eq('student_id', sid).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    qc.from('naesin_vocab_quiz_set_results').select('score, created_at, quiz_set_id').eq('student_id', sid).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    qc.from('naesin_problem_attempts').select('score, total_questions, created_at, sheet_id').eq('student_id', sid).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    qc.from('naesin_passage_attempts').select('created_at, unit_id, type, difficulty, score').eq('student_id', sid).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    // 영상 진도: 완료 시각은 updated_at, 단원은 lesson 으로 유도
    qc.from('naesin_grammar_video_progress').select('updated_at, lesson_id').eq('student_id', sid).eq('completed', true).gte('updated_at', ninetyDaysAgo).order('updated_at', { ascending: false }).limit(200),

    // Passage attempts for unit breakdown (all-time best scores, cap at 500)
    qc.from('naesin_passage_attempts').select('unit_id, type, difficulty, score').eq('student_id', sid).order('created_at', { ascending: false }).limit(500),

    // Topic accuracy: recent 500 problem attempts (compute-topic-accuracy 가 sheet_id 로 unit 유도)
    qc.from('naesin_problem_attempts').select('score, total_questions, created_at, sheet_id').eq('student_id', sid).order('created_at', { ascending: false }).limit(500),
  ]);

  // ── unit_id 유도: 시도(sheet→unit), 영상활동(lesson→unit), 단어퀴즈활동(quiz_set→unit) ──
  type ProbRow = { score: number; total_questions: number; created_at: string; sheet_id: string | null };
  type QuizRow = { score: number; created_at: string; quiz_set_id: string | null };
  type VidRow = { updated_at: string; lesson_id: string | null };
  const probRows = (nProb.data || []) as ProbRow[];
  const probActRows = (nProbAct.data || []) as ProbRow[];
  const quizRows = (nVocabAct.data || []) as QuizRow[];
  const vidRows = (nVideoAct.data || []) as VidRow[];

  const sheetIds = new Set<string>();
  for (const r of probRows) if (r.sheet_id) sheetIds.add(r.sheet_id);
  for (const r of probActRows) if (r.sheet_id) sheetIds.add(r.sheet_id);
  const quizSetIds = [...new Set(quizRows.map((r) => r.quiz_set_id).filter(Boolean) as string[])];
  const lessonIds = [...new Set(vidRows.map((r) => r.lesson_id).filter(Boolean) as string[])];

  const [sheetUnit, quizSetUnit, lessonUnit] = await Promise.all([
    resolveUnitMap(qc, 'naesin_problem_sheets', [...sheetIds]),
    resolveUnitMap(qc, 'naesin_vocab_quiz_sets', quizSetIds),
    resolveUnitMap(qc, 'naesin_grammar_lessons', lessonIds),
  ]);

  const attachSheetUnit = (rows: ProbRow[]) =>
    rows.map((r) => ({ ...r, unit_id: r.sheet_id ? sheetUnit.get(r.sheet_id) : undefined }));

  // 패치된 슬라이스는 { data } 래퍼로 동일 형태 유지 (소비자 변경 불필요)
  const nProbPatched = { data: attachSheetUnit(probRows) };
  const nProbActPatched = { data: attachSheetUnit(probActRows) };
  const nVocabActPatched = {
    data: quizRows.map((r) => ({ ...r, unit_id: r.quiz_set_id ? quizSetUnit.get(r.quiz_set_id) : undefined })),
  };
  const nVideoActPatched = {
    data: vidRows.map((r) => ({ created_at: r.updated_at, unit_id: r.lesson_id ? lessonUnit.get(r.lesson_id) : undefined })),
  };

  return [
    p1video, mem, nProg, nProbPatched, nWrong, nVideo, nQuizSet,
    vProg, vQuizHist, vQuizWrong, vMatchWrong,
    vQuizAct, vMatchAct, nVocabActPatched, nProbActPatched, nPassAct, nVideoActPatched,
    nPassAll, nProbAll,
  ] as const;
}
