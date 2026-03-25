import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { CoursesClient } from './client';

export default async function BossCoursesPage() {
  const user = await requireUser();
  if (user.role !== 'boss' && !user.is_homepage_manager) redirect('/login');
  const admin = createAdminClient();

  const { data: courses } = await admin
    .from('courses')
    .select('*')
    .order('sort_order', { ascending: true });

  const { data: teachers } = await admin
    .from('teacher_profiles')
    .select('id, user_id, display_name')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  // Resolve teacher names (courses.teacher_id → users.id → teacher_profiles.user_id)
  const teacherByUserId = Object.fromEntries(
    (teachers || []).map((t) => [t.user_id, t.display_name])
  );

  const enriched = (courses || []).map((c) => ({
    ...c,
    teacher_name: c.teacher_id ? teacherByUserId[c.teacher_id] || null : null,
  }));

  return (
    <>
      <Topbar user={user} title="코스 관리" />
      <div className="p-4 md:p-6">
        <CoursesClient courses={enriched} teachers={teachers || []} />
      </div>
    </>
  );
}
