-- 접속사 if Step1 81문제 (패러프레이즈)
DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = '접속사 if Step1';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 1: 형태 고르기 (Q1-Q8) 객관식 5지선다
    -- ═══════════════════════════════════════
    jsonb_build_object('number',1,'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nIf she (     ) hard for the exam, she will pass it easily.','options',jsonb_build_array('studies','will study','studied','is studying','has studied'),'answer','1'),
    jsonb_build_object('number',2,'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nIf you tell me her address, I (     ) a letter to her.','options',jsonb_build_array('send','sent','will send','am sending','have sent'),'answer','3'),
    jsonb_build_object('number',3,'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nShe will bake a cake if she (     ) home early.','options',jsonb_build_array('will get','gets','got','is getting','will be getting'),'answer','2'),
    jsonb_build_object('number',4,'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nIt''s snowing outside. If you (     ) wear a coat, you''ll catch a cold.','options',jsonb_build_array('won''t','don''t','aren''t','wouldn''t','didn''t'),'answer','2'),
    jsonb_build_object('number',5,'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nI (     ) able to finish the report by noon if the internet works properly.','options',jsonb_build_array('am','was','will be','have been','would be'),'answer','3'),
    jsonb_build_object('number',6,'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nI (     ) the dentist if my toothache gets worse tomorrow.','options',jsonb_build_array('visit','visited','will visit','am visiting','have visited'),'answer','3'),
    jsonb_build_object('number',7,'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nWe will order pizza if we (     ) hungry after the game.','options',jsonb_build_array('are','will be','were','will are','have been'),'answer','1'),
    jsonb_build_object('number',8,'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nWhat will you do if he (     ) to help you with the project?','options',jsonb_build_array('refuse','refuses','will refuse','refusing','refused'),'answer','2'),

    -- ═══════════════════════════════════════
    -- Part 2: 빈칸 채우기 서술형 (Q9-Q18)
    -- ═══════════════════════════════════════
    jsonb_build_object('number',9,'question',E'다음 괄호 안의 단어를 알맞은 형태로 쓰시오.\n\nI always listen to music if I ______ (feel) stressed.','options',jsonb_build_array(),'answer','feel'),
    jsonb_build_object('number',10,'question',E'다음 괄호 안의 단어를 알맞은 형태로 쓰시오.\n\nIf you ______ (press) a lemon, you get lemon juice.','options',jsonb_build_array(),'answer','press'),
    jsonb_build_object('number',11,'question',E'다음 괄호 안의 단어를 알맞은 형태로 쓰시오.\n\nIf you ______ (freeze) water, it becomes ice.','options',jsonb_build_array(),'answer','freeze'),
    jsonb_build_object('number',12,'question',E'다음 괄호 안의 단어를 알맞은 형태로 쓰시오.\n\nIf you ______ (stand) in the rain without an umbrella, you get soaked.','options',jsonb_build_array(),'answer','stand'),
    jsonb_build_object('number',13,'question',E'다음 괄호 안의 단어를 알맞은 형태로 쓰시오.\n\nHe can''t concentrate well if he ______ (skip) breakfast in the morning.','options',jsonb_build_array(),'answer','skips'),
    jsonb_build_object('number',14,'question',E'다음 괄호 안의 단어를 알맞은 형태로 쓰시오.\n\nIf you throw trash into the river, you ______ (harm) the environment.','options',jsonb_build_array(),'answer','harm'),
    jsonb_build_object('number',15,'question',E'다음 괄호 안의 단어를 알맞은 형태로 쓰시오.\n\nIf the apple is green, it ______ (be) not ripe yet.','options',jsonb_build_array(),'answer','is'),
    jsonb_build_object('number',16,'question',E'다음 괄호 안의 단어를 알맞은 형태로 쓰시오.\n\nI always ______ (check) the weather forecast if I plan to go hiking.','options',jsonb_build_array(),'answer','check'),
    jsonb_build_object('number',17,'question',E'다음 괄호 안의 단어를 알맞은 형태로 쓰시오.\n\nIf he ______ (touch) that broken glass, he will cut his finger.','options',jsonb_build_array(),'answer','touches'),
    jsonb_build_object('number',18,'question',E'다음 괄호 안의 단어를 알맞은 형태로 쓰시오.\n\nIf you leave the window open, the bird ______ (fly away).','options',jsonb_build_array(),'answer','will fly away')
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 2 continued: 빈칸 채우기 객관식 (Q19-Q23)
    -- ═══════════════════════════════════════
    jsonb_build_object('number',19,'question',E'다음 빈칸 (A), (B)에 들어갈 말이 바르게 짝지어진 것을 고르시오.\n\nIf the puppy (A)______ (not, eat) its food, we (B)______ (take) it to the vet.\n\n(A) / (B)','options',jsonb_build_array('doesn''t eat / will take','won''t eat / will take','didn''t eat / take','doesn''t eat / take','won''t eat / took'),'answer','1'),
    jsonb_build_object('number',20,'question',E'다음 빈칸 (A), (B)에 들어갈 말이 바르게 짝지어진 것을 고르시오.\n\nI (A)______ (buy) some snacks on the way home if I (B)______ (have) enough money.\n\n(A) / (B)','options',jsonb_build_array('will buy / have','buy / will have','will buy / will have','bought / have','buy / had'),'answer','1'),
    jsonb_build_object('number',21,'question',E'다음 빈칸 (A), (B)에 들어갈 말이 바르게 짝지어진 것을 고르시오.\n\nIf they (A)______ (not, play) in the mud, they (B)______ (not, be) so dirty.\n\n(A) / (B)','options',jsonb_build_array('won''t play / aren''t','don''t play / won''t be','didn''t play / won''t be','don''t play / aren''t','won''t play / won''t be'),'answer','2'),
    jsonb_build_object('number',22,'question',E'다음 빈칸 (A), (B)에 들어갈 말이 바르게 짝지어진 것을 고르시오.\n\nIf it (A)______ (snow) tonight, we (B)______ (build) a snowman tomorrow.\n\n(A) / (B)','options',jsonb_build_array('will snow / build','snows / will build','snows / build','will snow / will build','snowed / will build'),'answer','2'),
    jsonb_build_object('number',23,'question',E'다음 빈칸 (A), (B)에 들어갈 말이 바르게 짝지어진 것을 고르시오.\n\nIf you (A)______ (make) the salad for the party, I (B)______ (prepare) the dessert.\n\n(A) / (B)','options',jsonb_build_array('will make / prepare','make / will prepare','will make / will prepare','made / will prepare','make / prepare'),'answer','2'),

    -- ═══════════════════════════════════════
    -- Part 3: 매칭 Set1 Zero conditional (Q24-Q29)
    -- ═══════════════════════════════════════
    jsonb_build_object('number',24,'question',E'다음 문장을 완성할 때, 빈칸에 가장 알맞은 것을 고르시오.\n\nIf the weather is freezing, ______','options',jsonb_build_array(E'① I wear a warm jacket',E'② they feel thirsty',E'③ it melts quickly',E'④ you get a sunburn',E'⑤ babies fall asleep',E'⑥ they gain weight'),'answer','1'),
    jsonb_build_object('number',25,'question',E'다음 문장을 완성할 때, 빈칸에 가장 알맞은 것을 고르시오.\n\nIf babies are tired, ______','options',jsonb_build_array(E'① I wear a warm jacket',E'② they feel thirsty',E'③ it melts quickly',E'④ you get a sunburn',E'⑤ babies fall asleep',E'⑥ they gain weight'),'answer','5'),
    jsonb_build_object('number',26,'question',E'다음 문장을 완성할 때, 빈칸에 가장 알맞은 것을 고르시오.\n\nIf you stay in the sun too long, ______','options',jsonb_build_array(E'① I wear a warm jacket',E'② they feel thirsty',E'③ it melts quickly',E'④ you get a sunburn',E'⑤ babies fall asleep',E'⑥ they gain weight'),'answer','4'),
    jsonb_build_object('number',27,'question',E'다음 문장을 완성할 때, 빈칸에 가장 알맞은 것을 고르시오.\n\nIf people eat too many sweets, ______','options',jsonb_build_array(E'① I wear a warm jacket',E'② they feel thirsty',E'③ it melts quickly',E'④ you get a sunburn',E'⑤ babies fall asleep',E'⑥ they gain weight'),'answer','6'),
    jsonb_build_object('number',28,'question',E'다음 문장을 완성할 때, 빈칸에 가장 알맞은 것을 고르시오.\n\nIf people exercise a lot on a hot day, ______','options',jsonb_build_array(E'① I wear a warm jacket',E'② they feel thirsty',E'③ it melts quickly',E'④ you get a sunburn',E'⑤ babies fall asleep',E'⑥ they gain weight'),'answer','2'),
    jsonb_build_object('number',29,'question',E'다음 문장을 완성할 때, 빈칸에 가장 알맞은 것을 고르시오.\n\nIf you leave ice cream outside on a summer day, ______','options',jsonb_build_array(E'① I wear a warm jacket',E'② they feel thirsty',E'③ it melts quickly',E'④ you get a sunburn',E'⑤ babies fall asleep',E'⑥ they gain weight'),'answer','3'),

    -- Part 3: 매칭 Set2 First conditional (Q30-Q35)
    jsonb_build_object('number',30,'question',E'다음 문장을 완성할 때, 빈칸에 가장 알맞은 것을 고르시오.\n\nYou will speak English fluently ______','options',jsonb_build_array(E'① if you save enough allowance',E'② if you eat junk food every day',E'③ if you don''t bring your jacket',E'④ if you don''t pay the water bill',E'⑤ if you practice every day',E'⑥ if you don''t wake up on time'),'answer','5'),
    jsonb_build_object('number',31,'question',E'다음 문장을 완성할 때, 빈칸에 가장 알맞은 것을 고르시오.\n\nYou will feel cold outside ______','options',jsonb_build_array(E'① if you save enough allowance',E'② if you eat junk food every day',E'③ if you don''t bring your jacket',E'④ if you don''t pay the water bill',E'⑤ if you practice every day',E'⑥ if you don''t wake up on time'),'answer','3'),
    jsonb_build_object('number',32,'question',E'다음 문장을 완성할 때, 빈칸에 가장 알맞은 것을 고르시오.\n\nYou can buy that video game ______','options',jsonb_build_array(E'① if you save enough allowance',E'② if you eat junk food every day',E'③ if you don''t bring your jacket',E'④ if you don''t pay the water bill',E'⑤ if you practice every day',E'⑥ if you don''t wake up on time'),'answer','1'),
    jsonb_build_object('number',33,'question',E'다음 문장을 완성할 때, 빈칸에 가장 알맞은 것을 고르시오.\n\nYou will miss the school bus ______','options',jsonb_build_array(E'① if you save enough allowance',E'② if you eat junk food every day',E'③ if you don''t bring your jacket',E'④ if you don''t pay the water bill',E'⑤ if you practice every day',E'⑥ if you don''t wake up on time'),'answer','6'),
    jsonb_build_object('number',34,'question',E'다음 문장을 완성할 때, 빈칸에 가장 알맞은 것을 고르시오.\n\nYou will gain a lot of weight ______','options',jsonb_build_array(E'① if you save enough allowance',E'② if you eat junk food every day',E'③ if you don''t bring your jacket',E'④ if you don''t pay the water bill',E'⑤ if you practice every day',E'⑥ if you don''t wake up on time'),'answer','2'),
    jsonb_build_object('number',35,'question',E'다음 문장을 완성할 때, 빈칸에 가장 알맞은 것을 고르시오.\n\nThe gas will be shut off ______','options',jsonb_build_array(E'① if you save enough allowance',E'② if you eat junk food every day',E'③ if you don''t bring your jacket',E'④ if you don''t pay the water bill',E'⑤ if you practice every day',E'⑥ if you don''t wake up on time'),'answer','4')
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 4: 어법 오류 수정 (Q36-Q40) 서술형
    -- ═══════════════════════════════════════
    jsonb_build_object('number',36,'question',E'다음 문장에서 어법상 틀린 부분을 찾아 올바르게 고쳐 쓰시오.\n\nClose the window if you''ll leave the room.','options',jsonb_build_array(),'answer',E'you leave the room','acceptedAnswers',jsonb_build_array('you leave the room','you leave')),
    jsonb_build_object('number',37,'question',E'다음 문장에서 어법상 틀린 부분을 찾아 올바르게 고쳐 쓰시오.\n\nShe''ll send you a message if she will finish her homework.','options',jsonb_build_array(),'answer',E'she finishes her homework','acceptedAnswers',jsonb_build_array('she finishes her homework','she finishes')),
    jsonb_build_object('number',38,'question',E'다음 문장에서 어법상 틀린 부분을 찾아 올바르게 고쳐 쓰시오.\n\nIf we leave now, we be there before dark.','options',jsonb_build_array(),'answer',E'we will be there before dark','acceptedAnswers',jsonb_build_array('we will be there before dark','we will be','we''ll be there before dark','we''ll be')),
    jsonb_build_object('number',39,'question',E'다음 문장에서 어법상 틀린 부분을 찾아 올바르게 고쳐 쓰시오.\n\nIf you search carefully, you will discovered the answer.','options',jsonb_build_array(),'answer',E'will discover','acceptedAnswers',jsonb_build_array('will discover','you will discover','you will discover the answer')),
    jsonb_build_object('number',40,'question',E'다음 문장에서 어법상 틀린 부분을 찾아 올바르게 고쳐 쓰시오.\n\nHe will join the team if the coach will invite him.','options',jsonb_build_array(),'answer',E'the coach invites him','acceptedAnswers',jsonb_build_array('the coach invites him','the coach invites')),

    -- ═══════════════════════════════════════
    -- Part 5: unless↔if 전환 (Q41-Q46) 서술형
    -- ═══════════════════════════════════════
    jsonb_build_object('number',41,'question',E'다음 문장을 unless를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nIf we don''t start early, we will miss the bus.','options',jsonb_build_array(),'answer',E'Unless we start early, we will miss the bus.','acceptedAnswers',jsonb_build_array('Unless we start early, we''ll miss the bus.')),
    jsonb_build_object('number',42,'question',E'다음 문장을 if를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nUnless it snows, we will go hiking.','options',jsonb_build_array(),'answer',E'If it doesn''t snow, we will go hiking.','acceptedAnswers',jsonb_build_array('If it does not snow, we will go hiking.','If it doesn''t snow, we''ll go hiking.')),
    jsonb_build_object('number',43,'question',E'다음 문장을 unless를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nShe will report them if they don''t return the money.','options',jsonb_build_array(),'answer',E'She will report them unless they return the money.','acceptedAnswers',jsonb_build_array('She''ll report them unless they return the money.')),
    jsonb_build_object('number',44,'question',E'다음 문장을 if를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nUnless you practice, you won''t improve your skills.','options',jsonb_build_array(),'answer',E'If you don''t practice, you won''t improve your skills.','acceptedAnswers',jsonb_build_array('If you do not practice, you won''t improve your skills.','If you don''t practice, you will not improve your skills.')),
    jsonb_build_object('number',45,'question',E'다음 문장을 unless를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nIf he doesn''t finish the report, the manager will be upset.','options',jsonb_build_array(),'answer',E'Unless he finishes the report, the manager will be upset.','acceptedAnswers',jsonb_build_array('The manager will be upset unless he finishes the report.')),
    jsonb_build_object('number',46,'question',E'다음 문장을 if를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nUnless you want extra help, this textbook is enough for you.','options',jsonb_build_array(),'answer',E'If you don''t want extra help, this textbook is enough for you.','acceptedAnswers',jsonb_build_array('If you do not want extra help, this textbook is enough for you.'))
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 6: if/unless 선택 (Q47-Q61) 객관식 5지선다
    -- ═══════════════════════════════════════
    jsonb_build_object('number',47,'question',E'다음 빈칸에 알맞은 접속사를 고르시오.\n\nLet''s play outside ___ you are too exhausted.','options',jsonb_build_array('if','unless','when','because','although'),'answer','2'),
    jsonb_build_object('number',48,'question',E'다음 빈칸에 알맞은 접속사를 고르시오.\n\nYou''ll get a stomachache ___ you stop drinking soda.','options',jsonb_build_array('if','because','unless','although','since'),'answer','3'),
    jsonb_build_object('number',49,'question',E'다음 빈칸에 알맞은 접속사를 고르시오.\n\nI am going to wash the car this weekend, ___ it snows.','options',jsonb_build_array('because','although','when','unless','if'),'answer','4'),
    jsonb_build_object('number',50,'question',E'다음 빈칸에 알맞은 접속사를 고르시오.\n\nI will accept the offer ___ the schedule is too demanding.','options',jsonb_build_array('when','if','although','since','unless'),'answer','5'),
    jsonb_build_object('number',51,'question',E'다음 빈칸에 알맞은 접속사를 고르시오.\n\nYou can''t enter the building ___ you don''t have an ID card.','options',jsonb_build_array('if','unless','although','because','when'),'answer','1'),
    jsonb_build_object('number',52,'question',E'다음 빈칸에 알맞은 접속사를 고르시오.\n\n___ we reduce plastic waste, ocean pollution will get worse.','options',jsonb_build_array('Although','Because','If','When','Unless'),'answer','5'),
    jsonb_build_object('number',53,'question',E'다음 빈칸에 알맞은 접속사를 고르시오.\n\n___ I am busy this afternoon, don''t call me.','options',jsonb_build_array('If','Unless','Although','Because','Since'),'answer','1'),
    jsonb_build_object('number',54,'question',E'다음 빈칸에 알맞은 접속사를 고르시오.\n\nYou will feel sleepy ___ you stay up all night.','options',jsonb_build_array('unless','although','if','because','when'),'answer','3'),
    jsonb_build_object('number',55,'question',E'다음 빈칸에 알맞은 접속사를 고르시오.\n\n___ you speak more politely, people will get offended.','options',jsonb_build_array('If','Because','Although','Unless','Since'),'answer','4'),
    jsonb_build_object('number',56,'question',E'다음 빈칸에 알맞은 접속사를 고르시오.\n\nYou''ll miss the meeting again ___ you don''t set an alarm.','options',jsonb_build_array('unless','if','although','because','when'),'answer','2'),
    jsonb_build_object('number',57,'question',E'다음 빈칸에 알맞은 접속사를 고르시오.\n\nMy coach will be disappointed ___ I win the match.','options',jsonb_build_array('if','although','because','unless','when'),'answer','4'),
    jsonb_build_object('number',58,'question',E'다음 빈칸에 알맞은 접속사를 고르시오.\n\nWe can''t enter the concert ___ we don''t have tickets.','options',jsonb_build_array('if','unless','although','since','when'),'answer','1'),
    jsonb_build_object('number',59,'question',E'다음 빈칸에 알맞은 접속사를 고르시오.\n\n___ they improve the quality, I won''t buy that product.','options',jsonb_build_array('Although','Because','Unless','If','When'),'answer','3'),
    jsonb_build_object('number',60,'question',E'다음 빈칸에 알맞은 접속사를 고르시오.\n\n___ air pollution increases, many animals will lose their habitats.','options',jsonb_build_array('If','Unless','Although','Because','Since'),'answer','1'),
    jsonb_build_object('number',61,'question',E'다음 빈칸에 알맞은 접속사를 고르시오.\n\n___ the temperature keeps rising, the glaciers will disappear.','options',jsonb_build_array('Unless','Although','If','Because','When'),'answer','3')
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 7: 단어뱅크 빈칸 서술형 (Q62-Q71)
    -- ═══════════════════════════════════════
    jsonb_build_object('number',62,'question',E'[단어: swim, cook, travel]\n\n다음 빈칸에 주어진 단어의 알맞은 형태를 쓰시오. (필요 시 not 또는 will을 함께 쓸 것)\n\nUnless it snows, we ___ to the mountains.','options',jsonb_build_array(),'answer','will travel'),
    jsonb_build_object('number',63,'question',E'[단어: stir, pour, bake, taste]\n\n다음 빈칸에 주어진 단어의 알맞은 형태를 쓰시오. (필요 시 not 또는 will을 함께 쓸 것)\n\nIf you ___ flour, sugar, and butter together, you get cookie dough.','options',jsonb_build_array(),'answer','stir'),
    jsonb_build_object('number',64,'question',E'[단어: stir, pour, bake, taste]\n\n다음 빈칸에 주어진 단어의 알맞은 형태를 쓰시오. (필요 시 not 또는 will을 함께 쓸 것)\n\nIf you don''t ___ the cake long enough, it stays raw inside.','options',jsonb_build_array(),'answer','bake'),
    jsonb_build_object('number',65,'question',E'[단어: scratch, growl, melt, press, snow]\n\n다음 빈칸에 주어진 단어의 알맞은 형태를 쓰시오. (필요 시 not 또는 will을 함께 쓸 것)\n\nIf you ___ ice cream, it turns to liquid.','options',jsonb_build_array(),'answer','melt'),
    jsonb_build_object('number',66,'question',E'[단어: scratch, growl, melt, press, snow]\n\n다음 빈칸에 주어진 단어의 알맞은 형태를 쓰시오. (필요 시 not 또는 will을 함께 쓸 것)\n\nMy cat won''t ___ unless it feels scared.','options',jsonb_build_array(),'answer','scratch'),
    jsonb_build_object('number',67,'question',E'[단어: gain, stretch, succeed, study]\n\n다음 빈칸에 주어진 단어의 알맞은 형태를 쓰시오. (필요 시 not 또는 will을 함께 쓸 것)\n\nYou lose energy if you don''t ___.','options',jsonb_build_array(),'answer','stretch'),
    jsonb_build_object('number',68,'question',E'[단어: gain, stretch, succeed, study]\n\n다음 빈칸에 주어진 단어의 알맞은 형태를 쓰시오. (필요 시 not 또는 will을 함께 쓸 것)\n\nI won''t ___ unless you help me prepare.','options',jsonb_build_array(),'answer','succeed'),
    jsonb_build_object('number',69,'question',E'[단어: postpone, order, pack, leave, keep]\n\n다음 빈칸에 주어진 단어의 알맞은 형태를 쓰시오. (필요 시 not 또는 will을 함께 쓸 것)\n\nIf the storm hits, we will ___ the event.','options',jsonb_build_array(),'answer','postpone'),
    jsonb_build_object('number',70,'question',E'[단어: postpone, order, pack, leave, keep]\n\n다음 빈칸에 주어진 단어의 알맞은 형태를 쓰시오. (필요 시 not 또는 will을 함께 쓸 것)\n\nIf you don''t ___ your bag tonight, you''ll forget something tomorrow.','options',jsonb_build_array(),'answer','pack'),
    jsonb_build_object('number',71,'question',E'[단어: eat, cheat, explain, fix, wash, read]\n\n다음 빈칸에 주어진 단어의 알맞은 형태를 쓰시오. (필요 시 not 또는 will을 함께 쓸 것)\n\nIf we ___ too much sugar tonight, we will feel sick.','options',jsonb_build_array(),'answer','eat'),

    -- Part 7: 단어뱅크 빈칸 객관식 (Q72-Q73)
    jsonb_build_object('number',72,'question',E'[단어: scratch, growl, melt, press, snow]\n\n다음 빈칸에 알맞은 단어의 짝을 고르시오. (필요 시 not 또는 will을 함께 쓸 것)\n\nIf you ___ the cat too roughly, it ___ at you.','options',jsonb_build_array('scratch / growls','press / melts','melt / scratches','growl / presses','snow / growls'),'answer','1'),
    jsonb_build_object('number',73,'question',E'[단어: eat, cheat, explain, fix, wash, read]\n\n다음 빈칸에 알맞은 단어의 짝을 고르시오. (필요 시 not 또는 will을 함께 쓸 것)\n\nIf you ___ the instructions carefully, I will ___ the machine.','options',jsonb_build_array('read / fix','wash / cheat','eat / read','cheat / wash','fix / eat'),'answer','1'),

    -- ═══════════════════════════════════════
    -- Part 8: 영작 (Q74-Q81) 서술형
    -- ═══════════════════════════════════════
    jsonb_build_object('number',74,'question',E'다음 우리말을 영어로 영작하시오.\n\n내일 눈이 온다면, 우리는 집에 머물 것이다.\n\n[단어: snow, stay, at]','options',jsonb_build_array(),'answer',E'If it snows tomorrow, we will stay at home.','acceptedAnswers',jsonb_build_array('We will stay at home if it snows tomorrow.','If it snows tomorrow, we''ll stay at home.')),
    jsonb_build_object('number',75,'question',E'다음 우리말을 영어로 영작하시오.\n\n그녀를 만나면 이 편지를 좀 전해줘.\n\n[단어: meet, give, letter]','options',jsonb_build_array(),'answer',E'If you meet her, give her this letter.','acceptedAnswers',jsonb_build_array('Give her this letter if you meet her.')),
    jsonb_build_object('number',76,'question',E'다음 우리말을 영어로 영작하시오.\n\n너희가 점심을 거르면, 오후에 더 많이 먹게 될 것이다.\n\n[단어: skip, eat, afternoon]','options',jsonb_build_array(),'answer',E'If you skip lunch, you will eat more in the afternoon.','acceptedAnswers',jsonb_build_array('You will eat more in the afternoon if you skip lunch.','If you skip lunch, you''ll eat more in the afternoon.')),
    jsonb_build_object('number',77,'question',E'다음 우리말을 영어로 영작하시오.\n\n너무 많은 아이스크림을 먹으면 배가 아플 것이다.\n\n[단어: get, eat, too much]','options',jsonb_build_array(),'answer',E'You will get a stomachache if you eat too much ice cream.','acceptedAnswers',jsonb_build_array('If you eat too much ice cream, you will get a stomachache.','You''ll get a stomachache if you eat too much ice cream.')),
    jsonb_build_object('number',78,'question',E'다음 우리말을 영어로 영작하시오.\n\n내가 시장에 간다면 나는 약간의 채소를 살 것이다.\n\n[단어: market, some, vegetables]','options',jsonb_build_array(),'answer',E'If I go to the market, I will buy some vegetables.','acceptedAnswers',jsonb_build_array('I will buy some vegetables if I go to the market.','If I go to the market, I''ll buy some vegetables.')),
    jsonb_build_object('number',79,'question',E'다음 우리말을 영어로 영작하시오.\n\n당신이 강해지고 싶다면, 매일 운동하세요.\n\n[단어: strong, every day]','options',jsonb_build_array(),'answer',E'If you want to be strong, exercise every day.','acceptedAnswers',jsonb_build_array('Exercise every day if you want to be strong.')),
    jsonb_build_object('number',80,'question',E'다음 우리말을 영어로 영작하시오.\n\n만약 친구의 거짓말을 발견한다면, 어떻게 할 것입니까?\n\n[단어: friend, lie, what]','options',jsonb_build_array(),'answer',E'If you discover your friend''s lie, what will you do?','acceptedAnswers',jsonb_build_array('What will you do if you discover your friend''s lie?','If you find your friend''s lie, what will you do?')),
    jsonb_build_object('number',81,'question',E'다음 우리말을 영어로 영작하시오.\n\n만약 당신이 저를 도와준다면, 당신은 약간의 보상을 받을 것입니다.\n\n[단어: have, reward]','options',jsonb_build_array(),'answer',E'If you help me, you will have some reward.','acceptedAnswers',jsonb_build_array('You will have some reward if you help me.','If you help me, you''ll have some reward.'))
  );

  a := jsonb_build_array(
    -- Part 1 (Q1-8)
    '1','3','2','2','3','3','1','2',
    -- Part 2 서술형 (Q9-18)
    'feel','press','freeze','stand','skips','harm','is','check','touches','will fly away',
    -- Part 2 객관식 (Q19-23)
    '1','1','2','2','2',
    -- Part 3 Set1 (Q24-29)
    '1','5','4','6','2','3',
    -- Part 3 Set2 (Q30-35)
    '5','3','1','6','2','4',
    -- Part 4 (Q36-40)
    'you leave the room','she finishes her homework','we will be there before dark','will discover','the coach invites him',
    -- Part 5 (Q41-46)
    'Unless we start early, we will miss the bus.','If it doesn''t snow, we will go hiking.','She will report them unless they return the money.','If you don''t practice, you won''t improve your skills.','Unless he finishes the report, the manager will be upset.','If you don''t want extra help, this textbook is enough for you.',
    -- Part 6 (Q47-61)
    '2','3','4','5','1','5','1','3','4','2','4','1','3','1','3',
    -- Part 7 서술형 (Q62-71)
    'will travel','stir','bake','melt','scratch','stretch','succeed','postpone','pack','eat',
    -- Part 7 객관식 (Q72-73)
    '1','1',
    -- Part 8 (Q74-81)
    'If it snows tomorrow, we will stay at home.','If you meet her, give her this letter.','If you skip lunch, you will eat more in the afternoon.','You will get a stomachache if you eat too much ice cream.','If I go to the market, I will buy some vegetables.','If you want to be strong, exercise every day.','If you discover your friend''s lie, what will you do?','If you help me, you will have some reward.'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('접속사 if Step1', '접속사 if', q, a, 'problem', 'interactive');

  RAISE NOTICE '접속사 if Step1 템플릿 생성 완료 (81문제)';
END;
$$;
