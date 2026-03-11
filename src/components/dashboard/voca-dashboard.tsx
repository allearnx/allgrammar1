'use client';

import Link from 'next/link';
import {
  CheckCircle,
  Lock,
  BookOpen,
  ClipboardList,
  Sparkles,
  ArrowLeftRight,
  ArrowRight,
} from 'lucide-react';
import type { VocaBook, VocaDay, VocaStudentProgress } from '@/types/voca';

// ── Types ──

type StageStatus = 'done' | 'active' | 'locked';

interface Stage {
  key: string;
  label: string;
  status: StageStatus;
  tab?: string;
  icon: React.ReactNode;
  description: string;
  score?: number | null;
  scoreLabel?: string;
}

interface Props {
  userName: string;
  books: VocaBook[];
  days: VocaDay[];
  progressList: VocaStudentProgress[];
  wordCount: number;
  wrongWordCounts?: Record<string, number>;
}

// ── Colors ──

const COLORS = {
  header: '#A78BFA',
  bannerBadgeBorder: '#4DD9C0',
  statMint: '#56C9A0',
  statPurple: '#7C3AED',
  statAmber: '#F59E0B',
  statSky: '#06B6D4',
  stepDefault: { bg: '#D9F7FC', border: '#CCFAF4' },
  stepActive: { bg: '#FFFFFF', border: '#7C3AED' },
  stepDone: { bg: '#D9F7FC', border: '#4DD9C0' },
  activeLabel: '#7C3AED',
  ctaButton: '#7C3AED',
  progressDone: '#56C9A0',
  progressActive: '#7C3AED',
  wrongBg: '#FFF0F3',
  wrongBorder3: '#F43F5E',
  wrongBorder2: '#FB7185',
  wrongBorder1: '#FCA5A5',
  wrongBadge: '#FFE4E6',
};

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
    {
      key: 'flashcard', label: '플래시카드', status: fc ? 'done' : 'active', tab: 'flashcard',
      icon: <BookOpen className="h-6 w-6" />, description: '단어 카드를 넘기며 학습',
      scoreLabel: fc ? '완료' : undefined,
    },
    {
      key: 'quiz', label: '퀴즈', status: quizStatus, tab: 'quiz',
      icon: <ClipboardList className="h-6 w-6" />, description: '4지선다 객관식 테스트',
      score: p?.quiz_score, scoreLabel: p?.quiz_score != null ? `${p.quiz_score}점` : undefined,
    },
    {
      key: 'spelling', label: '스펠링', status: spellStatus, tab: 'spelling',
      icon: <Sparkles className="h-6 w-6" />, description: '빈칸에 스펠링 입력',
      score: p?.spelling_score, scoreLabel: p?.spelling_score != null ? `${p.spelling_score}점` : undefined,
    },
    {
      key: 'matching', label: '매칭', status: matchStatus, tab: 'matching',
      icon: <ArrowLeftRight className="h-6 w-6" />, description: '유의어/반의어 매칭',
      score: p?.matching_score, scoreLabel: matchDone ? '완료' : p?.matching_score != null ? `${p.matching_score}점` : undefined,
    },
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
      { key: 'r2_flashcard', label: '플래시카드', status: 'locked', icon: <BookOpen className="h-6 w-6" />, description: '2회독 복습 카드' },
      { key: 'r2_quiz', label: '종합문제', status: 'locked', icon: <ClipboardList className="h-6 w-6" />, description: '종합 퀴즈' },
      { key: 'r2_matching', label: '심화매칭', status: 'locked', icon: <ArrowLeftRight className="h-6 w-6" />, description: '심화 매칭 게임' },
    ];
  }

  const quiz2Status: StageStatus = quiz2Pass ? 'done' : fc2 ? 'active' : 'locked';
  const match2Status: StageStatus = match2Done ? 'done' : quiz2Pass ? 'active' : 'locked';

  return [
    {
      key: 'r2_flashcard', label: '플래시카드', status: fc2 ? 'done' : 'active',
      icon: <BookOpen className="h-6 w-6" />, description: '2회독 복습 카드',
      scoreLabel: fc2 ? '완료' : undefined,
    },
    {
      key: 'r2_quiz', label: '종합문제', status: quiz2Status,
      icon: <ClipboardList className="h-6 w-6" />, description: '종합 퀴즈',
      score: p?.round2_quiz_score, scoreLabel: p?.round2_quiz_score != null ? `${p.round2_quiz_score}점` : undefined,
    },
    {
      key: 'r2_matching', label: '심화매칭', status: match2Status,
      icon: <ArrowLeftRight className="h-6 w-6" />, description: '심화 매칭 게임',
      score: p?.round2_matching_score, scoreLabel: match2Done ? '완료' : p?.round2_matching_score != null ? `${p.round2_matching_score}점` : undefined,
    },
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

export function VocaDashboard({ userName, books, days, progressList, wordCount, wrongWordCounts = {} }: Props) {
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

  // Wrong words: top 10 by count descending
  const wrongWordEntries = Object.entries(wrongWordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Day progress for bottom section
  const daysByBook = new Map<string, { book: VocaBook; days: VocaDay[] }>();
  for (const book of books) {
    daysByBook.set(book.id, { book, days: [] });
  }
  for (const day of sortedDays) {
    daysByBook.get(day.book_id)?.days.push(day);
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ── Header Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white"
        style={{ background: COLORS.header }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-10 -right-10 h-40 w-40 rounded-full"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        />
        <div
          className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        />

        <h2 className="relative text-2xl md:text-3xl font-bold">
          안녕하세요, {userName}님! 👋
        </h2>
        <p className="relative mt-1 text-white/80">오늘도 단어를 정복해볼까요?</p>

        <div className="relative mt-4 flex flex-wrap gap-3">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
            style={{ border: `1.5px solid ${COLORS.bannerBadgeBorder}`, background: 'rgba(255,255,255,0.15)' }}
          >
            학습 단어 {wordCount}개
          </span>
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
            style={{ border: `1.5px solid ${COLORS.bannerBadgeBorder}`, background: 'rgba(255,255,255,0.15)' }}
          >
            완료 단계 {r1CompletedStages}
          </span>
          {currentDay && (
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
              style={{ border: `1.5px solid ${COLORS.bannerBadgeBorder}`, background: 'rgba(255,255,255,0.15)' }}
            >
              현재: {currentDay.title}
            </span>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="완료 단계" value={r1CompletedStages} sub={`전체 ${days.length * 4}단계 중`} color={COLORS.statMint} icon={<CheckCircle className="h-5 w-5" />} />
        <StatCard label="완료 단원" value={completedDays} sub={`전체 ${days.length}단원 중`} color={COLORS.statPurple} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="암기 완료" value={totalMemorized} sub="플래시카드+퀴즈 통과" color={COLORS.statAmber} icon={<Sparkles className="h-5 w-5" />} />
        <StatCard label="평균 점수" value={avgScore > 0 ? `${avgScore}점` : '-'} sub="퀴즈 평균" color={COLORS.statSky} icon={<ClipboardList className="h-5 w-5" />} />
      </div>

      {/* ── Learning Flow: Round 1 ── */}
      {currentDay && (
        <div className="rounded-2xl border bg-white p-5 md:p-6 space-y-5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            📚 학습 흐름 — 1회독
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium" style={{ borderColor: COLORS.stepDone.border }}>
              {currentDay.title}
            </span>
          </h3>

          <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
            {r1Stages.map((stage, i) => (
              <div key={stage.key} className="flex items-center gap-2" style={{ flex: stage.status === 'active' ? 1.35 : 1, minWidth: 0 }}>
                {i > 0 && <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" />}
                <StepCard stage={stage} dayId={currentDay.id} />
              </div>
            ))}
          </div>

          {/* CTA bar */}
          {ctaStage && ctaRound === '1' && (
            <div
              className="flex items-center justify-between rounded-xl px-5 py-3"
              style={{ background: 'linear-gradient(to right, #F5F3FF, #EDE9FE)' }}
            >
              <span className="text-sm font-medium text-gray-700">
                다음 단계: <strong>{ctaStage.label}</strong>
              </span>
              <Link
                href={`/student/voca/${currentDay.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
                style={{ background: COLORS.ctaButton }}
              >
                {ctaStage.label} 시작하기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Learning Flow: Round 2 ── */}
      {currentDay && (
        <div
          className="rounded-2xl border bg-white p-5 md:p-6 space-y-5 transition-opacity"
          style={{ opacity: r1Done ? 1 : 0.55 }}
        >
          <h3 className="text-lg font-bold flex items-center gap-2">
            📗 2회독
            {!r1Done && (
              <span className="text-xs font-normal text-gray-400 ml-1">
                1회독을 완료하면 해금됩니다!
              </span>
            )}
          </h3>

          <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
            {r2Stages.map((stage, i) => (
              <div key={stage.key} className="flex items-center gap-2" style={{ flex: stage.status === 'active' ? 1.35 : 1, minWidth: 0 }}>
                {i > 0 && <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" />}
                <StepCard stage={stage} dayId={currentDay.id} />
              </div>
            ))}
          </div>

          {/* CTA bar for R2 */}
          {ctaStage && ctaRound === '2' && currentDay && (
            <div
              className="flex items-center justify-between rounded-xl px-5 py-3"
              style={{ background: 'linear-gradient(to right, #F5F3FF, #EDE9FE)' }}
            >
              <span className="text-sm font-medium text-gray-700">
                다음 단계: <strong>{ctaStage.label}</strong>
              </span>
              <Link
                href={`/student/voca/${currentDay.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
                style={{ background: COLORS.ctaButton }}
              >
                {ctaStage.label} 시작하기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom: Wrong Words + Day Progress ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Wrong Words */}
        <div className="rounded-2xl p-5 md:p-6" style={{ background: COLORS.wrongBg }}>
          <h3 className="text-base font-bold mb-4">📝 틀린 단어 복습</h3>
          {wrongWordEntries.length > 0 ? (
            <div className="space-y-2">
              {wrongWordEntries.map(([word, count]) => {
                const borderColor = count >= 3 ? COLORS.wrongBorder3 : count === 2 ? COLORS.wrongBorder2 : COLORS.wrongBorder1;
                return (
                  <div
                    key={word}
                    className="flex items-center justify-between rounded-lg bg-white px-3 py-2"
                    style={{ borderLeft: `3px solid ${borderColor}` }}
                  >
                    <span className="text-sm font-medium text-gray-800">{word}</span>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-rose-700"
                      style={{ background: COLORS.wrongBadge }}
                    >
                      {count}회
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">틀린 단어가 없습니다! 대단해요! 🎉</p>
          )}
        </div>

        {/* Day Progress */}
        <div className="rounded-2xl border bg-white p-5 md:p-6">
          <h3 className="text-base font-bold mb-4">📈 단원 진행률</h3>
          <div className="space-y-3">
            {sortedDays.map((day) => {
              const p = progressMap.get(day.id) ?? null;
              const stagesComplete =
                (p?.flashcard_completed ? 1 : 0) +
                ((p?.quiz_score ?? 0) >= 80 ? 1 : 0) +
                ((p?.spelling_score ?? 0) >= 80 ? 1 : 0) +
                (p?.matching_completed ? 1 : 0);
              const pct = Math.round((stagesComplete / 4) * 100);
              const isDone = isR1Complete(p);
              const isActive = currentDay?.id === day.id;

              return (
                <div key={day.id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium truncate">{day.title}</span>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">{stagesComplete}/4</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: isDone
                          ? `linear-gradient(to right, ${COLORS.progressDone}, #4DD9C0)`
                          : isActive
                            ? COLORS.progressActive
                            : '#D1D5DB',
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {sortedDays.length === 0 && (
              <p className="text-sm text-gray-500">등록된 Day가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

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
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border bg-white p-4"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

function StepCard({ stage, dayId }: { stage: Stage; dayId: string }) {
  const isDone = stage.status === 'done';
  const isActive = stage.status === 'active';
  const isLocked = stage.status === 'locked';

  const style = isDone
    ? COLORS.stepDone
    : isActive
      ? COLORS.stepActive
      : COLORS.stepDefault;

  const content = (
    <div
      className={`relative flex flex-col items-center text-center rounded-xl p-4 transition-all w-full ${
        isActive ? 'shadow-lg' : ''
      }`}
      style={{
        background: style.bg,
        border: `2px solid ${style.border}`,
      }}
    >
      {/* Active label */}
      {isActive && (
        <span
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white whitespace-nowrap"
          style={{ background: COLORS.activeLabel }}
        >
          지금 여기!
        </span>
      )}

      {/* Done check overlay */}
      {isDone && (
        <div className="absolute top-1.5 right-1.5">
          <CheckCircle className="h-4 w-4" style={{ color: COLORS.stepDone.border }} />
        </div>
      )}

      {/* Lock overlay */}
      {isLocked && (
        <div className="absolute top-1.5 right-1.5">
          <Lock className="h-4 w-4 text-gray-400" />
        </div>
      )}

      {/* Icon */}
      <div className={`mb-2 ${isLocked ? 'text-gray-400' : isDone ? 'text-emerald-600' : ''}`} style={isActive ? { color: COLORS.activeLabel } : undefined}>
        {stage.icon}
      </div>

      {/* Label */}
      <span className={`text-sm font-semibold ${isLocked ? 'text-gray-400' : ''}`} style={isActive ? { color: COLORS.activeLabel } : undefined}>
        {stage.label}
      </span>

      {/* Description */}
      <span className={`text-[11px] mt-0.5 ${isLocked ? 'text-gray-300' : 'text-gray-500'}`}>
        {stage.description}
      </span>

      {/* Score badge */}
      {stage.scoreLabel && (
        <span
          className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'
          }`}
        >
          {stage.scoreLabel}
        </span>
      )}
    </div>
  );

  // Make clickable if not locked
  if (!isLocked && dayId) {
    return (
      <Link href={`/student/voca/${dayId}`} className="w-full block">
        {content}
      </Link>
    );
  }

  return <div className="w-full">{content}</div>;
}
