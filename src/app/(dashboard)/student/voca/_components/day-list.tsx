'use client';

import Link from 'next/link';
import { Lock, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { VOCA_STEP_THEMES } from '@/components/voca/voca-brand';
import { dayRowStatus, type ProgressMap, type RoundRules } from '@/lib/voca/home-progress';
import type { VocaDay, VocaStudentProgress } from '@/types/voca';

/**
 * Day 목록 — 4색 배지·진행 바·1/2회독 직행 칩. 무료 한도 밖 Day는 잠금 표시.
 * 행 상태 계산은 lib/voca/home-progress.dayRowStatus.
 */
export function DayList({ days, progressMap, freeDayLimit, roundRules, submissionStatuses, onGoRound }: {
  days: VocaDay[];
  progressMap: ProgressMap;
  freeDayLimit: number;
  roundRules: RoundRules;
  submissionStatuses: Record<string, string>;
  onGoRound: (dayId: string, round: 1 | 2) => void;
}) {
  return (
    <>
    {days.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg text-gray-300 font-medium">아직 등록된 Day가 없습니다</p>
      </div>
    ) : (
      <div className="space-y-2.5">
        {days.map((day, index) => {
          const prog = progressMap.get(day.id);
          const locked = freeDayLimit > 0 && index >= freeDayLimit;
          const dayColor = VOCA_STEP_THEMES[index % VOCA_STEP_THEMES.length].solid;

          if (locked) {
            return (
              <div key={day.id} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3.5 opacity-50">
                <DayBadge index={index} color={dayColor} variant="locked" />
                <p className="flex-1 font-medium text-gray-400 text-sm">
                  {day.title}
                  {day.description && (
                    <span className="ml-2 text-[11px] font-normal text-gray-200">{day.description}</span>
                  )}
                </p>
                <Lock className="h-4 w-4 text-gray-300" />
              </div>
            );
          }

          // 진행 상태 계산은 lib/voca/home-progress.dayRowStatus (모드·면제·잠금 규칙 포함)
          const {
            isCompleted, stepsNow, totalSteps, roundLabel: dayRoundLabel, completedLabel,
            r1Completed: completed, r2Completed,
          } = dayRowStatus(prog, roundRules);

          return (
            <Link key={day.id} href={`/student/voca/${day.id}`}>
              <div className={`group flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-all duration-200 hover:shadow-md active:scale-[0.99] ${
                isCompleted
                  ? 'border-green-200 bg-green-50/40'
                  : 'border-gray-200 bg-white hover:border-[#d2e3fc]'
              }`}>
                <DayBadge index={index} color={dayColor} variant={isCompleted ? 'done' : 'default'} />
                <div className="flex-1 min-w-0">
                  <p className={`voca-display text-[15px] truncate ${isCompleted ? 'text-green-700' : 'text-gray-800'}`} style={{ fontWeight: 700 }}>
                    {day.title}
                    {day.description && (
                      <span className="ml-2 text-[11px] font-normal text-gray-300">{day.description}</span>
                    )}
                  </p>
                  {stepsNow > 0 && !isCompleted && (
                    <div className="flex items-center gap-2 mt-1.5">
                      {dayRoundLabel && (
                        <span className="text-[10px] font-bold text-gray-400">{dayRoundLabel}</span>
                      )}
                      <div className="flex gap-0.5">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                          <div
                            key={i}
                            className="h-1 rounded-full transition-all"
                            style={{
                              width: i < stepsNow ? 16 : 8,
                              background: i < stepsNow ? dayColor : '#e5e7eb',
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-medium text-gray-400">{stepsNow}/{totalSteps}</span>
                    </div>
                  )}
                  {isCompleted && (
                    <p className="text-[11px] font-medium text-green-600 mt-0.5">
                      {completedLabel}
                    </p>
                  )}
                  {(roundRules.roundMode === 'day' || roundRules.bookCurrentRound === '1') && <ProgressBadges progress={prog} submissionStatus={submissionStatuses[day.id]} />}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* 회독 직행 칩 — 진도 표시 겸 바로가기 (2026-07-22 완전 개방) */}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onGoRound(day.id, 1); }}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors ${
                      completed
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                    }`}
                  >
                    1회독{completed && ' ✓'}
                  </button>
                  {roundRules.round2Locked ? (
                    <span className="flex items-center gap-0.5 rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-300">
                      <Lock className="h-2.5 w-2.5" />2회독
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onGoRound(day.id, 2); }}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors ${
                        r2Completed
                          ? 'bg-brand-100 text-brand-700 hover:bg-brand-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                      }`}
                    >
                      2회독{r2Completed && ' ✓'}
                    </button>
                  )}
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary/70 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    )}
    </>
  );
}

function DayBadge({ index, color, variant }: { index: number; color: string; variant: 'default' | 'done' | 'locked' }) {
  if (variant === 'locked') {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 shrink-0">
        <span className="text-sm font-bold text-gray-300">{index + 1}</span>
      </div>
    );
  }
  if (variant === 'done') {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-100 shrink-0">
        <span className="text-sm font-bold text-green-600">{index + 1}</span>
      </div>
    );
  }
  return (
    <div
      className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
      style={{ background: color }}
    >
      <span className="voca-display text-sm text-white" style={{ fontWeight: 700 }}>{index + 1}</span>
    </div>
  );
}

function ProgressBadges({ progress, submissionStatus }: { progress?: VocaStudentProgress | null; submissionStatus?: string }) {
  const hasRound2 = progress?.round2_flashcard_completed ||
    progress?.round2_quiz_score != null ||
    progress?.round2_matching_completed;

  if (!hasRound2 && !submissionStatus) return null;

  return (
    <div className="mt-1.5">
      {hasRound2 && (
        <div className="flex gap-1 flex-wrap">
          {progress?.round2_flashcard_completed && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-blue-200 text-blue-600 bg-blue-50/50">2회 카드</Badge>
          )}
          {progress?.round2_quiz_score != null && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-blue-200 text-blue-600 bg-blue-50/50">2회 종합 {progress.round2_quiz_score}%</Badge>
          )}
          {progress?.round2_matching_completed && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-blue-200 text-blue-600 bg-blue-50/50">2회 매칭</Badge>
          )}
        </div>
      )}
      {submissionStatus && (
        <div className="flex gap-1 flex-wrap mt-0.5">
          <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${submissionStatus === 'reviewed' ? 'border-green-200 text-green-600 bg-green-50/50' : 'border-orange-200 text-orange-600 bg-orange-50/50'}`}>
            {submissionStatus === 'reviewed' ? '오답쓰기 확인됨' : '오답쓰기 제출'}
          </Badge>
        </div>
      )}
    </div>
  );
}
