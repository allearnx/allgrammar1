DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  q := jsonb_build_array(
    jsonb_build_object('number',1,'question',E'[직접목적어를 찾으시오] Her grandmother made us a birthday cake.','answer','a birthday cake'),
    jsonb_build_object('number',2,'question',E'[간접목적어를 찾으시오] She lent me her pencil.','answer','me'),
    jsonb_build_object('number',3,'question',E'[직접목적어를 찾으시오] Can you bring me some fresh fruit?','answer','some fresh fruit'),
    jsonb_build_object('number',4,'question',E'[간접목적어를 찾으시오] Ms. Kim reads us a story every day.','answer','us'),
    jsonb_build_object('number',5,'question',E'[직접목적어를 찾으시오] He sold a painting to his neighbor.','answer','a painting'),
    jsonb_build_object('number',6,'question',E'[간접목적어를 찾으시오] I will offer you kind and honest advice.','answer','you'),
    jsonb_build_object('number',7,'question',E'[직접목적어를 찾으시오] It brings you and your classmates joy.','answer','joy'),
    jsonb_build_object('number',8,'question',E'[간접목적어를 찾으시오] My uncle got me a new bike for my birthday.','answer','me'),
    jsonb_build_object('number',9,'question',E'[직접목적어를 찾으시오] The chef prepared a wonderful meal for the guests.','answer','a wonderful meal'),
    jsonb_build_object('number',10,'question',E'[간접목적어를 찾으시오] I am going to lend my favorite book to each one of you tomorrow.','answer','each one of you'),
    jsonb_build_object('number',11,'question',E'[빈칸 채우기: make / bring / lend] My grandmother ___ us delicious pancakes every Sunday.','answer','makes'),
    jsonb_build_object('number',12,'question',E'[빈칸 채우기: make / bring / lend] He will ___ me the documents tomorrow.','answer','bring'),
    jsonb_build_object('number',13,'question',E'[빈칸 채우기: make / bring / lend] She ___ her classmate a pencil yesterday.','answer','lent'),
    jsonb_build_object('number',14,'question',E'[빈칸 채우기: offer / read / sell] The shop will ___ you a better price.','answer','offer'),
    jsonb_build_object('number',15,'question',E'[빈칸 채우기: offer / read / sell] My teacher ___ us an interesting story every Friday.','answer','reads'),
    jsonb_build_object('number',16,'question',E'[빈칸 채우기: offer / read / sell] He ___ his friend an old laptop last week.','answer','sold'),
    jsonb_build_object('number',17,'question',E'[빈칸 채우기: order / throw / cook / save / find / get] She always ___ us pizza on Friday nights.','answer','orders'),
    jsonb_build_object('number',18,'question',E'[빈칸 채우기: order / throw / cook / save / find / get] The player will ___ you the ball.','answer','throw'),
    jsonb_build_object('number',19,'question',E'[빈칸 채우기: order / throw / cook / save / find / get] He ___ his family a big dinner yesterday.','answer','cooked'),
    jsonb_build_object('number',20,'question',E'[빈칸 채우기: order / throw / cook / save / find / get] I will ___ my friend a nice present for her birthday.','answer','get')
  );

  a := jsonb_build_array(
    'a birthday cake','me','some fresh fruit','us',
    'a painting','you','joy','me',
    'a wonderful meal','each one of you',
    'makes','bring','lent','offer','reads','sold',
    'orders','throw','cooked','get'
  );

  INSERT INTO naesin_problem_sheets (
    unit_id, title, mode, questions, answer_key,
    category, is_template, template_topic, sort_order
  ) VALUES (
    (SELECT id FROM naesin_units LIMIT 1),
    '수여동사 Step1', 'interactive', q, a,
    'problem', true, '수여동사', 0
  );
END $$;
