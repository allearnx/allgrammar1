'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { cn } from '@/lib/utils';
import { Download, FileText, Lock, ArrowRight, BookOpen } from 'lucide-react';
import { ExternalPassageView, type ExternalPassageAttempt, type ExternalPassageAttemptBrief } from '@/components/naesin/problem-tab/external-passage-view';
import { passageToTextbookPassage, augmentPassageStages } from '@/lib/naesin/adapters';
import { NaesinFillBlanksView } from './fill-blanks-view';
import { NaesinOrderingView } from './ordering-view';
import { NaesinTranslationView } from './translation-view';
import { GrammarVocabView } from './grammar-vocab-view';
import { StageDirectionModal, PassageOnboardingModal } from './passage-onboarding';
import { usePassageTabState, STAGE_TAB_MAP } from '@/hooks/use-passage-tab-state';
import type { NaesinPassage } from '@/types/database';
import type { GrammarVocabItem, NaesinProblemSheet } from '@/types/naesin';

export type { PassageStageType } from '@/hooks/use-passage-tab-state';

interface PassageTabProps {
  passages: NaesinPassage[];
  unitId: string;
  onStageComplete: () => void;
  requiredStages?: string[];
  translationSentencesPerPage?: number;
  naesinRequiredRounds?: number;
  round1Completed?: boolean;
  subStageBests?: Record<string, number | null>;
  /** 외부지문 시트(questions 포함) — 교과서 본문 옆 칩으로 노출. 완료 조건에는 포함하지 않음 */
  externalPassageSheets?: NaesinProblemSheet[];
  /** 외부지문 시트별 최근 시도 (완료 요약 표시용) */
  externalAttempts?: Record<string, ExternalPassageAttempt>;
  /** 외부지문 시트별 전체 시도 이력 (최신순) — 도전 기록 표시 */
  externalAttemptHistory?: Record<string, ExternalPassageAttemptBrief[]>;
  /** 학습 세션 기록용 — 외부지문 칩 선택 시 'external_passage', 교과서 본문이면 'passage' */
  onActiveSheetChange?: (category: string) => void;
}

