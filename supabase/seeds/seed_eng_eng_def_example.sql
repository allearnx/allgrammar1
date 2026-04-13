-- Example: 영영풀이 (eng_eng_def) 시드 템플릿
-- category: 'eng_eng_def', mode: 'interactive'
-- questions JSONB는 기존 NaesinProblemQuestion[] 형태 (MCQ + 서술형)

INSERT INTO naesin_templates (title, template_topic, category, mode, questions, answer_key)
VALUES (
  '영영풀이 예시 - Unit 1 어휘',
  '영영풀이',
  'eng_eng_def',
  'interactive',
  '[
    {
      "number": 1,
      "question": "다음 영영 뜻에 해당하는 단어로 알맞은 것은?\n\"to make something better or of a higher standard\"",
      "options": ["improve", "remove", "approve", "provide", "involve"],
      "answer": "1",
      "explanation": "improve: 개선하다, 더 좋게 만들다. ''to make something better''에 해당합니다."
    },
    {
      "number": 2,
      "question": "다음 영영 뜻에 해당하는 단어로 알맞은 것은?\n\"to succeed in doing something good, usually by working hard\"",
      "options": ["believe", "receive", "achieve", "deceive", "perceive"],
      "answer": "3",
      "explanation": "achieve: 성취하다. 노력을 통해 좋은 결과를 이루다라는 뜻입니다."
    },
    {
      "number": 3,
      "question": "다음 영영 뜻에 해당하는 단어를 쓰시오.\n\"the act of doing something in front of an audience, such as acting, singing, or dancing\"",
      "options": null,
      "answer": "performance",
      "explanation": "performance: 공연, 연기. 관객 앞에서 하는 행위를 뜻합니다.",
      "acceptedAnswers": ["Performance", "a performance"]
    },
    {
      "number": 4,
      "question": "다음 빈칸에 알맞은 단어를 쓰시오.\nThe ___ of the new building took almost two years. (= the process of building something)",
      "options": null,
      "answer": "construction",
      "explanation": "construction: 건설. ''the process of building something''이라는 영영 뜻에 해당합니다.",
      "acceptedAnswers": ["Construction"]
    }
  ]'::jsonb,
  '["1", "3", "performance", "construction"]'::jsonb
);
