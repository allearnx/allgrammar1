'use client';

import { cn } from '@/lib/utils';

interface NeonSentenceDisplayProps {
  sentence: string;
  targetWord: string;
  currentWordIndex: number;
  isSpeakingWord?: boolean;
  className?: string;
}

/**
 * 문장을 단어별로 분리해서 하이라이트 렌더링
 * - 현재 재생 중인 단어: 배경 필 + 색 전환 (색/배경만)
 * - 타겟 단어 (front_text): 파랑 볼드 (굵기는 항상 고정)
 *
 * ⚠️ 하이라이트가 지나갈 때 굵기(font-weight)나 크기(scale)를 바꾸면
 * 단어 폭이 변해 문장 전체가 밀리며 "튀는" 현상이 생긴다 — 색/배경만 전환할 것.
 */
export function NeonSentenceDisplay({
  sentence,
  targetWord,
  currentWordIndex,
  isSpeakingWord = false,
  className,
}: NeonSentenceDisplayProps) {
  const words = sentence.split(/\s+/);
  const targetLower = targetWord.toLowerCase();

  return (
    <p className={cn('text-2xl md:text-3xl leading-relaxed font-medium text-center', className)}>
      {words.map((word, i) => {
        const isTarget = word.toLowerCase().replace(/[.,!?;:'"()]/g, '') === targetLower
          || word.toLowerCase().replace(/[.,!?;:'"()]/g, '').includes(targetLower);
        const isCurrent = i === currentWordIndex;
        const lit = isCurrent || (isTarget && isSpeakingWord);

        return (
          <span
            key={i}
            className={cn(
              'transition-colors duration-150 inline-block rounded-md px-0.5',
              isTarget && 'font-bold', // 굵기 고정 — 재생 여부와 무관
              isTarget && !lit && 'text-brand-500',
              isTarget && lit && 'text-brand-700 bg-brand-100',
              !isTarget && !lit && 'text-gray-400',
              !isTarget && lit && 'text-[#1A73E8] bg-[#E8F0FE]',
            )}
          >
            {word}{i < words.length - 1 ? '\u00A0' : ''}
          </span>
        );
      })}
    </p>
  );
}
