import Anthropic from '@anthropic-ai/sdk';
import type { LlmCall } from '../types';

/**
 * Anthropic 구현체 — 서버 전용 (API 키 필요).
 * 코어(engine/adapters)는 이 파일을 import하지 않는다: 호출부(API 라우트)가
 * 이 구현체를 만들어 엔진에 주입한다.
 */
export function createAnthropicLlm(model = 'claude-haiku-4-5-20251001'): LlmCall {
  const anthropic = new Anthropic();
  return async (prompt, opts) => {
    const message = await anthropic.messages.create({
      model,
      max_tokens: opts?.maxTokens ?? 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    const textBlock = message.content.find((b) => b.type === 'text'); // thinking 블록 대응
    return textBlock?.type === 'text' ? textBlock.text : '';
  };
}
