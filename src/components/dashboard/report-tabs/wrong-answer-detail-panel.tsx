'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import type { NaesinWrongAnswer } from '@/types/database';

const STAGE_LABELS: Record<string, string> = {
  vocab: '단어',
  passage: '교과서 암기',
  dialogue: '대화문 암기',
  grammar: '문법',
  problem: '문제풀이',
  lastReview: '직전보강',
};

interface Props {
  studentId: string;
  onRefresh?: () => void;
}

const TEXTBOOK_STAGES = new Set(['passage', 'dialogue', 'vocab']);

export function WrongAnswerDetailPanel({ studentId, onRefresh }: Props) {
  const [wrongAnswers, setWrongAnswers] = useState<NaesinWrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
        <span className="ml-2 text-sm text-gray-500">오답 상세 로딩 중...</span>
      </div>
    );
  }

  if (wrongAnswers.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">오답 기록이 없습니다.</p>
      </div>
    );
  }

  // Group by stage
  const grouped: Record<string, NaesinWrongAnswer[]> = {};
  wrongAnswers.forEach((wa) => {
    if (!grouped[wa.stage]) grouped[wa.stage] = [];
    grouped[wa.stage].push(wa);
  });

  const unresolvedCount = wrongAnswers.filter((wa) => !wa.resolved).length;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <span className="text-sm font-medium">
          전체 {wrongAnswers.length}개
          {unresolvedCount > 0 && (
            <span className="text-red-500 ml-1">(미해결 {unresolvedCount}개)</span>
          )}
        </span>
      </div>

      {Object.entries(grouped).map(([stage, items]) => (
        <div key={stage}>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {STAGE_LABELS[stage] || stage} ({items.length}개)
          </p>
          <div className="space-y-2">
            {items.map((wa) => (
              <ReadOnlyWrongAnswerCard
                key={wa.id}
                wrongAnswer={wa}
                studentId={studentId}
                onCorrected={() => { fetchWrongAnswers(); onRefresh?.(); }}
              />
            ))}
          </div>
        </div>
      ))}
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
