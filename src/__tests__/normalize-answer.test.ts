import { describe, it, expect } from 'vitest';
import { normalize, normalizeSeparators, matchMcqAnswer, resolveCorrectIndex, uncircle, matchSubParts, matchFilledBlanks } from '@/lib/naesin/normalize-answer';

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

describe('matchSubParts — 파트별 비교 + 전체 문자열 구분자 무시 폴백', () => {
  const subParts = [{ label: '(1)', answer: 'stay' }, { label: '(2)', answer: 'explain' }];
  const whole = ['stay, explain', 'stay / explain', 'stay, so that, explain'];

  it('파트별 일치면 정답', () => {
    expect(matchSubParts('stay / explain', subParts, whole)).toBe(true);
    expect(matchSubParts('Stay / EXPLAIN.', subParts, whole)).toBe(true);
  });

  it('2번 칸에 so that까지 쓴 답(구분자 혼용)은 인정답안과 구분자 무시로 매칭', () => {
    expect(matchSubParts('stay / so that, explain', subParts, whole)).toBe(true);
    expect(matchSubParts('stay / so that explain', subParts, whole)).toBe(true);
  });

  it('단어가 틀리면 폴백에도 걸리지 않음', () => {
    expect(matchSubParts('stay / so that, record', subParts, whole)).toBe(false);
    expect(matchSubParts('stay', subParts, whole)).toBe(false);
  });

  it('subPart acceptedAnswers도 파트별로 인정', () => {
    const sp = [{ label: '(1)', answer: 'so that', acceptedAnswers: ['in order that'] }, { label: '(2)', answer: 'could' }];
    expect(matchSubParts('in order that / could', sp, [])).toBe(true);
  });
});

describe('matchFilledBlanks — 빈칸을 채운 완전한 문장 인정', () => {
  it('단일 빈칸: 학생이 문장 전체를 쓴 경우 (이동형 과거형 Step2 #9)', () => {
    const q = '다음 괄호 안에 주어진 단어를 이용하여 빈칸을 완성하시오.\nHe ________ an older sister. (not / have)';
    expect(matchFilledBlanks("He doesn't have an older sister.\n", q, "doesn't have", ['does not have'])).toBe(true);
    expect(matchFilledBlanks('He does not have an older sister.', q, "doesn't have")).toBe(true);
    expect(matchFilledBlanks('He has an older sister.', q, "doesn't have")).toBe(false);
  });

  it('문제의 빈칸 없는 문장을 베껴 쓴 부분은 무시하되 빈칸 문장은 틀리면 오답', () => {
    const q = 'I ________ to bed early. I am so sleepy. (go)';
    expect(matchFilledBlanks("I didn't go to bed early. I am so sleepy.", q, "didn't go")).toBe(true);
    expect(matchFilledBlanks('I went to bed early. I am so sleepy.', q, "didn't go")).toBe(false);
    const q2 = "That's not true. We ________ that. (believe)";
    expect(matchFilledBlanks("That's not true. We can't believe that.", q2, "don't believe")).toBe(false);
  });

  it('대화 여러 줄 + subParts (이동형 #22, #24)', () => {
    const q = '다음 <보기>의 단어를 이용하여 대화를 완성하시오.\n<보기> go, enjoy, wake, get, play\n\nA: Where did you go for the vacation?\nB: We ________ to Jejudo.\nA: ________ you ________ it?\nB: Yes, I ________.';
    const sub = [{ answer: 'went' }, { answer: 'Did' }, { answer: 'enjoy' }, { answer: 'did' }];
    expect(matchFilledBlanks('We went to Jejudo. / Did you enjoy it? / Yes, I did.', q, 'went, Did, enjoy, did', [], sub)).toBe(true);
    expect(matchFilledBlanks('We went to Jejudo. Did you enjoy it? Yes, I did.', q, 'went, Did, enjoy, did', [], sub)).toBe(true);
    expect(matchFilledBlanks('We go to Jejudo. / Did you enjoy it? / Yes, I did.', q, 'went, Did, enjoy, did', [], sub)).toBe(false);
    const q24 = 'A: What ________ you ________ yesterday?\nB: I ________ table tennis.\nA: ________ you read any books?\nB: ________, ________ ________.';
    const sub24 = [{ answer: 'did' }, { answer: 'do' }, { answer: 'played' }, { answer: 'Did' }, { answer: 'No' }, { answer: "I didn't", acceptedAnswers: ['I did not'] }];
    expect(matchFilledBlanks(" What did you do yesterday? / I played table tennis. / Did you read any books? / No, I didn't.", q24, "did, do, played, Did, No, I didn't", [], sub24)).toBe(true);
  });

  it('subParts 인정답안이 빈칸 후보에 포함된다 (#23 woke/go)', () => {
    const q = 'A: When ________ you ________ up this morning?\nB: I ________ up at eight.\nA: ________ you ________ to school on time?\nB: No, I ________.';
    const sub = [{ answer: 'did' }, { answer: 'wake' }, { answer: 'got', acceptedAnswers: ['woke'] }, { answer: 'Did' }, { answer: 'get', acceptedAnswers: ['go'] }, { answer: "didn't", acceptedAnswers: ['did not'] }];
    expect(matchFilledBlanks("When did you wake up this morning? / I woke up at eight. / Did you go to school on time? / No, I didn't.", q, 'did, wake, got, Did, get, didn\'t', [], sub)).toBe(true);
  });

  it('한 줄 안에 라벨 붙은 빈칸 여러 개 (이동형 명령문 Step1 #26)', () => {
    const q = "다음은 동물원의 안내문입니다.\n\nWelcome to Wonder World. (A)______ with cute animals. However, (B)______ snacks to the animals. They're not good for the animals. (C)______ in the trash can, please. Have a great time.\n\n※ (A)/(B)/(C)를 앞에서부터 ' / '로 구분해 쓰시오.";
    const sub = [
      { answer: 'Take pictures', acceptedAnswers: ['Enjoy time'] },
      { answer: "Don't give", acceptedAnswers: ["Don't feed"] },
      { answer: 'Put trash', acceptedAnswers: ['Throw trash', 'Throw the trash'] },
    ];
    expect(matchFilledBlanks("take pictures with cute animals. /  However, Don't feed snacks to the animals. / Throw the trash in the trash can, please", q, "Take pictures / Don't give / Put trash", [], sub)).toBe(true);
    expect(matchFilledBlanks("take pictures with cute animals. / However, Don't feed snacks to the animals.", q, "Take pictures / Don't give / Put trash", [], sub)).toBe(false);
  });

  it('빈칸 개수와 답 개수가 안 맞거나 빈칸이 없으면 false', () => {
    expect(matchFilledBlanks('He does not have an older sister.', 'He ________ ________ an older sister.', "doesn't have")).toBe(true); // 인접 빈칸은 하나
    expect(matchFilledBlanks('anything', '다음 문장을 영작하시오.', 'He is tall')).toBe(false);
    expect(matchFilledBlanks("doesn't have", 'He ________ an older sister.', "doesn't have")).toBe(false); // 빈칸만 쓴 답은 다른 규칙 담당
  });
});
