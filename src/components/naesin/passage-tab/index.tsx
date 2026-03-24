'use client';

import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { FileText } from 'lucide-react';
import { passageToTextbookPassage } from '@/lib/naesin/adapters';
import { NaesinFillBlanksView } from './fill-blanks-view';
import { NaesinOrderingView } from './ordering-view';
import { NaesinTranslationView } from './translation-view';
import { GrammarVocabView } from './grammar-vocab-view';
import { StageDirectionModal, PassageOnboardingModal } from './passage-onboarding';
import type { NaesinPassage } from '@/types/database';
import type { GrammarVocabItem } from '@/types/naesin';

const ONBOARDING_KEY = 'naesin-passage-onboarding-seen';
const STAGE_DIRECTION_KEY = 'naesin-passage-stage-directions-seen';

export type PassageStageType = 'fill_blanks' | 'ordering' | 'translation' | 'grammar_vocab';

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

  const uniqueStages = useMemo(() => [...new Set(stages)], [stages]);

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
    const firstStage = uniqueStages[0];
    if (firstStage && !seenDirections.has(firstStage)) {
      setStageDirection(firstStage);
    }
  }

  function handleTabChange(tabValue: string) {
    setActiveTab(tabValue);
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
      <div className="flex flex-col items-center py-12">
        <FileText className="h-10 w-10 text-muted-foreground/30 mb-2" />
        <p className="text-center text-muted-foreground">
          등록된 교과서 지문이 없습니다.
        </p>
      </div>
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
      logger.error('naesin.passage_tab', { error: err instanceof Error ? err.message : String(err) });
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
      logger.error('naesin.passage_tab', { error: err instanceof Error ? err.message : String(err) });
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
