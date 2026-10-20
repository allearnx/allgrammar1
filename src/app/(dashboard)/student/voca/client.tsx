'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookGuidePicker } from '@/components/voca/book-guide-picker';
import { FreeUpgradeNotice } from './_components/free-upgrade-notice';
import { VocaHomeHero } from './_components/voca-home-hero';
import { RoundModeToggle } from './_components/round-mode-toggle';
import { DayList } from './_components/day-list';
import { BookSelector } from './_components/book-selector';
import { VocaBrandStyle } from '@/components/voca/voca-brand';
import { WrongMissionCard } from '@/components/voca/wrong-mission-card';
import { TodayStudyCard } from '@/components/voca/today-study-card';
import {
  buildProgressMap, isBookRound1Complete, resolveBookRound, countCompletedDays, expiryInfo,
  type RoundMode,
} from '@/lib/voca/home-progress';
import type { VocaBook, VocaDay, VocaStudentProgress } from '@/types/voca';

interface VocaHomeClientProps {
  books: VocaBook[];
  days: VocaDay[];
  progressList: VocaStudentProgress[];
  submissionStatuses?: Record<string, string>;
  /** localStorage 키 네임스페이스용 — 같은 브라우저의 다른 계정과 교재 선택이 섞이지 않도록 */
  studentId: string;
  initialBookId?: string;
  freeDayLimit?: number;
  round2Locked?: boolean;
  /** 무료라도 2회독이 열리는 앞 Day 수 */
  round2FreeDays?: number;
  /** 관리자 '2회독' 토글 = 1회독 면제 (다른 곳에서 1회독을 마친 학생) */
  round2Forced?: boolean;
  roundMode?: RoundMode;
  /** 학습 기록이 하나도 없는 첫 진입 — 학년→교재 가이드 표시 */
  firstTimeGuide?: boolean;
  /** 개인 결제 이용권 만료 시각 (null = 무기한/무료) */
  expiresAt?: string | null;
}

// Day 배지·진행 바는 구글 4색 순환 (랜딩 statBand·7단계 카드와 같은 리듬)

