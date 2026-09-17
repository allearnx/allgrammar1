import Link from 'next/link';
import Image from 'next/image';
import type { BlogPostSummary, BlogFeedItem } from '@/types/blog';
import { BLOG_CATEGORY_LABELS } from '@/types/blog';
import { NaverPostPoster } from './naver-post-poster';

interface BlogCardProps {
  /** 목록 카드 — 자체 글 + 네이버 글 공용 */
  item?: BlogFeedItem;
  /** 관련 글 등 자체 글만 넘기는 기존 호출부 호환 */
  post?: BlogPostSummary;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

const cardClass =
  'group block bg-white rounded-2xl border border-[#E8EAED] overflow-hidden shadow-[0_4px_14px_rgba(31,31,31,0.05)] hover:shadow-[0_10px_28px_rgba(31,31,31,0.1)] hover:border-[#1A73E8]/30 transition-all';

function Placeholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg className="w-12 h-12 text-[#AECBFA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
        />
      </svg>
    </div>
  );
}

export default function BlogCard({ item, post }: BlogCardProps) {
  const resolved: BlogFeedItem | null = item ?? (post ? { source: 'site', post, publishedAt: post.published_at || '' } : null);
  if (!resolved) return null;

  // ── 네이버 블로그 글: 외부 링크 + 생성 포스터 썸네일 ──
  // RSS 썸네일은 인스타 정사각형이라 16:9에서 글자가 잘려 쓰지 않는다 (naver-post-poster 참고)
  if (resolved.source === 'naver') {
    return (
      <a href={resolved.link} target="_blank" rel="noopener noreferrer" className={cardClass}>
        <div className="relative aspect-[16/9] overflow-hidden">
          <NaverPostPoster title={resolved.title} category={resolved.category} />
        </div>
        <div className="p-5">
          <p className="text-sm text-[#3C4043] line-clamp-3 mb-3 leading-relaxed">{resolved.excerpt}</p>
          <div className="flex items-center justify-between text-xs text-[#9AA0A6]">
            <time>{formatDate(resolved.publishedAt)}</time>
            <span className="group-hover:text-[#1A73E8] transition-colors">네이버에서 읽기 →</span>
          </div>
        </div>
      </a>
    );
  }

  // ── 자체 글 ──
  const p = resolved.post;
  return (
    <Link href={`/blog/${p.slug}`} className={cardClass}>
      <div className="relative aspect-[16/9] overflow-hidden bg-[#E8F0FE]">
        {p.thumbnail_url ? (
          <Image
            src={p.thumbnail_url}
            alt={p.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <Placeholder />
        )}
      </div>
      <div className="p-5">
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F0FE] text-[#174EA6] mb-3">
          {BLOG_CATEGORY_LABELS[p.category]}
        </span>
        <h3 className="text-lg font-bold text-[#1F1F1F] line-clamp-2 mb-2 group-hover:text-[#1A73E8] transition-colors">
          {p.title}
        </h3>
        <p className="text-sm text-[#5F6368] line-clamp-2 mb-3 leading-relaxed">{p.excerpt}</p>
        <div className="flex items-center justify-between text-xs text-[#9AA0A6]">
          <time>{formatDate(p.published_at)}</time>
          <span>조회 {p.view_count.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
}
