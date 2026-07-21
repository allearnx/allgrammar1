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

describe('resolveExamIntensity — 다층 병합 (2단계)', () => {
  const academy = {
    voca_exam_pass_score_default: 80,
    voca_exam_seconds_per_word_default: 10,
    voca_exam_retry_wrong_default: true,
  };

  it('학생 예외 없으면 학원 기본으로 폴백', () => {
    expect(resolveExamIntensity(null, academy)).toEqual({ passScore: 80, secondsPerWord: 10, retryWrong: true });
  });

  it('학생 예외가 학원 기본보다 우선 (필드별)', () => {
    expect(
      resolveExamIntensity({ voca_exam_pass_score: 100, voca_exam_seconds_per_word: null, voca_exam_retry_wrong: null }, academy),
    ).toEqual({ passScore: 100, secondsPerWord: 10, retryWrong: true });
  });

  it('배정시험 시간 오버라이드가 최우선 (시간만)', () => {
    expect(
      resolveExamIntensity({ voca_exam_pass_score: 100, voca_exam_seconds_per_word: 5, voca_exam_retry_wrong: true }, academy, 3),
    ).toEqual({ passScore: 100, secondsPerWord: 3, retryWrong: true });
  });

  it('override 0초는 유효값이라 상위 시간을 덮는다', () => {
    expect(
      resolveExamIntensity({ voca_exam_pass_score: null, voca_exam_seconds_per_word: 5, voca_exam_retry_wrong: null }, academy, 0),
    ).toEqual({ passScore: 80, secondsPerWord: 0, retryWrong: true });
  });

  it('전부 null이면 시스템 기본', () => {
    expect(resolveExamIntensity(null, null)).toEqual(DEFAULT_EXAM_INTENSITY);
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
