'use client';

import { createContext, useContext, useState, useMemo } from 'react';
import { calculateStageStatuses } from '@/lib/naesin/stage-unlock';
import {
  isNaesinUnitComplete,
  computeNaesinStats,
  getNaesinStagesSimple,
} from '@/lib/dashboard/naesin-helpers';
import type { NaesinStage } from '@/lib/dashboard/naesin-helpers';
import {
  getR1Stages,
  getR2Stages,
  isR1Complete,
  isR2Complete,
  computeVocaStats,
} from '@/lib/dashboard/voca-helpers';
import type { VocaStage } from '@/lib/dashboard/voca-helpers';
import type { VocaDay, VocaStudentProgress } from '@/types/voca';
import type {
  NaesinUnit,
  NaesinStudentProgress,
  NaesinStageStatuses,
  NaesinContentAvailability,
  NaesinExamAssignment,
} from '@/types/naesin';

// ── Props (same as CombinedDashboard) ──

export interface DashboardProps {
  userName: string;
  vocaDays: VocaDay[];
  vocaProgressList: VocaStudentProgress[];
  textbookName: string;
  naesinUnits: NaesinUnit[];
  naesinProgressList: NaesinStudentProgress[];
  examAssignments: NaesinExamAssignment[];
  contentMap: Record<string, NaesinContentAvailability>;
  vocabQuizSetCounts: Record<string, number>;
  grammarVideoCounts: Record<string, number>;
  enabledStages?: string[];
  wrongWordCounts?: Record<string, number>;
  vocaQuizHistory?: { date: string; score: number }[];
  naesinQuizHistory?: { date: string; score: number }[];
}

// ── Context value ──

export interface DashboardContextValue {
  activeTab: 'voca' | 'naesin';
  setActiveTab: (tab: 'voca' | 'naesin') => void;

  // Header
  userName: string;
  textbookName: string;

  // Charts
  vocaQuizHistory: { date: string; score: number }[];
  naesinQuizHistory: { date: string; score: number }[];

  // Stats
  vocaDaysCount: number;
  sortedUnitsCount: number;
  r1CompletedStages: number;
  naesinCompletedStages: number;
  vocaAvgScore: number;
  naesinCompletedUnits: number;
  naesinAvgVocab: number;
  nearestDDay: number | null;

  // Voca tab
  currentVocaDay: VocaDay | undefined;
  r1Stages: VocaStage[];
  r2Stages: VocaStage[];
  r1Done: boolean;
  vocaCtaStage: VocaStage | undefined;
  vocaCtaRound: string;
  wrongWordEntries: [string, number][];
  currentBookDays: VocaDay[];
  vocaProgressMap: Map<string, VocaStudentProgress>;

  // Naesin tab
  currentUnit: NaesinUnit | undefined;
  currentNaesinStages: NaesinStage[];
  naesinCtaStage: NaesinStage | undefined;
  sortedUnits: NaesinUnit[];
  statusesMap: Map<string, NaesinStageStatuses>;
  examAssignments: NaesinExamAssignment[];
  naesinUnits: NaesinUnit[];
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboardContext() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboardContext must be used within DashboardProvider');
  return ctx;
}

export function DashboardProvider({
  children,
  ...props
}: DashboardProps & { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<'voca' | 'naesin'>('voca');

  const value = useMemo<DashboardContextValue>(() => {
    const {
      userName, textbookName, vocaDays, vocaProgressList,
      naesinUnits, naesinProgressList, examAssignments,
      contentMap, vocabQuizSetCounts, grammarVideoCounts,
      enabledStages, wrongWordCounts = {},
      vocaQuizHistory = [], naesinQuizHistory = [],
    } = props;

    // ── Voca ──
    const vocaProgressMap = new Map<string, VocaStudentProgress>();
    vocaProgressList.forEach((p) => vocaProgressMap.set(p.day_id, p));

    const sortedDays = [...vocaDays].sort((a, b) => a.sort_order - b.sort_order);
    const currentVocaDay = sortedDays.find((d) => {
      const p = vocaProgressMap.get(d.id) ?? null;
      return !isR1Complete(p) || !isR2Complete(p);
    }) ?? sortedDays[0];

    const currentVocaProgress = currentVocaDay ? (vocaProgressMap.get(currentVocaDay.id) ?? null) : null;
    const r1Stages = currentVocaProgress !== undefined ? getR1Stages(currentVocaProgress) : [];
    const r1Done = isR1Complete(currentVocaProgress);
    const r2Stages = currentVocaProgress !== undefined ? getR2Stages(currentVocaProgress) : [];

    const vocaActiveR1 = r1Stages.find((s) => s.status === 'active');
    const vocaActiveR2 = r2Stages.find((s) => s.status === 'active');
    const vocaCtaStage = vocaActiveR1 ?? vocaActiveR2;
    const vocaCtaRound = vocaActiveR1 ? '1' : '2';

    const { r1CompletedStages, avgQuizScore: vocaAvgScore, wrongWordEntries } =
      computeVocaStats(vocaProgressList, wrongWordCounts);

    const currentBookId = currentVocaDay?.book_id;
    const currentBookDays = sortedDays.filter((d) => d.book_id === currentBookId);

    // ── Naesin ──
    const naesinProgressMap = new Map<string, NaesinStudentProgress>();
    naesinProgressList.forEach((p) => naesinProgressMap.set(p.unit_id, p));

    const sortedUnits = [...naesinUnits].sort((a, b) => a.sort_order - b.sort_order);

    const statusesMap = new Map<string, NaesinStageStatuses>();
    for (const unit of sortedUnits) {
      const progress = naesinProgressMap.get(unit.id) ?? null;
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

    const currentUnit = sortedUnits.find((u) => {
      const s = statusesMap.get(u.id);
      return s && !isNaesinUnitComplete(s);
    }) ?? sortedUnits[0];

    const currentNaesinStatuses = currentUnit ? statusesMap.get(currentUnit.id) : undefined;
    const currentNaesinProgress = currentUnit ? (naesinProgressMap.get(currentUnit.id) ?? null) : null;
    const currentNaesinStages = currentNaesinStatuses ? getNaesinStagesSimple(currentNaesinStatuses, currentNaesinProgress) : [];
    const naesinCtaStage = currentNaesinStages.find((s) => s.status === 'active');

    const {
      completedStages: naesinCompletedStages,
      completedUnits: naesinCompletedUnits,
      avgVocabScore: naesinAvgVocab,
      nearestDDay,
    } = computeNaesinStats(naesinProgressList, statusesMap, sortedUnits, examAssignments);

    return {
      activeTab, setActiveTab,
      userName, textbookName,
      vocaQuizHistory, naesinQuizHistory,
      vocaDaysCount: vocaDays.length,
      sortedUnitsCount: sortedUnits.length,
      r1CompletedStages, naesinCompletedStages,
      vocaAvgScore, naesinCompletedUnits, naesinAvgVocab, nearestDDay,
      currentVocaDay, r1Stages, r2Stages, r1Done,
      vocaCtaStage, vocaCtaRound, wrongWordEntries, currentBookDays, vocaProgressMap,
      currentUnit, currentNaesinStages, naesinCtaStage,
      sortedUnits, statusesMap, examAssignments, naesinUnits,
    };
  }, [props, activeTab, setActiveTab]);

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
