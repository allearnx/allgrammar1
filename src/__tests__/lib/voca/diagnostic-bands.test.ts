import { describe, it, expect } from 'vitest';
import {
  nextStep,
  resolveFinalLevel,
  getStartBand,
  formatLevel,
  levelGapFromGrade,
  recommendBandKey,
  type BandKey,
  type RoundSummary,
} from '@/lib/voca/diagnostic-bands';

const ALL: BandKey[] = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6'];
const NO_L0: BandKey[] = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];

function r(band: BandKey, correct: number): RoundSummary {
  return { band, correct, total: 10 };
}

describe('diagnostic staircase — nextStep', () => {
  it('확정 신호(5~7)여도 누적 20문항 미만이면 같은 밴드 확인 라운드', () => {
    expect(nextStep([r('L4', 6)], ALL)).toEqual({ type: 'continue', band: 'L4' });
  });

  it('확인 라운드까지 누적 20문항이 사이 정답률이면 확정', () => {
    // 6/10 + 7/10 = 13/20 = 65% → L4 확정
    expect(nextStep([r('L4', 6), r('L4', 7)], ALL)).toEqual({
      type: 'done',
      level: { band: 'L4', qualifier: 'exact' },
    });
  });

  it('확인 라운드 누적이 80% 이상으로 올라가면 위 밴드로 이동', () => {
    // 7/10 + 9/10 = 16/20 = 80% → 상향
    expect(nextStep([r('L4', 7), r('L4', 9)], ALL)).toEqual({ type: 'continue', band: 'L5' });
  });

  it('8개 이상(80%)이면 즉시 한 밴드 위로 (이동엔 확인 불필요)', () => {
    expect(nextStep([r('L4', 9)], ALL)).toEqual({ type: 'continue', band: 'L5' });
  });

  it('5개 이하(50%)면 즉시 한 밴드 아래로 — 배정 구간 50~80 (2026-08-05)', () => {
    expect(nextStep([r('L4', 3)], ALL)).toEqual({ type: 'continue', band: 'L3' });
    // 경계값: 정확히 50%도 아래로
    expect(nextStep([r('L4', 5)], ALL)).toEqual({ type: 'continue', band: 'L3' });
  });

  it('6개(60%)는 하강 신호가 아니다 — 확인 라운드로', () => {
    expect(nextStep([r('L4', 6)], ALL)).toEqual({ type: 'continue', band: 'L4' });
  });

  it('최상단에서 80% 이상 → 확인 라운드 후 "이상" 확정', () => {
    expect(nextStep([r('L6', 9)], ALL)).toEqual({ type: 'continue', band: 'L6' });
    expect(nextStep([r('L6', 9), r('L6', 8)], ALL)).toEqual({
      type: 'done',
      level: { band: 'L6', qualifier: 'above' },
    });
  });

  it('최하단(L0)에서 40% 이하 → 확인 라운드 후 "미만" 확정', () => {
    expect(nextStep([r('L0', 2)], ALL)).toEqual({ type: 'continue', band: 'L0' });
    expect(nextStep([r('L0', 2), r('L0', 3)], ALL)).toEqual({
      type: 'done',
      level: { band: 'L0', qualifier: 'below' },
    });
  });

  it('L0 비활성이면 L1이 최하단으로 동작', () => {
    expect(nextStep([r('L1', 2), r('L1', 3)], NO_L0)).toEqual({
      type: 'done',
      level: { band: 'L1', qualifier: 'below' },
    });
  });

  it('반전(하강 후 상승): 내려간 밴드 누적 20문항 채우고 그 밴드로 확정', () => {
    // L4 실패 → L3에서 9/10 → 위(L4) 방문했으니 이동 대신 L3 확인
    expect(nextStep([r('L4', 3), r('L3', 9)], ALL)).toEqual({ type: 'continue', band: 'L3' });
    expect(nextStep([r('L4', 3), r('L3', 9), r('L3', 7)], ALL)).toEqual({
      type: 'done',
      level: { band: 'L3', qualifier: 'exact' },
    });
  });

  it('반전(상승 후 하강): 잘 봤던 아래 밴드로 돌아가 확인 후 확정', () => {
    // L4에서 9/10 → L5에서 3/10 → L4(방문·10문항뿐)로 돌아가 확인
    expect(nextStep([r('L4', 9), r('L5', 3)], ALL)).toEqual({ type: 'continue', band: 'L4' });
    // L4 누적 9+7=16/20 = 80% → 상승 신호지만 L5 방문(반전) → L4 확정
    expect(nextStep([r('L4', 9), r('L5', 3), r('L4', 7)], ALL)).toEqual({
      type: 'done',
      level: { band: 'L4', qualifier: 'exact' },
    });
  });

  it('연속 상승은 계속 진행', () => {
    expect(nextStep([r('L2', 9), r('L3', 8)], ALL)).toEqual({ type: 'continue', band: 'L4' });
  });

  it('MAX_ROUNDS(5) 도달 시 확인 라운드 없이 즉시 확정', () => {
    const rounds = [r('L2', 9), r('L3', 9), r('L4', 9), r('L5', 9), r('L6', 9)];
    expect(nextStep(rounds, ALL)).toEqual({
      type: 'done',
      level: { band: 'L6', qualifier: 'above' },
    });
  });

  it('총 문항 수는 최소 20문항 보장 (첫 라운드 확정 신호 시나리오)', () => {
    // 6/10 확정 신호 → 확인 라운드 → 총 20문항
    const step1 = nextStep([r('L5', 6)], ALL);
    expect(step1).toEqual({ type: 'continue', band: 'L5' });
  });
});

