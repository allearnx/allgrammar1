import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { NaesinProblemQuestion } from '@/types/database';
import { useProblemDraft } from '@/hooks/use-problem-draft';
import type { AiFeedback, WrongItem, InteractiveDraft } from '@/hooks/use-problem-draft';
import { matchMcqAnswer, normalize } from '@/lib/naesin/normalize-answer';

export type AnswerStatus = 'correct' | 'retry_correct' | 'wrong';

export const CHUNK_SIZE = 25;

export function useInteractiveProblem({
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

  // ── 2차 기회 (Second Chance) 상태 ──
  const [retryMode, setRetryMode] = useState(false);
  const [retryCorrectList, setRetryCorrectList] = useState<WrongItem[]>(() => {
    const d = loadDraft();
    return d?.mode === 'interactive' ? (d.retryCorrectList ?? []) : [];
  });
  const [disabledOptions, setDisabledOptions] = useState<string[]>([]);
  const [currentAnswerStatus, setCurrentAnswerStatus] = useState<AnswerStatus | null>(null);

  // ── Auto-save to server: ref for latest state ──
  const draftStateRef = useRef({ currentIndex, score, wrongList, aiResultsMap, overtimeQuestions, answersMap, retryCorrectList });
  useEffect(() => {
    draftStateRef.current = { currentIndex, score, wrongList, aiResultsMap, overtimeQuestions, answersMap, retryCorrectList };
  }, [currentIndex, score, wrongList, aiResultsMap, overtimeQuestions, answersMap, retryCorrectList]);

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
          retryCorrectList: state.retryCorrectList,
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
        setRetryCorrectList(serverDraft.retryCorrectList ?? []);
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
    newRetryCorrectList?: WrongItem[],
  ) {
    const draftInput = {
      mode: 'interactive' as const,
      currentIndex,
      score: newScore,
      wrongList: newWrongList,
      aiResultsMap: newAiResultsMap,
      answeredUpTo: currentIndex,
      overtimeQuestions: newOvertimeQuestions ?? overtimeQuestions,
      retryCorrectList: newRetryCorrectList ?? retryCorrectList,
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
      ...(q.explanation ? { explanation: q.explanation } : {}),
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
    newRetryCorrectList?: WrongItem[],
  ) {
    const updatedAnswersMap = { ...answersMap, [currentIndex]: answer };
    setAnswersMap(updatedAnswersMap);

    if (isLast) {
      const allAnswers = questions.map((_, i) => updatedAnswersMap[i] ?? '');
      submitResults(allAnswers, questions.length, aiMap, newRetryCorrectList ?? retryCorrectList);
    } else {
      saveCurrentDraft(newScore, newWrongList, aiMap, undefined, updatedAnswersMap, newRetryCorrectList);
    }
  }

  async function handleSelect(answer: string | number) {
    if (showResult || isGrading) return;
    setSelectedAnswer(answer);

    const isLast = currentIndex === questions.length - 1;
    let correct: boolean;
    let newAiMap = aiResultsMap;

    if (isSubjective) {
      setIsGrading(true);
      const result = await gradeSubjective(String(answer));
      setIsGrading(false);

      if (result) {
        setSubjectiveResult(result);
        const aiFeedback: AiFeedback = { score: result.score };
        newAiMap = { ...aiResultsMap, [String(currentIndex)]: aiFeedback };
        setAiResultsMap(newAiMap);
        correct = result.score === 100;
      } else {
        // Fallback: simple string comparison
        correct = String(answer).trim().toLowerCase() === String(question.answer).trim().toLowerCase();
      }
    } else {
      correct = matchMcqAnswer(String(answer), String(question.answer), question.options);
    }

    // ── 2차 기회 분기 ──
    if (correct) {
      const newScore = { ...score, correct: score.correct + 1 };
      setScore(newScore);

      if (retryMode) {
        // 2차 정답 → 🔺
        const item: WrongItem = {
          number: question.number,
          userAnswer: answer,
          correctAnswer: question.answer,
          question: question.question,
          ...(question.subParts ? { subParts: question.subParts } : {}),
          ...(question.options?.length ? { options: question.options } : {}),
          ...(question.explanation ? { explanation: question.explanation } : {}),
        };
        const newRetryList = [...retryCorrectList, item];
        setRetryCorrectList(newRetryList);
        setRetryMode(false);
        setCurrentAnswerStatus('retry_correct');
        setShowResult(true);
        finishOrSave(isLast, answer, newScore, wrongList, newAiMap, newRetryList);
      } else {
        // 1차 정답 → ✅
        setCurrentAnswerStatus('correct');
        setShowResult(true);
        finishOrSave(isLast, answer, newScore, wrongList, newAiMap);
      }
    } else if (retryMode) {
      // 2차 오답 → ❌
      setRetryMode(false);
      setCurrentAnswerStatus('wrong');
      setShowResult(true);
      const { newScore, newWrongList } = applyResult(false, answer, question);
      finishOrSave(isLast, answer, newScore, newWrongList, newAiMap);
    } else {
      // 1차 오답 → 재시도 모드
      setRetryMode(true);
      if (!isSubjective) {
        setDisabledOptions(prev => [...prev, String(answer)]);
      }
      setSelectedAnswer(null);
      setMultiSelectedValues([]);
      setSubjectiveResult(null);
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

    const isLast = currentIndex === questions.length - 1;
    const correct = sortedAnswer === normalizedCorrect;
    setSelectedAnswer(sortedAnswer);

    if (correct) {
      const newScore = { ...score, correct: score.correct + 1 };
      setScore(newScore);

      if (retryMode) {
        // 2차 정답 → 🔺
        const item: WrongItem = {
          number: question.number,
          userAnswer: sortedAnswer,
          correctAnswer: question.answer,
          question: question.question,
          ...(question.options?.length ? { options: question.options } : {}),
          ...(question.explanation ? { explanation: question.explanation } : {}),
        };
        const newRetryList = [...retryCorrectList, item];
        setRetryCorrectList(newRetryList);
        setRetryMode(false);
        setCurrentAnswerStatus('retry_correct');
        setShowResult(true);
        finishOrSave(isLast, sortedAnswer, newScore, wrongList, aiResultsMap, newRetryList);
      } else {
        // 1차 정답 → ✅
        setCurrentAnswerStatus('correct');
        setShowResult(true);
        finishOrSave(isLast, sortedAnswer, newScore, wrongList, aiResultsMap);
      }
    } else if (retryMode) {
      // 2차 오답 → ❌
      setRetryMode(false);
      setCurrentAnswerStatus('wrong');
      setShowResult(true);
      const { newScore, newWrongList } = applyResult(false, sortedAnswer, question);
      finishOrSave(isLast, sortedAnswer, newScore, newWrongList, aiResultsMap);
    } else {
      // 1차 오답 → 재시도 모드
      setRetryMode(true);
      setSelectedAnswer(null);
      setMultiSelectedValues([]);
    }
  }

  function handleMultiSubmit() {
    if (showResult || multiSelectedValues.length === 0) return;
    submitMultiValues(multiSelectedValues);
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setShowResult(false);
      setSelectedAnswer(null);
      setMultiSelectedValues([]);
      setSubjectiveResult(null);
      setRetryMode(false);
      setDisabledOptions([]);
      setCurrentAnswerStatus(null);

      // Chunk boundary: pause and force save
      if (nextIndex > 0 && nextIndex % CHUNK_SIZE === 0) {
        setChunkPaused(true);
        const draftInput = {
          mode: 'interactive' as const,
          currentIndex: nextIndex,
          score,
          wrongList,
          aiResultsMap,
          answeredUpTo: nextIndex - 1,
          overtimeQuestions,
          retryCorrectList,
          answersMap,
        };
        saveDraft(draftInput);
        saveServerDraft(draftInput, unitId);
      }
    }
  }

  function handleContinueChunk() {
    setChunkPaused(false);
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
        retryCorrectList,
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
  const [pendingSubmit, setPendingSubmit] = useState<{ answers: (string | number)[]; total: number; aiResults: Record<string, AiFeedback>; retryList: WrongItem[] } | null>(null);
  const [chunkPaused, setChunkPaused] = useState(false);

  async function submitResults(answers: (string | number)[], total: number, finalAiResults?: Record<string, AiFeedback>, retryList?: WrongItem[]) {
    const mergedAiResults = finalAiResults ?? aiResultsMap;
    const mergedRetryList = retryList ?? retryCorrectList;
    setSubmitFailed(false);
    try {
      const data = await fetchWithToast<{ score: number }>('/api/naesin/problems/submit', {
        body: {
          sheetId,
          unitId,
          answers,
          totalQuestions: total,
          ...(Object.keys(mergedAiResults).length > 0 ? { aiResults: mergedAiResults } : {}),
          ...(mergedRetryList.length > 0 ? { retryCorrectAnswers: mergedRetryList } : {}),
        },
        errorMessage: '결과 저장에 실패했습니다',
        logContext: 'naesin.interactive_view',
        retry: 2,
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
      setPendingSubmit({ answers, total, aiResults: mergedAiResults, retryList: mergedRetryList });
      // 서버 드래프트에 최종 상태 백업 저장
      saveServerDraft({
        mode: 'interactive',
        currentIndex: questions.length - 1,
        score,
        wrongList,
        aiResultsMap: mergedAiResults,
        answeredUpTo: questions.length - 1,
        overtimeQuestions,
        retryCorrectList: mergedRetryList,
        answersMap,
      }, unitId).catch(() => {});
    }
  }

  async function retrySubmit() {
    if (!pendingSubmit) return;
    await submitResults(pendingSubmit.answers, pendingSubmit.total, pendingSubmit.aiResults, pendingSubmit.retryList);
  }

  return {
    currentIndex,
    selectedAnswer,
    showResult,
    score,
    finished,
    wrongList,
    isGrading,
    currentAnswerStatus,
    question,
    isSubjective,
    isMultiSelect,
    multiSelectedValues,
    retryMode,
    retryCorrectList,
    disabledOptions,
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
    chunkPaused,
    handleContinueChunk,
  };
}
