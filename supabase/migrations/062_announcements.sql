-- ============================================================
-- 062: 공지사항 시스템 (announcements + announcement_reads)
-- ============================================================

-- ── announcements ──
CREATE TABLE IF NOT EXISTS public.announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  type        TEXT NOT NULL DEFAULT 'info'
                CHECK (type IN ('info', 'warning', 'important')),
  target_roles TEXT[] NOT NULL DEFAULT '{admin,teacher}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Boss: full CRUD
CREATE POLICY "boss_manage_announcements" ON public.announcements
  FOR ALL TO authenticated
  USING  (get_my_role() = 'boss')
  WITH CHECK (get_my_role() = 'boss');

-- Admin/Teacher: read published only, where their role is in target_roles
CREATE POLICY "staff_read_published_announcements" ON public.announcements
  FOR SELECT TO authenticated
  USING (
    is_published = true
    AND get_my_role() = ANY(target_roles)
  );

-- ── announcement_reads ──
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);

ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own reads
CREATE POLICY "own_reads_select" ON public.announcement_reads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "own_reads_insert" ON public.announcement_reads
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ── Indexes ──
CREATE INDEX idx_announcements_published ON public.announcements (is_published, published_at DESC);
CREATE INDEX idx_announcement_reads_user ON public.announcement_reads (user_id);
