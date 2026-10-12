'use client';

import Link from 'next/link';
import { track } from '@vercel/analytics';
import { VOCA_COLORS } from '@/lib/voca/brand-tokens';
import { recommendBandKey, type BandKey, type FinalLevel } from '@/lib/voca/diagnostic-bands';
import { LINEUP_ACCENTS, resolveLineupPlacement, lineupColumnGap } from '@/lib/voca/diagnostic-lineup';
import { VocaBrandStyle } from '@/components/voca/voca-brand';
import { LineupCard } from './lineup-card';
import type { LatestDiagnostic, SubmitResponse } from './types';

/**
 * 결과 화면 — "○○ 수준" 학년 주장 없이 "지금 시작할 교재" 라인업 프레임 (2026-07-23 확정).
 * 학년 라벨은 칸 헤더로 교재를 설명할 뿐, 아이는 시작 위치만 받는다.
 */
export function ResultScreen({
  res,
  previous,
  isFree,
  activeBands,
  lineupBookIds,
  publicMode = false,
}: {
  res: SubmitResponse;
  previous: LatestDiagnostic | null;
  isFree: boolean;
  activeBands: BandKey[];
  lineupBookIds: Record<string, string>;
  publicMode?: boolean;
}) {
  const recBand = recommendBandKey(res.level, activeBands, res.finalBandScore);
  // 확정 밴드를 60% 이상 알아서 한 칸 위 교재가 추천된 경우 — 근거 문구 표시용
  const bumpedUp = recBand !== recommendBandKey(res.level, activeBands);
  // 활성 교재 인지 폴백 — 추천 교재가 비활성(예: 검수 중)이면 오른쪽 첫 활성 교재로
  const placement = resolveLineupPlacement(recBand, lineupBookIds);
  // 화면 전체를 내 칸 색으로 물들인다 — 히어로·CTA가 라인업의 내 칸과 같은 색 (파랑 일색 탈피)
  const accent = LINEUP_ACCENTS[placement.columnKey];
  const missed = res.missed ?? [];
  const missedCount = res.missedCount ?? missed.length;
  const delta = previous ? res.coverageScore - previous.coverageScore : null;
  // 재진단 칸 비교 — 지난 진단의 추천 칸 대비 몇 칸 이동했는지 (내려간 경우는 언급하지 않는다:
  // 출제 풀 조정으로도 내려갈 수 있어 delta 오해 소지, 정답률 %p가 이미 변화를 말해준다)
  const columnGap = previous
    ? lineupColumnGap(
        recommendBandKey(
          { band: previous.finalBand as BandKey, qualifier: previous.finalQualifier as FinalLevel['qualifier'] },
          activeBands,
          previous.finalBandScore,
        ),
        recBand,
      )
    : 0;

  return (
    // 라인업이 6칸이라 결과 화면만 넓게 — 좁으면 교재명이 잘게 쪼개진다 (2026-08-12 피드백)
    <div className="mx-auto max-w-lg space-y-4 lg:max-w-3xl">
      <VocaBrandStyle />
      {/*
        히어로 — 파스텔 카드 + 이모지 + 튀어오르는 애니메이션은 걷어냈다
        ("AI스러운 요소 싹 빼줘", 2026-08-12). 흰 바탕에 상단 색 바만 두고
        제목은 브랜드 폰트(GmarketSans)로. 색은 내 칸 색을 따라간다.
      */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="h-1.5" style={{ background: accent.vivid }} />
        <div className="px-6 py-7 text-center md:px-8">
          <p className="text-xs font-bold tracking-wide" style={{ color: accent.deep }}>
            진단 완료 · 지금 시작할 교재
          </p>
          <p
            className="voca-display mt-2 text-3xl leading-tight"
            style={{ color: VOCA_COLORS.ink, fontWeight: 700, wordBreak: 'keep-all' }}
          >
            {placement.highlightTitle}
          </p>
          <p className="mt-2.5 text-sm" style={{ color: VOCA_COLORS.gray }}>
            여기서 시작해서 한 칸씩 올라가요
          </p>
          {bumpedUp && (
            <p className="mt-1.5 text-sm font-semibold" style={{ color: accent.deep, wordBreak: 'keep-all' }}>
              아래 단계 단어는 이미 {res.finalBandScore}% 알고 있어서 건너뛰었어요
            </p>
          )}
          {/* 천일문 추천 근거 한 줄 — 교과서 단어 DB 교차 분석 (중1 교과서 단어 40% 수록) */}
          {placement.highlightTitle === '천일문 보카 중등 스타트' && (
            <p className="mt-1.5 text-sm font-semibold" style={{ color: accent.deep, wordBreak: 'keep-all' }}>
              이 교재에는 중1 교과서 단어의 40%가 담겨 있어요
            </p>
          )}

          {/* 정답률 — 카드 안 카드(중첩 상자) 대신 구분선 아래 한 줄로 */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="text-sm" style={{ color: VOCA_COLORS.gray }}>이 단계 단어 정답률</p>
            <p className="voca-display mt-1 text-4xl tabular-nums" style={{ color: VOCA_COLORS.ink, fontWeight: 700 }}>
              {res.coverageScore}%
            </p>
            <p className="mt-1.5 text-sm" style={{ color: VOCA_COLORS.gray }}>몰랐던 단어 {missedCount}개</p>
            {delta !== null && (
              <p className="mt-1 text-sm font-bold" style={{ color: delta >= 0 ? VOCA_COLORS.greenDark : VOCA_COLORS.red }}>
                지난 진단 대비 정답률 {delta >= 0 ? '+' : ''}{delta}%p
              </p>
            )}
            {columnGap > 0 && (
              <p className="mt-1 text-sm font-bold" style={{ color: VOCA_COLORS.greenDark }}>
                {columnGap === 1 ? '지난 진단보다 한 칸 올라갔어요' : `지난 진단보다 ${columnGap}칸 올라갔어요`}
              </p>
            )}
          </div>
        </div>
      </div>

      <LineupCard placement={placement} lineupBookIds={lineupBookIds} isFree={isFree} publicMode={publicMode} />

      {missed.length > 0 && (
        <div className="rounded-2xl border bg-white p-5">
          <p className="mb-3 text-sm font-bold" style={{ color: VOCA_COLORS.gray }}>이런 단어를 놓쳤어요</p>
          <ul className="space-y-2">
            {missed.map((it) => (
              <li key={it.front_text} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-bold" style={{ color: VOCA_COLORS.ink }}>{it.front_text}</span>
                <span className="text-right text-gray-500">{it.back_text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-5 text-center">
        {publicMode ? (
          <>
            <Link
              href="/signup?next=/student/voca/diagnostic"
              onClick={() => track('diagnostic_result_signup_click')}
              className="voca-cta inline-block rounded-full px-8 py-3 font-bold"
            >
              가입하고 추천 교재로 시작하기
            </Link>
            <p className="mt-2 text-xs text-gray-500">가입하면 이 결과가 계정에 저장되고, 추천 교재부터 바로 학습해요</p>
          </>
        ) : isFree ? (
          <>
            <Link
              href="/allkill#price"
              onClick={() => track('checkout_click', { source: 'diagnostic_result' })}
              className="voca-cta inline-block rounded-full px-8 py-3 font-bold"
            >
              올킬보카 시작하기
            </Link>
            <p className="mt-2 text-xs text-gray-500">시작하면 추천 교재부터 바로 학습할 수 있어요</p>
          </>
        ) : (
          <Link
            href={
              lineupBookIds[placement.highlightTitle]
                ? `/student/voca?bookId=${lineupBookIds[placement.highlightTitle]}`
                : '/student/voca'
            }
            className="voca-cta inline-block rounded-full px-8 py-3 font-bold"
          >
            추천 교재로 시작하기
          </Link>
        )}
      </div>
    </div>
  );
}
