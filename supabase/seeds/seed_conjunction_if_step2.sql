-- 접속사 if Step2 50문제 (패러프레이즈)
DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = '접속사 if Step2';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 1: 빈칸 선택 (Q1-Q5) 객관식 5지선다
    -- ═══════════════════════════════════════
    -- #1 (원본 Q2): 빈칸에 적절한 단어 선택
    jsonb_build_object('number',1,'question',E'다음 문장의 빈칸에 들어갈 말로 가장 적절한 것은?\n\nIf we leave the milk outside for too long, it will ________. We should keep it in the fridge.','options',jsonb_build_array('go right','go bad','do well','do bad','make good'),'answer','2'),

    -- #2 (원본 Q3): 빈칸에 적절한 if절 선택
    jsonb_build_object('number',2,'question',E'다음 문장의 빈칸에 들어갈 말로 가장 적절한 것은?\n\n__________________, you will feel more energetic throughout the day.','options',jsonb_build_array('If you turn left','If you catch a cold','If you pass the test','If you exercise regularly','If you skip lunch'),'answer','4'),

    -- #3 (원본 Q5): 빈칸에 적절한 if절 선택
    jsonb_build_object('number',3,'question',E'다음 문장의 빈칸에 들어갈 말로 가장 적절한 것은?\n\n__________________, you can get a high score on the test.','options',jsonb_build_array('If you study hard','If you will study hard','If you don''t study hard','Unless you study hard','Unless you will study hard'),'answer','1'),

    -- #4 (원본 Q7): 빈칸에 들어갈 수 없는 것
    jsonb_build_object('number',4,'question',E'다음 문장의 빈칸에 들어갈 수 없는 것은?\n\nIf I complete this project, __________________.','options',jsonb_build_array('I will celebrate with my friends','I will take a vacation','I will start working on this project','I will go to a restaurant','I will buy myself a present'),'answer','3'),

    -- #5 (원본 Q8): 공통 빈칸 접속사 선택
    jsonb_build_object('number',5,'question',E'다음 문장의 빈칸에 공통으로 들어갈 말로 가장 적절한 것은?\n\n• I wonder _______ she is coming to the party tonight.\n• You will succeed _______ you work hard enough.','options',jsonb_build_array('if','as','before','because','although'),'answer','1'),

    -- ═══════════════════════════════════════
    -- Part 2: 한→영 (A)(B) 동사 선택 (Q6-Q8)
    -- ═══════════════════════════════════════
    -- #6 (원본 Q9)
    jsonb_build_object('number',6,'question',E'다음 우리말을 영어로 옮길 때 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?\n\n이번 주말에 날씨가 맑으면 나는 가족과 캠핑을 갈 것이다.\n→ If the weather (A)_______ clear this weekend, I (B)_______ camping with my family.\n\n(A) / (B)','options',jsonb_build_array('is / go','is / will go','was / go','will be / go','will be / will go'),'answer','2'),

    -- #7 (원본 Q10)
    jsonb_build_object('number',7,'question',E'다음 우리말을 영어로 옮길 때 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?\n\n오늘 수업이 일찍 끝나면 나는 Alex와 농구를 하러 갈 것이다.\n→ If class (A)_______ early today, I (B)_______ to play basketball with Alex.\n\n(A) / (B)','options',jsonb_build_array('finish / go','finishes / go','finishes / will go','will finish / go','will finish / will go'),'answer','3'),

    -- #8 (원본 Q11)
    jsonb_build_object('number',8,'question',E'다음 우리말을 영어로 옮길 때 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?\n\n만약 네가 매일 충분한 물을 마시지 않으면, 너는 건강해지지 않을 것이다.\n→ (A)_______ you drink enough water every day, you (B)_______ healthy.\n\n(A) / (B)','options',jsonb_build_array('Unless / will not','If / won''t','Unless / won''t be','If / will not be','Unless / will be'),'answer','3')
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 3: 동사 형태 (A)(B) 선택 (Q9-Q11)
    -- ═══════════════════════════════════════
    -- #9 (원본 Q12)
    jsonb_build_object('number',9,'question',E'다음 문장의 빈칸 (A), (B)에 들어갈 동사로 가장 적절한 것은?\n\nIf it (A)_______ this weekend, we (B)_______ a movie at home.\n\n(A) / (B)','options',jsonb_build_array('rain / watch','rains / watches','will rain / watch','rains / will watch','will rain / will watch'),'answer','4'),

    -- #10 (원본 Q13)
    jsonb_build_object('number',10,'question',E'다음 문장의 빈칸 (A), (B)에 들어갈 괄호 속 동사의 형태가 가장 적절한 것은?\n\nIf she (A)_______(arrive) on time, we (B)_______(begin) the meeting right away.\n\n(A) / (B)','options',jsonb_build_array('will arrive / begin','arrives / begins','will arrive / will begin','arrive / will begin','arrives / will begin'),'answer','5'),

    -- #11 (원본 Q14)
    jsonb_build_object('number',11,'question',E'다음 문장의 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?\n\nIf you (A)_______ the instructions closely, you (B)_______ the task without mistakes.\n\n(A) / (B)','options',jsonb_build_array('will follow / will complete','will follow / complete','follow / complete','follow / will complete','will be followed / completed'),'answer','4'),

    -- ═══════════════════════════════════════
    -- Part 4: 빈칸 (A)(B)(C) 선택 (Q12)
    -- ═══════════════════════════════════════
    -- #12 (원본 Q15)
    jsonb_build_object('number',12,'question',E'다음 문장의 빈칸 (A), (B), (C)에 들어갈 말로 가장 적절한 것은?\n\n• If she (A)_______ the answer, she will tell us immediately.\n• If you drink enough water, you (B)_______ feel much better.\n• If you (C)_______ hurry up, you will miss the bus.\n\n(A) / (B) / (C)','options',jsonb_build_array('knows / can / won''t','knows / will / don''t','to know / can / can''t','will know / don''t / won''t','will know / should / won''t'),'answer','2'),

    -- ═══════════════════════════════════════
    -- Part 5: 서술형 문장 전환 (Q13)
    -- ═══════════════════════════════════════
    -- #13 (원본 Q16)
    jsonb_build_object('number',13,'question',E'다음 두 문장이 같은 뜻이 되도록, 빈칸에 들어갈 알맞은 말을 쓰시오.\n\nWalk faster, and you''ll arrive on time.\n= _______ faster, you will arrive on time.','options',jsonb_build_array(),'answer','If you walk','acceptedAnswers',jsonb_build_array('If you walk')),

    -- ═══════════════════════════════════════
    -- Part 6: 영작 선택 (Q14-Q15)
    -- ═══════════════════════════════════════
    -- #14 (원본 Q17)
    jsonb_build_object('number',14,'question',E'다음 우리말을 바르게 영작한 것은?\n\n네가 필요하면 나는 너를 기다릴 수 있어.','options',jsonb_build_array('I can wait for you if you need.','I wait for you if you need.','I can wait for you if you will need.','I will wait for you if you can need.','I will wait for you if you will need.'),'answer','1'),

    -- #15 (원본 Q18)
    jsonb_build_object('number',15,'question',E'다음 우리말과 일치하도록 어법에 맞게 영작한 것은?\n\n만약 내일 눈이 내리지 않는다면, 우리는 등산을 갈 것이다.','options',jsonb_build_array('If it do not snow tomorrow, we will go hiking.','If it will not snow tomorrow, we will go hiking.','If it does not snow tomorrow, we will go hiking.','We go hiking if it do not snow tomorrow.','We go hiking if it will not snow tomorrow.'),'answer','3')
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 7: 한→영 올바른 번역 (Q16)
    -- ═══════════════════════════════════════
    -- #16 (원본 Q19)
    jsonb_build_object('number',16,'question',E'다음 중 우리말을 영어로 바르게 옮긴 것은?\n\n① 만약 내가 이 과제를 끝내면 너와 놀러 갈 수 있어.\n   → If I finish this assignment, I can hang out with you.\n② 만약 네가 그것을 혼자 들 수 없다면, 내가 도와줄게.\n   → I will help you if you will not lift it alone.\n③ 만약 네가 지금 서두르지 않으면 버스를 놓칠 거야.\n   → If you won''t hurry now, you''ll miss the bus.\n④ 만약 내일 바람이 불면, 우리는 연을 날릴 것이다.\n   → If it blow tomorrow, we''ll fly a kite.\n⑤ 만약 그녀가 오늘 저녁을 먹지 않으면, 밤에 배가 고플 것이다.\n   → She is hungry if she doesn''t eat dinner tonight.','options',jsonb_build_array('①','②','③','④','⑤'),'answer','1'),

    -- ═══════════════════════════════════════
    -- Part 8: 자연스러운/부자연스러운 문장 (Q17-Q18)
    -- ═══════════════════════════════════════
    -- #17 (원본 Q20): 의미가 가장 자연스러운 문장
    jsonb_build_object('number',17,'question',E'다음 중 의미가 가장 자연스러운 문장은?','options',jsonb_build_array('If I study every day, I will fail the exam.','If she practices piano, she will improve her skills.','If we eat healthy food, we will get sick.','If he runs fast, he will lose the race.','If the weather is sunny, we can''t go outside.'),'answer','2'),

    -- #18 (원본 Q21): 의미가 자연스럽지 않은 문장
    jsonb_build_object('number',18,'question',E'다음 중 의미가 가장 자연스럽지 않은 문장은?','options',jsonb_build_array('If we leave early, we will arrive on time.','If it is warm, we will go to the beach.','If you study hard, you can pass the exam.','If you exercise every day, you won''t become healthy.','If the bag is light, I will carry it for you.'),'answer','4'),

    -- ═══════════════════════════════════════
    -- Part 9: 어법 판단 — 옳은 문장 (Q19-Q22)
    -- ═══════════════════════════════════════
    -- #19 (원본 Q22): 어법상 옳은 문장
    jsonb_build_object('number',19,'question',E'다음 중 어법상 옳은 문장은?','options',jsonb_build_array('I will visit my grandmother if the weather is nice.','If she won''t finish now, she miss the deadline.','He will win the prize if he will try harder.','If he arrive early, I''ll prepare breakfast.','If I hurry, I am at school on time.'),'answer','1'),

    -- #20 (원본 Q24): 어법상 옳은 문장
    jsonb_build_object('number',20,'question',E'다음 중 어법상 옳은 문장은?','options',jsonb_build_array('Unless he is smart, he is able to pass the exam.','If you don''t leave now, you will miss the train.','If it will snow tonight, the game won''t be played.','Unless you read carefully, you should correct it.','Unless you will practice, you are not be good.'),'answer','2'),

    -- #21 (원본 Q27): 어법상 옳은 문장
    jsonb_build_object('number',21,'question',E'다음 중 어법상 옳은 문장은?','options',jsonb_build_array('Ice melts if the temperature goes above 0℃.','I will stay indoors if it will be windy tomorrow.','If you will feel tired later, I''ll drive you home.','If the teacher arrive late, we won''t start on time.','If I don''t eat lunch, I will always feel sleepy in the afternoon.'),'answer','1'),

    -- #22 (원본 Q28): 어법상 옳은 문장
    jsonb_build_object('number',22,'question',E'다음 중 어법상 옳은 문장은?','options',jsonb_build_array('I can''t tell if it rains tomorrow.','Do you know if he comes next week?','I''ll go to the beach if I have some free time.','We don''t know if he joins the club or not.','I''ll play soccer with my friends if it will be sunny.'),'answer','3')
  )
  ||
  jsonb_build_array(
    -- Part 9 continued: 어법 판단 — 어색한 문장 (Q23-Q32)

    -- #23 (원본 Q29): 어법상 어색한 문장
    jsonb_build_object('number',23,'question',E'다음 중 어법상 어색한 문장은?','options',jsonb_build_array('If he needs help, I will assist him.','If it is broken, you''ll have to fix it.','We go to the park if it doesn''t snow this weekend.','If you stay up late tonight, you will be exhausted tomorrow.','Why don''t you ask her if you want to know the answer?'),'answer','3'),

    -- #24 (원본 Q30): 어법상 어색한 문장
    jsonb_build_object('number',24,'question',E'다음 중 어법상 어색한 문장은?','options',jsonb_build_array('I will call him if he arrives at the station.','If I become a teacher, I''ll help students learn better.','If they see the results, they will be surprised.','If you will complete the project, what do you do?','If you skip a lesson, Mr. Park will contact your parents.'),'answer','4'),

    -- #25 (원본 Q31): 어법상 옳은 문장
    jsonb_build_object('number',25,'question',E'다음 중 어법상 옳은 문장은?','options',jsonb_build_array('Don''t criticize me if you won''t understand the situation.','If it be cold tomorrow, we''ll stay indoors.','If you practice every day, you improved your skills.','If I will pass the test, my parents will be proud.','They will join the game if the meeting ends early.'),'answer','5'),

    -- #26 (원본 Q32): 밑줄 친 if가 올바르게 쓰인 문장
    jsonb_build_object('number',26,'question',E'다음 중 밑줄 친 if가 올바르게 쓰인 문장은?','options',jsonb_build_array('I ate it if she cooked it for me.','I didn''t study if the subject was boring.','He was praised if he had good results.','I chose the book if I thought it was interesting.','You will achieve your goal if you never give up.'),'answer','5'),

    -- #27 (원본 Q33): 밑줄 친 부분이 어법상 어색한 것
    jsonb_build_object('number',27,'question',E'다음 중 밑줄 친 부분이 어법상 어색한 것은?','options',jsonb_build_array('If it snows, I won''t drive.','You can eat lunch if you feel hungry.','If you go straight, you can find the library.','The coach informed Jake if he was slow.','If we take the bus, we''ll arrive on time.'),'answer','4'),

    -- #28 (원본 Q34): 밑줄 친 부분이 어법상 어색한 것
    jsonb_build_object('number',28,'question',E'다음 중 밑줄 친 부분이 어법상 어색한 것은?','options',jsonb_build_array('If it rains heavily, I usually stay at home.','If there is no milk, I will drink water.','If we will start now, we can finish by noon.','If you don''t eat breakfast, you''ll feel tired soon.','If the class ends early, Tom will go to the gym.'),'answer','3'),

    -- #29 (원본 Q36): 어법상 어색한 문장
    jsonb_build_object('number',29,'question',E'다음 중 어법상 어색한 문장은?','options',jsonb_build_array('You can borrow the book if you want.','If it will be cold and windy tomorrow, I usually wear a thick coat.','If it is foggy, I usually drive slowly.','If I find some coins, I''ll buy a snack.','If practice ends early, I usually read books at home.'),'answer','2'),

    -- #30 (원본 Q38): 어법상 어색한 문장
    jsonb_build_object('number',30,'question',E'다음 중 어법상 어색한 문장은?','options',jsonb_build_array('If I don''t hurry, I will miss the bus.','If he is sick, he won''t attend school.','If we walk there, it will be free.','If it will snow tonight, I will stay indoors.','If you study hard, you can get a scholarship.'),'answer','4'),

    -- #31 (원본 Q40): 어법상 어색한 문장
    jsonb_build_object('number',31,'question',E'다음 중 어법상 어색한 문장은?','options',jsonb_build_array('If it is warm tomorrow, we will have a barbecue.','If you register early, you can choose your seat.','She will fail the course unless she will submit the report now.','If he catches the express train, he will arrive before noon.','Unless you bring an umbrella, you will get wet.'),'answer','3'),

    -- #32 (원본 Q42): 어법상 어색한 문장
    jsonb_build_object('number',32,'question',E'다음 중 어법상 어색한 문장은?','options',jsonb_build_array('If it snows tonight, I will wear a warm coat.','If you swim every day, you will become stronger.','Mina will go shopping if her class will end early today.','Jason will be able to join the team if he passes the tryout.','If Brian does not wake up now, he will be late for school.'),'answer','3')
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 10: If 조건절 vs 명사절 구분 (Q33-Q38)
    -- ═══════════════════════════════════════
    -- #33 (원본 Q43): if 쓰임이 다른 하나
    jsonb_build_object('number',33,'question',E'다음 중 밑줄 친 if의 쓰임이 다른 하나는?','options',jsonb_build_array('I will make some tea if you come to my house.','If you don''t study, you''ll fail the test.','I''d like to join you if you don''t mind.','If I lend you the money, will you pay me back?','I don''t know if she likes chocolate.'),'answer','5'),

    -- #34 (원본 Q46): if 쓰임이 다른 하나
    jsonb_build_object('number',34,'question',E'다음 중 밑줄 친 if의 쓰임이 다른 하나는?','options',jsonb_build_array('If I go to the bakery, I''ll buy some bread.','He asked me if he could borrow my phone.','They will have a picnic if it is clear tomorrow.','You will gain weight if you don''t eat well.','If you solve the puzzle, you will get a reward.'),'answer','2'),

    -- #35 (원본 Q48): if 쓰임이 다른 하나
    jsonb_build_object('number',35,'question',E'다음 중 밑줄 친 if의 쓰임이 다른 하나는?','options',jsonb_build_array('I''m not sure if she will come to the meeting.','If you don''t practice, you''ll lose the match.','If I visit the store, I will buy some supplies.','You cannot enter if you don''t have a password.','They will go hiking if the sky is clear tomorrow.'),'answer','1'),

    -- #36 (원본 Q49): if 쓰임이 다른 하나
    jsonb_build_object('number',36,'question',E'다음 중 밑줄 친 if의 쓰임이 다른 하나는?','options',jsonb_build_array('If it is cold tomorrow, we will not go swimming.','If we don''t start now, we will miss the deadline.','I don''t know if they will accept the offer.','If we pick a different route, we won''t be late.','If it is sunny this weekend, I will go cycling.'),'answer','3'),

    -- #37 (원본 Q50): if 쓰임이 다른 하나
    jsonb_build_object('number',37,'question',E'다음 중 밑줄 친 if의 쓰임이 다른 하나는?','options',jsonb_build_array('I don''t know if she will arrive on time.','Can you tell me if the meeting is at 3 PM?','She wanted to know if he had finished the work.','Do you know if they will come to the party?','I will go jogging if the weather is nice tomorrow.'),'answer','5'),

    -- #38 (원본 Q51): <보기>와 쓰임이 다른 것
    jsonb_build_object('number',38,'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 다른 것은?\n\n<보기> If you practice every day, you''ll get better.','options',jsonb_build_array('I will feel relieved if you help me.','No one knows if he will win the award.','She will pass the test if she reviews more.','You will meet him if you go to the library.','Is it OK if I use your computer?'),'answer','2')
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 11: 어법 오류 수정 서술형 (Q39-Q41)
    -- ═══════════════════════════════════════
    -- #39 (중상): if절 will → 현재시제
    jsonb_build_object('number',39,'question',E'다음 문장에서 어법상 틀린 부분을 찾아 올바르게 고쳐 쓰시오.\n\nIf she will study hard, she can pass the exam.','options',jsonb_build_array(),'answer',E'she studies hard','acceptedAnswers',jsonb_build_array('she studies hard','she studies','studies')),

    -- #40 (중상): 주절 시제 오류
    jsonb_build_object('number',40,'question',E'다음 문장에서 어법상 틀린 부분을 찾아 올바르게 고쳐 쓰시오.\n\nIf you mix red and blue, you will got purple.','options',jsonb_build_array(),'answer',E'will get','acceptedAnswers',jsonb_build_array('will get','you will get','you will get purple')),

    -- #41 (상): unless + 이중부정 수정
    jsonb_build_object('number',41,'question',E'다음 문장에서 어법상 틀린 부분을 찾아 올바르게 고쳐 쓰시오.\n\nUnless you don''t finish your homework, you can''t go outside.','options',jsonb_build_array(),'answer',E'Unless you finish','acceptedAnswers',jsonb_build_array('Unless you finish','Unless you finish your homework','If you don''t finish your homework')),

    -- ═══════════════════════════════════════
    -- Part 12: unless↔if 전환 서술형 (Q42-Q43)
    -- ═══════════════════════════════════════
    -- #42 (중상): if not → unless
    jsonb_build_object('number',42,'question',E'다음 문장을 unless를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nIf you don''t wear a coat, you will catch a cold.','options',jsonb_build_array(),'answer',E'Unless you wear a coat, you will catch a cold.','acceptedAnswers',jsonb_build_array('Unless you wear a coat, you''ll catch a cold.')),

    -- #43 (중상): unless → if not
    jsonb_build_object('number',43,'question',E'다음 문장을 if를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nUnless he apologizes, I won''t forgive him.','options',jsonb_build_array(),'answer',E'If he doesn''t apologize, I won''t forgive him.','acceptedAnswers',jsonb_build_array('If he does not apologize, I won''t forgive him.','If he doesn''t apologize, I will not forgive him.')),

    -- ═══════════════════════════════════════
    -- Part 13: 영작 서술형 (Q44-Q45)
    -- ═══════════════════════════════════════
    -- #44 (중상)
    jsonb_build_object('number',44,'question',E'다음 우리말을 영어로 영작하시오.\n\n만약 네가 서두르면, 우리는 제시간에 도착할 수 있어.\n\n[단어: hurry, arrive, on time]','options',jsonb_build_array(),'answer',E'If you hurry, we can arrive on time.','acceptedAnswers',jsonb_build_array('We can arrive on time if you hurry.')),

    -- #45 (상)
    jsonb_build_object('number',45,'question',E'다음 우리말을 영어로 영작하시오.\n\n만약 내일 날씨가 좋지 않으면, 우리는 실내에서 운동할 것이다.\n\n[단어: weather, not, good, exercise, indoors]','options',jsonb_build_array(),'answer',E'If the weather is not good tomorrow, we will exercise indoors.','acceptedAnswers',jsonb_build_array('We will exercise indoors if the weather is not good tomorrow.','If the weather isn''t good tomorrow, we''ll exercise indoors.')),

    -- ═══════════════════════════════════════
    -- Part 14: unless (A)(B) 객관식 (Q46)
    -- ═══════════════════════════════════════
    -- #46 (중)
    jsonb_build_object('number',46,'question',E'다음 문장의 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?\n\n(A)_______ you wear a helmet, you (B)_______ ride the bicycle.\n\n(A) / (B)','options',jsonb_build_array('If / won''t','Unless / won''t','Unless / will','If / will not be','Unless / can'),'answer','2'),

    -- ═══════════════════════════════════════
    -- Part 15: 문장 배열 서술형 (Q47-Q48)
    -- ═══════════════════════════════════════
    -- #47 (중상)
    jsonb_build_object('number',47,'question',E'주어진 단어를 올바른 순서로 배열하여 문장을 완성하시오.\n\nif / rains / it / tomorrow / , / I / will / stay / at / home','options',jsonb_build_array(),'answer',E'If it rains tomorrow, I will stay at home.','acceptedAnswers',jsonb_build_array('I will stay at home if it rains tomorrow.')),

    -- #48 (상)
    jsonb_build_object('number',48,'question',E'주어진 단어를 올바른 순서로 배열하여 문장을 완성하시오.\n\nunless / you / finish / your / homework / , / you / can''t / go / outside','options',jsonb_build_array(),'answer',E'Unless you finish your homework, you can''t go outside.','acceptedAnswers',jsonb_build_array('You can''t go outside unless you finish your homework.')),

    -- ═══════════════════════════════════════
    -- Part 16: 모두 고르기 (Q49-Q50)
    -- ═══════════════════════════════════════
    -- #49 (상): 어법 옳은 문장 모두 고르기
    jsonb_build_object('number',49,'question',E'다음 중 어법상 옳은 문장을 모두 고르시오.','options',jsonb_build_array('If you heat water to 100℃, it boils.','If she will come early, we can start the meeting.','We will cancel the trip if it rains heavily.','If you don''t water the plants, they will die.','Unless you will be quiet, the baby won''t sleep.'),'answer','1,3,4'),

    -- #50 (상): if 명사절 모두 고르기
    jsonb_build_object('number',50,'question',E'다음 중 밑줄 친 if가 "~인지 아닌지"의 뜻으로 쓰인 것을 모두 고르시오.','options',jsonb_build_array('I wonder if he passed the exam.','If you press this button, the door will open.','Do you know if the store is open today?','If it snows, we will build a snowman.','I''m curious if she received my message.'),'answer','1,3,5')
  );

  a := jsonb_build_array(
    -- Part 1 (Q1-5)
    '2','4','1','3','1',
    -- Part 2 (Q6-8)
    '2','3','3',
    -- Part 3 (Q9-11)
    '4','5','4',
    -- Part 4 (Q12)
    '2',
    -- Part 5 서술형 (Q13)
    'If you walk',
    -- Part 6 (Q14-15)
    '1','3',
    -- Part 7 (Q16)
    '1',
    -- Part 8 (Q17-18)
    '2','4',
    -- Part 9 (Q19-32)
    '1','2','1','3','3','4','5','5','4','3','2','4','3','3',
    -- Part 10 (Q33-38)
    '5','2','1','3','5','2',
    -- Part 11 어법 오류 수정 (Q39-41)
    'she studies hard','will get','Unless you finish',
    -- Part 12 unless↔if 전환 (Q42-43)
    'Unless you wear a coat, you will catch a cold.','If he doesn''t apologize, I won''t forgive him.',
    -- Part 13 영작 (Q44-45)
    'If you hurry, we can arrive on time.','If the weather is not good tomorrow, we will exercise indoors.',
    -- Part 14 unless (A)(B) (Q46)
    '2',
    -- Part 15 문장 배열 (Q47-48)
    'If it rains tomorrow, I will stay at home.','Unless you finish your homework, you can''t go outside.',
    -- Part 16 모두 고르기 (Q49-50)
    '1,3,4','1,3,5'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('접속사 if Step2', '접속사 if', q, a, 'problem', 'interactive');

  RAISE NOTICE '접속사 if Step2 템플릿 생성 완료 (50문제)';
END;
$$;
