'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { MatchingGameRound, type MatchingGameItem } from '@/components/voca/vocab-tab/matching-game-round';
import { NeonResultScreen } from './neon-result-screen';
import { shuffle } from '@/lib/utils';
import type { VocaVocabulary } from '@/types/voca';
import './neon-styles.css';

interface WordMatchingProps {
  vocabulary: VocaVocabulary[];
  onComplete: (score: number) => void;
}

const CHUNK_SIZE = 5;
const MAX_ATTEMPTS = 2;
const PASS_SCORE = 90;

/**
 * 같은 뜻(back_text)의 단어가 한 셋트에 들어가지 않도록 청크 분배.
 * 셋트 개수는 ceil(n/size) 유지. 한 뜻이 셋트 수보다 많이 나오면(회피 불가)
 * 남는 건 빈 자리에 채움 — 그 경우는 매칭 게임의 텍스트 비교가 공정 처리.
 */
function chunkAvoidingDuplicateMeaning(vocabulary: VocaVocabulary[], size: number): VocaVocabulary[][] {
  const shuffled = shuffle([...vocabulary]);
  const numChunks = Math.max(1, Math.ceil(shuffled.length / size));
  const chunks: VocaVocabulary[][] = Array.from({ length: numChunks }, () => []);
  const meanings: Set<string>[] = Array.from({ length: numChunks }, () => new Set());
  const overflow: VocaVocabulary[] = [];

  for (const w of shuffled) {
    const key = (w.back_text || '').trim();
    // 공간 있고 같은 뜻 없는 셋트 중 가장 적게 찬 것에 배정(균형)
    let best = -1;
    for (let i = 0; i < numChunks; i++) {
      if (chunks[i].length >= size) continue;
      if (key && meanings[i].has(key)) continue;
      if (best === -1 || chunks[i].length < chunks[best].length) best = i;
    }
    if (best === -1) { overflow.push(w); continue; }
    chunks[best].push(w);
    if (key) meanings[best].add(key);
  }
  // 회피 불가분(같은 뜻이 셋트 수보다 많음)은 빈 자리에 채움
  for (const w of overflow) {
    let best = -1;
    for (let i = 0; i < chunks.length; i++) {
      if (chunks[i].length >= size) continue;
      if (best === -1 || chunks[i].length < chunks[best].length) best = i;
    }
    if (best === -1) chunks.push([w]);
    else chunks[best].push(w);
  }
  return chunks.filter((c) => c.length > 0);
}

export function WordMatching({ vocabulary, onComplete }: WordMatchingProps) {
  const [currentChunk, setCurrentChunk] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const [totalWrong, setTotalWrong] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chunks = useMemo(() => {
    return chunkAvoidingDuplicateMeaning(vocabulary, CHUNK_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocabulary, retryCount]);

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

  function handleRetry() {
    setRetryCount((c) => c + 1);
    setCurrentChunk(0);
    setAttempt(1);
    setTotalWrong(0);
    setTotalPairs(0);
    setFinalScore(null);
  }

  if (finalScore !== null) {
    return (
      <NeonResultScreen
        score={finalScore}
        passThreshold={PASS_SCORE}
        passMessage="매칭 통과!"
        failMessage={`${finalScore}점 (90% 이상 필요)`}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="neon-container p-4 md:p-6 min-h-[60dvh]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400">
          라운드 {currentChunk + 1}/{chunks.length}
          {attempt > 1 && <span className="ml-2 text-amber-500 font-medium">(재시도)</span>}
        </span>
        <span className="text-xs text-gray-400">
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
