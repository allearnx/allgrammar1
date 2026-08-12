/**
 * 진단 결과 "교재 라인업" — 표시 전용 설정 (2026-07-23 사장님 확정 기획, 2026-08-12 개편).
 *
 * 결과 화면에서 "○○ 수준" 학년 주장 대신 "지금 시작할 교재" 라인업을 보여준다.
 * 학년 라벨은 칸 헤더로 교재를 설명할 뿐, 아이는 "시작 위치"만 받는다.
 * 출제·판정(DIAGNOSTIC_BANDS, 스테어케이스)과는 완전히 분리 — 여기를 바꿔도 진단은 안 바뀐다.
 *
 * 2026-08-12 개편 (사장님 지시): 난이도 사다리는 **시중 교재로만** 세우고, 우리가 만든
 * 교과서 단어는 사다리 칸이 아니라 **기준점(anchor)** — "이 칸이 어느 수준인지 재는 자"로
 * 병렬 표시한다 (선택해서 시작하는 것은 가능).
 * 난이도 순서 근거는 능률 중등 필수 638단어 투입 후 전수 교차 분석(2026-08-12):
 * 초등800 < 천일문 < 능률필수 < 능률 고난도 < 워마 고난도 < 고교필수.
 *
 * ⚠️ 초등 칸만 예외 (2026-08-12 사장님 확정): 시중 초등 교재가 없어서 칸 대표가 우리 교재
 * (초등 필수 영어단어 800)다. 같은 날 초등 칸을 한 번 없앴다가 되살린 것 — 진단은 L0를
 * 초등 800 단어로 출제하는데 추천은 천일문(중1)으로 나가 **측정과 처방이 어긋나는** 문제
 * 때문이다. L0 학생에게 천일문(793단어·중1 교과서 42% 커버)은 벅차다.
 * 초등 800의 62%가 천일문에도 있어 다음 칸으로 올라갈 때 그만큼은 복습이 된다.
 *
 * 교재는 title로 매칭한다 — 관리자 화면에서 교재 이름을 바꾸면 라인업에서 빠진다.
 * 이름 변경 시 여기도 같이 수정할 것 (diagnostic-bands.ts와 동일한 함정).
 */

import type { BandKey } from './diagnostic-bands';

export type LineupColumnKey = 'elem' | 'm1' | 'm2' | 'm3' | 'h1' | 'h2' | 'h3';

export interface LineupColumn {
  key: LineupColumnKey;
  /** 칸 헤더 — 교재를 설명하는 학년 라벨 (중1~고3) */
  gradeLabel: string;
  /** 난이도 사다리의 시중 교재 — 첫 번째 = 칸 대표 */
  bookTitles: string[];
  /** 기준점 — 우리가 만든 초등 800·교과서 단어. 칸의 수준을 재는 자로 병렬 표시 (시작 선택은 가능) */
  anchorTitles: string[];
}

/** 확정 배치표: 7칸, 사다리 17권 + 기준점 3권. 시중 교재 실명 사용 (학부모 인지도 활용). */
export const DIAGNOSTIC_LINEUP: LineupColumn[] = [
  {
    key: 'elem',
    gradeLabel: '초등',
    // 칸 대표는 유일한 예외로 우리 교재 (시중 초등 교재가 없다 — 위 주석 참고).
    // 천일문은 초등~중1 브릿지라 중1 칸과 일부러 겹쳐 둔다 (2026-08-12 사장님 확정):
    // 표제어의 51%가 초등 800과 겹치고 중1 교과서도 42% 덮어, 초등 선행의 다음 걸음이 된다.
    bookTitles: ['초등 필수 영어단어 800', '천일문 보카 중등 스타트'],
    anchorTitles: [],
  },
  {
    key: 'm1',
    gradeLabel: '중1',
    bookTitles: ['천일문 보카 중등 스타트'],
    anchorTitles: ['중1 교과서 단어'],
  },
  {
    key: 'm2',
    gradeLabel: '중2',
    bookTitles: ['능률 VOCA 중등 필수'],
    anchorTitles: ['중2 교과서 단어'],
  },
  {
    key: 'm3',
    gradeLabel: '중3',
    // 워마가 능률 고난도보다 어렵고 넓다(중3 15.3% vs 12.5%, 고1 모고 14.3% vs 9.4%) — 대표 유지
    bookTitles: ['워드마스터 중등 고난도', '능률 VOCA 중등 고난도'],
    anchorTitles: ['중3 교과서 단어'],
  },
  {
    key: 'h1',
    gradeLabel: '고1',
    bookTitles: [
      '능률 고교필수 2000',
      '최근 5개년 고1 3월 모고 단어',
      '최근 5개년 고1 6월 모고 단어',
      '최근 4개년 고1 9월 모고 단어',
      '고1 ybm김',
    ],
    anchorTitles: [],
  },
  {
    key: 'h2',
    gradeLabel: '고2',
    bookTitles: [
      '최근 4개년 고2 3월 모고 단어',
      '최근 4개년 고2 6월 모고 단어',
      '최근 4개년 고2 9월 모고 단어',
      // 해커스 어원 = 고2 병렬: 고1·2·3 모고와 균등 25~26% 겹침 + 41% 심화 → 고등 확장서
      '해커스 보카 어원',
    ],
    anchorTitles: [],
  },
  {
    key: 'h3',
    gradeLabel: '고3',
    bookTitles: ['최근 4개년 고3 3월 모고 단어', '최근 4개년 고3 6월 모고 단어', '최근 4개년 고3 9월 모고 단어'],
    anchorTitles: [],
  },
];

