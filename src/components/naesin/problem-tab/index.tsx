'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, RotateCcw, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { getEncouragement } from '@/lib/naesin/encouragement';
import { extractAnswer } from '@/lib/naesin/normalize-answer';
import { InteractiveProblemView } from './interactive-view';
import { ImageAnswerView } from './image-answer-view';
import { ExternalPassageView } from './external-passage-view';
import { PaperTestView } from './paper-test-view';
import { SHEET_ADMIN_LITE_COLUMNS, type NaesinProblemSheet, type NaesinProblemSheetLite } from '@/types/naesin';

type ViewMode = 'interactive' | 'paper_test';
const VIEW_MODE_KEY = 'naesin-view-mode';

interface LastAttempt {
  score: number;
  total_questions: number;
  wrong_answers: { number: number; userAnswer: string | number; correctAnswer: string | number; question?: string; subParts?: { label: string; answer: string }[]; retryCorrect?: boolean }[];
  created_at: string;
}

interface ProblemTabProps {
  sheets: (NaesinProblemSheet | NaesinProblemSheetLite)[];
  unitId?: string | null;
  onStageComplete?: () => void;
  bestScoreBySheet?: Record<string, number>;
  lastAttemptBySheet?: Record<string, LastAttempt>;
  onActiveSheetChange?: (category: string) => void;
}

function isFullSheet(sheet: NaesinProblemSheet | NaesinProblemSheetLite): sheet is NaesinProblemSheet {
  return 'questions' in sheet;
}

