'use client';

import Link from 'next/link';
import {
  CheckCircle,
  BookOpen,
  ClipboardList,
  Sparkles,
  CalendarDays,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { calculateStageStatuses } from '@/lib/naesin/stage-unlock';
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
  emoji: string;
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

// ── Helpers ──

const STAGE_META: Record<string, { emoji: string; description: string; scoreRequirement: string }> = {
  vocab: { emoji: '📖', description: '교과서 단어를\n암기합니다', scoreRequirement: '퀴즈+스펠링 통과' },
  passage: { emoji: '📝', description: '교과서 지문을\n암기합니다', scoreRequirement: '지문 암기 완료' },
  grammar: { emoji: '📐', description: '핵심 문법을\n학습합니다', scoreRequirement: '영상 시청 완료' },
  problem: { emoji: '✏️', description: '문제를 풀며\n실력 확인', scoreRequirement: '문제풀이 완료' },
  lastReview: { emoji: '🔄', description: '시험 직전\n최종 점검', scoreRequirement: '최종 점검 완료' },
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

function getStagesForUnit(statuses: NaesinStageStatuses, progress: NaesinStudentProgress | null): Stage[] {
  const stages: Stage[] = [];
  for (const key of STAGE_KEYS) {
    const mapped = mapStageStatus(statuses[key]);
    if (mapped === null) continue;
    const meta = STAGE_META[key];

    let actualScore: string | undefined;
    if (mapped === 'done') {
      actualScore = '완료 ✓';
    } else if (progress) {
      if (key === 'vocab' && progress.vocab_quiz_score != null) actualScore = `${progress.vocab_quiz_score}점`;
    }

    stages.push({
      key,
      label: STAGE_LABELS[key],
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
  const currentStages = currentStatuses ? getStagesForUnit(currentStatuses, currentProgress) : [];
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
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />

        <h2 className="relative text-2xl md:text-3xl font-bold">안녕하세요, {userName}님! 👋</h2>
        <p className="relative mt-1 text-white/80">내신 시험을 완벽하게 준비해볼까요?</p>

        <div className="relative mt-4 flex flex-wrap gap-3">
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

      {/* ── Learning Flow: Current Unit ── */}
      {currentUnit && currentStages.length > 0 && (
        <div className="rounded-2xl border bg-white p-5 md:p-6 space-y-5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            📚 학습 흐름 — {currentUnit.title}
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
                <FlowStep stage={stage} unitId={currentUnit.id} />
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

function FlowStep({ stage, unitId }: { stage: Stage; unitId: string }) {
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

  if (!isLocked && unitId) {
    return <Link href={`/student/naesin/${unitId}/${stage.stageKey}`} className="block" style={{ flex: isActive ? 1.35 : 1 }}>{card}</Link>;
  }
  return <div style={{ flex: isActive ? 1.35 : 1 }}>{card}</div>;
}
