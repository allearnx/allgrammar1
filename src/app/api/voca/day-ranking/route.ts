import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { createAdminClient } from '@/lib/supabase/admin';

export const GET = createApiHandler(
  { hasBody: false },
  async ({ request, user }) => {
    const { searchParams } = new URL(request.url);
    const dayId = searchParams.get('dayId');
    if (!dayId) {
      return NextResponse.json({ error: 'dayId is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const academyId = user.academy_id;

    // 학원 없는 학생 → 본인 점수만 반환
    if (!academyId) {
      const { data: myProgress } = await admin
        .from('voca_student_progress')
        .select('quiz_score, spelling_score, matching_score')
        .eq('student_id', user.id)
        .eq('day_id', dayId)
        .single();

      const quiz = myProgress?.quiz_score ?? 0;
      const spelling = myProgress?.spelling_score ?? 0;
      const matching = myProgress?.matching_score ?? 0;

      return NextResponse.json({
        rank: 1,
        totalStudents: 1,
        totalScore: quiz + spelling + matching,
        scores: { quiz, spelling, matching },
        topStudents: [{ name: user.full_name, score: quiz + spelling + matching, rank: 1 }],
      });
    }

    // 같은 학원 + voca 서비스 학생 조회
    const { data: assignments } = await admin
      .from('service_assignments')
      .select('student_id, users!inner(id, full_name, academy_id, is_active)')
      .eq('service', 'voca')
      .eq('users.academy_id', academyId)
      .eq('users.is_active', true);

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({
        rank: 1,
        totalStudents: 1,
        totalScore: 0,
        scores: { quiz: 0, spelling: 0, matching: 0 },
        topStudents: [],
      });
    }

    // 중복 제거
    const studentMap = new Map<string, string>();
    for (const a of assignments) {
      const u = a.users as unknown as { id: string; full_name: string };
      if (u && !studentMap.has(u.id)) {
        studentMap.set(u.id, u.full_name);
      }
    }

    const studentIds = [...studentMap.keys()];

    // 해당 Day progress 조회
    const { data: progressRows } = await admin
      .from('voca_student_progress')
      .select('student_id, quiz_score, spelling_score, matching_score, updated_at')
      .eq('day_id', dayId)
      .in('student_id', studentIds);

    // 점수 계산 + 정렬 (총점 DESC → 완료 시간 ASC)
    interface RankedStudent {
      id: string;
      name: string;
      score: number;
      quiz: number;
      spelling: number;
      matching: number;
      updatedAt: string;
      rank: number;
    }

    const ranked: RankedStudent[] = studentIds
      .map((id) => {
        const p = progressRows?.find((r) => r.student_id === id);
        const quiz = p?.quiz_score ?? 0;
        const spelling = p?.spelling_score ?? 0;
        const matching = p?.matching_score ?? 0;
        return {
          id,
          name: studentMap.get(id) ?? '',
          score: quiz + spelling + matching,
          quiz,
          spelling,
          matching,
          updatedAt: p?.updated_at ?? '9999-12-31',
          rank: 0,
        };
      })
      .sort((a, b) => b.score - a.score || a.updatedAt.localeCompare(b.updatedAt));

    // 순위 부여
    for (let i = 0; i < ranked.length; i++) {
      ranked[i].rank = i > 0 && ranked[i].score === ranked[i - 1].score && ranked[i].updatedAt === ranked[i - 1].updatedAt
        ? ranked[i - 1].rank
        : i + 1;
    }

    const me = ranked.find((r) => r.id === user.id);
    const topStudents = ranked.slice(0, 5).map((r) => ({
      name: r.name,
      score: r.score,
      rank: r.rank,
    }));

    return NextResponse.json({
      rank: me?.rank ?? ranked.length + 1,
      totalStudents: ranked.length,
      totalScore: me?.score ?? 0,
      scores: {
        quiz: me?.quiz ?? 0,
        spelling: me?.spelling ?? 0,
        matching: me?.matching ?? 0,
      },
      topStudents,
    });
  }
);
