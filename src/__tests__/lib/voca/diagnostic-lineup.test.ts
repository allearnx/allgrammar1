import { describe, it, expect } from 'vitest';
import {
  DIAGNOSTIC_LINEUP,
  LINEUP_COLUMN_KEYS,
  ALL_LINEUP_TITLES,
  lineupPlacement,
  resolveLineupPlacement,
  lineupColumnGap,
  getLineupColumn,
} from '@/lib/voca/diagnostic-lineup';
import { BAND_KEYS } from '@/lib/voca/diagnostic-bands';

describe('DIAGNOSTIC_LINEUP', () => {
  it('확정 배치표 — 7칸, 사다리 18칸(천일문 중복 1) + 기준점 3권, 조회 목록은 20권', () => {
    expect(DIAGNOSTIC_LINEUP).toHaveLength(7);
    expect(DIAGNOSTIC_LINEUP.flatMap((c) => c.bookTitles)).toHaveLength(18);
    expect(DIAGNOSTIC_LINEUP.flatMap((c) => c.anchorTitles)).toHaveLength(3);
    // 천일문은 초등·중1 두 칸에 일부러 걸쳐 있다 — 조회 목록에서는 중복 제거
    expect(ALL_LINEUP_TITLES).toHaveLength(20);
    expect(new Set(ALL_LINEUP_TITLES).size).toBe(20);
  });

  it('천일문은 초등·중1 두 칸에만 걸치고, 그 밖의 중복은 없다 (브릿지 교재)', () => {
    const ladder = DIAGNOSTIC_LINEUP.flatMap((c) => c.bookTitles);
    const dupes = ladder.filter((t, i) => ladder.indexOf(t) !== i);
    expect(dupes).toEqual(['천일문 보카 중등 스타트']);
    expect(DIAGNOSTIC_LINEUP.filter((c) => c.bookTitles.includes('천일문 보카 중등 스타트')).map((c) => c.key))
      .toEqual(['elem', 'm1']);
  });

  it('칸 헤더는 초등~고3 — 초등 칸 신설 (2026-08-12, L0 측정과 처방을 맞추기 위해)', () => {
    expect(DIAGNOSTIC_LINEUP.map((c) => c.gradeLabel)).toEqual(['초등', '중1', '중2', '중3', '고1', '고2', '고3']);
  });

  it('칸 대표(사다리 첫 교재) = 난이도 교차 분석(2026-08-12) 순서', () => {
    expect(DIAGNOSTIC_LINEUP.map((c) => c.bookTitles[0])).toEqual([
      '초등 필수 영어단어 800',
      '천일문 보카 중등 스타트',
      '능률 VOCA 중등 필수',
      '워드마스터 중등 고난도',
      '능률 고교필수 2000',
      '최근 4개년 고2 3월 모고 단어',
      '최근 4개년 고3 3월 모고 단어',
    ]);
  });

  it('교과서 단어는 사다리가 아니라 기준점 — 초등 800만 예외로 칸 대표(시중 초등 교재 없음)', () => {
    const ladder = new Set(DIAGNOSTIC_LINEUP.flatMap((c) => c.bookTitles));
    const anchors = DIAGNOSTIC_LINEUP.flatMap((c) => c.anchorTitles);
    expect(anchors).toEqual(['중1 교과서 단어', '중2 교과서 단어', '중3 교과서 단어']);
    for (const a of anchors) expect(ladder.has(a)).toBe(false);
    expect(ladder.has('초등 필수 영어단어 800')).toBe(true);
  });

  it('라인업 미포함 확정 3권은 어느 칸에도 없다', () => {
    const titles = new Set(ALL_LINEUP_TITLES);
    expect(titles.has('The Giver')).toBe(false);
    expect(titles.has('부스터 유형독해')).toBe(false);
    expect(titles.has('Vocabulary Workshop B')).toBe(false);
  });
});

describe('lineupPlacement', () => {
  it('모든 밴드가 칸에 매핑되고 하이라이트 교재는 그 칸의 사다리에 존재한다', () => {
    for (const band of BAND_KEYS) {
      const { columnKey, highlightTitle } = lineupPlacement(band);
      expect(LINEUP_COLUMN_KEYS).toContain(columnKey);
      expect(getLineupColumn(columnKey).bookTitles).toContain(highlightTitle);
    }
  });

  it('L0은 초등 칸(초등 800) — 진단이 초등 800으로 출제하는 밴드라 처방도 같아야 한다', () => {
    expect(lineupPlacement('L0')).toEqual({ columnKey: 'elem', highlightTitle: '초등 필수 영어단어 800' });
    expect(lineupPlacement('L1')).toEqual({ columnKey: 'm1', highlightTitle: '천일문 보카 중등 스타트' });
  });

  it('L2~L6은 학년 칸의 대표 교재 하이라이트', () => {
    expect(lineupPlacement('L2')).toEqual({ columnKey: 'm2', highlightTitle: '능률 VOCA 중등 필수' });
    expect(lineupPlacement('L4')).toEqual({ columnKey: 'h1', highlightTitle: '능률 고교필수 2000' });
    expect(lineupPlacement('L6')).toEqual({ columnKey: 'h3', highlightTitle: '최근 4개년 고3 3월 모고 단어' });
  });
});

describe('lineupColumnGap', () => {
  it('칸 이동 수 — 밴드 한 칸이 라인업 한 칸 (초등 칸 신설로 L0→L1도 +1)', () => {
    expect(lineupColumnGap('L0', 'L1')).toBe(1);
    expect(lineupColumnGap('L0', 'L2')).toBe(2);
    expect(lineupColumnGap('L2', 'L3')).toBe(1);
    expect(lineupColumnGap('L1', 'L4')).toBe(3);
    expect(lineupColumnGap('L5', 'L4')).toBe(-1);
  });
});

describe('resolveLineupPlacement — 활성 교재 인지 폴백', () => {
  const 활성 = (titles: string[]) => Object.fromEntries(titles.map((t, i) => [t, `id-${i}`]));

  it('추천 교재가 활성이면 그대로', () => {
    const ids = 활성(['초등 필수 영어단어 800', '천일문 보카 중등 스타트']);
    expect(resolveLineupPlacement('L0', ids)).toEqual({ columnKey: 'elem', highlightTitle: '초등 필수 영어단어 800' });
  });

  it('초등 800이 비활성(검수 중)이어도 초등 칸은 유지 — 같은 칸 천일문으로 폴백', () => {
    const ids = 활성(['천일문 보카 중등 스타트', '중1 교과서 단어']);
    expect(resolveLineupPlacement('L0', ids)).toEqual({ columnKey: 'elem', highlightTitle: '천일문 보카 중등 스타트' });
  });

  it('사다리 대표가 비활성이면 같은 칸의 기준점으로 폴백 (기준점도 시작 가능)', () => {
    const ids = 활성(['중1 교과서 단어']);
    expect(resolveLineupPlacement('L1', ids)).toEqual({ columnKey: 'm1', highlightTitle: '중1 교과서 단어' });
  });

  it('칸 전체가 비활성이면 오른쪽 첫 활성 교재로', () => {
    const ids = 활성(['능률 VOCA 중등 필수']);
    expect(resolveLineupPlacement('L1', ids)).toEqual({ columnKey: 'm2', highlightTitle: '능률 VOCA 중등 필수' });
  });

  it('활성 교재가 하나도 없으면 원본 배치 유지 (표시용)', () => {
    expect(resolveLineupPlacement('L0', {})).toEqual({ columnKey: 'elem', highlightTitle: '초등 필수 영어단어 800' });
  });
});
