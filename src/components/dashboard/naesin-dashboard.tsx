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
} from 'lucide-react';
import { calculateStageStatuses } from '@/lib/naesin/stage-unlock';
import type {
  NaesinUnit,
  NaesinStudentProgress,
  NaesinStageStatus,
  NaesinStageStatuses,
  NaesinContentAvailability,
  NaesinExamAssignment,
} from '@/types/naesin';

// ── Types ──

interface Stage {
  key: string;
  label: string;
  stageKey: string; // URL path segment
  status: 'done' | 'active' | 'locked';
}

interface Props {
  userName: string;
  textbookName: string;
  units: NaesinUnit[];
  progressList: NaesinStudentProgress[];
  examAssignments: NaesinExamAssignment[];
  contentMap: Record<string, NaesinContentAvailability>;
  vocabQuizSetCounts: Record<string, number>;
  grammarVideoCounts: Record<string, number>;
  enabledStages?: string[];
}

// ── Helpers ──

const STAGE_LABELS: Record<string, string> = {
  vocab: '단어 암기',
  passage: '교과서 암기',
  grammar: '문법 설명',
  problem: '문제풀이',
  lastReview: '직전보강',
};

const STAGE_KEYS = ['vocab', 'passage', 'grammar', 'problem', 'lastReview'] as const;

function mapStageStatus(s: NaesinStageStatus): 'done' | 'active' | 'locked' | null {
  if (s === 'completed') return 'done';
  if (s === 'available') return 'active';
  if (s === 'hidden') return null;
  return 'locked';
}

function getStagesForUnit(
  statuses: NaesinStageStatuses,
): Stage[] {
  const stages: Stage[] = [];
  for (const key of STAGE_KEYS) {
    const mapped = mapStageStatus(statuses[key]);
    if (mapped === null) continue; // hidden
    stages.push({
      key,
      label: STAGE_LABELS[key],
      stageKey: key === 'lastReview' ? 'last-review' : key,
      status: mapped,
    });
  }
  return stages;
}

