import { createClient } from '@/lib/supabase/server';
import type { Tier } from './feature-gate';

export interface PlanContext {
  tier: Tier;
  freeService: 'naesin' | 'voca' | null;
}

/** Fetch the plan context (tier + free service) for the user's academy or individual student */
export async function getPlanContext(
  academyId: string | null,
  studentId?: string,
): Promise<PlanContext> {
  if (!academyId) {
    // 독립 학생: service_assignments로 판단 (빌링 테이블 없음)
    if (studentId) {
      const supabase = await createClient();
      const { data: assignments } = await supabase
        .from('service_assignments')
        .select('service')
        .eq('student_id', studentId);

      const services = assignments?.map((a) => a.service) ?? [];
      if (services.length > 0) {
        const freeService = services.includes('voca') ? 'voca' as const
          : services.includes('naesin') ? 'naesin' as const
          : null;
        return { tier: 'free', freeService };
      }
    }
    return { tier: 'free', freeService: null };
  }

  const supabase = await createClient();

  const { data: academy } = await supabase
    .from('academies')
    .select('services')
    .eq('id', academyId)
    .single();

  const services: string[] = (academy?.services as string[]) ?? [];
  // Derive freeService from academy.services array (prefer voca if both assigned)
  const freeService: 'naesin' | 'voca' | null =
    services.includes('voca') ? 'voca'
    : services.includes('naesin') ? 'naesin'
    : null;

  return { tier: 'free' as Tier, freeService };
}
