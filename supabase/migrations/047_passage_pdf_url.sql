-- 교과서 본문 PDF 다운로드용 URL 컬럼 추가
ALTER TABLE naesin_passages ADD COLUMN IF NOT EXISTS pdf_url TEXT;