describe('resolveFinalLevel — 서버 재생', () => {
  it('클라이언트가 보낸 라운드 전체를 재생해 같은 결론을 낸다', () => {
    expect(resolveFinalLevel([r('L4', 9), r('L5', 3), r('L4', 6)], ALL)).toEqual({
      band: 'L4',
      qualifier: 'exact',
    });
  });

  it('진행 도중 끊긴 라운드는 마지막 밴드로 확정', () => {
    expect(resolveFinalLevel([r('L4', 6)], ALL)).toEqual({ band: 'L4', qualifier: 'exact' });
  });
});

describe('getStartBand', () => {
  it('학년의 기본 시작 밴드를 준다', () => {
    expect(getStartBand('h2', ALL)).toBe('L5');
    expect(getStartBand('elementary', ALL)).toBe('L0');
    expect(getStartBand('m1', ALL)).toBe('L1');
  });

  it('시작 밴드가 비활성이면 가장 가까운 활성 밴드로 (초등 → L1)', () => {
    expect(getStartBand('elementary', NO_L0)).toBe('L1');
  });
});

describe('recommendBandKey — 추천 교재 밴드', () => {
  it('exact 판정이면 그 밴드 교재', () => {
    expect(recommendBandKey({ band: 'L3', qualifier: 'exact' }, ALL)).toBe('L3');
  });

  it('"이상" 판정이면 한 단계 위 밴드 (있으면)', () => {
    expect(recommendBandKey({ band: 'L3', qualifier: 'above' }, ALL)).toBe('L4');
    // 최상단 돌파면 그대로
    expect(recommendBandKey({ band: 'L6', qualifier: 'above' }, ALL)).toBe('L6');
  });

  it('"미만" 판정이면 한 단계 아래 밴드 (있으면)', () => {
    expect(recommendBandKey({ band: 'L1', qualifier: 'below' }, ALL)).toBe('L0');
    // L0 비활성이면 L1 유지
    expect(recommendBandKey({ band: 'L1', qualifier: 'below' }, NO_L0)).toBe('L1');
  });

  it('exact라도 확정 밴드 정답률 60% 이상이면 한 칸 위 교재 (측정·처방 분리, 2026-08-05)', () => {
    expect(recommendBandKey({ band: 'L3', qualifier: 'exact' }, ALL, 65)).toBe('L4');
    // 경계값: 정확히 60%도 상향
    expect(recommendBandKey({ band: 'L3', qualifier: 'exact' }, ALL, 60)).toBe('L4');
    // 60% 미만이면 그 밴드 유지
    expect(recommendBandKey({ band: 'L3', qualifier: 'exact' }, ALL, 55)).toBe('L3');
    // 최상단이면 올라갈 곳이 없어 유지
    expect(recommendBandKey({ band: 'L6', qualifier: 'exact' }, ALL, 70)).toBe('L6');
    // 정답률 미제공(구 데이터)이면 상향 컷 없이 동작
    expect(recommendBandKey({ band: 'L3', qualifier: 'exact' }, ALL)).toBe('L3');
    // below 판정은 정답률과 무관하게 아래로
    expect(recommendBandKey({ band: 'L1', qualifier: 'below' }, ALL, 45)).toBe('L0');
  });
});

describe('formatLevel / levelGapFromGrade', () => {
  it('한국어 레벨 문구', () => {
    expect(formatLevel({ band: 'L3', qualifier: 'exact' })).toBe('중3');
    expect(formatLevel({ band: 'L6', qualifier: 'above' })).toBe('고3 이상');
    expect(formatLevel({ band: 'L1', qualifier: 'below' })).toBe('중1 미만');
    expect(formatLevel({ band: 'L0', qualifier: 'exact' })).toBe('초등');
    expect(formatLevel({ band: 'L0', qualifier: 'below' })).toBe('초등 미만');
  });

  it('학년 대비 격차 — 고2가 L3 판정이면 -2', () => {
    expect(levelGapFromGrade('h2', { band: 'L3', qualifier: 'exact' })).toBe(-2);
    expect(levelGapFromGrade('h2', { band: 'L5', qualifier: 'exact' })).toBe(0);
    expect(levelGapFromGrade('m3', { band: 'L4', qualifier: 'exact' })).toBe(1);
    // 초등학생이 중1 판정이면 학년보다 1단계 위
    expect(levelGapFromGrade('elementary', { band: 'L1', qualifier: 'exact' })).toBe(1);
    expect(levelGapFromGrade('elementary', { band: 'L0', qualifier: 'exact' })).toBe(0);
  });
});
