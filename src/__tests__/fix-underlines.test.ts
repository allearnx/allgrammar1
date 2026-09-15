import { describe, it, expect } from 'vitest';
import { convertMarkers, fixMissingUnderline, hasMissingUnderline } from '@/lib/naesin/fix-underlines';
import { sanitizeQuestions } from '@/lib/validation/problem-validator';
import type { NaesinProblemQuestion } from '@/types/naesin';

const mcq = (question: string, options: string[], answer = '1', explanation?: string) => ({ number: 1, question, options, answer, explanation });

describe('hasMissingUnderline', () => {
  it('"밑줄 친" + <u> 없음 → 대상', () => {
    expect(hasMissingUnderline(mcq('다음 중 밑줄 친 if의 쓰임이 다른 것은?', ['If you go, I go.']))).toBe(true);
  });
  it('보기에 <u>가 있으면 대상 아님', () => {
    expect(hasMissingUnderline(mcq('다음 중 밑줄 친 if의 쓰임이 다른 것은?', ['<u>If</u> you go, I go.']))).toBe(false);
  });
  it('"밑줄 친"이 없으면 대상 아님', () => {
    expect(hasMissingUnderline(mcq('다음 중 어법상 어색한 것은?', ['He go home.']))).toBe(false);
  });
});

describe('convertMarkers (a)', () => {
  it('*…* / **…** / _…_ / __…__ → <u>', () => {
    expect(convertMarkers('Emily is a girl *who* comes from Italy.')).toBe('Emily is a girl <u>who</u> comes from Italy.');
    expect(convertMarkers('You **don\'t have to** take this medicine.')).toBe('You <u>don\'t have to</u> take this medicine.');
    expect(convertMarkers('She is the _smartest_ student.')).toBe('She is the <u>smartest</u> student.');
    expect(convertMarkers('I have many places __to visit__ in Europe.')).toBe('I have many places <u>to visit</u> in Europe.');
  });
  it('빈칸 밑줄(_____)은 건드리지 않음', () => {
    expect(convertMarkers('→ We can see _______________.')).toBe('→ We can see _______________.');
  });
});

describe('fixMissingUnderline (b) 규칙 복원', () => {
  it('지시문 명시어: 밑줄 친 if → 보기마다 if 하나씩', () => {
    const q = mcq('[용법 구별] 다음 중 밑줄 친 if의 쓰임이 나머지 넷과 다른 하나는?', [
      '① If you study hard, you will pass the test.',
      '② She will call me if she arrives safely.',
      '③ I wonder if he likes spicy food.',
    ], '3');
    const r = fixMissingUnderline(q, '접속사 if Step 1');
    expect(r.path).toBe('b');
    expect(q.options).toEqual([
      '① <u>If</u> you study hard, you will pass the test.',
      '② She will call me <u>if</u> she arrives safely.',
      '③ I wonder <u>if</u> he likes spicy food.',
    ]);
    expect(q.answer).toBe('3');
  });
  it('to부정사 주제: 보기 문장마다 to+동사 하나씩', () => {
    const q = mcq('다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?', [
      'She has a dress to iron before the party.',
      'I am happy to help you.',
      'He bought a notebook to write in.',
    ], '2');
    expect(fixMissingUnderline(q, 'to부정사의 형용사적 용법 Step2').path).toBe('b');
    expect(q.options![0]).toBe('She has a dress <u>to iron</u> before the party.');
    expect(q.options![1]).toBe('I am happy <u>to help</u> you.');
  });
  it('<보기> 밑줄어(활용형 포함)를 보기 문장에 전파', () => {
    const q = mcq('다음 <보기>의 밑줄 친 부분과 의미가 같은 것은?\n\n<보기> The smell of food *made* me hungry.', [
      'She made us all coffee.',
      'I make my own clothes.',
      'He kept making the same mistake.',
    ], '1');
    const r = fixMissingUnderline(q, 'keep/make/find Step1');
    expect(r.path).toBe('b');
    expect(q.question).toContain('<u>made</u> me hungry');
    expect(q.options).toEqual(['She <u>made</u> us all coffee.', 'I <u>make</u> my own clothes.', 'He kept <u>making</u> the same mistake.']);
  });
  it('후보가 2개인 문장이 있으면 규칙 미적용 (추정 금지)', () => {
    const q = mcq('다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은?\n\n<보기> She needs a partner to practice with.', [
      'I\'m sorry to bother you.',
      'He wants to learn how to swim.',
      'There is no place to park near here.',
    ], '3');
    const r = fixMissingUnderline(q, 'to부정사의 형용사적 용법 Step2');
    expect(r.path).toBe('manual');
    expect(q.options!.some((o) => o.includes('<u>'))).toBe(false);
  });
  it('밑줄 친 우리말 (A): 지문의 한글 문장에 밑줄', () => {
    const q = mcq('[지문]\nThere was a small ceremony. (A) 그 기념식은 우리를 꽤 감정적으로 만들었다. In fact, I cried a little.\n\n다음 글의 밑줄 친 우리말 (A)와 일치하도록 <조건>에 맞춰 영작한 것은?', [
      'The ceremony made quite us emotional.',
      'The ceremony made us quite emotional.',
    ], '2');
    expect(fixMissingUnderline(q).path).toBe('b');
    expect(q.question).toContain('(A) <u>그 기념식은 우리를 꽤 감정적으로 만들었다.</u> In fact');
    expect(q.options!.every((o) => !o.includes('<u>'))).toBe(true);
  });
});

