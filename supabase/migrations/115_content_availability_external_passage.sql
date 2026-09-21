-- 115: 외부지문(external_passage)을 문제풀이 그룹에서 제외 (2026-09-22 사장님 결정)
--  - has_problem / problem_sheet_count / problem_sheets_attempted: problem + eng_eng_def만
--  - has_passage는 그대로(교과서 본문 기준). 외부지문만 있는 단원은 교과서 암기 단계가
--    '완료(콘텐츠 없음)' 상태로 열리고 그 안에서 외부지문 칩만 보인다.
--  - SECURITY DEFINER search_path 고정 추가
CREATE OR REPLACE FUNCTION get_unit_content_availability(
  p_student_id UUID,
  p_unit_id UUID,
  p_textbook_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_progress JSONB;
  v_grammar_lessons JSONB;
  v_quiz_set_ids JSONB;
  v_problem_sheet_ids UUID[];
  v_vocab_count INT;
  v_passage_count INT;
  v_dialogue_count INT;
  v_textbook_video_count INT;
  v_mock_exam_count INT;
  v_last_review_sheet_count INT;
  v_similar_problem_count INT;
  v_review_content_count INT;
  v_exam_date TEXT;
  v_problem_sheets_attempted INT;
BEGIN
  -- 1. Student progress (full row)
  SELECT to_jsonb(p) INTO v_progress
  FROM naesin_student_progress p
  WHERE p.student_id = p_student_id AND p.unit_id = p_unit_id;

  -- 2-4. Content existence counts
  SELECT count(*) INTO v_vocab_count
  FROM naesin_vocabulary WHERE unit_id = p_unit_id;

  SELECT count(*) INTO v_passage_count
  FROM naesin_passages WHERE unit_id = p_unit_id;

  SELECT count(*) INTO v_dialogue_count
  FROM naesin_dialogues WHERE unit_id = p_unit_id;

  -- 5. Grammar lessons (id + content_type needed for video filtering)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', gl.id::text,
    'content_type', gl.content_type
  )), '[]'::jsonb)
  INTO v_grammar_lessons
  FROM naesin_grammar_lessons gl WHERE gl.unit_id = p_unit_id;

  -- 6. Textbook video count
  SELECT count(*) INTO v_textbook_video_count
  FROM naesin_textbook_videos WHERE unit_id = p_unit_id;

  -- 7. Problem sheet IDs (problem/eng_eng_def — 외부지문 제외)
  SELECT COALESCE(array_agg(ps.id), '{}')
  INTO v_problem_sheet_ids
  FROM naesin_problem_sheets ps
  WHERE ps.unit_id = p_unit_id
    AND ps.category IN ('problem', 'eng_eng_def');

  -- 8. Mock exam count
  SELECT count(*) INTO v_mock_exam_count
  FROM naesin_problem_sheets WHERE unit_id = p_unit_id AND category = 'mock_exam';

  -- 9-11. Last review related counts
  SELECT count(*) INTO v_last_review_sheet_count
  FROM naesin_problem_sheets WHERE unit_id = p_unit_id AND category = 'last_review';

  SELECT count(*) INTO v_similar_problem_count
  FROM naesin_similar_problems WHERE unit_id = p_unit_id AND status = 'approved';

  SELECT count(*) INTO v_review_content_count
  FROM naesin_last_review_content WHERE unit_id = p_unit_id;

  -- 12. Exam date (optional)
  IF p_textbook_id IS NOT NULL THEN
    SELECT ed.exam_date::text INTO v_exam_date
    FROM naesin_exam_dates ed
    WHERE ed.student_id = p_student_id AND ed.textbook_id = p_textbook_id;
  END IF;

  -- 13. Quiz set IDs
  SELECT COALESCE(jsonb_agg(qs.id::text), '[]'::jsonb)
  INTO v_quiz_set_ids
  FROM naesin_vocab_quiz_sets qs WHERE qs.unit_id = p_unit_id;

  -- 14. Attempted problem sheets (optimized: only checks relevant sheets)
  SELECT count(DISTINCT pa.sheet_id) INTO v_problem_sheets_attempted
  FROM naesin_problem_attempts pa
  WHERE pa.student_id = p_student_id
    AND pa.sheet_id = ANY(v_problem_sheet_ids);

  RETURN jsonb_build_object(
    'progress', v_progress,
    'has_vocab', v_vocab_count > 0,
    'has_passage', v_passage_count > 0,
    'has_dialogue', v_dialogue_count > 0,
    'has_grammar', jsonb_array_length(v_grammar_lessons) > 0,
    'has_textbook_video', v_textbook_video_count > 0,
    'has_problem', COALESCE(array_length(v_problem_sheet_ids, 1), 0) > 0,
    'has_mock_exam', v_mock_exam_count > 0,
    'has_last_review', (v_last_review_sheet_count > 0 OR v_similar_problem_count > 0 OR v_review_content_count > 0) OR v_exam_date IS NOT NULL,
    'grammar_lessons', v_grammar_lessons,
    'textbook_video_count', v_textbook_video_count,
    'quiz_set_ids', v_quiz_set_ids,
    'exam_date', v_exam_date,
    'problem_sheet_count', COALESCE(array_length(v_problem_sheet_ids, 1), 0),
    'problem_sheets_attempted', v_problem_sheets_attempted
  );
END;
$$;
