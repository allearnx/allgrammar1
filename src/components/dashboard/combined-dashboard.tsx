'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  Lock,
  BookOpen,
  ClipboardList,
  Sparkles,
  ArrowLeftRight,
  ArrowRight,
  CalendarDays,
  Layers,
  PenLine,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { calculateStageStatuses } from '@/lib/naesin/stage-unlock';
import type { VocaBook, VocaDay, VocaStudentProgress } from '@/types/voca';
import type {
  NaesinUnit,
  NaesinStudentProgress,
  NaesinStageStatus,
  NaesinStageStatuses,
  NaesinContentAvailability,
  NaesinExamAssignment,
} from '@/types/naesin';

// ── Types ──

type StageStatus = 'done' | 'active' | 'locked';

interface VocaStage {
  key: string;
  label: string;
  status: StageStatus;
  icon: React.ReactNode;
  description: string;
}

interface NaesinStage {
  key: string;
  label: string;
  stageKey: string;
  status: StageStatus;
  icon: React.ReactNode;
  description: string;
}

interface Props {
  userName: string;
  vocaBooks: VocaBook[];
  vocaDays: VocaDay[];
  vocaProgressList: VocaStudentProgress[];
  vocaWordCount: number;
  textbookName: string;
  naesinUnits: NaesinUnit[];
  naesinProgressList: NaesinStudentProgress[];
  examAssignments: NaesinExamAssignment[];
  contentMap: Record<string, NaesinContentAvailability>;
  vocabQuizSetCounts: Record<string, number>;
  grammarVideoCounts: Record<string, number>;
  enabledStages?: string[];
}

// ── Colors ──

const COLORS = {
  header: '#A78BFA',
  bannerBadgeBorder: '#4DD9C0',
  statMint: '#56C9A0',
  statPurple: '#7C3AED',
  statAmber: '#F59E0B',
  statSky: '#06B6D4',
  stepDefault: { bg: '#D9F7FC', border: '#CCFAF4' },
  stepActive: { bg: '#FFFFFF', border: '#7C3AED' },
  stepDone: { bg: '#D9F7FC', border: '#4DD9C0' },
  activeLabel: '#7C3AED',
  ctaButton: '#7C3AED',
  progressDone: '#56C9A0',
  progressActive: '#7C3AED',
};

// ── Voca Helpers ──

function getR1Stages(p: VocaStudentProgress | null): VocaStage[] {
  const fc = p?.flashcard_completed ?? false;
  const quizPass = (p?.quiz_score ?? 0) >= 80;
  const spellPass = (p?.spelling_score ?? 0) >= 80;
  const matchDone = p?.matching_completed ?? false;

  const quizStatus: StageStatus = quizPass ? 'done' : fc ? 'active' : 'locked';
  const spellStatus: StageStatus = spellPass ? 'done' : quizPass ? 'active' : 'locked';
  const matchStatus: StageStatus = matchDone ? 'done' : spellPass ? 'active' : 'locked';

  return [
    { key: 'flashcard', label: '플래시카드', status: fc ? 'done' : 'active', icon: <BookOpen className="h-6 w-6" />, description: '단어 카드를 넘기며 학습' },
    { key: 'quiz', label: '퀴즈', status: quizStatus, icon: <ClipboardList className="h-6 w-6" />, description: '4지선다 객관식 테스트' },
    { key: 'spelling', label: '스펠링', status: spellStatus, icon: <Sparkles className="h-6 w-6" />, description: '빈칸에 스펠링 입력' },
    { key: 'matching', label: '매칭', status: matchStatus, icon: <ArrowLeftRight className="h-6 w-6" />, description: '유의어/반의어 매칭' },
  ];
}

function isR1Complete(p: VocaStudentProgress | null): boolean {
  if (!p) return false;
  return (
    p.flashcard_completed &&
    (p.quiz_score ?? 0) >= 80 &&
    (p.spelling_score ?? 0) >= 80 &&
    p.matching_completed
  );
}

