import { describe, it, expect } from 'vitest';
import {
  DIAGNOSTIC_LINEUP,
  LINEUP_COLUMN_KEYS,
  lineupPlacement,
  resolveLineupPlacement,
  lineupColumnGap,
  getLineupColumn,
} from '@/lib/voca/diagnostic-lineup';
import { BAND_KEYS } from '@/lib/voca/diagnostic-bands';

describe('DIAGNOSTIC_LINEUP', () => {
  it('확정 배치표 그대로 — 7칸 20권, 제목 중복 없음', () => {
    expect(DIAGNOSTIC_LINEUP).toHaveLength(7);
    const titles = DIAGNOSTIC_LINEUP.flatMap((c) => c.bookTitles);
    expect(titles).toHaveLength(20);
    expect(new Set(titles).size).toBe(20);
  });

  it('칸 헤더는 초등~고3 — 초등 칸은 2026-08-04 초등 800 출시로 추가', () => {
    expect(DIAGNOSTIC_LINEUP.map((c) => c.gradeLabel)).toEqual(['초등', '중1', '중2', '중3', '고1', '고2', '고3']);
  });

  it('칸 대표(첫 교재) = 사장님 확정 배치표', () => {
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

  it('라인업 미포함 확정 3권은 어느 칸에도 없다', () => {
    const titles = new Set(DIAGNOSTIC_LINEUP.flatMap((c) => c.bookTitles));
    expect(titles.has('The Giver')).toBe(false);
    expect(titles.has('부스터 유형독해')).toBe(false);
    expect(titles.has('Vocabulary Workshop B')).toBe(false);
  });
});

describe('lineupPlacement', () => {
  it('모든 밴드가 칸에 매핑되고 하이라이트 교재는 그 칸에 존재한다', () => {
    for (const band of BAND_KEYS) {
      const { columnKey, highlightTitle } = lineupPlacement(band);
      expect(LINEUP_COLUMN_KEYS).toContain(columnKey);
      expect(getLineupColumn(columnKey).bookTitles).toContain(highlightTitle);
    }
  });

  it('L0은 초등 칸(초등 800), L1은 중1 칸(중1 교과서 단어)', () => {
    expect(lineupPlacement('L0')).toEqual({ columnKey: 'elem', highlightTitle: '초등 필수 영어단어 800' });
    expect(lineupPlacement('L1')).toEqual({ columnKey: 'm1', highlightTitle: '중1 교과서 단어' });
  });

  it('L2~L6은 학년 칸의 대표 교재 하이라이트', () => {
    expect(lineupPlacement('L2')).toEqual({ columnKey: 'm2', highlightTitle: '능률 VOCA 중등 필수' });
    expect(lineupPlacement('L4')).toEqual({ columnKey: 'h1', highlightTitle: '능률 고교필수 2000' });
    expect(lineupPlacement('L6')).toEqual({ columnKey: 'h3', highlightTitle: '최근 4개년 고3 3월 모고 단어' });
  });
});

describe('lineupColumnGap', () => {
  it('칸 이동 수 — L0→L1은 초등→중1(+1), L2→L3은 한 칸 위(+1), 내려가면 음수', () => {
    expect(lineupColumnGap('L0', 'L1')).toBe(1);
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

  it('초등 800이 비활성(검수 중)이면 L0은 중1 칸 천일문으로 폴백 — 예전 동작 유지', () => {
    const ids = 활성(['천일문 보카 중등 스타트', '중1 교과서 단어']);
    expect(resolveLineupPlacement('L0', ids)).toEqual({ columnKey: 'm1', highlightTitle: '천일문 보카 중등 스타트' });
  });

  it('칸 대표가 비활성이면 같은 칸의 다른 활성 교재를 하이라이트', () => {
    const ids = 활성(['중1 교과서 단어']);
    expect(resolveLineupPlacement('L0', ids)).toEqual({ columnKey: 'm1', highlightTitle: '중1 교과서 단어' });
  });

  it('활성 교재가 하나도 없으면 원본 배치 유지 (표시용)', () => {
    expect(resolveLineupPlacement('L0', {})).toEqual({ columnKey: 'elem', highlightTitle: '초등 필수 영어단어 800' });
  });
});
