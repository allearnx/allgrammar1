import { describe, it, expect } from 'vitest';
import { parseAnswerLines } from '@/lib/naesin/parse-answer-lines';

describe('parseAnswerLines', () => {
  it('splits simple answers by newline', () => {
    expect(parseAnswerLines('3\n1\n5')).toEqual(['3', '1', '5']);
  });

  it('ignores empty lines', () => {
    expect(parseAnswerLines('3\n\n1\n\n5')).toEqual(['3', '1', '5']);
  });

  it('trims whitespace', () => {
    expect(parseAnswerLines('  3  \n  1  ')).toEqual(['3', '1']);
  });

  it('merges (2) continuation with previous line', () => {
    const input = '3\n(1) Tell me what you did yesterday.\n(2) This is not what I expected!\n5';
    expect(parseAnswerLines(input)).toEqual([
      '3',
      '(1) Tell me what you did yesterday. (2) This is not what I expected!',
      '5',
    ]);
  });

  it('merges (3) and beyond', () => {
    const input = '(1) answer A\n(2) answer B\n(3) answer C';
    expect(parseAnswerLines(input)).toEqual([
      '(1) answer A (2) answer B (3) answer C',
    ]);
  });

  it('merges (b) (c) alphabetic sub-parts', () => {
    const input = '(a) I go\n(b) They come\n(c) She stays';
    expect(parseAnswerLines(input)).toEqual([
      '(a) I go (b) They come (c) She stays',
    ]);
  });

  it('does not merge (1) or (a) as continuation', () => {
    const input = '(1) first answer\n(1) second answer';
    expect(parseAnswerLines(input)).toEqual([
      '(1) first answer',
      '(1) second answer',
    ]);
  });

  it('handles mixed MCQ and subjective', () => {
    const input = '3\n1\n1, 3\n(1) Hello\n(2) World\n5';
    expect(parseAnswerLines(input)).toEqual([
      '3',
      '1',
      '1, 3',
      '(1) Hello (2) World',
      '5',
    ]);
  });

  it('handles circled number continuations ②③', () => {
    const input = '① first\n② second\n③ third';
    expect(parseAnswerLines(input)).toEqual([
      '① first ② second ③ third',
    ]);
  });
});
