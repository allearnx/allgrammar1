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

/** AI 응답에서 JSON 배열 추출 + 실패 시 에러. logTag로 구분. */
export function requireAiJsonArray<T = unknown>(message: Anthropic.Message, logTag: string): T[] {
  const cleaned = extractAiText(message);
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) {
    logger.warn(`${logTag}.parse_fail`, { raw: cleaned.slice(0, 500) });
    throw new Error('AI 응답에서 JSON을 파싱할 수 없습니다.');
  }
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    logger.warn(`${logTag}.json_invalid`, { raw: match[0].slice(0, 500), error: String(e) });
    throw new Error('AI 응답 JSON 형식이 올바르지 않습니다.');
  }
}
