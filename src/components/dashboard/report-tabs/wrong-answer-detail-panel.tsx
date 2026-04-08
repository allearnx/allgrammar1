'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, CheckCircle, AlertTriangle, Pencil, Check } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { FormattedText } from '@/components/shared/formatted-text';
import { cn } from '@/lib/utils';
import type { NaesinWrongAnswer, NaesinWrongAnswerStage } from '@/types/naesin';

const STAGE_LABELS: Record<string, string> = {
  vocab: '단어',
  passage: '교과서 암기',
  dialogue: '대화문 암기',
  grammar: '문법',
  problem: '문제풀이',
  lastReview: '직전보강',
};

const STAGE_ORDER: NaesinWrongAnswerStage[] = ['vocab', 'passage', 'dialogue', 'grammar', 'problem', 'lastReview'];

interface Props {
  studentId: string;
  onRefresh?: () => void;
}

const TEXTBOOK_STAGES = new Set(['passage', 'dialogue', 'vocab']);

export function WrongAnswerDetailPanel({ studentId, onRefresh }: Props) {
  const [wrongAnswers, setWrongAnswers] = useState<NaesinWrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<NaesinWrongAnswerStage | 'all'>('all');
  const [unresolvedOnly, setUnresolvedOnly] = useState(false);

  const fetchWrongAnswers = useCallback(async () => {
    try {
      const data = await fetchWithToast<NaesinWrongAnswer[]>(
        `/api/naesin/wrong-answers/student?studentId=${studentId}`,
        { method: 'GET', silent: true, logContext: 'wrong_answer_detail_panel' }
      );
      setWrongAnswers(Array.isArray(data) ? data : []);
    } catch {
      // silently handled
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchWrongAnswers();
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [fetchWrongAnswers]);

  // Derive available stages from data
  const availableStages = useMemo(() => {
    const set = new Set(wrongAnswers.map((wa) => wa.stage));
    return STAGE_ORDER.filter((s) => set.has(s));
  }, [wrongAnswers]);

  // Filter
  const filtered = useMemo(() => {
    let items = wrongAnswers;
    if (stageFilter !== 'all') items = items.filter((wa) => wa.stage === stageFilter);
    if (unresolvedOnly) items = items.filter((wa) => !wa.resolved);
    return items;
  }, [wrongAnswers, stageFilter, unresolvedOnly]);

  // Group: stage → unit
  const grouped = useMemo(() => {
    const map: Record<string, Record<string, { unitLabel: string; items: NaesinWrongAnswer[] }>> = {};
    for (const wa of filtered) {
      if (!map[wa.stage]) map[wa.stage] = {};
      const unitKey = wa.unit_id;
      if (!map[wa.stage][unitKey]) {
        const unitLabel = wa.unit
          ? `L${wa.unit.unit_number} ${wa.unit.title}`
          : '기타';
        map[wa.stage][unitKey] = { unitLabel, items: [] };
      }
      map[wa.stage][unitKey].items.push(wa);
    }
    return map;
  }, [filtered]);

  const totalCount = wrongAnswers.length;
  const unresolvedCount = wrongAnswers.filter((wa) => !wa.resolved).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
        <span className="ml-2 text-sm text-gray-500">오답 상세 로딩 중...</span>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">오답 기록이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <span className="text-sm font-medium">
          전체 {totalCount}개
          {unresolvedCount > 0 && (
            <span className="text-red-500 ml-1">(미해결 {unresolvedCount}개)</span>
          )}
        </span>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        {/* Stage filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <button
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
              stageFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
            onClick={() => setStageFilter('all')}
          >
            전체
          </button>
          {availableStages.map((s) => {
            const count = wrongAnswers.filter((wa) => wa.stage === s).length;
            return (
              <button
                key={s}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                  stageFilter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
                onClick={() => setStageFilter(s)}
              >
                {STAGE_LABELS[s]} {count}
              </button>
            );
          })}
        </div>

        {/* Unresolved toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch checked={unresolvedOnly} onCheckedChange={setUnresolvedOnly} />
          <span className="text-xs text-muted-foreground">미해결만 보기</span>
        </label>
      </div>

      {/* Filtered count */}
      {(stageFilter !== 'all' || unresolvedOnly) && (
        <p className="text-xs text-muted-foreground">
          필터 결과: {filtered.length}개
        </p>
      )}

      {/* Grouped results: stage → unit */}
      {filtered.length === 0 ? (
        <div className="text-center py-6">
          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">해당 조건에 맞는 오답이 없습니다.</p>
        </div>
      ) : (
        STAGE_ORDER.filter((s) => grouped[s]).map((stage) => (
          <div key={stage} className="space-y-3">
            <h4 className="text-sm font-semibold border-b pb-1">
              {STAGE_LABELS[stage] || stage}
            </h4>
            {Object.entries(grouped[stage])
              .sort(([, a], [, b]) => a.unitLabel.localeCompare(b.unitLabel, 'ko'))
              .map(([unitKey, { unitLabel, items }]) => (
                <div key={unitKey} className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground pl-1">
                    {unitLabel} ({items.length}개)
                  </p>
                  {items.map((wa) => (
                    <ReadOnlyWrongAnswerCard
                      key={wa.id}
                      wrongAnswer={wa}
                      studentId={studentId}
                      onCorrected={() => { fetchWrongAnswers(); onRefresh?.(); }}
                    />
                  ))}
                </div>
              ))}
          </div>
        ))
      )}
    </div>
  );
}

function ReadOnlyWrongAnswerCard({
  wrongAnswer,
  studentId,
  onCorrected,
}: {
  wrongAnswer: NaesinWrongAnswer;
  studentId: string;
  onCorrected: () => void;
}) {
  const data = wrongAnswer.question_data as Record<string, unknown>;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAnswer, setNewAnswer] = useState(String(data.correctAnswer || ''));
  const [submitting, setSubmitting] = useState(false);

  const options = data.options as string[] | undefined;
  const explanation = data.explanation as string | undefined;
  const isProblemStage = wrongAnswer.stage === 'problem' && wrongAnswer.sheet_id;
  const isTextbookStage = TEXTBOOK_STAGES.has(wrongAnswer.stage);
  const questionIndex = data.number ? Number(data.number) - 1 : -1;

  const handleCorrectAnswer = async () => {
    if (!wrongAnswer.sheet_id || questionIndex < 0 || !newAnswer.trim()) return;
    setSubmitting(true);
    try {
      await fetchWithToast(
        '/api/naesin/problems/correct-answer',
        {
          method: 'PATCH',
          body: {
            sheetId: wrongAnswer.sheet_id,
            questionIndex,
            newAnswer: newAnswer.trim(),
          },
          logContext: 'correct_answer',
        }
      );
      setDialogOpen(false);
      onCorrected();
    } catch {
      // handled by fetchWithToast
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptAnswer = async () => {
    if (!wrongAnswer.sheet_id || questionIndex < 0 || !String(data.userAnswer || '')) return;
    setSubmitting(true);
    try {
      await fetchWithToast(
        '/api/naesin/problems/correct-answer',
        {
          method: 'PATCH',
          body: {
            sheetId: wrongAnswer.sheet_id,
            questionIndex,
            newAnswer: String(data.userAnswer),
            mode: 'accept',
          },
          successMessage: '정답처리 완료',
          logContext: 'accept_answer',
        }
      );
      onCorrected();
    } catch {
      // handled by fetchWithToast
    } finally {
      setSubmitting(false);
    }
  };

  // 교과서 암기 오답 정답처리 (resolved=true)
  const handleResolve = async () => {
    setSubmitting(true);
    try {
      await fetchWithToast(
        '/api/naesin/wrong-answers/student',
        {
          method: 'PATCH',
          body: {
            wrongAnswerId: wrongAnswer.id,
            studentId,
          },
          successMessage: '정답처리 완료',
          logContext: 'resolve_wrong_answer',
        }
      );
      onCorrected();
    } catch {
      // handled by fetchWithToast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card className={wrongAnswer.resolved ? 'opacity-60' : ''}>
        <CardContent className="py-3">
          <div className="text-sm space-y-1">
            {data.question ? <p className="font-medium"><FormattedText text={String(data.question)} /></p> : null}
            {data.type === 'fill_blank' ? (
              <>
                <p className="text-red-500">학생 답: {String(data.userAnswer || '-')}</p>
                <p className="text-green-600">정답: {String(data.correctAnswer)}</p>
              </>
            ) : null}
            {data.type === 'translation' ? (
              <>
                <p className="text-muted-foreground">{String(data.koreanText || '')}</p>
                <p className="text-red-500">학생 답: {String(data.userAnswer || '-')}</p>
                {data.correctAnswer ? <p className="text-green-600">정답: {String(data.correctAnswer)}</p> : null}
                {data.feedback ? <p className="text-sm">{String(data.feedback)}</p> : null}
              </>
            ) : null}
            {data.type === 'ordering' ? (
              <>
                <p className="text-red-500">학생 배열: {String(data.userOrder || '-')}</p>
                <p className="text-green-600">정답 순서: {String(data.correctOrder)}</p>
              </>
            ) : null}
            {data.type === 'first_letter' ? (
              <>
                <p className="text-muted-foreground">{String(data.koreanText || '')}</p>
                <p className="text-red-500">학생 답: {String(data.userAnswer || '-')}</p>
                <p className="text-green-600">정답: {String(data.correctAnswer)}</p>
              </>
            ) : null}
            {data.number && data.type !== 'fill_blank' && data.type !== 'translation' && data.type !== 'ordering' && data.type !== 'first_letter' ? (
              <>
                <p className="text-red-500">학생 답: {String(data.userAnswer || '-')}</p>
                <p className="text-green-600">정답: {String(data.correctAnswer)}</p>
              </>
            ) : null}
            {options && options.length > 0 && (
              <div className="mt-1 pl-2 border-l-2 border-muted space-y-0.5">
                {options.map((opt, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{i + 1}. {opt}</p>
                ))}
              </div>
            )}
            {explanation && (
              <p className="text-xs text-blue-600 mt-1">해설: {explanation}</p>
            )}
            <div className="flex items-center gap-1.5 pt-1">
              {wrongAnswer.sheet?.title && (
                <Badge variant="outline" className="text-xs">
                  {wrongAnswer.sheet.title}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {wrongAnswer.source_type}
              </Badge>
              {wrongAnswer.resolved && (
                <Badge className="bg-green-100 text-green-700 border-0 text-xs hover:bg-green-100">
                  해결됨
                </Badge>
              )}
              {isProblemStage && questionIndex >= 0 && (
                <div className="flex gap-1 ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-xs text-green-600"
                    onClick={handleAcceptAnswer}
                    disabled={submitting || !String(data.userAnswer || '')}
                  >
                    {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-0.5" /> : <Check className="h-3 w-3 mr-0.5" />}
                    정답처리
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-xs text-muted-foreground"
                    onClick={() => {
                      setNewAnswer(String(data.correctAnswer || ''));
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-3 w-3 mr-0.5" />
                    정답 수정
                  </Button>
                </div>
              )}
              {isTextbookStage && !wrongAnswer.resolved && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-xs text-green-600 ml-auto"
                  onClick={handleResolve}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-0.5" /> : <Check className="h-3 w-3 mr-0.5" />}
                  정답처리
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>정답 수정</DialogTitle>
            <DialogDescription>
              {data.number ? `${String(data.number)}번 문항` : null}
              {wrongAnswer.sheet?.title ? ` — ${wrongAnswer.sheet.title}` : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {data.question ? (
              <p className="text-sm text-muted-foreground"><FormattedText text={String(data.question)} /></p>
            ) : null}
            <div>
              <label className="text-sm font-medium">새 정답</label>
              <Input
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="정답을 입력하세요"
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !submitting) handleCorrectAnswer();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              취소
            </Button>
            <Button onClick={handleCorrectAnswer} disabled={submitting || !newAnswer.trim()}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              수정 및 재채점
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
