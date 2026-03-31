import { NextResponse } from 'next/server';
import { createApiHandler, NotFoundError } from '@/lib/api';
import { reportGenerateSchema } from '@/lib/api/schemas';
import { requireAcademyScope } from '@/lib/api/require-academy-scope';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { aggregateWeeklyReport } from '@/lib/reports/aggregate-weekly-report';

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: reportGenerateSchema, rateLimit: { max: 5 } },
  async ({ body, supabase, user }) => {
    const { studentId, reportType } = body;

    await requireAcademyScope(user, studentId, supabase);

    // Get student info
    const { data: student } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', studentId)
      .single();

    if (!student) throw new NotFoundError('학생을 찾을 수 없습니다.');

    // Aggregate all stats
    const report = await aggregateWeeklyReport({
      supabase,
      studentId,
      reportType,
      studentName: student.full_name,
      studentEmail: student.email,
    });

    // ── weekly_reports에 저장 (upsert) ──
    const now = new Date();
    const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    await supabase.from('weekly_reports').upsert(
      {
        student_id: studentId,
        generated_by: user.id,
        week_start: weekStart,
        week_end: weekEnd,
        stats: report as unknown as Record<string, unknown>,
        weaknesses: report.weaknesses,
        recommendations: report.recommendations,
      },
      { onConflict: 'student_id,week_start' }
    );

    // Fetch the upserted row's id for share link
    const { data: saved } = await supabase
      .from('weekly_reports')
      .select('id')
      .eq('student_id', studentId)
      .eq('week_start', weekStart)
      .single();

    if (saved) {
      report.reportId = saved.id;
    }

    return NextResponse.json(report);
  }
);
