'use client';

import { cn } from '@/lib/utils';

interface NeonSentenceDisplayProps {
  sentence: string;
  targetWord: string;
  currentWordIndex: number;
  className?: string;
}

/**
 * 문장을 단어별로 분리해서 하이라이트 렌더링
 * - 현재 재생 중인 단어: blue 강조
 * - 타겟 단어 (front_text): indigo 강조
 */
export function NeonSentenceDisplay({
  sentence,
  targetWord,
  currentWordIndex,
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

        return (
          <span
            key={i}
            className={cn(
              'transition-all duration-200 inline-block rounded-md px-0.5',
              isCurrent && isTarget && 'neon-text-gold scale-110 bg-indigo-100',
              isCurrent && !isTarget && 'neon-text-cyan bg-blue-50',
              !isCurrent && isTarget && 'text-indigo-500 font-bold',
              !isCurrent && !isTarget && 'text-gray-400',
            )}
          >
            {word}{i < words.length - 1 ? '\u00A0' : ''}
          </span>
        );
      })}
    </p>
  );
}
