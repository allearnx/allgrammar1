import {
  Eye,
  PenLine,
  Keyboard,
  Link2,
  LibraryBig,
  BrainCircuit,
} from 'lucide-react';
import type { VocaStudentProgress } from '@/types/voca';

export interface VocaStage {
  key: string;
  label: string;
  status: 'done' | 'active' | 'locked';
  icon: React.ReactNode;
  description: string;
  scoreRequirement: string;
  actualScore?: string;
}

export function getR1Stages(p: VocaStudentProgress | null): VocaStage[] {
  const fc = p?.flashcard_completed ?? false;
  const quizPass = (p?.quiz_score ?? 0) >= 80;
  const spellPass = (p?.spelling_score ?? 0) >= 80;
  const matchDone = p?.matching_completed ?? false;

  const fcDone = fc || quizPass;

  const quizStatus = quizPass ? 'done' : fcDone ? 'active' : 'locked';
  const spellStatus = spellPass ? 'done' : quizPass ? 'active' : 'locked';
  const matchStatus = matchDone ? 'done' : spellPass ? 'active' : 'locked';

  return [
    {
      key: 'flashcard', label: '플래시카드', status: fcDone ? 'done' : 'active',
      icon: <Eye className="h-6 w-6" />, description: '단어·뜻·예문을\n카드로 확인',
      scoreRequirement: '카드 확인', actualScore: fcDone ? '완료 ✓' : undefined,
    },
    {
      key: 'quiz', label: '퀴즈', status: quizStatus,
      icon: <PenLine className="h-6 w-6" />, description: '5지선다 객관식으로\n이해도를 확인해요',
      scoreRequirement: '80점 통과', actualScore: p?.quiz_score != null ? `${p.quiz_score}점` : undefined,
    },
    {
      key: 'spelling', label: '스펠링', status: spellStatus,
      icon: <Keyboard className="h-6 w-6" />, description: '뜻 보고 영단어\n직접 입력',
      scoreRequirement: '80점 통과', actualScore: p?.spelling_score != null ? `${p.spelling_score}점` : undefined,
    },
    {
      key: 'matching', label: '매칭', status: matchStatus,
      icon: <Link2 className="h-6 w-6" />, description: '유의어·반의어\n연결하기',
      scoreRequirement: '90점 통과', actualScore: matchDone ? '완료' : p?.matching_score != null ? `${p.matching_score}점` : undefined,
    },
  ] as const satisfies VocaStage[];
}

export function getR2Stages(p: VocaStudentProgress | null): VocaStage[] {
  const r1Done = isR1Complete(p);
  const fc2 = p?.round2_flashcard_completed ?? false;
  const quiz2Pass = (p?.round2_quiz_score ?? 0) >= 80;
  const match2Done = p?.round2_matching_completed ?? false;

  if (!r1Done) {
    return [
      { key: 'r2_flashcard', label: '플래시카드', status: 'locked', icon: <LibraryBig className="h-6 w-6" />, description: '유의어·반의어\n숙어 학습', scoreRequirement: '—' },
      { key: 'r2_quiz', label: '종합 문제', status: 'locked', icon: <BrainCircuit className="h-6 w-6" />, description: '9가지 유형\nAI 서술형 채점', scoreRequirement: '—' },
      { key: 'r2_matching', label: '심화 매칭', status: 'locked', icon: <Link2 className="h-6 w-6" />, description: '고난도\n연결하기', scoreRequirement: '—' },
    ];
  }

  const fc2Done = fc2 || quiz2Pass;
  const quiz2Status = quiz2Pass ? 'done' : fc2Done ? 'active' : 'locked';
  const match2Status = match2Done ? 'done' : quiz2Pass ? 'active' : 'locked';

  return [
    {
      key: 'r2_flashcard', label: '플래시카드', status: fc2Done ? 'done' : 'active',
      icon: <LibraryBig className="h-6 w-6" />, description: '유의어·반의어\n숙어 학습',
      scoreRequirement: '카드 확인', actualScore: fc2Done ? '완료 ✓' : undefined,
    },
    {
      key: 'r2_quiz', label: '종합 문제', status: quiz2Status,
      icon: <BrainCircuit className="h-6 w-6" />, description: '9가지 유형\nAI 서술형 채점',
      scoreRequirement: '80점 통과', actualScore: p?.round2_quiz_score != null ? `${p.round2_quiz_score}점` : undefined,
    },
    {
      key: 'r2_matching', label: '심화 매칭', status: match2Status,
      icon: <Link2 className="h-6 w-6" />, description: '고난도\n연결하기',
      scoreRequirement: '90점 통과', actualScore: match2Done ? '완료' : p?.round2_matching_score != null ? `${p.round2_matching_score}점` : undefined,
    },
  ];
}

