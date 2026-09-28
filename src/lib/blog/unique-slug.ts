import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 같은 슬러그가 이미 있으면 뒤에 -2, -3 …을 붙여 비어 있는 주소를 돌려준다.
 * blog_posts.slug는 UNIQUE라 중복이면 저장이 통째로 실패하므로(2026-09-22 사장님 신고),
 * 저장 직전에 서버에서 한 번 비켜 준다. 수정 중인 글 자신(excludeId)은 충돌로 보지 않는다.
 */
export async function ensureUniqueSlug(
  supabase: SupabaseClient,
  slug: string,
  excludeId?: string,
): Promise<string> {
  // 접미사를 떼지 않는다 — "1-5-6"처럼 숫자로 끝나는 슬러그의 끝자리를 잘라 먹던 버그
  const base = slug;
  let query = supabase
    .from('blog_posts')
    .select('slug')
    .or(`slug.eq.${base},slug.like.${base}-%`);
  if (excludeId) query = query.neq('id', excludeId);

  const { data, error } = await query;
  if (error) return slug; // 조회 실패 시 원래 슬러그로 시도 (DB 제약이 최종 방어선)

  const taken = new Set((data ?? []).map((r: { slug: string }) => r.slug));
  if (!taken.has(slug)) return slug;

  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}
