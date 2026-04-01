import { useState, useMemo } from 'react';
import { useRetryWrong } from '@/hooks/use-retry-wrong';
import { calculateScore } from '@/lib/utils';
import type { GrammarVocabItem, GrammarVocabChoicePoint } from '@/types/naesin';

export interface WrongChoicePoint {
  type: 'grammar_vocab';
  itemIdx: number;
  cpIdx: number;
  correctOption: string;
  selectedOption: string;
  sentence: string;
}

export type SelectionMap = Record<string, number>;

/** choice point 유효성 검증: 범위가 문장 단어 수 안에 있고, 서로 겹치지 않는 것만 반환 */
export function getValidChoicePoints(item: GrammarVocabItem): GrammarVocabChoicePoint[] {
  const words = item.original.split(/\s+/);
  const valid: GrammarVocabChoicePoint[] = [];

  const sorted = [...item.choicePoints]
    .filter((cp) => cp.startWord >= 0 && cp.endWord < words.length && cp.startWord <= cp.endWord)
    .sort((a, b) => a.startWord - b.startWord);

  let lastEnd = -1;
  for (const cp of sorted) {
    if (cp.startWord > lastEnd) {
      const originalWords = words.slice(cp.startWord, cp.endWord + 1).join(' ');
      const correctOption = cp.options[cp.correctIndex];
      if (correctOption === originalWords) {
        valid.push(cp);
        lastEnd = cp.endWord;
      }
    }
  }
  return valid;
}

interface UseGrammarVocabQuizOptions {
  items: GrammarVocabItem[];
  onScoreChange: (score: number, wrongs?: WrongChoicePoint[]) => void;
}

export function useGrammarVocabQuiz({ items, onScoreChange }: UseGrammarVocabQuizOptions) {
  const [selections, setSelections] = useState<SelectionMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [resultModal, setResultModal] = useState<{ score: number; correct: number; total: number } | null>(null);

  const [retryMode, setRetryMode] = useState(false);
  const [lockedCorrectKeys, setLockedCorrectKeys] = useState<Set<string>>(new Set());
  const [wrongItemIndices, setWrongItemIndices] = useState<Set<number>>(new Set());
  const { previousCorrectCount, startRetry, reset: resetRetry, getCombinedScore } = useRetryWrong();

  const validCPMap = items.map((item) => getValidChoicePoints(item));
  const totalChoicePoints = validCPMap.reduce((sum, cps) => sum + cps.length, 0);

  const wrongCount = useMemo(() => {
    if (!submitted) return 0;
    let count = 0;
    items.forEach((_, itemIdx) => {
      validCPMap[itemIdx].forEach((cp, cpIdx) => {
        const key = `${itemIdx}-${cpIdx}`;
        if (!lockedCorrectKeys.has(key) && selections[key] !== cp.correctIndex) {
          count++;
        }
      });
    });
    return count;
  }, [submitted, items, validCPMap, selections, lockedCorrectKeys]);

  function selectOption(itemIdx: number, cpIdx: number, optionIdx: number) {
    if (submitted) return;
    const key = `${itemIdx}-${cpIdx}`;
    if (lockedCorrectKeys.has(key)) return;
    setSelections((prev) => ({ ...prev, [key]: optionIdx }));
  }

  function handleSubmit() {
    let correct = 0;
    const wrongs: WrongChoicePoint[] = [];
    items.forEach((item, itemIdx) => {
      validCPMap[itemIdx].forEach((cp, cpIdx) => {
        const key = `${itemIdx}-${cpIdx}`;
        if (lockedCorrectKeys.has(key)) {
          correct++;
          return;
        }
        if (selections[key] === cp.correctIndex) {
          correct++;
        } else {
          wrongs.push({
            type: 'grammar_vocab',
            itemIdx,
            cpIdx,
            correctOption: cp.options[cp.correctIndex],
            selectedOption: cp.options[selections[key] ?? -1] || '',
            sentence: item.original,
          });
        }
      });
    });

    const newlyCorrect = correct - lockedCorrectKeys.size;
    const totalCorrect = retryMode ? previousCorrectCount + newlyCorrect : correct;
    const score = retryMode
      ? getCombinedScore(newlyCorrect, totalChoicePoints)
      : calculateScore(correct, totalChoicePoints);
    setSubmitted(true);
    setResultModal({ score, correct: totalCorrect, total: totalChoicePoints });
    onScoreChange(score, wrongs);
  }

  function handleRetryWrong() {
    const newLockedKeys = new Set(lockedCorrectKeys);
    let newlyCorrect = 0;
    const newWrongItems = new Set<number>();

    items.forEach((_, itemIdx) => {
      let hasWrong = false;
      validCPMap[itemIdx].forEach((cp, cpIdx) => {
        const key = `${itemIdx}-${cpIdx}`;
        if (lockedCorrectKeys.has(key)) return;
        if (selections[key] === cp.correctIndex) {
          newLockedKeys.add(key);
          newlyCorrect++;
        } else {
          hasWrong = true;
        }
      });
      if (hasWrong) newWrongItems.add(itemIdx);
    });

    const newSelections: SelectionMap = {};
    for (const key of newLockedKeys) {
      const [itemIdxStr, cpIdxStr] = key.split('-');
      const cp = validCPMap[Number(itemIdxStr)][Number(cpIdxStr)];
      newSelections[key] = cp.correctIndex;
    }

    setLockedCorrectKeys(newLockedKeys);
    startRetry(newlyCorrect);
    setWrongItemIndices(newWrongItems);
    setSelections(newSelections);
    setSubmitted(false);
    setResultModal(null);
    setRetryMode(true);
  }

  function handleRetry() {
    setSelections({});
    setSubmitted(false);
    setResultModal(null);
    setRetryMode(false);
    setLockedCorrectKeys(new Set());
    setWrongItemIndices(new Set());
    resetRetry();
  }

  const allSelected = useMemo(() => {
    let needed = 0;
    let filled = 0;
    items.forEach((_, itemIdx) => {
      validCPMap[itemIdx].forEach((_, cpIdx) => {
        const key = `${itemIdx}-${cpIdx}`;
        if (lockedCorrectKeys.has(key)) return;
        needed++;
        if (selections[key] !== undefined) filled++;
      });
    });
    return needed > 0 && filled === needed;
  }, [items, validCPMap, selections, lockedCorrectKeys]);

  const visibleItems = retryMode
    ? items.map((item, idx) => ({ item, idx })).filter(({ idx }) => wrongItemIndices.has(idx))
    : items.map((item, idx) => ({ item, idx }));

  return {
    selections,
    submitted,
    resultModal,
    setResultModal,
    retryMode,
    lockedCorrectKeys,
    wrongCount,
    validCPMap,
    allSelected,
    visibleItems,
    selectOption,
    handleSubmit,
    handleRetryWrong,
    handleRetry,
  };
}
