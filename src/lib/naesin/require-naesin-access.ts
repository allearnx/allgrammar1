import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPlanContext, type PlanContext } from '@/lib/billing/get-plan-context';
import { isServiceAllowed } from '@/lib/billing/feature-gate';

/**
 * 내신 학생 페이지 서비스 게이트.
 * - 무료 플랜: 배정 없어도 체험 범위(1단원 · 암기 3종)로 접근 허용 (보카와 왔다갔다 가능)
 * - 유료 플랜: 내신 배정(service_assignments)이 있어야 접근 (선생님 배정 체계)
 * - 암기 전용 배정(naesin_memorize_only)은 항상 통과 (보스/선생님 명시 할당)
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
    planContext.tier === 'free' || // 무료: 체험 범위로 양쪽 개방
    (!!assignment &&
      (assignment.naesin_memorize_only ||
        isServiceAllowed(planContext.tier, planContext.freeService, 'naesin')));

  if (!allowed) redirect('/student');
  return planContext;
}
