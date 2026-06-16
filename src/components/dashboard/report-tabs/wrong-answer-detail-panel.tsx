'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { extractAnswer } from '@/lib/naesin/normalize-answer';
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
  mockExam: '예상문제',
  lastReview: '직전보강',
};

const STAGE_ORDER: NaesinWrongAnswerStage[] = ['vocab', 'passage', 'dialogue', 'grammar', 'problem', 'mockExam', 'lastReview'];

interface Props {
  studentId: string;
  onRefresh?: () => void;
}

export function WrongAnswerDetailPanel({ studentId, onRefresh }: Props) {
  const [wrongAnswers, setWrongAnswers] = useState<NaesinWrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<NaesinWrongAnswerStage | 'all'>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [resolveFilter, setResolveFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

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

  // 해결/미해결 일괄 토글 (단원 그룹 "모두 해결" 등)
  const resolveMany = useCallback(async (ids: string[], resolved: boolean) => {
    if (ids.length === 0) return;
    setBulkSubmitting(true);
    try {
      await fetchWithToast(
        '/api/naesin/wrong-answers/student',
        {
          method: 'PATCH',
          body: { wrongAnswerIds: ids, studentId, resolved },
          successMessage: resolved ? `${ids.length}개 해결 처리됨` : `${ids.length}개 미해결로 되돌림`,
          logContext: 'resolve_wrong_answers_bulk',
        }
      );
      await fetchWrongAnswers();
      onRefresh?.();
    } catch {
      // handled by fetchWithToast
    } finally {
      setBulkSubmitting(false);
    }
  }, [studentId, fetchWrongAnswers, onRefresh]);

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

  // Derive available units (과별 필터) from data — 단원번호 순 정렬
  const availableUnits = useMemo(() => {
    const map = new Map<string, { id: string; label: string; unitNumber: number; count: number }>();
    for (const wa of wrongAnswers) {
      const id = wa.unit_id || 'none';
      const existing = map.get(id);
      if (existing) { existing.count++; continue; }
      map.set(id, {
        id,
        label: wa.unit ? `L${wa.unit.unit_number} ${wa.unit.title}` : '기타',
        unitNumber: wa.unit?.unit_number ?? 9999,
        count: 1,
      });
    }
    return [...map.values()].sort((a, b) => a.unitNumber - b.unitNumber);
  }, [wrongAnswers]);

  // Filter
  const filtered = useMemo(() => {
    let items = wrongAnswers;
    if (stageFilter !== 'all') items = items.filter((wa) => wa.stage === stageFilter);
    if (unitFilter !== 'all') items = items.filter((wa) => (wa.unit_id || 'none') === unitFilter);
    if (resolveFilter === 'unresolved') items = items.filter((wa) => !wa.resolved);
    else if (resolveFilter === 'resolved') items = items.filter((wa) => wa.resolved);
    return items;
  }, [wrongAnswers, stageFilter, unitFilter, resolveFilter]);

  // Faceted count: 다른 필터들을 반영한 건수.
  // (예: 과별로 L3을 고르면 유형 칩 숫자도 L3 기준으로 표시)
  // 각 칩은 "그 값으로 바꿨을 때 보일 건수"라서, 자기 자신 차원은 인자로 받은 값만 적용.
  const countFor = useCallback(
    (opts: { stage?: NaesinWrongAnswerStage | 'all'; unit?: string; resolve?: 'all' | 'unresolved' | 'resolved' }) => {
      const st = opts.stage ?? stageFilter;
      const un = opts.unit ?? unitFilter;
      const rs = opts.resolve ?? resolveFilter;
      return wrongAnswers.filter(
        (wa) =>
          (st === 'all' || wa.stage === st) &&
          (un === 'all' || (wa.unit_id || 'none') === un) &&
          (rs === 'all' || (rs === 'resolved' ? wa.resolved : !wa.resolved)),
      ).length;
    },
    [wrongAnswers, stageFilter, unitFilter, resolveFilter],
  );

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
        {/* Unit (과별) filter chips — 단원이 2개 이상일 때만 */}
        {availableUnits.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground mr-0.5">과별</span>
            <button
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                unitFilter === 'all'
                  ? 'bg-violet-600 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
              onClick={() => setUnitFilter('all')}
            >
              전체
            </button>
            {availableUnits.map((u) => (
              <button
                key={u.id}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                  unitFilter === u.id
                    ? 'bg-violet-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
                onClick={() => setUnitFilter(u.id)}
              >
                {u.label} {countFor({ unit: u.id })}
              </button>
            ))}
          </div>
        )}

        {/* Stage filter chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground mr-0.5">유형</span>
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
            const count = countFor({ stage: s });
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

        {/* Resolve status segmented filter */}
        <div className="inline-flex rounded-lg border p-0.5 gap-0.5">
          {([
            ['all', `전체 ${countFor({ resolve: 'all' })}`],
            ['unresolved', `미해결 ${countFor({ resolve: 'unresolved' })}`],
            ['resolved', `해결 ${countFor({ resolve: 'resolved' })}`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                resolveFilter === key
                  ? key === 'unresolved'
                    ? 'bg-red-500 text-white'
                    : key === 'resolved'
                      ? 'bg-green-600 text-white'
                      : 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
              onClick={() => setResolveFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtered count */}
      {(stageFilter !== 'all' || unitFilter !== 'all' || resolveFilter !== 'all') && (
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
              .map(([unitKey, { unitLabel, items }]) => {
                const unresolvedIds = items.filter((wa) => !wa.resolved && !wa.isDraft).map((wa) => wa.id);
                return (
                <div key={unitKey} className="space-y-2">
                  <div className="flex items-center gap-2 pl-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {unitLabel} ({items.length}개)
                    </p>
                    {unresolvedIds.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-xs text-blue-600 hover:text-blue-700"
                        onClick={() => resolveMany(unresolvedIds, true)}
                        disabled={bulkSubmitting}
                      >
                        {bulkSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-0.5" /> : <Check className="h-3 w-3 mr-0.5" />}
                        모두 해결 ({unresolvedIds.length})
                      </Button>
                    )}
                  </div>
                  {items.map((wa) => (
                    <ReadOnlyWrongAnswerCard
                      key={wa.id}
                      wrongAnswer={wa}
                      studentId={studentId}
                      onCorrected={() => { fetchWrongAnswers(); onRefresh?.(); }}
                    />
                  ))}
                </div>
                );
              })}
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
  const [newAnswer, setNewAnswer] = useState(extractAnswer(data.correctAnswer));
  const [newExplanation, setNewExplanation] = useState((data.explanation as string) || '');
  const [submitting, setSubmitting] = useState(false);

  const options = data.options as string[] | undefined;
  const explanation = data.explanation as string | undefined;
  const isProblemStage = (wrongAnswer.stage === 'problem' || wrongAnswer.stage === 'mockExam') && wrongAnswer.sheet_id;
  const isDraft = wrongAnswer.isDraft;
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
            newExplanation: newExplanation.trim() || undefined,
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

  // 오답 해결/미해결 토글 — 점수는 변하지 않고 오답 목록엔 남되 '해결'로 분류
  const handleResolve = async (resolved: boolean) => {
    setSubmitting(true);
    try {
      await fetchWithToast(
        '/api/naesin/wrong-answers/student',
        {
          method: 'PATCH',
          body: {
            wrongAnswerIds: [wrongAnswer.id],
            studentId,
            resolved,
          },
          successMessage: resolved ? '해결 처리됨' : '미해결로 되돌림',
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
            {data.question ? <div className="font-medium"><FormattedText text={String(data.question)} /></div> : null}
            {data.type === 'fill_blank' ? (
              <>
                <p className="text-red-500">학생 답: {String(data.userAnswer || '-')}</p>
                <p className="text-green-600">정답: {extractAnswer(data.correctAnswer)}</p>
              </>
            ) : null}
            {data.type === 'translation' ? (
              <>
                <p className="text-muted-foreground">{String(data.koreanText || '')}</p>
                <p className="text-red-500">학생 답: {String(data.userAnswer || '-')}</p>
                {data.correctAnswer ? <p className="text-green-600">정답: {extractAnswer(data.correctAnswer)}</p> : null}
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
                <p className="text-green-600">정답: {extractAnswer(data.correctAnswer)}</p>
              </>
            ) : null}
            {data.type === 'grammar_vocab' ? (
              <>
                {data.sentence && <p className="text-muted-foreground">{String(data.sentence)}</p>}
                <p className="text-red-500">학생 선택: {String(data.selectedOption || '-')}</p>
                <p className="text-green-600">정답: {String(data.correctOption)}</p>
              </>
            ) : null}
            {data.type === 'vocab_quiz' ? (
              <>
                <p className="font-medium">{String(data.front_text)}</p>
                <p className="text-green-600">뜻: {String(data.back_text)}</p>
              </>
            ) : null}
            {data.type === 'vocab_spelling' ? (
              <>
                <p className="font-medium">{String(data.front_text)}</p>
                <p className="text-muted-foreground">{String(data.back_text)}</p>
                <p className="text-red-500">학생 답: {String(data.userAnswer || '-')}</p>
                <p className="text-green-600">정답: {extractAnswer(data.correctAnswer)}</p>
              </>
            ) : null}
            {data.number && data.type !== 'fill_blank' && data.type !== 'translation' && data.type !== 'ordering' && data.type !== 'first_letter' && data.type !== 'grammar_vocab' ? (
              <>
                <p className="text-red-500">학생 답: {String(data.userAnswer || '-')}</p>
                <p className="text-green-600">정답: {extractAnswer(data.correctAnswer)}</p>
              </>
            ) : null}
            {options && options.length > 0 && (
              <div className="mt-1 pl-2 border-l-2 border-muted space-y-0.5">
                {options.map((opt, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{i + 1}. <FormattedText text={opt} /></p>
                ))}
              </div>
            )}
            {explanation && (
              <p className="text-xs text-blue-600 mt-1">해설: <FormattedText text={explanation} /></p>
            )}
            <div className="flex items-center gap-1.5 pt-1">
              {isDraft && (
                <Badge className="bg-amber-100 text-amber-700 border-0 text-xs hover:bg-amber-100">
                  풀이 중 {wrongAnswer.draftProgress ? `(${wrongAnswer.draftProgress})` : ''}
                </Badge>
              )}
              {wrongAnswer.sheet?.title && (
                <Badge variant="outline" className="text-xs">
                  {wrongAnswer.sheet.title}
                </Badge>
              )}
              {!isDraft && (
                <Badge variant="secondary" className="text-xs">
                  {wrongAnswer.source_type === 'external_passage' ? '외부지문'
                    : wrongAnswer.source_type === 'eng_eng_def' ? '영영풀이'
                    : wrongAnswer.source_type}
                </Badge>
              )}
              {wrongAnswer.resolved && (
                <Badge className="bg-green-100 text-green-700 border-0 text-xs hover:bg-green-100">
                  해결됨
                </Badge>
              )}
              {!isDraft && (
                <div className="flex gap-1 ml-auto">
                  {/* 정답처리 = 이 답을 실제 정답으로 인정(점수 오름) — 문제풀이/예상문제만 */}
                  {isProblemStage && questionIndex >= 0 && !wrongAnswer.resolved && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-xs text-green-600"
                        onClick={handleAcceptAnswer}
                        disabled={submitting || !String(data.userAnswer || '')}
                        title="이 답을 정답으로 인정하고 재채점 (점수 오름)"
                      >
                        {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-0.5" /> : <Check className="h-3 w-3 mr-0.5" />}
                        정답처리
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-xs text-muted-foreground"
                        onClick={() => {
                          setNewAnswer(extractAnswer(data.correctAnswer));
                          setNewExplanation((data.explanation as string) || '');
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-3 w-3 mr-0.5" />
                        정답 수정
                      </Button>
                    </>
                  )}
                  {/* 해결 = 오답이지만 확인 완료(철자 실수·이해함) — 점수 변동 없음, 목록엔 '해결'로 남음 */}
                  {wrongAnswer.resolved ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-xs text-muted-foreground"
                      onClick={() => handleResolve(false)}
                      disabled={submitting}
                      title="미해결로 되돌리기"
                    >
                      {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-0.5" /> : null}
                      되돌리기
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-xs text-blue-600"
                      onClick={() => handleResolve(true)}
                      disabled={submitting}
                      title="오답이지만 확인 완료 처리 (점수 변동 없음)"
                    >
                      {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-0.5" /> : <Check className="h-3 w-3 mr-0.5" />}
                      해결
                    </Button>
                  )}
                </div>
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
              <div className="text-sm text-muted-foreground"><FormattedText text={String(data.question)} /></div>
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
            <div>
              <label className="text-sm font-medium">해설 (선택)</label>
              <Textarea
                value={newExplanation}
                onChange={(e) => setNewExplanation(e.target.value)}
                placeholder="정답에 맞는 해설을 입력하세요"
                className="mt-1"
                rows={2}
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