function getR2Stages(p: VocaStudentProgress | null): VocaStage[] {
  const r1Done = isR1Complete(p);
  const fc2 = p?.round2_flashcard_completed ?? false;
  const quiz2Pass = (p?.round2_quiz_score ?? 0) >= 80;
  const match2Done = p?.round2_matching_completed ?? false;

  if (!r1Done) {
    return [
      { key: 'r2_flashcard', label: '플래시카드', status: 'locked', icon: <BookOpen className="h-6 w-6" />, description: '2회독 복습 카드' },
      { key: 'r2_quiz', label: '종합문제', status: 'locked', icon: <ClipboardList className="h-6 w-6" />, description: '종합 퀴즈' },
      { key: 'r2_matching', label: '심화매칭', status: 'locked', icon: <ArrowLeftRight className="h-6 w-6" />, description: '심화 매칭 게임' },
    ];
  }

  const quiz2Status: StageStatus = quiz2Pass ? 'done' : fc2 ? 'active' : 'locked';
  const match2Status: StageStatus = match2Done ? 'done' : quiz2Pass ? 'active' : 'locked';

  return [
    { key: 'r2_flashcard', label: '플래시카드', status: fc2 ? 'done' : 'active', icon: <BookOpen className="h-6 w-6" />, description: '2회독 복습 카드' },
    { key: 'r2_quiz', label: '종합문제', status: quiz2Status, icon: <ClipboardList className="h-6 w-6" />, description: '종합 퀴즈' },
    { key: 'r2_matching', label: '심화매칭', status: match2Status, icon: <ArrowLeftRight className="h-6 w-6" />, description: '심화 매칭 게임' },
  ];
}

function isR2Complete(p: VocaStudentProgress | null): boolean {
  if (!p) return false;
  return (
    p.round2_flashcard_completed &&
    (p.round2_quiz_score ?? 0) >= 80 &&
    p.round2_matching_completed
  );
}

// ── Naesin Helpers ──

const NAESIN_STAGE_META: Record<string, { icon: React.ReactNode; description: string }> = {
  vocab: { icon: <BookOpen className="h-6 w-6" />, description: '교과서 단어를 암기합니다' },
  passage: { icon: <ClipboardList className="h-6 w-6" />, description: '교과서 지문을 암기합니다' },
  grammar: { icon: <Sparkles className="h-6 w-6" />, description: '핵심 문법을 학습합니다' },
  problem: { icon: <PenLine className="h-6 w-6" />, description: '문제를 풀며 실력 확인' },
  lastReview: { icon: <RefreshCw className="h-6 w-6" />, description: '시험 직전 최종 점검' },
};

const NAESIN_STAGE_LABELS: Record<string, string> = {
  vocab: '단어 암기',
  passage: '교과서 암기',
  grammar: '문법 설명',
  problem: '문제풀이',
  lastReview: '직전보강',
};

const NAESIN_STAGE_KEYS = ['vocab', 'passage', 'grammar', 'problem', 'lastReview'] as const;

function mapNaesinStatus(s: NaesinStageStatus): StageStatus | null {
  if (s === 'completed') return 'done';
  if (s === 'available') return 'active';
  if (s === 'hidden') return null;
  return 'locked';
}

function getNaesinStages(statuses: NaesinStageStatuses): NaesinStage[] {
  const stages: NaesinStage[] = [];
  for (const key of NAESIN_STAGE_KEYS) {
    const mapped = mapNaesinStatus(statuses[key]);
    if (mapped === null) continue;
    const meta = NAESIN_STAGE_META[key];
    stages.push({
      key,
      label: NAESIN_STAGE_LABELS[key],
      stageKey: key === 'lastReview' ? 'last-review' : key,
      status: mapped,
      icon: meta.icon,
      description: meta.description,
    });
  }
  return stages;
}

function isNaesinUnitComplete(statuses: NaesinStageStatuses): boolean {
  return (['vocab', 'passage', 'grammar', 'problem'] as const).every(
    (k) => statuses[k] === 'completed' || statuses[k] === 'hidden',
  );
}

