-- 076: 올킬보카 네온 업그레이드 - TTS 오디오 + 타임스탬프 지원
-- audio_url: ElevenLabs TTS MP3 파일 URL
-- word_timestamps: 단어별 시작/끝 타임스탬프 (네온 하이라이트 동기화)
-- exam_source: 기출 출처 표시

ALTER TABLE voca_vocabulary
  ADD COLUMN IF NOT EXISTS audio_url TEXT,
  ADD COLUMN IF NOT EXISTS word_timestamps JSONB,
  ADD COLUMN IF NOT EXISTS exam_source TEXT;

-- Supabase Storage 버킷 (공개 오디오 파일)
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-audio', 'public-audio', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: 누구나 읽기 가능
CREATE POLICY "public_audio_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'public-audio');

-- RLS: staff(boss/admin/teacher)만 업로드/삭제
CREATE POLICY "staff_audio_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'public-audio'
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('boss', 'admin', 'teacher')
    )
  );

CREATE POLICY "staff_audio_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'public-audio'
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('boss', 'admin', 'teacher')
    )
  );
