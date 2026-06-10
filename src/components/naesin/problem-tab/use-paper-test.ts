import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { useProblemDraft } from '@/hooks/use-problem-draft';
import type { AiFeedback, WrongItem, PaperTestDraft } from '@/hooks/use-problem-draft';
import { matchMcqAnswer, normalize } from '@/lib/naesin/normalize-answer';
import type { NaesinProblemQuestion } from '@/types/database';

export function usePaperTest({
  sheetId,
  questions,
  unitId,
  onComplete,
}: {
  sheetId: string;
  questions: NaesinProblemQuestion[];
  unitId?: string | null;
  onComplete?: () => void;
}) {
  const { loadDraft, saveDraft, clearDraft, saveServerDraft, loadServerDraft, clearServerDraft } = useProblemDraft(sheetId, questions.length);

  const [answersMap, setAnswersMap] = useState<Record<number, string | number>>(() => {
    const d = loadDraft();
    return d?.mode === 'paper_test' ? (d.answersMap ?? {}) : {};
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<{ correct: number; wrong: number } | null>(null);
  const [wrongList, setWrongList] = useState<WrongItem[]>([]);
  const [submitFailed, setSubmitFailed] = useState(false);
  const [isMidSaving, setIsMidSaving] = useState(false);

  // Ref for sendBeacon access
  const answersRef = useRef(answersMap);
  useEffect(() => { answersRef.current = answersMap; }, [answersMap]);

  // ── sendBeacon on tab close / visibility hidden ──
  useEffect(() => {
    function flushDraftToServer() {
      const map = answersRef.current;
      const answered = Object.keys(map).length;
      if (answered === 0) return;
      const payload = JSON.stringify({
        sheetId,
        unitId,
        draftData: {
          mode: 'paper_test',
          version: 1,
          sheetId,
          questionCount: questions.length,
          savedAt: new Date().toISOString(),
          answersMap: map,
        },
        answeredCount: answered,
      });
      navigator.sendBeacon(
        '/api/naesin/problems/draft/save',
        new Blob([payload], { type: 'application/json' }),
      );
    }
    function handleVisibility() {
      if (document.visibilityState === 'hidden') flushDraftToServer();
    }
    window.addEventListener('beforeunload', flushDraftToServer);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('beforeunload', flushDraftToServer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [sheetId, unitId, questions.length]);

  // ── Load server draft on mount ──
  useEffect(() => {
    let cancelled = false;
    loadServerDraft().then((serverDraft) => {
      if (cancelled || !serverDraft || serverDraft.mode !== 'paper_test') return;
      const localDraft = loadDraft();
      const localTime = localDraft?.savedAt ? new Date(localDraft.savedAt).getTime() : 0;
      const serverTime = serverDraft.savedAt ? new Date(serverDraft.savedAt).getTime() : 0;
      if (serverTime > localTime) {
        setAnswersMap(serverDraft.answersMap ?? {});
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetId]);

  const setAnswer = useCallback((index: number, value: string | number) => {
    setAnswersMap((prev) => ({ ...prev, [index]: value }));
  }, []);

  function getDraftInput(): Omit<PaperTestDraft, 'version' | 'sheetId' | 'questionCount' | 'savedAt'> {
    return { mode: 'paper_test', answersMap };
  }

  async function handleMidSave() {
    const answered = Object.keys(answersMap).length;
    if (answered === 0) return;
    setIsMidSaving(true);
    try {
      const draftInput = getDraftInput();
      saveDraft(draftInput);
      const ok = await saveServerDraft(draftInput, unitId);
      if (ok) {
        toast.success(`중간 저장 완료 (${answered}/${questions.length}문제)`);
      } else {
        toast.error('서버 저장에 실패했습니다. 로컬에만 저장되었습니다.');
      }
    } finally {
      setIsMidSaving(false);
    }
  }

  // Auto-save to localStorage on answersMap change (debounced via effect)
  useEffect(() => {
    const answered = Object.keys(answersMap).length;
    if (answered === 0) return;
    const draftInput = { mode: 'paper_test' as const, answersMap };
    saveDraft(draftInput);
    // Auto-save to server every 5 answers
    if (answered % 5 === 0) {
      saveServerDraft(draftInput, unitId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answersMap]);

  async function handleSubmit() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitFailed(false);

    try {
      // Build answers array in question order
      const answers: (string | number)[] = questions.map((_, i) => answersMap[i] ?? '');

      // Grade subjective questions via AI (parallel)
      const aiResults: Record<string, AiFeedback> = {};
      const subjectiveIndices = questions
        .map((q, i) => ({ q, i }))
        .filter(({ q }) => !q.options || q.options.length === 0)
        .filter(({ q }) => !q.subParts) // subParts are graded client-side
        .filter(({ i }) => String(answers[i]).trim() !== '');

      if (subjectiveIndices.length > 0) {
        const gradePromises = subjectiveIndices.map(async ({ q, i }) => {
          try {
            const result = await fetchWithToast<{ score: number; feedback?: string; correctedAnswer?: string }>(
              '/api/naesin/problems/grade-subjective',
              {
                body: {
                  question: q.question,
                  referenceAnswer: String(q.answer),
                  studentAnswer: String(answers[i]),
                  acceptedAnswers: q.acceptedAnswers,
                },
                errorMessage: '채점 오류',
                logContext: 'naesin.paper_test',
              },
            );
            if (result) {
              aiResults[String(i)] = { score: result.score, feedback: result.feedback, correctedAnswer: result.correctedAnswer };
            }
          } catch {
            // Fallback: skip AI grading for this question
          }
        });
        await Promise.all(gradePromises);
      }

      // Submit via existing API
      const data = await fetchWithToast<{
        score: number;
        wrongAnswers?: { number: number; userAnswer: string | number; correctAnswer: string | number; question?: string }[];
      }>('/api/naesin/problems/submit', {
        body: {
          sheetId,
          unitId,
          answers,
          totalQuestions: questions.length,
          ...(Object.keys(aiResults).length > 0 ? { aiResults } : {}),
        },
        errorMessage: '결과 저장에 실패했습니다',
        logContext: 'naesin.paper_test',
        retry: 2,
      });

      clearDraft();
      clearServerDraft();

      // Build score and wrongList from response
      const wrongAnswers = data.wrongAnswers ?? [];
      const correct = questions.length - wrongAnswers.length;
      setResults({ correct, wrong: wrongAnswers.length });

      const wrongItems: WrongItem[] = wrongAnswers.map((w) => {
        const qIdx = questions.findIndex((q) => q.number === w.number);
        const q = qIdx >= 0 ? questions[qIdx] : undefined;
        return {
          number: w.number,
          userAnswer: w.userAnswer,
          correctAnswer: w.correctAnswer,
          question: w.question ?? q?.question ?? '',
          ...(q?.subParts ? { subParts: q.subParts } : {}),
          ...(q?.options && q.options.length > 0 ? { options: q.options } : {}),
          ...(aiResults[String(qIdx)] ? { aiFeedback: aiResults[String(qIdx)] } : {}),
        };
      });
      setWrongList(wrongItems);
      setFinished(true);

      if (data.score >= 80) {
        toast.success('문제풀이를 완료했습니다!');
        onComplete?.();
      }
    } catch {
      setSubmitFailed(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function retrySubmit() {
    await handleSubmit();
  }

  const answeredCount = Object.keys(answersMap).length;

  return {
    answersMap,
    setAnswer,
    answeredCount,
    isSubmitting,
    finished,
    results,
    wrongList,
    submitFailed,
    handleSubmit,
    retrySubmit,
    handleMidSave,
    isMidSaving,
    questions,
  };
}
