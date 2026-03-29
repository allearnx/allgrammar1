import type { ReportNaesinStats, ReportVocaStats } from '@/types/report';

export function computeWeaknesses(
  naesin: ReportNaesinStats | null,
  voca: ReportVocaStats | null,
  quizCorrect: number,
  quizTotal: number,
): { weaknesses: string[]; recommendations: string[] } {
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  if (naesin) {
    if (naesin.problemAvgScore !== null && naesin.problemAvgScore < 70) weaknesses.push(`문제풀이 평균 ${naesin.problemAvgScore}점 (목표 70점)`);
    if (naesin.unresolvedWrongAnswers > 5) weaknesses.push(`미해결 오답 ${naesin.unresolvedWrongAnswers}개`);
    if (naesin.unresolvedWrongAnswers > 0) recommendations.push('내신 오답을 복습하세요');
  }
  if (voca) {
    if (voca.quizAvgScore !== null && voca.quizAvgScore < 60) weaknesses.push(`올킬보카 퀴즈 평균 ${voca.quizAvgScore}점 (목표 60점)`);
    if (voca.spellingAvgScore !== null && voca.spellingAvgScore < 60) weaknesses.push(`스펠링 평균 ${voca.spellingAvgScore}점 (목표 60점)`);
    if (voca.totalDays > 0 && voca.daysInProgress < voca.totalDays) recommendations.push('올킬보카 미완료 Day를 학습하세요');
  }
  if (quizTotal > 0 && Math.round((quizCorrect / quizTotal) * 100) < 70) {
    weaknesses.push(`문법 퀴즈 정답률 ${Math.round((quizCorrect / quizTotal) * 100)}%`);
  }

  return { weaknesses, recommendations };
}
