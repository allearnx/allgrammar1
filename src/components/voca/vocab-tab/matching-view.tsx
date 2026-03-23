'use client';

import { useState, useMemo } from 'react';
import { shuffle } from '@/lib/utils';
import { MatchingGameRound } from './matching-game-round';
import type { VocaVocabulary, VocaWrongWord } from '@/types/voca';

interface MatchPair {
  word: string;
  match: string;
  type: 'synonym' | 'antonym';
}

interface MatchingViewProps {
  vocabulary: VocaVocabulary[];
  priorityWords?: string[];
  onComplete: (score: number, attempt: number) => void;
  onFail: (wrongWords: VocaWrongWord[]) => void;
}

type RoundType = 'synonym' | 'antonym';

function buildPairs(vocabulary: VocaVocabulary[]): { synonymPairs: MatchPair[]; antonymPairs: MatchPair[] } {
  const synonymPairs: MatchPair[] = [];
  const antonymPairs: MatchPair[] = [];

  for (const v of vocabulary) {
    if (v.synonyms) {
      const syn = v.synonyms.split(',')[0].trim();
      if (syn) synonymPairs.push({ word: v.front_text, match: syn, type: 'synonym' });
    }
    if (v.antonyms) {
      const ant = v.antonyms.split(',')[0].trim();
      if (ant) antonymPairs.push({ word: v.front_text, match: ant, type: 'antonym' });
    }
  }

  return { synonymPairs, antonymPairs };
}

function prioritizePairs(pairs: MatchPair[], priorityWords: string[], max: number): MatchPair[] {
  if (priorityWords.length === 0) return shuffle(pairs).slice(0, max);
  const prioritySet = new Set(priorityWords.map((w) => w.toLowerCase()));
  const priority = pairs.filter((p) => prioritySet.has(p.word.toLowerCase()));
  const rest = pairs.filter((p) => !prioritySet.has(p.word.toLowerCase()));
  return [...shuffle(priority), ...shuffle(rest)].slice(0, max);
}

export function MatchingView({ vocabulary, priorityWords = [], onComplete, onFail }: MatchingViewProps) {
  const { synonymPairs, antonymPairs } = useMemo(() => buildPairs(vocabulary), [vocabulary]);

  const allPairs = useMemo(() => {
    const pairs: MatchPair[] = [];
    if (synonymPairs.length >= 2) pairs.push(...prioritizePairs(synonymPairs, priorityWords, 5));
    if (antonymPairs.length >= 2) pairs.push(...prioritizePairs(antonymPairs, priorityWords, 5));
    return pairs;
  }, [synonymPairs, antonymPairs, priorityWords]);

  const rounds = useMemo(() => {
    const r: RoundType[] = [];
    if (synonymPairs.length >= 2) r.push('synonym');
    if (antonymPairs.length >= 2) r.push('antonym');
    return r;
  }, [synonymPairs, antonymPairs]);

  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [allWrong, setAllWrong] = useState<VocaWrongWord[]>([]);

  const currentRound = rounds[currentRoundIdx] || 'synonym';

  const roundPairs = useMemo(() => {
    const source = currentRound === 'synonym' ? synonymPairs : antonymPairs;
    return prioritizePairs(source, priorityWords, 5);
  }, [currentRound, synonymPairs, antonymPairs, priorityWords, attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (allPairs.length < 2) {
    return (
      <p className="text-center text-muted-foreground py-8">
        유의어/반의어가 등록된 단어가 부족합니다. (최소 2쌍 필요)
      </p>
    );
  }

  function handleRoundComplete(wrongIndices: number[]) {
    const wrongs: VocaWrongWord[] = wrongIndices.map((i) => ({
      word: roundPairs[i].word, match: roundPairs[i].match, type: currentRound,
    }));
    const newAllWrong = [...allWrong, ...wrongs];
    setAllWrong(newAllWrong);

    if (currentRoundIdx < rounds.length - 1) {
      setCurrentRoundIdx(currentRoundIdx + 1);
      return;
    }

    const totalPairs = allPairs.length;
    const totalScore = Math.round(((totalPairs - newAllWrong.length) / totalPairs) * 100);

    if (totalScore >= 90) {
      onComplete(totalScore, attempt);
    } else if (attempt === 1) {
      setAttempt(2);
      setCurrentRoundIdx(0);
      setAllWrong([]);
    } else {
      onFail(newAllWrong);
    }
  }

  const items = roundPairs.map((p) => ({ leftLabel: p.word, rightLabel: p.match }));

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {attempt}차 시도 · {currentRound === 'synonym' ? '유의어' : '반의어'} 매칭
        </span>
        {rounds.length > 1 && (
          <span className="text-xs text-muted-foreground">
            라운드 {currentRoundIdx + 1}/{rounds.length}
          </span>
        )}
      </div>

      <MatchingGameRound
        key={`${currentRound}-${attempt}`}
        items={items}
        leftHeader="단어"
        rightHeader={currentRound === 'synonym' ? '유의어' : '반의어'}
        onComplete={handleRoundComplete}
      />
    </div>
  );
}
