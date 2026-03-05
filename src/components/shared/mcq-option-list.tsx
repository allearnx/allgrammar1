'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MCQOptionListProps {
  options: string[];
  selectedAnswer: string | number | null;
  correctAnswer: string | number;
  showResult: boolean;
  onSelect: (value: string | number) => void;
  labelStyle?: 'alpha' | 'numeric';
  className?: string;
}

export function MCQOptionList({
  options,
  selectedAnswer,
  correctAnswer,
  showResult,
  onSelect,
  labelStyle = 'numeric',
  className,
}: MCQOptionListProps) {
  return (
    <div className={cn('grid gap-3', className)}>
      {options.map((option, idx) => {
        const value = labelStyle === 'alpha' ? idx : String(idx + 1);
        const isSelected = String(selectedAnswer) === String(value);
        const isCorrectOption = String(value) === String(correctAnswer);
        const label = labelStyle === 'alpha'
          ? `${String.fromCharCode(65 + idx)}.`
          : `${idx + 1}.`;

        return (
          <Button
            key={idx}
            variant="outline"
            className={cn(
              'h-auto py-3 px-4 text-left justify-start whitespace-normal',
              showResult && isCorrectOption && 'border-green-500 bg-green-50 text-green-700',
              showResult && isSelected && !isCorrectOption && 'border-red-500 bg-red-50 text-red-700'
            )}
            onClick={() => onSelect(value)}
            disabled={showResult}
          >
            <span className="mr-3 shrink-0 font-medium">{label}</span>
            {option}
            {showResult && isCorrectOption && <CheckCircle className="h-4 w-4 ml-auto shrink-0 text-green-500" />}
            {showResult && isSelected && !isCorrectOption && <XCircle className="h-4 w-4 ml-auto shrink-0 text-red-500" />}
          </Button>
        );
      })}
    </div>
  );
}
