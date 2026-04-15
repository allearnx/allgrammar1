import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { NaesinProblemQuestion } from '@/types/database';
import { useProblemDraft } from '@/hooks/use-problem-draft';
import type { AiFeedback, WrongItem, InteractiveDraft } from '@/hooks/use-problem-draft';
import { useQuestionTimer } from '@/hooks/use-question-timer';
import { matchMcqAnswer, normalize } from '@/lib/naesin/normalize-answer';

export const MCQ_MIN_TIME = 10;
export const SUBJECTIVE_MIN_TIME = 30;

export function useInteractiveProblem({
  sheetId,
  questions,
  unitId,
  onComplete,
}: {
  sheetId: string;
  questions: NaesinProblemQuestion[];
  unitId: string;
  onComplete?: () => void;
}) {
  const { loadDraft, saveDraft, clearDraft, saveServerDraft, loadServerDraft, clearServerDraft } = useProblemDraft(sheetId, questions.length);
  const [isMidSaving, setIsMidSaving] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(() => {
    const d = loadDraft();
    return d?.mode === 'interactive' ? d.currentIndex : 0;
  });
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [multiSelectedValues, setMultiSelectedValues] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(() => {
    const d = loadDraft();
    return d?.mode === 'interactive' ? d.score : { correct: 0, wrong: 0 };
  });
  const [finished, setFinished] = useState(false);
  const [wrongList, setWrongList] = useState<WrongItem[]>(() => {
    const d = loadDraft();
    return d?.mode === 'interactive' ? d.wrongList : [];
  });
  const [isGrading, setIsGrading] = useState(false);
  const [subjectiveResult, setSubjectiveResult] = useState<{ score: number } | null>(null);
  const [aiResultsMap, setAiResultsMap] = useState<Record<string, AiFeedback>>(() => {
    const d = loadDraft();
    return d?.mode === 'interactive' ? d.aiResultsMap : {};
  });
  const [overtimeQuestions, setOvertimeQuestions] = useState<number[]>(() => {
    const d = loadDraft();
    return d?.mode === 'interactive' ? (d.overtimeQuestions ?? []) : [];
  });
  const [answersMap, setAnswersMap] = useState<Record<number, string | number>>(() => {
    const d = loadDraft();
    return d?.mode === 'interactive' ? (d.answersMap ?? {}) : {};
  });

  // ── Auto-save to server: ref for latest state ──
  const draftStateRef = useRef({ currentIndex, score, wrongList, aiResultsMap, overtimeQuestions, answersMap });
  useEffect(() => {
    draftStateRef.current = { currentIndex, score, wrongList, aiResultsMap, overtimeQuestions, answersMap };
  }, [currentIndex, score, wrongList, aiResultsMap, overtimeQuestions, answersMap]);

  // ── Auto-save to server on tab close / visibility hidden ──
  useEffect(() => {
    function flushDraftToServer() {
      const state = draftStateRef.current;
      const answered = Object.keys(state.answersMap).length;
      if (answered === 0) return;
      const payload = JSON.stringify({
        sheetId,
        unitId,
        draftData: {
          mode: 'interactive',
          version: 1,
          sheetId,
          questionCount: questions.length,
          savedAt: new Date().toISOString(),
          currentIndex: state.currentIndex,
          score: state.score,
          wrongList: state.wrongList,
          aiResultsMap: state.aiResultsMap,
          answeredUpTo: state.currentIndex,
          overtimeQuestions: state.overtimeQuestions,
          answersMap: state.answersMap,
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

  // Load server draft on mount (use server if newer than localStorage)
  useEffect(() => {
    let cancelled = false;
    loadServerDraft().then((serverDraft) => {
      if (cancelled || !serverDraft || serverDraft.mode !== 'interactive') return;
      const localDraft = loadDraft();
      const localTime = localDraft?.savedAt ? new Date(localDraft.savedAt).getTime() : 0;
      const serverTime = serverDraft.savedAt ? new Date(serverDraft.savedAt).getTime() : 0;
      if (serverTime > localTime) {
        setCurrentIndex(serverDraft.currentIndex);
        setScore(serverDraft.score);
        setWrongList(serverDraft.wrongList);
        setAiResultsMap(serverDraft.aiResultsMap);
        setOvertimeQuestions(serverDraft.overtimeQuestions ?? []);
        setAnswersMap(serverDraft.answersMap ?? {});
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetId]);

  const question = questions[currentIndex];
  const isSubjective = !question?.options || question.options.length === 0;
  const answerHasComma = String(question?.answer).includes(',');
  const isMultiSelect = !isSubjective && (answerHasComma || /모두\s*고르/.test(question?.question ?? ''));
  const minTime = isSubjective ? SUBJECTIVE_MIN_TIME : MCQ_MIN_TIME;
  const { remaining, isExpired: isReady, reset: resetTimer, pause: pauseTimer } = useQuestionTimer(minTime);

  async function gradeSubjective(studentAnswer: string): Promise<{ score: number } | null> {
    // subParts: client-side exact match grading (no API call needed)
    if (question.subParts) {
      const parts = String(studentAnswer).split(' / ');
      const allCorrect = question.subParts.every((sp, i) => {
        const studentNorm = normalize(parts[i]?.trim() ?? '');
        const candidates = [sp.answer, ...(sp.acceptedAnswers ?? [])];
        return candidates.some(c => normalize(c) === studentNorm);
      });
      return { score: allCorrect ? 100 : 0 };
    }

    try {
      return await fetchWithToast<{ score: number }>('/api/naesin/problems/grade-subjective', {
        body: {
          question: question.question,
          referenceAnswer: String(question.answer),
          studentAnswer,
          acceptedAnswers: question.acceptedAnswers,
        },
        errorMessage: '채점에 실패했습니다.',
        logContext: 'naesin.interactive_view',
      });
    } catch {
      return null;
    }
  }

  function saveCurrentDraft(
    newScore: { correct: number; wrong: number },
    newWrongList: WrongItem[],
    newAiResultsMap: Record<string, AiFeedback>,
    newOvertimeQuestions?: number[],
    newAnswersMap?: Record<number, string | number>,
  ) {
    const draftInput = {
      mode: 'interactive' as const,
      currentIndex,
      score: newScore,
      wrongList: newWrongList,
      aiResultsMap: newAiResultsMap,
      answeredUpTo: currentIndex,
      overtimeQuestions: newOvertimeQuestions ?? overtimeQuestions,
      answersMap: newAnswersMap ?? answersMap,
    };
    saveDraft(draftInput);

    // Auto-save to server every 5 questions
    const answered = Object.keys(newAnswersMap ?? answersMap).length;
    if (answered > 0 && answered % 5 === 0) {
      saveServerDraft(draftInput, unitId);
    }
  }

  function applyResult(
    correct: boolean,
    answer: string | number,
    q: NaesinProblemQuestion,
  ): { newScore: typeof score; newWrongList: WrongItem[] } {
    if (correct) {
      const newScore = { ...score, correct: score.correct + 1 };
      setScore(newScore);
      return { newScore, newWrongList: wrongList };
    }
    const newScore = { ...score, wrong: score.wrong + 1 };
    setScore(newScore);
    const wrongItem: WrongItem = {
      number: q.number,
      userAnswer: answer,
      correctAnswer: q.answer,
      question: q.question,
      ...(q.subParts ? { subParts: q.subParts } : {}),
      ...(q.options && q.options.length > 0 ? { options: q.options } : {}),
    };
    const newWrongList = [...wrongList, wrongItem];
    setWrongList(newWrongList);
    return { newScore, newWrongList };
  }

  function finishOrSave(
    isLast: boolean,
    answer: string | number,
    newScore: typeof score,
    newWrongList: WrongItem[],
    aiMap: Record<string, AiFeedback>,
  ) {
    const updatedAnswersMap = { ...answersMap, [currentIndex]: answer };
    setAnswersMap(updatedAnswersMap);

    if (isLast) {
      const allAnswers = questions.map((_, i) => updatedAnswersMap[i] ?? '');
      submitResults(allAnswers, questions.length, aiMap);
    } else {
      saveCurrentDraft(newScore, newWrongList, aiMap, undefined, updatedAnswersMap);
    }
  }

  async function handleSelect(answer: string | number) {
    if (showResult || isGrading) return;
    setSelectedAnswer(answer);
    pauseTimer();

    const isLast = currentIndex === questions.length - 1;

    if (isSubjective) {
      setIsGrading(true);
      const result = await gradeSubjective(String(answer));
      setIsGrading(false);

      if (result) {
        setSubjectiveResult(result);
        const aiFeedback: AiFeedback = { score: result.score };
        const newAiMap = { ...aiResultsMap, [String(currentIndex)]: aiFeedback };
        setAiResultsMap(newAiMap);
        const correct = result.score === 100;
        setShowResult(true);
        const { newScore, newWrongList } = applyResult(correct, answer, question);
        finishOrSave(isLast, answer, newScore, newWrongList, newAiMap);
      } else {
        // Fallback: simple string comparison
        const correct = String(answer).trim().toLowerCase() === String(question.answer).trim().toLowerCase();
        setShowResult(true);
        const { newScore, newWrongList } = applyResult(correct, answer, question);
        finishOrSave(isLast, answer, newScore, newWrongList, aiResultsMap);
      }
    } else {
      const correct = matchMcqAnswer(String(answer), String(question.answer), question.options);
      setShowResult(true);
      const { newScore, newWrongList } = applyResult(correct, answer, question);
      finishOrSave(isLast, answer, newScore, newWrongList, aiResultsMap);
    }
  }

  // 정답에 쉼표가 있으면 개수 확정 → 자동 제출, 없으면(정답 1개 모두고르기) 0 → 수동 제출 버튼
  const multiExpectedCount = isMultiSelect && answerHasComma ? String(question.answer).split(',').length : 0;

  function handleMultiToggle(value: string) {
    if (showResult) return;
    const newValues = multiSelectedValues.includes(value)
      ? multiSelectedValues.filter((v) => v !== value)
      : [...multiSelectedValues, value];
    setMultiSelectedValues(newValues);

    // Auto-submit when expected count reached
    if (newValues.length === multiExpectedCount) {
      submitMultiValues(newValues);
    }
  }

  function submitMultiValues(values: string[]) {
    const sortedAnswer = [...values].sort((a, b) => Number(a) - Number(b)).join(', ');
    const correctParts = String(question.answer).split(',').map((s) => s.trim()).sort((a, b) => Number(a) - Number(b));
    const normalizedCorrect = correctParts.join(', ');

    pauseTimer();

    const isLast = currentIndex === questions.length - 1;
    const correct = sortedAnswer === normalizedCorrect;
    setSelectedAnswer(sortedAnswer);
    setShowResult(true);
    const { newScore, newWrongList } = applyResult(correct, sortedAnswer, question);
    finishOrSave(isLast, sortedAnswer, newScore, newWrongList, aiResultsMap);
  }

  function handleMultiSubmit() {
    if (showResult || multiSelectedValues.length === 0) return;
    submitMultiValues(multiSelectedValues);
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      const nextQ = questions[currentIndex + 1];
      const nextIsSubjective = !nextQ.options || nextQ.options.length === 0;
      setCurrentIndex(currentIndex + 1);
      setShowResult(false);
      setSelectedAnswer(null);
      setMultiSelectedValues([]);
      setSubjectiveResult(null);
      resetTimer(nextIsSubjective ? SUBJECTIVE_MIN_TIME : MCQ_MIN_TIME);
    }
  }

  async function handleMidSave() {
    const answered = Object.keys(answersMap).length;
    if (answered === 0) return;
    setIsMidSaving(true);
    try {
      const draftInput: Omit<InteractiveDraft, 'version' | 'sheetId' | 'questionCount' | 'savedAt'> = {
        mode: 'interactive',
        currentIndex: showResult ? currentIndex + 1 : currentIndex,
        score,
        wrongList,
        aiResultsMap,
        answeredUpTo: currentIndex,
        overtimeQuestions,
        answersMap,
      };
      // Save to both localStorage and server
      saveDraft(draftInput);
      const ok = await saveServerDraft(draftInput, unitId);
      const partialScore = questions.length > 0
        ? Math.round((score.correct / answered) * 100)
        : 0;
      if (ok) {
        toast.success(`중간 저장 완료 (${answered}/${questions.length}문제, ${partialScore}점)`);
      } else {
        toast.error('서버 저장에 실패했습니다. 로컬에만 저장되었습니다.');
      }
    } finally {
      setIsMidSaving(false);
    }
  }

  const [submitFailed, setSubmitFailed] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<{ answers: (string | number)[]; total: number; aiResults: Record<string, AiFeedback> } | null>(null);

  async function submitResults(answers: (string | number)[], total: number, finalAiResults?: Record<string, AiFeedback>) {
    const mergedAiResults = finalAiResults ?? aiResultsMap;
    setSubmitFailed(false);
    try {
      const data = await fetchWithToast<{ score: number }>('/api/naesin/problems/submit', {
        body: {
          sheetId,
          unitId,
          answers,
          totalQuestions: total,
          ...(Object.keys(mergedAiResults).length > 0 ? { aiResults: mergedAiResults } : {}),
        },
        errorMessage: '결과 저장에 실패했습니다',
        logContext: 'naesin.interactive_view',
      });
      clearDraft();
      clearServerDraft();
      setFinished(true);
      setPendingSubmit(null);
      if (data.score >= 80) {
        toast.success('문제풀이를 완료했습니다!');
        onComplete?.();
      }
    } catch {
      // 제출 실패 — finished로 전환하지 않고 재시도 가능하게 유지
      setSubmitFailed(true);
      setPendingSubmit({ answers, total, aiResults: mergedAiResults });
      // 서버 드래프트에 최종 상태 백업 저장
      saveServerDraft({
        mode: 'interactive',
        currentIndex: questions.length - 1,
        score,
        wrongList,
        aiResultsMap: mergedAiResults,
        answeredUpTo: questions.length - 1,
        overtimeQuestions,
        answersMap,
      }, unitId).catch(() => {});
    }
  }

  async function retrySubmit() {
    if (!pendingSubmit) return;
    await submitResults(pendingSubmit.answers, pendingSubmit.total, pendingSubmit.aiResults);
  }

  // Compute isCurrentCorrect for the view
  const isCurrentCorrect = showResult && (
    isSubjective
      ? (subjectiveResult ? subjectiveResult.score === 100 : false)
      : isMultiSelect
        ? (() => {
            const sel = String(selectedAnswer).split(',').map((s) => s.trim()).sort((a, b) => Number(a) - Number(b)).join(', ');
            const cor = String(question.answer).split(',').map((s) => s.trim()).sort((a, b) => Number(a) - Number(b)).join(', ');
            return sel === cor;
          })()
        : matchMcqAnswer(String(selectedAnswer), String(question.answer), question.options)
  );

  return {
    currentIndex,
    selectedAnswer,
    showResult,
    score,
    finished,
    wrongList,
    isGrading,
    isCurrentCorrect,
    question,
    isSubjective,
    isMultiSelect,
    multiSelectedValues,
    remaining,
    isReady,
    handleSelect,
    handleMultiToggle,
    handleMultiSubmit,
    handleNext,
    handleMidSave,
    isMidSaving,
    answersMap,
    submitFailed,
    retrySubmit,
    multiExpectedCount,
  };
}
