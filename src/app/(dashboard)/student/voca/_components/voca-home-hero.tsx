'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { VocaHeroLetters, VOCA_COLORS } from '@/components/voca/voca-brand';
import { ParentLinkButton } from '@/components/voca/parent-link-button';
import { CoverageGauge } from '@/components/voca/coverage-gauge';

/** 히어로 배너 — /allkill 랜딩 톤: 파스텔 하늘 + 알파벳 카펫 + GmarketSans. 교재명·진행 바·이용권·커버리지 */
export function VocaHomeHero({ bookId, title, round2Locked, round2FreeDays = 0, freeDayLimit, expiry, canSwitchBook, onOpenGuide, totalDays, completedCount }: {
  bookId: string;
  title: string | undefined;
  round2Locked: boolean;
  round2FreeDays?: number;
  freeDayLimit: number;
  expiry: { label: string; urgent: boolean } | null;
  canSwitchBook: boolean;
  onOpenGuide: () => void;
  totalDays: number;
  completedCount: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl p-6 md:p-8" style={{ background: VOCA_COLORS.sky }}>
      <VocaHeroLetters />
      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <p className="voca-display text-xs font-bold tracking-widest uppercase" style={{ color: VOCA_COLORS.blueDark }}>AllKill Voca</p>
          {/* 2026-07-22 완전 개방 — 회독은 Day 화면에서 자유 전환이므로 고정 배지 대신 안내 칩 */}
          {!round2Locked && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-primary">
              1·2회독 자유
            </span>
          )}
          {expiry && (
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              expiry.urgent ? 'bg-[#FCE8E6] text-[#A50E0E]' : 'bg-white/70 text-gray-500'
            }`}>
              이용권 {expiry.label}
            </span>
          )}
          {expiry?.urgent && (
            <Link href="/allkill#price" className="text-[11px] font-bold text-primary underline underline-offset-2">
              연장하기
            </Link>
          )}
          {round2Locked && round2FreeDays > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-primary">
              Day 1~{round2FreeDays} 1·2회독 무료
            </span>
          )}
          {round2Locked && round2FreeDays === 0 && freeDayLimit > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/70 text-gray-400">
              2회독 🔒 유료
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <ParentLinkButton />
            {canSwitchBook && (
              <button
                onClick={onOpenGuide}
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary shadow-sm transition-all hover:shadow"
              >
                <BookOpen className="h-3 w-3" /> 교재 바꾸기
              </button>
            )}
          </div>
        </div>
        <h1 className="voca-display text-2xl md:text-3xl leading-tight mb-1" style={{ color: VOCA_COLORS.ink, fontWeight: 700, wordBreak: 'keep-all' }}>
          {title || '올킬보카'}<span style={{ color: VOCA_COLORS.blue }}>.</span>
        </h1>
        {totalDays > 0 && (
          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 h-2 rounded-full bg-white overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${totalDays > 0 ? (completedCount / totalDays) * 100 : 0}%` }}
              />
            </div>
            <span className="text-sm font-bold tabular-nums" style={{ color: VOCA_COLORS.blueDark }}>
              {completedCount}/{totalDays}
            </span>
          </div>
        )}
        {/* 시험 커버리지 — 진도율과 별개: 아는 단어 기준으로 이 시험이 몇 % 읽히는지 */}
        {bookId && <CoverageGauge bookId={bookId} />}
      </div>
    </div>
  );
}
