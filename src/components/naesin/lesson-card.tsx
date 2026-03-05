'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight, CheckCircle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StageProgressBar } from './stage-progress-bar';
import type { NaesinStageStatuses } from '@/types/database';
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

export function LessonCard({
  unitId,
  unitNumber,
  title,
  stages,
  stageProgress,
}: LessonCardProps) {
  const [expanded, setExpanded] = useState(false);

  const allCompleted =
    stages.vocab === 'completed' &&
    stages.passage === 'completed' &&
    stages.grammar === 'completed' &&
    stages.problem === 'completed';

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
              {(['vocab', 'passage', 'grammar', 'problem', 'lastReview'] as const).map((key) => (
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

        {/* Expanded content */}
        {expanded && (
          <div className="px-4 pb-4 pt-1 border-t space-y-3">
            <StageProgressBar label="단어 시험" percent={stageProgress.vocab} />
            <StageProgressBar label="교과서 암기" percent={stageProgress.passage} />
            <StageProgressBar label="문법 영상" percent={stageProgress.grammar} />
            <StageProgressBar label="문제풀이" percent={stageProgress.problem} />
            {stages.lastReview !== 'locked' && (
              <StageProgressBar label="직전보강" percent={0} />
            )}
            <Link
              href={`/student/naesin/${unitId}`}
              className="block text-center text-sm text-primary font-medium mt-2 hover:underline"
            >
              학습하기 &rarr;
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StageStatusDot({ status }: { status: string }) {
  return (
    <div
      className={cn(
        'h-2 w-2 rounded-full',
        status === 'completed'
          ? 'bg-green-500'
          : status === 'available'
            ? 'bg-purple-500'
            : 'bg-gray-300'
      )}
    />
  );
}
