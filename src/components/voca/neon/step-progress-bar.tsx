'use client';

import { cn } from '@/lib/utils';
import { Check, Lock } from 'lucide-react';
import { VOCA_STEP_THEMES } from '@/components/voca/voca-brand';

interface Step {
  label: string;
  completed: boolean;
  unlocked: boolean;
}

interface StepProgressBarProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (index: number) => void;
}

/** 단계 진행 바 — 구글 4색 순환 (플래시카드=파랑, 매칭=빨강, 스펠링=노랑, 퀴즈=초록) */
export function StepProgressBar({ steps, currentStep, onStepClick }: StepProgressBarProps) {
  return (
    <div className="flex items-center justify-between px-2 py-3">
      {steps.map((step, i) => {
        const theme = VOCA_STEP_THEMES[i % VOCA_STEP_THEMES.length];
        const isCurrent = !step.completed && i === currentStep;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            {/* Step circle */}
            <button
              onClick={() => step.unlocked && onStepClick(i)}
              disabled={!step.unlocked}
              className={cn(
                'relative flex items-center justify-center w-9 h-9 rounded-full border-2 text-sm font-bold transition-all',
                !step.unlocked && 'border-gray-200 text-gray-300 cursor-not-allowed',
                !step.completed && !isCurrent && step.unlocked && 'border-gray-300 text-gray-400 hover:border-gray-400',
              )}
              style={
                step.completed
                  ? { borderColor: theme.solid, background: theme.bg, color: theme.text }
                  : isCurrent
                    ? { borderColor: theme.solid, background: theme.solid, color: '#fff' }
                    : undefined
              }
            >
              {step.completed ? (
                <Check className="h-4 w-4" />
              ) : !step.unlocked ? (
                <Lock className="h-3 w-3" />
              ) : (
                i + 1
              )}
            </button>
            {/* Label */}
            <span
              className={cn(
                'ml-1.5 text-xs font-medium whitespace-nowrap hidden sm:inline',
                !step.completed && !isCurrent && 'text-gray-400',
              )}
              style={step.completed || isCurrent ? { color: theme.text, fontWeight: 700 } : undefined}
            >
              {step.label}
            </span>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-2"
                style={{ background: step.completed ? theme.solid : '#e5e7eb', opacity: step.completed ? 0.4 : 1 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
