import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { createAdminClient } from '@/lib/supabase/admin';

export const GET = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], hasBody: false, rateLimit: { max: 30, windowMs: 60_000 } },
  async ({ request, user }) => {
    const { searchParams } = new URL(request.url);
    const dayId = searchParams.get('dayId');
    if (!dayId) {
      return NextResponse.json({ error: 'dayId is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const academyId = user.academy_id;

    // boss without academy → fetch all students; admin/teacher require academy
    if (!academyId && user.role !== 'boss') {
      return NextResponse.json({ error: '학원에 소속되어 있지 않습니다.' }, { status: 400 });
    }

    // 1. Get voca-assigned students (filtered by academy for admin/teacher)
    let studentQuery = admin
      .from('service_assignments')
      .select('student_id, users!inner(id, full_name, is_active)')
      .eq('service', 'voca');

    if (academyId) {
      studentQuery = studentQuery.eq('users.academy_id', academyId);
    }
    studentQuery = studentQuery.eq('users.is_active', true);

    const { data: assignments } = await studentQuery;

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ students: [] });
    }

    // Deduplicate by student_id
    const studentMap = new Map<string, { id: string; name: string }>();
    for (const a of assignments) {
      const u = a.users as unknown as { id: string; full_name: string };
      if (u && !studentMap.has(u.id)) {
        studentMap.set(u.id, { id: u.id, name: u.full_name });
      }
    }

    const studentIds = [...studentMap.keys()];

    // 2. Fetch progress for this day
    const { data: progressRows } = await admin
      .from('voca_student_progress')
      .select('student_id, flashcard_completed, quiz_score, spelling_score, matching_score, matching_completed, updated_at')
      .eq('day_id', dayId)
      .in('student_id', studentIds);

    const progressMap = new Map<string, NonNullable<typeof progressRows>[0]>();
    for (const p of progressRows || []) {
      progressMap.set(p.student_id, p);
    }

    // 3. Build response
    const students = [...studentMap.values()]
      .map((s) => {
        const p = progressMap.get(s.id) || null;
        return {
          studentId: s.id,
          studentName: s.name,
          progress: p
            ? {
                flashcard_completed: p.flashcard_completed,
                quiz_score: p.quiz_score,
                spelling_score: p.spelling_score,
                matching_score: p.matching_score,
                matching_completed: p.matching_completed,
                updated_at: p.updated_at,
              }
            : null,
        };
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName, 'ko'));

    return NextResponse.json({ students });
  }
);
