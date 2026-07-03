-- 교재 표지 이미지 — /allkill 교재 로테이션 카드 + 학생 교재 선택 화면에서 사용
alter table voca_books add column if not exists cover_image_url text;
