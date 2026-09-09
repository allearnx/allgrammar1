-- ============================================
-- 108: 학습 단계(단어·지문·대화) 오답노트 정리 — 빈 답 삭제 + 같은 문항 최신 1건만
--
-- 배경: 빈칸 채우기를 빈 채로 제출하거나 대화 영작에 "."만 찍고 넘기면 그대로 오답으로
-- 쌓이고(전체 5,057건 중 2,378건이 빈 답), 재도전할 때마다 같은 문항이 누적돼
-- 오답노트에서 진짜 봐야 할 오답이 묻혔다. 이후 저장은 API(wrong-answers POST)가
-- 같은 규칙(src/lib/naesin/wrong-answer-dedupe.ts)으로 걸러낸다.
--
-- ⚠️ 문제 시트 경로(stage problem/mockExam)는 건드리지 않는다 — 시트 단위 갱신이라
-- 중복이 없고, 시도 JSONB↔오답 테이블 건수 동기화 검사가 걸려 있다.
-- ============================================

-- 1) 빈 답 삭제 (userAnswer 필드가 있는 유형만 — ordering/vocab_quiz/grammar_vocab은 필드 없음)
DELETE FROM naesin_wrong_answers
WHERE stage IN ('vocab', 'passage', 'dialogue')
  AND question_data ? 'userAnswer'
  AND (
    jsonb_typeof(question_data->'userAnswer') = 'null'
    OR (
      jsonb_typeof(question_data->'userAnswer') = 'string'
      AND (question_data->>'userAnswer') ~ '^[[:space:].\-_?,!·…~]*$'
    )
  );

-- 2) 같은 문항 중복 제거 — (학생, 단원, 단계, 유형, 회독, 문항 키)별 최신 1건만 유지
DELETE FROM naesin_wrong_answers
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      row_number() OVER (
        PARTITION BY
          student_id, unit_id, stage, source_type, round,
          CASE question_data->>'type'
            WHEN 'fill_blank' THEN
              'fb:' || coalesce(question_data->>'difficulty', '') || ':'
                    || coalesce(question_data->>'blankIndex', '') || ':'
                    || coalesce(question_data->>'correctAnswer', '')
            WHEN 'vocab_spelling' THEN 'v:' || coalesce(question_data->>'front_text', '')
            WHEN 'vocab_quiz'     THEN 'v:' || coalesce(question_data->>'front_text', '')
            WHEN 'grammar_vocab'  THEN
              'gv:' || coalesce(question_data->>'cpIdx', '') || ':' || coalesce(question_data->>'itemIdx', '')
            WHEN 'ordering'       THEN 'ord:' || coalesce(question_data->>'correctOrder', '')
            WHEN 'translation'    THEN 'k:' || coalesce(question_data->>'koreanText', '')
            WHEN 'first_letter'   THEN 'k:' || coalesce(question_data->>'koreanText', '')
            ELSE coalesce(
              't:' || coalesce(
                question_data->>'question',
                question_data->>'koreanText',
                question_data->>'front_text',
                question_data->>'correctAnswer'
              ),
              'raw:' || question_data::text
            )
          END
        ORDER BY created_at DESC, id DESC
      ) AS rn
    FROM naesin_wrong_answers
    WHERE stage IN ('vocab', 'passage', 'dialogue')
  ) ranked
  WHERE rn > 1
);