export function PassageTab({ passages, unitId, onStageComplete, requiredStages, translationSentencesPerPage, naesinRequiredRounds, round1Completed, subStageBests, externalPassageSheets = [], externalAttempts, externalAttemptHistory, onActiveSheetChange }: PassageTabProps) {
  const augmentedStages = useMemo(
    () => augmentPassageStages(requiredStages, passages),
    [requiredStages, passages],
  );

  const s = usePassageTabState({ requiredStages: augmentedStages, naesinRequiredRounds, round1Completed, subStageBests });

  // 통과한 서브 단계 추적 (80점 이상) — state 로 두어 통과 즉시 "다음 단계" 배너가 뜨게 함
  // (훅은 early return 앞에서 무조건 호출 — rules-of-hooks)
  const [passedSet, setPassedSet] = useState<Set<string>>(new Set());

  // 외부지문 선택 (null = 교과서 본문). 교과서 본문이 없으면 첫 외부지문을 기본 선택.
  // 모든 ExternalPassageView는 마운트 상태로 두고 hidden 처리 → 칩을 오가도 풀던 상태가 유지됨
  const [selectedExternalId, setSelectedExternalId] = useState<string | null>(
    () => (passages.length === 0 && externalPassageSheets.length > 0 ? externalPassageSheets[0].id : null),
  );
  useEffect(() => {
    onActiveSheetChange?.(selectedExternalId ? 'external_passage' : 'passage');
  }, [selectedExternalId, onActiveSheetChange]);

  // 현재 단계 다음의 탭 정보 (없으면 null). 결과 모달/배너의 "다음 단계로" 버튼용.
  // 제출 시 자동 탭 전환은 결과 모달과 충돌(경쟁)하므로 제거하고,
  // 학생이 결과를 확인하고 "다음 단계" 버튼을 누를 때만 전환한다.
  const nextTabFor = useCallback((stage: string) => {
    const idx = s.uniqueStages.indexOf(stage as typeof s.uniqueStages[number]);
    if (idx < 0 || idx >= s.uniqueStages.length - 1) return null;
    return STAGE_TAB_MAP[s.uniqueStages[idx + 1]] ?? null;
  }, [s]);

  const hasExternal = externalPassageSheets.length > 0;
  const externalSelector = hasExternal ? (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {passages.length > 0 && (
        <button
          type="button"
          onClick={() => setSelectedExternalId(null)}
          className={cn(
            'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors',
            selectedExternalId === null ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted border-border',
          )}
        >
          <BookOpen className="h-3.5 w-3.5" />
          교과서 본문
        </button>
      )}
      {externalPassageSheets.map((sheet) => {
        const attempt = externalAttempts?.[sheet.id];
        const tries = externalAttemptHistory?.[sheet.id]?.length ?? 0;
        return (
          <button
            type="button"
            key={sheet.id}
            onClick={() => setSelectedExternalId(sheet.id)}
            className={cn(
              'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors',
              selectedExternalId === sheet.id ? 'bg-orange-500 text-white border-orange-500' : 'bg-card hover:bg-muted border-border',
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            외부지문 · {sheet.title}
            {attempt && (
              <span className={cn('text-xs rounded-full px-1.5', selectedExternalId === sheet.id ? 'bg-white/25' : 'bg-green-100 text-green-700')}>
                {attempt.score}점{tries > 1 ? ` · ${tries}회` : ''}
              </span>
            )}
          </button>
        );
      })}
    </div>
  ) : null;

  // 외부지문 뷰 — 모두 마운트, 선택된 것만 표시 (칩 전환 시 진행 상태 보존)
  const externalViews = hasExternal ? (
    <>
      {externalPassageSheets.map((sheet) => (
        <div key={sheet.id} className={selectedExternalId === sheet.id ? undefined : 'hidden'}>
          <ExternalPassageView sheet={sheet} unitId={unitId} lastAttempt={externalAttempts?.[sheet.id]} history={externalAttemptHistory?.[sheet.id]} />
        </div>
      ))}
    </>
  ) : null;

  if (passages.length === 0) {
    return (
      <div className="space-y-4">
        {externalSelector}
        {externalViews}
        {!hasExternal && (
          <div className="flex flex-col items-center py-12">
            <FileText className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-center text-muted-foreground">
              등록된 교과서 지문이 없습니다.
            </p>
          </div>
        )}
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
      } else if (score >= 80) {
        // 서브 단계 통과 → 결과 모달의 "다음 단계" 버튼 + 배너 노출 (자동 전환은 모달 확인 시)
        setPassedSet((prev) => new Set(prev).add(type));
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
          round: s.currentRound,
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
      {externalSelector}
      {externalViews}

      <div className={cn('space-y-4', selectedExternalId !== null && 'hidden')}>
      <PassageOnboardingModal
        open={s.showOnboarding && selectedExternalId === null}
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

          {(() => {
            // 현재 탭의 단계를 통과(80점+)했고 다음 단계가 있으면 "다음 단계로" 버튼 노출.
            // (결과 모달에 다음 버튼이 없어 학생이 멈추던 문제 해결)
            const currentStage = s.uniqueStages.find((st) => STAGE_TAB_MAP[st]?.value === s.activeTab);
            if (!currentStage) return null;
            const isPassed = passedSet.has(currentStage) || (subStageBests?.[currentStage] ?? 0) >= 80;
            if (!isPassed) return null;
            const idx = s.uniqueStages.indexOf(currentStage);
            const next = s.uniqueStages[idx + 1];
            const nextTab = next ? STAGE_TAB_MAP[next] : null;
            if (!nextTab) return null;
            return (
              <button
                type="button"
                onClick={() => s.handleTabChange(nextTab.value)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
              >
                ✅ {STAGE_TAB_MAP[currentStage].label} 완료! 다음 단계 「{nextTab.label}」(으)로 넘어가기
                <ArrowRight className="h-4 w-4" />
              </button>
            );
          })()}

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
                  nextStageLabel={nextTabFor('fill_blanks')?.label}
                  onNextStage={() => { const t = nextTabFor('fill_blanks'); if (t) s.handleTabChange(t.value); }}
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
    </div>
  );
}
