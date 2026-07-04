/**
 * Shared brand color tokens — single source of truth for the design system.
 *
 * 구글 스타일 팔레트 (2026-07 전환): 블루 primary + 4색(blue/green/yellow/red) 포인트.
 * ⚠️ 키 이름(violet/teal/mint…)은 레거시 — 값만 구글 팔레트로 매핑됨.
 *    사용처가 수백 곳이라 이름 변경은 단계적으로 진행 (semantic 이름으로 이관 예정).
 * 원칙: 4색은 상태·포인트에만 아껴 쓰고, 바탕은 흰색·회색이 담당.
 */

export const BRAND = {
  /** Primary (구 violet) — 배너·활성 상태·버튼 */
  violet: '#1A73E8',
  /** Primary light (구 violetLight) — 배너·그라데이션용 밝은 블루 */
  violetLight: '#4285F4',
  /** Primary dark (구 violetDark) — 그라데이션 끝점 */
  violetDark: '#174EA6',

  /** 완료 상태 보더·뱃지 (구 teal) — 구글 그린 */
  teal: '#34A853',
  /** 완료/스탯 색 (구 mint) — 구글 그린 */
  mint: '#34A853',
  /** Success green */
  green: '#34A853',

  /** 내신 관련 하이라이트 (구 cyan) — 밝은 블루 */
  cyan: '#4285F4',
  /** 경고·보조 스탯 — 구글 옐로 (텍스트 대비용 진한 톤) */
  amber: '#F9AB00',
  /** 보조 스탯 (구 sky) — 밝은 블루 */
  sky: '#4285F4',

  /** Step card backgrounds and borders */
  step: {
    defaultBg: '#E8F0FE',
    defaultBorder: '#D2E3FC',
    activeBorder: '#1A73E8',
    doneBorder: '#34A853',
  },

  /** Wrong-word section styling — 구글 레드 계열 */
  wrong: {
    bg: '#FCE8E6',
    border3: '#EA4335',
    border2: '#F28B82',
    border1: '#FAD2CF',
    badge: '#FADBD8',
  },

  /** Progress bar colors */
  progress: {
    done: '#34A853',
    doneEnd: '#81C995',
    active: '#1A73E8',
  },
} as const;

/** Stat card color presets used across dashboards */
export const STAT_COLORS = {
  violet: BRAND.violet, // blue
  cyan: BRAND.cyan,     // light blue
  mint: BRAND.mint,     // green
  amber: BRAND.amber,   // yellow
} as const;

/** Activity calendar dot colors */
export const DOT_COLORS = {
  voca: '#1A73E8',
  naesin: '#34A853',
  mixed: '#F9AB00',
} as const;
