import { describe, it, expect } from 'vitest';
import { parseOmrLines } from '@/components/dashboard/naesin-admin/content-dialogs/bulk-omr-upload-dialog';
import { parseQuestions } from '@/components/dashboard/naesin-admin/content-dialogs/bulk-problem-upload-dialog';

// ─── parseOmrLines ───────────────────────────────────────────────

describe('parseOmrLines', () => {
  it('parses 3 valid OMR lines', () => {
    const text = `1과 문제풀이, 3|1|5|2|4, https://example.com/test.pdf
2과 문제풀이, 1|3|2|5|4
3과 문제풀이, 2|4|1|3|5|2|1|3|4|5`;
    const { sheets, errors } = parseOmrLines(text);
    expect(errors).toHaveLength(0);
    expect(sheets).toHaveLength(3);

    expect(sheets[0]).toEqual({
      title: '1과 문제풀이',
      answerKey: ['3', '1', '5', '2', '4'],
      pdfUrl: 'https://example.com/test.pdf',
    });
    expect(sheets[1]).toEqual({
      title: '2과 문제풀이',
      answerKey: ['1', '3', '2', '5', '4'],
      pdfUrl: null,
    });
    expect(sheets[2].answerKey).toHaveLength(10);
  });

  it('reports error for empty title', () => {
    const { sheets, errors } = parseOmrLines(', 3|1|5');
    expect(sheets).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('제목이 비어있습니다');
  });

  it('reports error for empty answers', () => {
    const { sheets, errors } = parseOmrLines('제목, ');
    expect(sheets).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('정답이 비어있습니다');
  });

  it('reports error for line with only title (no comma)', () => {
    const { sheets, errors } = parseOmrLines('제목만있는줄');
    expect(sheets).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('제목과 정답이 필요합니다');
  });

  it('skips blank lines', () => {
    const text = `1과, 3|1|5

2과, 1|3|2`;
    const { sheets, errors } = parseOmrLines(text);
    expect(errors).toHaveLength(0);
    expect(sheets).toHaveLength(2);
  });

  it('handles mixed valid and invalid lines', () => {
    const text = `1과, 3|1|5
잘못된줄
2과, 1|3|2`;
    const { sheets, errors } = parseOmrLines(text);
    expect(sheets).toHaveLength(2);
    expect(errors).toHaveLength(1);
  });

  it('returns empty for empty input', () => {
    const { sheets, errors } = parseOmrLines('');
    expect(sheets).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });

  it('handles pdfUrl with no trailing space', () => {
    const { sheets } = parseOmrLines('제목, 1|2|3, https://cdn.example.com/a.pdf');
    expect(sheets[0].pdfUrl).toBe('https://cdn.example.com/a.pdf');
  });
});

// ─── parseQuestions ──────────────────────────────────────────────

