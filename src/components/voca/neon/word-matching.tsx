'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { MatchingGameRound, type MatchingGameItem } from '@/components/voca/vocab-tab/matching-game-round';
import { NeonResultScreen } from './neon-result-screen';
import type { VocaVocabulary } from '@/types/voca';
import './neon-styles.css';

interface WordMatchingProps {
  vocabulary: VocaVocabulary[];
  onComplete: (score: number) => void;
}

const CHUNK_SIZE = 5;
const MAX_ATTEMPTS = 2;
const PASS_SCORE = 90;

export function WordMatching({ vocabulary, onComplete }: WordMatchingProps) {
  const [currentChunk, setCurrentChunk] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [totalWrong, setTotalWrong] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chunks = useMemo(() => {
    const result: VocaVocabulary[][] = [];
    for (let i = 0; i < vocabulary.length; i += CHUNK_SIZE) {
      result.push(vocabulary.slice(i, i + CHUNK_SIZE));
    }
    return result;
  }, [vocabulary]);

  const items: MatchingGameItem[] = useMemo(() => {
    return chunks[currentChunk]?.map((v) => ({
      leftLabel: v.front_text,
      rightLabel: v.back_text,
    })) || [];
  }, [chunks, currentChunk]);

  const handleChunkComplete = (wrongIndices: number[]) => {
    const newTotalWrong = totalWrong + wrongIndices.length;
    const newTotalPairs = totalPairs + items.length;

    if (currentChunk + 1 < chunks.length) {
      setTotalWrong(newTotalWrong);
      setTotalPairs(newTotalPairs);
      chunkTimerRef.current = setTimeout(() => setCurrentChunk((c) => c + 1), 500);
    } else {
      const score = Math.round(((newTotalPairs - newTotalWrong) / newTotalPairs) * 100);

      if (score >= PASS_SCORE || attempt >= MAX_ATTEMPTS) {
        setFinalScore(score);
        onComplete(score);
      } else {
        setAttempt(2);
        setCurrentChunk(0);
        setTotalWrong(0);
        setTotalPairs(0);
      }
    }
  };

  useEffect(() => {
    return () => { if (chunkTimerRef.current) clearTimeout(chunkTimerRef.current); };
  }, []);

  if (finalScore !== null) {
    return (
      <NeonResultScreen
        score={finalScore}
        passThreshold={PASS_SCORE}
        passMessage="매칭 통과!"
        failMessage={`${finalScore}점 (90% 이상 필요)`}
      />
    );
  }

  return (
    <div className="neon-container p-4 md:p-6 min-h-[60dvh]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-500">
          라운드 {currentChunk + 1}/{chunks.length}
          {attempt > 1 && <span className="ml-2 text-yellow-400">(재시도)</span>}
        </span>
        <span className="text-xs text-slate-600">
          {attempt}/{MAX_ATTEMPTS} 시도
        </span>
      </div>

      <MatchingGameRound
        key={`${currentChunk}-${attempt}`}
        items={items}
        leftHeader="영어"
        rightHeader="한국어"
        onComplete={handleChunkComplete}
      />
    </div>
  );
}
