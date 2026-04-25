import Link from 'next/link';
import Image from 'next/image';
import type { BlogPostSummary } from '@/types/blog';
import { BLOG_CATEGORY_LABELS } from '@/types/blog';

interface BlogCardProps {
  post: BlogPostSummary;
}

export default function BlogCard({ post }: BlogCardProps) {
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:border-violet-200 transition-all"
    >
      {/* 썸네일 */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-violet-100 to-purple-50">
        {post.thumbnail_url ? (
          <Image
            src={post.thumbnail_url}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-violet-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="p-5">
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-600 mb-3">
          {BLOG_CATEGORY_LABELS[post.category]}
        </span>

        <h3 className="text-lg font-bold text-slate-800 line-clamp-2 mb-2 group-hover:text-violet-600 transition-colors">
          {post.title}
        </h3>

        <p className="text-sm text-slate-500 line-clamp-2 mb-3 leading-relaxed">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between text-xs text-slate-400">
          {formattedDate && <time>{formattedDate}</time>}
          <span>조회 {post.view_count.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
}
