import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { NoServicesScreen } from '@/components/dashboard/no-services-screen';
import { IndependentStudentScreen } from '@/components/dashboard/independent-student-screen';
import { getPlanContext } from '@/lib/billing/get-plan-context';
import { isServiceAllowed } from '@/lib/billing/feature-gate';
import { VocaSection } from './_sections/voca-section';
import { NaesinSection } from './_sections/naesin-section';
import { CombinedSection } from './_sections/combined-section';

export default async function StudentDashboard() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from('service_assignments')
    .select('service, naesin_memorize_only')
    .eq('student_id', user.id);

  const rawServices = assignments?.map((a) => a.service) ?? [];
  const hasMemorizeOnly = assignments?.some(
    (a) => a.service === 'naesin' && a.naesin_memorize_only,
  ) ?? false;
  const isIndependent = !user.academy_id;

  // 플랜에 맞지 않는 서비스 필터링 (무료 플랜: 1개만 허용)
  // naesin_memorize_only인 경우 서비스 게이트 우회 (보스/선생님이 명시적으로 할당)
  const planContext = await getPlanContext(user.academy_id, user.id);
  const services = rawServices.filter((s) => {
    if (s === 'naesin' && hasMemorizeOnly) return true;
    return s === 'naesin' || s === 'voca'
      ? isServiceAllowed(planContext.tier, planContext.freeService, s)
      : true;
  });
  const hasVoca = services.includes('voca');
  const hasNaesin = services.includes('naesin');

  // ── Voca only ──
  if (hasVoca && !hasNaesin) {
    return <VocaSection user={user} planContext={planContext} isIndependent={isIndependent} />;
  }

  // ── Naesin only ──
  if (hasNaesin && !hasVoca) {
    return <NaesinSection user={user} planContext={planContext} isIndependent={isIndependent} />;
  }

  // ── Both ──
  if (hasVoca && hasNaesin) {
    return <CombinedSection user={user} planContext={planContext} />;
  }

  // ── No services ──

  // 독립 학생: 서비스 선택 + 학원합류 + 코스구매
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

  // 학원 학생: tier 확인 후 분기
  if (planContext.tier === 'free') {
    // 무료 학원 학생: 주 서비스 선택 화면 (둘 다 체험 가능)
    return (
      <>
        <Topbar user={user} title="대시보드" />
        <IndependentStudentScreen userName={user.full_name} courses={[]} isAcademy />
      </>
    );
  }

  // 유료 학원인데 서비스 없음: 안전장치 (정상적으로는 발생하지 않음)
  return (
    <>
      <Topbar user={user} title="대시보드" />
      <NoServicesScreen userName={user.full_name} />
    </>
  );
}
