'use client';

import { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { extractAnswer, normalize, normalizeSeparators, isSubstringMatch, matchFilledBlanks } from '@/lib/naesin/normalize-answer';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { NaesinProblemSheet, NaesinProblemQuestion } from '@/types/database';
import { useProblemDraft } from '@/hooks/use-problem-draft';
import type { AiFeedback } from '@/hooks/use-problem-draft';
import { isSafeIframeSrc } from '@/lib/utils/safe-url';

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

/** 문항 스텁이 있으면 객관식(번호 버튼)·서술형(여러 줄 입력)으로 나누고, 없으면(구 OMR 시트) 타이핑 칸으로 둔다. */
function itemKind(q: NaesinProblemQuestion | undefined): 'mcq' | 'subjective' | 'legacy' {
  if (!q) return 'legacy';
  return q.options && q.options.length > 0 ? 'mcq' : 'subjective';
}

/** "(정답 2개)" 같은 안내 또는 정답표의 쉼표로 복수 선택 문항 판별 → 선택 개수 상한 */
function multiSelectLimit(q: NaesinProblemQuestion | undefined, key: string | number | undefined): number {
  const m = q?.question.match(/정답\s*(\d)\s*개/);
  if (m) return Number(m[1]);
  const k = extractAnswer(key ?? '');
  return k.includes(',') ? k.split(',').length : 1;
}

function toggleChoice(current: string, n: number, limit: number): string {
  const picked = current.split(',').map((x) => x.trim()).filter(Boolean);
  const idx = picked.indexOf(String(n));
  if (idx >= 0) picked.splice(idx, 1);
  else if (limit <= 1) return String(n);
  else if (picked.length < limit) picked.push(String(n));
  else return current;
  return picked.map(Number).sort((a, b) => a - b).join(', ');
}

export function ImageAnswerView({
  sheet,
  unitId,
  onComplete,
}: {
  sheet: NaesinProblemSheet;
  unitId?: string | null;
  onComplete?: () => void;
}) {
  const totalQuestions = sheet.answer_key.length;
  const questions = (sheet.questions ?? []) as NaesinProblemQuestion[];
  const hasStubs = questions.length === totalQuestions && totalQuestions > 0;
  const { loadDraft, saveDraft, clearDraft } = useProblemDraft(sheet.id, totalQuestions);

  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    const d = loadDraft();
    return d?.mode === 'image_answer' ? d.answers : {};
  });
  const [results, setResults] = useState<{ score: number; wrongAnswers: { number: number; userAnswer: string | number; correctAnswer: string | number }[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 연속 클릭에도 이전 값을 덮어쓰지 않도록 함수형 갱신 + ref 미러(draft 저장용)
  const answersRef = useRef(answers);
  function update(i: number, v: string) {
    const newAnswers = { ...answersRef.current, [i]: v };
    answersRef.current = newAnswers;
    setAnswers(newAnswers);
    saveDraft({ mode: 'image_answer', answers: newAnswers });
  }

  /** 서술형 중 규칙 채점(정규화·구분자·부분일치·빈칸 완성)에 실패한 문항만 AI 채점으로 보낸다 — interactive 화면과 같은 폴백 순서 */
  function passesRuleGrading(q: NaesinProblemQuestion, key: string | number | undefined, user: string): boolean {
    const correct = extractAnswer(key ?? '');
    const candidates = [correct, ...(q.acceptedAnswers ?? [])];
    const u = normalize(user);
    return candidates.some((c) => normalize(c) === u)
      || candidates.some((c) => normalizeSeparators(user) === normalizeSeparators(c))
      || candidates.some((c) => isSubstringMatch(user, c))
      || matchFilledBlanks(user, q.question, correct, q.acceptedAnswers);
  }

  async function gradeWithAi(answerArray: string[]): Promise<Record<string, AiFeedback>> {
    if (!hasStubs) return {};
    const targets = questions
      .map((q, i) => ({ q, i, user: answerArray[i] }))
      // subParts 문항은 서버의 파트별 규칙 채점으로 충분 (interactive와 동일하게 AI 제외)
      .filter(({ q, user }) => itemKind(q) === 'subjective' && !q.subParts && user.trim() && !passesRuleGrading(q, sheet.answer_key[q.number - 1], user));
    const results = await Promise.all(targets.map(async ({ q, i, user }) => {
      try {
        const r = await fetchWithToast<AiFeedback>('/api/naesin/problems/grade-subjective', {
          body: {
            question: q.question,
            referenceAnswer: extractAnswer(sheet.answer_key[i] ?? q.answer),
            studentAnswer: user,
            acceptedAnswers: q.acceptedAnswers,
            sheetId: sheet.id,
            questionNumber: q.number,
          },
          silent: true,
          logContext: 'naesin.image_answer_view.ai',
        });
        return [String(i), r] as const;
      } catch {
        return null; // AI 실패 시 서버 규칙 채점 결과(오답)로 진행
      }
    }));
    return Object.fromEntries(results.filter((r): r is readonly [string, AiFeedback] => r !== null));
  }

  async function handleSubmit() {
    setSubmitting(true);
    const answerArray = Array.from({ length: totalQuestions }, (_, i) => answers[i] || '');

    try {
      const aiResults = await gradeWithAi(answerArray);
      const data = await fetchWithToast<{ score: number; wrongAnswers: { number: number; userAnswer: string | number; correctAnswer: string | number }[] }>('/api/naesin/problems/submit', {
        body: {
          sheetId: sheet.id,
          unitId,
          answers: answerArray,
          totalQuestions,
          ...(Object.keys(aiResults).length ? { aiResults } : {}),
        },
        errorMessage: '제출 중 오류가 발생했습니다',
        logContext: 'naesin.image_answer_view',
        retry: 2,
      });
      clearDraft();
      setResults({ score: data.score, wrongAnswers: data.wrongAnswers });
      if (data.score >= 80) {
        toast.success('문제풀이를 완료했습니다!');
        onComplete?.();
      }
    } catch {
      // error already toasted by fetchWithToast
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {sheet.pdf_url && isSafeIframeSrc(sheet.pdf_url) && (
        <div className="space-y-1">
          {/* sandbox 속성을 주면 Chrome이 PDF 뷰어(플러그인)를 차단해 빈 화면이 됨 — https 검사(isSafeIframeSrc)만 하고 sandbox 없이 띄운다 */}
          <div className="border rounded-lg overflow-hidden">
            <iframe
              src={sheet.pdf_url}
              className="w-full h-[75vh] min-h-[500px]"
              title={sheet.title}
            />
          </div>
          <a href={sheet.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-muted-foreground underline underline-offset-2">
            시험지가 안 보이면 새 창에서 열기
          </a>
        </div>
      )}

      {!results ? (
        <>
          <div className="space-y-3">
            <p className="text-sm font-medium">답 입력 ({totalQuestions}문항)</p>
            {hasStubs ? (
              <div className="divide-y rounded-lg border">
                {questions.map((q, i) => {
                  const kind = itemKind(q);
                  const value = answers[i] || '';
                  if (kind === 'mcq') {
                    const limit = multiSelectLimit(q, sheet.answer_key[i]);
                    const picked = value.split(',').map((x) => x.trim()).filter(Boolean);
                    return (
                      <div key={i} className="flex items-center gap-3 px-3 py-2">
                        <span className="w-6 shrink-0 text-sm font-semibold text-muted-foreground">{i + 1}</span>
                        <div className="flex flex-wrap gap-1.5" role="group" aria-label={`${i + 1}번 선택`}>
                          {q.options!.map((_, n) => {
                            const on = picked.includes(String(n + 1));
                            return (
                              <button
                                key={n}
                                type="button"
                                aria-pressed={on}
                                onClick={() => update(i, toggleChoice(answersRef.current[i] || '', n + 1, limit))}
                                className={cn(
                                  'h-9 w-9 rounded-full border text-base transition-colors',
                                  on ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted',
                                )}
                              >
                                {CIRCLED[n] ?? n + 1}
                              </button>
                            );
                          })}
                        </div>
                        {limit > 1 && <span className="text-xs text-muted-foreground">정답 {limit}개</span>}
                      </div>
                    );
                  }
                  const labels = q.subParts?.map((sp) => sp.label) ?? [];
                  return (
                    <div key={i} className="flex items-start gap-3 px-3 py-2">
                      <span className="w-6 shrink-0 pt-2 text-sm font-semibold text-muted-foreground">{i + 1}</span>
                      <div className="flex-1 space-y-1">
                        <Textarea
                          rows={labels.length > 1 ? labels.length : 2}
                          className="min-h-0 text-sm"
                          value={value}
                          onChange={(e) => update(i, e.target.value)}
                          placeholder={labels.length > 1 ? labels.map((l) => `${l} …`).join(' / ') : '서술형 답 입력'}
                        />
                        {labels.length > 1 && (
                          <p className="text-xs text-muted-foreground">{labels.join(', ')} 순서로, 각 답은 슬래시( / )로 구분하거나 줄을 바꿔 쓰세요.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: totalQuestions }, (_, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                    <Input
                      className="h-8 text-sm text-center"
                      value={answers[i] || ''}
                      onChange={(e) => update(i, e.target.value)}
                      placeholder="-"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={submitting}>
            {submitting ? '채점 중...' : '제출하기'}
          </Button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <p className={cn(
              'text-5xl font-bold',
              results.score >= 80 ? 'text-green-600' : results.score >= 50 ? 'text-yellow-600' : 'text-red-600'
            )}>
              {results.score}점
            </p>
          </div>

          {results.wrongAnswers.length > 0 && (
            <>
              <Card>
                <CardContent className="py-4">
                  <p className="font-medium text-red-600 mb-2">틀린 문제 ({results.wrongAnswers.length}개)</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {results.wrongAnswers.map((w) => (
                      <div key={w.number} className="flex gap-2">
                        <span className="font-medium">#{w.number}</span>
                        <span className="text-red-500">{w.userAnswer || '-'}</span>
                        <span className="text-green-600">({extractAnswer(w.correctAnswer)})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                오답이 기록되었습니다.
              </div>
            </>
          )}

          <Button variant="outline" className="w-full" onClick={() => { clearDraft(); setResults(null); answersRef.current = {}; setAnswers({}); }}>
            다시 풀기
          </Button>
        </div>
      )}
    </div>
  );
}
