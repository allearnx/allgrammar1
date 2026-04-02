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
const FREE_NAESIN_STAGES = ['vocab', 'passage', 'dialogue'];

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

/** Get naesin stages allowed for the tier. Free = vocab + passage only */
export function getAllowedNaesinStages(tier: Tier): string[] {
  if (tier === 'paid' || tier === 'trialing') return ALL_NAESIN_STAGES;
  return FREE_NAESIN_STAGES;
}

/**
 * Merge teacher-configured enabled_stages with plan-allowed stages.
 * If teacher stages exist, intersect with plan stages. Otherwise, use plan stages.
 */
export function mergeEnabledStages(
  tier: Tier,
  teacherStages: string[] | null | undefined,
): string[] {
  const planStages = getAllowedNaesinStages(tier);
  if (!teacherStages) return planStages;
  return teacherStages.filter((s) => planStages.includes(s));
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
