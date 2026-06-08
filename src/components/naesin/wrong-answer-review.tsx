'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { FormattedText } from '@/components/shared/formatted-text';
import { extractAnswer, normalize, matchMcqAnswer, isSubstringMatch } from '@/lib/naesin/normalize-answer';
import type { NaesinWrongAnswer } from '@/types/database';

interface WrongAnswerReviewProps {
  unitId: string;
}

const STAGE_LABELS: Record<string, string> = {
  vocab: '단어',
  passage: '교과서 암기',
  dialogue: '대화문 암기',
  grammar: '문법',
  problem: '문제풀이',
  mockExam: '예상문제',
  lastReview: '직전보강',
};

export function WrongAnswerReview({ unitId }: WrongAnswerReviewProps) {
  const [wrongAnswers, setWrongAnswers] = useState<NaesinWrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved'>('unresolved');

  const loadWrongAnswers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ unitId });
      if (filter === 'unresolved') params.set('resolved', 'false');
      const data = await fetchWithToast<NaesinWrongAnswer[]>(`/api/naesin/wrong-answers?${params}`, {
        method: 'GET',
        silent: true,
        logContext: 'wrong_answer_review',
      });
      setWrongAnswers(Array.isArray(data) ? data : []);
    } catch {
      // silently handled
    } finally {
      setLoading(false);
    }
  }, [unitId, filter]);

  useEffect(() => {
    loadWrongAnswers();
  }, [loadWrongAnswers]);

  async function markResolved(id: string) {
    try {
      await fetchWithToast('/api/naesin/wrong-answers', {
        method: 'PATCH',
        body: { id, resolved: true },
        successMessage: '해결됨으로 표시되었습니다',
        errorMessage: '업데이트 실패',
        logContext: 'wrong_answer_review',
      });
      setWrongAnswers((prev) => prev.filter((wa) => wa.id !== id));
    } catch {
      // error already toasted by fetchWithToast
    }
  }

  // Group by stage
  const grouped: Record<string, NaesinWrongAnswer[]> = {};
  wrongAnswers.forEach((wa) => {
    if (!grouped[wa.stage]) grouped[wa.stage] = [];
    grouped[wa.stage].push(wa);
  });

  if (loading) {
    return <p className="text-center text-muted-foreground py-4">로딩 중...</p>;
  }

  if (wrongAnswers.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
        <p className="text-muted-foreground">틀린 문제가 없습니다!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium">틀린 문제 ({wrongAnswers.length}개)</span>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={filter === 'unresolved' ? 'default' : 'outline'}
            onClick={() => setFilter('unresolved')}
            className="h-7 text-xs"
          >
            미해결
          </Button>
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className="h-7 text-xs"
          >
            전체
          </Button>
        </div>
      </div>

      {Object.entries(grouped).map(([stage, items]) => (
        <div key={stage}>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {STAGE_LABELS[stage] || stage} ({items.length}개)
          </p>
          <div className="space-y-2">
            {items.map((wa) => (
              <WrongAnswerCard key={wa.id} wrongAnswer={wa} onResolve={() => markResolved(wa.id)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 재풀이 가능 여부 판별 ──
function isRetryable(data: Record<string, unknown>): boolean {
  const type = data.type as string | undefined;
  // ordering, grammar_vocab, vocab_quiz는 특수 UI 필요 → 재풀이 미지원
  if (type === 'ordering' || type === 'grammar_vocab' || type === 'vocab_quiz') return false;
  // 정답이 있어야 재풀이 가능
  if (!data.correctAnswer && !data.correctOption) return false;
  return true;
}

// ── 재풀이 채점 ──
function gradeRetryAnswer(
  userAnswer: string,
  data: Record<string, unknown>,
): boolean {
  const correct = String(data.correctAnswer ?? data.correctOption ?? '');
  const options = data.options as string[] | undefined;

  if (options && options.length > 0) {
    return matchMcqAnswer(userAnswer, correct, options);
  }

  // 서술형: normalize 비교
  const norm = normalize(userAnswer);
  const normCorrect = normalize(correct);
  if (norm === normCorrect) return true;

  // acceptedAnswers 확인
  const accepted = data.acceptedAnswers as string[] | undefined;
  if (accepted?.some((a) => normalize(a) === norm)) return true;

  // 부분 일치
  return isSubstringMatch(userAnswer, correct);
}

export function WrongAnswerCard({ wrongAnswer, onResolve }: { wrongAnswer: NaesinWrongAnswer; onResolve?: () => void }) {
  const data = wrongAnswer.question_data as Record<string, unknown>;
  const options = data.options as string[] | undefined;
  const explanation = data.explanation as string | undefined;
  const canRetry = !wrongAnswer.resolved && isRetryable(data);

  const [retryMode, setRetryMode] = useState(false);
  const [retryInput, setRetryInput] = useState('');
  const [retryResult, setRetryResult] = useState<'correct' | 'wrong' | null>(null);

  const hideAnswer = retryMode && retryResult !== 'correct';

  function handleRetrySubmit(answer?: string) {
    const ans = answer ?? retryInput;
    if (!ans.trim()) return;

    const isCorrect = gradeRetryAnswer(ans, data);
    if (isCorrect) {
      setRetryResult('correct');
      setTimeout(() => onResolve?.(), 800);
    } else {
      setRetryResult('wrong');
    }
  }

  function resetRetry() {
    setRetryInput('');
    setRetryResult(null);
  }

  return (
    <Card className={wrongAnswer.resolved ? 'opacity-60' : retryResult === 'correct' ? 'border-green-400 bg-green-50' : ''}>
      <CardContent className="py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm space-y-1 flex-1">
            {/* ── 문제 표시 (항상) ── */}
            {data.imageUrl ? (
              <img
                src={String(data.imageUrl)}
                alt="문제 이미지"
                className="max-w-full max-h-48 rounded border mb-2"
              />
            ) : null}
            {data.question ? <p className="font-medium"><FormattedText text={String(data.question)} /></p> : null}

            {/* ── 유형별 내 답 + 정답 표시 (재풀이 중엔 정답 숨김) ── */}
            {data.type === 'fill_blank' ? (
              <>
                <p className="text-red-500">내 답: {String(data.userAnswer || '-')}</p>
                {!hideAnswer && <p className="text-green-600">정답: {extractAnswer(data.correctAnswer)}</p>}
              </>
            ) : null}
            {data.type === 'translation' ? (
              <>
                <p className="text-muted-foreground">{String(data.koreanText || '')}</p>
                <p className="text-red-500">내 답: {String(data.userAnswer || '-')}</p>
                {!hideAnswer && data.correctAnswer ? <p className="text-green-600">정답: {extractAnswer(data.correctAnswer)}</p> : null}
                {!hideAnswer && data.feedback ? <p className="text-sm">{String(data.feedback)}</p> : null}
              </>
            ) : null}
            {data.type === 'ordering' ? (
              <>
                <p className="text-red-500">내 배열: {String(data.userOrder || '-')}</p>
                {!hideAnswer && <p className="text-green-600">정답 순서: {String(data.correctOrder)}</p>}
              </>
            ) : null}
            {data.type === 'first_letter' ? (
              <>
                <p className="text-muted-foreground">{String(data.koreanText || '')}</p>
                <p className="text-red-500">내 답: {String(data.userAnswer || '-')}</p>
                {!hideAnswer && <p className="text-green-600">정답: {extractAnswer(data.correctAnswer)}</p>}
              </>
            ) : null}
            {data.type === 'grammar_vocab' ? (
              <>
                {data.sentence && <p className="text-muted-foreground">{String(data.sentence)}</p>}
                <p className="text-red-500">내 선택: {String(data.selectedOption || '-')}</p>
                {!hideAnswer && <p className="text-green-600">정답: {String(data.correctOption)}</p>}
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
                <p className="text-red-500">내 답: {String(data.userAnswer || '-')}</p>
                {!hideAnswer && <p className="text-green-600">정답: {extractAnswer(data.correctAnswer)}</p>}
              </>
            ) : null}
            {data.number && data.type !== 'fill_blank' && data.type !== 'translation' && data.type !== 'ordering' && data.type !== 'first_letter' && data.type !== 'grammar_vocab' ? (
              <>
                {!hideAnswer && (data.subParts as { label: string; answer: string }[] | undefined)?.length ? (
                  <div className="space-y-0.5">
                    {(data.subParts as { label: string; answer: string }[]).map((sp, i) => {
                      const userParts = String(data.userAnswer || '').split(' / ');
                      return (
                        <div key={i} className="text-xs">
                          <span className="font-medium">{sp.label}</span>{' '}
                          <span className="text-red-500">{userParts[i]?.trim() || '-'}</span>
                          {' → '}
                          <span className="text-green-600">{sp.answer}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <p className="text-red-500">내 답: {String(data.userAnswer || '-')}</p>
                    {!hideAnswer && <p className="text-green-600">정답: {extractAnswer(data.correctAnswer)}</p>}
                  </>
                )}
              </>
            ) : null}

            {/* ── 보기 (재풀이 중엔 클릭 가능) ── */}
            {options && options.length > 0 && !retryMode && (
              <div className="mt-1 pl-2 border-l-2 border-muted space-y-0.5">
                {options.map((opt, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{i + 1}. <FormattedText text={opt} /></p>
                ))}
              </div>
            )}

            {/* ── 해설 (재풀이 중엔 숨김) ── */}
            {!hideAnswer && explanation && (
              <p className="text-xs text-blue-600 mt-1">해설: <FormattedText text={explanation} /></p>
            )}

            {/* ── 재풀이 입력 영역 ── */}
            {retryMode && retryResult !== 'correct' && (
              <div className="mt-3 p-3 rounded-lg bg-muted/50 space-y-2">
                {options && options.length > 0 ? (
                  // MCQ: 보기 선택
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">보기를 선택하세요:</p>
                    {options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          resetRetry();
                          handleRetrySubmit(String(i + 1));
                        }}
                        className="w-full text-left px-3 py-2 rounded-md border text-sm hover:bg-primary/5 hover:border-primary/30 transition-colors"
                      >
                        {i + 1}. <FormattedText text={opt} />
                      </button>
                    ))}
                  </div>
                ) : (
                  // 서술형: 텍스트 입력
                  <div className="flex gap-2">
                    <Input
                      value={retryInput}
                      onChange={(e) => { setRetryInput(e.target.value); setRetryResult(null); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleRetrySubmit()}
                      placeholder="정답을 입력하세요"
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <Button size="sm" className="h-8 text-xs shrink-0" onClick={() => handleRetrySubmit()}>
                      확인
                    </Button>
                  </div>
                )}
                {retryResult === 'wrong' && (
                  <p className="text-xs text-red-500 font-medium">틀렸습니다. 다시 시도해보세요.</p>
                )}
              </div>
            )}

            {/* ── 재풀이 성공 ── */}
            {retryResult === 'correct' && (
              <div className="mt-2 flex items-center gap-1.5 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">정답! 해결 완료</span>
              </div>
            )}

            {/* ── 시트/출처 뱃지 ── */}
            <div className="flex items-center gap-1.5 pt-1">
              {wrongAnswer.sheet?.title && (
                <Badge variant="outline" className="text-xs">
                  {wrongAnswer.sheet.title}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {wrongAnswer.source_type}
              </Badge>
            </div>
          </div>

          {/* ── 액션 버튼 ── */}
          {!wrongAnswer.resolved && retryResult !== 'correct' && (
            <div className="flex flex-col gap-1 shrink-0">
              {canRetry && (
                <Button
                  size="sm"
                  variant={retryMode ? 'secondary' : 'default'}
                  className="h-7 text-xs"
                  onClick={() => { setRetryMode(!retryMode); resetRetry(); }}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  {retryMode ? '취소' : '재풀이'}
                </Button>
              )}
              {!retryMode && onResolve && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onResolve}>
                  해결됨
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
