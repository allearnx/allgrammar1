-- 내신 콕콕 세트에 "먼저 보는 영상"(유튜브) 연결 (2026-09-17 사장님). 배정 시 시트의 video_url로 복사되고
-- 학생 풀이 화면 상단에 시청 추적 플레이어로 표시된다(naesin_ep_video_progress 재사용).
ALTER TABLE naesin_templates ADD COLUMN IF NOT EXISTS video_url TEXT;
