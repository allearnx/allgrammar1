/**
 * 표제어 시험 강도 설정 (합격선·제한시간·오답 재시험) — 순수 로직, 서버·클라이언트 공용.
 *
 * 학습 7단계(퀴즈/스펠링/매칭)와 무관하게 "표제어 스펠링 시험"에만 적용된다.
 * 프리셋은 UI 편의일 뿐이고 실제 저장·판정은 개별 값(pass/seconds/retry)으로 한다 —
 * 그래서 원장이 프리셋을 고르든 세부 값을 직접 만지든 동일한 그릇에 담긴다.
 */

export interface ExamIntensity {
  /** 합격 점수 (50~100) */
  passScore: number;
  /** 단어당 제한시간(초). 0 = 무제한 */
  secondsPerWord: number;
  /** 합격 미달 시 틀린 단어만 모아 재시험 유도 */
  retryWrong: boolean;
}

/** 시스템 기본 — 기존 동작(90점 통과·무제한·재시험 없음) 그대로 유지 */
export const DEFAULT_EXAM_INTENSITY: ExamIntensity = {
  passScore: 90,
  secondsPerWord: 0,
  retryWrong: false,
};

export type ExamPresetKey = 'basic' | 'standard' | 'perfect';

export interface ExamPreset {
  key: ExamPresetKey;
  label: string;
  hint: string;
  intensity: ExamIntensity;
}

export const EXAM_PRESETS: ExamPreset[] = [
  { key: 'basic', label: '기초', hint: '합격 70 · 여유롭게', intensity: { passScore: 70, secondsPerWord: 0, retryWrong: false } },
  { key: 'standard', label: '표준', hint: '합격 90 · 단어당 8초', intensity: { passScore: 90, secondsPerWord: 8, retryWrong: true } },
  { key: 'perfect', label: '완벽', hint: '합격 100 · 단어당 5초', intensity: { passScore: 100, secondsPerWord: 5, retryWrong: true } },
];

/** service_assignments 행(부분)에서 강도 도출 — NULL 필드는 시스템 기본으로 폴백 */
export function resolveExamIntensity(row: {
  voca_exam_pass_score?: number | null;
  voca_exam_seconds_per_word?: number | null;
  voca_exam_retry_wrong?: boolean | null;
} | null | undefined): ExamIntensity {
  return {
    passScore: row?.voca_exam_pass_score ?? DEFAULT_EXAM_INTENSITY.passScore,
    secondsPerWord: row?.voca_exam_seconds_per_word ?? DEFAULT_EXAM_INTENSITY.secondsPerWord,
    retryWrong: row?.voca_exam_retry_wrong ?? DEFAULT_EXAM_INTENSITY.retryWrong,
  };
}

/** 현재 강도와 정확히 일치하는 프리셋 키 (없으면 'custom') */
export function matchPreset(intensity: ExamIntensity): ExamPresetKey | 'custom' {
  const hit = EXAM_PRESETS.find(
    (p) =>
      p.intensity.passScore === intensity.passScore &&
      p.intensity.secondsPerWord === intensity.secondsPerWord &&
      p.intensity.retryWrong === intensity.retryWrong,
  );
  return hit?.key ?? 'custom';
}
