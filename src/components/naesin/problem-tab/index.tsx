'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { InteractiveProblemView } from './interactive-view';
import { ImageAnswerView } from './image-answer-view';
import type { NaesinProblemSheet } from '@/types/database';

interface ProblemTabProps {
  sheets: NaesinProblemSheet[];
  unitId: string;
  onStageComplete?: () => void;
}

export function ProblemTab({ sheets, unitId, onStageComplete }: ProblemTabProps) {
  const [activeSheetId, setActiveSheetId] = useState<string | null>(sheets[0]?.id || null);

  if (sheets.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        등록된 문제지가 없습니다.
      </p>
    );
  }

  const activeSheet = sheets.find((s) => s.id === activeSheetId) || sheets[0];

  return (
    <div className="space-y-4">
      {sheets.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sheets.map((sheet) => (
            <button
              type="button"
              key={sheet.id}
              onClick={() => setActiveSheetId(sheet.id)}
              className={cn(
                'shrink-0 px-3 py-1.5 text-sm rounded-full border transition-colors',
                activeSheetId === sheet.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-muted border-border'
              )}
            >
              {sheet.title}
            </button>
          ))}
        </div>
      )}

      {activeSheet.mode === 'interactive' ? (
        <InteractiveProblemView
          key={activeSheet.id}
          sheet={activeSheet}
          unitId={unitId}
          onComplete={onStageComplete}
        />
      ) : (
        <ImageAnswerView
          key={activeSheet.id}
          sheet={activeSheet}
          unitId={unitId}
          onComplete={onStageComplete}
        />
      )}
    </div>
  );
}