describe('fixMissingUnderline (c) 지시문 재작성', () => {
  it('ⓐ~ⓔ 마커가 지문에 있으면 "밑줄 친"만 제거', () => {
    const q = mcq('다음 글의 밑줄 친 ⓐ~ⓔ 중, 어법상 적절하지 않은 것은?\n\nJisu ⓐgave a gift. She ⓑlouder said ⓒwhat it was. ⓓTo use ⓔdifferent words.', ['ⓐ', 'ⓑ', 'ⓒ', 'ⓓ', 'ⓔ'], '3');
    expect(fixMissingUnderline(q).path).toBe('c');
    expect(q.question.startsWith('다음 글의 ⓐ~ⓔ 중, 어법상 적절하지 않은 것은?')).toBe(true);
  });
  it('문장 단위 어법 판단은 "다음 중 어법상 …"으로', () => {
    const q = mcq('다음 밑줄 친 부분 중 어법상 어색한 것은?', [
      'I don\'t know who ate the last piece of cake.',
      'Do you know what did she have for lunch?',
      'Can you tell me where the restroom is?',
    ], '2');
    expect(fixMissingUnderline(q, '간접의문문 Step 2').path).toBe('c');
    expect(q.question).toBe('다음 중 어법상 어색한 것은?');
  });
  it('복원·재작성 모두 불가하면 manual, 문항 원문 유지', () => {
    const q = mcq('다음 중 밑줄 친 부분의 우리말 뜻이 어색한 것은?', [
      'She changed her attitude. - 태도',
      'He quit piano lessons. - 그만두었다',
      'Are you interested in this book? - 관심을 끄는',
    ], '3');
    const before = JSON.stringify(q);
    expect(fixMissingUnderline(q).path).toBe('manual');
    expect(JSON.stringify(q)).toBe(before);
  });
});

describe('sanitizeQuestions Rule 12 (저장 시 자동 보정)', () => {
  it('새로 저장되는 문항의 별표 마커를 <u>로 바꾸고 정답은 그대로', () => {
    const qs: NaesinProblemQuestion[] = [
      { number: 1, question: '다음 중 밑줄 친 부분의 쓰임이 다른 하나는?', options: ['Emily is a girl *who* comes from Italy.', 'Andy is the boy *who* I met in Canada.'], answer: '2' },
      { number: 2, question: '다음 중 어법상 어색한 것은?', options: ['He go home.', 'He goes home.'], answer: '1' },
    ];
    const { questions, answerKey } = sanitizeQuestions(qs, undefined, { title: '목적격 관계대명사 Step1' });
    expect(questions[0].options).toEqual(['Emily is a girl <u>who</u> comes from Italy.', 'Andy is the boy <u>who</u> I met in Canada.']);
    expect(questions[1].options).toEqual(['He go home.', 'He goes home.']);
    expect(answerKey).toEqual(['2', '1']);
  });
});
