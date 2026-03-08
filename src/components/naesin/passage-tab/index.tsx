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
import { FileText, Shuffle, PenLine, BookOpen, Target, Lightbulb, ArrowRight } from 'lucide-react';
import { passageToTextbookPassage } from '@/lib/naesin/adapters';
import { NaesinFillBlanksView } from './fill-blanks-view';
import { NaesinOrderingView } from './ordering-view';
import { NaesinTranslationView } from './translation-view';
import { GrammarVocabView } from './grammar-vocab-view';
import type { NaesinPassage } from '@/types/database';
import type { GrammarVocabItem } from '@/types/naesin';

const ONBOARDING_KEY = 'naesin-passage-onboarding-seen';
const STAGE_DIRECTION_KEY = 'naesin-passage-stage-directions-seen';

type PassageStageType = 'fill_blanks' | 'ordering' | 'translation' | 'grammar_vocab';

const STAGE_TAB_MAP: Record<PassageStageType, { value: string; label: string }> = {
  fill_blanks: { value: 'fill-blanks', label: '빈칸 채우기' },
  ordering: { value: 'ordering', label: '순서 배열' },
  translation: { value: 'translation', label: '영작' },
  grammar_vocab: { value: 'grammar-vocab', label: '어법/어휘' },
};

interface PassageTabProps {
  passages: NaesinPassage[];
  unitId: string;
  onStageComplete: () => void;
  requiredStages?: string[];
  translationSentencesPerPage?: number;
}

export function PassageTab({ passages, unitId, onStageComplete, requiredStages, translationSentencesPerPage }: PassageTabProps) {
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
  const [stageDirection, setStageDirection] = useState<PassageStageType | null>(null);

  // Track which stage directions have been seen
  const [seenDirections, setSeenDirections] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STAGE_DIRECTION_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_KEY)) {
        setShowOnboarding(true);
      } else {
        // Onboarding already seen — show direction for the active stage
        const stageKey = (Object.entries(STAGE_TAB_MAP) as [PassageStageType, { value: string }][])
          .find(([, v]) => v.value === activeTab)?.[0];
        if (stageKey && !seenDirections.has(stageKey)) {
          setStageDirection(stageKey);
        }
      }
    } catch {
      // localStorage unavailable
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismissOnboarding() {
    setShowOnboarding(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, '1');
    } catch {
      // localStorage unavailable
    }
    // Show direction for the first tab after onboarding
    const firstStage = uniqueStages[0];
    if (firstStage && !seenDirections.has(firstStage)) {
      setStageDirection(firstStage);
    }
  }

  function handleTabChange(tabValue: string) {
    setActiveTab(tabValue);
    // Find the stage key for this tab value
    const stageKey = (Object.entries(STAGE_TAB_MAP) as [PassageStageType, { value: string }][])
      .find(([, v]) => v.value === tabValue)?.[0];
    if (stageKey && !seenDirections.has(stageKey)) {
      setStageDirection(stageKey);
    }
  }

  function dismissStageDirection() {
    if (!stageDirection) return;
    const next = new Set(seenDirections);
    next.add(stageDirection);
    setSeenDirections(next);
    setStageDirection(null);
    try {
      localStorage.setItem(STAGE_DIRECTION_KEY, JSON.stringify([...next]));
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
  const grammarVocabItems = (passage.grammar_vocab_items ?? []) as GrammarVocabItem[];
  const hasGrammarVocab = grammarVocabItems.length > 0;

  async function savePassageProgress(type: 'fill_blanks' | 'ordering' | 'translation' | 'grammar_vocab', score: number, difficulty?: string) {
    try {
      const res = await fetch('/api/naesin/passage/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, type, score, difficulty }),
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

  const gridCols = uniqueStages.length === 1 ? 'grid-cols-1' : uniqueStages.length === 2 ? 'grid-cols-2' : uniqueStages.length === 3 ? 'grid-cols-3' : 'grid-cols-4';

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

      {stageDirection && (
        <StageDirectionModal
          stage={stageDirection}
          onClose={dismissStageDirection}
        />
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className={cn('grid w-full', gridCols)}>
          {uniqueStages.map((stage) => {
            const tab = STAGE_TAB_MAP[stage];
            const disabled =
              (stage === 'fill_blanks' && !hasBlanks) ||
              (stage === 'ordering' && !hasSentences) ||
              (stage === 'grammar_vocab' && !hasGrammarVocab);
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
              onScoreChange={(score, wrongs, difficulty) => {
                savePassageProgress('fill_blanks', score, difficulty);
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
              sentencesPerPage={translationSentencesPerPage}
              onScoreChange={(score, wrongs) => {
                savePassageProgress('translation', score);
                if (wrongs && wrongs.length > 0) saveWrongAnswers(wrongs);
              }}
            />
          </TabsContent>
        )}

        {uniqueStages.includes('grammar_vocab') && (
          <TabsContent value="grammar-vocab" className="mt-4">
            <GrammarVocabView
              key={passage.id}
              items={grammarVocabItems}
              onScoreChange={(score) => savePassageProgress('grammar_vocab', score)}
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

function StageDirectionModal({
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
