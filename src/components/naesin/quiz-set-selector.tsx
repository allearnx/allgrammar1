'use client';

import { Badge } from '@/components/ui/badge';
import { Lock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NaesinVocabQuizSet } from '@/types/database';

interface QuizSetSelectorProps {
  quizSets: NaesinVocabQuizSet[];
  completedSetIds: Set<string>;
  activeSetId: string | null;
  onSelect: (setId: string) => void;
}

export function QuizSetSelector({
  quizSets,
  completedSetIds,
  activeSetId,
  onSelect,
}: QuizSetSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {quizSets.map((set, idx) => {
        const isCompleted = completedSetIds.has(set.id);
        const isActive = activeSetId === set.id;
        // Locked if previous set is not completed (except first)
        const prevCompleted = idx === 0 || completedSetIds.has(quizSets[idx - 1].id);
        const isLocked = !prevCompleted && !isCompleted;

        return (
          <button
            key={set.id}
            onClick={() => !isLocked && onSelect(set.id)}
            disabled={isLocked}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground border-primary'
                : isCompleted
                  ? 'bg-green-50 text-green-700 border-green-300'
                  : isLocked
                    ? 'bg-muted text-muted-foreground border-muted cursor-not-allowed'
                    : 'bg-card hover:bg-muted border-border'
            )}
          >
            {isCompleted && <CheckCircle className="h-3 w-3" />}
            {isLocked && <Lock className="h-3 w-3" />}
            {set.title}
          </button>
        );
      })}
    </div>
  );
}
