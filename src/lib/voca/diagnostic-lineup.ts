/**
 * 진단 결과 "교재 라인업" — 표시 전용 설정 (2026-07-23 사장님 확정 기획).
 *
 * 결과 화면에서 "○○ 수준" 학년 주장 대신 "지금 시작할 교재" 라인업을 보여준다.
 * 학년 라벨은 칸 헤더로 교재를 설명할 뿐, 아이는 "시작 위치"만 받는다.
 * 출제·판정(DIAGNOSTIC_BANDS, 스테어케이스)과는 완전히 분리 — 여기를 바꿔도 진단은 안 바뀐다.
 *
 * 교재는 title로 매칭한다 — 관리자 화면에서 교재 이름을 바꾸면 라인업에서 빠진다.
 * 이름 변경 시 여기도 같이 수정할 것 (diagnostic-bands.ts와 동일한 함정).
 * 초등 칸은 의도적으로 없음 — 초등은 선행이 기본이라 "중1 교재부터"가 긍정 프레임.
 */

import type { BandKey } from './diagnostic-bands';

export type LineupColumnKey = 'm1' | 'm2' | 'm3' | 'h1' | 'h2' | 'h3';

export interface LineupColumn {
  key: LineupColumnKey;
  /** 칸 헤더 — 교재를 설명하는 학년 라벨 (중1~고3) */
  gradeLabel: string;
  /** 첫 번째 = 칸 대표 교재, 나머지 = 병렬 */
  bookTitles: string[];
}

/** 확정 배치표: 6칸 19권. 시중 교재 실명 사용 (자체 레벨명 안 씀 — 학부모 인지도 활용). */
export const DIAGNOSTIC_LINEUP: LineupColumn[] = [
  { key: 'm1', gradeLabel: '중1', bookTitles: ['천일문 보카 중등 스타트', '중1 교과서 단어'] },
  { key: 'm2', gradeLabel: '중2', bookTitles: ['능률 VOCA 중등 필수', '중2 교과서 단어'] },
  {
    key: 'm3',
    gradeLabel: '중3',
    bookTitles: ['워드마스터 중등 고난도', '중3 교과서 단어', '능률 VOCA 중등 고난도'],
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
  },
  {
    key: 'h3',
    gradeLabel: '고3',
    bookTitles: ['최근 4개년 고3 3월 모고 단어', '최근 4개년 고3 6월 모고 단어', '최근 4개년 고3 9월 모고 단어'],
  },
];

export const LINEUP_COLUMN_KEYS: LineupColumnKey[] = DIAGNOSTIC_LINEUP.map((c) => c.key);

export interface LineupPlacement {
  columnKey: LineupColumnKey;
  /** 칸 안에서 배지가 붙는 추천 교재 (칸 대표가 기본, L0·L1만 예외) */
  highlightTitle: string;
}

/**
 * 진단 밴드 → 라인업 칸 + 추천 교재.
 * L0·L1은 둘 다 중1 칸 — L0(초등 판정)은 천일문, L1은 중1 교과서 단어를 하이라이트.
 * L2~L6은 학년 칸의 대표 교재를 하이라이트.
 */
export function lineupPlacement(band: BandKey): LineupPlacement {
  if (band === 'L0') return { columnKey: 'm1', highlightTitle: '천일문 보카 중등 스타트' };
  if (band === 'L1') return { columnKey: 'm1', highlightTitle: '중1 교과서 단어' };
  const columnKey = ({ L2: 'm2', L3: 'm3', L4: 'h1', L5: 'h2', L6: 'h3' } as const)[band];
  const column = DIAGNOSTIC_LINEUP.find((c) => c.key === columnKey)!;
  return { columnKey, highlightTitle: column.bookTitles[0] };
}

export function getLineupColumn(key: LineupColumnKey): LineupColumn {
  return DIAGNOSTIC_LINEUP.find((c) => c.key === key)!;
}

/** 재진단 칸 비교용 — 이동 칸 수 (양수 = 올라감) */
export function lineupColumnGap(prevBand: BandKey, currentBand: BandKey): number {
  return (
    LINEUP_COLUMN_KEYS.indexOf(lineupPlacement(currentBand).columnKey) -
    LINEUP_COLUMN_KEYS.indexOf(lineupPlacement(prevBand).columnKey)
  );
}
