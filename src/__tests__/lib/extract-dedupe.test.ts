import { describe, it, expect } from 'vitest';
import { extractDedupKey, dedupeExtractedChunks } from '@/lib/naesin/extract-dedupe';

const q = (question: string, answer: string, options?: string[]) => ({ question, answer, options: options ?? null });

describe('extractDedupKey — 겹침 조각 중복 판정', () => {
  it('각주 번호·지시문 유무가 달라도 같은 영문 본문이면 같은 키', () => {
    const a = q('다음 빈칸에 알맞은 말을 쓰시오.\nShe got up early.1) because she had a test.', 'because');
    const b = q('She got up early because she had a test.', 'because');
    expect(extractDedupKey(a)).toBe(extractDedupKey(b));
  });

  it('정답이 다르면 다른 키', () => {
    expect(extractDedupKey(q('I like apples and bananas.', 'apples')))
      .not.toBe(extractDedupKey(q('I like apples and bananas.', 'bananas')));
  });

  it('보기가 다르면 다른 키 (같은 문장, 다른 선지)', () => {
    expect(extractDedupKey(q('I made my dad ______.', '1', ['angry', 'angrily'])))
      .not.toBe(extractDedupKey(q('I made my dad ______.', '1', ['happy', 'happily'])));
  });

  it('영문이 15자 미만인 한글 문항은 정규화한 전체 텍스트로 비교', () => {
    const a = q('다음 중 틀린 것은? O X', '2');
    const b = q('다음 중 틀린 것은? O X', '2');
    const c = q('다음 중 맞는 것은? O X', '2');
    expect(extractDedupKey(a)).toBe(extractDedupKey(b));
    expect(extractDedupKey(a)).not.toBe(extractDedupKey(c));
  });
});

describe('dedupeExtractedChunks', () => {
  it('뒤 조각의 중복 문항을 버리고 순서를 유지하며 개수를 보고한다', () => {
    const c1 = [q('Alpha sentence number one here.', 'a'), q('Beta sentence number two here.', 'b')];
    const c2 = [q('Beta sentence number two here.', 'b'), q('Gamma sentence number three here.', 'c')];
    const { questions, deduped } = dedupeExtractedChunks([c1, c2]);
    expect(questions.map((x) => x.answer)).toEqual(['a', 'b', 'c']);
    expect(deduped).toBe(1);
  });

  it('중복이 없으면 그대로', () => {
    const { questions, deduped } = dedupeExtractedChunks([[q('One two three four five.', '1')], [q('Six seven eight nine ten.', '2')]]);
    expect(questions).toHaveLength(2);
    expect(deduped).toBe(0);
  });
});
