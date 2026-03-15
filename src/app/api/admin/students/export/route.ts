import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkPlanGate } from '@/lib/billing/check-plan-api';

function escapeCsv(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return `"${value}"`;
}

export const GET = createApiHandler(
  { roles: ['admin', 'boss'], hasBody: false },
  async ({ user }) => {
    if (!user.academy_id) {
      return NextResponse.json({ error: '학원에 소속되어 있지 않습니다.' }, { status: 400 });
    }

    const blocked = await checkPlanGate(user.academy_id, 'bulk:export');
    if (blocked) return blocked;

    const admin = createAdminClient();
    const academyId = user.academy_id;

    const { data: students } = await admin
      .from('users')
      .select('id, full_name, email, phone, is_active, created_at')
      .eq('role', 'student')
      .eq('academy_id', academyId)
      .order('full_name');

    const studentIds = students?.map((s) => s.id) || [];

    const { data: assignments } = studentIds.length > 0
      ? await admin.from('service_assignments').select('student_id, service').in('student_id', studentIds)
      : { data: [] };

    const servicesByStudent = new Map<string, string[]>();
    assignments?.forEach((a) => {
      const list = servicesByStudent.get(a.student_id) || [];
      list.push(a.service);
      servicesByStudent.set(a.student_id, list);
    });

    // Build CSV
    const header = '이름,이메일,전화번호,상태,서비스,가입일';
    const rows = (students || []).map((s) => {
      const services = (servicesByStudent.get(s.id) || []).join(';');
      const phone = s.phone || '';
      const status = s.is_active ? '활성' : '비활성';
      const date = s.created_at ? new Date(s.created_at).toISOString().split('T')[0] : '';
      return [s.full_name, s.email, phone, status, services, date].map(escapeCsv).join(',');
    });

    const csv = '\uFEFF' + [header, ...rows].join('\n'); // BOM for Excel Korean

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="students_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  }
);
