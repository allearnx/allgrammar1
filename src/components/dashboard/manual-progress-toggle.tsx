'use client';

import { useState } from 'react';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/** Maps stage key → DB column name */
const STAGE_TO_FIELD: Record<string, string> = {
  vocab: 'vocab_completed',
  passage: 'passage_completed',
  dialogue: 'dialogue_completed',
  grammar: 'grammar_completed',
  problem: 'problem_completed',
  mock_exam: 'mock_exam_completed',
  passage_r2: 'round2_passage_completed',
  dialogue_r2: 'round2_dialogue_completed',
};

interface Props {
  studentId: string;
  unitId: string;
  stageKey: string;
  label: string;
  completed: boolean;
  inProgress: boolean;
}

export function ManualProgressToggle({
  studentId,
  unitId,
  stageKey,
  label,
  completed: initialCompleted,
  inProgress,
}: Props) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [saving, setSaving] = useState(false);

  const field = STAGE_TO_FIELD[stageKey];
  if (!field) return null;

  async function handleToggle() {
    const newValue = !completed;
    setSaving(true);
    try {
      await fetchWithToast('/api/naesin/progress/manual', {
        method: 'PATCH',
        body: { studentId, unitId, field, value: newValue },
        successMessage: newValue ? `${label} 완료 처리됨` : `${label} 미완료로 변경`,
        errorMessage: '진도 변경 실패',
        logContext: 'admin.manual_progress',
      });
      setCompleted(newValue);
    } catch {
      // fetchWithToast already showed toast
    } finally {
      setSaving(false);
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleToggle}
            disabled={saving}
            className="flex items-center gap-1 hover:opacity-70 transition-opacity cursor-pointer disabled:cursor-wait"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : completed ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            ) : inProgress ? (
              <Circle className="h-3.5 w-3.5 text-amber-500 fill-amber-200 dark:fill-amber-900" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
            )}
            <span className={`text-xs ${completed ? 'text-foreground' : inProgress ? 'text-amber-600 font-medium dark:text-amber-400' : 'text-muted-foreground'}`}>
              {label}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          클릭하여 {completed ? '미완료로 변경' : '완료 처리'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
