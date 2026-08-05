/**
 * 어휘 레벨 진단 — 밴드 설정 + 스테어케이스 판정 로직 (순수 함수).
 *
 * 밴드 = 교재 묶음. 학년 선택으로 시작 밴드를 정하고, 라운드(10문항) 정답 수에 따라
 * 위/아래 밴드로 이동하며 레벨을 확정한다. 교재는 title로 매칭하므로 관리자 화면에서
 * 교재 이름을 바꾸면 밴드에서 빠진다 — 이름 변경 시 여기도 같이 수정할 것.
 * 단어가 없는 밴드는 자동으로 사다리에서 건너뛴다 (L1 교재가 채워지면 자동 활성).
 */

export type BandKey = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6';

export interface DiagnosticBand {
  key: BandKey;
  /** 결과 화면·리포트에 쓰는 레벨 이름 */
  label: string;
  /** 커버리지 문구용 출처 라벨 (예: "고2 3월 모의고사") */
  sourceLabel: string;
  bookTitles: string[];
}

/**
 * 교재 라인업 사다리 (2026-07-21 사장님 확정): 레벨 = 학년 하나씩, 밴드의 첫 교재 = 대표 처방.
 * 스타트=중1 / 필수=중2 / 워마 고난도=중3 / 고1=고교필수 2000+모고 / 고2·고3=모고(기초 필터 강화).
 * sourceLabel은 "○○ 단어를 N% 알고 있어요" 문구에 쓰인다 (모의고사·커버리지 표현 금지).
 */
export const DIAGNOSTIC_BANDS: DiagnosticBand[] = [
  // 중등 밴드 첫 교재 = 학년별 교과서 단어(내신 데이터 기반) — "학년 단어를 N% 알아요" 문구와
  // 출처가 정확히 일치하고, 추천 카드의 대표 처방이 된다. 두 번째부터는 함께 추천할 시중 교재.
  // L0 = 초등 800 단독 (2026-08-05): 진짜 초등 교재 출시로 천일문(초등~중1 브릿지, 표제어 51%가
  // 초등 800과 겹침)은 L1로 이동 — 라인업 중1 칸과 일치. 겹치는 쉬운 절반은 하위 밴드 제외
  // 로직이 L1 출제에서 자동으로 빼주므로 L1에는 중등 쪽 절반만 남는다. 베이직·기본(빈 교재)도
  // 예비중 티어라 L1로 — 채워지면 자동 합류.
  { key: 'L0', label: '초등', sourceLabel: '초등', bookTitles: ['초등 필수 영어단어 800'] },
  {
    key: 'L1',
    label: '중1',
    sourceLabel: '중1',
    bookTitles: ['중1 교과서 단어', '천일문 보카 중등 스타트', '워드마스터 중등 베이직', '능률 VOCA 중등 기본'],
  },
  { key: 'L2', label: '중2', sourceLabel: '중2', bookTitles: ['중2 교과서 단어', '능률 VOCA 중등 필수'] },
  { key: 'L3', label: '중3', sourceLabel: '중3', bookTitles: ['중3 교과서 단어', '워드마스터 중등 고난도', '능률 VOCA 중등 고난도'] },
  { key: 'L4', label: '고1', sourceLabel: '고1', bookTitles: ['능률 고교필수 2000', '최근 5개년 고1 3월 모고 단어'] },
  { key: 'L5', label: '고2', sourceLabel: '고2', bookTitles: ['최근 4개년 고2 3월 모고 단어'] },
  { key: 'L6', label: '고3', sourceLabel: '고3', bookTitles: ['최근 4개년 고3 3월 모고 단어'] },
];

export const BAND_KEYS: BandKey[] = DIAGNOSTIC_BANDS.map((b) => b.key);

export function getBand(key: BandKey): DiagnosticBand {
  return DIAGNOSTIC_BANDS.find((b) => b.key === key)!;
}

export type DiagnosticGrade = 'elementary' | 'm1' | 'm2' | 'm3' | 'h1' | 'h2' | 'h3';

export const DIAGNOSTIC_GRADES: { key: DiagnosticGrade; label: string; startBand: BandKey }[] = [
  { key: 'elementary', label: '초등학생', startBand: 'L0' },
  { key: 'm1', label: '중1', startBand: 'L1' },
  { key: 'm2', label: '중2', startBand: 'L2' },
  { key: 'm3', label: '중3', startBand: 'L3' },
  { key: 'h1', label: '고1', startBand: 'L4' },
  { key: 'h2', label: '고2', startBand: 'L5' },
  { key: 'h3', label: '고3', startBand: 'L6' },
];

