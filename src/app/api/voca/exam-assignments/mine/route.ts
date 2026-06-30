import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { createAdminClient } from '@/lib/supabase/admin';

interface AssignmentRow {
  id: string;
  book_id: string;
  day_ids: string[];
  title: string | null;
  created_at: string;
}

// GET — 학생 본인에게 배정된 시험 목록 (최고점 포함)
export const GET = createApiHandler(
  { roles: ['student'], hasBody: false },
  async ({ user }) => {
    const admin = createAdminClient();
    const { data: aRaw } = await admin
      .from('voca_exam_assignments')
      .select('id, book_id, day_ids, title, created_at')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });
    const assignments = (aRaw as AssignmentRow[] | null) ?? [];
    if (assignments.length === 0) return NextResponse.json({ assignments: [], dayTitles: {} });

    // 최고점/응시횟수 (assignment_id 기준)
    const ids = assignments.map((a) => a.id);
    const best = new Map<string, { best: number; attempts: number }>();
    const { data: results } = await admin
      .from('voca_exam_results')
      .select('assignment_id, score')
      .eq('student_id', user.id)
      .in('assignment_id', ids);
    for (const r of results || []) {
      const aid = r.assignment_id as string;
      const cur = best.get(aid) ?? { best: -1, attempts: 0 };
      cur.attempts += 1;
      if ((r.score as number) > cur.best) cur.best = r.score as number;
      best.set(aid, cur);
    }

    // Day 제목
    const allDayIds = new Set<string>();
    for (const a of assignments) for (const d of a.day_ids || []) allDayIds.add(d);
    const dayTitles: Record<string, string> = {};
    if (allDayIds.size > 0) {
      const { data: days } = await admin.from('voca_days').select('id, title').in('id', [...allDayIds]);
      for (const d of days || []) dayTitles[d.id] = d.title;
    }

    return NextResponse.json({
      dayTitles,
      assignments: assignments.map((a) => {
        const r = best.get(a.id);
        return {
          id: a.id,
          bookId: a.book_id,
          dayIds: a.day_ids,
          title: a.title,
          bestScore: r && r.best >= 0 ? r.best : null,
          attempts: r?.attempts ?? 0,
        };
      }),
    });
  },
);
