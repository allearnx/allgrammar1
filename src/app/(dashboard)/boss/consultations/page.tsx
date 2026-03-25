import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { ConsultationsClient } from './client';

export default async function BossConsultationsPage() {
  const user = await requireUser();
  if (user.role !== 'boss' && !user.is_homepage_manager) redirect('/login');
  const admin = createAdminClient();

  const { data: consultations } = await admin
    .from('consultations')
    .select('*')
    .order('created_at', { ascending: false });

  // Resolve course names
  const allCourseIds = [
    ...new Set(
      (consultations || []).flatMap((c) => (c.interest_course_ids as string[]) || [])
    ),
  ];

  let courseMap: Record<string, string> = {};
  if (allCourseIds.length > 0) {
    const { data: courses } = await admin
      .from('courses')
      .select('id, title')
      .in('id', allCourseIds);
    courseMap = Object.fromEntries(
      (courses || []).map((c) => [c.id, c.title])
    );
  }

  const enriched = (consultations || []).map((c) => ({
    ...c,
    interest_courses: ((c.interest_course_ids as string[]) || [])
      .map((id: string) => courseMap[id] || '삭제된 코스')
      .join(', '),
  }));

  return (
    <>
      <Topbar user={user} title="상담 신청 관리" />
      <div className="p-4 md:p-6">
        <ConsultationsClient consultations={enriched} />
      </div>
    </>
  );
}
