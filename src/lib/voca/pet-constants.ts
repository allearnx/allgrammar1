// ── 병아리 키우기 상수 + 유틸 ──

export type PetStage = 0 | 1 | 2 | 3 | 4;
export type PetMood = 'happy' | 'normal' | 'hungry';

export interface PetState {
  stage: PetStage;
  xp: number;
  mood: PetMood;
  nextStageXp: number;   // 다음 단계까지 필요 XP
  stageProgress: number; // 0~1 현재 단계 내 진행률
}

export interface PetFeedResult {
  pet: PetState;
  xpEarned: number;
  evolved: boolean;
}

// ── 단계 임계값 ──
export const STAGE_THRESHOLDS: readonly number[] = [0, 50, 150, 350, 700];

export const STAGE_NAMES: readonly string[] = ['알', '금간 알', '병아리', '중간 닭', '황금닭'];

// ── XP 규칙 ──
const BASE_XP = 20;
const HIGH_SCORE_BONUS = 10;    // 모든 과목 90+
const MAX_STREAK_MULTIPLIER = 2;

export function computeXpEarned(
  scores: { quiz: number; spelling: number; matching: number },
  streak: number,
): number {
  let xp = BASE_XP;

  // 고득점 보너스: 모두 90 이상
  if (scores.quiz >= 90 && scores.spelling >= 90 && scores.matching >= 90) {
    xp += HIGH_SCORE_BONUS;
  }

  // 스트릭 배수: 5일당 0.5x 추가 (최대 2x)
  const multiplier = Math.min(MAX_STREAK_MULTIPLIER, 1 + Math.floor(streak / 5) * 0.5);
  xp = Math.round(xp * multiplier);

  return xp;
}

// ── 무드 계산 ──
const HAPPY_HOURS = 24;
const NORMAL_HOURS = 48;

export function computeMood(lastFedAt: string | null): PetMood {
  if (!lastFedAt) return 'normal';
  const hoursSince = (Date.now() - new Date(lastFedAt).getTime()) / (1000 * 60 * 60);
  if (hoursSince <= HAPPY_HOURS) return 'happy';
  if (hoursSince <= NORMAL_HOURS) return 'normal';
  return 'hungry';
}

// ── Stage 계산 ──
export function computeStageFromXp(xp: number): PetStage {
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= STAGE_THRESHOLDS[i]) return i as PetStage;
  }
  return 0;
}

// ── DB row → 클라이언트 상태 ──
export interface PetRow {
  stage: number;
  xp: number;
  last_fed_at: string | null;
}

export function buildPetState(row: PetRow): PetState {
  const stage = row.stage as PetStage;
  const mood = computeMood(row.last_fed_at);

  const currentThreshold = STAGE_THRESHOLDS[stage];
  const nextThreshold = stage < 4 ? STAGE_THRESHOLDS[stage + 1] : STAGE_THRESHOLDS[4];
  const nextStageXp = stage < 4 ? nextThreshold - row.xp : 0;

  const range = nextThreshold - currentThreshold;
  const stageProgress = range > 0 ? Math.min(1, (row.xp - currentThreshold) / range) : 1;

  return { stage, xp: row.xp, mood, nextStageXp, stageProgress };
}
