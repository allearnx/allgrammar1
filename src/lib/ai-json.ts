import type Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';

/** AI 응답에서 텍스트 추출 + 코드펜스 제거. 커스텀 에러 핸들링이 필요한 경우 사용.
 *  ⚠️ content[0]만 보면 안 됨 — 모델이 thinking 블록을 앞세우면(Sonnet 5 기본,
 *  Opus도 간헐) 첫 블록이 text가 아니라 빈 응답으로 오인된다 ("성공인데 0단어" 원인). */
export function extractAiText(message: Anthropic.Message): string {
  const textBlock = message.content.find((b) => b.type === 'text');
  const raw = textBlock?.type === 'text' ? textBlock.text : '';
  return raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
}

/** AI 응답에서 JSON 배열 추출. 매칭 실패 시 []. */
export function parseAiJsonArray<T = unknown>(message: Anthropic.Message): T[] {
  const cleaned = extractAiText(message);
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) return [];
  return JSON.parse(match[0]);
}

/** AI 응답에서 JSON 객체 추출. 매칭 실패 시 null. */
export function parseAiJsonObject<T = unknown>(message: Anthropic.Message): T | null {
  const cleaned = extractAiText(message);
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  return JSON.parse(match[0]);
}

/** 잘린 JSON 배열 복구: 마지막으로 완결된 최상위 원소까지 남기고 배열을 닫는다.
 *  max_tokens 도달로 응답이 중간에 끊긴 경우용. 배열이 정상 종료됐거나
 *  완결된 원소가 하나도 없으면 null (복구 불가). */
export function salvageTruncatedJsonArray(raw: string): string | null {
  const start = raw.indexOf('[');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  let lastComplete = -1; // 마지막 완결 원소 직후 인덱스
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 1) lastComplete = i + 1;
      if (depth === 0) return null; // 배열이 정상 종료 — 잘림이 원인이 아님
    }
  }
  if (lastComplete === -1) return null;
  return raw.slice(start, lastComplete) + ']';
}

/** AI 응답에서 JSON 배열 추출 + 실패 시 에러. logTag로 구분.
 *  max_tokens로 잘린 응답은 완결된 원소까지 복구해서 반환. */
export function requireAiJsonArray<T = unknown>(message: Anthropic.Message, logTag: string): T[] {
  const cleaned = extractAiText(message);
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match && cleaned.indexOf('[') === -1) {
    logger.warn(`${logTag}.parse_fail`, { raw: cleaned.slice(0, 500), stop_reason: message.stop_reason });
    throw new Error('AI 응답에서 JSON을 파싱할 수 없습니다.');
  }
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch { /* 아래 복구 시도로 진행 */ }
  }
  const salvaged = salvageTruncatedJsonArray(cleaned);
  if (salvaged) {
    try {
      const arr: T[] = JSON.parse(salvaged);
      if (arr.length > 0) {
        logger.warn(`${logTag}.json_salvaged`, { recovered: arr.length, stop_reason: message.stop_reason });
        return arr;
      }
    } catch { /* 복구 실패 — 아래 에러로 */ }
  }
  logger.warn(`${logTag}.json_invalid`, {
    raw: (match ? match[0] : cleaned).slice(0, 500),
    stop_reason: message.stop_reason,
  });
  throw new Error(
    message.stop_reason === 'max_tokens'
      ? 'AI 응답이 길이 제한에 잘렸습니다. PDF를 나눠서 다시 시도해주세요.'
      : 'AI 응답 JSON 형식이 올바르지 않습니다.',
  );
}
