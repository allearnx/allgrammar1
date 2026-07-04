'use client';

import Link from 'next/link';
import {
  CheckCircle,
  BookOpen,
  BookMarked,
  ClipboardList,
  Sparkles,
  TrendingUp,
  XCircle,
  Repeat,
} from 'lucide-react';
import { BRAND } from '@/lib/utils/brand-colors';
import {
  getR1Stages,
  getR2Stages,
  isR1Complete,
  isR2Complete,
  computeVocaStats,
} from '@/lib/dashboard/voca-helpers';
import { MiniScoreTrend } from '@/components/charts/mini-score-trend';
import { FlowStep } from './combined/flow-step';
import { FlowCta } from './combined/flow-cta';
import { StatCard } from '@/components/shared/stat-card';
import type { VocaBook, VocaDay, VocaStudentProgress } from '@/types/voca';

// ── Types ──

interface Props {
  userName: string;
  books: VocaBook[];
  days: VocaDay[];
  progressList: VocaStudentProgress[];
  wordCount: number;
  wrongWordCounts?: Record<string, number>;
  quizHistory?: { date: string; score: number }[];
  submissionStatuses?: Record<string, string>;
}

// ── Colors ──

const COLORS = {
  header: BRAND.violetLight,
  bannerBadgeBorder: BRAND.teal,
  statMint: BRAND.mint,
  statPurple: BRAND.violet,
  statAmber: BRAND.amber,
  statSky: BRAND.cyan,
  green: BRAND.green,
  progressDone: BRAND.progress.done,
  progressActive: BRAND.progress.active,
  wrongBg: BRAND.wrong.bg,
  wrongBorder3: BRAND.wrong.border3,
  wrongBorder2: BRAND.wrong.border2,
  wrongBorder1: BRAND.wrong.border1,
  wrongBadge: BRAND.wrong.badge,
};

// ── Component ──

