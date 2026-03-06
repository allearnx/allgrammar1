// ============================================
// 리포트 시스템
// ============================================

/** Phase 1 영상 학습 */
export interface ReportVideoProgress {
  completed: number;
  total: number;
}

/** Phase 1 암기 학습 */
export interface ReportMemoryProgress {
  mastered: number;
  total: number;
  dueReviews: number;
}

/** Phase 1 교과서 학습 */
export interface ReportTextbookProgress {
  completed: number;
}

/** 내신 대비 통계 */
export interface ReportNaesinStats {
  /** 진행 중인 단원 수 / 전체 단원 수 */
  unitsInProgress: number;
  totalUnits: number;
  /** 단계별 완료 수 */
  stagesCompleted: {
    vocab: number;
    passage: number;
    grammar: number;
    problem: number;
    lastReview: number;
  };
  /** 문제풀이 평균 점수 (0-100) */
  problemAvgScore: number | null;
  /** 문제풀이 시도 횟수 */
  problemAttempts: number;
  /** 미해결 오답 수 */
  unresolvedWrongAnswers: number;
  /** 영상 시청: 완료/전체 */
  videoCompleted: number;
  videoTotal: number;
  /** 총 시청 시간(초) */
  totalWatchSeconds: number;
  /** 퀴즈셋 평균 점수 */
  quizSetAvgScore: number | null;
}

/** 올톡보카 통계 */
export interface ReportVocaStats {
  /** 진행 중인 Day 수 / 전체 Day 수 */
  daysInProgress: number;
  totalDays: number;
  /** 플래시카드 완료 수 */
  flashcardCompleted: number;
  /** 퀴즈 평균 점수 */
  quizAvgScore: number | null;
  /** 스펠링 평균 점수 */
  spellingAvgScore: number | null;
  /** 매칭 완료 수 */
  matchingCompleted: number;
}

/** API 응답 전체 구조 (= stats JSONB에 저장되는 구조) */
export interface EnhancedReportData {
  student: string;
  generatedAt: string;
  videoProgress: ReportVideoProgress;
  memoryProgress: ReportMemoryProgress;
  textbookProgress: ReportTextbookProgress;
  totalWatchedMinutes: number;
  quizAccuracy: number;
  /** 배정된 서비스 목록 */
  services: ('naesin' | 'voca')[];
  /** 내신 대비 (서비스 배정 시만 존재) */
  naesin: ReportNaesinStats | null;
  /** 올톡보카 (서비스 배정 시만 존재) */
  voca: ReportVocaStats | null;
  /** 자동 분석 약점 */
  weaknesses: string[];
  /** 자동 추천 */
  recommendations: string[];
}

/** DB weekly_reports 행 */
export interface WeeklyReportRow {
  id: string;
  student_id: string;
  generated_by: string;
  week_start: string;
  week_end: string;
  stats: EnhancedReportData;
  weaknesses: string[];
  recommendations: string[];
  created_at: string;
}
