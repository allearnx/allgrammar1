import { describe, it, expect } from 'vitest';
import { ensureUniqueSlug } from '@/lib/blog/unique-slug';

/** blog_posts 조회만 흉내내는 최소 스텁 */
function fakeClient(rows: { id: string; slug: string }[]) {
  return {
    from() {
      const state: { excludeId?: string } = {};
      const builder = {
        select() { return builder; },
        or(expr: string) {
          const base = expr.match(/slug\.eq\.([^,]+)/)![1];
          builder._rows = rows.filter((r) => r.slug === base || r.slug.startsWith(`${base}-`));
          return builder;
        },
        neq(_col: string, id: string) { state.excludeId = id; return builder; },
        _rows: [] as { id: string; slug: string }[],
        then(resolve: (v: { data: { slug: string }[]; error: null }) => unknown) {
          const data = builder._rows.filter((r) => r.id !== state.excludeId).map((r) => ({ slug: r.slug }));
          return Promise.resolve(resolve({ data, error: null }));
        },
      };
      return builder;
    },
  } as never;
}

describe('ensureUniqueSlug', () => {
  const rows = [
    { id: 'a', slug: '1-5-6' },
    { id: 'b', slug: 'guide' },
    { id: 'c', slug: 'guide-2' },
  ];
  it('안 겹치면 그대로', async () => {
    expect(await ensureUniqueSlug(fakeClient(rows), 'new-post')).toBe('new-post');
  });
  it('겹치면 -2를 붙이고, 그것도 차 있으면 -3', async () => {
    expect(await ensureUniqueSlug(fakeClient(rows), 'guide')).toBe('guide-3');
  });
  it('숫자로 끝나는 슬러그의 끝자리를 자르지 않는다', async () => {
    expect(await ensureUniqueSlug(fakeClient(rows), '1-5-6')).toBe('1-5-6-2');
  });
  it('수정 중인 글 자신은 충돌로 보지 않는다', async () => {
    expect(await ensureUniqueSlug(fakeClient(rows), 'guide', 'b')).toBe('guide');
  });
});
