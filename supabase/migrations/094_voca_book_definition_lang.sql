-- 교재 정의 언어 — 'ko'(영한: 한글 뜻) / 'en'(영영: 영어 정의, 국제학교·유학생용)
-- 단어 추출 시 이 속성을 보고 프롬프트를 자동 분기한다 (업로드마다 선택 불필요)
alter table voca_books add column if not exists definition_lang text not null default 'ko'
  check (definition_lang in ('ko', 'en'));
