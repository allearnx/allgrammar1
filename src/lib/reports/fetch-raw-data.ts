import type { SupabaseClient } from '@supabase/supabase-js';

export async function fetchRawData(qc: SupabaseClient, sid: string, ninetyDaysAgo: string) {
  return Promise.all([
    // Phase 1
    qc.from('student_progress').select('video_completed, video_watched_seconds').eq('student_id', sid),
    qc.from('student_memory_progress').select('is_mastered, quiz_correct_count, quiz_wrong_count').eq('student_id', sid),

    // Naesin
    qc.from('naesin_student_progress').select('unit_id, vocab_completed, vocab_quiz_score, passage_completed, grammar_completed, problem_completed, last_review_unlocked').eq('student_id', sid),
    qc.from('naesin_problem_attempts').select('score, total_questions, created_at, unit_id').eq('student_id', sid).order('created_at', { ascending: false }).limit(50),
    qc.from('naesin_wrong_answers').select('id, resolved, stage, unit_id').eq('student_id', sid),
    qc.from('naesin_grammar_video_progress').select('completed, cumulative_watch_seconds, created_at, unit_id').eq('student_id', sid),
    qc.from('naesin_vocab_quiz_set_results').select('score, created_at, unit_id').eq('student_id', sid).order('created_at', { ascending: false }).limit(50),

    // Voca
    qc.from('voca_student_progress').select('day_id, flashcard_completed, quiz_score, spelling_score, matching_score, matching_completed, round2_flashcard_completed, round2_quiz_score, round2_matching_score, round2_matching_completed').eq('student_id', sid),

    // Trends
    qc.from('voca_quiz_results').select('score, created_at, wrong_words, day_id').eq('student_id', sid).order('created_at', { ascending: false }).limit(50),

    // Wrong words
    qc.from('voca_quiz_results').select('wrong_words').eq('student_id', sid),
    qc.from('voca_matching_submissions').select('wrong_words').eq('student_id', sid),

    // Activity log (last 90 days)
    qc.from('voca_quiz_results').select('score, created_at, day_id').eq('student_id', sid).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    qc.from('voca_matching_submissions').select('score, created_at, day_id').eq('student_id', sid).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    qc.from('naesin_vocab_quiz_set_results').select('score, created_at, unit_id').eq('student_id', sid).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    qc.from('naesin_problem_attempts').select('score, total_questions, created_at, unit_id').eq('student_id', sid).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    qc.from('naesin_passage_attempts').select('created_at, unit_id').eq('student_id', sid).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    qc.from('naesin_grammar_video_progress').select('created_at, unit_id').eq('student_id', sid).eq('completed', true).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
  ]);
}
