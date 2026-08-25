import { describe, it, expect } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { salvageTruncatedJsonArray, requireAiJsonArray } from '@/lib/ai-json';

function fakeMessage(text: string, stopReason: string = 'end_turn'): Anthropic.Message {
  return {
    content: [{ type: 'text', text }],
    stop_reason: stopReason,
  } as unknown as Anthropic.Message;
}

describe('salvageTruncatedJsonArray', () => {
  it('잘린 배열에서 완결된 원소까지 복구', () => {
    const raw = '[{"number":1,"answer":"a"},{"number":2,"answer":"b"},{"number":3,"ans';
    const salvaged = salvageTruncatedJsonArray(raw);
    expect(salvaged).not.toBeNull();
    const arr = JSON.parse(salvaged!);
    expect(arr).toHaveLength(2);
    expect(arr[1].number).toBe(2);
  });

  it('내부 배열(options) 중간에서 잘려도 복구', () => {
    const raw = '[{"number":1,"options":["① a","② b"]},{"number":2,"options":["① a';
    const arr = JSON.parse(salvageTruncatedJsonArray(raw)!);
    expect(arr).toHaveLength(1);
    expect(arr[0].options).toEqual(['① a', '② b']);
  });

  it('문자열 안의 중괄호·대괄호는 무시', () => {
    const raw = '[{"q":"괄호 } 와 ] 포함 문장"},{"q":"잘린';
    const arr = JSON.parse(salvageTruncatedJsonArray(raw)!);
    expect(arr).toHaveLength(1);
    expect(arr[0].q).toBe('괄호 } 와 ] 포함 문장');
  });

  it('정상 종료된 배열은 null (잘림이 원인이 아님)', () => {
    expect(salvageTruncatedJsonArray('[{"a":1}]')).toBeNull();
  });

  it('완결 원소가 없으면 null', () => {
    expect(salvageTruncatedJsonArray('[{"number":1,"ans')).toBeNull();
    expect(salvageTruncatedJsonArray('no json here')).toBeNull();
  });
});

describe('requireAiJsonArray', () => {
  it('정상 JSON 배열은 그대로 파싱', () => {
    const msg = fakeMessage('[{"number":1},{"number":2}]');
    expect(requireAiJsonArray(msg, 'test')).toHaveLength(2);
  });

  it('코드펜스로 감싼 응답도 파싱', () => {
    const msg = fakeMessage('```json\n[{"number":1}]\n```');
    expect(requireAiJsonArray(msg, 'test')).toHaveLength(1);
  });

  it('max_tokens로 잘린 응답은 완결 원소까지 복구해 반환', () => {
    const msg = fakeMessage(
      '[{"number":1,"options":["① a"]},{"number":2,"options":["① a"]},{"number":3,"opt',
      'max_tokens',
    );
    const arr = requireAiJsonArray<{ number: number }>(msg, 'test');
    expect(arr).toHaveLength(2);
    expect(arr[1].number).toBe(2);
  });

  it('복구 불가 + max_tokens면 잘림 안내 에러', () => {
    const msg = fakeMessage('[{"number":1,"ans', 'max_tokens');
    expect(() => requireAiJsonArray(msg, 'test')).toThrow('길이 제한');
  });

  it('JSON이 아예 없으면 파싱 불가 에러', () => {
    const msg = fakeMessage('죄송합니다, 추출할 수 없습니다.');
    expect(() => requireAiJsonArray(msg, 'test')).toThrow('파싱할 수 없습니다');
  });
});
