'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  Lock,
  PlayCircle,
  BookOpen,
  ClipboardList,
  CalendarDays,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { calculateStageStatuses } from '@/lib/naesin/stage-unlock';
import type { VocaBook, VocaDay, VocaStudentProgress } from '@/types/voca';
import type {
  NaesinUnit,
  NaesinStudentProgress,
  NaesinStageStatus,
  NaesinStageStatuses,
  NaesinContentAvailability,
  NaesinExamAssignment,
} from '@/types/naesin';

// ── Types ──

type StageStatus = 'done' | 'active' | 'locked';

interface VocaStage {
  key: string;
  label: string;
  status: StageStatus;
}

interface NaesinStage {
  key: string;
  label: string;
  stageKey: string;
  status: StageStatus;
}

interface Props {
  userName: string;
  // Voca
  vocaBooks: VocaBook[];
  vocaDays: VocaDay[];
  vocaProgressList: VocaStudentProgress[];
  vocaWordCount: number;
  // Naesin
  textbookName: string;
  naesinUnits: NaesinUnit[];
  naesinProgressList: NaesinStudentProgress[];
  examAssignments: NaesinExamAssignment[];
  contentMap: Record<string, NaesinContentAvailability>;
  vocabQuizSetCounts: Record<string, number>;
  grammarVideoCounts: Record<string, number>;
  enabledStages?: string[];
}

// ── Voca Helpers (from voca-dashboard) ──

function getR1Stages(p: VocaStudentProgress | null): VocaStage[] {
  const fc = p?.flashcard_completed ?? false;
  const quizPass = (p?.quiz_score ?? 0) >= 80;
  const spellPass = (p?.spelling_score ?? 0) >= 80;
  const matchDone = p?.matching_completed ?? false;

  const quizStatus: StageStatus = quizPass ? 'done' : fc ? 'active' : 'locked';
  const spellStatus: StageStatus = spellPass ? 'done' : quizPass ? 'active' : 'locked';
  const matchStatus: StageStatus = matchDone ? 'done' : spellPass ? 'active' : 'locked';

  return [
    { key: 'flashcard', label: '플래시카드', status: fc ? 'done' : 'active' },
    { key: 'quiz', label: '퀴즈', status: quizStatus },
    { key: 'spelling', label: '스펠링', status: spellStatus },
    { key: 'matching', label: '매칭', status: matchStatus },
  ];
}

function isR1Complete(p: VocaStudentProgress | null): boolean {
  if (!p) return false;
  return (
    p.flashcard_completed &&
    (p.quiz_score ?? 0) >= 80 &&
    (p.spelling_score ?? 0) >= 80 &&
    p.matching_completed
  );
}

function getR2Stages(p: VocaStudentProgress | null): VocaStage[] {
  const r1Done = isR1Complete(p);
  const fc2 = p?.round2_flashcard_completed ?? false;
  const quiz2Pass = (p?.round2_quiz_score ?? 0) >= 80;
  const match2Done = p?.round2_matching_completed ?? false;

  if (!r1Done) {
    return [
      { key: 'r2_flashcard', label: '플래시카드', status: 'locked' },
      { key: 'r2_quiz', label: '종합문제', status: 'locked' },
      { key: 'r2_matching', label: '심화매칭', status: 'locked' },
    ];
  }

  const quiz2Status: StageStatus = quiz2Pass ? 'done' : fc2 ? 'active' : 'locked';
  const match2Status: StageStatus = match2Done ? 'done' : quiz2Pass ? 'active' : 'locked';

  return [
    { key: 'r2_flashcard', label: '플래시카드', status: fc2 ? 'done' : 'active' },
    { key: 'r2_quiz', label: '종합문제', status: quiz2Status },
    { key: 'r2_matching', label: '심화매칭', status: match2Status },
  ];
}

function isR2Complete(p: VocaStudentProgress | null): boolean {
  if (!p) return false;
  return (
    p.round2_flashcard_completed &&
    (p.round2_quiz_score ?? 0) >= 80 &&
    p.round2_matching_completed
  );
}

// ── Naesin Helpers (from naesin-dashboard) ──

const NAESIN_STAGE_LABELS: Record<string, string> = {
  vocab: '단어 암기',
  passage: '교과서 암기',
  grammar: '문법 설명',
  problem: '문제풀이',
  lastReview: '직전보강',
};

const NAESIN_STAGE_KEYS = ['vocab', 'passage', 'grammar', 'problem', 'lastReview'] as const;

function mapNaesinStatus(s: NaesinStageStatus): StageStatus | null {
  if (s === 'completed') return 'done';
  if (s === 'available') return 'active';
  if (s === 'hidden') return null;
  return 'locked';
}