export function VocaDashboard({ userName, books, days, progressList, wordCount, wrongWordCounts = {}, quizHistory = [], submissionStatuses = {} }: Props) {
  const progressMap = new Map<string, VocaStudentProgress>();
  progressList.forEach((p) => progressMap.set(p.day_id, p));

  const sortedDays = [...days].sort((a, b) => a.sort_order - b.sort_order);

  // 책 단위 회독 판단
  const bookR1Complete = sortedDays.length > 0 && sortedDays.every((d) => isR1Complete(progressMap.get(d.id) ?? null));
  const bookRound: '1' | '2' = bookR1Complete ? '2' : '1';

  const currentDay = sortedDays.find((d) => {
    const p = progressMap.get(d.id) ?? null;
    if (bookRound === '2') return !isR2Complete(p);
    return !isR1Complete(p);
  }) ?? sortedDays[0];

  const currentProgress = currentDay ? (progressMap.get(currentDay.id) ?? null) : null;

  // Stats
  const { r1CompletedStages, avgQuizScore: avgScore, wrongWordEntries } = computeVocaStats(progressList, wrongWordCounts);

  const completedDays = progressList.filter((p) => isR1Complete(p)).length;

  const totalMemorized = progressList.filter(
    (p) => p.flashcard_completed && (p.quiz_score ?? 0) >= 80
  ).length;

  // Current day stages
  const r1Stages = getR1Stages(currentProgress);
  const r2Stages = bookR1Complete ? getR2Stages(currentProgress) : getR2Stages(null);
  const r1AllDone = r1Stages.every((s) => s.status === 'done');
  const r2AllDone = r2Stages.every((s) => s.status === 'done');

  const activeR1 = r1Stages.find((s) => s.status === 'active');
  const activeR2 = r2Stages.find((s) => s.status === 'active');
  const ctaStage = bookRound === '1' ? activeR1 : activeR2;
  const ctaRound = bookRound;

  const daysByBook = new Map<string, { book: VocaBook; days: VocaDay[] }>();
  for (const book of books) {
    daysByBook.set(book.id, { book, days: [] });
  }
  for (const day of sortedDays) {
    daysByBook.get(day.book_id)?.days.push(day);
  }

  // 지금 공부 중인 교재 — 현재 Day가 속한 교재 (스코프된 경우 books[0])
  const currentBook = books.find((b) => b.id === currentDay?.book_id) ?? books[0];

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* ── Header Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white"
        style={{ background: COLORS.header }}
      >
        {currentBook && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-bold text-white">
              <BookOpen className="h-3.5 w-3.5" /> {currentBook.title}
            </span>
            <Link
              href="/student/voca"
              className="inline-flex items-center gap-1 rounded-full border border-white/40 px-3 py-1 text-xs font-semibold text-white/90 transition-colors hover:bg-white/15"
            >
              <Repeat className="h-3 w-3" /> 교재 변경
            </Link>
          </div>
        )}
        <h2 className="text-2xl md:text-3xl font-bold">안녕하세요, {userName}님!</h2>
        <p className="mt-1 text-white/80">오늘도 단어를 정복해볼까요?</p>

        <div className="mt-4 flex flex-wrap gap-3">
          {[`학습 단어 ${wordCount}개`, `완료 단계 ${r1CompletedStages}`, currentDay ? `현재: ${currentDay.title}` : ''].filter(Boolean).map((text) => (
            <span key={text} className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold text-gray-800" style={{ background: 'white' }}>
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard label="완료 단계" value={r1CompletedStages} sub={`전체 ${days.length * 4}단계 중`} color={COLORS.statMint} icon={<CheckCircle className="h-5 w-5" />} />
        <StatCard label="완료 단원" value={completedDays} sub={`전체 ${days.length}단원 중`} color={COLORS.statPurple} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="암기 완료" value={totalMemorized} sub="플래시카드+퀴즈 통과" color={COLORS.statAmber} icon={<Sparkles className="h-5 w-5" />} />
        <StatCard label="평균 점수" value={avgScore > 0 ? `${avgScore}점` : '-'} sub="퀴즈 평균" color={COLORS.statSky} icon={<ClipboardList className="h-5 w-5" />} />
      </div>

      {/* ── Mini Chart + Report Link ── */}
      <div className="rounded-2xl border bg-white p-5 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">퀴즈 점수 추이</h3>
        </div>
        <MiniScoreTrend data={quizHistory} color="#7C3AED" height={64} />
      </div>

      {/* ── Flow Card: Round 1 ── */}
      {currentDay && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-base font-bold flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> 1회독 — {currentDay.title}</div>
              <div className="text-sm text-gray-400 mt-0.5">플래시카드 → 퀴즈 → 스펠링 → 매칭 4단계를 통과하세요</div>
            </div>
            <span className="shrink-0 rounded-full px-3.5 py-1 text-xs font-bold" style={{ background: r1AllDone ? '#DCFCE7' : '#F5F3FF', color: r1AllDone ? COLORS.green : '#7C3AED' }}>
              {r1AllDone ? '완료 ✓' : '진행 중'}
            </span>
          </div>

          {/* Steps */}
          <div className="flex items-stretch gap-0 mb-5 overflow-visible">
            {r1Stages.map((stage, i) => (
              <div key={stage.key} className="contents">
                {i > 0 && <div className="flex items-center justify-center self-center px-1 md:px-1.5 text-gray-300 text-sm shrink-0">→</div>}
                <FlowStep stage={stage} dayId={currentDay.id} linkPrefix="/student/voca/" />
              </div>
            ))}
          </div>

          {/* CTA */}
          {ctaStage && ctaRound === '1' && (
            <FlowCta stage={ctaStage} dayId={currentDay.id} dayTitle={currentDay.title} />
          )}
        </div>
      )}

      {/* ── Flow Card: Round 2 ── */}
      {currentDay && (
        <div className={`rounded-2xl border border-gray-200 bg-white p-5 md:p-7 ${!bookR1Complete ? 'opacity-55' : ''}`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-base font-bold flex items-center gap-1.5"><BookMarked className="h-4 w-4" /> 2회독 — 유의어 · 반의어 · 숙어</div>
              <div className="text-sm text-gray-400 mt-0.5">
                {bookR1Complete ? '3단계를 모두 통과해야 2회독이 완료됩니다' : `모든 Day의 1회독을 마치면 시작돼요 (${completedDays}/${sortedDays.length})`}
              </div>
            </div>
            <span className="shrink-0 rounded-full px-3.5 py-1 text-xs font-bold" style={{
              background: r2AllDone ? '#DCFCE7' : !bookR1Complete ? '#F3F4F6' : '#F5F3FF',
              color: r2AllDone ? COLORS.green : !bookR1Complete ? '#9CA3AF' : '#7C3AED',
            }}>
              {r2AllDone ? '완료 ✓' : !bookR1Complete ? '잠김' : '진행 중'}
            </span>
          </div>

          {/* Steps */}
          <div className="flex items-stretch gap-0 mb-5 overflow-visible">
            {r2Stages.map((stage, i) => (
              <div key={stage.key} className="contents">
                {i > 0 && <div className="flex items-center justify-center self-center px-1 md:px-1.5 text-gray-300 text-sm shrink-0">→</div>}
                <FlowStep stage={stage} dayId={currentDay.id} linkPrefix="/student/voca/" />
              </div>
            ))}
          </div>

          {/* CTA */}
          {ctaStage && ctaRound === '2' && (
            <FlowCta stage={ctaStage} dayId={currentDay.id} dayTitle={currentDay.title} />
          )}
        </div>
      )}

      {/* ── Bottom: Wrong Words + Day Progress ── */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Wrong Words */}
        <div className="rounded-2xl p-5 md:p-6" style={{ background: COLORS.wrongBg }}>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5"><XCircle className="h-4 w-4 text-rose-500" /> 틀린 단어 복습</h3>
          {wrongWordEntries.length > 0 ? (
            <div className="space-y-2">
              {wrongWordEntries.map(([word, count]) => {
                const borderColor = count >= 3 ? COLORS.wrongBorder3 : count === 2 ? COLORS.wrongBorder2 : COLORS.wrongBorder1;
                return (
                  <div key={word} className="flex items-center justify-between rounded-lg bg-white px-3 py-2" style={{ borderLeft: `3px solid ${borderColor}` }}>
                    <span className="text-sm font-medium text-gray-800">{word}</span>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-rose-700" style={{ background: COLORS.wrongBadge }}>
                      {count}회 오답
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">틀린 단어가 없습니다! 대단해요!</p>
          )}
        </div>

        {/* Day Progress */}
        <div className="rounded-2xl border bg-white p-5 md:p-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> 이번 단원 진행률</h3>
          <div className="space-y-3">
            {sortedDays.map((day) => {
              const p = progressMap.get(day.id) ?? null;
              const r1Steps =
                (p?.flashcard_completed ? 1 : 0) +
                ((p?.quiz_score ?? 0) >= 80 ? 1 : 0) +
                ((p?.spelling_score ?? 0) >= 80 ? 1 : 0) +
                (p?.matching_completed ? 1 : 0);
              const r2Steps =
                (p?.round2_flashcard_completed ? 1 : 0) +
                ((p?.round2_quiz_score ?? 0) >= 80 ? 1 : 0) +
                (p?.round2_matching_completed ? 1 : 0);
              const totalSteps = bookRound === '2' ? 3 : 4;
              const stepsNow = bookRound === '2' ? r2Steps : r1Steps;
              const pct = Math.round((stepsNow / totalSteps) * 100);
              const isDone = bookRound === '2' ? isR2Complete(p) : isR1Complete(p);
              const isActive = currentDay?.id === day.id;

              return (
                <div key={day.id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium truncate">{day.title}</span>
                    <span className="flex items-center gap-1.5 shrink-0 ml-2">
                      {submissionStatuses[day.id] && !p?.matching_completed && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${submissionStatuses[day.id] === 'reviewed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {submissionStatuses[day.id] === 'reviewed' ? '확인됨' : '제출함'}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: isDone ? COLORS.green : isActive ? '#7C3AED' : stepsNow > 0 ? '#6B7280' : '#9CA3AF', fontWeight: isDone || isActive ? 700 : 400 }}>
                        {isDone ? '100%' : isActive ? '진행 중' : stepsNow > 0 ? `${pct}%` : '—'}
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${pct}%`,
                      background: isDone ? `linear-gradient(to right, ${COLORS.progressDone}, #4DD9C0)` : stepsNow > 0 ? COLORS.progressActive : '#E5E7EB',
                    }} />
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
