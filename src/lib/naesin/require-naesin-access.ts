import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPlanContext, type PlanContext } from '@/lib/billing/get-plan-context';
import { isServiceAllowed } from '@/lib/billing/feature-gate';

/**
 * 내신 학생 페이지 서비스 게이트.
 * - 내신 배정(service_assignments)이 없으면 차단
 * - 무료 플랜에서 다른 서비스(보카)를 선택한 학생도 차단 (무료 = 1개 서비스 택1)
 * - 암기 전용 배정(naesin_memorize_only)은 플랜과 무관하게 통과 (보스/선생님 명시 할당)
 * 통과 시 planContext를 반환해 페이지에서 재사용한다 (getPlanContext는 캐시됨).
 */
export async function requireNaesinAccess(user: { id: string; academy_id: string | null }): Promise<PlanContext> {
  const supabase = await createClient();
  const { data: assignment } = await supabase
    .from('service_assignments')
    .select('id, naesin_memorize_only')
    .eq('student_id', user.id)
    .eq('service', 'naesin')
    .maybeSingle();

  const planContext = await getPlanContext(user.academy_id, user.id);

  const allowed =
    !!assignment &&
    (assignment.naesin_memorize_only ||
      isServiceAllowed(planContext.tier, planContext.freeService, 'naesin'));

  if (!allowed) redirect('/student');
  return planContext;
}