/** 학년의 시작 밴드 — 해당 밴드가 비활성이면 활성 밴드 중 가장 가까운 것으로 */
export function getStartBand(grade: DiagnosticGrade, activeBands: BandKey[]): BandKey {
  const wanted = DIAGNOSTIC_GRADES.find((g) => g.key === grade)!.startBand;
  if (activeBands.includes(wanted)) return wanted;
  const wantedIdx = BAND_KEYS.indexOf(wanted);
  // 가까운 활성 밴드 (위쪽 우선 — 초등이 L1 비활성이면 L2에서 시작)
  const sorted = [...activeBands].sort(
    (a, b) => Math.abs(BAND_KEYS.indexOf(a) - wantedIdx) - Math.abs(BAND_KEYS.indexOf(b) - wantedIdx),
  );
  return sorted[0];
}

export const ROUND_SIZE = 10;
/** 정답률 ≥ 80% → 한 밴드 위로 */
export const UP_RATIO = 0.8;
/**
 * 정답률 ≤ 50% → 한 밴드 아래로.
 * 배정 규칙 (2026-08-05 사장님 확정): "교재 단어의 20~50%를 모를 때 그 교재를 배정" —
 * 즉 50~80% 알 때 확정. 60% 넘게 모르면 좌절 구간이라 아래 교재로. (구 40%에서 상향:
 * 4지선다 찍기 인플레이션 보정 + 아는 책을 더 다지고 넘어가는 보수적 배정.)
 */
export const DOWN_RATIO = 0.5;
export const MAX_ROUNDS = 5;
/**
 * 레벨 확정에 필요한 해당 밴드 누적 최소 문항 수.
 * 10문항 한 라운드 정답률은 ±15%p쯤 흔들려서 확정·커버리지 신뢰도가 부족하다 →
 * 확정 신호가 나와도 그 밴드 누적이 이 수 미만이면 같은 밴드에서 확인 라운드를 더 본다.
 */
export const CONFIRM_ITEMS = 20;

export interface RoundSummary {
  band: BandKey;
  correct: number;
  total: number;
}

export interface FinalLevel {
  band: BandKey;
  /** exact: 해당 레벨 / above: 해당 레벨 이상 / below: 해당 레벨 미만 */
  qualifier: 'exact' | 'above' | 'below';
}

export type NextStep = { type: 'continue'; band: BandKey } | { type: 'done'; level: FinalLevel };

function adjacent(band: BandKey, dir: 1 | -1, activeBands: BandKey[]): BandKey | null {
  let idx = BAND_KEYS.indexOf(band);
  while (true) {
    idx += dir;
    if (idx < 0 || idx >= BAND_KEYS.length) return null;
    if (activeBands.includes(BAND_KEYS[idx])) return BAND_KEYS[idx];
  }
}

/** 특정 밴드의 누적 정답/문항 수 */
function bandCum(rounds: RoundSummary[], band: BandKey): { correct: number; total: number } {
  let correct = 0;
  let total = 0;
  for (const r of rounds) {
    if (r.band === band) {
      correct += r.correct;
      total += r.total;
    }
  }
  return { correct, total };
}

/**
 * 지금까지의 라운드 결과로 다음 행동을 결정한다. 판정은 현재 밴드의 "누적" 정답률 기준.
 * - 누적 ≥80% → 위로 / ≤40% → 아래로 / 사이 → 확정 신호
 * - 확정(exact·최상단 이상·최하단 미만)은 해당 밴드 누적 CONFIRM_ITEMS(20문항) 이상일 때만.
 *   미만이면 같은 밴드에서 확인 라운드를 한 번 더 본다 (10문항 단발 확정의 신뢰도 보완).
 * - 반전(오르내림 교차)이면 이동을 멈추고 잘 본 쪽 밴드를 확인한다.
 * - MAX_ROUNDS 도달 시 현재 신호대로 즉시 확정.
 */
