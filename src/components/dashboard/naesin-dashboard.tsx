'use client';

import Link from 'next/link';
import {
  CheckCircle,
  BookOpen,
  ClipboardList,
  CalendarDays,
  ArrowRight,
  Layers,
  FileText,
  Ruler,
  PenLine,
  RefreshCw,
} from 'lucide-react';
import { BRAND } from '@/lib/utils/brand-colors';
import { calculateStageStatuses } from '@/lib/naesin/stage-unlock';
import { MiniScoreTrend } from '@/components/charts/mini-score-trend';
import { FlowStep } from './combined/flow-step';
import { StatCard } from '@/components/shared/stat-card';
import type {
  NaesinUnit,
  NaesinStudentProgress,
  NaesinStageStatus,
  NaesinStageStatuses,
  NaesinContentAvailability,
  NaesinExamAssignment,
} from '@/types/naesin';

// ── Types ──

interface Stage {
  key: string;
  label: string;
  stageKey: string;
  status: 'done' | 'active' | 'locked';
  icon: React.ReactNode;
  description: string;
  scoreRequirement: string;
  actualScore?: string;
}

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
}

// ── Colors ──

const COLORS = {
  header: BRAND.violetLight,
  bannerBadgeBorder: BRAND.teal,
  statMint: BRAND.mint,
  statPurple: BRAND.violet,
  statAmber: BRAND.amber,
  statSky: BRAND.cyan,
  stepDefault: { bg: BRAND.step.defaultBg, border: BRAND.step.defaultBorder },
  stepActive: { bg: '#FFFFFF', border: BRAND.step.activeBorder },
  stepDone: { bg: BRAND.step.defaultBg, border: BRAND.step.doneBorder },
  activeLabel: BRAND.violet,
  ctaButton: BRAND.violet,
  progressDone: BRAND.progress.done,
  progressActive: BRAND.progress.active,
};

// ── Helpers ──

const STAGE_META: Record<string, { icon: React.ReactNode; description: string; scoreRequirement: string }> = {
  vocab: { icon: <BookOpen className="h-6 w-6" />, description: '교과서 단어를\n암기합니다', scoreRequirement: '퀴즈+스펠링 시작' },
  passage: { icon: <FileText className="h-6 w-6" />, description: '교과서 지문을\n암기합니다', scoreRequirement: '지문 암기 완료' },
  grammar: { icon: <Ruler className="h-6 w-6" />, description: '핵심 문법을\n학습합니다', scoreRequirement: '영상 시청 완료' },
  problem: { icon: <PenLine className="h-6 w-6" />, description: '문제를 풀며\n실력 확인', scoreRequirement: '문제풀이 완료' },
  lastReview: { icon: <RefreshCw className="h-6 w-6" />, description: '시험 직전\n최종 점검', scoreRequirement: '최종 점검 완료' },
};

const STAGE_LABELS: Record<string, string> = {
  vocab: '단어 암기',
  passage: '교과서 암기',
  grammar: '문법 설명',
  problem: '문제풀이',
  lastReview: '직전보강',
};

const STAGE_KEYS = ['vocab', 'passage', 'grammar', 'problem', 'lastReview'] as const;

function mapStageStatus(s: NaesinStageStatus): 'done' | 'active' | 'locked' | null {
  if (s === 'completed') return 'done';
  if (s === 'available') return 'active';
  if (s === 'hidden') return null;
  return 'locked';
}

function getVocabBadgeText(progress: NaesinStudentProgress | null): string {
  if (!progress) return '퀴즈+스펠링 시작';
  const q = progress.vocab_quiz_score;
  const s = progress.vocab_spelling_score;
  const qDone = q !== null && q !== undefined;
  const sDone = s !== null && s !== undefined;
  const qPass = qDone && q >= 80;
  const sPass = sDone && s >= 80;

  if (!qDone && !sDone) return '퀴즈+스펠링 시작';
  if (qDone && !sDone) return qPass ? `퀴즈 ${q}점 ✓ · 스펠링 대기` : `퀴즈 ${q}점 · 재도전`;
  if (qDone && sDone) {
    if (qPass && sPass) return `퀴즈 ${q}점 · 스펠링 ${s}점 ✓`;
    if (qPass && !sPass) return `퀴즈 ✓ · 스펠링 ${s}점 재도전`;
    return `퀴즈 ${q}점 · 스펠링 ${s}점 재도전`;
  }
  return '퀴즈+스펠링 시작';
}

