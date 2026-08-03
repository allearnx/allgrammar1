-- 교재별 퀴즈 방식 — 초등(주제별) 교재는 4지선다 대신 복수 선택 퀴즈를 쓴다.
--
-- 'single': 기존 4지선다 (기본값 — 기존 24개 교재 전부 무변경)
-- 'multi' : 복수 선택 ("해당하는 단어를 모두 고르세요", 정답 개수 미공개)
--
-- 배경: 주제별 교재는 뜻이 같은 단어가 한 Day에 모인다(big·large·tall·great="큰").
-- 4지선다에서는 정답이 여럿이 되는 결함이지만, 복수 선택에서는 "다 골라야 정답"인
-- 문제 재료가 된다. 생성 규칙: src/lib/voca/multi-select-quiz.ts

alter table public.voca_books
  add column if not exists quiz_type text not null default 'single'
  check (quiz_type in ('single', 'multi'));

comment on column public.voca_books.quiz_type is
  '1회독 퀴즈 방식: single=4지선다(기본), multi=복수 선택(초등 주제별 교재)';
