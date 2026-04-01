function splitSentences(text: string, punctuationRe: RegExp): string[] {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  return lines.flatMap((line) =>
    line.split(punctuationRe).map((s) => s.trim()).filter(Boolean)
  );
}

export function splitIntoSentencePairs(originalText: string, koreanTranslation: string) {
  const enSentences = splitSentences(originalText, /(?<=[.!?])\s+/);
  const koSentences = splitSentences(koreanTranslation, /(?<=[.!?。])\s+/);
  const maxLen = Math.max(enSentences.length, koSentences.length, 1);
  return Array.from({ length: maxLen }, (_, i) => ({
    original: enSentences[i]?.trim() || '',
    korean: koSentences[i]?.trim() || '',
  }));
}
