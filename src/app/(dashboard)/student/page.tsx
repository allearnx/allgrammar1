import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { NoServicesScreen } from '@/components/dashboard/no-services-screen';
import { IndependentStudentScreen } from '@/components/dashboard/independent-student-screen';
import { getPlanContext } from '@/lib/billing/get-plan-context';
import { VocaSection } from './_sections/voca-section';
import { NaesinSection } from './_sections/naesin-section';
import { CombinedSection } from './_sections/combined-section';

export default async function StudentDashboard() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from('service_assignments')
    .select('service')
    .eq('student_id', user.id);

  const services = assignments?.map((a) => a.service) ?? [];
  const hasVoca = services.includes('voca');
  const hasNaesin = services.includes('naesin');
  const isIndependent = !user.academy_id;

  const planContext = (hasVoca || hasNaesin)
    ? await getPlanContext(user.academy_id, user.id)
    : null;

  // ── 무료 학생: 항상 내신(vocab/passage) + 보카 둘 다 표시 ──
  if (planContext && planContext.tier === 'free' && (hasVoca || hasNaesin)) {
    return <CombinedSection user={user} planContext={planContext} />;
  }

  // ── Voca only (유료) ──
  if (hasVoca && !hasNaesin && planContext) {
    return <VocaSection user={user} planContext={planContext} isIndependent={isIndependent} />;
  }

  // ── Naesin only (유료) ──
  if (hasNaesin && !hasVoca && planContext) {
    return <NaesinSection user={user} planContext={planContext} />;
  }

  // ── Both (유료) ──
  if (hasVoca && hasNaesin && planContext) {
    return <CombinedSection user={user} planContext={planContext} />;
  }

  // ── No services: independent → join + buy; academy → wait for teacher ──
  if (isIndependent) {
    const admin = createAdminClient();
    const { data: courses } = await admin
      .from('courses')
      .select('id, title, category, price, description')
      .eq('is_active', true)
      .in('category', ['voca', 'school_exam'])
      .order('sort_order', { ascending: true });

    return (
      <>
        <Topbar user={user} title="대시보드" />
        <IndependentStudentScreen userName={user.full_name} courses={courses ?? []} />
      </>
    );
  }

  return (
    <>
      <Topbar user={user} title="대시보드" />
      <NoServicesScreen userName={user.full_name} />
    </>
  );
}
