import Link from 'next/link';
import {
  CheckCircle,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { NaesinStageStatuses, NaesinStageStatus } from '@/types/database';

type StageKey = 'vocab' | 'passage' | 'dialogue' | 'textbookVideo' | 'grammar' | 'problem' | 'mockExam' | 'lastReview';

interface StageConfig {
  key: StageKey;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  unlockHint: string | null;
}

function StageIcon({ status, FallbackIcon }: { status: NaesinStageStatus; FallbackIcon: React.ComponentType<{ className?: string }> }) {
  if (status === 'completed') return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
  return <FallbackIcon className="h-3.5 w-3.5" />;
}

interface StageNavBarProps {
  stages: StageConfig[];
  stageStatuses: NaesinStageStatuses;
  currentStage: StageKey;
  unitId: string;
}

export function StageNavBar({ stages, stageStatuses, currentStage, unitId }: StageNavBarProps) {
  return (
    <TooltipProvider>
      <nav className="flex rounded-lg border bg-muted/30 p-1 gap-1">
        {stages.filter((stage) => stageStatuses[stage.key] !== 'hidden').map((stage) => {
          const status = stageStatuses[stage.key];
          const isLocked = status === 'locked';
          const isCurrent = stage.key === currentStage;
          const Icon = stage.icon;

          if (isLocked) {
            return (
              <Tooltip key={stage.key}>
                <TooltipTrigger asChild>
                  <Link
                    href={`/student/naesin/${unitId}/${stage.key}`}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs sm:text-sm opacity-40',
                      isCurrent && 'bg-background shadow-sm opacity-50'
                    )}
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{stage.label}</span>
                    <span className="sm:hidden">{stage.shortLabel}</span>
                  </Link>
                </TooltipTrigger>
                {stage.unlockHint && (
                  <TooltipContent>
                    {stage.unlockHint}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          }

          return (
            <Link
              key={stage.key}
              href={`/student/naesin/${unitId}/${stage.key}`}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs sm:text-sm transition-colors',
                isCurrent
                  ? 'bg-background shadow-sm font-semibold text-primary'
                  : 'hover:bg-background/50 text-muted-foreground'
              )}
            >
              <StageIcon status={status} FallbackIcon={Icon} />
              <span className="hidden sm:inline">{stage.label}</span>
              <span className="sm:hidden">{stage.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