function getPassageBadgeText(progress: NaesinStudentProgress | null): string {
  if (!progress) return '지문 암기 완료';
  const fb = progress.passage_fill_blanks_best;
  const tr = progress.passage_translation_best;
  if (fb === null && tr === null) return '지문 암기 완료';
  const parts: string[] = [];
  if (fb !== null) parts.push(`빈칸 ${fb}점${fb >= 80 ? ' ✓' : ''}`);
  if (tr !== null) parts.push(`영작 ${tr}점${tr >= 80 ? ' ✓' : ''}`);
  return parts.join(' · ') || '지문 암기 완료';
}

function getGrammarBadgeText(progress: NaesinStudentProgress | null, videoCount: number): string {
  if (!progress || videoCount === 0) return '영상 시청 완료';
  const done = progress.grammar_videos_completed ?? 0;
  if (done >= videoCount) return `${videoCount}개 영상 시청 ✓`;
  if (done > 0) return `${done}/${videoCount} 영상 시청 중`;
  return '영상 시청 완료';
}

function getStagesForUnit(
  statuses: NaesinStageStatuses,
  progress: NaesinStudentProgress | null,
  grammarVideoCount?: number,
): Stage[] {
  const stages: Stage[] = [];
  for (const key of STAGE_KEYS) {
    const mapped = mapStageStatus(statuses[key]);
    if (mapped === null) continue;
    const meta = STAGE_META[key];

    let actualScore: string | undefined;
    let dynamicRequirement = meta.scoreRequirement;

    if (mapped === 'done') {
      actualScore = '완료 ✓';
    } else {
      if (key === 'vocab') dynamicRequirement = getVocabBadgeText(progress);
      else if (key === 'passage') dynamicRequirement = getPassageBadgeText(progress);
      else if (key === 'grammar') dynamicRequirement = getGrammarBadgeText(progress, grammarVideoCount ?? 0);
    }

    stages.push({
      key,
      label: STAGE_LABELS[key],
      stageKey: key === 'lastReview' ? 'last-review' : key,
      status: mapped,
      icon: meta.icon,
      description: meta.description,
      scoreRequirement: dynamicRequirement,
      actualScore,
    });
  }
  return stages;
}