export function VocaHomeClient({ books, days, progressList, submissionStatuses = {}, studentId, initialBookId, freeDayLimit = 0, round2Locked = false, round2FreeDays = 0, round2Forced = false, roundMode: initialRoundMode = 'book', firstTimeGuide = false, expiresAt = null }: VocaHomeClientProps) {
  const router = useRouter();
  // 계정별 키 — 전역 키('voca:selectedBookId')를 쓰면 같은 브라우저에서
  // 다른 계정이 보던 교재가 복원되어 첫 진입 가이드가 건너뛰어진다
  const bookStorageKey = `voca:selectedBookId:${studentId}`;
  const [isPending, startTransition] = useTransition();
  const [roundMode, setRoundMode] = useState<RoundMode>(initialRoundMode);
  const [guideOpen, setGuideOpen] = useState(false);

  // 이용권 만료 표시 — D-7 이내면 경고 톤 + 연장 링크
  const expiry = useMemo(() => expiryInfo(expiresAt), [expiresAt]);

  const defaultBookId = (initialBookId && books.some((b) => b.id === initialBookId))
    ? initialBookId
    : books[0]?.id || '';
  const [selectedBookId, setSelectedBookId] = useState<string>(defaultBookId);

  // 마지막으로 보던 교재 복원 — 뒤로가기/사이드바로 돌아와도 선택이 유지되도록.
  // (URL에 bookId가 명시돼 있으면 그걸 우선 + 저장, 없을 때만 localStorage 복원)
  useEffect(() => {
    if (initialBookId) {
      try { window.localStorage.setItem(bookStorageKey, initialBookId); } catch { /* ignore */ }
      return;
    }
    try {
      const saved = window.localStorage.getItem(bookStorageKey);
      if (saved && books.some((b) => b.id === saved)) {
        setSelectedBookId(saved);
      } else if (firstTimeGuide) {
        // 학습 기록도, 저장된 교재 선택도 없는 진짜 첫 진입 → 학년 가이드
        setGuideOpen(true);  
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectBook = (id: string) => {
    setSelectedBookId(id);
    try {
      window.localStorage.setItem(bookStorageKey, id);
      // 새로고침/공유 시에도 같은 교재가 열리도록 URL 동기화 (재요청 없이).
      window.history.replaceState(null, '', `/student/voca?bookId=${id}`);
    } catch { /* ignore */ }
  };
  const filteredDays = useMemo(
    () => days.filter((d) => d.book_id === selectedBookId),
    [days, selectedBookId]
  );

  const progressMap = useMemo(() => buildProgressMap(progressList), [progressList]);

  // 책 단위: 모든 Day 1회독 완료 → 2회독
  const bookRound1Complete = useMemo(
    () => isBookRound1Complete(filteredDays, progressMap, freeDayLimit),
    [filteredDays, progressMap, freeDayLimit],
  );

  // 현재 라운드: 모드에 따라 다르게 (book 모드는 전체 기준, 1회독 면제 시 바로 2회독)
  const bookCurrentRound = resolveBookRound({ round2Locked, round2Forced, bookRound1Complete, round2FreeDays });
  const roundRules = useMemo(
    () => ({ roundMode, bookCurrentRound, round2Locked, round2Forced, round2FreeDays }),
    [roundMode, bookCurrentRound, round2Locked, round2Forced, round2FreeDays],
  );

  // 무료 체험(Day 3개) 완료 — 업그레이드 안내를 페이지 상단으로 승격
  const freeTrialDone = freeDayLimit > 0 && bookRound1Complete;

  const totalDays = freeDayLimit > 0 ? Math.min(filteredDays.length, freeDayLimit) : filteredDays.length;
  const completedCount = useMemo(
    () => countCompletedDays(filteredDays, progressMap, freeDayLimit, roundRules),
    [filteredDays, progressMap, freeDayLimit, roundRules],
  );

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
  // /allkill 톤: 하늘 카드 + GmarketSans + 흰 플랜 카드 + 노란 CTA (문 두 개)
  const freeUpgradeNotice = freeDayLimit > 0 && filteredDays.length > freeDayLimit
    ? <FreeUpgradeNotice freeDayLimit={freeDayLimit} totalDayCount={filteredDays.length} freeTrialDone={freeTrialDone} />
    : null;

  return (
    <div className="space-y-6 pb-8">
      <VocaBrandStyle />
      <VocaHomeHero
        bookId={selectedBookId}
        title={selectedBook?.title}
        round2Locked={round2Locked}
        round2FreeDays={round2FreeDays}
        freeDayLimit={freeDayLimit}
        expiry={expiry}
        canSwitchBook={books.length > 1}
        onOpenGuide={() => setGuideOpen(true)}
        totalDays={totalDays}
        completedCount={completedCount}
      />

      {/* 📌 오늘의 학습 — 학습 중인 교재별 다음 Day (2권 병행 학생의 길잡이) */}
      <TodayStudyCard
        books={books}
        days={days}
        progressMap={progressMap}
        freeDayLimit={freeDayLimit}
        round2Locked={round2Locked}
        round2FreeDays={round2FreeDays}
        round2Forced={round2Forced}
        onSelectBook={selectBook}
      />

      {/* 주간 올킬 미션 — 금·토 예고, 일요일 미션 데이 */}
      <WrongMissionCard />

      {/* 무료 체험 완료 → 업그레이드 안내를 최상단에 */}
      {freeTrialDone && freeUpgradeNotice}

      <RoundModeToggle roundMode={roundMode} round2Locked={round2Locked} round2FreeDays={round2FreeDays} isPending={isPending} onChange={handleModeChange} />

      {/* Book selector */}
      {books.length > 1 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-400 px-1">
            📚 교재 선택 — 아래를 눌러 다른 교재로 바꿀 수 있어요
          </p>
          <BookSelector books={books} selectedBookId={selectedBookId} onSelect={selectBook} />
        </div>
      )}

      <DayList
        days={filteredDays}
        progressMap={progressMap}
        freeDayLimit={freeDayLimit}
        roundRules={roundRules}
        submissionStatuses={submissionStatuses}
        onGoRound={(dayId, round) => router.push(`/student/voca/${dayId}?round=${round}`)}
      />

      {/* 시험(선생님 배정 + 자가 묶음)은 사이드바 "올킬시험"(/student/voca/exam)으로 일원화 */}

      {/* Free limit notice — 체험 완료 전에는 하단 안내로 */}
      {!freeTrialDone && freeUpgradeNotice}
    </div>
  );
}
