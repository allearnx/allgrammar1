'use client';

import { cn } from '@/lib/utils';

interface OmrSheetProps {
  totalQuestions: number;
  maxOptions?: number;
  answers: Record<number, number>;
  results?: Record<number, boolean> | null;
  answerKey?: number[];
  disabled?: boolean;
  onSelect: (questionIndex: number, optionIndex: number) => void;
}

export function OmrSheet({
  totalQuestions,
  maxOptions = 5,
  answers,
  results,
  answerKey,
  disabled = false,
  onSelect,
}: OmrSheetProps) {
  return (
    <div className="space-y-1">
      {/* Header row */}
      <div className="flex items-center gap-1 px-2 pb-2 border-b">
        <div className="w-10 text-xs font-medium text-muted-foreground text-center">번호</div>
        {Array.from({ length: maxOptions }, (_, i) => (
          <div key={i} className="flex-1 text-xs font-medium text-muted-foreground text-center">
            {i + 1}
          </div>
        ))}
      </div>

      {/* Question rows */}
      {Array.from({ length: totalQuestions }, (_, qIdx) => {
        const questionNum = qIdx + 1;
        const selectedOption = answers[qIdx];
        const result = results?.[qIdx];
        const correctAnswer = answerKey?.[qIdx];

        return (
          <div
            key={qIdx}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors',
              result === true && 'bg-green-50',
              result === false && 'bg-red-50'
            )}
          >
            <div className="w-10 text-sm font-medium text-center">{questionNum}</div>
            {Array.from({ length: maxOptions }, (_, oIdx) => {
              const optionNum = oIdx + 1;
              const isSelected = selectedOption === optionNum;
              const isCorrectAnswer = results !== null && correctAnswer === optionNum;

              return (
                <button
                  key={oIdx}
                  disabled={disabled}
                  onClick={() => onSelect(qIdx, optionNum)}
                  className={cn(
                    'flex-1 aspect-square max-w-10 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all',
                    // Default state
                    !isSelected && !isCorrectAnswer && 'border-gray-300 hover:border-gray-400',
                    // Selected (no result yet)
                    isSelected && results === null && 'border-primary bg-primary text-primary-foreground',
                    // Correct answer shown
                    isSelected && result === true && 'border-green-500 bg-green-500 text-white',
                    // Wrong answer: selected but wrong
                    isSelected && result === false && 'border-red-500 bg-red-500 text-white',
                    // Show correct answer when user was wrong
                    !isSelected && isCorrectAnswer && result === false && 'border-green-500 bg-green-100 text-green-700',
                    disabled && 'cursor-not-allowed opacity-70'
                  )}
                >
                  {isSelected ? optionNum : ''}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
