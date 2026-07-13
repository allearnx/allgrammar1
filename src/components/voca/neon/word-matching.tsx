'use client';

import { useState, useMemo } from 'react';
import { MatchingGameRound, type MatchingGameItem } from '@/components/voca/vocab-tab/matching-game-round';
import { NeonResultScreen } from './neon-result-screen';
import { shuffle } from '@/lib/utils';
import { VocaBrandStyle, VocaHeroLetters, VOCA_COLORS, VOCA_STEP_THEMES } from '@/components/voca/voca-brand';
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
  // 셋트 완료 후 "다음 세트" 안내 화면 (다 맞췄다는 신호) — null이면 푸는 중
  const [setDone, setSetDone] = useState<{ correct: number; total: number } | null>(null);

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
      // 자동으로 넘기지 않고 "완료!" 신호 + 다음 세트 버튼을 보여준다.
      setSetDone({ correct: items.length - wrongIndices.length, total: items.length });
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

  function goNextChunk() {
    setSetDone(null);
    setCurrentChunk((c) => c + 1);
  }

  function handleRetry() {
    setRetryCount((c) => c + 1);
    setCurrentChunk(0);
    setAttempt(1);
    setTotalWrong(0);
    setTotalPairs(0);
    setFinalScore(null);
    setSetDone(null);
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

  // 셋트 완료 신호 — 다 맞췄음을 알리고, 학생이 직접 다음 세트로 넘어가게 한다.
  // /allkill 톤: 하늘 카드 + 알파벳 + GmarketSans + 4색 세트 도트 + 노란 CTA
  if (setDone !== null) {
    const allCorrect = setDone.correct === setDone.total;
    return (
      <div
        className="relative overflow-hidden rounded-3xl p-6 min-h-[60dvh] flex flex-col items-center justify-center text-center"
        style={{ background: VOCA_COLORS.sky }}
      >
        <VocaBrandStyle />
        <VocaHeroLetters />
        <div className="relative z-10 flex flex-col items-center">
          <p className="voca-display text-xs font-bold tracking-widest uppercase mb-3" style={{ color: VOCA_COLORS.blueDark }}>
            Matching
          </p>
          <h2 className="voca-display text-3xl mb-2" style={{ color: VOCA_COLORS.ink, fontWeight: 700 }}>
            {allCorrect ? <>세트 {currentChunk + 1} 올킬<span style={{ color: VOCA_COLORS.blue }}>!</span></> : <>세트 {currentChunk + 1} 완료<span style={{ color: VOCA_COLORS.blue }}>.</span></>}
          </h2>
          <p className="text-base mb-6" style={{ color: VOCA_COLORS.gray }}>
            {allCorrect
              ? `${setDone.total}개 모두 한 번에 맞췄어요 👏`
              : `${setDone.total}개 중 ${setDone.correct}개를 한 번에 맞췄어요`}
          </p>
          {/* 세트 진행 도트 — 구글 4색 순환 */}
          <div className="flex items-center gap-2 mb-8">
            {chunks.map((_, i) => {
              const theme = VOCA_STEP_THEMES[i % VOCA_STEP_THEMES.length];
              const done = i <= currentChunk;
              return (
                <span
                  key={i}
                  className="rounded-full transition-all"
                  style={{
                    width: done ? 12 : 8,
                    height: done ? 12 : 8,
                    background: theme.solid,
                    opacity: done ? 1 : 0.25,
                  }}
                />
              );
            })}
            <span className="ml-1 text-xs font-bold tabular-nums" style={{ color: VOCA_COLORS.gray }}>
              {currentChunk + 1}/{chunks.length}
            </span>
          </div>
          <button
            onClick={goNextChunk}
            className="voca-cta voca-display rounded-full px-10 py-3.5 text-base active:scale-[0.98]"
            style={{ fontWeight: 700 }}
          >
            다음 세트로 →
          </button>
        </div>
      </div>
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
