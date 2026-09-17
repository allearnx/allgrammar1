import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BlogPostSummary, BlogFeedItem } from '@/types/blog';
import { getNaverBlogPosts } from '@/lib/naver-blog-rss';
import { BlogList } from './blog-list';

export const metadata: Metadata = {
  title: '블로그 | 올라영',
  description:
    '영어 문법 팁, 학습법, 시험 대비 전략 등 유용한 영어 학습 정보를 제공합니다.',
  alternates: {
    canonical: 'https://www.allrounderenglish.co.kr/blog',
  },
  openGraph: {
    title: '블로그 | 올라영',
    description: '영어 문법 팁, 학습법, 시험 대비 전략',
    url: 'https://www.allrounderenglish.co.kr/blog',
    siteName: '올라영',
    locale: 'ko_KR',
    type: 'website',
  },
};

export default async function BlogPage() {
  const admin = createAdminClient();

  const [{ data }, naverPosts] = await Promise.all([
    admin
      .from('blog_posts')
      .select('id, slug, title, excerpt, thumbnail_url, category, published_at, view_count')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('published_at', { ascending: false }),
    getNaverBlogPosts(),
  ]);

  const sitePosts: BlogPostSummary[] = (data || []) as BlogPostSummary[];

  // 자체 글 + 네이버 글을 한 목록으로 — 최신순
  const items: BlogFeedItem[] = [
    ...sitePosts.map((post): BlogFeedItem => ({
      source: 'site',
      post,
      publishedAt: post.published_at || '',
    })),
    ...naverPosts.map((p): BlogFeedItem => ({ source: 'naver', ...p })),
  ].sort((a, b) => (b.publishedAt > a.publishedAt ? 1 : b.publishedAt < a.publishedAt ? -1 : 0));

  return <BlogList items={items} />;
}