export function isR1Complete(p: VocaStudentProgress | null): boolean {
  if (!p) return false;
  const quizPass = (p.quiz_score ?? 0) >= 80;
  const fcDone = p.flashcard_completed || quizPass;
  return (
    fcDone &&
    quizPass &&
    (p.spelling_score ?? 0) >= 80 &&
    p.matching_completed
  );
}

export function isR2Complete(p: VocaStudentProgress | null): boolean {
  if (!p) return false;
  const quiz2Pass = (p.round2_quiz_score ?? 0) >= 80;
  const fc2Done = p.round2_flashcard_completed || quiz2Pass;
  return (
    fc2Done &&
    quiz2Pass &&
    p.round2_matching_completed
  );
}

export function computeVocaStats(
  progressList: VocaStudentProgress[],
  wrongWordCounts: Record<string, number> = {},
): {
  r1CompletedStages: number;
  avgQuizScore: number;
  wrongWordEntries: [string, number][];
} {
  const r1CompletedStages = progressList.reduce((acc, p) => {
    return acc + (p.flashcard_completed ? 1 : 0)
      + ((p.quiz_score ?? 0) >= 80 ? 1 : 0)
      + ((p.spelling_score ?? 0) >= 80 ? 1 : 0)
      + (p.matching_completed ? 1 : 0);
  }, 0);

  const quizScores = progressList
    .filter((p) => p.quiz_score !== null)
    .map((p) => p.quiz_score!);
  const avgQuizScore = quizScores.length > 0
    ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
    : 0;

  const wrongWordEntries = Object.entries(wrongWordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10) as [string, number][];

  return { r1CompletedStages, avgQuizScore, wrongWordEntries };
}

export function getCtaText(stage: VocaStage): { title: string; sub: string } {
  switch (stage.key) {
    case 'flashcard':
      return { title: '플래시카드를 시작할 차례예요!', sub: '단어 카드를 확인하면 다음 단계로 진행돼요' };
    case 'quiz':
      return { title: '퀴즈를 시작할 차례예요!', sub: '플래시카드 완료 · 퀴즈 80점 이상이면 다음 단계로 진행돼요' };
    case 'spelling':
      return { title: '스펠링을 시작할 차례예요!', sub: '퀴즈 통과 · 스펠링 80점 이상이면 다음 단계로 진행돼요' };
    case 'matching':
      return { title: '매칭을 시작할 차례예요!', sub: '스펠링 통과 · 매칭 90점 이상이면 1회독이 완료돼요' };
    case 'r2_flashcard':
      return { title: '2회독 플래시카드를 시작하세요!', sub: '유의어·반의어·숙어를 학습해요' };
    case 'r2_quiz':
      return { title: '종합 문제를 시작할 차례예요!', sub: '플래시카드 완료 · 80점 이상이면 다음 단계로 진행돼요' };
    case 'r2_matching':
      return { title: '심화 매칭을 시작할 차례예요!', sub: '종합문제 통과 · 90점 이상이면 2회독이 완료돼요' };
    default:
      return { title: `${stage.label}을 시작하세요!`, sub: '' };
  }
}
