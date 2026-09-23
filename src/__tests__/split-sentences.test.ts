import { describe, it, expect } from 'vitest';
import { splitSentences } from '@/lib/naesin/split-sentences';

describe('splitSentences — 붙여넣은 지문을 문장으로 나누기 (원문 보존)', () => {
  it('문단을 문장 단위로 나눈다', () => {
    expect(splitSentences('I am here. She is there! Are you ready?')).toEqual([
      'I am here.', 'She is there!', 'Are you ready?',
    ]);
  });

  it('PDF 복사로 생긴 문장 중간 줄바꿈을 이어 붙인다', () => {
    expect(splitSentences('The cat sat on the mat. It was\nvery warm there. Birds sang\noutside.')).toEqual([
      'The cat sat on the mat.', 'It was very warm there.', 'Birds sang outside.',
    ]);
  });

  it('마침표 뒤 공백이 없어도 나눈다', () => {
    expect(splitSentences('The cat sat.It was warm.Birds sang.')).toEqual([
      'The cat sat.', 'It was warm.', 'Birds sang.',
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

  it('숫자로 끝나는 문장 뒤에서는 나눈다 ($3.50. / in 2020.)', () => {
    expect(splitSentences('The price was $3.50. That was cheap.')).toEqual([
      'The price was $3.50.', 'That was cheap.',
    ]);
    expect(splitSentences('It was built in 2020. Then it opened.')).toEqual([
      'It was built in 2020.', 'Then it opened.',
    ]);
  });

  it('목록 번호는 문장에 붙인다', () => {
    expect(splitSentences('1. Have you heard of it? 2. It is nice.')).toEqual([
      '1. Have you heard of it?', '2. It is nice.',
    ]);
  });

  it('U.S. 같은 한 글자 약어 사슬에서 자르지 않는다', () => {
    expect(splitSentences('The U.S. is big. It has 50 states.')).toEqual([
      'The U.S. is big.', 'It has 50 states.',
    ]);
    expect(splitSentences('We met at 9 A.M. It was early.')).toEqual([
      'We met at 9 A.M.', 'It was early.',
    ]);
  });

  it('닫는 따옴표를 문장에 포함한다', () => {
    expect(splitSentences('He said, "Go now." She left.')).toEqual([
      'He said, "Go now."', 'She left.',
    ]);
  });

  it('빈 줄은 문단 경계로 본다', () => {
    expect(splitSentences('First part here.\n\nSecond part here.')).toEqual([
      'First part here.', 'Second part here.',
    ]);
  });

  it('한국어 문장도 나눈다', () => {
    expect(splitSentences('나는 여기 있다. 그녀는 저기 있다.')).toEqual([
      '나는 여기 있다.', '그녀는 저기 있다.',
    ]);
  });

  it('마침표가 없어도 통째로 한 문장을 돌려준다 (빈 배열 금지)', () => {
    expect(splitSentences('The cat sat on the mat')).toEqual(['The cat sat on the mat']);
    expect(splitSentences('줄바꿈만\n있는 텍스트')).toEqual(['줄바꿈만 있는 텍스트']);
  });

  it('빈 입력은 빈 배열', () => {
    expect(splitSentences('   ')).toEqual([]);
  });
});
