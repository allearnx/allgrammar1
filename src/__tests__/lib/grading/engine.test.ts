import { describe, it, expect, vi } from 'vitest';
import { gradeItems, parseJsonArrayResponse, snapScore } from '@/lib/grading/engine';
import { naesinAnswerKeyAdapter } from '@/lib/grading/adapters/naesin-answer-key';
import type { GradingItem } from '@/lib/grading/types';

function item(overrides: Partial<GradingItem> = {}): GradingItem {
  return {
    id: 'q1',
    prompt: '다음 문장을 완성하시오.',
    referenceAnswer: 'She goes to school.',
    studentAnswer: 'She goes to school.',
    ...overrides,
  };
}

describe('naesinAnswerKeyAdapter.fastPath', () => {
  it('정규화 일치는 AI 없이 즉시 100 (마침표·대소문자·곱슬따옴표)', () => {
    const r = naesinAnswerKeyAdapter.fastPath(
      item({ referenceAnswer: "It's a book.", studentAnswer: 'it’s a book' }),
    );
    expect(r).toEqual({ id: 'q1', score: 100, method: 'exact' });
  });

  it('축약형 ↔ 비축약형 동등 처리', () => {
    const r = naesinAnswerKeyAdapter.fastPath(
      item({ referenceAnswer: 'It is not mine.', studentAnswer: "It isn't mine." }),
    );
    expect(r?.score).toBe(100);
  });

  it('acceptedAnswers 일치도 즉시 100', () => {
    const r = naesinAnswerKeyAdapter.fastPath(
      item({ studentAnswer: 'She attends school.', acceptedAnswers: ['She attends school.'] }),
    );
    expect(r?.score).toBe(100);
  });

  it('불일치는 null (AI 폴백 대상)', () => {
    expect(naesinAnswerKeyAdapter.fastPath(item({ studentAnswer: 'She go to school.' }))).toBeNull();
  });

  it('배열 문제 부분 일치(prefix/suffix)는 정답 처리 — submit 재채점과 동일 규칙', () => {
    const r = naesinAnswerKeyAdapter.fastPath(
      item({
        referenceAnswer: 'I have never been to Paris before.',
        studentAnswer: 'I have never been to Paris',
      }),
    );
    expect(r?.score).toBe(100);
  });
});

describe('gradeItems', () => {
  it('전부 빠른 경로면 LLM을 호출하지 않는다', async () => {
    const llm = vi.fn();
    const results = await gradeItems([item()], naesinAnswerKeyAdapter, llm);
    expect(results).toHaveLength(1);
    expect(results[0].method).toBe('exact');
    expect(llm).not.toHaveBeenCalled();
  });

  it('불일치 항목은 AI 결과로 채워진다', async () => {
    const llm = vi.fn().mockResolvedValue(
      '[{"id":"q1","score":50,"feedback":"동사 형태가 틀렸어요","correctedAnswer":"She goes to school."}]',
    );
    const results = await gradeItems(
      [item({ studentAnswer: 'She go to school.' })],
      naesinAnswerKeyAdapter,
      llm,
    );
    expect(results[0]).toMatchObject({
      score: 50,
      method: 'ai',
      feedback: '동사 형태가 틀렸어요',
      correctedAnswer: 'She goes to school.',
    });
  });

  it('LLM 실패 시 오답 폴백 (기존 문자열 채점과 동일한 0점) — 응답은 항상 완결', async () => {
    const llm = vi.fn().mockRejectedValue(new Error('api down'));
    const results = await gradeItems(
      [item({ studentAnswer: 'wrong answer' })],
      naesinAnswerKeyAdapter,
      llm,
    );
    expect(results[0]).toEqual({ id: 'q1', score: 0, method: 'fallback' });
  });

  it('AI 응답에서 누락된 항목도 폴백으로 채워진다', async () => {
    const llm = vi.fn().mockResolvedValue('[{"id":"q1","score":100,"feedback":"ok"}]');
    const results = await gradeItems(
      [
        item({ id: 'q1', studentAnswer: 'A' }),
        item({ id: 'q2', studentAnswer: 'B' }),
      ],
      naesinAnswerKeyAdapter,
      llm,
    );
    expect(results[0].method).toBe('ai');
    expect(results[1]).toEqual({ id: 'q2', score: 0, method: 'fallback' });
  });

  it('배치 순서 보존: 빠른 경로와 AI 결과가 섞여도 입력 순서대로', async () => {
    const llm = vi.fn().mockResolvedValue('[{"id":"q2","score":0,"feedback":"오답"}]');
    const results = await gradeItems(
      [item({ id: 'q1' }), item({ id: 'q2', studentAnswer: 'nope' }), item({ id: 'q3' })],
      naesinAnswerKeyAdapter,
      llm,
    );
    expect(results.map((r) => r.id)).toEqual(['q1', 'q2', 'q3']);
    expect(results.map((r) => r.method)).toEqual(['exact', 'ai', 'exact']);
  });
});

describe('parseJsonArrayResponse', () => {
  it('JSON 배열 앞뒤의 잡담 텍스트를 무시한다', () => {
    const parsed = parseJsonArrayResponse('Here are the results:\n[{"id":"a","score":100}]\nDone.');
    expect(parsed).toHaveLength(1);
  });

  it('깨진 JSON이면 빈 배열 (엔진이 폴백 처리)', () => {
    expect(parseJsonArrayResponse('[{"id": broken')).toEqual([]);
    expect(parseJsonArrayResponse('no json at all')).toEqual([]);
  });
});

describe('snapScore', () => {
  it('임의 숫자를 0/50/100 3단계로 스냅', () => {
    expect(snapScore(100)).toBe(100);
    expect(snapScore(90)).toBe(100);
    expect(snapScore(50)).toBe(50);
    expect(snapScore(30)).toBe(50);
    expect(snapScore(10)).toBe(0);
    expect(snapScore('100')).toBe(100);
    expect(snapScore(undefined)).toBe(0);
    expect(snapScore('abc')).toBe(0);
  });
});
