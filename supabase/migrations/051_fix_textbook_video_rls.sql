-- ============================================
-- 051: naesin_textbook_videos RLS 정책 수정
-- get_my_role() 사용으로 RLS 재귀 방지
-- ============================================

DROP POLICY IF EXISTS "Teachers can manage textbook videos" ON naesin_textbook_videos;
CREATE POLICY "Teachers can manage textbook videos" ON naesin_textbook_videos
  FOR ALL USING (get_my_role() IN ('teacher', 'admin', 'boss'));
