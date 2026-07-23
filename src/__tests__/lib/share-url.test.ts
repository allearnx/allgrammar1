import { describe, it, expect } from 'vitest';
import { withShareVersion } from '@/lib/share-url';

describe('withShareVersion — 카톡 캐시 대응 날짜 버전', () => {
  it('쿼리 없는 URL에는 ?v=YYYYMMDD', () => {
    const out = withShareVersion('https://x.kr/parent/abc');
    expect(out).toMatch(/^https:\/\/x\.kr\/parent\/abc\?v=\d{8}$/);
  });

  it('쿼리 있는 URL에는 &v=YYYYMMDD', () => {
    const out = withShareVersion('https://x.kr/parent/abc?tab=voca');
    expect(out).toMatch(/^https:\/\/x\.kr\/parent\/abc\?tab=voca&v=\d{8}$/);
  });

  it('같은 날 두 번 호출하면 같은 URL (재수집 낭비 방지)', () => {
    expect(withShareVersion('https://x.kr/a')).toBe(withShareVersion('https://x.kr/a'));
  });
});
