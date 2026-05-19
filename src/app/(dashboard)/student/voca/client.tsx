'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Lock, ChevronRight, BookOpen, BookMarked } from 'lucide-react';
import { PetWidget } from '@/components/voca/pet/pet-widget';
import { isR1Complete, isR2Complete } from '@/lib/dashboard/voca-helpers';
import type { VocaBook, VocaDay, VocaStudentProgress } from '@/types/voca';

type RoundMode = 'book' | 'day';

interface VocaHomeClientProps {
  books: VocaBook[];
  days: VocaDay[];
  progressList: VocaStudentProgress[];
  submissionStatuses?: Record<string, string>;
  initialBookId?: string;
  freeDayLimit?: number;
  round2Locked?: boolean;
  roundMode?: RoundMode;
}

const BOOK_COLORS = [
  { bg: '#546478', light: 'rgba(84,100,120,0.06)', border: 'rgba(84,100,120,0.15)' },
  { bg: '#4872a3', light: 'rgba(72,114,163,0.06)', border: 'rgba(72,114,163,0.15)' },
  { bg: '#7a6a82', light: 'rgba(122,106,130,0.06)', border: 'rgba(122,106,130,0.15)' },
  { bg: '#587650', light: 'rgba(88,118,80,0.06)', border: 'rgba(88,118,80,0.15)' },
  { bg: '#8a7362', light: 'rgba(138,115,98,0.06)', border: 'rgba(138,115,98,0.15)' },
];

function getStepsDone(prog: VocaStudentProgress | undefined): number {
  if (!prog) return 0;
  let done = 0;
  if (prog.flashcard_completed) done++;
  if ((prog.quiz_score ?? 0) >= 80) done++;
  if ((prog.spelling_score ?? 0) >= 80) done++;
  if (prog.matching_completed) done++;
  return done;
}

function getRound2StepsDone(prog: VocaStudentProgress | undefined): number {
  if (!prog) return 0;
  let done = 0;
  if (prog.round2_flashcard_completed) done++;
  if ((prog.round2_quiz_score ?? 0) >= 80) done++;
  if (prog.round2_matching_completed) done++;
  return done;
}

