'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight, ChevronRightIcon, CheckCircle, Lock, BookOpen, FileText, GraduationCap, ClipboardList, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StageProgressBar } from './stage-progress-bar';
import type { NaesinStageStatuses, NaesinStageStatus } from '@/types/database';
import Link from 'next/link';

interface StageProgress {
  vocab: number;
  passage: number;
  grammar: number;
  problem: number;
}

interface LessonCardProps {
  unitId: string;
  unitNumber: number;
  title: string;
  stages: NaesinStageStatuses;
  stageProgress: StageProgress;
}

const STAGE_ROWS = [
  { key: 'vocab' as const, label: '단어 암기', icon: BookOpen, progressKey: 'vocab' as const, unlockHint: null },
  { key: 'passage' as const, label: '교과서 암기', icon: FileText, progressKey: 'passage' as const, unlockHint: '단어 암기 80% 이상 달성 시 해금' },
  { key: 'grammar' as const, label: '문법 설명', icon: GraduationCap, progressKey: 'grammar' as const, unlockHint: '교과서 암기 80% 이상 달성 시 해금' },
  { key: 'problem' as const, label: '문제풀이', icon: ClipboardList, progressKey: 'problem' as const, unlockHint: '문법 설명 완료 시 해금' },
  { key: 'lastReview' as const, label: '직전보강', icon: Brain, progressKey: null, unlockHint: '시험 D-3일 전 자동 해금' },
] as const;

export function LessonCard({
  unitId,
  unitNumber,
  title,
  stages,
  stageProgress,
}: LessonCardProps) {
  const [expanded, setExpanded] = useState(true);

  const visibleStages = (['vocab', 'passage', 'grammar', 'problem'] as const).filter(
    (key) => stages[key] !== 'hidden'
  );
  const allCompleted = visibleStages.length > 0 && visibleStages.every((key) => stages[key] === 'completed');

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header - always visible */}
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-bold shrink-0">
            {unitNumber}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm">{title}</h3>
            <div className="flex gap-1 mt-1">
              {(['vocab', 'passage', 'grammar', 'problem', 'lastReview'] as const)
                .filter((key) => stages[key] !== 'hidden')
                .map((key) => (
                  <StageStatusDot key={key} status={stages[key]} />
                ))}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {allCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Expanded: clickable stage rows */}
        {expanded && (
          <div className="border-t divide-y">
            {STAGE_ROWS.filter((row) => stages[row.key] !== 'hidden').map((row) => {
              const status = stages[row.key];
              const isLocked = status === 'locked';
              const percent = row.progressKey ? stageProgress[row.progressKey] : 0;
              const Icon = row.icon;

              const content = (
                <div
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 transition-colors',
                    isLocked
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-muted/50 cursor-pointer'
                  )}
                >
                  <div className="shrink-0">
                    {status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : isLocked ? (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Icon className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{row.label}</p>
                    {isLocked && row.unlockHint ? (
                      <p className="text-xs text-muted-foreground mt-1">{row.unlockHint}</p>
                    ) : (
                      <StageProgressBar
                        label=""
                        percent={percent}
                        className="mt-1"
                      />
                    )}
                  </div>
                  {!isLocked && (
                    <ChevronRightIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              );

              if (isLocked) {
                return <div key={row.key}>{content}</div>;
              }

              return (
                <Link
                  key={row.key}
                  href={`/student/naesin/${unitId}/${row.key}`}
                  className="block"
                >
                  {content}
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StageStatusDot({ status }: { status: NaesinStageStatus }) {
  return (
    <div
      className={cn(
        'h-2 w-2 rounded-full',
        status === 'completed'
          ? 'bg-green-500'
          : status === 'available'
            ? 'bg-indigo-500'
            : 'bg-gray-300'
      )}
    />
  );
}
