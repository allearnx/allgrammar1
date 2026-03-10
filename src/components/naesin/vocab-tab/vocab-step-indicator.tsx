'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export function VocabStepIndicator({
  activeTab,
  flashcardDone,
  quizScore,
  spellingScore,
  hasSpelling,
}: {
  activeTab: string;
  flashcardDone: boolean;
  quizScore: number | null;
  spellingScore: number | null;
  hasSpelling: boolean;
}) {
  const steps = [
    {
      key: 'flashcard',
      label: '플래시카드',
      number: 1,
      done: flashcardDone,
      score: null as number | null,
    },
    {
      key: 'quiz',
      label: '퀴즈',
      number: 2,
      done: quizScore !== null && quizScore >= 80,
      score: quizScore,
    },
    ...(hasSpelling
      ? [
          {
            key: 'spelling',
            label: '스펠링',
            number: 3,
            done: spellingScore !== null && spellingScore >= 80,
            score: spellingScore,
          },
        ]
      : []),
  ];

  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, i) => {
        const isCurrent = step.key === activeTab;
        return (
          <div key={step.key} className="flex items-center">
            {i > 0 && (
              <div
                className={cn(
                  'w-6 sm:w-10 h-0.5',
                  step.done || steps[i - 1].done ? 'bg-green-400' : 'bg-muted-foreground/20'
                )}
              />
            )}
            <div className="flex items-center gap-1.5">
              {/* Circle / Check */}
              <div
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0',
                  step.done
                    ? 'bg-green-500 text-white'
                    : isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {step.done ? <Check className="h-3.5 w-3.5" /> : step.number}
              </div>
              {/* Label + score */}
              <div className="flex flex-col leading-tight">
                <span
                  className={cn(
                    'text-xs sm:text-sm whitespace-nowrap',
                    step.done
                      ? 'text-green-600 font-medium'
                      : isCurrent
                        ? 'text-foreground font-semibold'
                        : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
                {step.score !== null && (
                  <span
                    className={cn(
                      'text-[10px] sm:text-xs font-medium',
                      step.score >= 80 ? 'text-green-600' : 'text-red-500'
                    )}
                  >
                    {step.score}점
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