export function VocaHomeClient({ books, days, progressList, submissionStatuses = {}, initialBookId, freeDayLimit = 0, round2Locked = false, roundMode: initialRoundMode = 'book' }: VocaHomeClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [roundMode, setRoundMode] = useState<RoundMode>(initialRoundMode);
  const [showModeSelector, setShowModeSelector] = useState(false);

  const defaultBookId = (initialBookId && books.some((b) => b.id === initialBookId))
    ? initialBookId
    : books[0]?.id || '';
  const [selectedBookId, setSelectedBookId] = useState<string>(defaultBookId);
  const selectedIndex = Math.max(0, books.findIndex((b) => b.id === selectedBookId));
  const bookColor = BOOK_COLORS[selectedIndex % BOOK_COLORS.length];

  const filteredDays = useMemo(
    () => days.filter((d) => d.book_id === selectedBookId),
    [days, selectedBookId]
  );

  const progressMap = useMemo(() => {
    const map = new Map<string, VocaStudentProgress>();
    progressList.forEach((p) => map.set(p.day_id, p));
    return map;
  }, [progressList]);

  // 책 단위: 모든 Day 1회독 완료 → 2회독
  const bookRound1Complete = useMemo(() => {
    const targetDays = freeDayLimit > 0 ? filteredDays.slice(0, freeDayLimit) : filteredDays;
    return targetDays.length > 0 && targetDays.every((d) => isR1Complete(progressMap.get(d.id) ?? null));
  }, [filteredDays, progressMap, freeDayLimit]);

  // 현재 라운드: 모드에 따라 다르게 (book 모드는 전체 기준)
  const bookCurrentRound: '1' | '2' = (!round2Locked && bookRound1Complete) ? '2' : '1';

  const totalDays = freeDayLimit > 0 ? Math.min(filteredDays.length, freeDayLimit) : filteredDays.length;
  const completedCount = useMemo(() => {
    const target = filteredDays.slice(0, freeDayLimit > 0 ? freeDayLimit : undefined);
    if (roundMode === 'day') {
      // Day 모드: 1회독+2회독 모두 완료한 Day 수
      return target.filter((d) => {
        const p = progressMap.get(d.id) ?? null;
        return isR1Complete(p) && (round2Locked || isR2Complete(p));
      }).length;
    }
    if (bookCurrentRound === '2') {
      return target.filter((day) => isR2Complete(progressMap.get(day.id) ?? null)).length;
    }
    return target.filter((day) => isR1Complete(progressMap.get(day.id) ?? null)).length;
  }, [filteredDays, progressMap, freeDayLimit, bookCurrentRound, roundMode, round2Locked]);

  const handleModeChange = async (mode: RoundMode) => {
    setRoundMode(mode);
    setShowModeSelector(false);
    try {
      await fetch('/api/voca/round-mode', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      startTransition(() => router.refresh());
    } catch { /* ignore */ }
  };

  const selectedBook = books.find((b) => b.id === selectedBookId);

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-2xl font-bold text-gray-300">등록된 교재가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Hero banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: bookColor.bg }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px, 40px 40px' }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-white/70 text-xs font-semibold tracking-widest uppercase">AllKill Voca</p>
            {roundMode === 'book' && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                bookCurrentRound === '2'
                  ? 'bg-violet-400/30 text-violet-100'
                  : 'bg-white/20 text-white/80'
              }`}>
                {bookCurrentRound}회독
              </span>
            )}
            <button
              onClick={() => setShowModeSelector((v) => !v)}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white/80 hover:bg-white/25 transition-colors"
            >
              {roundMode === 'book' ? '책 전체 모드' : 'Day별 완벽 모드'} ▾
            </button>
          </div>
          <h1 className="text-white text-2xl md:text-3xl font-extrabold leading-tight mb-1">
            {selectedBook?.title || '올킬보카'}
          </h1>
          {totalDays > 0 && (
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 h-2 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white/90 transition-all duration-500"
                  style={{ width: `${totalDays > 0 ? (completedCount / totalDays) * 100 : 0}%` }}
                />
              </div>
              <span className="text-white/90 text-sm font-bold tabular-nums">
                {completedCount}/{totalDays}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Round mode selector */}
      {showModeSelector && (
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 space-y-3 shadow-lg">
          <p className="text-sm font-bold text-gray-800">학습 방식을 선택하세요</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleModeChange('book')}
              disabled={isPending}
              className={`text-left rounded-xl border-2 p-4 transition-all ${
                roundMode === 'book'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-indigo-500" />
                <span className="text-sm font-bold text-gray-900">책 전체 모드</span>
                {roundMode === 'book' && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full">선택됨</span>}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                전체 Day를 <strong>1회독</strong>으로 한 번 훑은 뒤<br />
                다시 처음부터 <strong>2회독</strong>으로 반복
              </p>
              <p className="text-[11px] text-indigo-500 font-medium mt-2">
                Day 1 → Day 2 → ... → Day 30 (1회독)<br />
                Day 1 → Day 2 → ... → Day 30 (2회독)
              </p>
            </button>
            <button
              onClick={() => handleModeChange('day')}
              disabled={isPending}
              className={`text-left rounded-xl border-2 p-4 transition-all ${
                roundMode === 'day'
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <BookMarked className="h-5 w-5 text-violet-500" />
                <span className="text-sm font-bold text-gray-900">Day별 완벽 모드</span>
                {roundMode === 'day' && <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded-full">선택됨</span>}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                각 Day를 <strong>1회독+2회독</strong> 완벽히 마치고<br />
                다음 Day로 넘어가는 방식
              </p>
              <p className="text-[11px] text-violet-500 font-medium mt-2">
                Day 1 (1회독→2회독) → Day 2 (1회독→2회독) → ...
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Book selector */}
      {books.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {books.map((book, i) => {
            const color = BOOK_COLORS[i % BOOK_COLORS.length];
            const isSelected = selectedBookId === book.id;
            return (
              <button
                key={book.id}
                onClick={() => setSelectedBookId(book.id)}
                className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                style={isSelected ? {
                  background: color.bg,
                  color: 'white',
                  boxShadow: `0 4px 12px ${color.border}`,
                } : {
                  background: color.light,
                  color: color.bg,
                  border: `1.5px solid ${color.border}`,
                }}
              >
                {book.title}
              </button>
            );
          })}
        </div>
      )}

      {/* Pet widget */}
      <PetWidget />

      {/* Day list */}
      {filteredDays.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-lg text-gray-300 font-medium">아직 등록된 Day가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredDays.map((day, index) => {
            const prog = progressMap.get(day.id);
            const steps = getStepsDone(prog);
            const completed = isR1Complete(prog ?? null);
            const locked = freeDayLimit > 0 && index >= freeDayLimit;

            if (locked) {
              return (
                <div key={day.id} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3.5 opacity-50">
                  <DayBadge index={index} color={bookColor} variant="locked" />
                  <p className="flex-1 font-medium text-gray-400 text-sm">
                    {day.title}
                    {day.description && (
                      <span className="ml-2 text-[11px] font-normal text-gray-200">{day.description}</span>
                    )}
                  </p>
                  <Lock className="h-4 w-4 text-gray-300" />
                </div>
              );
            }

            const r2Steps = getRound2StepsDone(prog);
            const r2Completed = isR2Complete(prog ?? null);

            let isCompleted: boolean;
            let stepsNow: number;
            let totalSteps: number;
            let dayRoundLabel: string | null = null;

            if (roundMode === 'day') {
              // Day별 모드: 1회독+2회독 모두 완료 = 완료
              const bothDone = completed && (round2Locked || r2Completed);
              isCompleted = bothDone;
              if (!completed) {
                // 1회독 진행중
                stepsNow = steps;
                totalSteps = 4;
                dayRoundLabel = '1회독';
              } else if (!round2Locked && !r2Completed) {
                // 2회독 진행중
                stepsNow = r2Steps;
                totalSteps = 3;
                dayRoundLabel = '2회독';
              } else {
                stepsNow = 0;
                totalSteps = 0;
              }
            } else {
              // 책 단위 모드: 현재 라운드 기준
              isCompleted = bookCurrentRound === '2' ? r2Completed : completed;
              stepsNow = bookCurrentRound === '2' ? r2Steps : steps;
              totalSteps = bookCurrentRound === '2' ? 3 : 4;
            }

            return (
              <Link key={day.id} href={`/student/voca/${day.id}`}>
                <div className={`group flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-all duration-200 hover:shadow-md active:scale-[0.99] ${
                  isCompleted
                    ? 'border-green-200 bg-green-50/40'
                    : 'border-gray-200 bg-white hover:border-indigo-200'
                }`}>
                  <DayBadge index={index} color={bookColor} variant={isCompleted ? 'done' : 'default'} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-[15px] truncate ${isCompleted ? 'text-green-700' : 'text-gray-800'}`}>
                      {day.title}
                      {day.description && (
                        <span className="ml-2 text-[11px] font-normal text-gray-300">{day.description}</span>
                      )}
                    </p>
                    {stepsNow > 0 && !isCompleted && (
                      <div className="flex items-center gap-2 mt-1.5">
                        {dayRoundLabel && (
                          <span className="text-[10px] font-bold text-gray-400">{dayRoundLabel}</span>
                        )}
                        <div className="flex gap-0.5">
                          {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                              key={i}
                              className="h-1 rounded-full transition-all"
                              style={{
                                width: i < stepsNow ? 16 : 8,
                                background: i < stepsNow ? bookColor.bg : '#e5e7eb',
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-medium text-gray-400">{stepsNow}/{totalSteps}</span>
                      </div>
                    )}
                    {isCompleted && (
                      <p className="text-[11px] font-medium text-green-600 mt-0.5">
                        {roundMode === 'day' ? '1+2회독 완료' : `${bookCurrentRound}회독 완료`}
                      </p>
                    )}
                    {(roundMode === 'day' || bookCurrentRound === '1') && <ProgressBadges progress={prog} submissionStatus={submissionStatuses[day.id]} />}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Free limit notice */}
      {freeDayLimit > 0 && filteredDays.length > freeDayLimit && (
        <div className="relative overflow-hidden rounded-xl border border-dashed border-gray-300 p-5 text-center" style={{ background: 'rgba(71,85,105,0.04)' }}>
          <p className="text-sm font-bold text-indigo-600">
            무료 체험은 교재당 Day {freeDayLimit}개까지
          </p>
          <p className="text-xs text-gray-400 mt-1">
            업그레이드하면 전체 {filteredDays.length}개 Day를 학습할 수 있어요
          </p>
        </div>
      )}
    </div>
  );
}

function DayBadge({ index, color, variant }: { index: number; color: typeof BOOK_COLORS[0]; variant: 'default' | 'done' | 'locked' }) {
  if (variant === 'locked') {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 shrink-0">
        <span className="text-sm font-bold text-gray-300">{index + 1}</span>
      </div>
    );
  }
  if (variant === 'done') {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-100 shrink-0">
        <span className="text-sm font-bold text-green-600">{index + 1}</span>
      </div>
    );
  }
  return (
    <div
      className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
      style={{ background: color.bg }}
    >
      <span className="text-sm font-bold text-white">{index + 1}</span>
    </div>
  );
}

function ProgressBadges({ progress, submissionStatus }: { progress?: VocaStudentProgress | null; submissionStatus?: string }) {
  const hasRound2 = progress?.round2_flashcard_completed ||
    progress?.round2_quiz_score != null ||
    progress?.round2_matching_completed;

  if (!hasRound2 && !submissionStatus) return null;

  return (
    <div className="mt-1.5">
      {hasRound2 && (
        <div className="flex gap-1 flex-wrap">
          {progress?.round2_flashcard_completed && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-blue-200 text-blue-600 bg-blue-50/50">2회 카드</Badge>
          )}
          {progress?.round2_quiz_score != null && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-blue-200 text-blue-600 bg-blue-50/50">2회 종합 {progress.round2_quiz_score}%</Badge>
          )}
          {progress?.round2_matching_completed && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-blue-200 text-blue-600 bg-blue-50/50">2회 매칭</Badge>
          )}
        </div>
      )}
      {submissionStatus && (
        <div className="flex gap-1 flex-wrap mt-0.5">
          <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${submissionStatus === 'reviewed' ? 'border-green-200 text-green-600 bg-green-50/50' : 'border-orange-200 text-orange-600 bg-orange-50/50'}`}>
            {submissionStatus === 'reviewed' ? '오답쓰기 확인됨' : '오답쓰기 제출'}
          </Badge>
        </div>
      )}
    </div>
  );
}
