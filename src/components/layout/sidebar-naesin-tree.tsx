'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Lock,
} from 'lucide-react';
import type { NaesinStageStatus } from '@/types/database';
import type { NaesinSidebarExam } from './sidebar-nav-config';

const STAGE_ITEMS = [
  { key: 'vocab' as const, label: '단어 암기', stage: 'vocab' },
  { key: 'passage' as const, label: '교과서 암기', stage: 'passage' },
  { key: 'grammar' as const, label: '문법 설명', stage: 'grammar' },
  { key: 'problem' as const, label: '문제풀이', stage: 'problem' },
  { key: 'lastReview' as const, label: '직전보강', stage: 'lastReview' },
] as const;

function StageIcon({ status }: { status: NaesinStageStatus }) {
  if (status === 'completed') return <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />;
  if (status === 'locked') return <Lock className="h-3 w-3 text-muted-foreground shrink-0" />;
  return <div className="h-3 w-3 rounded-full border-2 border-indigo-500 shrink-0" />;
}

function getDDayLabel(examDate: string | null): string | null {
  if (!examDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  const diff = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `D+${Math.abs(diff)}`;
  if (diff === 0) return 'D-Day';
  return `D-${diff}`;
}

export function NaesinTree({ exams, pathname, onNavigate }: { exams: NaesinSidebarExam[]; pathname: string; onNavigate?: () => void }) {
  // Find exam with in-progress units (first non-all-completed exam)
  const activeExamIdx = exams.findIndex((exam) =>
    exam.units.some((u) => {
      const s = u.stageStatuses;
      return !(s.vocab === 'completed' && s.passage === 'completed' && s.grammar === 'completed' && s.problem === 'completed');
    })
  );

  const [openExams, setOpenExams] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    if (activeExamIdx >= 0) initial.add(exams[activeExamIdx].round);
    return initial;
  });
  const [openUnits, setOpenUnits] = useState<Set<string>>(() => new Set());

  function toggleExam(round: number) {
    setOpenExams((prev) => {
      const next = new Set(prev);
      if (next.has(round)) next.delete(round);
      else next.add(round);
      return next;
    });
  }

  function toggleUnit(unitId: string) {
    setOpenUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  }

  return (
    <div className="space-y-0.5">
      {exams.map((exam) => {
        const isExamOpen = openExams.has(exam.round);
        const allCompleted = exam.units.every((u) => {
          const s = u.stageStatuses;
          return s.vocab === 'completed' && s.passage === 'completed' && s.grammar === 'completed' && s.problem === 'completed';
        });
        const dday = getDDayLabel(exam.examDate);

        return (
          <div key={exam.round}>
            {/* Exam round header */}
            <button
              onClick={() => toggleExam(exam.round)}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-medium rounded-md hover:bg-slate-100 transition-colors"
            >
              {isExamOpen ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
              <span className="truncate flex-1 text-left">
                {exam.label}
              </span>
              {allCompleted && <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />}
              {dday && (
                <span className="text-[10px] text-muted-foreground shrink-0">{dday}</span>
              )}
            </button>

            {/* Units within this exam */}
            {isExamOpen && (
              <div className="ml-3 border-l border-gray-200 pl-1">
                {exam.units.map((unit) => {
                  const isUnitOpen = openUnits.has(unit.id);
                  const s = unit.stageStatuses;
                  const unitCompleted = s.vocab === 'completed' && s.passage === 'completed' && s.grammar === 'completed' && s.problem === 'completed';

                  return (
                    <div key={unit.id}>
                      {/* Unit header */}
                      <button
                        onClick={() => toggleUnit(unit.id)}
                        className="flex items-center gap-2 w-full px-2 py-1 text-xs rounded-md hover:bg-slate-100 transition-colors"
                      >
                        {isUnitOpen ? (
                          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate flex-1 text-left">
                          Lesson {unit.unitNumber}
                        </span>
                        {unitCompleted ? (
                          <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border-2 border-indigo-500 shrink-0" />
                        )}
                      </button>

                      {/* Stage items */}
                      {isUnitOpen && (
                        <div className="ml-3 border-l border-gray-200 pl-1">
                          {STAGE_ITEMS.map((item) => {
                            const status = unit.stageStatuses[item.key];
                            const isLocked = status === 'locked';
                            const href = `/student/naesin/${unit.id}/${item.stage}`;
                            const isActive = pathname === href;

                            return (
                              <Link
                                key={item.key}
                                href={href}
                                onClick={onNavigate}
                                className={cn(
                                  'flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-colors',
                                  isLocked
                                    ? 'opacity-40'
                                    : isActive
                                      ? 'bg-indigo-50 text-indigo-600 font-medium'
                                      : 'hover:bg-slate-100 text-slate-500'
                                )}
                              >
                                <StageIcon status={status} />
                                <span className="truncate">{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
