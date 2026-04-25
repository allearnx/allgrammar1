import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BlogPostSummary } from '@/types/blog';
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

  const { data } = await admin
    .from('blog_posts')
    .select('id, slug, title, excerpt, thumbnail_url, category, published_at, view_count')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false });

  const posts: BlogPostSummary[] = (data || []) as BlogPostSummary[];

  return <BlogList initialPosts={posts} />;
}