function isUnitComplete(statuses: NaesinStageStatuses): boolean {
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

export function NaesinDashboard({
  userName,
  textbookName,
  units,
  progressList,
  examAssignments,
  contentMap,
  vocabQuizSetCounts,
  grammarVideoCounts,
  enabledStages,
}: Props) {
  const progressMap = new Map<string, NaesinStudentProgress>();
  progressList.forEach((p) => progressMap.set(p.unit_id, p));

  const sortedUnits = [...units].sort((a, b) => a.sort_order - b.sort_order);

  // Calculate stage statuses per unit
  const statusesMap = new Map<string, NaesinStageStatuses>();
  for (const unit of sortedUnits) {
    const progress = progressMap.get(unit.id) ?? null;
    const content = contentMap[unit.id] ?? {
      hasVocab: false, hasPassage: false, hasGrammar: false, hasProblem: false, hasLastReview: false,
    };

    // Find exam date for this unit
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

  // Find current active unit (first incomplete)
  const currentUnit = sortedUnits.find((u) => {
    const s = statusesMap.get(u.id);
    return s && !isUnitComplete(s);
  }) ?? sortedUnits[0];

  const currentStatuses = currentUnit ? statusesMap.get(currentUnit.id) : undefined;
  const currentStages = currentStatuses ? getStagesForUnit(currentStatuses) : [];

  // CTA: first active stage
  const ctaStage = currentStages.find((s) => s.status === 'active');

  // ── Stats ──

  // 1. Completed stages (vocab + passage + grammar + problem only)
  const completedStages = sortedUnits.reduce((acc, u) => {
    const s = statusesMap.get(u.id);
    if (!s) return acc;
    return acc
      + (s.vocab === 'completed' ? 1 : 0)
      + (s.passage === 'completed' ? 1 : 0)
      + (s.grammar === 'completed' ? 1 : 0)
      + (s.problem === 'completed' ? 1 : 0);
  }, 0);

  // 2. Fully completed units
  const completedUnits = sortedUnits.filter((u) => {
    const s = statusesMap.get(u.id);
    return s && isUnitComplete(s);
  }).length;

  // 3. Vocab average score
  const vocabScores = progressList.flatMap((p) => {
    const scores: number[] = [];
    if (p.vocab_quiz_score !== null) scores.push(p.vocab_quiz_score);
    if (p.vocab_spelling_score !== null) scores.push(p.vocab_spelling_score);
    return scores;
  });
  const avgVocabScore = vocabScores.length > 0
    ? Math.round(vocabScores.reduce((a, b) => a + b, 0) / vocabScores.length)
    : 0;

  // 4. Nearest exam D-day
  const futureDDays = examAssignments
    .map((a) => getDDay(a.exam_date))
    .filter((d): d is number => d !== null && d >= 0);
  const nearestDDay = futureDDays.length > 0 ? Math.min(...futureDDays) : null;

  // Current unit D-day
  const currentAssignment = currentUnit
    ? examAssignments.find((a) => a.unit_ids.includes(currentUnit.id))
    : undefined;
  const currentDDay = currentAssignment ? getDDay(currentAssignment.exam_date) : null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 p-6 text-white">
        <h2 className="text-2xl font-bold">안녕하세요, {userName}님! 👋</h2>
        <p className="mt-1 text-violet-100">내신 시험을 완벽하게 준비해볼까요?</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
            {textbookName}
          </Badge>
          {currentUnit && (
            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
              현재: {currentUnit.title}
            </Badge>
          )}
          {currentDDay !== null && currentDDay >= 0 && (
            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm font-bold">
              {currentDDay === 0 ? 'D-Day' : `D-${currentDDay}`}
            </Badge>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="완료 단계"
          value={completedStages}
          sub={`전체 ${sortedUnits.length * 4}단계 중`}
          color="violet"
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <StatCard
          label="완료 단원"
          value={completedUnits}
          sub={`전체 ${sortedUnits.length}단원 중`}
          color="indigo"
          icon={<BookOpen className="h-4 w-4" />}
        />
        <StatCard
          label="단어 평균"
          value={avgVocabScore > 0 ? `${avgVocabScore}점` : '-'}
          sub="퀴즈 + 스펠링 평균"
          color="pink"
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <StatCard
          label="시험 D-day"
          value={nearestDDay !== null ? (nearestDDay === 0 ? 'D-Day' : `D-${nearestDDay}`) : '-'}
          sub={nearestDDay !== null ? '가장 가까운 시험' : '시험 일정 없음'}
          color="orange"
          icon={<CalendarDays className="h-4 w-4" />}
        />
      </div>

      {/* Learning Flow: Current Unit */}
      {currentUnit && currentStages.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                📚 학습 흐름 — {currentUnit.title}
              </CardTitle>
              {currentDDay !== null && currentDDay >= 0 && (
                <Badge variant="outline" className="text-xs">
                  {currentDDay === 0 ? 'D-Day' : `D-${currentDDay}`}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {currentStages.map((stage, i) => (
                <div key={stage.key} className="flex items-center gap-2">
                  {i > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <StageChip stage={stage} />
                </div>
              ))}
            </div>
            {ctaStage && currentUnit && (
              <Button asChild className="bg-violet-600 hover:bg-violet-700">
                <Link href={`/student/naesin/${currentUnit.id}/${ctaStage.stageKey}`}>
                  {ctaStage.label} 시작하기 <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bottom: Unit Progress + Exam Scope */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Unit Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" />
              단원 진행률
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

        {/* Exam Scope */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              시험 범위
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {examAssignments.length > 0 ? (
              examAssignments
                .sort((a, b) => a.exam_round - b.exam_round)
                .map((ea) => {
                  const dday = getDDay(ea.exam_date);
                  const unitTitles = ea.unit_ids
                    .map((uid) => units.find((u) => u.id === uid)?.title)
                    .filter(Boolean);
                  return (
                    <div key={ea.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {ea.exam_label || `${ea.exam_round}차 시험`}
                        </span>
                        {dday !== null && dday >= 0 && (
                          <Badge variant={dday <= 7 ? 'destructive' : 'secondary'} className="text-xs">
                            {dday === 0 ? 'D-Day' : `D-${dday}`}
                          </Badge>
                        )}
                        {ea.exam_date && dday !== null && dday < 0 && (
                          <Badge variant="outline" className="text-xs">완료</Badge>
                        )}
                      </div>
                      {ea.exam_date && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {new Date(ea.exam_date).toLocaleDateString('ko-KR')}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {unitTitles.map((title, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-sm text-muted-foreground">등록된 시험 범위가 없습니다.</p>
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
  indigo: {
    border: 'border-l-indigo-500',
    bg: 'bg-indigo-100 dark:bg-indigo-950',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  pink: {
    border: 'border-l-pink-500',
    bg: 'bg-pink-100 dark:bg-pink-950',
    text: 'text-pink-600 dark:text-pink-400',
  },
  orange: {
    border: 'border-l-orange-500',
    bg: 'bg-orange-100 dark:bg-orange-950',
    text: 'text-orange-600 dark:text-orange-400',
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

function StageChip({ stage }: { stage: Stage }) {
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
