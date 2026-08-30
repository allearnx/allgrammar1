'use client';

import Link from 'next/link';
import {
  CheckCircle,
  BookOpen,
  ClipboardList,
  CalendarDays,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { BRAND } from '@/lib/utils/brand-colors';
import { calculateStageStatuses } from '@/lib/naesin/stage-unlock';
import {
  getDDay,
  isNaesinUnitComplete,
  computeNaesinStats,
  getNaesinStagesForUnit,
} from '@/lib/dashboard/naesin-helpers';
import { MiniScoreTrend } from '@/components/charts/mini-score-trend';
import { TopicWeaknessCard } from './topic-weakness-card';
import { ReviewAlertCard } from './review-alert-card';
import { StatCard } from '@/components/shared/stat-card';
import { UnitProgressList } from './naesin/unit-progress-list';
import { ExamScopeList } from './naesin/exam-scope-list';
import { LearningFlowSection } from './naesin/learning-flow-section';
import { LearningOrderModal } from '@/components/naesin/learning-order-modal';
import { BannerBadge } from './shared/banner-badge';
import { useStreak } from '@/hooks/use-streak';
import type {
  NaesinUnit,
  NaesinStudentProgress,
  NaesinStageStatuses,
  NaesinContentAvailability,
  NaesinExamAssignment,
} from '@/types/naesin';

interface Props {
  userName: string;
  textbookName: string;
  units: NaesinUnit[];
  progressList: NaesinStudentProgress[];
  examAssignments: NaesinExamAssignment[];
  contentMap: Record<string, NaesinContentAvailability>;
  vocabQuizSetCounts: Record<string, number>;
  grammarVideoCounts: Record<string, number>;
  enabledStages?: string[];
  quizHistory?: { date: string; score: number }[];
  isPaid?: boolean;
}

// ── Colors ──

const COLORS = {
  header: BRAND.violetLight,
  statMint: BRAND.mint,
  statPurple: BRAND.violet,
  statAmber: BRAND.amber,
  statSky: '#EA4335', // 구글 4색 로테이션의 red 슬롯
  stepDone: { bg: BRAND.step.defaultBg, border: BRAND.step.doneBorder },
  progressDone: BRAND.progress.done,
  progressActive: BRAND.progress.active,
};

// ── Component ──

export function NaesinDashboard({
  userName,
  textbookName,
  units,
  progressList,
  examAssignments,
  contentMap,
  vocabQuizSetCounts,
  grammarVideoCounts,
  enabledStages,
  quizHistory = [],
  isPaid = false,
}: Props) {
  const progressMap = new Map<string, NaesinStudentProgress>();
  progressList.forEach((p) => progressMap.set(p.unit_id, p));

  const sortedUnits = [...units].sort((a, b) => a.sort_order - b.sort_order);

  // Calculate stage statuses per unit
  const statusesMap = new Map<string, NaesinStageStatuses>();
  for (const unit of sortedUnits) {
    const progress = progressMap.get(unit.id) ?? null;
    const content = contentMap[unit.id] ?? {
      hasVocab: false, hasPassage: false, hasDialogue: false, hasTextbookVideo: false, hasGrammar: false, hasProblem: false, hasMockExam: false, hasLastReview: false,
    };
    const assignment = examAssignments.find((a) => a.unit_ids.includes(unit.id));
    const examDate = assignment?.exam_date ?? null;

    const statuses = calculateStageStatuses({
      progress,
      content,
      vocabQuizSetCount: vocabQuizSetCounts[unit.id] ?? 0,
      grammarVideoCount: grammarVideoCounts[unit.id] ?? 0,
      examDate,
      enabledStages,
    });
    statusesMap.set(unit.id, statuses);
  }

  // Find current active unit
  const currentUnit = sortedUnits.find((u) => {
    const s = statusesMap.get(u.id);
    return s && !isNaesinUnitComplete(s);
  }) ?? sortedUnits[0];

  const currentStatuses = currentUnit ? statusesMap.get(currentUnit.id) : undefined;
  const currentProgress = currentUnit ? (progressMap.get(currentUnit.id) ?? null) : null;
  const currentGrammarVideoCount = currentUnit ? (grammarVideoCounts[currentUnit.id] ?? 0) : 0;
  const currentStages = currentStatuses ? getNaesinStagesForUnit(currentStatuses, currentProgress, currentGrammarVideoCount) : [];
  const ctaStage = currentStages.find((s) => s.status === 'active');

  // Stats
  const streak = useStreak();
  const { completedStages, completedUnits, avgVocabScore, nearestDDay } =
    computeNaesinStats(progressList, statusesMap, sortedUnits, examAssignments);

  const currentAssignment = currentUnit
    ? examAssignments.find((a) => a.unit_ids.includes(currentUnit.id))
    : undefined;
  const currentDDay = currentAssignment ? getDDay(currentAssignment.exam_date) : null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ── Header Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border bg-white p-6 md:p-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">안녕하세요, {userName}님!</h2>
        <p className="mt-1 text-gray-500">내신 시험을 완벽하게 준비해볼까요?</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <BannerBadge>{textbookName}</BannerBadge>
          {currentUnit && (
            <BannerBadge>현재: {currentUnit.title}</BannerBadge>
          )}
          {currentDDay !== null && currentDDay >= 0 && (
            <BannerBadge bold>{currentDDay === 0 ? 'D-Day' : `D-${currentDDay}`}</BannerBadge>
          )}
          {streak > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold bg-amber-400/90 text-amber-900">
              <Flame className="h-3.5 w-3.5" />
              {streak}일 연속
            </span>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="완료 단계" value={completedStages} sub={`전체 ${sortedUnits.length * 7}단계 중`} color={COLORS.statMint} icon={<CheckCircle className="h-5 w-5" />} />
        <StatCard label="완료 단원" value={completedUnits} sub={`전체 ${sortedUnits.length}단원 중`} color={COLORS.statPurple} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="단어 평균" value={avgVocabScore > 0 ? `${avgVocabScore}점` : '-'} sub="퀴즈 + 스펠링 평균" color={COLORS.statAmber} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard label="시험 D-day" value={nearestDDay !== null ? (nearestDDay === 0 ? 'D-Day' : `D-${nearestDDay}`) : '-'} sub={nearestDDay !== null ? '가장 가까운 시험' : '시험 일정 없음'} color={COLORS.statSky} icon={<CalendarDays className="h-5 w-5" />} />
      </div>

      {/* ── Mini Chart + Report Link ── */}
      <div className="rounded-2xl border bg-white p-5 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">문제풀이 점수 추이</h3>
          <Link href="/student/progress" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
            자세히 보기 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <MiniScoreTrend data={quizHistory} color="#06B6D4" height={64} />
      </div>

      {/* ── Topic Weakness Card ── */}
      <TopicWeaknessCard />
      <ReviewAlertCard />

      {/* ── Learning Flow: Current Unit ── */}
      {currentUnit && currentStages.length > 0 && (
        <LearningFlowSection
          currentUnit={currentUnit}
          currentStages={currentStages}
          ctaStage={ctaStage}
          currentDDay={currentDDay}
        />
      )}

      {/* ── Bottom: Unit Progress + Exam Scope ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UnitProgressList
          sortedUnits={sortedUnits}
          statusesMap={statusesMap}
          currentUnitId={currentUnit?.id}
          progressDone={COLORS.progressDone}
          progressActive={COLORS.progressActive}
        />
        <ExamScopeList
          examAssignments={examAssignments}
          units={units}
          stepDoneBorder={COLORS.stepDone.border}
        />
      </div>

      {isPaid && <LearningOrderModal />}
    </div>
  );
}
