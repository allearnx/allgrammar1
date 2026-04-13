-- Example: 외부지문 (external_passage) 시드 템플릿
-- category: 'external_passage', mode: 'interactive'
-- questions JSONB는 ExternalPassageSentence[] 형태

INSERT INTO naesin_templates (title, template_topic, category, mode, questions, answer_key)
VALUES (
  '외부지문 예시 - Lesson 5',
  '외부지문',
  'external_passage',
  'interactive',
  '[
    {
      "number": 1,
      "original": "She has been studying English since she was five.",
      "korean": "그녀는 다섯 살 때부터 영어를 공부해 오고 있다.",
      "words": ["She", "has", "been", "studying", "English", "since", "she", "was", "five."],
      "acceptedAnswers": ["She has been studying English since she was five"]
    },
    {
      "number": 2,
      "original": "He decided to become a scientist after watching a documentary.",
      "korean": "그는 다큐멘터리를 본 후 과학자가 되기로 결심했다.",
      "words": ["He", "decided", "to", "become", "a", "scientist", "after", "watching", "a", "documentary."],
      "acceptedAnswers": ["He decided to become a scientist after watching a documentary"]
    },
    {
      "number": 3,
      "original": "The festival was so popular that tickets sold out in minutes.",
      "korean": "그 축제는 너무 인기가 많아서 표가 몇 분 만에 매진되었다.",
      "words": ["The", "festival", "was", "so", "popular", "that", "tickets", "sold", "out", "in", "minutes."],
      "acceptedAnswers": ["The festival was so popular that tickets sold out in minutes"]
    }
  ]'::jsonb,
  '["She has been studying English since she was five.", "He decided to become a scientist after watching a documentary.", "The festival was so popular that tickets sold out in minutes."]'::jsonb
);
