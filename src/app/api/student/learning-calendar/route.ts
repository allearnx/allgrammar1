import { NextResponse } from 'next/server';
import { ValidationError, createApiHandler } from '@/lib/api';
import { requireAcademyScope } from '@/lib/api/require-academy-scope';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeActivityLog } from '@/lib/reports/compute-activity-log';
import { format, subDays } from 'date-fns';

export const GET = createApiHandler(
  { roles: ['student', 'teacher', 'admin', 'boss'], hasBody: false },
  async ({ user, supabase, request }) => {
    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get('studentId');

    let targetStudentId: string;

    if (user.role === 'student') {
      targetStudentId = user.id;
    } else {
      if (!studentIdParam) {
        throw new ValidationError('studentId가 필요합니다.');
      }
      targetStudentId = studentIdParam;
      await requireAcademyScope(user, targetStudentId, supabase);
    }

    const queryClient = user.role === 'student' ? supabase : createAdminClient();
    const ninetyDaysAgo = format(subDays(new Date(), 90), 'yyyy-MM-dd');

    // Fetch daily learning seconds
    const { data: dailyRows } = await queryClient
      .from('learning_daily_log')
      .select('date, seconds')
      .eq('student_id', targetStudentId)
      .gte('date', ninetyDaysAgo);

    const dailySeconds: Record<string, number> = {};
    if (dailyRows) {
      for (const row of dailyRows) {
        const d = row.date;
        dailySeconds[d] = (dailySeconds[d] || 0) + row.seconds;
      }
    }

    // Fetch activity log (reuse existing compute logic)
    const [
      vocaQuizActivityRes, vocaMatchingActivityRes,
      naesinVocabActivityRes, naesinProblemActivityRes,
      naesinPassageActivityRes, naesinVideoActivityRes,
      epVideoActivityRes,
    ] = await Promise.all([
      queryClient.from('voca_quiz_results').select('score, created_at, day_id').eq('student_id', targetStudentId).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
      // 매칭 제출엔 score 컬럼 없음
      queryClient.from('voca_matching_submissions').select('created_at, day_id').eq('student_id', targetStudentId).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
      // 시도/퀴즈셋/영상엔 unit_id 컬럼 없음 — 원본 키로 받아 아래에서 unit 유도
      queryClient.from('naesin_vocab_quiz_set_results').select('score, created_at, quiz_set_id').eq('student_id', targetStudentId).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
      queryClient.from('naesin_problem_attempts').select('score, total_questions, created_at, sheet_id').eq('student_id', targetStudentId).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
      queryClient.from('naesin_passage_attempts').select('created_at, unit_id').eq('student_id', targetStudentId).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
      queryClient.from('naesin_grammar_video_progress').select('updated_at, lesson_id').eq('student_id', targetStudentId).eq('completed', true).gte('updated_at', ninetyDaysAgo).order('updated_at', { ascending: false }).limit(200),
      queryClient.from('naesin_ep_video_progress').select('created_at, sheet_id').eq('student_id', targetStudentId).eq('completed', true).gte('created_at', ninetyDaysAgo).order('created_at', { ascending: false }).limit(200),
    ]);

    // unit_id 유도 (시도→sheet, 단어퀴즈→quiz_set, 영상→lesson)
    const resolveUnit = async (table: string, ids: string[]) => {
      const m = new Map<string, string>();
      if (ids.length === 0) return m;
      const { data } = await queryClient.from(table).select('id, unit_id').in('id', ids);
      for (const r of (data || []) as { id: string; unit_id: string | null }[]) if (r.unit_id) m.set(r.id, r.unit_id);
      return m;
    };
    const probRows = (naesinProblemActivityRes.data || []) as { score: number; total_questions: number; created_at: string; sheet_id: string | null }[];
    const quizRows = (naesinVocabActivityRes.data || []) as { score: number; created_at: string; quiz_set_id: string | null }[];
    const vidRows = (naesinVideoActivityRes.data || []) as { updated_at: string; lesson_id: string | null }[];
    const [sheetUnit, quizSetUnit, lessonUnit] = await Promise.all([
      resolveUnit('naesin_problem_sheets', [...new Set(probRows.map((r) => r.sheet_id).filter(Boolean) as string[])]),
      resolveUnit('naesin_vocab_quiz_sets', [...new Set(quizRows.map((r) => r.quiz_set_id).filter(Boolean) as string[])]),
      resolveUnit('naesin_grammar_lessons', [...new Set(vidRows.map((r) => r.lesson_id).filter(Boolean) as string[])]),
    ]);

    // Merge EP video completions into video activity (use sheet_id as unit_id placeholder)
    const epVideoActivity = (epVideoActivityRes.data || []).map((r) => ({
      created_at: r.created_at,
      unit_id: r.sheet_id,
    }));
    const mergedVideoActivity = [
      ...vidRows.map((r) => ({ created_at: r.updated_at, unit_id: r.lesson_id ? lessonUnit.get(r.lesson_id) : undefined })),
      ...epVideoActivity,
    ];

    const activities = await computeActivityLog(
      queryClient,
      vocaQuizActivityRes.data || [],
      vocaMatchingActivityRes.data || [],
      quizRows.map((r) => ({ score: r.score, created_at: r.created_at, unit_id: r.quiz_set_id ? quizSetUnit.get(r.quiz_set_id) : undefined })),
      probRows.map((r) => ({ score: r.score, total_questions: r.total_questions, created_at: r.created_at, unit_id: r.sheet_id ? sheetUnit.get(r.sheet_id) : undefined })),
      naesinPassageActivityRes.data || [],
      mergedVideoActivity,
    );

    return NextResponse.json({ dailySeconds, activities });
  }
);
