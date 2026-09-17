-- 학원 범위 공지 + 로그인 팝업 (2026-09-17 사장님: "올라영 소속 선생님들에게 팝업으로 띄워줘")
-- academy_id: null=전체 학원(기존 동작), 값이 있으면 그 학원 스태프에게만.
-- popup: true면 스태프 로그인 시 읽지 않은 동안 1회 모달로 표시(읽음 처리는 announcement_reads).
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES public.academies(id) ON DELETE CASCADE;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS popup BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_announcements_academy ON public.announcements (academy_id) WHERE academy_id IS NOT NULL;

DROP POLICY IF EXISTS "staff_read_published_announcements" ON public.announcements;
CREATE POLICY "staff_read_published_announcements" ON public.announcements
  FOR SELECT TO authenticated
  USING (
    is_published = true
    AND get_my_role() = ANY(target_roles)
    AND (academy_id IS NULL OR academy_id = get_my_academy_id())
  );
