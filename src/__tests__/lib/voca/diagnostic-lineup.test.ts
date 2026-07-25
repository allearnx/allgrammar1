import { describe, it, expect } from 'vitest';
import {
  DIAGNOSTIC_LINEUP,
  LINEUP_COLUMN_KEYS,
  lineupPlacement,
  lineupColumnGap,
  getLineupColumn,
} from '@/lib/voca/diagnostic-lineup';
import { BAND_KEYS } from '@/lib/voca/diagnostic-bands';

describe('DIAGNOSTIC_LINEUP', () => {
  it('확정 배치표 그대로 — 6칸 19권, 제목 중복 없음', () => {
    expect(DIAGNOSTIC_LINEUP).toHaveLength(6);
    const titles = DIAGNOSTIC_LINEUP.flatMap((c) => c.bookTitles);
    expect(titles).toHaveLength(19);
    expect(new Set(titles).size).toBe(19);
  });

  it('칸 헤더는 중1~고3 — 초등 칸은 없다 (선행 긍정 프레임)', () => {
    expect(DIAGNOSTIC_LINEUP.map((c) => c.gradeLabel)).toEqual(['중1', '중2', '중3', '고1', '고2', '고3']);
  });

  it('칸 대표(첫 교재) = 사장님 확정 배치표', () => {
    expect(DIAGNOSTIC_LINEUP.map((c) => c.bookTitles[0])).toEqual([
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

  it('L0·L1은 둘 다 중1 칸 — L0은 천일문, L1은 중1 교과서 단어 하이라이트', () => {
    expect(lineupPlacement('L0')).toEqual({ columnKey: 'm1', highlightTitle: '천일문 보카 중등 스타트' });
    expect(lineupPlacement('L1')).toEqual({ columnKey: 'm1', highlightTitle: '중1 교과서 단어' });
  });

  it('L2~L6은 학년 칸의 대표 교재 하이라이트', () => {
    expect(lineupPlacement('L2')).toEqual({ columnKey: 'm2', highlightTitle: '능률 VOCA 중등 필수' });
    expect(lineupPlacement('L4')).toEqual({ columnKey: 'h1', highlightTitle: '능률 고교필수 2000' });
    expect(lineupPlacement('L6')).toEqual({ columnKey: 'h3', highlightTitle: '최근 4개년 고3 3월 모고 단어' });
  });
});

describe('lineupColumnGap', () => {
  it('칸 이동 수 — L0→L1은 같은 칸(0), L2→L3은 한 칸 위(+1), 내려가면 음수', () => {
    expect(lineupColumnGap('L0', 'L1')).toBe(0);
    expect(lineupColumnGap('L2', 'L3')).toBe(1);
    expect(lineupColumnGap('L1', 'L4')).toBe(3);
    expect(lineupColumnGap('L5', 'L4')).toBe(-1);
  });
});
