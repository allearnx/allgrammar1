import { describe, it, expect } from 'vitest';
import { meaningTokens, hasMeaningOverlap } from '@/lib/voca/meaning-overlap';

describe('meaning-overlap', () => {
  it('품사 태그·구두점을 걷어내고 토큰으로 분해한다', () => {
    const tokens = meaningTokens('[동] 새끼를 낳다, 기르다  [명] 품종');
    expect(tokens.has('기르다')).toBe(true);
    expect(tokens.has('품종')).toBe(true);
    expect(tokens.has('[동]')).toBe(false);
  });

  it('실사례: bred ↔ bring up ↔ nurture 뜻 겹침을 잡는다', () => {
    const bred = '[동] 새끼를 낳다, 기르다  [명] 품종';
    const bringUp = '~을 기르다, 양육하다';
    const nurture = '[동] 양육하다, 키우다';
    expect(hasMeaningOverlap(bred, bringUp)).toBe(true);      // 기르다 공유
    expect(hasMeaningOverlap(nurture, bringUp)).toBe(true);   // 양육하다 공유
  });

  it('조사 접두(~을)를 제거하고 비교한다', () => {
    expect(hasMeaningOverlap('기르다, 양육하다', '~을 기르다')).toBe(true);
  });

  it('뜻이 다른 단어는 겹침으로 판정하지 않는다', () => {
    expect(hasMeaningOverlap('[명] 배우자, 남편, 아내', '[명] 장례식')).toBe(false);
    expect(hasMeaningOverlap('[동] 축하하다, 기념하다', '[명] 기념일')).toBe(false); // 기념하다≠기념일
    expect(hasMeaningOverlap('[형] 탁아소의, 보육의', '[형] 임신한')).toBe(false);
  });

  it('빈 문자열·태그만 있는 뜻은 겹침 없음', () => {
    expect(hasMeaningOverlap('', '기르다')).toBe(false);
    expect(hasMeaningOverlap('[동]', '[동] 기르다')).toBe(false);
  });

  it('한 글자 뜻도 겹침으로 잡는다 (초등 어휘)', () => {
    // 교육부 초등 800에서 실제로 한 Day에 모이는 조합
    expect(hasMeaningOverlap('큰', '큰, 넓은')).toBe(true);       // big ↔ large
    expect(hasMeaningOverlap('큰', '큰, 거대한')).toBe(true);      // big ↔ great
    expect(hasMeaningOverlap('큰', '(키가) 큰, 높은')).toBe(true);  // big ↔ tall
    expect(hasMeaningOverlap('길', '길, 선로')).toBe(true);        // road ↔ track
    expect(hasMeaningOverlap('배', '배')).toBe(true);             // ship ↔ boat
    expect(hasMeaningOverlap('집', '집, 가정')).toBe(true);        // house ↔ home
    expect(hasMeaningOverlap('땅', '땅, 기초')).toBe(true);        // land ↔ ground
  });

  it('한 글자 뜻이라도 다르면 겹치지 않는다', () => {
    expect(hasMeaningOverlap('눈', '코')).toBe(false);
    expect(hasMeaningOverlap('손', '발')).toBe(false);
    expect(hasMeaningOverlap('큰', '작은')).toBe(false);
    expect(hasMeaningOverlap('새', '새로운')).toBe(false);   // bird ↔ new: 토큰이 다름
  });

  it('영영 교재: 영문 한 글자(관사 a)는 겹침으로 잡지 않는다', () => {
    // Vocabulary Workshop B는 뜻이 영어 정의라 "a"까지 토큰이 되면 전부 겹쳐버린다
    const brood = 'a family of young animals, especially birds';
    const drone = 'a loafer, idler; a buzzing sound';
    expect(hasMeaningOverlap(brood, drone)).toBe(false);
    expect(meaningTokens(brood).has('a')).toBe(false);
  });

  it('홀로 선 조사 토큰은 무시된다', () => {
    expect(meaningTokens('~이 되다').has('이')).toBe(false);
    expect(hasMeaningOverlap('~이 되다', '~을 하다')).toBe(false);
    expect(hasMeaningOverlap('~와 닮다', '~와 연락하다')).toBe(false); // "와"로 겹치면 안 됨
    expect(hasMeaningOverlap('~에 달려있다', '~에 집중하다')).toBe(false);
  });

  it('조사로 시작하는 진짜 단어를 깎지 않는다', () => {
    // 접두 제거 방식이면 가방→방, 가족→족, 은행→행이 되어 엉뚱하게 겹친다
    expect(meaningTokens('가방').has('가방')).toBe(true);
    expect(hasMeaningOverlap('가방', '방')).toBe(false);      // bag ↔ room
    expect(hasMeaningOverlap('가족', '족')).toBe(false);
    expect(hasMeaningOverlap('은행', '행')).toBe(false);
  });

  it('"가장" 같은 수식어를 공유하면 겹침으로 잡는다 (의도된 과잉 제외)', () => {
    // finest ↔ simplest는 유의어가 아니지만 "가장"을 공유해 보기에서 빠진다.
    // 보기가 3개 미만이면 겹치는 것으로 채우는 폴백이 있어 과잉 제외는 안전한 쪽이다.
    expect(hasMeaningOverlap('가장 훌륭한', '가장 간단한')).toBe(true);
  });
});
