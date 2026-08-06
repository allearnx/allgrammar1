import { describe, it, expect, beforeAll } from 'vitest';

// 토큰 서명 키는 env에서 읽는다 — import 전에 스텁 (getKey는 첫 호출 시점에 읽음)
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-secret-for-diagnostic-typing';

import { buildTypingHint, isTypeableFront } from '@/lib/voca/diagnostic-hint';
import {
  normalizeTypedAnswer,
  signDiagnosticToken,
  verifyRounds,
} from '@/lib/voca/diagnostic-token';

describe('buildTypingHint — 첫 글자 + 밑줄 마스킹', () => {
  it('단일 단어는 첫 글자만 남긴다', () => {
    expect(buildTypingHint('puppy')).toBe('p____');
    expect(buildTypingHint('dog')).toBe('d__');
  });

  it('구동사는 단어별로 첫 글자를 남긴다', () => {
    expect(buildTypingHint('watch out for')).toBe('w____ o__ f__');
  });

  it('아포스트로피·하이픈은 그대로 노출', () => {
    expect(buildTypingHint("don't")).toBe("d__'_");
    expect(buildTypingHint('ice-cream')).toBe('i__-_____');
  });
});

describe('normalizeTypedAnswer', () => {
  it('대소문자·양끝 공백·끝 문장부호 무시', () => {
    expect(normalizeTypedAnswer(' Dog. ')).toBe('dog');
    expect(normalizeTypedAnswer('PUPPY!')).toBe('puppy');
  });

  it('연속 공백은 하나로', () => {
    expect(normalizeTypedAnswer('watch  out   for')).toBe('watch out for');
  });

  it('아이폰 스마트 아포스트로피(’)를 직선(\')으로 접는다 — 출제 풀 실사례', () => {
    expect(normalizeTypedAnswer('do one’s best')).toBe(normalizeTypedAnswer("do one's best"));
    expect(normalizeTypedAnswer('don’t')).toBe("don't");
  });

  it('엔대시·특수 공백도 ASCII로 통일 (보카 공용 normalizeTyped 계승)', () => {
    expect(normalizeTypedAnswer('part–time')).toBe('part-time');
    expect(normalizeTypedAnswer('ice cream')).toBe('ice cream');
  });
});

describe('isTypeableFront — 타이핑 출제 가능 판별 (단일 단어만)', () => {
  it('단일 단어·하이픈 복합어는 허용', () => {
    expect(isTypeableFront('puppy')).toBe(true);
    expect(isTypeableFront('part-time')).toBe(true);
    expect(isTypeableFront("don't")).toBe(true);
  });

  it('숙어·구동사(공백 포함)는 제외 — 사장님 지시 (스펠링 시험은 단어만)', () => {
    expect(isTypeableFront('watch out for')).toBe(false);
    expect(isTypeableFront("do one's best")).toBe(false);
    expect(isTypeableFront('be used to -ing')).toBe(false);
  });

  it('문법 패턴 표기는 제외 — 단어가 아니라 철자 입력 불가', () => {
    expect(isTypeableFront('v-ing')).toBe(false);
  });

  it('슬래시·물결 등 변칙 표기는 제외', () => {
    expect(isTypeableFront('give ~ a hand')).toBe(false);
    expect(isTypeableFront('spend (돈) on')).toBe(false);
  });
});

describe('verifyRounds — 타이핑 채점', () => {
  let token: string;

  beforeAll(async () => {
    token = await signDiagnosticToken({ v: 'vocab-1', f: 'puppy', b: '강아지', band: 'L0' });
  });

  it('정규화 일치면 correct, 불일치면 wrong', async () => {
    const ok = await verifyRounds([[{ token, typed: ' Puppy ' }]]);
    expect(ok?.[0].items[0].result).toBe('correct');

    const token2 = await signDiagnosticToken({ v: 'vocab-2', f: 'puppy', b: '강아지', band: 'L0' });
    const bad = await verifyRounds([[{ token: token2, typed: 'poppy' }]]);
    expect(bad?.[0].items[0].result).toBe('wrong');
  });

  it('null·빈 문자열은 unknown (모르겠어요)', async () => {
    const t1 = await signDiagnosticToken({ v: 'vocab-3', f: 'puppy', b: '강아지', band: 'L0' });
    const t2 = await signDiagnosticToken({ v: 'vocab-4', f: 'puppy', b: '강아지', band: 'L0' });
    const res = await verifyRounds([[{ token: t1, typed: null }, { token: t2, typed: '   ' }]]);
    expect(res?.[0].items.map((i) => i.result)).toEqual(['unknown', 'unknown']);
  });

  it('구 4지선다 형식(chosenIndex)도 유예 기간 동안 채점된다', async () => {
    const legacy = await signDiagnosticToken({ v: 'vocab-5', f: 'puppy', b: '강아지', c: 2, band: 'L0' });
    const hit = await verifyRounds([[{ token: legacy, chosenIndex: 2 }]]);
    expect(hit?.[0].items[0].result).toBe('correct');

    const legacy2 = await signDiagnosticToken({ v: 'vocab-6', f: 'puppy', b: '강아지', c: 2, band: 'L0' });
    const miss = await verifyRounds([[{ token: legacy2, chosenIndex: 0 }]]);
    expect(miss?.[0].items[0].result).toBe('wrong');
  });

  it('위조 토큰은 라운드 전체 거부', async () => {
    expect(await verifyRounds([[{ token: 'garbage.token', typed: 'puppy' }]])).toBeNull();
  });
});