export function nextStep(rounds: RoundSummary[], activeBands: BandKey[]): NextStep {
  const band = rounds[rounds.length - 1].band;
  const cum = bandCum(rounds, band);
  const ratio = cum.correct / cum.total;
  const canContinue = rounds.length < MAX_ROUNDS;
  const needConfirm = cum.total < CONFIRM_ITEMS && canContinue;
  const visited = (b: BandKey) => rounds.some((r) => r.band === b);

  if (ratio >= UP_RATIO) {
    const up = adjacent(band, 1, activeBands);
    // 최상단 → "이상" 확정 (확인 라운드 충족 시)
    if (!up) {
      if (needConfirm) return { type: 'continue', band };
      return { type: 'done', level: { band, qualifier: 'above' } };
    }
    // 반전: 위 밴드에서 내려와서 현재 밴드를 잘 봤다 → 현재 밴드 확인 후 확정
    if (visited(up)) {
      if (needConfirm) return { type: 'continue', band };
      return { type: 'done', level: { band, qualifier: 'exact' } };
    }
    if (!canContinue) return { type: 'done', level: { band, qualifier: 'above' } };
    return { type: 'continue', band: up };
  }

  if (ratio <= DOWN_RATIO) {
    const down = adjacent(band, -1, activeBands);
    if (!down) {
      if (needConfirm) return { type: 'continue', band };
      return { type: 'done', level: { band, qualifier: 'below' } };
    }
    // 반전: 아래 밴드에서 올라와서 현재 밴드를 못 봤다 → 잘 봤던 아래 밴드를 확인 후 확정
    if (visited(down)) {
      const downCum = bandCum(rounds, down);
      if (downCum.total < CONFIRM_ITEMS && canContinue) return { type: 'continue', band: down };
      return { type: 'done', level: { band: down, qualifier: 'exact' } };
    }
    if (!canContinue) return { type: 'done', level: { band, qualifier: 'below' } };
    return { type: 'continue', band: down };
  }

  if (needConfirm) return { type: 'continue', band };
  return { type: 'done', level: { band, qualifier: 'exact' } };
}

/** 라운드 전체를 재생해 최종 레벨 도출 (서버 검증용) */
export function resolveFinalLevel(rounds: RoundSummary[], activeBands: BandKey[]): FinalLevel {
  for (let i = 1; i <= rounds.length; i++) {
    const step = nextStep(rounds.slice(0, i), activeBands);
    if (step.type === 'done') return step.level;
    // continue인데 마지막 라운드면 (클라이언트 중단 등) 마지막 밴드로 확정
    if (i === rounds.length) return { band: rounds[i - 1].band, qualifier: 'exact' };
  }
  return { band: rounds[rounds.length - 1].band, qualifier: 'exact' };
}

export function formatLevel(level: FinalLevel): string {
  const label = getBand(level.band).label;
  if (level.qualifier === 'above') return `${label} 이상`;
  if (level.qualifier === 'below') return `${label} 미만`;
  return label;
}

/**
 * 처방 상향 컷 (2026-08-05 사장님 확정): 확정 밴드 정답률이 60% 이상이면 그 교재는
 * 건너뛰고 한 칸 위 교재를 추천 — "모르는 단어가 40% 이상인 첫 교재를 배정".
 * 측정(스테어케이스 50~80 확정)은 그대로 두고 추천만 조정한다 — 문턱값을 40~60으로
 * 좁히면 20문항 노이즈(±11%p)가 구간 폭과 비슷해져 판정이 불안정해지기 때문.
 */
export const RECOMMEND_UP_PERCENT = 60;

/**
 * 판정 레벨 → 추천 교재 밴드. 학년이 아니라 측정된 레벨 기준.
 * 'above'(최상단 돌파)는 한 단계 위 활성 밴드, 'below'(최하단 미달)는 한 단계 아래,
 * 'exact'라도 확정 밴드 정답률(finalBandPercent)이 컷 이상이면 한 단계 위. 없으면 그대로.
 * finalBandPercent 미제공(구 데이터) 시에는 상향 컷 없이 동작한다.
 */
export function recommendBandKey(
  level: FinalLevel,
  activeBands: BandKey[],
  finalBandPercent?: number | null,
): BandKey {
  if (level.qualifier === 'above') {
    const up = adjacent(level.band, 1, activeBands);
    if (up) return up;
  }
  if (level.qualifier === 'below') {
    const down = adjacent(level.band, -1, activeBands);
    if (down) return down;
  }
  if (level.qualifier === 'exact' && finalBandPercent != null && finalBandPercent >= RECOMMEND_UP_PERCENT) {
    const up = adjacent(level.band, 1, activeBands);
    if (up) return up;
  }
  return level.band;
}

/** 학년 기준 밴드와 판정 레벨의 격차 (0=학년 수준, 음수=학년 아래, 양수=학년 위) */
export function levelGapFromGrade(grade: DiagnosticGrade, level: FinalLevel): number {
  const gradeBand = DIAGNOSTIC_GRADES.find((g) => g.key === grade)!.startBand;
  let gap = BAND_KEYS.indexOf(level.band) - BAND_KEYS.indexOf(gradeBand);
  if (level.qualifier === 'above') gap += 1;
  if (level.qualifier === 'below') gap -= 1;
  return gap;
}
