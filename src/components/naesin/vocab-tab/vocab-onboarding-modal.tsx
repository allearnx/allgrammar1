'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookOpen, HelpCircle, PenLine, Target, Lightbulb, ArrowRight } from 'lucide-react';

export function VocabOnboardingModal({
  open,
  onClose,
  hasSpelling,
}: {
  open: boolean;
  onClose: () => void;
  hasSpelling: boolean;
}) {
  const steps = [
    {
      icon: BookOpen,
      title: '1단계: 플래시카드',
      desc: '카드를 탭해서 뒤집고 단어와 뜻을 확인해요.',
      tip: '모르는 단어는 여러 번 반복해서 봐요!',
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      icon: HelpCircle,
      title: '2단계: 퀴즈',
      desc: '영어 단어를 보고 뜻을 맞추는 사지선다 퀴즈!',
      tip: '80점 이상이면 통과!',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    },
    ...(hasSpelling
      ? [
          {
            icon: PenLine,
            title: '3단계: 스펠링',
            desc: '뜻을 보고 영어 스펠링을 직접 입력해요.',
            tip: '80점 이상이면 단어 암기 완료!',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          },
        ]
      : []),
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">단어 암기 학습 방법</DialogTitle>
          <DialogDescription className="text-center">
            {hasSpelling ? '3단계' : '2단계'}를 순서대로 완료하면 다음으로 넘어갈 수 있어요!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-2">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className={cn('rounded-lg p-3', step.bg)}>
                <div className="flex items-start gap-3">
                  <div className={cn('mt-0.5 shrink-0', step.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className={cn('font-semibold text-sm', step.color)}>{step.title}</p>
                    <p className="text-sm text-foreground">{step.desc}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lightbulb className="h-3 w-3 shrink-0" />
                      <span>{step.tip}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30">
          <Target className="h-4 w-4 text-orange-600 shrink-0" />
          <p className="text-xs text-orange-700 dark:text-orange-300">
            퀴즈와 스펠링에서 <span className="font-bold">80점 이상</span>을 받으면 다음 단계가 열려요!
          </p>
        </div>

        <Button onClick={onClose} className="w-full mt-1">
          시작하기
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
