import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler, NotFoundError, dbResult } from '@/lib/api';

/**
 * 서술형 AI 채점 검수.
 * GET: AI 채점 로그 목록 (미검수 우선) — 선생님이 AI 판정을 확인·교정하는 화면용.
 * PATCH: 검수 결과 저장 (교정 점수·피드백). RLS는 naesin_manage_allowed() 기준.
 */

export const GET = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'] },
  async ({ request, supabase }) => {
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') === 'all' ? 'all' : 'pending';

    let query = supabase
      .from('subjective_grading_logs')
      .select('id, user_id, sheet_id, question_number, question, reference_answer, student_answer, ai_score, ai_feedback, corrected_answer, grading_method, teacher_score, teacher_feedback, reviewed_at, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (filter === 'pending') {
      query = query.is('reviewed_at', null);
    }

    const logs = dbResult(await query) ?? [];

    // 학생 이름 병합 (FK 조인명 추측 대신 명시 조회 — 유령 컬럼 사고 방지)
    const userIds = [...new Set(logs.map((l) => l.user_id))];
    const nameById = new Map<string, string>();
    if (userIds.length > 0) {
      const users = dbResult(
        await supabase.from('users').select('id, full_name').in('id', userIds),
      ) ?? [];
      for (const u of users) nameById.set(u.id, u.full_name ?? '');
    }

    return NextResponse.json({
      logs: logs.map((l) => ({ ...l, student_name: nameById.get(l.user_id) ?? '(알 수 없음)' })),
    });
  }
);

const reviewSchema = z.object({
  id: z.string().uuid(),
  teacherScore: z.union([z.literal(0), z.literal(50), z.literal(100)]),
  teacherFeedback: z.string().max(500).nullish(),
});

export const PATCH = createApiHandler(
  { schema: reviewSchema, roles: ['teacher', 'admin', 'boss'] },
  async ({ user, body, supabase }) => {
    const { data, error } = await supabase
      .from('subjective_grading_logs')
      .update({
        teacher_score: body.teacherScore,
        teacher_feedback: body.teacherFeedback ?? null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', body.id)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new NotFoundError('검수 대상을 찾을 수 없습니다.');
    return NextResponse.json({ ok: true });
  }
);
