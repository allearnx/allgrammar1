import { describe, it, expect } from 'vitest';
import { buildPdfExtractPrompt } from '@/lib/naesin/extract-prompt';

describe('buildPdfExtractPrompt', () => {
  it('조각이면 잘린 문항 제외 지시가 붙고, 통짜면 안 붙는다', () => {
    const chunk = buildPdfExtractPrompt(true);
    const whole = buildPdfExtractPrompt(false);
    expect(chunk).toContain('일부 조각입니다');
    expect(chunk).toContain('이전 조각에서 추출됨');
    expect(whole).not.toContain('일부 조각');
    expect(whole).not.toContain('이전 조각');
  });
  it('핵심 규칙(지시문 복제·공통 지문 복제·그림 문항 제외)은 둘 다 포함', () => {
    for (const p of [buildPdfExtractPrompt(true), buildPdfExtractPrompt(false)]) {
      expect(p).toContain('모든 문항 question 맨 앞에 각각 복제');
      expect(p).toContain('공통 지문 필수 복제');
      expect(p).toContain('그림·사진·지도·그래프');
    }
  });
});
