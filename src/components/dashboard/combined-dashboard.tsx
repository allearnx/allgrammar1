'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  BookOpen,
  ClipboardList,
  Sparkles,
  ArrowRight,
  CalendarDays,
  Layers,
} from 'lucide-react';
import { calculateStageStatuses } from '@/lib/naesin/stage-unlock';
import { MiniScoreTrend } from '@/components/charts/mini-score-trend';
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
  emoji: string;
  description: string;
  scoreRequirement: string;
  actualScore?: string;
}

interface NaesinStage {
  key: string;
  label: string;
  stageKey: string;
  status: StageStatus;
  emoji: string;
  description: string;
  scoreRequirement: string;
  actualScore?: string;
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
  wrongWordCounts?: Record<string, number>;
  vocaQuizHistory?: { date: string; score: number }[];
  naesinQuizHistory?: { date: string; score: number }[];
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
  wrongBg: '#FFF0F3',
  wrongBorder3: '#F43F5E',
  wrongBorder2: '#FB7185',
  wrongBorder1: '#FCA5A5',
  wrongBadge: '#FFE4E6',
};

// ── Voca Helpers ──

function getR1Stages(p: VocaStudentProgress | null): VocaStage[] {
  const fc = p?.flashcard_completed ?? false;
  const quizPass = (p?.quiz_score ?? 0) >= 80;
  const spellPass = (p?.spelling_score ?? 0) >= 80;
  const matchDone = p?.matching_completed ?? false;

  const fcDone = fc || quizPass;
  const quizStatus: StageStatus = quizPass ? 'done' : fcDone ? 'active' : 'locked';
  const spellStatus: StageStatus = spellPass ? 'done' : quizPass ? 'active' : 'locked';
  const matchStatus: StageStatus = matchDone ? 'done' : spellPass ? 'active' : 'locked';

  return [
    { key: 'flashcard', label: '플래시카드', status: fcDone ? 'done' : 'active', emoji: '👁️', description: '단어·뜻·예문을\n카드로 확인', scoreRequirement: '카드 확인', actualScore: fcDone ? '완료 ✓' : undefined },
    { key: 'quiz', label: '퀴즈', status: quizStatus, emoji: '✏️', description: '5지선다 객관식으로\n이해도를 확인해요', scoreRequirement: '80점 통과', actualScore: p?.quiz_score != null ? `${p.quiz_score}점` : undefined },
    { key: 'spelling', label: '스펠링', status: spellStatus, emoji: '⌨️', description: '뜻 보고 영단어\n직접 입력', scoreRequirement: '80점 통과', actualScore: p?.spelling_score != null ? `${p.spelling_score}점` : undefined },
    { key: 'matching', label: '매칭', status: matchStatus, emoji: '🔗', description: '유의어·반의어\n연결하기', scoreRequirement: '90점 통과', actualScore: matchDone ? '완료' : p?.matching_score != null ? `${p.matching_score}점` : undefined },
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
      { key: 'r2_flashcard', label: '플래시카드', status: 'locked', emoji: '📚', description: '유의어·반의어\n숙어 학습', scoreRequirement: '—' },
      { key: 'r2_quiz', label: '종합 문제', status: 'locked', emoji: '🤖', description: '9가지 유형\nAI 서술형 채점', scoreRequirement: '—' },
      { key: 'r2_matching', label: '심화 매칭', status: 'locked', emoji: '🔗', description: '고난도\n연결하기', scoreRequirement: '—' },
    ];
  }

  const fc2Done = fc2 || quiz2Pass;
  const quiz2Status: StageStatus = quiz2Pass ? 'done' : fc2Done ? 'active' : 'locked';
  const match2Status: StageStatus = match2Done ? 'done' : quiz2Pass ? 'active' : 'locked';

  return [
    { key: 'r2_flashcard', label: '플래시카드', status: fc2Done ? 'done' : 'active', emoji: '📚', description: '유의어·반의어\n숙어 학습', scoreRequirement: '카드 확인', actualScore: fc2Done ? '완료 ✓' : undefined },
    { key: 'r2_quiz', label: '종합 문제', status: quiz2Status, emoji: '🤖', description: '9가지 유형\nAI 서술형 채점', scoreRequirement: '80점 통과', actualScore: p?.round2_quiz_score != null ? `${p.round2_quiz_score}점` : undefined },
    { key: 'r2_matching', label: '심화 매칭', status: match2Status, emoji: '🔗', description: '고난도\n연결하기', scoreRequirement: '90점 통과', actualScore: match2Done ? '완료' : p?.round2_matching_score != null ? `${p.round2_matching_score}점` : undefined },
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

const NAESIN_STAGE_META: Record<string, { emoji: string; description: string; scoreRequirement: string }> = {
  vocab: { emoji: '📖', description: '교과서 단어를\n암기합니다', scoreRequirement: '퀴즈+스펠링 통과' },
  passage: { emoji: '📝', description: '교과서 지문을\n암기합니다', scoreRequirement: '지문 암기 완료' },
  grammar: { emoji: '📐', description: '핵심 문법을\n학습합니다', scoreRequirement: '영상 시청 완료' },
  problem: { emoji: '✏️', description: '문제를 풀며\n실력 확인', scoreRequirement: '문제풀이 완료' },
  lastReview: { emoji: '🔄', description: '시험 직전\n최종 점검', scoreRequirement: '최종 점검 완료' },
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

function getNaesinStages(statuses: NaesinStageStatuses, progress: NaesinStudentProgress | null): NaesinStage[] {
  const stages: NaesinStage[] = [];
  for (const key of NAESIN_STAGE_KEYS) {
    const mapped = mapNaesinStatus(statuses[key]);
    if (mapped === null) continue;
    const meta = NAESIN_STAGE_META[key];

    let actualScore: string | undefined;
    if (mapped === 'done') {
      actualScore = '완료 ✓';
    } else if (progress) {
      if (key === 'vocab' && progress.vocab_quiz_score != null) actualScore = `${progress.vocab_quiz_score}점`;
    }

    stages.push({
      key,
      label: NAESIN_STAGE_LABELS[key],
      stageKey: key === 'lastReview' ? 'last-review' : key,
      status: mapped,
      emoji: meta.emoji,
      description: meta.description,
      scoreRequirement: meta.scoreRequirement,
      actualScore,
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
  vocaBooks: _vocaBooks,
  vocaDays,
  vocaProgressList,
  vocaWordCount: _vocaWordCount,
  textbookName,
  naesinUnits,
  naesinProgressList,
  examAssignments,
  contentMap,
  vocabQuizSetCounts,
  grammarVideoCounts,
  enabledStages,
  wrongWordCounts = {},
  vocaQuizHistory = [],
  naesinQuizHistory = [],
}: Props) {
  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<'voca' | 'naesin'>('voca');

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

  // Wrong words
  const wrongWordEntries = Object.entries(wrongWordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Current active book
  const currentBookId = currentVocaDay?.book_id;
  const currentBookDays = sortedDays.filter((d) => d.book_id === currentBookId);

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
  const currentNaesinProgress = currentUnit ? (naesinProgressMap.get(currentUnit.id) ?? null) : null;
  const currentNaesinStages = currentNaesinStatuses ? getNaesinStages(currentNaesinStatuses, currentNaesinProgress) : [];
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
          📚 올킬보카
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
          📖 내신대비
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

      {/* ── Voca Tab Content ── */}
      {activeTab === 'voca' && (
        <div className="space-y-6">
          {/* Round 1 */}
          {currentVocaDay && (
            <div className="rounded-2xl border bg-white p-5 md:p-6 space-y-5">
              <h3 className="text-lg font-bold flex items-center gap-2">
                📚 학습 흐름 — 1회독
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium" style={{ borderColor: COLORS.stepDone.border }}>
                  {currentVocaDay.title}
                </span>
              </h3>

              <div className="flex items-stretch gap-0 overflow-visible">
                {r1Stages.map((stage, i) => (
                  <div key={stage.key} className="contents">
                    {i > 0 && <div className="flex items-center justify-center self-center px-1 md:px-1.5 text-gray-300 text-sm shrink-0">→</div>}
                    <FlowStep stage={stage} dayId={currentVocaDay.id} linkPrefix="/student/voca/" />
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

          {/* Round 2 */}
          {currentVocaDay && (
            <div className="rounded-2xl border bg-white p-5 md:p-6 space-y-5 transition-opacity" style={{ opacity: r1Done ? 1 : 0.55 }}>
              <h3 className="text-lg font-bold flex items-center gap-2">
                📗 2회독
                {!r1Done && <span className="text-xs font-normal text-gray-400 ml-1">1회독을 완료하면 해금됩니다!</span>}
              </h3>

              <div className="flex items-stretch gap-0 overflow-visible">
                {r2Stages.map((stage, i) => (
                  <div key={stage.key} className="contents">
                    {i > 0 && <div className="flex items-center justify-center self-center px-1 md:px-1.5 text-gray-300 text-sm shrink-0">→</div>}
                    <FlowStep stage={stage} dayId={currentVocaDay.id} linkPrefix="/student/voca/" />
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

          {/* Bottom: Wrong Words + Day Progress */}
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Wrong Words */}
            <div className="rounded-2xl p-5 md:p-6" style={{ background: COLORS.wrongBg }}>
              <h3 className="text-sm font-bold mb-3">❌ 틀린 단어 복습</h3>
              {wrongWordEntries.length > 0 ? (
                <div className="space-y-2">
                  {wrongWordEntries.map(([word, count]) => {
                    const borderColor = count >= 3 ? COLORS.wrongBorder3 : count === 2 ? COLORS.wrongBorder2 : COLORS.wrongBorder1;
                    return (
                      <div key={word} className="flex items-center justify-between rounded-lg bg-white px-3 py-2" style={{ borderLeft: `3px solid ${borderColor}` }}>
                        <span className="text-sm font-medium text-gray-800">{word}</span>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-rose-700" style={{ background: COLORS.wrongBadge }}>
                          {count}회 오답
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">틀린 단어가 없습니다! 대단해요! 🎉</p>
              )}
            </div>

            {/* Day Progress */}
            <div className="rounded-2xl border bg-white p-5 md:p-6">
              <h3 className="text-sm font-bold mb-3">📈 Day별 진행률</h3>
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
                        isCurrent ? 'bg-white shadow-sm' : 'hover:bg-gray-50'
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
            </div>
          </div>
        </div>
      )}

      {/* ── Naesin Tab Content ── */}
      {activeTab === 'naesin' && (
        <div className="space-y-6">
          {/* Learning Flow */}
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

              <div className="flex items-stretch gap-0 overflow-visible">
                {currentNaesinStages.map((stage, i) => (
                  <div key={stage.key} className="contents">
                    {i > 0 && <div className="flex items-center justify-center self-center px-1 md:px-1.5 text-gray-300 text-sm shrink-0">→</div>}
                    <FlowStep stage={stage} dayId={`${currentUnit.id}/${stage.stageKey}`} linkPrefix="/student/naesin/" />
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

          {/* Bottom: Unit Progress + Exam Scope */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Unit Progress */}
            <div className="rounded-2xl border bg-white p-5 md:p-6">
              <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                단원 진행률
              </h3>
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
            </div>

            {/* Exam Scope */}
            <div className="rounded-2xl border bg-white p-5 md:p-6">
              <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                시험 범위
              </h3>
              <div className="space-y-3">
                {examAssignments.length > 0 ? (
                  examAssignments
                    .sort((a, b) => a.exam_round - b.exam_round)
                    .map((ea) => {
                      const dday = getDDay(ea.exam_date);
                      const unitTitles = ea.unit_ids
                        .map((uid) => naesinUnits.find((u) => u.id === uid)?.title)
                        .filter(Boolean);
                      return (
                        <div key={ea.id} className="rounded-xl border p-3.5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold">
                              {ea.exam_label || `${ea.exam_round}차 시험`}
                            </span>
                            {dday !== null && dday >= 0 && (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  dday <= 7 ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {dday === 0 ? 'D-Day' : `D-${dday}`}
                              </span>
                            )}
                            {ea.exam_date && dday !== null && dday < 0 && (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">완료</span>
                            )}
                          </div>
                          {ea.exam_date && (
                            <p className="text-xs text-gray-400 mb-1.5">
                              {new Date(ea.exam_date).toLocaleDateString('ko-KR')}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1.5">
                            {unitTitles.map((title, i) => (
                              <span key={i} className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-gray-600" style={{ borderColor: COLORS.stepDone.border }}>
                                {title}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <p className="text-sm text-gray-500">등록된 시험 범위가 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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

function FlowStep({ stage, dayId, linkPrefix }: { stage: VocaStage | NaesinStage; dayId: string; linkPrefix: string }) {
  const isDone = stage.status === 'done';
  const isActive = stage.status === 'active';
  const isLocked = stage.status === 'locked';

  const green = '#22C55E';

  const card = (
    <div
      className="relative text-center transition-all flex flex-col items-center h-full"
      style={{
        background: isDone ? '#D9F7FC' : isActive ? 'white' : '#D9F7FC',
        border: isDone ? '1.5px solid #4DD9C0' : isActive ? '2px solid #7C3AED' : '1.5px solid #CCFAF4',
        borderRadius: isActive ? 16 : 14,
        padding: isActive ? '28px 10px 24px' : '24px 8px 20px',
        boxShadow: isActive ? '0 8px 24px rgba(37,99,235,0.08)' : 'none',
        zIndex: isActive ? 1 : 0,
        wordBreak: 'keep-all' as const,
      }}
    >
      {/* Active label */}
      {isActive && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide text-white" style={{ background: '#7C3AED' }}>
          ▶ 지금 여기!
        </div>
      )}

      {/* Status icon — top right circle */}
      <div className="absolute -top-2 -right-2 flex h-[24px] w-[24px] items-center justify-center rounded-full border-2 border-white text-xs font-bold" style={{
        background: isDone ? green : isActive ? '#7C3AED' : '#E5E7EB',
        color: isDone || isActive ? 'white' : '#9CA3AF',
      }}>
        {isDone ? '✓' : isActive ? '▶' : '🔒'}
      </div>

      {/* Icon wrap */}
      <div className="mx-auto mb-3 flex items-center justify-center rounded-xl" style={{
        width: isActive ? 58 : 48,
        height: isActive ? 58 : 48,
        fontSize: isActive ? 30 : 24,
        background: isDone ? 'rgba(37,99,235,0.08)' : 'white',
      }}>
        {stage.emoji}
      </div>

      {/* Name */}
      <div className="font-bold leading-tight" style={{
        fontSize: isActive ? 17 : 14,
        color: isDone ? green : isActive ? '#7C3AED' : '#4B5563',
      }}>
        {stage.label}
      </div>

      {/* Description */}
      <div className="mt-2 leading-snug whitespace-pre-line" style={{
        fontSize: isActive ? 14 : 13,
        color: isActive ? '#6B7280' : '#9CA3AF',
      }}>
        {stage.description}
      </div>

      {/* Score badge */}
      <div className="mt-3 inline-block rounded-full font-bold" style={{
        fontSize: isActive ? 14 : 13,
        padding: isActive ? '4px 12px' : '3px 10px',
        background: isDone ? green : isActive ? '#7C3AED' : '#E5E7EB',
        color: isDone || isActive ? 'white' : '#9CA3AF',
      }}>
        {isDone ? (stage.actualScore || '완료') : stage.scoreRequirement}
      </div>
    </div>
  );

  if (!isLocked && dayId) {
    return <Link href={`${linkPrefix}${dayId}`} className="block" style={{ flex: isActive ? 1.35 : 1 }}>{card}</Link>;
  }
  return <div style={{ flex: isActive ? 1.35 : 1 }}>{card}</div>;
}
