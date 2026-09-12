import type { GradingItem, GradingResult, LlmCall, RubricAdapter } from './types';

/**
 * 채점 엔진 코어: 빠른 경로(문자열 일치) → AI 배치 채점 → 실패 시 오답 폴백.
 *
 * AI 호출이 실패하거나 응답에서 일부 항목이 누락돼도 항상 items와 같은 길이의
 * 결과를 같은 순서로 반환한다 (누락분은 method: 'fallback', score: 0).
 */
export async function gradeItems(
  items: GradingItem[],
  adapter: RubricAdapter,
  llm: LlmCall,
): Promise<GradingResult[]> {
  const results: (GradingResult | null)[] = items.map((item) => adapter.fastPath(item));

  const pendingIndices = results
    .map((r, i) => (r === null ? i : -1))
    .filter((i) => i >= 0);

  if (pendingIndices.length > 0) {
    const pendingItems = pendingIndices.map((i) => items[i]);
    try {
      const text = await llm(adapter.buildPrompt(pendingItems), {
        maxTokens: Math.min(8192, 256 * pendingItems.length + 512),
      });
      const parsed = adapter.parseResponse(text, pendingItems);
      const byId = new Map(parsed.map((r) => [r.id, r]));
      for (const i of pendingIndices) {
        const r = byId.get(items[i].id);
        if (r) results[i] = r;
      }
    } catch {
      // AI 실패 — 아래 폴백 루프가 오답 처리. 호출부에서 재시도 UX를 제공한다.
    }
  }

  return results.map((r, i) =>
    r ?? { id: items[i].id, score: 0, method: 'fallback' as const },
  );
}

/** LLM 응답에서 JSON 배열 추출 + 항목 검증. 어댑터 parseResponse 공용 헬퍼. */
export function parseJsonArrayResponse(text: string): Record<string, unknown>[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null)
      : [];
  } catch {
    return [];
  }
}

/** 임의 숫자를 0 | 50 | 100 3단계로 스냅 (클라이언트가 score === 100 판정에 의존) */
export function snapScore(value: unknown): 0 | 50 | 100 {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n >= 75) return 100;
  if (n >= 25) return 50;
  return 0;
}
