'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { cn } from '@/lib/utils';
import { Download, FileText, Lock } from 'lucide-react';
import { passageToTextbookPassage } from '@/lib/naesin/adapters';
import { NaesinFillBlanksView } from './fill-blanks-view';
import { NaesinOrderingView } from './ordering-view';
import { NaesinTranslationView } from './translation-view';
import { GrammarVocabView } from './grammar-vocab-view';
import { StageDirectionModal, PassageOnboardingModal } from './passage-onboarding';
import { usePassageTabState, STAGE_TAB_MAP } from '@/hooks/use-passage-tab-state';
import type { NaesinPassage } from '@/types/database';
import type { GrammarVocabItem } from '@/types/naesin';

export type { PassageStageType } from '@/hooks/use-passage-tab-state';

interface PassageTabProps {
  passages: NaesinPassage[];
  unitId: string;
  onStageComplete: () => void;
  requiredStages?: string[];
  translationSentencesPerPage?: number;
  naesinRequiredRounds?: number;
  round1Completed?: boolean;
}

export function PassageTab({ passages, unitId, onStageComplete, requiredStages, translationSentencesPerPage, naesinRequiredRounds, round1Completed }: PassageTabProps) {
  const s = usePassageTabState({ requiredStages, naesinRequiredRounds, round1Completed });

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

  const passage = passages[s.currentPassageIndex];
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
      const data = await fetchWithToast<{ passageCompleted?: boolean }>('/api/naesin/passage/progress', {
        body: { unitId, type, score, difficulty, round: String(s.currentRound) },
        errorMessage: '진도 저장 중 오류가 발생했습니다',
        logContext: 'naesin.passage_tab',
      });
      if (data.passageCompleted) {
        if (s.hasRound2 && s.currentRound === 1) {
          toast.success('1회독 완료! 2회독을 시작하세요');
        } else {
          toast.success('교과서 암기 단계를 완료했습니다!');
        }
        onStageComplete();
      }
    } catch {
      // error already toasted by fetchWithToast
    }
  }

  async function saveWrongAnswers(wrongItems: unknown[]) {
    if (wrongItems.length === 0) return;
    try {
      await fetchWithToast('/api/naesin/wrong-answers', {
        body: {
          unitId,
          stage: 'passage',
          sourceType: s.activeTab,
          wrongAnswers: wrongItems,
        },
        silent: true,
        logContext: 'naesin.passage_tab',
      });
    } catch {
      // swallow - fire-and-forget
    }
  }

  return (
    <div className="space-y-4">
      <PassageOnboardingModal
        open={s.showOnboarding}
        onClose={s.dismissOnboarding}
        stages={s.uniqueStages}
      />

      {/* Round toggle */}
      {s.hasRound2 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => s.setCurrentRound(1)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg border transition-colors',
              s.currentRound === 1
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card hover:bg-muted border-border'
            )}
          >
            1회독
          </button>
          <button
            type="button"
            onClick={() => round1Completed && s.setCurrentRound(2)}
            disabled={!round1Completed}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg border transition-colors',
              s.currentRound === 2
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card hover:bg-muted border-border',
              !round1Completed && 'opacity-50 cursor-not-allowed'
            )}
          >
            {!round1Completed && <Lock className="inline h-3.5 w-3.5 mr-1" />}
            2회독
          </button>
        </div>
      )}

      {s.round2Locked ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Lock className="h-10 w-10 text-muted-foreground/30 mb-2" />
          <p className="text-muted-foreground">
            1회독을 먼저 완료해야 2회독을 시작할 수 있습니다.
          </p>
        </div>
      ) : (
        <>
          {passages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {passages.map((p, idx) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => s.setCurrentPassageIndex(idx)}
                  className={`shrink-0 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    idx === s.currentPassageIndex
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card hover:bg-muted border-border'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          )}

          {passage.pdf_url && (
            <a
              href={passage.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              본문 PDF 다운로드
            </a>
          )}

          {s.stageDirection && (
            <StageDirectionModal
              stage={s.stageDirection}
              onClose={s.dismissStageDirection}
            />
          )}

          <Tabs value={s.activeTab} onValueChange={s.handleTabChange}>
            <TabsList className={cn('grid w-full', s.gridCols)}>
              {s.uniqueStages.map((stage) => {
                const tab = STAGE_TAB_MAP[stage];
                const disabled =
                  (stage === 'fill_blanks' && !hasBlanks) ||
                  (stage === 'ordering' && !hasSentences) ||
                  (stage === 'grammar_vocab' && !hasGrammarVocab);
                const count = s.stageCounts[stage] || 1;
                return (
                  <TabsTrigger key={tab.value} value={tab.value} disabled={disabled}>
                    {tab.label}
                    {count > 1 && <span className="ml-1 text-xs opacity-60">x{count}</span>}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {s.uniqueStages.includes('fill_blanks') && (
              <TabsContent value="fill-blanks" className="mt-4">
                <NaesinFillBlanksView
                  key={`${passage.id}-r${s.currentRound}`}
                  passage={textbookPassage}
                  onScoreChange={(score, wrongs, difficulty) => {
                    savePassageProgress('fill_blanks', score, difficulty);
                    if (wrongs && wrongs.length > 0) saveWrongAnswers(wrongs);
                  }}
                />
              </TabsContent>
            )}

            {s.uniqueStages.includes('ordering') && (
              <TabsContent value="ordering" className="mt-4">
                <NaesinOrderingView
                  key={`${passage.id}-r${s.currentRound}`}
                  passage={textbookPassage}
                  onScoreChange={(score) => savePassageProgress('ordering', score)}
                />
              </TabsContent>
            )}

            {s.uniqueStages.includes('translation') && (
              <TabsContent value="translation" className="mt-4">
                <NaesinTranslationView
                  key={`${passage.id}-r${s.currentRound}`}
                  passage={textbookPassage}
                  sentencesPerPage={translationSentencesPerPage}
                  onScoreChange={(score, wrongs) => {
                    savePassageProgress('translation', score);
                    if (wrongs && wrongs.length > 0) saveWrongAnswers(wrongs);
                  }}
                />
              </TabsContent>
            )}

            {s.uniqueStages.includes('grammar_vocab') && (
              <TabsContent value="grammar-vocab" className="mt-4">
                <GrammarVocabView
                  key={`${passage.id}-r${s.currentRound}`}
                  items={grammarVocabItems}
                  onScoreChange={(score, wrongs) => {
                    savePassageProgress('grammar_vocab', score);
                    if (wrongs && wrongs.length > 0) saveWrongAnswers(wrongs);
                  }}
                />
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
}
