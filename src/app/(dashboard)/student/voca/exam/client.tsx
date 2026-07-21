'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, CheckCircle } from 'lucide-react';
import { BonusExam } from '@/components/voca/bonus-exam';
import { AssignedExams } from '@/components/voca/assigned-exams';
import { Round2SynAntExam } from '@/components/voca/round2-syn-ant-exam';
import { VocaBrandStyle, VocaHeroLetters, VOCA_COLORS } from '@/components/voca/voca-brand';
import type { VocaBook, VocaDay } from '@/types/voca';
import { DEFAULT_EXAM_INTENSITY, type ExamIntensity } from '@/lib/voca/exam-intensity';

interface VocaExamClientProps {
  books: VocaBook[];
  days: VocaDay[];
  /** localStorage 키 네임스페이스용 (보카 홈과 같은 키 공유 — 보던 교재 그대로) */
  studentId: string;
  /** 무료 체험: 앞 N개 Day만 시험 범위 (0 = 전체) */
  freeDayLimit?: number;
  /** 표제어 시험 강도 (합격선·제한시간·오답 재시험) — 학생별 설정 */
  examIntensity?: ExamIntensity;
}

/** 올킬시험 — 교재 골라서 Day 최대 3개 묶음 표제어 스펠링 시험 */
export function VocaExamClient({ books, days, studentId, freeDayLimit = 0, examIntensity = DEFAULT_EXAM_INTENSITY }: VocaExamClientProps) {
  const bookStorageKey = `voca:selectedBookId:${studentId}`;
  const [selectedBookId, setSelectedBookId] = useState<string>(books[0]?.id || '');
  const [examRound, setExamRound] = useState<1 | 2>(1);

  // 보카 홈에서 보던 교재를 기본 선택
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(bookStorageKey);
      if (saved && books.some((b) => b.id === saved)) setSelectedBookId(saved);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredDays = useMemo(() => {
    const list = days.filter((d) => d.book_id === selectedBookId);
    return freeDayLimit > 0 ? list.slice(0, freeDayLimit) : list;
  }, [days, selectedBookId, freeDayLimit]);

  const selectedBook = books.find((b) => b.id === selectedBookId);

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-2xl font-bold text-gray-300">등록된 교재가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <VocaBrandStyle />

      {/* Hero — /allkill 톤 */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8" style={{ background: VOCA_COLORS.sky }}>
        <VocaHeroLetters />
        <div className="relative z-10">
          <p className="voca-display text-xs font-bold tracking-widest uppercase mb-2" style={{ color: VOCA_COLORS.blueDark }}>
            AllKill Exam
          </p>
          <h1 className="voca-display text-2xl md:text-3xl leading-tight" style={{ color: VOCA_COLORS.ink, fontWeight: 700, wordBreak: 'keep-all' }}>
            외운 단어, 시험으로 증명<span style={{ color: VOCA_COLORS.blue }}>.</span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: VOCA_COLORS.gray }}>
            Day를 최대 3개까지 골라 표제어 스펠링 시험을 봐요. 진도에는 영향이 없어요.
          </p>
        </div>
      </div>

      {/* 📋 선생님이 낸 시험 — 숙제가 자율 시험보다 우선 (배정 있을 때만 표시) */}
      <AssignedExams intensity={examIntensity} />

      {/* 교재 선택 */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-gray-400 px-1">📚 시험 볼 교재</p>
        <ExamBookSelector books={books} selectedBookId={selectedBookId} onSelect={setSelectedBookId} />
      </div>

      {/* 시험 유형 선택 — 1회독(표제어 스펠링) / 2회독(유의어·반의어) */}
      <div className="flex gap-2">
        {([1, 2] as const).map((r) => (
          <button
            key={r}
            onClick={() => setExamRound(r)}
            className={`flex-1 rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-all ${
              examRound === r
                ? 'border-[#1A73E8] bg-[#E8F0FE] text-[#174EA6]'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
            }`}
          >
            {r === 1 ? '1회독 · 표제어 스펠링' : '2회독 · 유의어·반의어'}
          </button>
        ))}
      </div>

      {/* Day 선택 + 시험 */}
      {filteredDays.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center text-sm text-gray-400">
          {selectedBook?.title}에 아직 등록된 Day가 없어요
        </div>
      ) : examRound === 1 ? (
        <BonusExam key={selectedBookId} days={filteredDays} bookId={selectedBookId} intensity={examIntensity} />
      ) : (
        <Round2SynAntExam key={`r2-${selectedBookId}`} days={filteredDays} bookId={selectedBookId} intensity={examIntensity} />
      )}

      {freeDayLimit > 0 && (
        <p className="text-center text-xs text-gray-400">
          무료 체험은 각 교재의 앞 Day {freeDayLimit}개까지 시험 볼 수 있어요
        </p>
      )}
    </div>
  );
}

function ExamBookSelector({ books, selectedBookId, onSelect }: { books: VocaBook[]; selectedBookId: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = books.find((b) => b.id === selectedBookId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:border-gray-300"
      >
        <span className="flex min-w-0 items-center gap-2">
          <BookOpen className="h-4 w-4 shrink-0 text-gray-400" />
          <span className="voca-display truncate text-gray-800" style={{ fontWeight: 700 }}>{selected?.title || '교재 선택'}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="max-h-72 overflow-y-auto py-1">
            {books.map((book) => {
              const isSel = book.id === selectedBookId;
              return (
                <button
                  key={book.id}
                  onClick={() => { onSelect(book.id); setOpen(false); }}
                  className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${isSel ? 'font-bold text-primary' : 'text-gray-700'}`}
                >
                  <span className="truncate">{book.title}</span>
                  {isSel && <CheckCircle className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
