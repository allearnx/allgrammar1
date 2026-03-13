'use client';

import Link from 'next/link';
import {
  CheckCircle,
  BookOpen,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import type { VocaBook, VocaDay, VocaStudentProgress } from '@/types/voca';

// ── Types ──

type StageStatus = 'done' | 'active' | 'locked';

interface Stage {
  key: string;
  label: string;
  status: StageStatus;
  emoji: string;
  description: string;
  scoreRequirement: string;
  actualScore?: string;
}

interface Props {
  userName: string;
  books: VocaBook[];
  days: VocaDay[];
  progressList: VocaStudentProgress[];
  wordCount: number;
  wrongWordCounts?: Record<string, number>;
}

// ── Colors ──

const COLORS = {
  header: '#A78BFA',
  bannerBadgeBorder: '#4DD9C0',
  statMint: '#56C9A0',
  statPurple: '#7C3AED',
  statAmber: '#F59E0B',
  statSky: '#06B6D4',
  green: '#22C55E',
  progressDone: '#56C9A0',
  progressActive: '#7C3AED',
  wrongBg: '#FFF0F3',
  wrongBorder3: '#F43F5E',
  wrongBorder2: '#FB7185',
  wrongBorder1: '#FCA5A5',
  wrongBadge: '#FFE4E6',
};

// ── Helpers ──

function getR1Stages(p: VocaStudentProgress | null): Stage[] {
  const fc = p?.flashcard_completed ?? false;
  const quizPass = (p?.quiz_score ?? 0) >= 80;
  const spellPass = (p?.spelling_score ?? 0) >= 80;
  const matchDone = p?.matching_completed ?? false;

  // 이후 단계 통과 시 이전 단계도 완료로 간주 (데이터 불일치 방어)
  const fcDone = fc || quizPass;

  const quizStatus: StageStatus = quizPass ? 'done' : fcDone ? 'active' : 'locked';
  const spellStatus: StageStatus = spellPass ? 'done' : quizPass ? 'active' : 'locked';
  const matchStatus: StageStatus = matchDone ? 'done' : spellPass ? 'active' : 'locked';

  return [
    {
      key: 'flashcard', label: '플래시카드', status: fcDone ? 'done' : 'active',
      emoji: '👁️', description: '단어·뜻·예문을\n카드로 확인',
      scoreRequirement: '카드 확인', actualScore: fcDone ? '완료 ✓' : undefined,
    },
    {
      key: 'quiz', label: '퀴즈', status: quizStatus,
      emoji: '✏️', description: '5지선다 객관식으로\n이해도를 확인해요',
      scoreRequirement: '80점 통과', actualScore: p?.quiz_score != null ? `${p.quiz_score}점` : undefined,
    },
    {
      key: 'spelling', label: '스펠링', status: spellStatus,
      emoji: '⌨️', description: '뜻 보고 영단어\n직접 입력',
      scoreRequirement: '80점 통과', actualScore: p?.spelling_score != null ? `${p.spelling_score}점` : undefined,
    },
    {
      key: 'matching', label: '매칭', status: matchStatus,
      emoji: '🔗', description: '유의어·반의어\n연결하기',
      scoreRequirement: '90점 통과', actualScore: matchDone ? '완료' : p?.matching_score != null ? `${p.matching_score}점` : undefined,
    },
  ];
}

function isR1Complete(p: VocaStudentProgress | null): boolean {
  if (!p) return false;
  const quizPass = (p.quiz_score ?? 0) >= 80;
  const fcDone = p.flashcard_completed || quizPass;
  return (
    fcDone &&
    quizPass &&
    (p.spelling_score ?? 0) >= 80 &&
    p.matching_completed
  );
}

function getR2Stages(p: VocaStudentProgress | null): Stage[] {
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

  // 이후 단계 통과 시 이전 단계도 완료로 간주
  const fc2Done = fc2 || quiz2Pass;

  const quiz2Status: StageStatus = quiz2Pass ? 'done' : fc2Done ? 'active' : 'locked';
  const match2Status: StageStatus = match2Done ? 'done' : quiz2Pass ? 'active' : 'locked';

  return [
    {
      key: 'r2_flashcard', label: '플래시카드', status: fc2Done ? 'done' : 'active',
      emoji: '📚', description: '유의어·반의어\n숙어 학습',
      scoreRequirement: '카드 확인', actualScore: fc2Done ? '완료 ✓' : undefined,
    },
    {
      key: 'r2_quiz', label: '종합 문제', status: quiz2Status,
      emoji: '🤖', description: '9가지 유형\nAI 서술형 채점',
      scoreRequirement: '80점 통과', actualScore: p?.round2_quiz_score != null ? `${p.round2_quiz_score}점` : undefined,
    },
    {
      key: 'r2_matching', label: '심화 매칭', status: match2Status,
      emoji: '🔗', description: '고난도\n연결하기',
      scoreRequirement: '90점 통과', actualScore: match2Done ? '완료' : p?.round2_matching_score != null ? `${p.round2_matching_score}점` : undefined,
    },
  ];
}

function isR2Complete(p: VocaStudentProgress | null): boolean {
  if (!p) return false;
  const quiz2Pass = (p.round2_quiz_score ?? 0) >= 80;
  const fc2Done = p.round2_flashcard_completed || quiz2Pass;
  return (
    fc2Done &&
    quiz2Pass &&
    p.round2_matching_completed
  );
}

function getCtaText(stage: Stage): { title: string; sub: string } {
  switch (stage.key) {
    case 'flashcard':
      return { title: '플래시카드를 시작할 차례예요!', sub: '단어 카드를 확인하면 다음 단계로 진행돼요' };
    case 'quiz':
      return { title: '퀴즈를 시작할 차례예요!', sub: '플래시카드 완료 · 퀴즈 80점 이상이면 다음 단계로 진행돼요' };
    case 'spelling':
      return { title: '스펠링을 시작할 차례예요!', sub: '퀴즈 통과 · 스펠링 80점 이상이면 다음 단계로 진행돼요' };
    case 'matching':
      return { title: '매칭을 시작할 차례예요!', sub: '스펠링 통과 · 매칭 90점 이상이면 1회독이 완료돼요' };
    case 'r2_flashcard':
      return { title: '2회독 플래시카드를 시작하세요!', sub: '유의어·반의어·숙어를 학습해요' };
    case 'r2_quiz':
      return { title: '종합 문제를 시작할 차례예요!', sub: '플래시카드 완료 · 80점 이상이면 다음 단계로 진행돼요' };
    case 'r2_matching':
      return { title: '심화 매칭을 시작할 차례예요!', sub: '종합문제 통과 · 90점 이상이면 2회독이 완료돼요' };
    default:
      return { title: `${stage.label}을 시작하세요!`, sub: '' };
  }
}

// ── Component ──

export function VocaDashboard({ userName, books, days, progressList, wordCount, wrongWordCounts = {} }: Props) {
  const progressMap = new Map<string, VocaStudentProgress>();
  progressList.forEach((p) => progressMap.set(p.day_id, p));

  const sortedDays = [...days].sort((a, b) => a.sort_order - b.sort_order);
  const currentDay = sortedDays.find((d) => {
    const p = progressMap.get(d.id) ?? null;
    return !isR1Complete(p) || !isR2Complete(p);
  }) ?? sortedDays[0];

  const currentProgress = currentDay ? (progressMap.get(currentDay.id) ?? null) : null;

  // Stats
  const r1CompletedStages = progressList.reduce((acc, p) => {
    return acc + (p.flashcard_completed ? 1 : 0)
      + ((p.quiz_score ?? 0) >= 80 ? 1 : 0)
      + ((p.spelling_score ?? 0) >= 80 ? 1 : 0)
      + (p.matching_completed ? 1 : 0);
  }, 0);

  const completedDays = progressList.filter((p) => isR1Complete(p)).length;

  const quizScores = progressList
    .filter((p) => p.quiz_score !== null)
    .map((p) => p.quiz_score!);
  const avgScore = quizScores.length > 0
    ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
    : 0;

  const totalMemorized = progressList.filter(
    (p) => p.flashcard_completed && (p.quiz_score ?? 0) >= 80
  ).length;

  // Current day stages
  const r1Stages = getR1Stages(currentProgress);
  const r2Stages = getR2Stages(currentProgress);
  const r1Done = isR1Complete(currentProgress);
  const r1AllDone = r1Stages.every((s) => s.status === 'done');
  const r2AllDone = r2Stages.every((s) => s.status === 'done');

  const activeR1 = r1Stages.find((s) => s.status === 'active');
  const activeR2 = r2Stages.find((s) => s.status === 'active');
  const ctaStage = activeR1 ?? activeR2;
  const ctaRound = activeR1 ? '1' : '2';

  const wrongWordEntries = Object.entries(wrongWordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const daysByBook = new Map<string, { book: VocaBook; days: VocaDay[] }>();
  for (const book of books) {
    daysByBook.set(book.id, { book, days: [] });
  }
  for (const day of sortedDays) {
    daysByBook.get(day.book_id)?.days.push(day);
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* ── Header Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white"
        style={{ background: COLORS.header }}
      >
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />

        <h2 className="relative text-2xl md:text-3xl font-bold">안녕하세요, {userName}님! 👋</h2>
        <p className="relative mt-1 text-white/80">오늘도 단어를 정복해볼까요?</p>

        <div className="relative mt-4 flex flex-wrap gap-3">
          {[`학습 단어 ${wordCount}개`, `완료 단계 ${r1CompletedStages}`, currentDay ? `현재: ${currentDay.title}` : ''].filter(Boolean).map((text) => (
            <span key={text} className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold text-gray-800" style={{ background: 'white' }}>
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard label="완료 단계" value={r1CompletedStages} sub={`전체 ${days.length * 4}단계 중`} color={COLORS.statMint} icon={<CheckCircle className="h-5 w-5" />} />
        <StatCard label="완료 단원" value={completedDays} sub={`전체 ${days.length}단원 중`} color={COLORS.statPurple} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="암기 완료" value={totalMemorized} sub="플래시카드+퀴즈 통과" color={COLORS.statAmber} icon={<Sparkles className="h-5 w-5" />} />
        <StatCard label="평균 점수" value={avgScore > 0 ? `${avgScore}점` : '-'} sub="퀴즈 평균" color={COLORS.statSky} icon={<ClipboardList className="h-5 w-5" />} />
      </div>

      {/* ── Flow Card: Round 1 ── */}
      {currentDay && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-base font-bold">📖 1회독 — 기본 단어 암기</div>
              <div className="text-sm text-gray-400 mt-0.5">4단계를 모두 통과해야 1회독이 완료됩니다</div>
            </div>
            <span className="shrink-0 rounded-full px-3.5 py-1 text-xs font-bold" style={{ background: r1AllDone ? '#DCFCE7' : '#F5F3FF', color: r1AllDone ? COLORS.green : '#7C3AED' }}>
              {r1AllDone ? '완료 ✓' : '진행 중'}
            </span>
          </div>

          {/* Steps */}
          <div className="flex items-stretch gap-0 mb-5 overflow-visible">
            {r1Stages.map((stage, i) => (
              <div key={stage.key} className="contents">
                {i > 0 && <div className="flex items-center justify-center self-center px-1 md:px-1.5 text-gray-300 text-sm shrink-0">→</div>}
                <FlowStep stage={stage} dayId={currentDay.id} />
              </div>
            ))}
          </div>

          {/* CTA */}
          {ctaStage && ctaRound === '1' && (
            <FlowCta stage={ctaStage} dayId={currentDay.id} />
          )}
        </div>
      )}

      {/* ── Flow Card: Round 2 ── */}
      {currentDay && (
        <div className={`rounded-2xl border border-gray-200 bg-white p-5 md:p-7 ${!r1Done ? 'opacity-55' : ''}`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-base font-bold">📗 2회독 — 유의어 · 반의어 · 숙어</div>
              <div className="text-sm text-gray-400 mt-0.5">
                {r1Done ? '3단계를 모두 통과해야 2회독이 완료됩니다' : '1회독 완료 후 해금됩니다'}
              </div>
            </div>
            <span className="shrink-0 rounded-full px-3.5 py-1 text-xs font-bold" style={{
              background: r2AllDone ? '#DCFCE7' : !r1Done ? '#F3F4F6' : '#F5F3FF',
              color: r2AllDone ? COLORS.green : !r1Done ? '#9CA3AF' : '#7C3AED',
            }}>
              {r2AllDone ? '완료 ✓' : !r1Done ? '🔒 잠김' : '진행 중'}
            </span>
          </div>

          {/* Steps */}
          <div className="flex items-stretch gap-0 mb-5 overflow-visible">
            {r2Stages.map((stage, i) => (
              <div key={stage.key} className="contents">
                {i > 0 && <div className="flex items-center justify-center self-center px-1 md:px-1.5 text-gray-300 text-sm shrink-0">→</div>}
                <FlowStep stage={stage} dayId={currentDay.id} />
              </div>
            ))}
          </div>

          {/* CTA */}
          {ctaStage && ctaRound === '2' && (
            <FlowCta stage={ctaStage} dayId={currentDay.id} />
          )}
        </div>
      )}

      {/* ── Bottom: Wrong Words + Day Progress ── */}
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
          <h3 className="text-sm font-bold mb-3">📈 이번 단원 진행률</h3>
          <div className="space-y-3">
            {sortedDays.map((day) => {
              const p = progressMap.get(day.id) ?? null;
              const stagesComplete =
                (p?.flashcard_completed ? 1 : 0) +
                ((p?.quiz_score ?? 0) >= 80 ? 1 : 0) +
                ((p?.spelling_score ?? 0) >= 80 ? 1 : 0) +
                (p?.matching_completed ? 1 : 0);
              const pct = Math.round((stagesComplete / 4) * 100);
              const isDone = isR1Complete(p);
              const isActive = currentDay?.id === day.id;

              return (
                <div key={day.id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium truncate">{day.title}</span>
                    <span className="text-xs shrink-0 ml-2" style={{ color: isDone ? COLORS.green : isActive ? '#7C3AED' : '#9CA3AF', fontWeight: isDone || isActive ? 700 : 400 }}>
                      {isDone ? '100%' : isActive ? '진행 중' : `잠김 🔒`}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${pct}%`,
                      background: isDone ? `linear-gradient(to right, ${COLORS.progressDone}, #4DD9C0)` : isActive ? COLORS.progressActive : '#E5E7EB',
                    }} />
                  </div>
                </div>
              );
            })}
            {sortedDays.length === 0 && (
              <p className="text-sm text-gray-500">등록된 Day가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-3.5" style={{ borderLeftWidth: 4, borderLeftColor: color }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

function FlowStep({ stage, dayId }: { stage: Stage; dayId: string }) {
  const isDone = stage.status === 'done';
  const isActive = stage.status === 'active';
  const isLocked = stage.status === 'locked';

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
        background: isDone ? COLORS.green : isActive ? '#7C3AED' : '#E5E7EB',
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
        color: isDone ? COLORS.green : isActive ? '#7C3AED' : '#4B5563',
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
        background: isDone ? COLORS.green : isActive ? '#7C3AED' : '#E5E7EB',
        color: isDone || isActive ? 'white' : '#9CA3AF',
      }}>
        {isDone ? (stage.actualScore || '완료') : stage.scoreRequirement}
      </div>
    </div>
  );

  if (!isLocked && dayId) {
    return <Link href={`/student/voca/${dayId}`} className="block" style={{ flex: isActive ? 1.35 : 1 }}>{card}</Link>;
  }
  return <div style={{ flex: isActive ? 1.35 : 1 }}>{card}</div>;
}

function FlowCta({ stage, dayId }: { stage: Stage; dayId: string }) {
  const cta = getCtaText(stage);
  return (
    <div className="flex items-center justify-between rounded-xl p-3.5 md:p-4" style={{ background: 'linear-gradient(120deg, #F5F3FF, #EDE9FE)', border: '1px solid rgba(37,99,235,0.08)' }}>
      <div className="mr-3 min-w-0">
        <div className="text-sm font-semibold" style={{ color: '#7C3AED' }}>{cta.title}</div>
        <div className="text-sm text-gray-500 mt-0.5 truncate">{cta.sub}</div>
      </div>
      <Link
        href={`/student/voca/${dayId}`}
        className="shrink-0 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white whitespace-nowrap"
        style={{ background: '#7C3AED', boxShadow: '0 4px 12px rgba(37,99,235,0.15)' }}
      >
        {stage.label} 시작하기 →
      </Link>
    </div>
  );
}
