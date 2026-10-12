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

/** 정오는 클라이언트가 모른다 — 봉인 토큰과 답(타이핑 or 보기 인덱스)만 보관·전송 (null = 모르겠어요) */
export interface AnsweredItem {
  token: string;
  typed?: string | null;
  chosenIndex?: number | null;
}

export interface CompletedRound {
  band: BandKey;
  items: AnsweredItem[];
}
