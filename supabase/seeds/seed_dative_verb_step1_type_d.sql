DO $$
DECLARE
  extra_q jsonb;
  extra_a jsonb;
BEGIN
  extra_q := jsonb_build_array(
    jsonb_build_object('number',34,'question',E'[오류를 고치시오] She told the news us.','answer','She told us the news.'),
    jsonb_build_object('number',35,'question',E'[오류를 고치시오] He gave a book for his friend.','answer','He gave a book to his friend.'),
    jsonb_build_object('number',36,'question',E'[오류를 고치시오] My teacher explained the lesson me.','answer','My teacher explained the lesson to me.'),
    jsonb_build_object('number',37,'question',E'[오류를 고치시오] She passed the ball for her teammate.','answer','She passed the ball to her teammate.'),
    jsonb_build_object('number',38,'question',E'[오류를 고치시오] I will pack the gifts and bring you them.','answer','I will pack the gifts and bring them to you.'),
    jsonb_build_object('number',39,'question',E'[오류를 고치시오] Her dad cooked a special dinner to her.','answer','Her dad cooked a special dinner for her.'),
    jsonb_build_object('number',40,'question',E'[오류를 고치시오] Jenny left her mom to a note.','answer','Jenny left her mom a note.'),
    jsonb_build_object('number',41,'question',E'[오류를 고치시오] Mike threw his friend to the ball.','answer','Mike threw the ball to his friend.'),
    jsonb_build_object('number',42,'question',E'[오류를 고치시오] She showed me it.','answer','She showed it to me.'),
    jsonb_build_object('number',43,'question',E'[오류를 고치시오] She showed her photos us.','answer','She showed us her photos.'),
    jsonb_build_object('number',44,'question',E'[오류를 고치시오] He bought a nice dress to his daughter.','answer','He bought a nice dress for his daughter.'),
    jsonb_build_object('number',45,'question',E'[오류를 고치시오] My brother wrote a letter for me.','answer','My brother wrote a letter to me.'),
    jsonb_build_object('number',46,'question',E'[오류를 고치시오] The waiter brought the menu us.','answer','The waiter brought us the menu.'),
    jsonb_build_object('number',47,'question',E'[오류를 고치시오] She will find a good seat to you.','answer','She will find a good seat for you.'),
    jsonb_build_object('number',48,'question',E'[오류를 고치시오] I gave her it.','answer','I gave it to her.'),
    jsonb_build_object('number',49,'question',E'[오류를 고치시오] He offered his seat for the old lady.','answer','He offered his seat to the old lady.'),
    jsonb_build_object('number',50,'question',E'[오류를 고치시오] Please hand it me.','answer','Please hand it to me.'),
    jsonb_build_object('number',51,'question',E'[오류를 고치시오] She saved her brother to some cake.','answer','She saved her brother some cake.'),
    jsonb_build_object('number',52,'question',E'[오류를 고치시오] He threw the ball for his teammate.','answer','He threw the ball to his teammate.'),
    jsonb_build_object('number',53,'question',E'[오류를 고치시오] My aunt prepared a birthday party to us.','answer','My aunt prepared a birthday party for us.')
  );

  extra_a := jsonb_build_array(
    'She told us the news.',
    'He gave a book to his friend.',
    'My teacher explained the lesson to me.',
    'She passed the ball to her teammate.',
    'I will pack the gifts and bring them to you.',
    'Her dad cooked a special dinner for her.',
    'Jenny left her mom a note.',
    'Mike threw the ball to his friend.',
    'She showed it to me.',
    'She showed us her photos.',
    'He bought a nice dress for his daughter.',
    'My brother wrote a letter to me.',
    'The waiter brought us the menu.',
    'She will find a good seat for you.',
    'I gave it to her.',
    'He offered his seat to the old lady.',
    'Please hand it to me.',
    'She saved her brother some cake.',
    'He threw the ball to his teammate.',
    'My aunt prepared a birthday party for us.'
  );

  UPDATE naesin_problem_sheets
  SET questions = questions || extra_q,
      answer_key = answer_key || extra_a
  WHERE title = '수여동사 Step1'
    AND is_template = true;
END $$;
