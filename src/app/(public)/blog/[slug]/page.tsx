import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BlogPost, BlogPostSummary } from '@/types/blog';
import { BLOG_CATEGORY_LABELS } from '@/types/blog';
import BlogArticle from '@/components/public/blog-article';
import BlogCard from '@/components/public/blog-card';

const BASE_URL = 'https://www.allrounderenglish.co.kr';
const SUMMARY_FIELDS = 'id, slug, title, excerpt, thumbnail_url, category, published_at, view_count' as const;

type Props = {
  params: Promise<{ slug: string }>;
};

const getPost = cache(async (slug: string): Promise<BlogPost | null> => {
  const admin = createAdminClient();
  const { data } = await admin
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  return data as BlogPost | null;
});

async function getRelatedPosts(
  category: string,
  excludeId: string,
): Promise<BlogPostSummary[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('blog_posts')
    .select(SUMMARY_FIELDS)
    .eq('is_published', true)
    .eq('category', category)
    .neq('id', excludeId)
    .order('published_at', { ascending: false })
    .limit(3);
  return (data || []) as BlogPostSummary[];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: '글을 찾을 수 없습니다 | 올라영' };
  }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    alternates: {
      canonical: `${BASE_URL}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      url: `${BASE_URL}/blog/${post.slug}`,
      siteName: '올라영',
      locale: 'ko_KR',
      type: 'article',
      publishedTime: post.published_at || undefined,
      ...(post.thumbnail_url ? { images: [{ url: post.thumbnail_url }] } : {}),
    },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post.category, post.id);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Organization',
      name: '올라영',
    },
    publisher: {
      '@type': 'Organization',
      name: '올라영',
      url: BASE_URL,
    },
    description: post.excerpt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/blog/${post.slug}`,
    },
    ...(post.thumbnail_url
      ? { image: post.thumbnail_url }
      : {}),
  };

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 히어로 / 메타 정보 */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-violet-50 to-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              블로그 목록
            </Link>
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 mb-4">
            {BLOG_CATEGORY_LABELS[post.category]}
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-800 leading-tight mb-4">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-lg text-slate-500 leading-relaxed mb-4">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-slate-400">
            {formattedDate && <time>{formattedDate}</time>}
            <span>조회 {post.view_count.toLocaleString()}</span>
          </div>
        </div>
      </section>

      {/* 본문 */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <BlogArticle content={post.content} slug={post.slug} />
      </section>

      {/* 관련 글 */}
      {relatedPosts.length > 0 && (
        <section className="bg-slate-50 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">
              관련 글
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <BlogCard key={related.id} post={related} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 블로그 목록으로 돌아가기 */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium bg-white text-violet-600 border border-violet-200 hover:bg-violet-50 hover:border-violet-300 transition-all shadow-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            블로그 목록으로 돌아가기
          </Link>
        </div>
      </section>
    </>
  );
}
