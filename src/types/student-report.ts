import type { ReportNaesinStats, ReportVocaStats } from './report';

/** 학습 활동 기록 (캘린더 + 리스트용) */
export interface ActivityRecord {
  date: string;          // 'yyyy-MM-dd'
  type: 'voca_quiz' | 'voca_spelling' | 'voca_matching' | 'naesin_vocab' | 'naesin_passage' | 'naesin_problem' | 'naesin_video';
  label: string;         // 예: "보카 Day 3 퀴즈", "내신 Unit 2 문제풀이"
  score: number | null;  // 점수 (없으면 null, 완료만 표시)
  maxScore: number | null;
}

export interface StudentReportData {
  current: {
    services: ('naesin' | 'voca')[];
    naesin: ReportNaesinStats | null;
    voca: ReportVocaStats | null;
    weaknesses: string[];
    recommendations: string[];
  };
  trends: {
    vocaQuizScores: { date: string; score: number; label: string }[];
    naesinProblemScores: { date: string; score: number; label: string }[];
    naesinVocabScores: { date: string; score: number }[];
  };
  wrongAnalysis: {
    vocaTopWrong: { word: string; count: number }[];
    naesinWrongByStage: { stage: string; total: number; unresolved: number }[];
    naesinWrongByUnit: { unitId: string; unitTitle: string; total: number; unresolved: number }[];
  };
  unitBreakdown: {
    vocaDays: {
      dayNumber: number;
      title: string;
      quizScore: number | null;
      spellingScore: number | null;
      matchingScore: number | null;
      r1Complete: boolean;
      r2Complete: boolean;
    }[];
    naesinUnits: {
      unitNumber: number;
      title: string;
      vocabScore: number | null;
      passageComplete: boolean;
      problemScore: number | null;
      stagesCompleted: number;
    }[];
  };
  /** 날짜별 학습 활동 기록 */
  activityLog: ActivityRecord[];
}
