import {
  BookOpen,
  FileText,
  MessageSquare,
  PlayCircle,
  Ruler,
  PenLine,
  FileQuestion,
  RefreshCw,
} from 'lucide-react';
import type {
  NaesinStageStatus,
  NaesinStageStatuses,
  NaesinStudentProgress,
  NaesinUnit,
  NaesinExamAssignment,
} from '@/types/naesin';

export const NAESIN_STAGE_KEYS = ['vocab', 'passage', 'dialogue', 'textbookVideo', 'grammar', 'problem', 'mockExam', 'lastReview'] as const;

export const NAESIN_STAGE_LABELS: Record<string, string> = {
  vocab: '단어 암기',
  passage: '교과서 암기',
  dialogue: '대화문 암기',
  textbookVideo: '설명 영상',
  grammar: '문법 설명',
  problem: '문제풀이',
  mockExam: '예상문제',
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
  return (['vocab', 'passage', 'dialogue', 'textbookVideo', 'grammar', 'problem', 'mockExam'] as const).every(
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
      + (s.dialogue === 'completed' ? 1 : 0)
      + (s.textbookVideo === 'completed' ? 1 : 0)
      + (s.grammar === 'completed' ? 1 : 0)
      + (s.problem === 'completed' ? 1 : 0)
      + (s.mockExam === 'completed' ? 1 : 0);
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

// ── Shared stage interface ──

export interface NaesinStage {
  key: string;
  label: string;
  stageKey: string;
  status: 'done' | 'active' | 'locked';
  icon: React.ReactNode;
  description: string;
  scoreRequirement: string;
  actualScore?: string;
}

// ── Stage meta (icons + descriptions) ──

export const NAESIN_STAGE_META: Record<string, { icon: React.ReactNode; description: string; scoreRequirement: string }> = {
  vocab: { icon: <BookOpen className="h-6 w-6" />, description: '교과서 단어를\n암기합니다', scoreRequirement: '퀴즈+스펠링 시작' },
  passage: { icon: <FileText className="h-6 w-6" />, description: '교과서 지문을\n암기합니다', scoreRequirement: '지문 암기 완료' },
  dialogue: { icon: <MessageSquare className="h-6 w-6" />, description: '대화문을\n영작합니다', scoreRequirement: '대화문 암기 완료' },
  textbookVideo: { icon: <PlayCircle className="h-6 w-6" />, description: '교과서 설명\n영상 시청', scoreRequirement: '영상 시청 완료' },
  grammar: { icon: <Ruler className="h-6 w-6" />, description: '핵심 문법을\n학습합니다', scoreRequirement: '영상 시청 완료' },
  problem: { icon: <PenLine className="h-6 w-6" />, description: '문제를 풀며\n실력 확인', scoreRequirement: '문제풀이 완료' },
  mockExam: { icon: <FileQuestion className="h-6 w-6" />, description: '예상문제로\n실전 테스트', scoreRequirement: '예상문제 완료' },
  lastReview: { icon: <RefreshCw className="h-6 w-6" />, description: '시험 직전\n최종 점검', scoreRequirement: '최종 점검 완료' },
};

// ── Badge text helpers ──

export function getVocabBadgeText(progress: NaesinStudentProgress | null): string {
  if (!progress) return '퀴즈+스펠링 시작';
  const q = progress.vocab_quiz_score;
  const s = progress.vocab_spelling_score;
  const qDone = q !== null && q !== undefined;
  const sDone = s !== null && s !== undefined;
  const qPass = qDone && q >= 80;
  const sPass = sDone && s >= 80;

  if (!qDone && !sDone) return '퀴즈+스펠링 시작';
  if (qDone && !sDone) return qPass ? `퀴즈 ${q}점 ✓ · 스펠링 대기` : `퀴즈 ${q}점 · 재도전`;
  if (qDone && sDone) {
    if (qPass && sPass) return `퀴즈 ${q}점 · 스펠링 ${s}점 ✓`;
    if (qPass && !sPass) return `퀴즈 ✓ · 스펠링 ${s}점 재도전`;
    return `퀴즈 ${q}점 · 스펠링 ${s}점 재도전`;
  }
  return '퀴즈+스펠링 시작';
}

export function getPassageBadgeText(progress: NaesinStudentProgress | null): string {
  if (!progress) return '지문 암기 완료';
  const fb = progress.passage_fill_blanks_best;
  const tr = progress.passage_translation_best;
  if (fb === null && tr === null) return '지문 암기 완료';
  const parts: string[] = [];
  if (fb !== null) parts.push(`빈칸 ${fb}점${fb >= 80 ? ' ✓' : ''}`);
  if (tr !== null) parts.push(`영작 ${tr}점${tr >= 80 ? ' ✓' : ''}`);
  return parts.join(' · ') || '지문 암기 완료';
}

export function getDialogueBadgeText(progress: NaesinStudentProgress | null): string {
  if (!progress) return '대화문 암기 완료';
  const tr = progress.dialogue_translation_best;
  if (tr === null || tr === undefined) return '대화문 암기 완료';
  return `영작 ${tr}점${tr >= 80 ? ' ✓' : ''}`;
}

export function getGrammarBadgeText(progress: NaesinStudentProgress | null, videoCount: number): string {
  if (!progress || videoCount === 0) return '영상 시청 완료';
  const done = progress.grammar_videos_completed ?? 0;
  if (done >= videoCount) return `${videoCount}개 영상 시청 ✓`;
  if (done > 0) return `${done}/${videoCount} 영상 시청 중`;
  return '영상 시청 완료';
}

// ── Build stage list for a unit (with badge text) ──

export function getNaesinStagesForUnit(
  statuses: NaesinStageStatuses,
  progress: NaesinStudentProgress | null,
  grammarVideoCount?: number,
): NaesinStage[] {
  const stages: NaesinStage[] = [];
  for (const key of NAESIN_STAGE_KEYS) {
    const mapped = mapNaesinStatus(statuses[key]);
    if (mapped === null) continue;
    const meta = NAESIN_STAGE_META[key];

    let actualScore: string | undefined;
    let dynamicRequirement = meta.scoreRequirement;

    if (mapped === 'done') {
      actualScore = '완료 ✓';
    } else {
      if (key === 'vocab') dynamicRequirement = getVocabBadgeText(progress);
      else if (key === 'passage') dynamicRequirement = getPassageBadgeText(progress);
      else if (key === 'dialogue') dynamicRequirement = getDialogueBadgeText(progress);
      else if (key === 'grammar') dynamicRequirement = getGrammarBadgeText(progress, grammarVideoCount ?? 0);
    }

    stages.push({
      key,
      label: NAESIN_STAGE_LABELS[key],
      stageKey: key === 'lastReview' ? 'last-review' : key,
      status: mapped,
      icon: meta.icon,
      description: meta.description,
      scoreRequirement: dynamicRequirement,
      actualScore,
    });
  }
  return stages;
}

// ── Simpler version without badge text (for combined dashboard) ──

export function getNaesinStagesSimple(
  statuses: NaesinStageStatuses,
  progress: NaesinStudentProgress | null,
): NaesinStage[] {
  const stages: NaesinStage[] = [];
  for (const key of NAESIN_STAGE_KEYS) {
    const mapped = mapNaesinStatus(statuses[key]);
    if (mapped === null) continue;
    const meta = NAESIN_STAGE_META[key];

    let actualScore: string | undefined;
    if (mapped === 'done') {
      actualScore = '완료 ✓';
    } else if (progress) {
      if (key === 'vocab' && progress.vocab_quiz_score != null) actualScore = `${progress.vocab_quiz_score}점`;
    }

    stages.push({
      key,
      label: NAESIN_STAGE_LABELS[key],
      stageKey: key === 'lastReview' ? 'last-review' : key,
      status: mapped,
      icon: meta.icon,
      description: meta.description,
      scoreRequirement: meta.scoreRequirement,
      actualScore,
    });
  }
  return stages;
}
