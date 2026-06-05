export type Feature =
  | 'naesin:grammar'
  | 'naesin:problem'
  | 'naesin:textbookVideo'
  | 'naesin:mockExam'
  | 'voca:round2'
  | 'analytics:charts'
  | 'analytics:rankings'
  | 'bulk:import'
  | 'bulk:assign'
  | 'bulk:export'
  | 'reports';

export type Tier = 'free' | 'paid' | 'trialing';

const ALL_NAESIN_STAGES = ['vocab', 'passage', 'dialogue', 'textbookVideo', 'grammar', 'problem', 'mockExam', 'lastReview'];
const MEMORIZE_STAGES = ['vocab', 'passage', 'dialogue'];

/** 무료 체험 시 올인내신 단원 제한 (1개만) */
export const FREE_NAESIN_UNIT_LIMIT = 1;

const PAID_ONLY_FEATURES: ReadonlySet<Feature> = new Set([
  'naesin:grammar',
  'naesin:problem',
  'naesin:textbookVideo',
  'naesin:mockExam',
  'voca:round2',
  'analytics:charts',
  'analytics:rankings',
  'bulk:import',
  'bulk:assign',
  'bulk:export',
  'reports',
]);

/** Derive Tier from subscription row (status + tier column) */
export function deriveTier(sub: { status: string; tier: string } | null): Tier {
  if (!sub) return 'free';
  if (sub.tier === 'free') return 'free';
  if (sub.status === 'trialing') return 'trialing';
  return 'paid';
}

/** Check if a feature is available for the given tier */
export function canUseFeature(tier: Tier, feature: Feature): boolean {
  if (tier === 'paid' || tier === 'trialing') return true;
  return !PAID_ONLY_FEATURES.has(feature);
}

/** Get naesin stages allowed for the tier.
 *  Free / memorize-only = vocab + passage + dialogue only.
 *  Paid / trialing = all 8 stages.
 */
export function getAllowedNaesinStages(tier: Tier, naesinMemorizeOnly = false): string[] {
  if (naesinMemorizeOnly) return MEMORIZE_STAGES;
  if (tier === 'paid' || tier === 'trialing') return ALL_NAESIN_STAGES;
  return MEMORIZE_STAGES;
}

/**
 * Merge teacher-configured enabled_stages with plan-allowed stages.
 * If teacher stages exist, intersect with plan stages. Otherwise, use plan stages.
 */
export function mergeEnabledStages(
  tier: Tier,
  teacherStages: string[] | null | undefined,
  naesinMemorizeOnly = false,
): string[] {
  const planStages = getAllowedNaesinStages(tier, naesinMemorizeOnly);
  if (!teacherStages) return planStages;
  return teacherStages.filter((s) => planStages.includes(s));
}

/** 올인내신 단원 제한 수. 0 = 무제한 */
export function getNaesinUnitLimit(tier: Tier, naesinMemorizeOnly: boolean): number {
  // 유료 or 암기 전용 할당: 무제한
  if (tier === 'paid' || tier === 'trialing' || naesinMemorizeOnly) return 0;
  // 무료 체험: 1개 단원만
  return FREE_NAESIN_UNIT_LIMIT;
}

export type FreeService = 'naesin' | 'voca';

/**
 * Check if a service is accessible for the given plan.
 * Free tier: only the selected freeService. Paid/trialing: both.
 */
export function isServiceAllowed(
  tier: Tier,
  freeService: FreeService | null,
  service: 'naesin' | 'voca',
): boolean {
  if (tier === 'paid' || tier === 'trialing') return true;
  // Free tier: only the chosen service
  return freeService === service;
}