function isUnitComplete(statuses: NaesinStageStatuses): boolean {
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
}: Props) {
  const progressMap = new Map<string, NaesinStudentProgress>();
  progressList.forEach((p) => progressMap.set(p.unit_id, p));

  const sortedUnits = [...units].sort((a, b) => a.sort_order - b.sort_order);

  // Calculate stage statuses per unit
  const statusesMap = new Map<string, NaesinStageStatuses>();
  for (const unit of sortedUnits) {
    const progress = progressMap.get(unit.id) ?? null;
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

  // Find current active unit
  const currentUnit = sortedUnits.find((u) => {
    const s = statusesMap.get(u.id);
    return s && !isUnitComplete(s);
  }) ?? sortedUnits[0];

  const currentStatuses = currentUnit ? statusesMap.get(currentUnit.id) : undefined;
  const currentProgress = currentUnit ? (progressMap.get(currentUnit.id) ?? null) : null;
  const currentGrammarVideoCount = currentUnit ? (grammarVideoCounts[currentUnit.id] ?? 0) : 0;
  const currentStages = currentStatuses ? getStagesForUnit(currentStatuses, currentProgress, currentGrammarVideoCount) : [];
  const ctaStage = currentStages.find((s) => s.status === 'active');

  // Stats
  const completedStages = sortedUnits.reduce((acc, u) => {
    const s = statusesMap.get(u.id);
    if (!s) return acc;
    return acc
      + (s.vocab === 'completed' ? 1 : 0)
      + (s.passage === 'completed' ? 1 : 0)
      + (s.grammar === 'completed' ? 1 : 0)
      + (s.problem === 'completed' ? 1 : 0);
  }, 0);

  const completedUnits = sortedUnits.filter((u) => {
    const s = statusesMap.get(u.id);
    return s && isUnitComplete(s);
  }).length;

  const vocabScores = progressList.flatMap((p) => {
    const scores: number[] = [];
    if (p.vocab_quiz_score !== null) scores.push(p.vocab_quiz_score);
    if (p.vocab_spelling_score !== null) scores.push(p.vocab_spelling_score);
    return scores;
  });
  const avgVocabScore = vocabScores.length > 0
    ? Math.round(vocabScores.reduce((a, b) => a + b, 0) / vocabScores.length)
    : 0;

  const futureDDays = examAssignments
    .map((a) => getDDay(a.exam_date))
    .filter((d): d is number => d !== null && d >= 0);
  const nearestDDay = futureDDays.length > 0 ? Math.min(...futureDDays) : null;

  const currentAssignment = currentUnit
    ? examAssignments.find((a) => a.unit_ids.includes(currentUnit.id))
    : undefined;
  const currentDDay = currentAssignment ? getDDay(currentAssignment.exam_date) : null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ── Header Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white"
        style={{ background: COLORS.header }}
      >
        <h2 className="text-2xl md:text-3xl font-bold">안녕하세요, {userName}님!</h2>
        <p className="mt-1 text-white/80">내신 시험을 완벽하게 준비해볼까요?</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white" style={{ border: `1.5px solid ${COLORS.bannerBadgeBorder}`, background: 'rgba(255,255,255,0.15)' }}>
            {textbookName}
          </span>
          {currentUnit && (
            <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white" style={{ border: `1.5px solid ${COLORS.bannerBadgeBorder}`, background: 'rgba(255,255,255,0.15)' }}>
              현재: {currentUnit.title}
            </span>
          )}
          {currentDDay !== null && currentDDay >= 0 && (
            <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold text-white" style={{ border: `1.5px solid ${COLORS.bannerBadgeBorder}`, background: 'rgba(255,255,255,0.15)' }}>
              {currentDDay === 0 ? 'D-Day' : `D-${currentDDay}`}
            </span>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="완료 단계" value={completedStages} sub={`전체 ${sortedUnits.length * 4}단계 중`} color={COLORS.statMint} icon={<CheckCircle className="h-5 w-5" />} />
        <StatCard label="완료 단원" value={completedUnits} sub={`전체 ${sortedUnits.length}단원 중`} color={COLORS.statPurple} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="단어 평균" value={avgVocabScore > 0 ? `${avgVocabScore}점` : '-'} sub="퀴즈 + 스펠링 평균" color={COLORS.statAmber} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard label="시험 D-day" value={nearestDDay !== null ? (nearestDDay === 0 ? 'D-Day' : `D-${nearestDDay}`) : '-'} sub={nearestDDay !== null ? '가장 가까운 시험' : '시험 일정 없음'} color={COLORS.statSky} icon={<CalendarDays className="h-5 w-5" />} />
      </div>

      {/* ── Mini Chart + Report Link ── */}
      <div className="rounded-2xl border bg-white p-5 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">문제풀이 점수 추이</h3>
          <Link href="/student/my-report" className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline">
            자세히 보기 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <MiniScoreTrend data={quizHistory} color="#06B6D4" height={64} />
      </div>

      {/* ── Learning Flow: Current Unit ── */}
      {currentUnit && currentStages.length > 0 && (
        <div className="rounded-2xl border bg-white p-5 md:p-6 space-y-5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            학습 흐름 — {currentUnit.title}
            {currentDDay !== null && currentDDay >= 0 && (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium" style={{ borderColor: COLORS.stepDone.border }}>
                {currentDDay === 0 ? 'D-Day' : `D-${currentDDay}`}
              </span>
            )}
          </h3>

          <div className="flex items-stretch gap-0 overflow-visible">
            {currentStages.map((stage, i) => (
              <div key={stage.key} className="contents">
                {i > 0 && <div className="flex items-center justify-center self-center px-1 md:px-1.5 text-gray-300 text-sm shrink-0">→</div>}
                <FlowStep stage={stage} dayId={`${currentUnit.id}/${stage.stageKey}`} linkPrefix="/student/naesin/" />
              </div>
            ))}
          </div>

          {/* CTA bar */}
          {ctaStage && (
            <div
              className="flex items-center justify-between rounded-xl px-5 py-3"
              style={{ background: 'linear-gradient(to right, #F5F3FF, #EDE9FE)' }}
            >
              <span className="text-sm font-medium text-gray-700">
                다음 단계: <strong>{ctaStage.label}</strong>
              </span>
              <Link
                href={`/student/naesin/${currentUnit.id}/${ctaStage.stageKey}`}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
                style={{ background: COLORS.ctaButton }}
              >
                {ctaStage.label} 시작하기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom: Unit Progress + Exam Scope ── */}
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
              const isDone = isUnitComplete(s);
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
                    .map((uid) => units.find((u) => u.id === uid)?.title)
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
  );
}


