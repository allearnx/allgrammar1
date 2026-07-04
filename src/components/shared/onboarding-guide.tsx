import Link from 'next/link';
import { Rocket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Step {
  icon: LucideIcon;
  text: string;
  href?: string;
  linkLabel?: string;
}

interface OnboardingGuideProps {
  steps: Step[];
}

export function OnboardingGuide({ steps }: OnboardingGuideProps) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: 'linear-gradient(120deg, #E8F0FE, #D2E3FC)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Rocket className="h-5 w-5 text-brand-500" />
        <h3 className="text-lg font-bold">학원 시작 가이드</h3>
      </div>
      <div className="space-y-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="flex items-center justify-center bg-brand-500 text-white rounded-full w-7 h-7 text-sm font-bold shrink-0">
                {i + 1}
              </span>
              <Icon className="h-5 w-5 text-brand-400 shrink-0" />
              <span className="text-sm text-gray-700">{step.text}</span>
              {step.href && step.linkLabel && (
                <Link
                  href={step.href}
                  className="ml-auto bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-1.5 text-xs font-medium shrink-0 transition-colors"
                >
                  {step.linkLabel}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
