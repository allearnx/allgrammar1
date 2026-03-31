'use client';

import Link from 'next/link';
import {
  CheckCircle,
  BookOpen,
  BookMarked,
  ClipboardList,
  Sparkles,
  ArrowRight,
  CalendarDays,
  Layers,
} from 'lucide-react';
import { BRAND } from '@/lib/utils/brand-colors';
import { MiniScoreTrend } from '@/components/charts/mini-score-trend';
import { StatCard } from '@/components/shared/stat-card';
import { VocaTabContent } from './combined/voca-tab-content';
import { NaesinTabContent } from './combined/naesin-tab-content';
import { DashboardProvider, useDashboardContext } from './combined/dashboard-context';
import type { DashboardProps } from './combined/dashboard-context';

const COLORS = {
  header: BRAND.violetLight,
  bannerBadgeBorder: BRAND.teal,
  statMint: BRAND.mint,
  statPurple: BRAND.violet,
  statAmber: BRAND.amber,
  statSky: BRAND.cyan,
};

export function CombinedDashboard(props: DashboardProps) {
  return (
    <DashboardProvider {...props}>
      <DashboardContent />
    </DashboardProvider>
  );
}

function DashboardContent() {
  const {
    activeTab, setActiveTab,
    userName, textbookName, nearestDDay,
    vocaDaysCount, sortedUnitsCount,
    r1CompletedStages, naesinCompletedStages,
    vocaAvgScore, naesinCompletedUnits, naesinAvgVocab,
    vocaQuizHistory, naesinQuizHistory,
  } = useDashboardContext();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ── Header Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white"
        style={{ background: COLORS.header }}
      >
        <h2 className="text-2xl md:text-3xl font-bold">안녕하세요, {userName}님!</h2>
        <p className="mt-1 text-white/80">오늘도 영어 학습을 시작해볼까요?</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white" style={{ border: `1.5px solid ${COLORS.bannerBadgeBorder}`, background: 'rgba(255,255,255,0.15)' }}>
            올킬보카
          </span>
          <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white" style={{ border: `1.5px solid ${COLORS.bannerBadgeBorder}`, background: 'rgba(255,255,255,0.15)' }}>
            {textbookName}
          </span>
          {nearestDDay !== null && (
            <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold text-white" style={{ border: `1.5px solid ${COLORS.bannerBadgeBorder}`, background: 'rgba(255,255,255,0.15)' }}>
              {nearestDDay === 0 ? 'D-Day' : `D-${nearestDDay}`}
            </span>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="보카 완료" value={r1CompletedStages} sub={`전체 ${vocaDaysCount * 4}단계 중`} color={COLORS.statMint} icon={<CheckCircle className="h-5 w-5" />} />
        <StatCard label="내신 완료" value={naesinCompletedStages} sub={`전체 ${sortedUnitsCount * 5}단계 중`} color={COLORS.statPurple} icon={<Layers className="h-5 w-5" />} />
        <StatCard label="보카 퀴즈" value={vocaAvgScore > 0 ? `${vocaAvgScore}점` : '-'} sub="퀴즈 평균" color={COLORS.statAmber} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard label="내신 단원" value={`${naesinCompletedUnits}/${sortedUnitsCount}`} sub="완료 단원" color={COLORS.statSky} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="내신 단어" value={naesinAvgVocab > 0 ? `${naesinAvgVocab}점` : '-'} sub="퀴즈 + 스펠링 평균" color={COLORS.statPurple} icon={<Sparkles className="h-5 w-5" />} />
        <StatCard label="시험 D-day" value={nearestDDay !== null ? (nearestDDay === 0 ? 'D-Day' : `D-${nearestDDay}`) : '-'} sub={nearestDDay !== null ? '가장 가까운 시험' : '시험 일정 없음'} color={COLORS.statAmber} icon={<CalendarDays className="h-5 w-5" />} />
      </div>

      {/* ── Tab Buttons ── */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('voca')}
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
            activeTab === 'voca'
              ? 'text-[#7C3AED] font-bold border-b-2 border-[#7C3AED]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BookOpen className="mr-1.5 inline h-4 w-4" />올킬보카
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('naesin')}
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
            activeTab === 'naesin'
              ? 'text-[#7C3AED] font-bold border-b-2 border-[#7C3AED]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BookMarked className="mr-1.5 inline h-4 w-4" />내신대비
        </button>
      </div>

      {/* ── Mini Charts + Report Link ── */}
      <div className="rounded-2xl border bg-white p-5 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">점수 추이</h3>
          <Link href="/student/my-report" className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline">
            자세히 보기 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500 mb-1">보카 퀴즈</p>
            <MiniScoreTrend data={vocaQuizHistory} color="#7C3AED" height={56} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">내신 문제풀이</p>
            <MiniScoreTrend data={naesinQuizHistory} color="#06B6D4" height={56} />
          </div>
        </div>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'voca' && <VocaTabContent />}
      {activeTab === 'naesin' && <NaesinTabContent />}
    </div>
  );
}
