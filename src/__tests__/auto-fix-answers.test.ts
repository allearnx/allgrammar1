import { describe, it, expect } from 'vitest';
import { autoFixAnswers } from '@/lib/validation/problem-validator';
import type { NaesinProblemQuestion } from '@/types/naesin';

function mcq(overrides: Partial<NaesinProblemQuestion> = {}): NaesinProblemQuestion {
  return {
    number: 1,
    question: 'Test question',
    options: ['opt1', 'opt2', 'opt3', 'opt4', 'opt5'],
    answer: '1',
    explanation: '',
    ...overrides,
  };
}

describe('autoFixAnswers', () => {
  // ── "따라서 N번" 패턴 ──

  it('해설에 "따라서 3번"이 있고 answer가 "2"이면 "3"으로 교정한다', () => {
    const q = mcq({ answer: '2', explanation: '따라서 3번이 정답이다.' });
    const { questions, fixCount } = autoFixAnswers([q]);
    expect(questions[0].answer).toBe('3');
    expect(fixCount).toBe(1);
  });

  it('"따라서 N번째"는 무시한다 (단어 위치를 말하는 것)', () => {
    const q = mcq({ answer: '2', explanation: '따라서 3번째 단어가 중요하다.' });
    const { questions, fixCount } = autoFixAnswers([q]);
    expect(questions[0].answer).toBe('2');
    expect(fixCount).toBe(0);
  });

  // ── "정답은 ①" 패턴 ──

  it('해설에 "정답은 ③"이 있고 answer가 "1"이면 "3"으로 교정한다', () => {
    const q = mcq({ answer: '1', explanation: '정답은 ③이다.' });
    const { questions, fixCount } = autoFixAnswers([q]);
    expect(questions[0].answer).toBe('3');
    expect(fixCount).toBe(1);
  });

  it('해설에 "정답이 ④"가 있으면 교정한다', () => {
    const q = mcq({ answer: '2', explanation: '정답이 ④이다.' });
    const { questions, fixCount } = autoFixAnswers([q]);
    expect(questions[0].answer).toBe('4');
    expect(fixCount).toBe(1);
  });

  // ── "정답은 N번" 패턴 ──

  it('해설에 "정답은 5번"이 있고 answer가 "3"이면 "5"로 교정한다', () => {
    const q = mcq({ answer: '3', explanation: '정답은 5번이다.' });
    const { questions, fixCount } = autoFixAnswers([q]);
    expect(questions[0].answer).toBe('5');
    expect(fixCount).toBe(1);
  });

  // ── 보기 텍스트 매칭 패턴 ──

  it('해설에서 보기 텍스트를 정답으로 언급하면 교정한다', () => {
    const q = mcq({
      options: ['to play', 'to playing', 'for play', 'to played', 'for playing'],
      answer: '3',
      explanation: 'to play가 정답이다. decide는 to부정사를 취한다.',
    });
    const { questions, fixCount } = autoFixAnswers([q]);
    expect(questions[0].answer).toBe('1');
    expect(fixCount).toBe(1);
  });

  // ── 교정 불필요 ──

  it('answer와 해설이 일치하면 교정하지 않는다', () => {
    const q = mcq({ answer: '3', explanation: '따라서 3번이 정답이다.' });
    const { questions, fixCount } = autoFixAnswers([q]);
    expect(questions[0].answer).toBe('3');
    expect(fixCount).toBe(0);
  });

  it('해설에서 정답 번호를 추론할 수 없으면 교정하지 않는다', () => {
    const q = mcq({ answer: '2', explanation: '문법적으로 올바른 표현이다.' });
    const { questions, fixCount } = autoFixAnswers([q]);
    expect(questions[0].answer).toBe('2');
    expect(fixCount).toBe(0);
  });

  // ── 서술형은 무시 ──

  it('서술형(options 없음)은 교정하지 않는다', () => {
    const q: NaesinProblemQuestion = {
      number: 1,
      question: '영작하시오.',
      options: null as unknown as string[],
      answer: 'I decided to study',
      explanation: '정답은 3번',
    };
    const { questions, fixCount } = autoFixAnswers([q]);
    expect(questions[0].answer).toBe('I decided to study');
    expect(fixCount).toBe(0);
  });

  // ── 유효하지 않은 추론 번호는 무시 ──

  it('추론된 번호가 options 범위 밖이면 교정하지 않는다', () => {
    const q = mcq({ answer: '2', explanation: '따라서 8번이 정답이다.' });
    const { questions, fixCount } = autoFixAnswers([q]);
    expect(questions[0].answer).toBe('2');
    expect(fixCount).toBe(0);
  });

  // ── 여러 문제 동시 교정 ──

  it('여러 문제에서 필요한 것만 교정한다', () => {
    const qs = [
      mcq({ number: 1, answer: '2', explanation: '따라서 3번이 정답.' }),
      mcq({ number: 2, answer: '4', explanation: '문법적으로 올바르다.' }),
      mcq({ number: 3, answer: '1', explanation: '정답은 ⑤이다.' }),
    ];
    const { questions, fixCount } = autoFixAnswers(qs);
    expect(questions[0].answer).toBe('3');
    expect(questions[1].answer).toBe('4'); // 변경 없음
    expect(questions[2].answer).toBe('5');
    expect(fixCount).toBe(2);
  });
});
