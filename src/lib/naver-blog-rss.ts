import { cached } from '@/lib/cache/server-cache';
import { logger } from '@/lib/logger';

/**
 * 네이버 블로그(allrounder_eng) RSS → 홈페이지 블로그 목록 카드용 요약.
 *
 * 글은 네이버에만 쓰고 홈페이지는 썸네일·제목·요약 카드로 노출, 클릭 시 네이버로 이동
 * (2026-09-17 사장님 결정 — 학부모 검색 유입은 네이버라 글의 본체를 네이버에 둔다).
 *
 * 썸네일(blogthumb.pstatic.net)은 Referer가 붙으면 403 → <img referrerPolicy="no-referrer">로 표시.
 */

export const NAVER_BLOG_ID = 'allrounder_eng';
export const NAVER_BLOG_URL = `https://blog.naver.com/${NAVER_BLOG_ID}`;
const RSS_URL = `https://rss.blog.naver.com/${NAVER_BLOG_ID}.xml`;

export interface NaverBlogPost {
  id: string;
  title: string;
  link: string;
  excerpt: string;
  thumbnailUrl: string | null;
  category: string;
  publishedAt: string; // ISO
}

function tag(name: string, xml: string): string | null {
  const m = xml.match(new RegExp(`<${name}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`));
  return m ? m[1].trim() : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** 네이버 링크의 RSS 추적 파라미터(?fromRss=true&trackingCode=rss) 제거 */
function cleanLink(link: string): string {
  try {
    const u = new URL(link);
    u.search = '';
    return u.toString();
  } catch {
    return link;
  }
}

export function parseNaverRss(xml: string): NaverBlogPost[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  const posts: NaverBlogPost[] = [];
  for (const item of items) {
    const title = tag('title', item);
    const rawLink = tag('link', item);
    const pubDate = tag('pubDate', item);
    if (!title || !rawLink || !pubDate) continue;

    const link = cleanLink(rawLink);
    const description = tag('description', item) || '';
    const img = description.match(/<img[^>]+src="([^"]+)"/);
    const idMatch = link.match(/\/(\d+)\/?$/);

    posts.push({
      id: `naver-${idMatch ? idMatch[1] : link}`,
      title: decodeEntities(title),
      link,
      excerpt: stripHtml(description).slice(0, 160),
      thumbnailUrl: img ? img[1] : null,
      category: tag('category', item) || '',
      publishedAt: new Date(pubDate).toISOString(),
    });
  }
  return posts;
}

async function fetchNaverBlogPosts(): Promise<NaverBlogPost[]> {
  try {
    const res = await fetch(RSS_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; allrounderenglish-blog/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      logger.warn('naver_rss.fetch_failed', { status: res.status });
      return [];
    }
    return parseNaverRss(await res.text());
  } catch (err) {
    // 네이버 장애·타임아웃에 홈페이지 블로그가 같이 죽지 않도록 빈 목록으로
    logger.warn('naver_rss.fetch_error', { error: err instanceof Error ? err.message : String(err) });
    return [];
  }
}

/** 네이버 블로그 최신 글 (10분 캐시 — RSS는 50개까지만 제공) */
export const getNaverBlogPosts = cached(fetchNaverBlogPosts, 'naver-blog-rss', 600);
