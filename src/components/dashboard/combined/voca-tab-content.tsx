'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, BookMarked, XCircle, TrendingUp } from 'lucide-react';
import { FlowStep } from './flow-step';
import { BRAND } from '@/lib/utils/brand-colors';
import { isR1Complete } from '@/lib/dashboard/voca-helpers';
import type { VocaStage } from '@/lib/dashboard/voca-helpers';
import type { VocaDay, VocaStudentProgress } from '@/types/voca';

const COLORS = {
  stepActive: { border: BRAND.step.activeBorder },
  stepDone: { border: BRAND.step.doneBorder },
  activeLabel: BRAND.violet,
  ctaButton: BRAND.violet,
  progressDone: BRAND.progress.done,
  progressActive: BRAND.progress.active,
  wrongBg: BRAND.wrong.bg,
  wrongBorder3: BRAND.wrong.border3,
  wrongBorder2: BRAND.wrong.border2,
  wrongBorder1: BRAND.wrong.border1,
  wrongBadge: BRAND.wrong.badge,
};

interface Props {
  currentDay: VocaDay | undefined;
  r1Stages: VocaStage[];
  r2Stages: VocaStage[];
  r1Done: boolean;
  vocaCtaStage: VocaStage | undefined;
  vocaCtaRound: string;
  wrongWordEntries: [string, number][];
  currentBookDays: VocaDay[];
  vocaProgressMap: Map<string, VocaStudentProgress>;
}

export function VocaTabContent({
  currentDay,
  r1Stages,
  r2Stages,
  r1Done,
  vocaCtaStage,
  vocaCtaRound,
  wrongWordEntries,
  currentBookDays,
  vocaProgressMap,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Round 1 */}
      {currentDay && (
        <div className="rounded-2xl border bg-white p-5 md:p-6 space-y-5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> 학습 흐름 — 1회독
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium" style={{ borderColor: COLORS.stepDone.border }}>
              {currentDay.title}
            </span>
          </h3>

          <div className="flex items-stretch gap-0 overflow-visible">
            {r1Stages.map((stage, i) => (
              <div key={stage.key} className="contents">
                {i > 0 && <div className="flex items-center justify-center self-center px-1 md:px-1.5 text-gray-300 text-sm shrink-0">→</div>}
                <FlowStep stage={stage} dayId={currentDay.id} linkPrefix="/student/voca/" />
              </div>
            ))}
          </div>

          {vocaCtaStage && vocaCtaRound === '1' && (
            <div className="flex items-center justify-between rounded-xl px-5 py-3" style={{ background: 'linear-gradient(to right, #F5F3FF, #EDE9FE)' }}>
              <span className="text-sm font-medium text-gray-700">다음 단계: <strong>{vocaCtaStage.label}</strong></span>
              <Link href={`/student/voca/${currentDay.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90" style={{ background: COLORS.ctaButton }}>
                {vocaCtaStage.label} 시작하기 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Round 2 */}
      {currentDay && (
        <div className="rounded-2xl border bg-white p-5 md:p-6 space-y-5 transition-opacity" style={{ opacity: r1Done ? 1 : 0.55 }}>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <BookMarked className="h-4 w-4" /> 2회독
            {!r1Done && <span className="text-xs font-normal text-gray-400 ml-1">1회독을 완료하면 해금됩니다!</span>}
          </h3>

          <div className="flex items-stretch gap-0 overflow-visible">
            {r2Stages.map((stage, i) => (
              <div key={stage.key} className="contents">
                {i > 0 && <div className="flex items-center justify-center self-center px-1 md:px-1.5 text-gray-300 text-sm shrink-0">→</div>}
                <FlowStep stage={stage} dayId={currentDay.id} linkPrefix="/student/voca/" />
              </div>
            ))}
          </div>

          {vocaCtaStage && vocaCtaRound === '2' && (
            <div className="flex items-center justify-between rounded-xl px-5 py-3" style={{ background: 'linear-gradient(to right, #F5F3FF, #EDE9FE)' }}>
              <span className="text-sm font-medium text-gray-700">다음 단계: <strong>{vocaCtaStage.label}</strong></span>
              <Link href={`/student/voca/${currentDay.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90" style={{ background: COLORS.ctaButton }}>
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
          <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5"><XCircle className="h-4 w-4 text-rose-500" /> 틀린 단어 복습</h3>
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
            <p className="text-sm text-gray-500">틀린 단어가 없습니다! 대단해요!</p>
          )}
        </div>

        {/* Day Progress */}
        <div className="rounded-2xl border bg-white p-5 md:p-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> Day별 진행률</h3>
          <div className="space-y-3">
            {currentBookDays.map((day) => {
              const p = vocaProgressMap.get(day.id) ?? null;
              const isCurrent = day.id === currentDay?.id;
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
  );
}
