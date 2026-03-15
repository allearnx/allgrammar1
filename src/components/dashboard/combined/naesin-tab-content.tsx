'use client';

import Link from 'next/link';
import { ArrowRight, Layers, CalendarDays } from 'lucide-react';
import { FlowStep } from './flow-step';
import type { NaesinUnit, NaesinStageStatuses, NaesinExamAssignment } from '@/types/naesin';

type StageStatus = 'done' | 'active' | 'locked';

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

const COLORS = {
  stepDone: { border: '#4DD9C0' },
  ctaButton: '#7C3AED',
  progressDone: '#56C9A0',
  progressActive: '#7C3AED',
};

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

interface Props {
  currentUnit: NaesinUnit | undefined;
  currentNaesinStages: NaesinStage[];
  naesinCtaStage: NaesinStage | undefined;
  sortedUnits: NaesinUnit[];
  statusesMap: Map<string, NaesinStageStatuses>;
  examAssignments: NaesinExamAssignment[];
  naesinUnits: NaesinUnit[];
}

export function NaesinTabContent({
  currentUnit,
  currentNaesinStages,
  naesinCtaStage,
  sortedUnits,
  statusesMap,
  examAssignments,
  naesinUnits,
}: Props) {
  return (
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
  );
}
