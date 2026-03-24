import type Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';

/** AI 응답에서 텍스트 추출 + 코드펜스 제거. 커스텀 에러 핸들링이 필요한 경우 사용. */
export function extractAiText(message: Anthropic.Message): string {
  const raw = message.content[0]?.type === 'text' ? message.content[0].text : '';
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
  return JSON.parse(match[0]);
}
