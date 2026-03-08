'use client';

import { useState, useEffect } from 'react';
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

interface PassageTabProps {
  passages: NaesinPassage[];
  unitId: string;
  onStageComplete: () => void;
}

export function PassageTab({ passages, unitId, onStageComplete }: PassageTabProps) {
  const [activeTab, setActiveTab] = useState('fill-blanks');
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
    } catch {
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
    } catch {
      // Silent fail
    }
  }

  return (
    <div className="space-y-4">
      <PassageOnboardingModal open={showOnboarding} onClose={dismissOnboarding} />

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fill-blanks" disabled={!hasBlanks}>
            빈칸 채우기
          </TabsTrigger>
          <TabsTrigger value="ordering" disabled={!hasSentences}>
            순서 배열
          </TabsTrigger>
          <TabsTrigger value="translation">
            영작
          </TabsTrigger>
        </TabsList>

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

        <TabsContent value="ordering" className="mt-4">
          <NaesinOrderingView
            key={passage.id}
            passage={textbookPassage}
            onScoreChange={(score) => savePassageProgress('ordering', score)}
          />
        </TabsContent>

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
      </Tabs>
    </div>
  );
}

function PassageOnboardingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const steps = [
    {
      icon: FileText,
      title: '1단계: 빈칸 채우기',
      desc: '한글 해석을 보면서 영어 지문의 빈칸을 채워요.',
      tip: '난이도를 쉬움 → 보통 → 어려움 순으로 도전!',
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      icon: Shuffle,
      title: '2단계: 순서 배열',
      desc: '한글 뜻을 보고 영어 단어를 올바른 순서로 배열해요.',
      tip: '드래그해서 순서를 바꿀 수 있어요!',
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
    },
    {
      icon: PenLine,
      title: '3단계: 영작',
      desc: '한글 해석을 보고 영어로 직접 작성해요.',
      tip: 'AI가 채점해주니까 부담 없이 써봐!',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">교과서 암기 학습 방법</DialogTitle>
          <DialogDescription className="text-center">
            3단계를 순서대로 완료하면 다음으로 넘어갈 수 있어요!
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
            빈칸 채우기와 영작에서 <span className="font-bold">80점 이상</span>을 받으면 다음 단계가 열려요!
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
