import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { countCompletedStages, STAGE_COMPLETION_COLS } from '@/lib/naesin/progress-queries';

const ACTIVE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

const STAGE_LABELS: Record<string, string> = {
  vocab: '단어 암기',
  passage: '교과서 암기',
  dialogue: '대화문 암기',
  textbookVideo: '설명 영상',
  grammar: '문법 설명',
  problem: '문제풀이',
  external_passage: '외부지문',
  eng_eng_def: '영영풀이',
  mockExam: '모의고사',
  lastReview: '라스트리뷰',
};

export const GET = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], hasBody: false, rateLimit: { max: 30, windowMs: 60_000 } },
  async ({ user }) => {
    if (!user.academy_id) {
      return NextResponse.json({ error: '학원에 소속되어 있지 않습니다.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const academyId = user.academy_id;
    const today = new Date().toISOString().split('T')[0];

    // 1. Get academy students (include last_active_at for presence)
    const { data: students } = await admin
      .from('users')
      .select('id, full_name, last_active_at')
      .eq('role', 'student')
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .order('full_name');

    const studentList = students || [];
    const studentIds = studentList.map((s) => s.id);

    if (studentIds.length === 0) {
      return NextResponse.json({ students: [], learningCount: 0, onlineCount: 0, totalCount: 0 });
    }

    const now = Date.now();

    // Build presence map (last_active_at within 2 min = online)
    const presenceMap = new Map<string, boolean>();
    for (const s of studentList) {
      const lastActive = (s as { last_active_at?: string }).last_active_at;
      presenceMap.set(s.id, !!lastActive && now - new Date(lastActive).getTime() < ACTIVE_THRESHOLD_MS);
    }

    // 2. Parallel queries
    const [
      { data: naesinProgress },
      { data: vocaProgress },
      { data: dailyLogs },
    ] = await Promise.all([
      admin
        .from('naesin_student_progress')
        .select('student_id, unit_id, updated_at, current_stage, current_round, vocab_completed, passage_completed, dialogue_completed, grammar_completed, problem_completed, mock_exam_completed')
        .in('student_id', studentIds),
      admin
        .from('voca_student_progress')
        .select('student_id, day_id, updated_at')
        .in('student_id', studentIds),
      admin
        .from('learning_daily_log')
        .select('student_id, seconds, context_type')
        .in('student_id', studentIds)
        .eq('date', today),
    ]);

    // 3. Get unit info for recently active naesin students
    const recentNaesinUnitIds = new Set(
      (naesinProgress || [])
        .filter((p) => p.updated_at && now - new Date(p.updated_at).getTime() < ACTIVE_THRESHOLD_MS)
        .map((p) => p.unit_id)
    );
    const recentVocaDayIds = new Set(
      (vocaProgress || [])
        .filter((p) => p.updated_at && now - new Date(p.updated_at).getTime() < ACTIVE_THRESHOLD_MS)
        .map((p) => p.day_id)
    );

    // Fetch unit/day names only for active students
    const [{ data: units }, { data: vocaDays }] = await Promise.all([
      recentNaesinUnitIds.size > 0
        ? admin.from('naesin_units').select('id, unit_number, title').in('id', [...recentNaesinUnitIds])
        : Promise.resolve({ data: [] as { id: string; unit_number: number; title: string }[] }),
      recentVocaDayIds.size > 0
        ? admin.from('voca_days').select('id, day_number, title, book_id').in('id', [...recentVocaDayIds])
        : Promise.resolve({ data: [] as { id: string; day_number: number; title: string; book_id: string }[] }),
    ]);

    const unitMap = new Map((units || []).map((u) => [u.id, u]));
    const dayMap = new Map((vocaDays || []).map((d) => [d.id, d]));

    // 4. Build per-student aggregates
    // Naesin: group by student, find most recent, count stages
    const naesinByStudent = new Map<string, typeof naesinProgress>();
    for (const p of naesinProgress || []) {
      const list = naesinByStudent.get(p.student_id) || [];
      list.push(p);
      naesinByStudent.set(p.student_id, list);
    }

    const vocaByStudent = new Map<string, typeof vocaProgress>();
    for (const p of vocaProgress || []) {
      const list = vocaByStudent.get(p.student_id) || [];
      list.push(p);
      vocaByStudent.set(p.student_id, list);
    }

    // Daily log totals
    const dailySecondsByStudent = new Map<string, number>();
    for (const log of dailyLogs || []) {
      dailySecondsByStudent.set(log.student_id, (dailySecondsByStudent.get(log.student_id) || 0) + (log.seconds || 0));
    }

    // 5. Build response
    let learningCount = 0;
    let onlineCount = 0;
    const result = studentList.map((student) => {
      const naesinRows = naesinByStudent.get(student.id) || [];
      const vocaRows = vocaByStudent.get(student.id) || [];

      // Find most recent activity across naesin and voca
      let latestNaesin: (typeof naesinRows)[0] | null = null;
      for (const row of naesinRows) {
        if (row.updated_at && (!latestNaesin || row.updated_at > latestNaesin.updated_at)) {
          latestNaesin = row;
        }
      }
      let latestVoca: (typeof vocaRows)[0] | null = null;
      for (const row of vocaRows) {
        if (row.updated_at && (!latestVoca || row.updated_at > latestVoca.updated_at)) {
          latestVoca = row;
        }
      }

      // Determine current activity (most recent of naesin vs voca)
      const naesinTime = latestNaesin?.updated_at ? new Date(latestNaesin.updated_at).getTime() : 0;
      const vocaTime = latestVoca?.updated_at ? new Date(latestVoca.updated_at).getTime() : 0;
      const latestTime = Math.max(naesinTime, vocaTime);
      const isLearning = latestTime > 0 && now - latestTime < ACTIVE_THRESHOLD_MS;
      const isOnline = presenceMap.get(student.id) || false;

      // status: 'learning' > 'online' > 'offline'
      const status: 'learning' | 'online' | 'offline' = isLearning ? 'learning' : isOnline ? 'online' : 'offline';
      if (status === 'learning') learningCount++;
      else if (status === 'online') onlineCount++;

      let currentActivity: { type: 'naesin' | 'voca'; label: string; stage: string | null; round?: number; updatedAt: string } | null = null;
      if (isLearning) {
        if (naesinTime >= vocaTime && latestNaesin) {
          const unit = unitMap.get(latestNaesin.unit_id);
          const stageKey = latestNaesin.current_stage as string | undefined;
          const currentRound = (latestNaesin as Record<string, unknown>).current_round as number | undefined;
          currentActivity = {
            type: 'naesin',
            label: unit ? `Unit ${unit.unit_number} ${unit.title}` : '내신 학습 중',
            stage: stageKey ? (STAGE_LABELS[stageKey] || stageKey) : null,
            ...(currentRound && currentRound >= 2 ? { round: currentRound } : {}),
            updatedAt: latestNaesin.updated_at,
          };
        } else if (latestVoca) {
          const day = dayMap.get(latestVoca.day_id);
          currentActivity = {
            type: 'voca',
            label: day ? `Day ${day.day_number}` : '보카 학습 중',
            stage: null,
            updatedAt: latestVoca.updated_at,
          };
        }
      }

      // Count completed stages
      let completedStages = 0;
      const totalStages = naesinRows.length * STAGE_COMPLETION_COLS.length;
      for (const row of naesinRows) {
        completedStages += countCompletedStages(row as unknown as Record<string, unknown>);
      }

      return {
        id: student.id,
        name: student.full_name,
        status,
        currentActivity,
        todaySeconds: dailySecondsByStudent.get(student.id) || 0,
        naesinProgress: { completed: completedStages, total: totalStages },
      };
    });

    // Sort: learning → online → offline, then by name
    const statusOrder = { learning: 0, online: 1, offline: 2 };
    result.sort((a, b) => {
      const diff = statusOrder[a.status] - statusOrder[b.status];
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name, 'ko');
    });

    return NextResponse.json({
      students: result,
      learningCount,
      onlineCount,
      totalCount: studentList.length,
    });
  }
);
