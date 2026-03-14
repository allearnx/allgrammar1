import type { EnhancedReportData } from '@/types/report';

// ── 약점 / 추천 자동 분석 ──

export function computeWeaknesses(report: EnhancedReportData): string[] {
  const w: string[] = [];

  // Phase 1
  if (report.quizAccuracy > 0 && report.quizAccuracy < 70) {
    w.push(`문법 퀴즈 정답률 ${report.quizAccuracy}% (목표 70%)`);
  }
  if (report.memoryProgress.dueReviews > 20) {
    w.push(`복습 대기 ${report.memoryProgress.dueReviews}개 (20개 초과)`);
  }

  // 내신
  if (report.naesin) {
    const n = report.naesin;
    if (n.totalUnits > 0) {
      const completionRate = Math.round((n.unitsInProgress / n.totalUnits) * 100);
      if (completionRate < 50) {
        w.push(`내신 단원 진행률 ${completionRate}% (목표 50%)`);
      }
    }
    if (n.unresolvedWrongAnswers > 5) {
      w.push(`미해결 오답 ${n.unresolvedWrongAnswers}개 (5개 초과)`);
    }
    if (n.problemAvgScore !== null && n.problemAvgScore < 70) {
      w.push(`문제풀이 평균 ${n.problemAvgScore}점 (목표 70점)`);
    }
  }

  // 올킬보카
  if (report.voca) {
    const v = report.voca;
    if (v.quizAvgScore !== null && v.quizAvgScore < 60) {
      w.push(`올킬보카 퀴즈 평균 ${v.quizAvgScore}점 (목표 60점)`);
    }
    if (v.spellingAvgScore !== null && v.spellingAvgScore < 60) {
      w.push(`올킬보카 스펠링 평균 ${v.spellingAvgScore}점 (목표 60점)`);
    }
  }

  return w;
}

export function computeRecommendations(report: EnhancedReportData): string[] {
  const r: string[] = [];

  if (report.memoryProgress.dueReviews > 0) {
    r.push('복습 대기 항목을 우선 학습하세요');
  }
  if (report.videoProgress.total > 0 && report.videoProgress.completed < report.videoProgress.total) {
    r.push('미완료 문법 영상을 시청하세요');
  }
  if (report.naesin) {
    if (report.naesin.unresolvedWrongAnswers > 0) {
      r.push('내신 오답을 복습하고 유사 문제를 풀어보세요');
    }
    if (report.naesin.videoTotal > 0 && report.naesin.videoCompleted < report.naesin.videoTotal) {
      r.push('내신 문법 영상을 마저 시청하세요');
    }
  }
  if (report.voca) {
    if (report.voca.totalDays > 0 && report.voca.daysInProgress < report.voca.totalDays) {
      r.push('올킬보카 미완료 Day를 학습하세요');
    }
    if (report.voca.spellingAvgScore !== null && report.voca.spellingAvgScore < 80) {
      r.push('올킬보카 스펠링 연습을 더 하세요');
    }
  }

  return r;
}

// ── 평균 점수 헬퍼 ──

export function avgScore(rows: { score: number }[]): number | null {
  if (rows.length === 0) return null;
  return Math.round(rows.reduce((a, r) => a + r.score, 0) / rows.length);
}

export function avgNullableScore(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((a, v) => a + v, 0) / valid.length);
}
