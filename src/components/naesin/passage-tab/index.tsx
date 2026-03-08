'use client';

import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FileText, Shuffle, PenLine, Target, Lightbulb, ArrowRight } from 'lucide-react';
import { passageToTextbookPassage } from '@/lib/naesin/adapters';
import { NaesinFillBlanksView } from './fill-blanks-view';
import { NaesinOrderingView } from './ordering-view';
import { NaesinTranslationView } from './translation-view';
import type { NaesinPassage } from '@/types/database';

const ONBOARDING_KEY = 'naesin-passage-onboarding-seen';

type PassageStageType = 'fill_blanks' | 'ordering' | 'translation';

const STAGE_TAB_MAP: Record<PassageStageType, { value: string; label: string }> = {
  fill_blanks: { value: 'fill-blanks', label: '빈칸 채우기' },
  ordering: { value: 'ordering', label: '순서 배열' },
  translation: { value: 'translation', label: '영작' },
};

interface PassageTabProps {
  passages: NaesinPassage[];
  unitId: string;
  onStageComplete: () => void;
  requiredStages?: string[];
}

export function PassageTab({ passages, unitId, onStageComplete, requiredStages }: PassageTabProps) {
  const stages = useMemo(() => {
    const raw = (requiredStages ?? ['fill_blanks', 'translation']) as PassageStageType[];
    return raw.filter((s) => STAGE_TAB_MAP[s]);
  }, [requiredStages]);

  // Unique stages for tabs (deduplicated, preserve order)
  const uniqueStages = useMemo(() => [...new Set(stages)], [stages]);

  // Count how many times each stage is required
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of stages) {
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [stages]);

  const firstTabValue = uniqueStages.length > 0 ? STAGE_TAB_MAP[uniqueStages[0]].value : 'fill-blanks';
  const [activeTab, setActiveTab] = useState(firstTabValue);
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_KEY)) {
        setShowOnboarding(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  function dismissOnboarding() {
    setShowOnboarding(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, '1');
    } catch {
      // localStorage unavailable
    }
  }

  if (passages.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        등록된 교과서 지문이 없습니다.
      </p>
    );
  }

  const passage = passages[currentPassageIndex];
  const textbookPassage = passageToTextbookPassage(passage);
  const hasBlanks =
    (Array.isArray(passage.blanks_easy) && passage.blanks_easy.length > 0) ||
    (Array.isArray(passage.blanks_medium) && passage.blanks_medium.length > 0) ||
    (Array.isArray(passage.blanks_hard) && passage.blanks_hard.length > 0);
  const hasSentences = Array.isArray(passage.sentences) && passage.sentences.length > 0;

  async function savePassageProgress(type: 'fill_blanks' | 'ordering' | 'translation', score: number, wrongAnswers?: unknown[]) {
    try {
      const res = await fetch('/api/naesin/passage/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, type, score, wrongAnswers }),
      });
      const data = await res.json();
      if (data.passageCompleted) {
        toast.success('교과서 암기 단계를 완료했습니다!');
        onStageComplete();
      }
    } catch (err) {
      console.error(err);
      toast.error('진도 저장 중 오류가 발생했습니다');
    }
  }

  async function saveWrongAnswers(wrongItems: unknown[]) {
    if (wrongItems.length === 0) return;
    try {
      await fetch('/api/naesin/wrong-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          stage: 'passage',
          sourceType: activeTab,
          wrongAnswers: wrongItems,
        }),
      });
    } catch (err) {
      console.error(err);
      }
  }

  const gridCols = uniqueStages.length === 1 ? 'grid-cols-1' : uniqueStages.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className="space-y-4">
      <PassageOnboardingModal
        open={showOnboarding}
        onClose={dismissOnboarding}
        stages={uniqueStages}
      />

      {passages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {passages.map((p, idx) => (
            <button
              type="button"
              key={p.id}
              onClick={() => setCurrentPassageIndex(idx)}
              className={`shrink-0 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                idx === currentPassageIndex
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-muted border-border'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn('grid w-full', gridCols)}>
          {uniqueStages.map((stage) => {
            const tab = STAGE_TAB_MAP[stage];
            const disabled =
              (stage === 'fill_blanks' && !hasBlanks) ||
              (stage === 'ordering' && !hasSentences);
            const count = stageCounts[stage] || 1;
            return (
              <TabsTrigger key={tab.value} value={tab.value} disabled={disabled}>
                {tab.label}
                {count > 1 && <span className="ml-1 text-xs opacity-60">x{count}</span>}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {uniqueStages.includes('fill_blanks') && (
          <TabsContent value="fill-blanks" className="mt-4">
            <NaesinFillBlanksView
              key={passage.id}
              passage={textbookPassage}
              onScoreChange={(score, wrongs) => {
                savePassageProgress('fill_blanks', score);
                if (wrongs && wrongs.length > 0) saveWrongAnswers(wrongs);
              }}
            />
          </TabsContent>
        )}

        {uniqueStages.includes('ordering') && (
          <TabsContent value="ordering" className="mt-4">
            <NaesinOrderingView
              key={passage.id}
              passage={textbookPassage}
              onScoreChange={(score) => savePassageProgress('ordering', score)}
            />
          </TabsContent>
        )}

        {uniqueStages.includes('translation') && (
          <TabsContent value="translation" className="mt-4">
            <NaesinTranslationView
              key={passage.id}
              passage={textbookPassage}
              onScoreChange={(score, wrongs) => {
                savePassageProgress('translation', score);
                if (wrongs && wrongs.length > 0) saveWrongAnswers(wrongs);
              }}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

const ALL_STEPS = [
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
    color: 'text-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
  },
  {
    key: 'translation' as const,
    icon: PenLine,
    title: '영작',
    desc: '한글 해석을 보고 영어로 직접 작성해요.',
    tip: 'AI가 채점해주니까 부담 없이 써봐!',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
];

function PassageOnboardingModal({
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
