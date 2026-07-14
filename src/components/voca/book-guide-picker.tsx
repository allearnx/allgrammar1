'use client';

/* eslint-disable @next/next/no-img-element -- Supabase Storage 외부 URL 표지 */
import { useState } from 'react';
import { ArrowLeft, BookOpen, Star } from 'lucide-react';
import { VocaBrandStyle, VocaHeroLetters, VOCA_STEP_THEMES, VOCA_COLORS } from '@/components/voca/voca-brand';
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
    // 영영 교재 + The Giver(원서 단어장, 영한이지만 유학생 대상)
    case 'intl': return book.definition_lang === 'en' || /giver/i.test(t);
  }
}

/** 학년별 기본 추천: 초등=주니어, 중등=필수, 고등=3월 모고(첫 시험 대비), 국제=전부 추천 */
function isRecommended(book: VocaBook, grade: GradeKey): boolean {
  const t = book.title.normalize('NFC');
  if (grade === 'elementary') return /주니어/.test(t);
  if (grade === 'middle') return /중등 ?필수/.test(t);
  if (grade === 'intl') return true; // 매칭된 교재(Workshop·Giver)가 곧 추천
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
 * 디자인: /allkill 랜딩 톤 (파스텔 하늘 + 알파벳 카펫 + GmarketSans + 구글 4색)
 */
export function BookGuidePicker({ books, days, onSelect, onSkip }: BookGuidePickerProps) {
  const [grade, setGrade] = useState<GradeKey | null>(null);

  const dayCountByBook = new Map<string, number>();
  for (const d of days) dayCountByBook.set(d.book_id, (dayCountByBook.get(d.book_id) ?? 0) + 1);

  // ── 화면 1: 학년 선택 ──
  if (!grade) {
    return (
      <div
        className="relative -m-4 md:-m-6 min-h-[calc(100dvh-3.5rem)] overflow-hidden px-4 py-12 md:py-16"
        style={{ background: VOCA_COLORS.sky }}
      >
        <VocaBrandStyle />
        <VocaHeroLetters variant="full" />

        <div className="relative z-10 mx-auto max-w-lg space-y-8">
          <div className="text-center space-y-3">
            <p className="voca-display text-sm font-bold tracking-wide" style={{ color: VOCA_COLORS.gray }}>
              중고등 영어 단어 암기, 올킬보카
            </p>
            <h1 className="voca-display text-3xl md:text-4xl leading-snug" style={{ color: VOCA_COLORS.ink, fontWeight: 700, wordBreak: 'keep-all' }}>
              어떤 교재로<br className="md:hidden" /> 시작할까요<span style={{ color: VOCA_COLORS.blue }}>?</span>
            </h1>
            <p className="text-[15px]" style={{ color: VOCA_COLORS.gray }}>
              학년을 골라주시면 딱 맞는 교재를 추천해드려요
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {GRADES.map((g, i) => {
              const theme = VOCA_STEP_THEMES[i % VOCA_STEP_THEMES.length];
              return (
                <button
                  key={g.key}
                  onClick={() => setGrade(g.key)}
                  className="group rounded-3xl border border-white bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
                >
                  <span
                    className="mx-auto mb-3 block h-2.5 w-2.5 rounded-full transition-transform group-hover:scale-125"
                    style={{ background: theme.solid }}
                  />
                  <p className="voca-display text-lg" style={{ color: VOCA_COLORS.ink, fontWeight: 700 }}>{g.label}</p>
                  <p className="mt-1 text-xs font-medium" style={{ color: '#9AA0A6' }}>{g.sub}</p>
                </button>
              );
            })}
          </div>

          <button onClick={onSkip} className="block w-full text-center text-sm underline-offset-4 hover:underline" style={{ color: VOCA_COLORS.gray }}>
            괜찮아요, 교재를 직접 둘러볼게요
          </button>
        </div>
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
        className={`flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] ${
          recommended ? 'ring-2 ring-[#1A73E8]' : 'border border-white'
        }`}
      >
        {book.cover_image_url ? (
          <img
            src={book.cover_image_url}
            alt={book.title}
            className="h-20 w-[60px] shrink-0 rounded-lg border object-cover"
          />
        ) : (
          <div className="flex h-20 w-[60px] shrink-0 items-center justify-center rounded-lg" style={{ background: VOCA_COLORS.blueLight }}>
            <BookOpen className="h-6 w-6" style={{ color: VOCA_COLORS.blue }} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {recommended && (
            <span
              className="mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: VOCA_COLORS.blue, color: '#fff' }}
            >
              <Star className="h-3 w-3 fill-current" /> 추천
            </span>
          )}
          <p className="voca-display truncate text-[15px]" style={{ color: VOCA_COLORS.ink, fontWeight: 700 }}>{book.title}</p>
          {dayCount > 0 && <p className="mt-0.5 text-xs" style={{ color: '#9AA0A6' }}>Day {dayCount}개 구성</p>}
        </div>
        <span className="voca-cta voca-display shrink-0 rounded-full px-5 py-2.5 text-sm" style={{ fontWeight: 700 }}>
          시작
        </span>
      </button>
    );
  };

  return (
    <div
      className="relative -m-4 md:-m-6 min-h-[calc(100dvh-3.5rem)] overflow-hidden px-4 py-10"
      style={{ background: VOCA_COLORS.sky }}
    >
      <VocaBrandStyle />
      <VocaHeroLetters variant="full" />

      <div className="relative z-10 mx-auto max-w-lg space-y-5">
        <button onClick={() => setGrade(null)} className="flex items-center gap-1 text-sm font-semibold hover:opacity-70" style={{ color: VOCA_COLORS.gray }}>
          <ArrowLeft className="h-4 w-4" /> 학년 다시 선택
        </button>

        <div className="space-y-1.5">
          <h1 className="voca-display text-2xl" style={{ color: VOCA_COLORS.ink, fontWeight: 700 }}>
            {gradeLabel} 추천 교재<span style={{ color: VOCA_COLORS.blue }}>.</span>
          </h1>
          <p className="text-sm" style={{ color: VOCA_COLORS.gray }}>언제든 다른 교재로 바꿀 수 있어요</p>
        </div>

        {sorted.length > 0 ? (
          <div className="space-y-3">
            {sorted.map((b) => renderCard(b, isRecommended(b, grade)))}
          </div>
        ) : (
          <p className="rounded-3xl bg-white/70 p-6 text-center text-sm" style={{ color: VOCA_COLORS.gray }}>
            이 학년 전용 교재가 아직 없어요. 아래 교재에서 골라보세요!
          </p>
        )}

        {others.length > 0 && (
          <div className="space-y-3 pt-4">
            {/* 접지 않고 전부 노출 — 접혀 있으면 학생들이 교재를 못 찾는다 */}
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-white" />
              <p className="text-sm font-semibold" style={{ color: VOCA_COLORS.gray }}>
                다른 교재 ({others.length})
              </p>
              <span className="h-px flex-1 bg-white" />
            </div>
            {others.map((b) => renderCard(b, false))}
          </div>
        )}
      </div>
    </div>
  );
}
