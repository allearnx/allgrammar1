import { useState, useMemo } from 'react';
import { useRetryWrong } from '@/hooks/use-retry-wrong';
import { calculateScore } from '@/lib/utils';
import type { TextbookPassage, BlankItem } from '@/types/database';

type Difficulty = 'easy' | 'medium' | 'hard';

interface WrongBlank {
  type: 'fill_blank';
  difficulty: Difficulty;
  blankIndex: number;
  correctAnswer: string;
  userAnswer: string;
  question?: string;
}

interface SentenceRange {
  korean: string;
  startIdx: number;
  endIdx: number;
  wordCount: number;
}

const SHORT_SENTENCE_THRESHOLD = 8;

interface UseFillBlanksStateOptions {
  passage: TextbookPassage;
  onComplete: (score: number, wrongAnswers: WrongBlank[], difficulty: Difficulty) => void;
}

export function useFillBlanksState({ passage, onComplete }: UseFillBlanksStateOptions) {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, boolean> | null>(null);
  const [resultModal, setResultModal] = useState<{ score: number; correct: number; total: number } | null>(null);

  const [retryMode, setRetryMode] = useState(false);
  const [lockedCorrect, setLockedCorrect] = useState<Record<number, string>>({});
  const { previousCorrectCount, startRetry, reset: resetRetry, getCombinedScore } = useRetryWrong();

  const blanksMap: Record<Difficulty, BlankItem[] | null> = {
    easy: passage.blanks_easy as BlankItem[] | null,
    medium: passage.blanks_medium as BlankItem[] | null,
    hard: passage.blanks_hard as BlankItem[] | null,
  };

  const blanks = blanksMap[difficulty] || [];
  const words = passage.original_text.split(/\s+/);
  const blankIndices = new Set(blanks.map((b) => b.index));

  const hasSentences = Array.isArray(passage.sentences) && passage.sentences.length > 0;
  const wrongCount = results ? Object.values(results).filter((v) => !v).length : 0;

  const sentenceGroups = useMemo(() => {
    if (!hasSentences) return null;

    const ranges: SentenceRange[] = [];
    let offset = 0;
    for (const s of passage.sentences!) {
      const wc = s.original.split(/\s+/).filter(Boolean).length;
      ranges.push({ korean: s.korean, startIdx: offset, endIdx: offset + wc - 1, wordCount: wc });
      offset += wc;
    }

    const groups: SentenceRange[][] = [];
    let i = 0;
    while (i < ranges.length) {
      const cur = ranges[i];
      if (cur.wordCount < SHORT_SENTENCE_THRESHOLD && i + 1 < ranges.length) {
        const next = ranges[i + 1];
        if (next.wordCount < SHORT_SENTENCE_THRESHOLD) {
          groups.push([cur, next]);
          i += 2;
          continue;
        }
      }
      groups.push([cur]);
      i++;
    }
    return groups;
  }, [hasSentences, passage.sentences]);

  function handleSubmit() {
    if (blanks.length === 0) return;
    const newResults: Record<number, boolean> = {};
    let correctCount = 0;
    const wrongs: WrongBlank[] = [];

    blanks.forEach((blank) => {
      if (retryMode && lockedCorrect[blank.index] !== undefined) {
        newResults[blank.index] = true;
        correctCount++;
        return;
      }

      const normalize = (s: string) =>
        s.trim().toLowerCase()
          .replace(/[\u2018\u2019\u0060\u00B4]/g, "'") // curly quotes/backtick/acute → straight
          .replace(/[\u201C\u201D]/g, '"')   // curly double quotes → straight
          .replace(/[\u2013\u2014\u2212]/g, '-') // en-dash/em-dash/minus → hyphen
          .replace(/[.,!?;:'"()]/g, '');     // remove punctuation (keep hyphens)
      const userAnswer = normalize(answers[blank.index] || '');
      const isCorrect = userAnswer === normalize(blank.answer);
      newResults[blank.index] = isCorrect;
      if (isCorrect) {
        correctCount++;
      } else {
        // Find the sentence containing this blank for context
        let question = '';
        if (passage.sentences) {
          let offset = 0;
          for (const sent of passage.sentences) {
            const wc = sent.original.split(/\s+/).filter(Boolean).length;
            if (blank.index >= offset && blank.index < offset + wc) {
              question = sent.original;
              break;
            }
            offset += wc;
          }
        }
        if (!question) {
          const s = Math.max(0, blank.index - 4);
          const e = Math.min(words.length - 1, blank.index + 4);
          const parts: string[] = [];
          for (let j = s; j <= e; j++) parts.push(j === blank.index ? '____' : words[j]);
          question = (s > 0 ? '... ' : '') + parts.join(' ') + (e < words.length - 1 ? ' ...' : '');
        }
        wrongs.push({
          type: 'fill_blank',
          difficulty,
          blankIndex: blank.index,
          correctAnswer: blank.answer,
          userAnswer: answers[blank.index] || '',
          question,
        });
      }
    });

    setResults(newResults);

    const newlyCorrect = correctCount - Object.keys(lockedCorrect).length;
    const totalCorrect = retryMode ? previousCorrectCount + newlyCorrect : correctCount;
    const score = retryMode ? getCombinedScore(newlyCorrect, blanks.length) : calculateScore(correctCount, blanks.length);
    onComplete(score, wrongs, difficulty);
    setResultModal({ score, correct: totalCorrect, total: blanks.length });
  }

  function handleRetryWrong() {
    if (!results) return;

    const correctIndices: Record<number, string> = { ...lockedCorrect };
    let newlyCorrect = 0;

    blanks.forEach((blank) => {
      if (results[blank.index] === true && lockedCorrect[blank.index] === undefined) {
        correctIndices[blank.index] = answers[blank.index] || blank.answer;
        newlyCorrect++;
      }
    });

    const newAnswers: Record<number, string> = {};
    blanks.forEach((blank) => {
      if (correctIndices[blank.index] !== undefined) {
        newAnswers[blank.index] = correctIndices[blank.index];
      }
    });

    setLockedCorrect(correctIndices);
    startRetry(newlyCorrect);
    setAnswers(newAnswers);
    setResults(null);
    setResultModal(null);
    setRetryMode(true);
  }

  function handleReset() {
    setAnswers({});
    setResults(null);
    setResultModal(null);
    setRetryMode(false);
    setLockedCorrect({});
    resetRetry();
  }

  function changeDifficulty(d: Difficulty) {
    setDifficulty(d);
    handleReset();
  }

  return {
    difficulty,
    answers,
    setAnswers,
    results,
    resultModal,
    setResultModal,
    retryMode,
    lockedCorrect,
    blanks,
    words,
    blankIndices,
    wrongCount,
    sentenceGroups,
    passage,
    handleSubmit,
    handleRetryWrong,
    handleReset,
    changeDifficulty,
  };
}