export function ProblemTab({ sheets, unitId, onStageComplete, bestScoreBySheet, lastAttemptBySheet, onActiveSheetChange }: ProblemTabProps) {
  const [activeSheetId, setActiveSheetId] = useState<string | null>(sheets[0]?.id || null);
  const [retrySheetIds, setRetrySheetIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try { return (localStorage.getItem(VIEW_MODE_KEY) as ViewMode) || 'interactive'; } catch { return 'interactive'; }
  });

  // Cache for full sheet data (lazy-loaded)
  const [fullSheetCache, setFullSheetCache] = useState<Record<string, NaesinProblemSheet>>({});
  const [loadingSheetId, setLoadingSheetId] = useState<string | null>(null);
  const [failedSheetId, setFailedSheetId] = useState<string | null>(null);

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode);
    try { localStorage.setItem(VIEW_MODE_KEY, mode); } catch { /* ignore */ }
  }

  const activeSheet = sheets.find((s) => s.id === activeSheetId) || sheets[0];

  // Get full sheet: from cache, from props (if already full), or null (needs fetch)
  const fullActiveSheet: NaesinProblemSheet | null = activeSheet
    ? fullSheetCache[activeSheet.id] ?? (isFullSheet(activeSheet) ? activeSheet : null)
    : null;

  const fetchFullSheet = useCallback(async (sheetId: string) => {
    if (fullSheetCache[sheetId]) return;
    setLoadingSheetId(sheetId);
    setFailedSheetId(null);
    try {
      // 시트 목록과 동일한 브라우저 클라이언트로 직접 조회한다. 서버 라우트
      // (쿠키 인증)를 거치지 않아 인증 실패 표면이 줄고, 목록 로드가 이미
      // 통과한 RLS 경로를 그대로 재사용해 학생이 무한 로딩에 빠지지 않는다.
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data, error } = await supabase
        .from('naesin_problem_sheets')
        .select(SHEET_ADMIN_LITE_COLUMNS + ', questions')
        .eq('id', sheetId)
        .single();
      if (error || !data) {
        logger.error('problem_tab.load_full_sheet', { sheetId, error: error?.message ?? 'no row' });
        setFailedSheetId(sheetId);
        return;
      }
      setFullSheetCache((prev) => ({ ...prev, [sheetId]: data as unknown as NaesinProblemSheet }));
    } catch (err) {
      logger.error('problem_tab.load_full_sheet', { sheetId, error: err instanceof Error ? err.message : String(err) });
      setFailedSheetId(sheetId);
    } finally {
      setLoadingSheetId(null);
    }
  }, [fullSheetCache]);

  // Lazy-load full sheet when active sheet changes (and we don't have it yet)
  useEffect(() => {
    if (!activeSheet) return;
    const hasCompleted = bestScoreBySheet?.[activeSheet.id] != null;
    const lastAttempt = lastAttemptBySheet?.[activeSheet.id];
    const showSummary = hasCompleted && lastAttempt && !retrySheetIds.has(activeSheet.id);
    // Don't fetch if showing summary (no need for questions)
    if (showSummary) return;
    if (!fullSheetCache[activeSheet.id] && !isFullSheet(activeSheet)) {
      fetchFullSheet(activeSheet.id);
    }
  }, [activeSheet, fullSheetCache, fetchFullSheet, bestScoreBySheet, lastAttemptBySheet, retrySheetIds]);

  useEffect(() => {
    if (activeSheet && onActiveSheetChange) {
      onActiveSheetChange(activeSheet.category);
    }
  }, [activeSheet?.category, onActiveSheetChange]);

  if (sheets.length === 0) {
    return (
      <div className="flex flex-col items-center py-12">
        <ClipboardList className="h-10 w-10 text-muted-foreground/30 mb-2" />
        <p className="text-center text-muted-foreground">
          등록된 문제지가 없습니다.
        </p>
      </div>
    );
  }

  const lastAttempt = lastAttemptBySheet?.[activeSheet.id];
  const hasCompleted = bestScoreBySheet?.[activeSheet.id] != null;
  const showSummary = hasCompleted && lastAttempt && !retrySheetIds.has(activeSheet.id);
  const isLoading = loadingSheetId === activeSheet.id;

  function handleRetry() {
    setRetrySheetIds((prev) => new Set(prev).add(activeSheet.id));
    // Ensure full sheet is loaded for retry
    if (!fullSheetCache[activeSheet.id] && !isFullSheet(activeSheet)) {
      fetchFullSheet(activeSheet.id);
    }
  }

  function handleSelectSheet(sheetId: string) {
    setActiveSheetId(sheetId);
  }

  // Use full sheet for rendering problem views, fall back to lite for list/summary
  const sheetForView = fullActiveSheet;
  const hasQuestions = sheetForView ? (sheetForView.questions as unknown[])?.length > 0 : false;

  return (
    <div className="space-y-4">
      {sheets.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sheets.map((sheet) => {
            const bestScore = bestScoreBySheet?.[sheet.id];
            const hasScore = bestScore != null;
            const isActive = activeSheetId === sheet.id;
            return (
              <button
                type="button"
                key={sheet.id}
                onClick={() => handleSelectSheet(sheet.id)}
                className={cn(
                  'shrink-0 px-3 py-1.5 text-sm rounded-full border transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : hasScore
                      ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                      : 'bg-card hover:bg-muted border-border'
                )}
              >
                {hasScore && <span className="mr-1">&#10003;</span>}
                {sheet.title}
                {hasScore && <span className="ml-1">{bestScore}점</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Mode selector: only for interactive + problem/mock_exam */}
      {!showSummary &&
        activeSheet.mode === 'interactive' &&
        ['problem', 'mock_exam'].includes(activeSheet.category) &&
        hasQuestions && (
        <div className="flex justify-center print:hidden">
          <div className="inline-flex rounded-lg border bg-muted p-0.5 text-sm">
            <button
              type="button"
              onClick={() => handleViewModeChange('interactive')}
              className={cn(
                'px-3 py-1 rounded-md transition-colors',
                viewMode === 'interactive' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              문제별
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('paper_test')}
              className={cn(
                'px-3 py-1 rounded-md transition-colors',
                viewMode === 'paper_test' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              시험지
            </button>
          </div>
        </div>
      )}

      {showSummary ? (
        <AttemptSummary attempt={lastAttempt} onRetry={handleRetry} />
      ) : failedSheetId === activeSheet.id && !sheetForView ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <p className="text-sm text-muted-foreground">문제를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { setFailedSheetId(null); fetchFullSheet(activeSheet.id); }}
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            다시 불러오기
          </Button>
        </div>
      ) : isLoading || !sheetForView ? (
        <div className="flex flex-col items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">문제를 불러오는 중...</p>
        </div>
      ) : activeSheet.category === 'external_passage' ? (
        <ExternalPassageView
          key={activeSheet.id}
          sheet={sheetForView}
          unitId={unitId}
          onComplete={onStageComplete}
        />
      ) : activeSheet.mode === 'interactive' && hasQuestions ? (
        viewMode === 'paper_test' ? (
          <PaperTestView
            key={`paper-${activeSheet.id}`}
            sheet={sheetForView}
            unitId={unitId}
            onComplete={onStageComplete}
          />
        ) : (
          <InteractiveProblemView
            key={activeSheet.id}
            sheet={sheetForView}
            unitId={unitId}
            onComplete={onStageComplete}
          />
        )
      ) : (
        <ImageAnswerView
          key={activeSheet.id}
          sheet={sheetForView}
          unitId={unitId}
          onComplete={onStageComplete}
        />
      )}
    </div>
  );
}

function AttemptSummary({ attempt, onRetry }: { attempt: LastAttempt; onRetry: () => void }) {
  const pct = attempt.score;
  const correct = Math.round((pct / 100) * attempt.total_questions);
  const allItems = attempt.wrong_answers || [];
  const genuineWrong = allItems.filter(w => !w.retryCorrect);
  const retryCorrect = allItems.filter(w => w.retryCorrect);
  const date = new Date(attempt.created_at);
  const dateStr = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <p className="text-xs text-muted-foreground">{dateStr} 풀이 결과</p>
        <p className="font-handwriting text-7xl text-red-500 -rotate-2">
          {pct}점
        </p>
        <p className="text-muted-foreground">
          {attempt.total_questions}문제 중 {correct}개 정답
          {retryCorrect.length > 0 && (
            <span className="text-amber-600"> (🔺 {retryCorrect.length}개 포함)</span>
          )}
        </p>
        <p className="text-sm font-medium text-muted-foreground">
          {getEncouragement(pct)}
        </p>
      </div>

      {retryCorrect.length > 0 && (
        <Card className="border-amber-200">
          <CardContent className="py-4">
            <p className="font-medium text-amber-600 mb-3">🔺 한 번 틀린 후 맞춘 문제 ({retryCorrect.length}개)</p>
            <div className="space-y-3">
              {retryCorrect.map((w, i) => (
                <div key={i} className="text-sm border-b last:border-0 pb-2">
                  <p className="font-medium">#{w.number}. {w.question || ''}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {genuineWrong.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <p className="font-medium text-red-600 mb-3">❌ 틀린 문제 ({genuineWrong.length}개)</p>
            <div className="space-y-3">
              {genuineWrong.map((w, i) => (
                <div key={i} className="text-sm border-b last:border-0 pb-2 space-y-1">
                  <p className="font-medium">#{w.number}. {w.question || ''}</p>
                  {w.subParts?.length ? (
                    <div className="space-y-0.5">
                      {w.subParts.map((sp: { label: string; answer: string }, j: number) => {
                        const userParts = String(w.userAnswer || '').split(' / ');
                        return (
                          <div key={j} className="text-xs">
                            <span className="font-medium">{sp.label}</span>{' '}
                            <span className="text-red-500">{userParts[j]?.trim() || '-'}</span>
                            {' → '}
                            <span className="text-green-600">{sp.answer}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <>
                      <p className="text-red-500">내 답: {String(w.userAnswer || '-')}</p>
                      <p className="text-green-600">정답: {extractAnswer(w.correctAnswer)}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          다시 풀기
        </Button>
      </div>
    </div>
  );
}
