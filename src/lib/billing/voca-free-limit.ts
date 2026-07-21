import { getFreeVocaDayLimit } from '@/lib/billing/feature-gate';
import type { Tier } from '@/lib/billing/feature-gate';

type SupabaseLike = {
  from: (table: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

/**
 * 보카 무료 Day 한도 계산 — 학원생은 학원 가입일, 개인은 본인 가입일 기준.
 * 가입 7일 이내 무료면 무제한(0), 이후 3개, 유료는 항상 무제한.
 */
export async function resolveFreeVocaDayLimit(
  supabase: SupabaseLike,
  tier: Tier,
  academyId: string | null | undefined,
  userId: string,
): Promise<number> {
  if (tier !== 'free') return 0;
  let signupIso: string | null = null;
  if (academyId) {
    const { data } = await supabase.from('academies').select('created_at').eq('id', academyId).maybeSingle();
    signupIso = data?.created_at ?? null;
  } else {
    const { data } = await supabase.from('users').select('created_at').eq('id', userId).maybeSingle();
    signupIso = data?.created_at ?? null;
  }
  return getFreeVocaDayLimit(tier, signupIso);
}
