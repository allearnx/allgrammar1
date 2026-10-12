'use client';

import Link from 'next/link';
import { track } from '@vercel/analytics';
import { cn } from '@/lib/utils';
import { VOCA_COLORS } from '@/lib/voca/brand-tokens';
import { DIAGNOSTIC_LINEUP, LINEUP_ACCENTS, shortBookTitle, type resolveLineupPlacement } from '@/lib/voca/diagnostic-lineup';

/**
 * 교재 라인업 — 6칸(중1~고3) 그리드. 사다리는 시중 교재 실명으로만 세우고,
 * 우리가 만든 초등 800·교과서 단어는 칸 아래 "기준점"으로 병렬 표시한다 (2026-08-12 개편).
 * 기준점도 선택해 시작할 수 있다. 초등 칸만 예외로 우리 교재(초등 800)가 칸 대표다
 * — 시중 초등 교재가 없고, L0를 초등 800으로 출제하므로 처방도 같아야 하기 때문.
 *
 * 2026-08-12 디자인 개편(사장님 피드백 "온통 파란색·카드가 좁다"):
 * 가로 스크롤 → 줄바꿈 그리드(카드가 넉넉해 교재가 여러 권인 칸도 안 잘림) +
 * 칸마다 다른 강조색(LINEUP_ACCENTS) + 단계 번호 칩으로 난이도 순서를 눈에 보이게.
 */
export function LineupCard({
  placement,
  lineupBookIds,
  isFree,
  publicMode,
}: {
  placement: ReturnType<typeof resolveLineupPlacement>;
  lineupBookIds: Record<string, string>;
  isFree: boolean;
  publicMode: boolean;
}) {
  /** 교재별 CTA — 유료는 해당 교재로, 비로그인은 가입, 무료는 결제로 (선택한 흐름 그대로 퍼널 연결) */
  const bookHref = (title: string) => {
    if (publicMode) return '/signup?next=/student/voca/diagnostic';
    if (isFree) return '/allkill#price';
    const id = lineupBookIds[title];
    return id ? `/student/voca?bookId=${id}` : '/student/voca';
  };

  // 비활성 교재만 있는 칸은 숨긴다 — 단계 번호는 "보이는 칸" 기준으로 매겨야 1,2,3…이 안 끊긴다
  const columns = DIAGNOSTIC_LINEUP.map((column) => ({
    column,
    books: column.bookTitles.filter((t) => lineupBookIds[t]),
    anchors: column.anchorTitles.filter((t) => lineupBookIds[t]),
  })).filter((c) => c.books.length > 0 || c.anchors.length > 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="voca-display text-base" style={{ color: VOCA_COLORS.ink, fontWeight: 700 }}>교재 라인업</p>
      <p className="mt-1 text-xs" style={{ color: VOCA_COLORS.gray }}>
        쉬운 순서대로 1번부터 — 칸 안에서는 원하는 교재를 골라도 돼요
      </p>
      {/* items-start — 교재 수가 다른 칸이 같은 높이로 늘어나 빈칸이 생기는 것 방지 */}
      <div className="mt-4 grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {columns.map(({ column, books, anchors }, step) => {
          const isMine = column.key === placement.columnKey;
          const accent = LINEUP_ACCENTS[column.key];
          return (
            <div
              key={column.key}
              className={cn(
                'overflow-hidden rounded-xl border bg-white',
                isMine ? 'border-2' : 'border-gray-200',
              )}
              style={isMine ? { borderColor: accent.vivid } : undefined}
            >
              {/* 칸 색은 상단 바로만 — 파스텔 배경을 채우지 않아 인쇄물처럼 담백하게 */}
              <div className="h-1" style={{ background: accent.vivid }} />
              <div className="flex items-baseline gap-1.5 px-3.5 pb-2 pt-3">
                <span className="voca-display text-sm" style={{ color: accent.deep, fontWeight: 700 }}>
                  {step + 1}
                </span>
                <span
                  className="voca-display whitespace-nowrap text-base"
                  style={{ color: VOCA_COLORS.ink, fontWeight: 700 }}
                >
                  {column.gradeLabel}
                </span>
                {isMine && (
                  <span className="ml-auto whitespace-nowrap text-[11px] font-bold" style={{ color: accent.deep }}>
                    내 시작 칸
                  </span>
                )}
              </div>

              {/* 교재 목록 — 행 전체가 링크다 ("이 교재로 시작 →" 반복 문구 제거) */}
              <div className="border-t border-gray-100">
                {books.map((title, i) => {
                  const isRecommended = isMine && title === placement.highlightTitle;
                  return (
                    <Link
                      key={title}
                      href={bookHref(title)}
                      onClick={() => track('diagnostic_lineup_book_click', { title, recommended: isRecommended })}
                      className="flex items-baseline gap-2 border-b border-gray-100 px-3.5 py-2.5 transition-colors last:border-b-0 hover:bg-gray-50"
                    >
                      <span
                        className={cn('flex-1 text-[13px] leading-snug', i === 0 ? 'font-bold' : 'font-medium')}
                        style={{ color: i === 0 ? VOCA_COLORS.ink : VOCA_COLORS.gray, wordBreak: 'keep-all' }}
                      >
                        {shortBookTitle(title)}
                      </span>
                      {isRecommended && (
                        <span
                          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                          style={{ background: accent.deep }}
                        >
                          추천
                        </span>
                      )}
                    </Link>
                  );
                })}

                {/*
                  우리 교재(초등 800·교과서 단어) — 칸의 수준을 가늠하는 자리지만 라벨은 붙이지 않는다
                  ("기준점 · 이 칸 수준"이 어색하다는 사장님 지적, 2026-08-12).
                  맨 아래에 "○○ 외우기"라는 행동 문구로만 둔다.
                */}
                {anchors.length > 0 && (
                  <div className="bg-gray-50/60">
                    {anchors.map((title) => (
                      <Link
                        key={title}
                        href={bookHref(title)}
                        onClick={() => track('diagnostic_lineup_book_click', { title, recommended: false, anchor: true })}
                        className="block border-t border-gray-100 px-3.5 py-2 text-[12px] font-medium leading-snug transition-colors hover:bg-gray-100"
                        style={{ color: VOCA_COLORS.gray, wordBreak: 'keep-all' }}
                      >
                        {shortBookTitle(title)} 외우기
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
