'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  BookA,
  FileText,
  MessageCircle,
  Play,
  ClipboardList,
  MonitorPlay,
  FileQuestion,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface LearningOrderGuideProps {
  mode: 'card' | 'dialog';
}

const PHASE1_STEPS = [
  { num: 1, label: '단어 암기', icon: BookA },
  { num: 2, label: '본문 암기', icon: FileText },
  { num: 3, label: '대화문 암기', icon: MessageCircle },
  { num: 4, label: '문법1 영상 시청', icon: Play },
  { num: 5, label: '문법1 문제 풀기', icon: ClipboardList },
  { num: 6, label: '문법2 영상 시청', icon: Play },
  { num: 7, label: '문법2 문제 풀기', icon: ClipboardList },
  { num: 8, label: '교과서 본문 설명 영상 시청', icon: MonitorPlay },
];

const PHASE2_STEPS = [
  { num: 1, label: '본문 2차 암기', icon: FileText },
  { num: 2, label: '대화문 2차 암기', icon: MessageCircle },
  { num: 3, label: '기출문제 풀기', icon: FileQuestion },
  { num: 4, label: '예상문제 풀기', icon: Sparkles },
];

function StepItem({
  num,
  label,
  icon: Icon,
  color,
}: {
  num: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'purple' | 'orange';
}) {
  const colors = {
    purple: {
      numBg: 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300',
      icon: 'text-brand-500',
    },
    orange: {
      numBg: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      icon: 'text-orange-500',
    },
  };
  const c = colors[color];

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
          c.numBg,
        )}
      >
        {num}
      </span>
      <Icon className={cn('h-4 w-4 shrink-0', c.icon)} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function PhaseSection({
  title,
  subtitle,
  steps,
  color,
  bgClass,
}: {
  title: string;
  subtitle: string;
  steps: typeof PHASE1_STEPS;
  color: 'purple' | 'orange';
  bgClass: string;
}) {
  return (
    <div className={cn('rounded-lg p-4', bgClass)}>
      <h4
        className={cn(
          'text-sm font-bold mb-0.5',
          color === 'purple' ? 'text-brand-700 dark:text-brand-300' : 'text-orange-700 dark:text-orange-300',
        )}
      >
        {title}
      </h4>
      <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>
      <div className="space-y-2">
        {steps.map((step) => (
          <StepItem key={`${color}-${step.num}`} {...step} color={color} />
        ))}
      </div>
    </div>
  );
}

function GuideContent() {
  return (
    <div className="space-y-3">
      <PhaseSection
        title="Phase 1 — 1회독"
        subtitle="단원별로 순서대로 진행 (1과 → 2과 → 3과...)"
        steps={PHASE1_STEPS}
        color="purple"
        bgClass="bg-brand-50 dark:bg-brand-950/30"
      />
      <PhaseSection
        title="Phase 2 — 2회독 + 시험대비"
        subtitle="1회독 완료 후, 단원별로 반복 (1과 → 2과 → 3과...)"
        steps={PHASE2_STEPS}
        color="orange"
        bgClass="bg-orange-50 dark:bg-orange-950/30"
      />
    </div>
  );
}

export function LearningOrderGuide({ mode }: LearningOrderGuideProps) {
  const [open, setOpen] = useState(false);

  if (mode === 'dialog') {
    return <GuideContent />;
  }

  // Card mode: collapsible
  return (
    <div className="rounded-xl border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold">학습 순서 가이드</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <GuideContent />
        </div>
      )}
    </div>
  );
}
