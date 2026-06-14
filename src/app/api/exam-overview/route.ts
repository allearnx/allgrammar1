import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDDay } from '@/lib/dashboard/naesin-helpers';
import { countCompletedStages, totalStagesPerUnit } from '@/lib/naesin/progress-queries';

export interface ExamOverviewItem {
  studentId: string;
  studentName: string;
  textbookName: string;
  examDate: string;
  dday: number;
  source: 'student' | 'teacher';
  examLabel: string | null;
  progressPercent: number;
}

export const GET = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], hasBody: false, rateLimit: { max: 30, windowMs: 60_000 } },
  async ({ user }) => {
    const admin = createAdminClient();

    // Boss sees all students, others see own academy
    const studentQuery = admin
      .from('users')
      .select('id, full_name, academy_id')
      .eq('role', 'student')
      .eq('is_active', true);

    if (user.role !== 'boss' && user.academy_id) {
      studentQuery.eq('academy_id', user.academy_id);
    }

    const { data: students } = await studentQuery;
    const studentList = students || [];
    const studentIds = studentList.map((s) => s.id);

    if (studentIds.length === 0) {
      return NextResponse.json({ exams: [] });
    }

    const studentMap = new Map(studentList.map((s) => [s.id, s.full_name]));

    const [
      { data: examDates },
      { data: examAssignments },
      { data: textbooks },
      { data: progress },
    ] = await Promise.all([
      admin
        .from('naesin_exam_dates')
        .select('student_id, textbook_id, exam_date')
        .in('student_id', studentIds),
      admin
        .from('naesin_exam_assignments')
        .select('student_id, textbook_id, exam_date, exam_label')
        .in('student_id', studentIds)
        .not('exam_date', 'is', null),
      admin.from('naesin_textbooks').select('id, title:display_name'),
      admin
        .from('naesin_student_progress')
        .select('student_id, textbook_id, vocab_completed, passage_completed, dialogue_completed, grammar_completed, problem_completed, mock_exam_completed')
        .in('student_id', studentIds),
    ]);

    const textbookMap = new Map((textbooks || []).map((t) => [t.id, t.title]));

    // Progress: count completed stages per (student, textbook)
    const progressMap = new Map<string, { done: number; total: number }>();
    for (const p of progress || []) {
      const key = `${p.student_id}:${p.textbook_id}`;
      const prev = progressMap.get(key) || { done: 0, total: 0 };
      prev.total += totalStagesPerUnit();
      prev.done += countCompletedStages(p as unknown as Record<string, unknown>);
      progressMap.set(key, prev);
    }

    const exams: ExamOverviewItem[] = [];

    // Student-set dates
    for (const row of examDates || []) {
      const d = getDDay(row.exam_date);
      if (d === null) continue;
      const prog = progressMap.get(`${row.student_id}:${row.textbook_id}`);
      exams.push({
        studentId: row.student_id,
        studentName: studentMap.get(row.student_id) || '',
        textbookName: textbookMap.get(row.textbook_id) || '',
        examDate: row.exam_date,
        dday: d,
        source: 'student',
        examLabel: null,
        progressPercent: prog ? (prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 0) : 0,
      });
    }

    // Teacher-assigned dates
    for (const row of examAssignments || []) {
      const d = getDDay(row.exam_date);
      if (d === null) continue;
      const prog = progressMap.get(`${row.student_id}:${row.textbook_id}`);
      exams.push({
        studentId: row.student_id,
        studentName: studentMap.get(row.student_id) || '',
        textbookName: textbookMap.get(row.textbook_id) || '',
        examDate: row.exam_date,
        dday: d,
        source: 'teacher',
        examLabel: row.exam_label || null,
        progressPercent: prog ? (prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 0) : 0,
      });
    }

    // Sort by exam date (nearest first)
    exams.sort((a, b) => a.dday - b.dday);

    return NextResponse.json({ exams });
  },
);