function getNaesinStages(statuses: NaesinStageStatuses): NaesinStage[] {
  const stages: NaesinStage[] = [];
  for (const key of NAESIN_STAGE_KEYS) {
    const mapped = mapNaesinStatus(statuses[key]);
    if (mapped === null) continue;
    stages.push({
      key,
      label: NAESIN_STAGE_LABELS[key],
      stageKey: key === 'lastReview' ? 'last-review' : key,
      status: mapped,
    });
  }
  return stages;
}

function isNaesinUnitComplete(statuses: NaesinStageStatuses): boolean {
  return (['vocab', 'passage', 'grammar', 'problem'] as const).every(
    (k) => statuses[k] === 'completed' || statuses[k] === 'hidden',
  );
}

function getDDay(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(dateStr);
  exam.setHours(0, 0, 0, 0);
  return Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Component ──

export function CombinedDashboard({
  userName,
  vocaBooks,
  vocaDays,
  vocaProgressList,
  vocaWordCount,
  textbookName,
  naesinUnits,
  naesinProgressList,
  examAssignments,
  contentMap,
  vocabQuizSetCounts,
  grammarVideoCounts,
  enabledStages,
}: Props) {
  // ── Voca state ──
  const vocaProgressMap = new Map<string, VocaStudentProgress>();
  vocaProgressList.forEach((p) => vocaProgressMap.set(p.day_id, p));

  const sortedDays = [...vocaDays].sort((a, b) => a.sort_order - b.sort_order);
  const currentVocaDay = sortedDays.find((d) => {
    const p = vocaProgressMap.get(d.id) ?? null;
    return !isR1Complete(p) || !isR2Complete(p);
  }) ?? sortedDays[0];

  const currentVocaProgress = currentVocaDay ? (vocaProgressMap.get(currentVocaDay.id) ?? null) : null;
  const r1Stages = currentVocaProgress !== undefined ? getR1Stages(currentVocaProgress) : [];
  const r1Done = isR1Complete(currentVocaProgress);

  const vocaActiveR1 = r1Stages.find((s) => s.status === 'active');
  const r2Stages = currentVocaProgress !== undefined ? getR2Stages(currentVocaProgress) : [];
  const vocaActiveR2 = r2Stages.find((s) => s.status === 'active');
  const vocaCtaStage = vocaActiveR1 ?? vocaActiveR2;

  // Voca stats
  const r1CompletedStages = vocaProgressList.reduce((acc, p) => {
    return acc + (p.flashcard_completed ? 1 : 0)
      + ((p.quiz_score ?? 0) >= 80 ? 1 : 0)
      + ((p.spelling_score ?? 0) >= 80 ? 1 : 0)
      + (p.matching_completed ? 1 : 0);
  }, 0);

  const vocaQuizScores = vocaProgressList
    .filter((p) => p.quiz_score !== null)
    .map((p) => p.quiz_score!);
  const vocaAvgScore = vocaQuizScores.length > 0
    ? Math.round(vocaQuizScores.reduce((a, b) => a + b, 0) / vocaQuizScores.length)
    : 0;

  // ── Naesin state ──
  const naesinProgressMap = new Map<string, NaesinStudentProgress>();
  naesinProgressList.forEach((p) => naesinProgressMap.set(p.unit_id, p));

  const sortedUnits = [...naesinUnits].sort((a, b) => a.sort_order - b.sort_order);

  const statusesMap = new Map<string, NaesinStageStatuses>();
  for (const unit of sortedUnits) {
    const progress = naesinProgressMap.get(unit.id) ?? null;
    const content = contentMap[unit.id] ?? {
      hasVocab: false, hasPassage: false, hasGrammar: false, hasProblem: false, hasLastReview: false,
    };
    const assignment = examAssignments.find((a) => a.unit_ids.includes(unit.id));
    const examDate = assignment?.exam_date ?? null;

    const statuses = calculateStageStatuses({
      progress,
      content,
      vocabQuizSetCount: vocabQuizSetCounts[unit.id] ?? 0,
      grammarVideoCount: grammarVideoCounts[unit.id] ?? 0,
      examDate,
      enabledStages,
    });
    statusesMap.set(unit.id, statuses);
  }

  const currentUnit = sortedUnits.find((u) => {
    const s = statusesMap.get(u.id);
    return s && !isNaesinUnitComplete(s);
  }) ?? sortedUnits[0];

  const currentNaesinStatuses = currentUnit ? statusesMap.get(currentUnit.id) : undefined;
  const currentNaesinStages = currentNaesinStatuses ? getNaesinStages(currentNaesinStatuses) : [];
  const naesinCtaStage = currentNaesinStages.find((s) => s.status === 'active');

  // Naesin stats
  const naesinCompletedStages = sortedUnits.reduce((acc, u) => {
    const s = statusesMap.get(u.id);
    if (!s) return acc;
    return acc
      + (s.vocab === 'completed' ? 1 : 0)
      + (s.passage === 'completed' ? 1 : 0)
      + (s.grammar === 'completed' ? 1 : 0)
      + (s.problem === 'completed' ? 1 : 0);
  }, 0);

  const naesinCompletedUnits = sortedUnits.filter((u) => {
    const s = statusesMap.get(u.id);
    return s && isNaesinUnitComplete(s);
  }).length;

  const naesinVocabScores = naesinProgressList.flatMap((p) => {
    const scores: number[] = [];
    if (p.vocab_quiz_score !== null) scores.push(p.vocab_quiz_score);
    if (p.vocab_spelling_score !== null) scores.push(p.vocab_spelling_score);
    return scores;
  });
  const naesinAvgVocab = naesinVocabScores.length > 0
    ? Math.round(naesinVocabScores.reduce((a, b) => a + b, 0) / naesinVocabScores.length)
    : 0;

  const futureDDays = examAssignments
    .map((a) => getDDay(a.exam_date))
    .filter((d): d is number => d !== null && d >= 0);
  const nearestDDay = futureDDays.length > 0 ? Math.min(...futureDDays) : null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 p-6 text-white">
        <h2 className="text-2xl font-bold">안녕하세요, {userName}님! 👋</h2>
        <p className="mt-1 text-indigo-100">오늘도 영어 학습을 시작해볼까요?</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
            올킬보카
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
            {textbookName}
          </Badge>
          {nearestDDay !== null && (
            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm font-bold">
              {nearestDDay === 0 ? 'D-Day' : `D-${nearestDDay}`}
            </Badge>
          )}
        </div>
      </div>

      {/* Stat Cards — 6 cards, 3-col */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="보카 완료"
          value={r1CompletedStages}
          sub={`전체 ${vocaDays.length * 4}단계 중`}
          color="violet"
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <StatCard
          label="내신 완료"
          value={naesinCompletedStages}
          sub={`전체 ${sortedUnits.length * 4}단계 중`}
          color="teal"
          icon={<Layers className="h-4 w-4" />}
        />
        <StatCard
          label="보카 퀴즈"
          value={vocaAvgScore > 0 ? `${vocaAvgScore}점` : '-'}
          sub="퀴즈 평균"
          color="indigo"
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <StatCard
          label="내신 단원"
          value={`${naesinCompletedUnits}/${sortedUnits.length}`}
          sub="완료 단원"
          color="emerald"
          icon={<BookOpen className="h-4 w-4" />}
        />
        <StatCard
          label="내신 단어"
          value={naesinAvgVocab > 0 ? `${naesinAvgVocab}점` : '-'}
          sub="퀴즈 + 스펠링 평균"
          color="cyan"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <StatCard
          label="시험 D-day"
          value={nearestDDay !== null ? (nearestDDay === 0 ? 'D-Day' : `D-${nearestDDay}`) : '-'}
          sub={nearestDDay !== null ? '가장 가까운 시험' : '시험 일정 없음'}
          color="rose"
          icon={<CalendarDays className="h-4 w-4" />}
        />
      </div>

      {/* Voca Learning Flow */}
      {currentVocaDay && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                📚 올킬보카 — {currentVocaDay.title}
                {!r1Done && <Badge variant="outline" className="text-xs">1회독</Badge>}
                {r1Done && <Badge variant="outline" className="text-xs">2회독</Badge>}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {(r1Done ? r2Stages : r1Stages).map((stage, i) => (
                <div key={stage.key} className="flex items-center gap-2">
                  {i > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <VocaStageChip stage={stage} />
                </div>
              ))}
            </div>
            {vocaCtaStage && (
              <Button asChild className="bg-violet-600 hover:bg-violet-700">
                <Link href={`/student/voca/${currentVocaDay.id}`}>
                  {vocaCtaStage.label} 시작하기 <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Naesin Learning Flow */}
      {currentUnit && currentNaesinStages.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                📖 내신 대비 — {currentUnit.title}
              </CardTitle>
              {(() => {
                const assignment = examAssignments.find((a) => a.unit_ids.includes(currentUnit.id));
                const dday = assignment ? getDDay(assignment.exam_date) : null;
                return dday !== null && dday >= 0 ? (
                  <Badge variant="outline" className="text-xs">
                    {dday === 0 ? 'D-Day' : `D-${dday}`}
                  </Badge>
                ) : null;
              })()}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {currentNaesinStages.map((stage, i) => (
                <div key={stage.key} className="flex items-center gap-2">
                  {i > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <NaesinStageChip stage={stage} />
                </div>
              ))}
            </div>
            {naesinCtaStage && (
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <Link href={`/student/naesin/${currentUnit.id}/${naesinCtaStage.stageKey}`}>
                  {naesinCtaStage.label} 시작하기 <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bottom: Progress (2-col) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Voca Day Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📈 보카 Day 진행률</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedDays.map((day) => {
              const p = vocaProgressMap.get(day.id) ?? null;
              const stagesComplete =
                (p?.flashcard_completed ? 1 : 0) +
                ((p?.quiz_score ?? 0) >= 80 ? 1 : 0) +
                ((p?.spelling_score ?? 0) >= 80 ? 1 : 0) +
                (p?.matching_completed ? 1 : 0);
              const pct = Math.round((stagesComplete / 4) * 100);
              return (
                <div key={day.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium truncate">{day.title}</span>
                    <span className="text-muted-foreground text-xs shrink-0 ml-2">{stagesComplete}/4</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
            {sortedDays.length === 0 && (
              <p className="text-sm text-muted-foreground">등록된 Day가 없습니다.</p>
            )}
          </CardContent>
        </Card>

        {/* Naesin Unit Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" />
              내신 단원 진행률
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedUnits.map((unit) => {
              const s = statusesMap.get(unit.id);
              if (!s) return null;
              const done =
                (s.vocab === 'completed' ? 1 : 0) +
                (s.passage === 'completed' ? 1 : 0) +
                (s.grammar === 'completed' ? 1 : 0) +
                (s.problem === 'completed' ? 1 : 0);
              const pct = Math.round((done / 4) * 100);
              return (
                <div key={unit.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium truncate">{unit.title}</span>
                    <span className="text-muted-foreground text-xs shrink-0 ml-2">{done}/4</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
            {sortedUnits.length === 0 && (
              <p className="text-sm text-muted-foreground">등록된 단원이 없습니다.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Sub-components ──

const colorMap = {
  violet: {
    border: 'border-l-violet-500',
    bg: 'bg-violet-100 dark:bg-violet-950',
    text: 'text-violet-600 dark:text-violet-400',
  },
  teal: {
    border: 'border-l-teal-500',
    bg: 'bg-teal-100 dark:bg-teal-950',
    text: 'text-teal-600 dark:text-teal-400',
  },
  indigo: {
    border: 'border-l-indigo-500',
    bg: 'bg-indigo-100 dark:bg-indigo-950',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  emerald: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-100 dark:bg-emerald-950',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  cyan: {
    border: 'border-l-cyan-500',
    bg: 'bg-cyan-100 dark:bg-cyan-950',
    text: 'text-cyan-600 dark:text-cyan-400',
  },
  rose: {
    border: 'border-l-rose-500',
    bg: 'bg-rose-100 dark:bg-rose-950',
    text: 'text-rose-600 dark:text-rose-400',
  },
} as const;

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: keyof typeof colorMap;
  icon: React.ReactNode;
}) {
  const c = colorMap[color];
  return (
    <Card className={`border-l-4 ${c.border}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </CardTitle>
        <div className={`rounded-full ${c.bg} p-2`}>
          <span className={c.text}>{icon}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function VocaStageChip({ stage }: { stage: VocaStage }) {
  if (stage.status === 'done') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
        <CheckCircle className="h-3.5 w-3.5" />
        {stage.label}
      </span>
    );
  }
  if (stage.status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1.5 text-sm font-medium text-violet-700 ring-2 ring-violet-400 dark:bg-violet-950 dark:text-violet-300">
        <PlayCircle className="h-3.5 w-3.5" />
        {stage.label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground">
      <Lock className="h-3.5 w-3.5" />
      {stage.label}
    </span>
  );
}

function NaesinStageChip({ stage }: { stage: NaesinStage }) {
  if (stage.status === 'done') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
        <CheckCircle className="h-3.5 w-3.5" />
        {stage.label}
      </span>
    );
  }
  if (stage.status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 ring-2 ring-emerald-400 dark:bg-emerald-950 dark:text-emerald-300">
        <PlayCircle className="h-3.5 w-3.5" />
        {stage.label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground">
      <Lock className="h-3.5 w-3.5" />
      {stage.label}
    </span>
  );
}
