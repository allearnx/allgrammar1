import { useState } from 'react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { NaesinProblemQuestion } from '@/types/database';
import { useProblemDraft } from '@/hooks/use-problem-draft';
import type { AiFeedback, WrongItem } from '@/hooks/use-problem-draft';
import { useQuestionTimer } from '@/hooks/use-question-timer';

export const MCQ_TIME_LIMIT = 40;
export const SUBJECTIVE_TIME_LIMIT = 120;

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
  const { loadDraft, saveDraft, clearDraft } = useProblemDraft(sheetId, questions.length);

  const [currentIndex, setCurrentIndex] = useState(() => {
    const d = loadDraft();
    return d?.mode === 'interactive' ? d.currentIndex : 0;
  });
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
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
  const [currentAiFeedback, setCurrentAiFeedback] = useState<AiFeedback | null>(null);
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

  const question = questions[currentIndex];
  const isSubjective = !question?.options || question.options.length === 0;
  const timeLimit = isSubjective ? SUBJECTIVE_TIME_LIMIT : MCQ_TIME_LIMIT;
  const { remaining, isExpired, reset: resetTimer, pause: pauseTimer } = useQuestionTimer(timeLimit);

  async function gradeSubjective(studentAnswer: string): Promise<AiFeedback | null> {
    try {
      return await fetchWithToast<AiFeedback>('/api/naesin/problems/grade-subjective', {
        body: {
          question: question.question,
          referenceAnswer: String(question.answer),
          studentAnswer,
        },
        errorMessage: 'AI 채점에 실패했습니다.',
        logContext: 'naesin.interactive_view',
      });
    } catch {
      // error already toasted by fetchWithToast (includes 429 server message)
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
    saveDraft({
      mode: 'interactive',
      currentIndex,
      score: newScore,
      wrongList: newWrongList,
      aiResultsMap: newAiResultsMap,
      answeredUpTo: currentIndex,
      overtimeQuestions: newOvertimeQuestions ?? overtimeQuestions,
      answersMap: newAnswersMap ?? answersMap,
    });
  }

  function applyResult(
    correct: boolean,
    answer: string | number,
    q: NaesinProblemQuestion,
    aiFeedback?: AiFeedback,
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
      ...(aiFeedback ? { aiFeedback } : {}),
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
    ot?: number[],
  ) {
    const updatedAnswersMap = { ...answersMap, [currentIndex]: answer };
    setAnswersMap(updatedAnswersMap);

    if (isLast) {
      const allAnswers = questions.map((_, i) => updatedAnswersMap[i] ?? '');
      submitResults(allAnswers, questions.length, aiMap);
    } else {
      saveCurrentDraft(newScore, newWrongList, aiMap, ot, updatedAnswersMap);
    }
  }

  async function handleSelect(answer: string | number) {
    if (showResult || isGrading) return;
    setSelectedAnswer(answer);
    pauseTimer();

    let currentOvertime = overtimeQuestions;
    if (isExpired) {
      currentOvertime = [...overtimeQuestions, question.number];
      setOvertimeQuestions(currentOvertime);
    }

    const isLast = currentIndex === questions.length - 1;

    if (isSubjective) {
      setIsGrading(true);
      const aiFeedback = await gradeSubjective(String(answer));
      setIsGrading(false);

      if (aiFeedback) {
        setCurrentAiFeedback(aiFeedback);
        const newAiMap = { ...aiResultsMap, [String(currentIndex)]: aiFeedback };
        setAiResultsMap(newAiMap);
        const correct = aiFeedback.score >= 80;
        setShowResult(true);
        const { newScore, newWrongList } = applyResult(correct, answer, question, aiFeedback);
        finishOrSave(isLast, answer, newScore, newWrongList, newAiMap, currentOvertime);
      } else {
        const correct = String(answer).trim().toLowerCase() === String(question.answer).trim().toLowerCase();
        setShowResult(true);
        const { newScore, newWrongList } = applyResult(correct, answer, question);
        finishOrSave(isLast, answer, newScore, newWrongList, aiResultsMap, currentOvertime);
      }
    } else {
      const correct = String(answer) === String(question.answer);
      setShowResult(true);
      const { newScore, newWrongList } = applyResult(correct, answer, question);
      finishOrSave(isLast, answer, newScore, newWrongList, aiResultsMap, currentOvertime);
    }
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      const nextQ = questions[currentIndex + 1];
      const nextIsSubjective = !nextQ.options || nextQ.options.length === 0;
      setCurrentIndex(currentIndex + 1);
      setShowResult(false);
      setSelectedAnswer(null);
      setCurrentAiFeedback(null);
      resetTimer(nextIsSubjective ? SUBJECTIVE_TIME_LIMIT : MCQ_TIME_LIMIT);
    }
  }

  async function submitResults(answers: (string | number)[], total: number, finalAiResults?: Record<string, AiFeedback>) {
    const mergedAiResults = finalAiResults ?? aiResultsMap;
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
      setFinished(true);
      if (data.score >= 80) {
        toast.success('문제풀이를 완료했습니다!');
        onComplete?.();
      }
    } catch {
      // error already toasted by fetchWithToast
      setFinished(true);
    }
  }

  return {
    currentIndex,
    selectedAnswer,
    showResult,
    score,
    finished,
    wrongList,
    isGrading,
    currentAiFeedback,
    question,
    isSubjective,
    remaining,
    isExpired,
    handleSelect,
    handleNext,
  };
}
