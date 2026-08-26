import { describe, it, expect } from 'vitest';
import { normalize, normalizeSeparators, matchMcqAnswer, resolveCorrectIndex, uncircle } from '@/lib/naesin/normalize-answer';

describe('normalize', () => {
  it('trims, lowercases, removes trailing period, collapses spaces', () => {
    expect(normalize('  Hello World.  ')).toBe('hello world');
    expect(normalize('Test   Multiple   Spaces')).toBe('test multiple spaces');
  });

  it('normalizes curly quotes to straight quotes', () => {
    expect(normalize('she\u2019s')).toBe('she is'); // 곡선따옴표 변환 후 축약 확장
    expect(normalize('don\u2019t')).toBe('do not');
    expect(normalize('\u201CHello\u201D')).toBe('"hello"');
  });

  it('normalizes en-dash and em-dash to hyphen', () => {
    expect(normalize('A \u2013 B')).toBe('a - b');
    expect(normalize('A\u2014B')).toBe('a-b');
  });
});

describe('normalizeSeparators', () => {
  it('treats comma and slash as equivalent separators', () => {
    expect(normalizeSeparators('beauty contest, possible'))
      .toBe(normalizeSeparators('beauty contest / possible'));
  });

  it('handles multiple separators', () => {
    expect(normalizeSeparators('A, B, C'))
      .toBe(normalizeSeparators('A / B / C'));
  });

  it('handles spacing differences around separators', () => {
    expect(normalizeSeparators('answer one,answer two'))
      .toBe(normalizeSeparators('answer one / answer two'));
  });
});

describe('matchMcqAnswer', () => {
  const options = ['am', 'is', 'are', 'was', 'were'];

  it('matches when both are same number', () => {
    expect(matchMcqAnswer('2', '2', options)).toBe(true);
  });

  it('matches when user sends number and correct answer is option text', () => {
    expect(matchMcqAnswer('1', 'am', options)).toBe(true);
    expect(matchMcqAnswer('2', 'is', options)).toBe(true);
    expect(matchMcqAnswer('3', 'are', options)).toBe(true);
  });

  it('does not match wrong option', () => {
    expect(matchMcqAnswer('1', 'is', options)).toBe(false);
    expect(matchMcqAnswer('3', 'am', options)).toBe(false);
  });

  it('matches case-insensitively', () => {
    expect(matchMcqAnswer('1', 'Am', options)).toBe(true);
    expect(matchMcqAnswer('1', 'AM', options)).toBe(true);
  });

  it('matches when correct answer is number and user sends text', () => {
    expect(matchMcqAnswer('am', '1', options)).toBe(true);
    expect(matchMcqAnswer('is', '2', options)).toBe(true);
  });

  it('works without options (direct comparison)', () => {
    expect(matchMcqAnswer('3', '3')).toBe(true);
    expect(matchMcqAnswer('3', '4')).toBe(false);
  });

  it('handles whitespace in answers', () => {
    expect(matchMcqAnswer(' 2 ', ' is ', options)).toBe(true);
  });

  it('matches multi-select answers with different spacing', () => {
    expect(matchMcqAnswer('1, 3', '1,3')).toBe(true);
    expect(matchMcqAnswer('1,3', '1, 3')).toBe(true);
    expect(matchMcqAnswer('1,  3', '1, 3')).toBe(true);
  });

  it('matches multi-select answers regardless of order', () => {
    expect(matchMcqAnswer('3, 1', '1, 3')).toBe(true);
    expect(matchMcqAnswer('5, 2, 1', '1, 2, 5')).toBe(true);
  });

  it('does not match different multi-select answers', () => {
    expect(matchMcqAnswer('1, 3', '1, 4')).toBe(false);
    expect(matchMcqAnswer('1, 2', '1, 2, 3')).toBe(false);
  });

  it('matches circled number answers (①②③④⑤)', () => {
    expect(matchMcqAnswer('3', '③', options)).toBe(true);
    expect(matchMcqAnswer('1', '①', options)).toBe(true);
    expect(matchMcqAnswer('5', '⑤', options)).toBe(true);
  });

  it('matches circled number vs circled number', () => {
    expect(matchMcqAnswer('③', '③')).toBe(true);
  });

  it('matches circled multi-select (①③ vs 1,3)', () => {
    expect(matchMcqAnswer('1, 3', '①③')).toBe(true);
    expect(matchMcqAnswer('3, 1', '①③')).toBe(true);
  });

  it('does not match wrong circled number', () => {
    expect(matchMcqAnswer('2', '③', options)).toBe(false);
    expect(matchMcqAnswer('4', '①', options)).toBe(false);
  });
});

describe('uncircle', () => {
  it('converts circled numbers to plain numbers', () => {
    expect(uncircle('③')).toBe('3');
    expect(uncircle('①②③④⑤')).toBe('1,2,3,4,5');
    expect(uncircle('④⑤')).toBe('4,5');
    expect(uncircle('①③')).toBe('1,3');
  });

  it('leaves plain text unchanged', () => {
    expect(uncircle('hello')).toBe('hello');
    expect(uncircle('3')).toBe('3');
  });
});

describe('resolveCorrectIndex', () => {
  const options = ['am', 'is', 'are', 'was', 'were'];

  it('returns number as-is when already valid index', () => {
    expect(resolveCorrectIndex('3', options)).toBe('3');
  });

  it('converts text answer to option number', () => {
    expect(resolveCorrectIndex('am', options)).toBe('1');
    expect(resolveCorrectIndex('is', options)).toBe('2');
    expect(resolveCorrectIndex('are', options)).toBe('3');
  });

  it('handles case-insensitive text matching', () => {
    expect(resolveCorrectIndex('AM', options)).toBe('1');
    expect(resolveCorrectIndex('Is', options)).toBe('2');
  });

  it('returns original if no match found', () => {
    expect(resolveCorrectIndex('unknown', options)).toBe('unknown');
  });
});

describe('normalize — 축약형 동등 처리', () => {
  it("It's ≡ It is, isn't ≡ is not", () => {
    expect(normalize("It's softer than a cracker.")).toBe(normalize('It is softer than a cracker'));
    expect(normalize("There isn't a dog in the yard.")).toBe(normalize('There is not a dog in the yard.'));
    expect(normalize("The boy didn't know who he was.")).toBe(normalize('The boy did not know who he was.'));
    expect(normalize("can't keep the promise")).toBe(normalize('cannot keep the promise'));
    expect(normalize("I'm faster than you.")).toBe(normalize('I am faster than you.'));
    expect(normalize("I'll give all my things")).toBe(normalize('I will give all my things'));
  });

  it('소유격은 확장하지 않음', () => {
    expect(normalize("Tom's bike")).toBe("tom's bike");
    expect(normalize("your sister's best friend")).toBe("your sister's best friend");
  });
});
