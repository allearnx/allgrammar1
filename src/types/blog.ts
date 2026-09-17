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

/** 블로그 글 첨부파일 (PDF 등) */
export interface BlogAttachment {
  name: string;
  url: string;
  size: number;
}

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
  attachments: BlogAttachment[];
  created_at: string;
  updated_at: string;
}

/** 블로그 목록 카드 공용 항목 — 자체 글(site) + 네이버 블로그 글(naver) */
export type BlogFeedItem =
  | { source: 'site'; post: BlogPostSummary; publishedAt: string }
  | {
      source: 'naver';
      id: string;
      title: string;
      link: string;
      excerpt: string;
      thumbnailUrl: string | null;
      category: string;
      publishedAt: string;
    };