describe('parseQuestions', () => {
  it('parses multiple choice questions', () => {
    const data: string[][] = [
      ['번호', '문제', '보기1', '보기2', '보기3', '보기4', '보기5', '정답', '해설'],
      ['1', 'Choose correct.', 'has gone', 'have gone', 'had gone', 'is going', 'was going', '1', '현재완료'],
    ];
    const { questions, errors } = parseQuestions(data);
    expect(errors).toHaveLength(0);
    expect(questions).toHaveLength(1);
    expect(questions[0]).toEqual({
      number: 1,
      question: 'Choose correct.',
      options: ['has gone', 'have gone', 'had gone', 'is going', 'was going'],
      answer: '1',
      explanation: '현재완료',
      type: 'multiple_choice',
    });
  });

  it('parses subjective questions (all choices empty)', () => {
    const data: string[][] = [
      ['1', '빈칸에 알맞은 단어를 쓰시오.', '', '', '', '', '', 'running', '현재분사'],
    ];
    const { questions, errors } = parseQuestions(data);
    expect(errors).toHaveLength(0);
    expect(questions).toHaveLength(1);
    expect(questions[0].type).toBe('subjective');
    expect(questions[0].options).toEqual([]);
    expect(questions[0].answer).toBe('running');
  });

  it('auto-detects mixed MCQ and subjective in same CSV', () => {
    const data: string[][] = [
      ['1', 'MCQ question', 'A', 'B', 'C', '', '', '2', '설명1'],
      ['2', 'Write the answer.', '', '', '', '', '', 'hello', '설명2'],
    ];
    const { questions, errors } = parseQuestions(data);
    expect(errors).toHaveLength(0);
    expect(questions).toHaveLength(2);
    expect(questions[0].type).toBe('multiple_choice');
    expect(questions[0].options).toEqual(['A', 'B', 'C']);
    expect(questions[1].type).toBe('subjective');
  });

  it('skips header row (번호)', () => {
    const data: string[][] = [
      ['번호', '문제', '보기1', '보기2', '보기3', '보기4', '보기5', '정답', '해설'],
      ['1', 'Q1', 'A', 'B', '', '', '', '1', ''],
    ];
    const { questions } = parseQuestions(data);
    expect(questions).toHaveLength(1);
    expect(questions[0].number).toBe(1);
  });

  it('skips header row (#)', () => {
    const data: string[][] = [
      ['#', '문제', '보기1', '보기2', '보기3', '보기4', '보기5', '정답', '해설'],
      ['1', 'Q1', 'A', 'B', '', '', '', '1', ''],
    ];
    const { questions } = parseQuestions(data);
    expect(questions).toHaveLength(1);
  });

  it('reports error for non-numeric question number', () => {
    const data: string[][] = [
      ['abc', 'Q1', 'A', 'B', '', '', '', '1', ''],
    ];
    const { questions, errors } = parseQuestions(data);
    expect(questions).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('번호가 올바르지 않습니다');
  });

  it('reports error for empty question text', () => {
    const data: string[][] = [
      ['1', '', 'A', 'B', '', '', '', '1', ''],
    ];
    const { questions, errors } = parseQuestions(data);
    expect(questions).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('문제 텍스트가 비어있습니다');
  });

  it('reports error for empty answer', () => {
    const data: string[][] = [
      ['1', 'Q1', 'A', 'B', '', '', '', '', ''],
    ];
    const { questions, errors } = parseQuestions(data);
    expect(questions).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('정답이 비어있습니다');
  });

  it('reports error for answer number exceeding choices count', () => {
    const data: string[][] = [
      ['1', 'Q1', 'A', 'B', '', '', '', '5', ''],
    ];
    const { questions, errors } = parseQuestions(data);
    expect(questions).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('보기 수(2)를 초과합니다');
  });

  it('reports error for answer number 0', () => {
    const data: string[][] = [
      ['1', 'Q1', 'A', 'B', '', '', '', '0', ''],
    ];
    const { questions, errors } = parseQuestions(data);
    expect(questions).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('보기 수');
  });

  it('handles 5 questions correctly', () => {
    const data: string[][] = [
      ['1', 'Q1', 'A', 'B', 'C', 'D', 'E', '3', 'E1'],
      ['2', 'Q2', 'A', 'B', 'C', '', '', '2', 'E2'],
      ['3', 'Q3', '', '', '', '', '', 'answer', 'E3'],
      ['4', 'Q4', 'X', 'Y', '', '', '', '1', ''],
      ['5', 'Q5', '', '', '', '', '', 'text', ''],
    ];
    const { questions, errors } = parseQuestions(data);
    expect(errors).toHaveLength(0);
    expect(questions).toHaveLength(5);
    expect(questions.filter((q) => q.type === 'multiple_choice')).toHaveLength(3);
    expect(questions.filter((q) => q.type === 'subjective')).toHaveLength(2);
  });

  it('skips empty rows', () => {
    const data: string[][] = [
      ['1', 'Q1', 'A', 'B', '', '', '', '1', ''],
      [],
      ['2', 'Q2', '', '', '', '', '', 'ans', ''],
    ];
    const { questions, errors } = parseQuestions(data);
    expect(errors).toHaveLength(0);
    expect(questions).toHaveLength(2);
  });

  it('trims whitespace from all fields', () => {
    const data: string[][] = [
      [' 1 ', ' Q1 ', ' A ', ' B ', '', '', '', ' 2 ', ' 설명 '],
    ];
    const { questions, errors } = parseQuestions(data);
    expect(errors).toHaveLength(0);
    expect(questions[0].question).toBe('Q1');
    expect(questions[0].options).toEqual(['A', 'B']);
    expect(questions[0].answer).toBe('2');
    expect(questions[0].explanation).toBe('설명');
  });

  it('handles mixed valid and invalid rows', () => {
    const data: string[][] = [
      ['1', 'Q1', 'A', 'B', '', '', '', '1', ''],
      ['abc', 'BAD', '', '', '', '', '', '1', ''],
      ['3', 'Q3', '', '', '', '', '', 'ok', ''],
    ];
    const { questions, errors } = parseQuestions(data);
    expect(questions).toHaveLength(2);
    expect(errors).toHaveLength(1);
  });

  it('returns empty for empty input', () => {
    const { questions, errors } = parseQuestions([]);
    expect(questions).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });

  it('allows subjective answers that look non-numeric', () => {
    const data: string[][] = [
      ['1', 'Write the word.', '', '', '', '', '', 'have been running', '현재완료진행형'],
    ];
    const { questions, errors } = parseQuestions(data);
    expect(errors).toHaveLength(0);
    expect(questions[0].answer).toBe('have been running');
    expect(questions[0].type).toBe('subjective');
  });
});
