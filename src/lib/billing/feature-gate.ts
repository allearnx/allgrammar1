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

/** 보카 무료 체험 — 가입 후 이 기간은 전체 Day 무제한, 이후 맛보기 Day 수로 축소 */
export const FREE_VOCA_TRIAL_DAYS = 7;
/** 체험 종료 후 무료로 볼 수 있는 Day 수 */
export const FREE_VOCA_DAY_LIMIT = 3;

/**
 * 무료 학원/개인이 볼 수 있는 보카 Day 수. 0 = 무제한.
 * 가입 후 FREE_VOCA_TRIAL_DAYS일 이내면 전체 무제한(체험), 이후 FREE_VOCA_DAY_LIMIT개.
 * 유료는 항상 무제한(0). (기존 무료 학원은 이미 체험 기간이 지나 3개로 자연 적용)
 */
export function getFreeVocaDayLimit(tier: Tier, signupIso: string | null | undefined): number {
  if (tier !== 'free') return 0;
  if (signupIso) {
    const elapsed = Date.now() - new Date(signupIso).getTime();
    if (elapsed >= 0 && elapsed <= FREE_VOCA_TRIAL_DAYS * 24 * 60 * 60 * 1000) return 0;
  }
  return FREE_VOCA_DAY_LIMIT;
}

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
 * 2026-07 정책 변경: 무료도 양쪽 서비스 접근 허용 (왔다갔다 가능).
 * 대신 서비스별 무료 한도가 각자 적용된다 — 보카 Day 3개, 내신 1단원·암기 3종.
 * (freeService 파라미터는 하위 호환용으로 유지)
 */
export function isServiceAllowed(
  _tier: Tier,
  _freeService: FreeService | null,
  _service: 'naesin' | 'voca',
): boolean {
  return true;
}
