import { describe, it, expect } from 'vitest';
import { normalize, matchMcqAnswer, resolveCorrectIndex } from '@/lib/naesin/normalize-answer';

describe('normalize', () => {
  it('trims, lowercases, removes trailing period, collapses spaces', () => {
    expect(normalize('  Hello World.  ')).toBe('hello world');
    expect(normalize('Test   Multiple   Spaces')).toBe('test multiple spaces');
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
