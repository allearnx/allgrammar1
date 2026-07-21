import { describe, it, expect } from 'vitest';
import {
  DEFAULT_EXAM_INTENSITY,
  EXAM_PRESETS,
  resolveExamIntensity,
  matchPreset,
} from '@/lib/voca/exam-intensity';

describe('resolveExamIntensity', () => {
  it('null 행이면 시스템 기본(90/0/false)', () => {
    expect(resolveExamIntensity(null)).toEqual(DEFAULT_EXAM_INTENSITY);
    expect(resolveExamIntensity(undefined)).toEqual(DEFAULT_EXAM_INTENSITY);
    expect(resolveExamIntensity({})).toEqual(DEFAULT_EXAM_INTENSITY);
  });

  it('일부 필드만 NULL이면 그 필드만 기본으로 폴백', () => {
    expect(
      resolveExamIntensity({ voca_exam_pass_score: 100, voca_exam_seconds_per_word: null, voca_exam_retry_wrong: null }),
    ).toEqual({ passScore: 100, secondsPerWord: 0, retryWrong: false });
  });

  it('secondsPerWord 0(무제한)은 유효값이라 유지된다', () => {
    expect(
      resolveExamIntensity({ voca_exam_pass_score: 70, voca_exam_seconds_per_word: 0, voca_exam_retry_wrong: false }),
    ).toEqual({ passScore: 70, secondsPerWord: 0, retryWrong: false });
  });
});

describe('matchPreset', () => {
  it('프리셋과 정확히 일치하면 그 키', () => {
    for (const p of EXAM_PRESETS) {
      expect(matchPreset(p.intensity)).toBe(p.key);
    }
  });

  it('어느 프리셋과도 안 맞으면 custom', () => {
    expect(matchPreset({ passScore: 85, secondsPerWord: 6, retryWrong: true })).toBe('custom');
  });

  it('표준 기본값은 standard 프리셋과 일치', () => {
    expect(matchPreset({ passScore: 90, secondsPerWord: 8, retryWrong: true })).toBe('standard');
  });
});
