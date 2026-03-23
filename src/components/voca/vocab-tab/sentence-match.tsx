'use client';

import { useState, useMemo } from 'react';
import { shuffle } from '@/lib/utils';
import { MatchingGameRound } from './matching-game-round';
import type { VocaVocabulary, VocaWrongWord } from '@/types/voca';

interface SentencePair {
  word: string;
  meaning: string;
  blankedSentence: string;
}

interface SentenceMatchProps {
  vocabulary: VocaVocabulary[];
  onComplete: (score: number, attempt: number) => void;
  onFail: (wrongWords: VocaWrongWord[]) => void;
}

function blankOut(sentence: string, word: string): string | null {
  const regex = new RegExp(`\\b${word}\\b`, 'gi');
  if (!regex.test(sentence)) return null;
  return sentence.replace(regex, '________');
}

function buildPairs(vocabulary: VocaVocabulary[]): SentencePair[] {
  const pairs: SentencePair[] = [];
  for (const v of vocabulary) {
    if (!v.example_sentence) continue;
    const blanked = blankOut(v.example_sentence, v.front_text);
    if (!blanked) continue;
    pairs.push({ word: v.front_text, meaning: v.back_text, blankedSentence: blanked });
  }
  return pairs;
}

export function SentenceMatch({ vocabulary, onComplete, onFail }: SentenceMatchProps) {
  const allPairs = useMemo(() => buildPairs(vocabulary), [vocabulary]);
  const [attempt, setAttempt] = useState(1);

  const pairs = useMemo(() => {
    return shuffle(allPairs).slice(0, 5);
  }, [allPairs, attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (allPairs.length < 2) {
    return (
      <p className="text-center text-muted-foreground py-8">
        예문이 등록된 단어가 부족합니다. (최소 2개 필요)
      </p>
    );
  }

  function handleRoundComplete(wrongIndices: number[]) {
    const score = Math.round(((pairs.length - wrongIndices.length) / pairs.length) * 100);
    const wrongs: VocaWrongWord[] = wrongIndices.map((i) => ({
      word: pairs[i].word, match: pairs[i].meaning, type: 'sentence',
    }));

    if (score >= 90) {
      onComplete(score, attempt);
    } else if (attempt === 1) {
      setAttempt(2);
    } else {
      onFail(wrongs);
    }
  }

  const items = pairs.map((p) => ({ leftLabel: p.word, rightLabel: p.blankedSentence }));

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <span className="text-sm text-muted-foreground">
        {attempt}차 시도 · 예문 매칭
      </span>
      <MatchingGameRound
        key={`sentence-${attempt}`}
        items={items}
        leftHeader="단어"
        rightHeader="예문"
        onComplete={handleRoundComplete}
        rightButtonClassName="text-sm text-left whitespace-normal leading-tight px-3"
        gridClassName="grid-cols-[auto_1fr] gap-3"
      />
    </div>
  );
}
