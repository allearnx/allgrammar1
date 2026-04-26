'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MatchingGameRound, type MatchingGameItem } from '@/components/voca/vocab-tab/matching-game-round';
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
  const [done, setDone] = useState(false);

  // 5개씩 청크 분할
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
      // 다음 청크
      setTotalWrong(newTotalWrong);
      setTotalPairs(newTotalPairs);
      setTimeout(() => setCurrentChunk((c) => c + 1), 500);
    } else {
      // 모든 청크 완료
      const finalTotal = newTotalPairs;
      const finalCorrect = finalTotal - newTotalWrong;
      const score = Math.round((finalCorrect / finalTotal) * 100);

      if (score >= PASS_SCORE || attempt >= MAX_ATTEMPTS) {
        setDone(true);
        onComplete(score);
      } else {
        // 재시도
        setAttempt(2);
        setCurrentChunk(0);
        setTotalWrong(0);
        setTotalPairs(0);
      }
    }
  };

  if (done) {
    const score = Math.round(((totalPairs - totalWrong) / totalPairs) * 100);
    return (
      <div className="neon-container p-6 min-h-[60dvh] flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4"
        >
          <p className={cn('text-5xl font-bold', score >= PASS_SCORE ? 'neon-text-green' : 'neon-text-gold')}>
            {score}%
          </p>
          <p className="text-slate-400">
            {score >= PASS_SCORE ? '매칭 통과!' : `${score}점 (90% 이상 필요)`}
          </p>
        </motion.div>
      </div>
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
