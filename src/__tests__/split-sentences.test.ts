import { describe, it, expect } from 'vitest';
import { splitSentences } from '@/lib/naesin/split-sentences';

describe('splitSentences — 붙여넣은 지문을 문장으로 나누기 (원문 보존)', () => {
  it('문단을 문장 단위로 나눈다', () => {
    expect(splitSentences('I am here. She is there! Are you ready?')).toEqual([
      'I am here.', 'She is there!', 'Are you ready?',
    ]);
  });

  it('약어에서 자르지 않는다', () => {
    expect(splitSentences('Mr. Kim arrived late. He was tired.')).toEqual([
      'Mr. Kim arrived late.', 'He was tired.',
    ]);
    expect(splitSentences('Bring a pen, e.g. a blue one. Then start.')).toEqual([
      'Bring a pen, e.g. a blue one.', 'Then start.',
    ]);
  });

  it('소수점에서 자르지 않는다', () => {
    expect(splitSentences('It costs 3.5 dollars. That is cheap.')).toEqual([
      'It costs 3.5 dollars.', 'That is cheap.',
    ]);
  });

  it('닫는 따옴표를 문장에 포함한다', () => {
    expect(splitSentences('He said, "Go now." She left.')).toEqual([
      'He said, "Go now."', 'She left.',
    ]);
  });

  it('줄바꿈·여러 공백이 있어도 원래 글자는 그대로 둔다', () => {
    const src = 'First   line here.\n\nSecond line here.';
    expect(splitSentences(src)).toEqual(['First line here.', 'Second line here.']);
  });

  it('한국어 문장도 나눈다', () => {
    expect(splitSentences('나는 여기 있다. 그녀는 저기 있다.')).toEqual([
      '나는 여기 있다.', '그녀는 저기 있다.',
    ]);
  });

  it('빈 입력은 빈 배열', () => {
    expect(splitSentences('   ')).toEqual([]);
  });
});
