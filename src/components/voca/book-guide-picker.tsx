'use client';

/* eslint-disable @next/next/no-img-element -- Supabase Storage 외부 URL 표지 */
import { useState } from 'react';
import { ArrowLeft, BookOpen, Star } from 'lucide-react';
import type { VocaBook, VocaDay } from '@/types/voca';

type GradeKey = 'elementary' | 'middle' | 'high1' | 'high2' | 'high3' | 'intl';

const GRADES: { key: GradeKey; label: string; sub: string }[] = [
  { key: 'elementary', label: '초등학생', sub: '초1 ~ 초6' },
  { key: 'middle', label: '중학생', sub: '중1 ~ 중3' },
  { key: 'high1', label: '고1', sub: '고등 1학년' },
  { key: 'high2', label: '고2', sub: '고등 2학년' },
  { key: 'high3', label: '고3', sub: '고등 3학년' },
  { key: 'intl', label: '국제학교·유학생', sub: '영영 단어장' },
];

function matchesGrade(book: VocaBook, grade: GradeKey): boolean {
  const t = book.title.normalize('NFC');
  switch (grade) {
    case 'elementary': return /주니어|초등/.test(t);
    case 'middle': return /중등|중학/.test(t);
    case 'high1': return /고1/.test(t);
    case 'high2': return /고2/.test(t);
    case 'high3': return /고3/.test(t);
    case 'intl': return book.definition_lang === 'en'; // 영영 교재는 자동 분류
  }
}

/** 학년별 기본 추천: 초등=주니어, 중등=필수, 고등=3월 모고(첫 시험 대비), 국제=단어 많은 순 */
function isRecommended(book: VocaBook, grade: GradeKey): boolean {
  const t = book.title.normalize('NFC');
  if (grade === 'elementary') return /주니어/.test(t);
  if (grade === 'middle') return /중등 ?필수/.test(t);
  if (grade === 'intl') return false; // Day 수 많은 순 정렬에 맡김
  return /3월/.test(t);
}

interface BookGuidePickerProps {
  books: VocaBook[];
  days: VocaDay[];
  onSelect: (bookId: string) => void;
  onSkip: () => void;
}

/**
 * 첫 진입(학습 기록 0) 학생용 가이드 — 학년을 고르면 맞는 교재를 추천.
 * "교재를 안 고르고 바로 시작"을 구조적으로 막는다.
 */
export function BookGuidePicker({ books, days, onSelect, onSkip }: BookGuidePickerProps) {
  const [grade, setGrade] = useState<GradeKey | null>(null);

  const dayCountByBook = new Map<string, number>();
  for (const d of days) dayCountByBook.set(d.book_id, (dayCountByBook.get(d.book_id) ?? 0) + 1);

  // ── 화면 1: 학년 선택 ──
  if (!grade) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-10">
        <div className="text-center space-y-2">
          <p className="text-3xl">📚</p>
          <h1 className="text-2xl font-extrabold text-gray-900">어떤 교재로 시작할까요?</h1>
          <p className="text-sm text-gray-500">학년을 골라주시면 딱 맞는 교재를 추천해드려요</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {GRADES.map((g) => (
            <button
              key={g.key}
              onClick={() => setGrade(g.key)}
              className="rounded-2xl border-2 border-gray-200 bg-white p-6 text-center transition-all hover:border-primary hover:shadow-md active:scale-[0.98]"
            >
              <p className="text-lg font-extrabold text-gray-800">{g.label}</p>
              <p className="mt-0.5 text-xs text-gray-400">{g.sub}</p>
            </button>
          ))}
        </div>

        <button onClick={onSkip} className="block w-full text-center text-sm text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline">
          괜찮아요, 교재를 직접 둘러볼게요
        </button>
      </div>
    );
  }

  // ── 화면 2: 해당 학년 교재 (추천 우선) ──
  const matched = books.filter((b) => matchesGrade(b, grade));
  const others = books.filter((b) => !matchesGrade(b, grade));
  const sorted = [...matched].sort((a, b) => {
    const ra = isRecommended(a, grade) ? 0 : 1;
    const rb = isRecommended(b, grade) ? 0 : 1;
    if (ra !== rb) return ra - rb;
    return (dayCountByBook.get(b.id) ?? 0) - (dayCountByBook.get(a.id) ?? 0);
  });
  const gradeLabel = GRADES.find((g) => g.key === grade)?.label;

  const renderCard = (book: VocaBook, recommended: boolean) => {
    const dayCount = dayCountByBook.get(book.id) ?? 0;
    return (
      <button
        key={book.id}
        onClick={() => onSelect(book.id)}
        className={`flex w-full items-center gap-4 rounded-2xl border-2 bg-white p-4 text-left transition-all hover:shadow-md active:scale-[0.99] ${
          recommended ? 'border-primary ring-2 ring-accent' : 'border-gray-200 hover:border-[#d2e3fc]'
        }`}
      >
        {book.cover_image_url ? (
          <img
            src={book.cover_image_url}
            alt={book.title}
            className="h-20 w-[60px] shrink-0 rounded-lg border object-cover"
          />
        ) : (
          <div className="flex h-20 w-[60px] shrink-0 items-center justify-center rounded-lg bg-accent">
            <BookOpen className="h-6 w-6 text-primary/70" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {recommended && (
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">
              <Star className="h-3 w-3 fill-current" /> 추천
            </span>
          )}
          <p className="truncate font-bold text-gray-800">{book.title}</p>
          {dayCount > 0 && <p className="mt-0.5 text-xs text-gray-400">Day {dayCount}개 구성</p>}
        </div>
        <span className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">
          시작
        </span>
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 py-10">
      <button onClick={() => setGrade(null)} className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> 학년 다시 선택
      </button>

      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-gray-900">{gradeLabel} 추천 교재</h1>
        <p className="text-sm text-gray-500">언제든 다른 교재로 바꿀 수 있어요</p>
      </div>

      {sorted.length > 0 ? (
        <div className="space-y-3">
          {sorted.map((b) => renderCard(b, isRecommended(b, grade)))}
        </div>
      ) : (
        <p className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-400">
          이 학년 전용 교재가 아직 없어요. 아래 교재에서 골라보세요!
        </p>
      )}

      {others.length > 0 && (
        <details className="pt-2">
          <summary className="cursor-pointer text-sm font-medium text-gray-400 hover:text-gray-600">
            다른 교재도 보기 ({others.length})
          </summary>
          <div className="mt-3 space-y-3">
            {others.map((b) => renderCard(b, false))}
          </div>
        </details>
      )}
    </div>
  );
}
