DO $$
DECLARE
  extra_q jsonb;
  extra_a jsonb;
BEGIN
  extra_q := jsonb_build_array(
    jsonb_build_object('number',54,'question','[배열하시오] 그 소년은 나에게 편지를 보냈다. (a / the / sent / to / boy / letter / me)','answer','The boy sent a letter to me.'),
    jsonb_build_object('number',55,'question','[배열하시오] 나는 그에게 이 책을 사주었다. (this / I / book / for / bought / him)','answer','I bought this book for him.'),
    jsonb_build_object('number',56,'question','[배열하시오] 그녀는 우리에게 그 지도를 보여주었다. (map / she / the / to / us / showed)','answer','She showed the map to us.'),
    jsonb_build_object('number',57,'question','[배열하시오] 그는 그녀에게 그 메시지를 전해주었다. (message / her / told / the / he)','answer','He told her the message.'),
    jsonb_build_object('number',58,'question','[배열하시오] 그 여자는 우리에게 맛있는 케이크를 만들어주었다. (delicious / cake / the / made / woman / a / us)','answer','The woman made us a delicious cake.'),
    jsonb_build_object('number',59,'question','[배열하시오] 톰은 자기의 노트를 나에게 빌려주었다. (notebook / Tom / lent / to / me / his)','answer','Tom lent his notebook to me.'),
    jsonb_build_object('number',60,'question','[배열하시오] 어머니는 나를 위해 점심을 요리해주셨다. (my / lunch / cooked / mother / for / me)','answer','My mother cooked lunch for me.'),
    jsonb_build_object('number',61,'question','[배열하시오] 제인은 그녀의 오빠에게 멋진 선물을 찾아주었다. (her brother / found / Jane / for / a nice gift)','answer','Jane found a nice gift for her brother.'),
    jsonb_build_object('number',62,'question','[배열하시오] 선생님은 우리에게 영어를 가르쳐주신다. (our / English / teaches / teacher / us)','answer','Our teacher teaches us English.'),
    jsonb_build_object('number',63,'question','[배열하시오] 그녀는 나에게 큰 부탁을 했다. (big / a / she / of / asked / me / favor)','answer','She asked a big favor of me.'),
    jsonb_build_object('number',64,'question','[배열하시오] 그는 나에게 어려운 질문을 했다. (difficult / a / he / of / asked / me / question)','answer','He asked a difficult question of me.'),
    jsonb_build_object('number',65,'question','[배열하시오] 아버지는 나에게 자전거를 사주셨다. (my / a / father / bicycle / me / bought)','answer','My father bought me a bicycle.'),
    jsonb_build_object('number',66,'question','[배열하시오] 그녀는 손님들에게 차를 대접했다. (served / the / she / tea / guests)','answer','She served the guests tea.'),
    jsonb_build_object('number',67,'question','[배열하시오] 그 소녀는 나에게 예쁜 카드를 만들어주었다. (pretty / card / the / made / girl / a / me)','answer','The girl made me a pretty card.'),
    jsonb_build_object('number',68,'question','[배열하시오] 존은 그의 여동생에게 인형을 가져다주었다. (his sister / brought / John / for / a doll)','answer','John brought a doll for his sister.')
  );

  extra_a := jsonb_build_array(
    'The boy sent a letter to me.',
    'I bought this book for him.',
    'She showed the map to us.',
    'He told her the message.',
    'The woman made us a delicious cake.',
    'Tom lent his notebook to me.',
    'My mother cooked lunch for me.',
    'Jane found a nice gift for her brother.',
    'Our teacher teaches us English.',
    'She asked a big favor of me.',
    'He asked a difficult question of me.',
    'My father bought me a bicycle.',
    'She served the guests tea.',
    'The girl made me a pretty card.',
    'John brought a doll for his sister.'
  );

  UPDATE naesin_problem_sheets
  SET questions = questions || extra_q,
      answer_key = answer_key || extra_a
  WHERE title = '수여동사 Step1'
    AND is_template = true;
END $$;
