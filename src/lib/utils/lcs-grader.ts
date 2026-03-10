// LCS(Longest Common Subsequence) 기반 채점 유틸

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function lcsLength(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

export function gradeAnswerLCS(original: string, student: string): number {
  const normOrig = normalize(original);
  const normStudent = normalize(student);
  if (normOrig === normStudent) return 100;
  const origWords = normOrig.split(' ');
  const studentWords = normStudent.split(' ');
  if (origWords.length === 0) return 0;
  const matchedCount = lcsLength(origWords, studentWords);
  return Math.min(Math.round((matchedCount / origWords.length) * 100), 100);
}

export function getFeedbackLCS(score: number): string {
  if (score === 100) return '완벽합니다!';
  if (score >= 90) return '거의 맞았어요! 조금만 더 확인해보세요.';
  if (score >= 70) return '잘 쓰고 있어요. 빠진 부분을 확인하세요.';
  if (score >= 50) return '절반 이상 맞았어요. 원문을 다시 확인하세요.';
  return '원문을 다시 읽고 도전해보세요.';
}
