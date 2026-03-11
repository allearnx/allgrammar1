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
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { VocaBook, VocaDay, VocaStudentProgress } from '@/types/voca';

// ── Types ──

type StageStatus = 'done' | 'active' | 'locked';

interface Stage {
  key: string;
  label: string;
  status: StageStatus;
  tab?: string; // URL tab param (not used yet, but for CTA link)
}

interface Props {
  userName: string;
  books: VocaBook[];
  days: VocaDay[];
  progressList: VocaStudentProgress[];
  wordCount: number;
}

// ── Helpers ──

function getR1Stages(p: VocaStudentProgress | null): Stage[] {
  const fc = p?.flashcard_completed ?? false;
  const quizPass = (p?.quiz_score ?? 0) >= 80;
  const spellPass = (p?.spelling_score ?? 0) >= 80;
  const matchDone = p?.matching_completed ?? false;

  const quizStatus: StageStatus = quizPass ? 'done' : fc ? 'active' : 'locked';
  const spellStatus: StageStatus = spellPass ? 'done' : quizPass ? 'active' : 'locked';
  const matchStatus: StageStatus = matchDone ? 'done' : spellPass ? 'active' : 'locked';

  return [
    { key: 'flashcard', label: '플래시카드', status: fc ? 'done' : 'active', tab: 'flashcard' },
    { key: 'quiz', label: '퀴즈', status: quizStatus, tab: 'quiz' },
    { key: 'spelling', label: '스펠링', status: spellStatus, tab: 'spelling' },
    { key: 'matching', label: '매칭', status: matchStatus, tab: 'matching' },
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

function getR2Stages(p: VocaStudentProgress | null): Stage[] {
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

// ── Component ──

export function VocaDashboard({ userName, books, days, progressList, wordCount }: Props) {
  const progressMap = new Map<string, VocaStudentProgress>();
  progressList.forEach((p) => progressMap.set(p.day_id, p));

  // Find current active day (first incomplete)
  const sortedDays = [...days].sort((a, b) => a.sort_order - b.sort_order);
  const currentDay = sortedDays.find((d) => {
    const p = progressMap.get(d.id) ?? null;
    return !isR1Complete(p) || !isR2Complete(p);
  }) ?? sortedDays[0];

  const currentProgress = currentDay ? (progressMap.get(currentDay.id) ?? null) : null;

  // Stats
  const r1CompletedStages = progressList.reduce((acc, p) => {
    return acc + (p.flashcard_completed ? 1 : 0)
      + ((p.quiz_score ?? 0) >= 80 ? 1 : 0)
      + ((p.spelling_score ?? 0) >= 80 ? 1 : 0)
      + (p.matching_completed ? 1 : 0);
  }, 0);

  const completedDays = progressList.filter((p) => isR1Complete(p)).length;

  const quizScores = progressList
    .filter((p) => p.quiz_score !== null)
    .map((p) => p.quiz_score!);
  const avgScore = quizScores.length > 0
    ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
    : 0;

  const totalMemorized = progressList.filter(
    (p) => p.flashcard_completed && (p.quiz_score ?? 0) >= 80
  ).length;

  // Current day stages
  const r1Stages = getR1Stages(currentProgress);
  const r2Stages = getR2Stages(currentProgress);
  const r1Done = isR1Complete(currentProgress);

  // Find CTA: first active stage
  const activeR1 = r1Stages.find((s) => s.status === 'active');
  const activeR2 = r2Stages.find((s) => s.status === 'active');
  const ctaStage = activeR1 ?? activeR2;
  const ctaRound = activeR1 ? '1' : '2';

  // Day progress for bottom section (grouped by book)
  const daysByBook = new Map<string, { book: VocaBook; days: VocaDay[] }>();
  for (const book of books) {
    daysByBook.set(book.id, { book, days: [] });
  }
  for (const day of sortedDays) {
    daysByBook.get(day.book_id)?.days.push(day);
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 p-6 text-white">
        <h2 className="text-2xl font-bold">안녕하세요, {userName}님! 👋</h2>
        <p className="mt-1 text-violet-100">오늘도 단어를 정복해볼까요?</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
            오늘 학습 단어 {wordCount}개
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
            완료 단계 {r1CompletedStages}
          </Badge>
          {currentDay && (
            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
              현재: {currentDay.title}
            </Badge>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="완료 단계"
          value={r1CompletedStages}
          sub={`전체 ${days.length * 4}단계 중`}
          color="violet"
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <StatCard
          label="완료 단원"
          value={completedDays}
          sub={`전체 ${days.length}단원 중`}
          color="indigo"
          icon={<BookOpen className="h-4 w-4" />}
        />
        <StatCard
          label="암기 완료"
          value={totalMemorized}
          sub={`플래시카드+퀴즈 통과`}
          color="pink"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <StatCard
          label="평균 점수"
          value={avgScore > 0 ? `${avgScore}점` : '-'}
          sub="퀴즈 평균"
          color="orange"
          icon={<ClipboardList className="h-4 w-4" />}
        />
      </div>

      {/* Learning Flow: Round 1 */}
      {currentDay && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                📚 학습 흐름 — 1회독
                <Badge variant="outline" className="text-xs">{currentDay.title}</Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {r1Stages.map((stage, i) => (
                <div key={stage.key} className="flex items-center gap-2">
                  {i > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <StageChip stage={stage} />
                </div>
              ))}
            </div>
            {ctaStage && ctaRound === '1' && (
              <Button asChild className="bg-violet-600 hover:bg-violet-700">
                <Link href={`/student/voca/${currentDay.id}`}>
                  {ctaStage.label} 시작하기 <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Learning Flow: Round 2 */}
      {currentDay && (
        <Card className={!r1Done ? 'opacity-60' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              📗 2회독
              {!r1Done && <Badge variant="secondary" className="text-xs">1회독 완료 시 해금</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {r2Stages.map((stage, i) => (
                <div key={stage.key} className="flex items-center gap-2">
                  {i > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <StageChip stage={stage} />
                </div>
              ))}
            </div>
            {ctaStage && ctaRound === '2' && currentDay && (
              <Button asChild className="bg-violet-600 hover:bg-violet-700">
                <Link href={`/student/voca/${currentDay.id}`}>
                  {ctaStage.label} 시작하기 <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bottom: Day Progress + Book List */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Day Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📈 단원 진행률</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedDays.map((day) => {
              const p = progressMap.get(day.id) ?? null;
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

        {/* Book List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📖 올킬보카</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[...daysByBook.values()].map(({ book, days: bookDays }) => (
              <div key={book.id}>
                <p className="text-sm font-medium text-muted-foreground mb-1">{book.title}</p>
                <div className="grid gap-1.5">
                  {bookDays.map((day) => {
                    const p = progressMap.get(day.id) ?? null;
                    const done = isR1Complete(p);
                    return (
                      <Link
                        key={day.id}
                        href={`/student/voca/${day.id}`}
                        className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <span>{day.title}</span>
                        {done ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : p ? (
                          <PlayCircle className="h-4 w-4 text-violet-500" />
                        ) : (
                          <span className="text-xs text-muted-foreground">미시작</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            {books.length === 0 && (
              <p className="text-sm text-muted-foreground">등록된 교재가 없습니다.</p>
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
