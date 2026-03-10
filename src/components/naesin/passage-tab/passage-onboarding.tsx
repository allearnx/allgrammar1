import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FileText, Shuffle, PenLine, BookOpen, Target, Lightbulb, ArrowRight } from 'lucide-react';
import type { PassageStageType } from '.';

export const ALL_STEPS = [
  {
    key: 'fill_blanks' as const,
    icon: FileText,
    title: '빈칸 채우기',
    desc: '한글 해석을 보면서 영어 지문의 빈칸을 채워요.',
    tip: '난이도를 쉬움 → 보통 → 어려움 순으로 도전!',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    key: 'ordering' as const,
    icon: Shuffle,
    title: '순서 배열',
    desc: '한글 뜻을 보고 영어 단어를 올바른 순서로 배열해요.',
    tip: '드래그해서 순서를 바꿀 수 있어요!',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
  },
  {
    key: 'translation' as const,
    icon: PenLine,
    title: '영작',
    desc: '한글 해석을 보고 영어로 직접 작성해요.',
    tip: '대소문자, 마침표, 쉼표, 공백 모두 정확히!',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  {
    key: 'grammar_vocab' as const,
    icon: BookOpen,
    title: '어법/어휘',
    desc: '문장에서 올바른 어법/어휘 표현을 선택해요.',
    tip: '헷갈리는 문법과 어휘를 정확히 구별해봐!',
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
];

export function StageDirectionModal({
  stage,
  onClose,
}: {
  stage: PassageStageType;
  onClose: () => void;
}) {
  const config = ALL_STEPS.find((s) => s.key === stage);
  if (!config) return null;
  const Icon = config.icon;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className={cn('text-center text-base flex items-center justify-center gap-2', config.color)}>
            <Icon className="h-5 w-5" />
            {config.title}
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            {config.desc}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-1.5 justify-center text-xs text-muted-foreground">
          <Lightbulb className="h-3.5 w-3.5 shrink-0" />
          <span>{config.tip}</span>
        </div>
        {stage === 'translation' && (
          <div className="space-y-1.5 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-800 dark:text-blue-200">안내</p>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc pl-4">
              <li>한국어를 보고 영어 원문을 그대로 작성</li>
              <li>AI가 채점하므로 사소한 오타는 괜찮아요</li>
              <li>단어 누락이나 의미 변화는 오답 처리</li>
            </ul>
          </div>
        )}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/30">
          <Target className="h-4 w-4 text-orange-600 shrink-0" />
          <p className="text-xs text-orange-700 dark:text-orange-300">
            <span className="font-bold">80점 이상</span>이면 통과!
          </p>
        </div>
        <Button onClick={onClose} className="w-full" size="sm">
          시작하기
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function PassageOnboardingModal({
  open,
  onClose,
  stages,
}: {
  open: boolean;
  onClose: () => void;
  stages: PassageStageType[];
}) {
  const steps = stages.map((s, i) => {
    const config = ALL_STEPS.find((step) => step.key === s)!;
    return { ...config, title: `${i + 1}단계: ${config.title}` };
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">교과서 암기 학습 방법</DialogTitle>
          <DialogDescription className="text-center">
            {steps.length}단계를 순서대로 완료하면 다음으로 넘어갈 수 있어요!
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
            각 단계에서 <span className="font-bold">80점 이상</span>을 받으면 다음 단계가 열려요!
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
