import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Safe percentage score: 0-division returns 0 */
export function calculateScore(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

/**
 * 예문에서 단어(및 활용형)를 고정 밑줄('________')로 블라인드 처리.
 * "engage" → "engaged", "engaging" 등도 가림.
 * 구동사("bring up"), 특수문자 포함 단어도 안전하게 처리.
 */
export function blankOutWord(sentence: string, word: string): string {
  const escaped = word.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return sentence.replace(new RegExp(`\\b${escaped}\\w*\\b`, 'gi'), '________');
}

/** blankOutWord와 동일하지만 매치 길이만큼 밑줄 생성 (글자 수 힌트 유지) */
export function blankOutWordExact(sentence: string, word: string): string {
  const escaped = word.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return sentence.replace(
    new RegExp(`\\b${escaped}\\w*\\b`, 'gi'),
    (match) => '_'.repeat(match.length),
  );
}

/** Fisher-Yates shuffle (immutable) */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
