import type {
  NaesinStageStatus,
  NaesinStageStatuses,
  NaesinStudentProgress,
  NaesinUnit,
  NaesinExamAssignment,
} from '@/types/naesin';

export const NAESIN_STAGE_KEYS = ['vocab', 'passage', 'grammar', 'problem', 'lastReview'] as const;

export const NAESIN_STAGE_LABELS: Record<string, string> = {
  vocab: '단어 암기',
  passage: '교과서 암기',
  grammar: '문법 설명',
  problem: '문제풀이',
  lastReview: '직전보강',
};

export function getDDay(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(dateStr);
  exam.setHours(0, 0, 0, 0);
  return Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isNaesinUnitComplete(statuses: NaesinStageStatuses): boolean {
  return (['vocab', 'passage', 'grammar', 'problem'] as const).every(
    (k) => statuses[k] === 'completed' || statuses[k] === 'hidden',
  );
}

export function mapNaesinStatus(s: NaesinStageStatus): 'done' | 'active' | 'locked' | null {
  if (s === 'completed') return 'done';
  if (s === 'available') return 'active';
  if (s === 'hidden') return null;
  return 'locked';
}

export function computeNaesinStats(
  progressList: NaesinStudentProgress[],
  statusesMap: Map<string, NaesinStageStatuses>,
  sortedUnits: NaesinUnit[],
  examAssignments: NaesinExamAssignment[],
): {
  completedStages: number;
  completedUnits: number;
  avgVocabScore: number;
  nearestDDay: number | null;
} {
  const completedStages = sortedUnits.reduce((acc, u) => {
    const s = statusesMap.get(u.id);
    if (!s) return acc;
    return acc
      + (s.vocab === 'completed' ? 1 : 0)
      + (s.passage === 'completed' ? 1 : 0)
      + (s.grammar === 'completed' ? 1 : 0)
      + (s.problem === 'completed' ? 1 : 0);
  }, 0);

  const completedUnits = sortedUnits.filter((u) => {
    const s = statusesMap.get(u.id);
    return s && isNaesinUnitComplete(s);
  }).length;

  const vocabScores = progressList.flatMap((p) => {
    const scores: number[] = [];
    if (p.vocab_quiz_score !== null) scores.push(p.vocab_quiz_score);
    if (p.vocab_spelling_score !== null) scores.push(p.vocab_spelling_score);
    return scores;
  });
  const avgVocabScore = vocabScores.length > 0
    ? Math.round(vocabScores.reduce((a, b) => a + b, 0) / vocabScores.length)
    : 0;

  const futureDDays = examAssignments
    .map((a) => getDDay(a.exam_date))
    .filter((d): d is number => d !== null && d >= 0);
  const nearestDDay = futureDDays.length > 0 ? Math.min(...futureDDays) : null;

  return { completedStages, completedUnits, avgVocabScore, nearestDDay };
}
