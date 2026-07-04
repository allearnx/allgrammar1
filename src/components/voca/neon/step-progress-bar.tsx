'use client';

import { cn } from '@/lib/utils';
import { Check, Lock } from 'lucide-react';

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

export function StepProgressBar({ steps, currentStep, onStepClick }: StepProgressBarProps) {
  return (
    <div className="flex items-center justify-between px-2 py-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          {/* Step circle */}
          <button
            onClick={() => step.unlocked && onStepClick(i)}
            disabled={!step.unlocked}
            className={cn(
              'relative flex items-center justify-center w-9 h-9 rounded-full border-2 text-sm font-bold transition-all',
              step.completed && 'bg-green-50 border-green-500 text-green-600',
              !step.completed && i === currentStep && 'border-brand-500 text-brand-600 bg-brand-50',
              !step.completed && i !== currentStep && step.unlocked && 'border-gray-300 text-gray-400 hover:border-gray-400',
              !step.unlocked && 'border-gray-200 text-gray-300 cursor-not-allowed',
            )}
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
          <span className={cn(
            'ml-1.5 text-xs font-medium whitespace-nowrap hidden sm:inline',
            step.completed && 'text-green-600',
            !step.completed && i === currentStep && 'text-brand-600',
            !step.completed && i !== currentStep && 'text-gray-400',
          )}>
            {step.label}
          </span>
          {/* Connector line */}
          {i < steps.length - 1 && (
            <div className={cn(
              'flex-1 h-0.5 mx-2',
              step.completed ? 'bg-green-300' : 'bg-gray-200',
            )} />
          )}
        </div>
      ))}
    </div>
  );
}
