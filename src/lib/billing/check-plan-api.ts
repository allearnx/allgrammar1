import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canUseFeature, deriveTier, isServiceAllowed } from './feature-gate';
import type { Feature, FreeService } from './feature-gate';

/** Server-side plan check for API routes. Returns a 403 response if blocked, null if allowed. */
export async function checkPlanGate(academyId: string | null, feature: Feature): Promise<NextResponse | null> {
  if (!academyId) {
    return NextResponse.json({ error: '학원에 소속되어 있지 않습니다.' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: subscription } = await admin
    .from('subscriptions')
    .select('status, tier')
    .eq('academy_id', academyId)
    .in('status', ['trialing', 'active', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const tier = deriveTier(subscription as { status: string; tier: string } | null);

  if (!canUseFeature(tier, feature)) {
    return NextResponse.json(
      { error: '프리미엄 기능입니다. 유료 플랜으로 업그레이드하세요.' },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Check if the academy is allowed to assign the given services.
 * Free tier: only the selected freeService. Returns 403 for disallowed services, null if OK.
 */
export async function checkServiceGate(
  academyId: string | null,
  services: string[],
): Promise<NextResponse | null> {
  if (!academyId) {
    return NextResponse.json({ error: '학원에 소속되어 있지 않습니다.' }, { status: 400 });
  }

  const admin = createAdminClient();

  const [{ data: subscription }, { data: academy }] = await Promise.all([
    admin
      .from('subscriptions')
      .select('status, tier')
      .eq('academy_id', academyId)
      .in('status', ['trialing', 'active', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    admin
      .from('academies')
      .select('free_service')
      .eq('id', academyId)
      .single(),
  ]);

  const tier = deriveTier(subscription as { status: string; tier: string } | null);
  const freeService = (academy?.free_service as FreeService | null) ?? null;

  for (const service of services) {
    if (service === 'naesin' || service === 'voca') {
      if (!isServiceAllowed(tier, freeService, service)) {
        const label = service === 'naesin' ? '올인내신' : '올킬보카';
        return NextResponse.json(
          { error: `${label}은(는) 현재 플랜에서 사용할 수 없습니다. 업그레이드하세요.` },
          { status: 403 },
        );
      }
    }
  }

  return null;
}
