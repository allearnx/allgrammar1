export type BlogCategory = 'grammar_tip' | 'study_method' | 'exam_prep' | 'news' | 'general';

export const BLOG_CATEGORY_LABELS: Record<BlogCategory, string> = {
  grammar_tip: '문법 팁',
  study_method: '학습법',
  exam_prep: '시험 대비',
  news: '소식',
  general: '일반',
};

export const BLOG_CATEGORIES: BlogCategory[] = [
  'grammar_tip',
  'study_method',
  'exam_prep',
  'news',
  'general',
];

/** Lightweight type for list/card views (no content or SEO fields) */
export type BlogPostSummary = Pick<BlogPost, 'id' | 'slug' | 'title' | 'excerpt' | 'thumbnail_url' | 'category' | 'published_at' | 'view_count'>;

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  thumbnail_url: string | null;
  category: BlogCategory;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  published_at: string | null;
  author_id: string;
  view_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
