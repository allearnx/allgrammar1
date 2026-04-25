-- ============================================================
-- 075: SEO 블로그 게시판 (blog_posts)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  excerpt          TEXT NOT NULL DEFAULT '',
  content          TEXT NOT NULL DEFAULT '',
  thumbnail_url    TEXT,
  category         TEXT NOT NULL DEFAULT 'general'
                     CHECK (category IN ('grammar_tip', 'study_method', 'exam_prep', 'news', 'general')),
  meta_title       TEXT,
  meta_description TEXT,
  is_published     BOOLEAN NOT NULL DEFAULT false,
  published_at     TIMESTAMPTZ,
  author_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  view_count       INTEGER NOT NULL DEFAULT 0,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Boss: full CRUD
CREATE POLICY "boss_manage_blog_posts" ON public.blog_posts
  FOR ALL TO authenticated
  USING  (get_my_role() = 'boss')
  WITH CHECK (get_my_role() = 'boss');

-- Public: read published posts (anon + authenticated)
CREATE POLICY "public_read_published_blog_posts" ON public.blog_posts
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- ── Indexes ──
CREATE INDEX idx_blog_posts_published ON public.blog_posts (is_published, published_at DESC);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts (slug);
CREATE INDEX idx_blog_posts_category ON public.blog_posts (category) WHERE is_published = true;

-- ── View count increment function ──
CREATE OR REPLACE FUNCTION public.increment_blog_view(post_slug TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE blog_posts SET view_count = view_count + 1 WHERE slug = post_slug AND is_published = true;
$$;