export const LINEUP_COLUMN_KEYS: LineupColumnKey[] = DIAGNOSTIC_LINEUP.map((c) => c.key);

/**
 * 라인업에 표시되는 모든 제목 (사다리 + 기준점) — 활성 교재 id 조회용.
 * 브릿지 교재(천일문)는 두 칸에 걸쳐 있으므로 중복을 제거한다.
 */
export const ALL_LINEUP_TITLES: string[] = [
  ...new Set(DIAGNOSTIC_LINEUP.flatMap((c) => [...c.bookTitles, ...c.anchorTitles])),
];

/**
 * 칸별 강조색 — "온통 파란색" 피드백(2026-08-12)으로 칸마다 다른 색을 준다.
 * 값은 전부 기존 팔레트(brand-tokens VOCA_COLORS / allkill stepThemes)에 있는 색 —
 * 새 색을 만들지 않는다(구글 팔레트 유지, 보라 금지).
 * vivid = 테두리·구분선, tint = 내 칸 배경, deep = 글자·칩 배경(흰 글씨 대비 확보).
 * 노랑(#F9AB00)은 흰 글씨 대비가 안 나오므로 칩 배경엔 반드시 deep을 쓸 것.
 */
export const LINEUP_ACCENTS: Record<LineupColumnKey, { vivid: string; tint: string; deep: string }> = {
  // 초등=노랑 / 중등=초록→파랑→진파랑 / 고등=빨강→진빨강 / 고3=먹색 — 학교급끼리 계열을 묶고
  // 계열 안에서 진해지게. 초등 칸이 생기며 7칸이 되어 이 순서로 재배치했다 (2026-08-12).
  elem: { vivid: '#F9AB00', tint: '#FEF7E0', deep: '#B06000' },
  m1: { vivid: '#188038', tint: '#E6F4EA', deep: '#0D652D' },
  m2: { vivid: '#1A73E8', tint: '#E8F0FE', deep: '#1A73E8' },
  m3: { vivid: '#174EA6', tint: '#DFEFFF', deep: '#174EA6' },
  h1: { vivid: '#D93025', tint: '#FCE8E6', deep: '#D93025' },
  h2: { vivid: '#A50E0E', tint: '#FCE8E6', deep: '#A50E0E' },
  h3: { vivid: '#1F1F1F', tint: '#F1F3F4', deep: '#1F1F1F' },
};

export interface LineupPlacement {
  columnKey: LineupColumnKey;
  /** 칸 안에서 배지가 붙는 추천 교재 — 항상 사다리(시중 교재)의 칸 대표 */
  highlightTitle: string;
}

/**
 * 진단 밴드 → 라인업 칸 + 추천 교재 (칸 대표를 그대로 추천).
 * L0(초등 판정)은 초등 칸 — 진단이 초등 800 단어로 출제하는 밴드라 처방도 같은 교재여야 한다.
 */
export function lineupPlacement(band: BandKey): LineupPlacement {
  const columnKey = ({ L0: 'elem', L1: 'm1', L2: 'm2', L3: 'm3', L4: 'h1', L5: 'h2', L6: 'h3' } as const)[band];
  const column = DIAGNOSTIC_LINEUP.find((c) => c.key === columnKey)!;
  return { columnKey, highlightTitle: column.bookTitles[0] };
}

/**
 * 화면용 배치 — 활성 교재 목록(lineupBookIds)을 알고 폴백한다.
 * 칸의 교재가 하나도 활성이 아니면 그 칸은 화면에서 숨겨지므로("내 시작 칸"이
 * 사라짐), 사다리 교재 → 기준점 순으로 찾고, 없으면 오른쪽 칸으로 걸어간다.
 */
export function resolveLineupPlacement(
  band: BandKey,
  lineupBookIds: Record<string, string>,
): LineupPlacement {
  const ideal = lineupPlacement(band);
  if (lineupBookIds[ideal.highlightTitle]) return ideal;
  const startIdx = LINEUP_COLUMN_KEYS.indexOf(ideal.columnKey);
  for (let i = startIdx; i < DIAGNOSTIC_LINEUP.length; i++) {
    const col = DIAGNOSTIC_LINEUP[i];
    const active = [...col.bookTitles, ...col.anchorTitles].find((t) => lineupBookIds[t]);
    if (active) return { columnKey: col.key, highlightTitle: active };
  }
  return ideal; // 활성 교재가 하나도 없는 극단 — 표시용 원본 유지
}

/**
 * 라인업 칸 안에서 쓸 짧은 교재명 — "최근 4개년 고2 3월 모고 단어" → "고2 3월 모고".
 * 표시 전용이다. 교재를 찾는 키는 여전히 원래 title이므로 이걸로 조회하면 안 된다.
 * 모고 단어장만 길어서 줄인다 (연도 표기는 카드 안에서 정보 가치가 낮고 두 줄을 차지).
 */
export function shortBookTitle(title: string): string {
  return title.replace(/^최근 \d+개년 /, '').replace(/모고 단어$/, '모고');
}

export function getLineupColumn(key: LineupColumnKey): LineupColumn {
  return DIAGNOSTIC_LINEUP.find((c) => c.key === key)!;
}

/** 재진단 칸 비교용 — 이동 칸 수 (양수 = 올라감). L0↔L1은 같은 칸이라 0. */
export function lineupColumnGap(prevBand: BandKey, currentBand: BandKey): number {
  return (
    LINEUP_COLUMN_KEYS.indexOf(lineupPlacement(currentBand).columnKey) -
    LINEUP_COLUMN_KEYS.indexOf(lineupPlacement(prevBand).columnKey)
  );
}
