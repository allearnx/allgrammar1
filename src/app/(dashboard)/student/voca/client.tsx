'use client';

import { useState, useMemo, useTransition, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Lock, ChevronRight, ChevronDown, Search, BookOpen, BookMarked, Sparkles, GraduationCap, Users, ArrowRight } from 'lucide-react';
import { BonusExam } from '@/components/voca/bonus-exam';
import { AssignedExams } from '@/components/voca/assigned-exams';
import { BookGuidePicker } from '@/components/voca/book-guide-picker';
import { ParentLinkButton } from '@/components/voca/parent-link-button';
import { CoverageGauge } from '@/components/voca/coverage-gauge';
import { WrongMissionCard } from '@/components/voca/wrong-mission-card';
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
  /** 학습 기록이 하나도 없는 첫 진입 — 학년→교재 가이드 표시 */
  firstTimeGuide?: boolean;
  /** 개인 결제 이용권 만료 시각 (null = 무기한/무료) */
  expiresAt?: string | null;
}

// 구글 스타일: 교재별 색면 대신 단일 블루 포인트 (색은 절제, 흰 카드가 바탕)
const BOOK_COLORS = [
  { bg: '#1A73E8', light: '#E8F0FE', border: '#D2E3FC' },
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

export function VocaHomeClient({ books, days, progressList, submissionStatuses = {}, initialBookId, freeDayLimit = 0, round2Locked = false, roundMode: initialRoundMode = 'book', firstTimeGuide = false, expiresAt = null }: VocaHomeClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [roundMode, setRoundMode] = useState<RoundMode>(initialRoundMode);
  const [guideOpen, setGuideOpen] = useState(false);

  // 이용권 만료 표시 — D-7 이내면 경고 톤 + 연장 링크
  const expiryInfo = useMemo(() => {
    if (!expiresAt) return null;
    const exp = new Date(expiresAt);
    const daysLeft = Math.ceil((exp.getTime() - Date.now()) / 86_400_000);
    if (daysLeft < 0) return null; // 이미 만료 — 조회 시점 정리 대기 중
    return {
      label: `${exp.getMonth() + 1}월 ${exp.getDate()}일까지${daysLeft <= 30 ? ` (D-${daysLeft})` : ''}`,
      urgent: daysLeft <= 7,
    };
  }, [expiresAt]);

  const defaultBookId = (initialBookId && books.some((b) => b.id === initialBookId))
    ? initialBookId
    : books[0]?.id || '';
  const [selectedBookId, setSelectedBookId] = useState<string>(defaultBookId);

  // 마지막으로 보던 교재 복원 — 뒤로가기/사이드바로 돌아와도 선택이 유지되도록.
  // (URL에 bookId가 명시돼 있으면 그걸 우선 + 저장, 없을 때만 localStorage 복원)
  useEffect(() => {
    if (initialBookId) {
      try { window.localStorage.setItem('voca:selectedBookId', initialBookId); } catch { /* ignore */ }
      return;
    }
    try {
      const saved = window.localStorage.getItem('voca:selectedBookId');
      if (saved && books.some((b) => b.id === saved)) {
        setSelectedBookId(saved);
      } else if (firstTimeGuide) {
        // 학습 기록도, 저장된 교재 선택도 없는 진짜 첫 진입 → 학년 가이드
        setGuideOpen(true); // eslint-disable-line react-hooks/set-state-in-effect -- localStorage는 클라이언트에서만 읽을 수 있음
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectBook = (id: string) => {
    setSelectedBookId(id);
    try {
      window.localStorage.setItem('voca:selectedBookId', id);
      // 새로고침/공유 시에도 같은 교재가 열리도록 URL 동기화 (재요청 없이).
      window.history.replaceState(null, '', `/student/voca?bookId=${id}`);
    } catch { /* ignore */ }
  };
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

  // 무료 체험(Day 3개) 완료 — 업그레이드 안내를 페이지 상단으로 승격
  const freeTrialDone = freeDayLimit > 0 && bookRound1Complete;

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

  // 첫 진입 가이드: 학년 → 추천 교재 (골라야 학습 시작)
  if (guideOpen) {
    return (
      <BookGuidePicker
        books={books}
        days={days}
        onSelect={(id) => { selectBook(id); setGuideOpen(false); }}
        onSkip={() => setGuideOpen(false)}
      />
    );
  }

  // 무료 한도 업그레이드 안내 — 체험 완료 시 상단, 그 전엔 하단에 표시
  const freeUpgradeNotice = freeDayLimit > 0 && filteredDays.length > freeDayLimit ? (
    <div className="space-y-4">
          {/* 헤더 카드 */}
          <div className="rounded-2xl overflow-hidden">
            <div className="px-5 py-6 text-center text-white" style={{ background: 'linear-gradient(135deg, #0891B2, #4285F4)' }}>
              <div className="flex justify-center mb-3">
                <div className="rounded-full bg-white/20 p-3">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-1">
                {freeTrialDone
                  ? `무료 체험 Day ${freeDayLimit}개를 완료했어요! 🎉`
                  : `무료 체험으로 Day ${freeDayLimit}개까지 학습할 수 있어요`}
              </h3>
              <p className="text-sm text-cyan-100 leading-relaxed">
                {freeTrialDone
                  ? `전체 ${filteredDays.length}개 Day + 2회독을 열려면 아래 방법 중 하나를 선택하세요`
                  : `전체 ${filteredDays.length}개 Day를 학습하려면 아래 방법 중 하나를 선택하세요`}
              </p>
            </div>
          </div>

          {/* 플랜 카드 */}
          <div className="grid grid-cols-1 gap-3">
            {/* 셀프 스터디 */}
            <Link href="/allkill#price" className="block group">
              <div className="rounded-xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-5 transition-all group-hover:border-cyan-400 group-hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-cyan-100 p-2 shrink-0">
                    <BookOpen className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-cyan-900">셀프 스터디</h4>
                      <span className="text-[10px] font-bold bg-cyan-600 text-white px-2 py-0.5 rounded-full">월 19,900원</span>
                    </div>
                    <p className="text-xs text-cyan-700 leading-relaxed mb-3">
                      혼자서도 전체 Day + 1회독·2회독 완벽 학습!<br />
                      오답 관리와 AI 서술형 채점까지 포함
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-600">
                      플랜 보러가기
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* 1:1 온라인 관리 */}
            <Link href="/allkill#price" className="block group">
              <div className="rounded-xl border-2 border-[#d2e3fc] bg-gradient-to-br from-[#e8f0fe] to-white p-5 transition-all group-hover:border-primary group-hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-accent p-2 shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-[#174ea6]">1:1 온라인 관리</h4>
                      <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">추천</span>
                    </div>
                    <p className="text-xs text-[#174ea6] leading-relaxed mb-3">
                      선생님이 주 2회 시험 + 진도 관리해줘요.<br />
                      학부모 리포트까지 제공!
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {['선생님 관리', '주 2회 시험', '학부모 리포트'].map((tag) => (
                        <span key={tag} className="text-[11px] bg-accent text-[#174ea6] px-2 py-0.5 rounded-full font-medium">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* 학원 배정 */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-gray-100 p-2 shrink-0">
                  <GraduationCap className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 mb-1">학원에서 배정받기</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    학원에 소속되어 있다면 선생님께 &ldquo;올킬보카 배정&rdquo;을 요청해보세요!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
  ) : null;

  return (
    <div className="space-y-6 pb-8">
      {/* Hero banner — 구글 스타일: 흰 카드 + 블루 포인트 */}
      <div className="relative overflow-hidden rounded-2xl border bg-white p-6 md:p-8">
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <p className="text-primary text-xs font-bold tracking-widest uppercase">AllKill Voca</p>
            {roundMode === 'book' && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                bookCurrentRound === '2'
                  ? 'bg-accent text-primary'
                  : 'bg-muted text-gray-500'
              }`}>
                {bookCurrentRound}회독
              </span>
            )}
            {expiryInfo && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                expiryInfo.urgent ? 'bg-[#FCE8E6] text-[#A50E0E]' : 'bg-muted text-gray-500'
              }`}>
                이용권 {expiryInfo.label}
              </span>
            )}
            {expiryInfo?.urgent && (
              <Link href="/allkill#price" className="text-[11px] font-bold text-primary underline underline-offset-2">
                연장하기
              </Link>
            )}
            {roundMode === 'book' && round2Locked && freeDayLimit > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-muted text-gray-400">
                2회독 🔒 유료
              </span>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <ParentLinkButton />
              {books.length > 1 && (
                <button
                  onClick={() => setGuideOpen(true)}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-accent"
                >
                  <BookOpen className="h-3 w-3" /> 교재 바꾸기
                </button>
              )}
            </div>
          </div>
          <h1 className="text-gray-900 text-2xl md:text-3xl font-extrabold leading-tight mb-1">
            {selectedBook?.title || '올킬보카'}
          </h1>
          {totalDays > 0 && (
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 h-2 rounded-full bg-accent overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${totalDays > 0 ? (completedCount / totalDays) * 100 : 0}%` }}
                />
              </div>
              <span className="text-primary text-sm font-bold tabular-nums">
                {completedCount}/{totalDays}
              </span>
            </div>
          )}
          {/* 시험 커버리지 — 진도율과 별개: 아는 단어 기준으로 이 시험이 몇 % 읽히는지 */}
          {selectedBookId && <CoverageGauge bookId={selectedBookId} />}
        </div>
      </div>

      {/* 주간 올킬 미션 — 금·토 예고, 일요일 미션 데이 */}
      <WrongMissionCard />

      {/* 무료 체험 완료 → 업그레이드 안내를 최상단에 */}
      {freeTrialDone && freeUpgradeNotice}

      {/* Round mode toggle */}
      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-800">학습 방식</p>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => handleModeChange('book')}
              disabled={isPending || roundMode === 'book'}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors ${
                roundMode === 'book'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              책 전체
            </button>
            <button
              onClick={() => handleModeChange('day')}
              disabled={isPending || roundMode === 'day'}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors ${
                roundMode === 'day'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <BookMarked className="h-4 w-4" />
              Day별 완벽
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          {roundMode === 'book'
            ? '전체 Day를 1회독으로 훑은 뒤, 다시 처음부터 2회독으로 반복합니다.'
            : '각 Day를 1회독+2회독 완벽히 마치고 다음 Day로 넘어갑니다.'}
        </p>
      </div>

      {/* Book selector */}
      {books.length > 1 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-400 px-1">
            📚 교재 선택 — 아래를 눌러 다른 교재로 바꿀 수 있어요
          </p>
          <BookSelector books={books} selectedBookId={selectedBookId} onSelect={selectBook} />
        </div>
      )}

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
                    : 'border-gray-200 bg-white hover:border-[#d2e3fc]'
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
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary/70 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* 📋 선생님이 배정한 시험 */}
      <AssignedExams />

      {/* 🎁 묶음 보너스 시험 (Day 1~3개 선택) — 무료 학생은 열린 Day만 */}
      {selectedBookId && (
        <BonusExam
          days={freeDayLimit > 0 ? filteredDays.slice(0, freeDayLimit) : filteredDays}
          bookId={selectedBookId}
        />
      )}

      {/* Free limit notice — 체험 완료 전에는 하단 안내로 */}
      {!freeTrialDone && freeUpgradeNotice}
    </div>
  );
}

function BookSelector({ books, selectedBookId, onSelect }: { books: VocaBook[]; selectedBookId: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = books.find((b) => b.id === selectedBookId);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q ? books.filter((b) => b.title.toLowerCase().includes(q)) : books;
  const showSearch = books.length > 6;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:border-gray-300"
      >
        <span className="flex min-w-0 items-center gap-2">
          <BookOpen className="h-4 w-4 shrink-0 text-gray-400" />
          <span className="truncate font-bold text-gray-800">{selected?.title || '교재 선택'}</span>
          <span className="shrink-0 text-xs font-medium text-gray-400">{books.length}권</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {showSearch && (
            <div className="border-b p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="교재 검색"
                  className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm outline-none focus:border-[#d2e3fc]"
                />
              </div>
            </div>
          )}
          <div className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">검색 결과가 없습니다</p>
            ) : (
              filtered.map((book) => {
                const isSel = book.id === selectedBookId;
                return (
                  <button
                    key={book.id}
                    onClick={() => { onSelect(book.id); setOpen(false); setQuery(''); }}
                    className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${isSel ? 'font-bold text-primary' : 'text-gray-700'}`}
                  >
                    <span className="truncate">{book.title}</span>
                    {isSel && <CheckCircle className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                );
              })
            )}
          </div>
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