function getDDay(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(dateStr);
  exam.setHours(0, 0, 0, 0);
  return Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Component ──

export function CombinedDashboard({
  userName,
  vocaBooks,
  vocaDays,
  vocaProgressList,
  vocaWordCount,
  textbookName,
  naesinUnits,
  naesinProgressList,
  examAssignments,
  contentMap,
  vocabQuizSetCounts,
  grammarVideoCounts,
  enabledStages,
}: Props) {
  // ── Voca state ──
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

  const vocaActiveR1 = r1Stages.find((s) => s.status === 'active');
  const r2Stages = currentVocaProgress !== undefined ? getR2Stages(currentVocaProgress) : [];
  const vocaActiveR2 = r2Stages.find((s) => s.status === 'active');
  const vocaCtaStage = vocaActiveR1 ?? vocaActiveR2;
  const vocaCtaRound = vocaActiveR1 ? '1' : '2';

  // Voca stats
  const r1CompletedStages = vocaProgressList.reduce((acc, p) => {
    return acc + (p.flashcard_completed ? 1 : 0)
      + ((p.quiz_score ?? 0) >= 80 ? 1 : 0)
      + ((p.spelling_score ?? 0) >= 80 ? 1 : 0)
      + (p.matching_completed ? 1 : 0);
  }, 0);

  const vocaQuizScores = vocaProgressList
    .filter((p) => p.quiz_score !== null)
    .map((p) => p.quiz_score!);
  const vocaAvgScore = vocaQuizScores.length > 0
    ? Math.round(vocaQuizScores.reduce((a, b) => a + b, 0) / vocaQuizScores.length)
    : 0;

  // ── Naesin state ──
  const naesinProgressMap = new Map<string, NaesinStudentProgress>();
  naesinProgressList.forEach((p) => naesinProgressMap.set(p.unit_id, p));

  const sortedUnits = [...naesinUnits].sort((a, b) => a.sort_order - b.sort_order);

  const statusesMap = new Map<string, NaesinStageStatuses>();
  for (const unit of sortedUnits) {
    const progress = naesinProgressMap.get(unit.id) ?? null;
    const content = contentMap[unit.id] ?? {
      hasVocab: false, hasPassage: false, hasGrammar: false, hasProblem: false, hasLastReview: false,
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
  const currentNaesinStages = currentNaesinStatuses ? getNaesinStages(currentNaesinStatuses) : [];
  const naesinCtaStage = currentNaesinStages.find((s) => s.status === 'active');

  // Naesin stats
  const naesinCompletedStages = sortedUnits.reduce((acc, u) => {
    const s = statusesMap.get(u.id);
    if (!s) return acc;
    return acc
      + (s.vocab === 'completed' ? 1 : 0)
      + (s.passage === 'completed' ? 1 : 0)
      + (s.grammar === 'completed' ? 1 : 0)
      + (s.problem === 'completed' ? 1 : 0);
  }, 0);

  const naesinCompletedUnits = sortedUnits.filter((u) => {
    const s = statusesMap.get(u.id);
    return s && isNaesinUnitComplete(s);
  }).length;

  const naesinVocabScores = naesinProgressList.flatMap((p) => {
    const scores: number[] = [];
    if (p.vocab_quiz_score !== null) scores.push(p.vocab_quiz_score);
    if (p.vocab_spelling_score !== null) scores.push(p.vocab_spelling_score);
    return scores;
  });
  const naesinAvgVocab = naesinVocabScores.length > 0
    ? Math.round(naesinVocabScores.reduce((a, b) => a + b, 0) / naesinVocabScores.length)
    : 0;

  const futureDDays = examAssignments
    .map((a) => getDDay(a.exam_date))
    .filter((d): d is number => d !== null && d >= 0);
  const nearestDDay = futureDDays.length > 0 ? Math.min(...futureDDays) : null;

  // Current active book
  const currentBookId = currentVocaDay?.book_id;
  const currentBook = vocaBooks.find((b) => b.id === currentBookId);
  const currentBookDays = sortedDays.filter((d) => d.book_id === currentBookId);

  // Collapsible state
  const [vocaProgressOpen, setVocaProgressOpen] = useState(false);
  const [naesinProgressOpen, setNaesinProgressOpen] = useState(false);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ── Header Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white"
        style={{ background: COLORS.header }}
      >
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />

        <h2 className="relative text-2xl md:text-3xl font-bold">안녕하세요, {userName}님! 👋</h2>
        <p className="relative mt-1 text-white/80">오늘도 영어 학습을 시작해볼까요?</p>

        <div className="relative mt-4 flex flex-wrap gap-3">
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

      {/* ── Stat Cards — 6 cards, 3-col ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="보카 완료" value={r1CompletedStages} sub={`전체 ${vocaDays.length * 4}단계 중`} color={COLORS.statMint} icon={<CheckCircle className="h-5 w-5" />} />
        <StatCard label="내신 완료" value={naesinCompletedStages} sub={`전체 ${sortedUnits.length * 4}단계 중`} color={COLORS.statPurple} icon={<Layers className="h-5 w-5" />} />
        <StatCard label="보카 퀴즈" value={vocaAvgScore > 0 ? `${vocaAvgScore}점` : '-'} sub="퀴즈 평균" color={COLORS.statAmber} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard label="내신 단원" value={`${naesinCompletedUnits}/${sortedUnits.length}`} sub="완료 단원" color={COLORS.statSky} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="내신 단어" value={naesinAvgVocab > 0 ? `${naesinAvgVocab}점` : '-'} sub="퀴즈 + 스펠링 평균" color={COLORS.statPurple} icon={<Sparkles className="h-5 w-5" />} />
        <StatCard label="시험 D-day" value={nearestDDay !== null ? (nearestDDay === 0 ? 'D-Day' : `D-${nearestDDay}`) : '-'} sub={nearestDDay !== null ? '가장 가까운 시험' : '시험 일정 없음'} color={COLORS.statAmber} icon={<CalendarDays className="h-5 w-5" />} />
      </div>

      {/* ── Voca Learning Flow: Round 1 ── */}
      {currentVocaDay && (
        <div className="rounded-2xl border bg-white p-5 md:p-6 space-y-5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            📚 학습 흐름 — 1회독
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium" style={{ borderColor: COLORS.stepDone.border }}>
              {currentVocaDay.title}
            </span>
          </h3>

          <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
            {r1Stages.map((stage, i) => (
              <div key={stage.key} className="flex items-center gap-2" style={{ flex: stage.status === 'active' ? 1.35 : 1, minWidth: 0 }}>
                {i > 0 && <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" />}
                <VocaStepCard stage={stage} dayId={currentVocaDay.id} />
              </div>
            ))}
          </div>

          {vocaCtaStage && vocaCtaRound === '1' && (
            <div className="flex items-center justify-between rounded-xl px-5 py-3" style={{ background: 'linear-gradient(to right, #F5F3FF, #EDE9FE)' }}>
              <span className="text-sm font-medium text-gray-700">다음 단계: <strong>{vocaCtaStage.label}</strong></span>
              <Link href={`/student/voca/${currentVocaDay.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90" style={{ background: COLORS.ctaButton }}>
                {vocaCtaStage.label} 시작하기 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Voca Learning Flow: Round 2 ── */}
      {currentVocaDay && (
        <div className="rounded-2xl border bg-white p-5 md:p-6 space-y-5 transition-opacity" style={{ opacity: r1Done ? 1 : 0.55 }}>
          <h3 className="text-lg font-bold flex items-center gap-2">
            📗 2회독
            {!r1Done && <span className="text-xs font-normal text-gray-400 ml-1">1회독을 완료하면 해금됩니다!</span>}
          </h3>

          <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
            {r2Stages.map((stage, i) => (
              <div key={stage.key} className="flex items-center gap-2" style={{ flex: stage.status === 'active' ? 1.35 : 1, minWidth: 0 }}>
                {i > 0 && <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" />}
                <VocaStepCard stage={stage} dayId={currentVocaDay.id} />
              </div>
            ))}
          </div>

          {vocaCtaStage && vocaCtaRound === '2' && (
            <div className="flex items-center justify-between rounded-xl px-5 py-3" style={{ background: 'linear-gradient(to right, #F5F3FF, #EDE9FE)' }}>
              <span className="text-sm font-medium text-gray-700">다음 단계: <strong>{vocaCtaStage.label}</strong></span>
              <Link href={`/student/voca/${currentVocaDay.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90" style={{ background: COLORS.ctaButton }}>
                {vocaCtaStage.label} 시작하기 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Naesin Learning Flow ── */}
      {currentUnit && currentNaesinStages.length > 0 && (
        <div className="rounded-2xl border bg-white p-5 md:p-6 space-y-5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            📖 내신 대비 — {currentUnit.title}
            {(() => {
              const assignment = examAssignments.find((a) => a.unit_ids.includes(currentUnit.id));
              const dday = assignment ? getDDay(assignment.exam_date) : null;
              return dday !== null && dday >= 0 ? (
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium" style={{ borderColor: COLORS.stepDone.border }}>
                  {dday === 0 ? 'D-Day' : `D-${dday}`}
                </span>
              ) : null;
            })()}
          </h3>

          <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
            {currentNaesinStages.map((stage, i) => (
              <div key={stage.key} className="flex items-center gap-2" style={{ flex: stage.status === 'active' ? 1.35 : 1, minWidth: 0 }}>
                {i > 0 && <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" />}
                <NaesinStepCard stage={stage} unitId={currentUnit.id} />
              </div>
            ))}
          </div>

          {naesinCtaStage && (
            <div className="flex items-center justify-between rounded-xl px-5 py-3" style={{ background: 'linear-gradient(to right, #F5F3FF, #EDE9FE)' }}>
              <span className="text-sm font-medium text-gray-700">다음 단계: <strong>{naesinCtaStage.label}</strong></span>
              <Link href={`/student/naesin/${currentUnit.id}/${naesinCtaStage.stageKey}`} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90" style={{ background: COLORS.ctaButton }}>
                {naesinCtaStage.label} 시작하기 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom: Progress (2-col) ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Naesin Unit Progress — collapsible */}
        <div className="rounded-2xl border bg-white p-5 md:p-6">
          <button
            type="button"
            onClick={() => setNaesinProgressOpen(!naesinProgressOpen)}
            className="flex w-full items-center justify-between mb-4"
          >
            <h3 className="text-base font-bold flex items-center gap-2">
              <Layers className="h-4 w-4" />
              내신 단원 진행률
            </h3>
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${naesinProgressOpen ? 'rotate-180' : ''}`} />
          </button>
          {naesinProgressOpen && (
            <div className="space-y-3">
              {sortedUnits.map((unit) => {
                const s = statusesMap.get(unit.id);
                if (!s) return null;
                const done =
                  (s.vocab === 'completed' ? 1 : 0) +
                  (s.passage === 'completed' ? 1 : 0) +
                  (s.grammar === 'completed' ? 1 : 0) +
                  (s.problem === 'completed' ? 1 : 0);
                const pct = Math.round((done / 4) * 100);
                const isDone = isNaesinUnitComplete(s);
                const isActive = currentUnit?.id === unit.id;

                return (
                  <div key={unit.id}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium truncate">{unit.title}</span>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">{done}/4</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: isDone
                            ? `linear-gradient(to right, ${COLORS.progressDone}, #4DD9C0)`
                            : isActive
                              ? COLORS.progressActive
                              : '#D1D5DB',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {sortedUnits.length === 0 && (
                <p className="text-sm text-gray-500">등록된 단원이 없습니다.</p>
              )}
            </div>
          )}
        </div>

        {/* Voca Book — collapsible */}
        <div className="rounded-2xl border bg-white p-5 md:p-6">
          <button
            type="button"
            onClick={() => setVocaProgressOpen(!vocaProgressOpen)}
            className="flex w-full items-center justify-between mb-4"
          >
            <h3 className="text-base font-bold">
              📖 {currentBook?.title || '올킬보카'}
            </h3>
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${vocaProgressOpen ? 'rotate-180' : ''}`} />
          </button>
          {vocaProgressOpen && (
            <div className="space-y-3">
              {currentBookDays.map((day) => {
                const p = vocaProgressMap.get(day.id) ?? null;
                const isCurrent = day.id === currentVocaDay?.id;
                const stagesComplete =
                  (p?.flashcard_completed ? 1 : 0) +
                  ((p?.quiz_score ?? 0) >= 80 ? 1 : 0) +
                  ((p?.spelling_score ?? 0) >= 80 ? 1 : 0) +
                  (p?.matching_completed ? 1 : 0);
                const pct = Math.round((stagesComplete / 4) * 100);
                const isDone = isR1Complete(p);

                return (
                  <Link
                    key={day.id}
                    href={`/student/voca/${day.id}`}
                    className={`block rounded-xl border px-3.5 py-3 transition-colors ${
                      isCurrent
                        ? 'bg-white shadow-sm'
                        : 'hover:bg-gray-50'
                    }`}
                    style={isCurrent ? { border: `2px solid ${COLORS.stepActive.border}` } : undefined}
                  >
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium truncate flex items-center gap-2">
                        {day.title}
                        {isCurrent && (
                          <span className="inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-semibold text-white" style={{ background: COLORS.activeLabel }}>
                            학습 중
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">{stagesComplete}/4</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: isDone
                            ? `linear-gradient(to right, ${COLORS.progressDone}, #4DD9C0)`
                            : isCurrent
                              ? COLORS.progressActive
                              : '#D1D5DB',
                        }}
                      />
                    </div>
                  </Link>
                );
              })}
              {currentBookDays.length === 0 && (
                <p className="text-sm text-gray-500">등록된 Day가 없습니다.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border bg-white p-4"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

function VocaStepCard({ stage, dayId }: { stage: VocaStage; dayId: string }) {
  const isDone = stage.status === 'done';
  const isActive = stage.status === 'active';
  const isLocked = stage.status === 'locked';

  const style = isDone ? COLORS.stepDone : isActive ? COLORS.stepActive : COLORS.stepDefault;

  const content = (
    <div
      className={`relative flex flex-col items-center text-center rounded-xl p-4 transition-all w-full ${isActive ? 'shadow-lg' : ''}`}
      style={{ background: style.bg, border: `2px solid ${style.border}` }}
    >
      {isActive && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white whitespace-nowrap" style={{ background: COLORS.activeLabel }}>
          지금 여기!
        </span>
      )}
      {isDone && <div className="absolute top-1.5 right-1.5"><CheckCircle className="h-4 w-4" style={{ color: COLORS.stepDone.border }} /></div>}
      {isLocked && <div className="absolute top-1.5 right-1.5"><Lock className="h-4 w-4 text-gray-400" /></div>}

      <div className={`mb-2 ${isLocked ? 'text-gray-400' : isDone ? 'text-emerald-600' : ''}`} style={isActive ? { color: COLORS.activeLabel } : undefined}>
        {stage.icon}
      </div>
      <span className={`text-sm font-semibold ${isLocked ? 'text-gray-400' : ''}`} style={isActive ? { color: COLORS.activeLabel } : undefined}>
        {stage.label}
      </span>
      <span className={`text-[11px] mt-0.5 ${isLocked ? 'text-gray-300' : 'text-gray-500'}`}>
        {stage.description}
      </span>
    </div>
  );

  if (!isLocked && dayId) {
    return <Link href={`/student/voca/${dayId}`} className="w-full block">{content}</Link>;
  }
  return <div className="w-full">{content}</div>;
}

function NaesinStepCard({ stage, unitId }: { stage: NaesinStage; unitId: string }) {
  const isDone = stage.status === 'done';
  const isActive = stage.status === 'active';
  const isLocked = stage.status === 'locked';

  const style = isDone ? COLORS.stepDone : isActive ? COLORS.stepActive : COLORS.stepDefault;

  const content = (
    <div
      className={`relative flex flex-col items-center text-center rounded-xl p-4 transition-all w-full ${isActive ? 'shadow-lg' : ''}`}
      style={{ background: style.bg, border: `2px solid ${style.border}` }}
    >
      {isActive && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white whitespace-nowrap" style={{ background: COLORS.activeLabel }}>
          지금 여기!
        </span>
      )}
      {isDone && <div className="absolute top-1.5 right-1.5"><CheckCircle className="h-4 w-4" style={{ color: COLORS.stepDone.border }} /></div>}
      {isLocked && <div className="absolute top-1.5 right-1.5"><Lock className="h-4 w-4 text-gray-400" /></div>}

      <div className={`mb-2 ${isLocked ? 'text-gray-400' : isDone ? 'text-emerald-600' : ''}`} style={isActive ? { color: COLORS.activeLabel } : undefined}>
        {stage.icon}
      </div>
      <span className={`text-sm font-semibold ${isLocked ? 'text-gray-400' : ''}`} style={isActive ? { color: COLORS.activeLabel } : undefined}>
        {stage.label}
      </span>
      <span className={`text-[11px] mt-0.5 ${isLocked ? 'text-gray-300' : 'text-gray-500'}`}>
        {stage.description}
      </span>
    </div>
  );

  if (!isLocked && unitId) {
    return <Link href={`/student/naesin/${unitId}/${stage.stageKey}`} className="w-full block">{content}</Link>;
  }
  return <div className="w-full">{content}</div>;
}
