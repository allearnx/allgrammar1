DO $$
DECLARE
  extra_q jsonb;
  extra_a jsonb;
BEGIN
  extra_q := jsonb_build_array(
    jsonb_build_object('number',21,'question',E'[문장 구조 바꾸기] Let me cook some pasta for you.','answer','Let me cook you some pasta.'),
    jsonb_build_object('number',22,'question',E'[문장 구조 바꾸기] Would you bring me a bottle of water?','answer','Would you bring a bottle of water to me?'),
    jsonb_build_object('number',23,'question',E'[문장 구조 바꾸기] Could you pass the salt to me?','answer','Could you pass me the salt?'),
    jsonb_build_object('number',24,'question',E'[문장 구조 바꾸기] She asked a favor of me.','answer','She asked me a favor.'),
    jsonb_build_object('number',25,'question',E'[문장 구조 바꾸기] She teaches children music.','answer','She teaches music to children.'),
    jsonb_build_object('number',26,'question',E'[문장 구조 바꾸기] I handed the letter to Ms. White.','answer','I handed Ms. White the letter.'),
    jsonb_build_object('number',27,'question',E'[문장 구조 바꾸기] Dad built me a bookshelf.','answer','Dad built a bookshelf for me.'),
    jsonb_build_object('number',28,'question',E'[문장 구조 바꾸기] Show your teacher the homework.','answer','Show the homework to your teacher.'),
    jsonb_build_object('number',29,'question',E'[문장 구조 바꾸기] He asked a difficult question of the students.','answer','He asked the students a difficult question.'),
    jsonb_build_object('number',30,'question',E'[문장 구조 바꾸기] I lent my friend some money.','answer','I lent some money to my friend.'),
    jsonb_build_object('number',31,'question',E'[문장 구조 바꾸기] He bought us some snacks.','answer','He bought some snacks for us.'),
    jsonb_build_object('number',32,'question',E'[문장 구조 바꾸기] My teacher gave a sticker to me.','answer','My teacher gave me a sticker.'),
    jsonb_build_object('number',33,'question',E'[문장 구조 바꾸기] She found a nice hat for me.','answer','She found me a nice hat.')
  );

  extra_a := jsonb_build_array(
    'Let me cook you some pasta.',
    'Would you bring a bottle of water to me?',
    'Could you pass me the salt?',
    'She asked me a favor.',
    'She teaches music to children.',
    'I handed Ms. White the letter.',
    'Dad built a bookshelf for me.',
    'Show the homework to your teacher.',
    'He asked the students a difficult question.',
    'I lent some money to my friend.',
    'He bought some snacks for us.',
    'My teacher gave me a sticker.',
    'She found me a nice hat.'
  );

  UPDATE naesin_problem_sheets
  SET questions = questions || extra_q,
      answer_key = answer_key || extra_a
  WHERE title = '수여동사 Step1'
    AND is_template = true;
END $$;
