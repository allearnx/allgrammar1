import type { ReportNaesinStats, ReportVocaStats } from './report';

/** 토픽별 정답률 항목 */
export interface TopicAccuracyItem {
  topic: string;           // "수여동사", "관계대명사 what"
  totalCorrect: number;
  totalQuestions: number;
  accuracy: number;        // 0-100
  attemptCount: number;
  trend: { week: string; accuracy: number }[];
  unitIds: string[];       // 해당 토픽 출현 단원 (최근 시도순)
  unitTitles: string[];    // unitIds 대응 단원명
  lastStudiedAt?: string;  // ISO timestamp, 가장 최근 학습일
}

/** 학습 활동 기록 (캘린더 + 리스트용) */
export interface ActivityRecord {
  date: string;          // 'yyyy-MM-dd'
  type: 'voca_quiz' | 'voca_spelling' | 'voca_matching' | 'naesin_vocab' | 'naesin_passage' | 'naesin_problem' | 'naesin_video';
  label: string;         // 예: "보카 Day 3 퀴즈", "내신 Unit 2 문제풀이"
  score: number | null;  // 점수 (없으면 null, 완료만 표시)
  maxScore: number | null;
}

/** 시험별 준비도 — 시험 배정(차수·날짜·범위)에 스코프된 진도·성적·오답 집계 */
export interface ExamReadiness {
  textbookName: string;
  examRound: number;
  examLabel: string | null;
  /** yyyy-MM-dd (null = 날짜 미지정) */
  examDate: string | null;
  units: { id: string; unitNumber: number; title: string }[];
  /** 학습을 시작한 범위 단원 수 */
  unitsStarted: number;
  /** 문제풀이+모의고사까지 완료한 범위 단원 수 */
  unitsCompleted: number;
  problemAttempts: number;
  problemAvgScore: number | null;
  wrongTotal: number;
  wrongUnresolved: number;
}

export interface StudentReportData {
  current: {
    services: ('naesin' | 'voca')[];
    naesin: ReportNaesinStats | null;
    voca: ReportVocaStats | null;
    weaknesses: string[];
    recommendations: string[];
  };
  /** 시험별 준비도 (내신 시험 배정이 있을 때만 채워짐) */
  examReadiness?: ExamReadiness[];
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
      passageScores?: {
        fill_blanks?: { easy?: number; medium?: number; hard?: number };
        ordering?: number;
        translation?: number;
        grammar_vocab?: number;
      };
    }[];
  };
  /** 날짜별 학습 활동 기록 */
  activityLog: ActivityRecord[];
  /** 날짜별 학습 시간 (초) — 히트맵용 */
  dailyLearningSeconds?: Record<string, number>;
  /** 토픽별 정답률 */
  topicAccuracy?: TopicAccuracyItem[];
}
