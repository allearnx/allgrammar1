-- ============================================================
-- 089: 블로그 글 첨부파일 (PDF 등)
-- ============================================================
-- 각 항목: { "name": 파일명, "url": 공개 URL, "size": 바이트 }
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;
