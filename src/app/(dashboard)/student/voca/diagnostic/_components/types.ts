import type { BandKey, FinalLevel } from '@/lib/voca/diagnostic-bands';

/** 진단 화면들이 공유하는 타입 — 서버 응답 형태는 /api/voca/diagnostic/submit 과 맞춘다 */
export interface LatestDiagnostic {
  grade: string;
  finalBand: string;
  finalQualifier: string;
  coverageScore: number;
  /** 확정 밴드 정답률 — 추천 상향 컷 재현용 (저장된 rounds에서 재계산) */
  finalBandScore?: number;
  attemptNumber: number;
  createdAt: string;
}

export interface MissedWord {
  front_text: string;
  back_text: string;
}

export interface SubmitResponse {
  id: string;
  attemptNumber: number;
  level: FinalLevel;
  coverageScore: number;
  /** 확정 밴드 정답률 — 60% 이상이면 추천이 한 칸 위 교재로 (RECOMMEND_UP_PERCENT) */
  finalBandScore?: number;
  startBand?: BandKey;
  missed?: MissedWord[];
  missedCount?: number;
}
