/**
 * 제목 → URL 슬러그.
 *
 * 한글을 그냥 버리면 "중1 동아윤 5-6과 …" 같은 제목이 숫자만 남아 "1-5-6"이 되고,
 * 비슷한 제목끼리 같은 슬러그가 나와 저장이 막혔다(blog_posts_slug_key 중복, 2026-09-22).
 * 그래서 한글은 로마자로 옮겨 적는다 — 읽을 수 있고 겹칠 확률도 낮다.
 */

const CHO = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const JUNG = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
const JONG = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'l', 'l', 'l', 'l', 'l', 'l', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];

/** 한글 음절을 로마자로 (개정 로마자 표기법 근사 — 음운 변화는 반영하지 않음) */
export function romanizeKorean(text: string): string {
  let out = '';
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const n = code - 0xac00;
      out += CHO[Math.floor(n / 588)] + JUNG[Math.floor((n % 588) / 28)] + JONG[n % 28];
    } else {
      out += ch;
    }
  }
  return out;
}

export function generateSlug(title: string): string {
  const slug = romanizeKorean(title)
    .toLowerCase()
    .trim()
    // 영문·숫자·공백·하이픈만 남긴다
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    // 주소가 지나치게 길어지지 않게 자른다 (하이픈 경계에서)
    .slice(0, 80)
    .replace(/-[^-]*$/, (m) => (m.length > 20 ? '' : m))
    .replace(/^-|-$/g, '');

  // 로마자로도 아무것도 안 남으면(기호·이모지만 있는 제목) 시각 기반 슬러그
  if (!slug) {
    return `post-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  }

  return slug;
}
