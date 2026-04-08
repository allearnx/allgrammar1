-- 명사절 접속사 if Step1 80문제
DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title IN ('접속사 if Step1', '명사절 접속사 if Step1');

  q := jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 1: 빈칸 채우기 객관식 5지선다 (Q1-Q10)
    -- 알맞은 접속사 고르기 — if/that/what/whether 등
    -- ═══════════════════════════════════════
    jsonb_build_object('number',1,'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nI wonder (     ) she likes pizza or not.','options',jsonb_build_array('that','what','if','which','who'),'answer','3'),
    jsonb_build_object('number',2,'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nDo you know (     ) the library is open today?','options',jsonb_build_array('what','who','which','if','where'),'answer','4'),
    jsonb_build_object('number',3,'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nShe asked me (     ) I had finished my homework.','options',jsonb_build_array('what','that','who','which','if'),'answer','5'),
    jsonb_build_object('number',4,'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nI''m not sure (     ) he is telling the truth.','options',jsonb_build_array('who','if','what','which','where'),'answer','2'),
    jsonb_build_object('number',5,'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nCan you check (     ) the door is locked?','options',jsonb_build_array('what','which','who','where','if'),'answer','5'),
    jsonb_build_object('number',6,'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nWe don''t know (     ) the concert will be canceled.','options',jsonb_build_array('if','what','who','which','where'),'answer','1'),
    jsonb_build_object('number',7,'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nHe doubts (     ) his team can win the final game.','options',jsonb_build_array('what','who','where','if','which'),'answer','4'),
    jsonb_build_object('number',8,'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nPlease tell me (     ) you are coming to the party tonight.','options',jsonb_build_array('what','if','who','which','where'),'answer','2'),
    jsonb_build_object('number',9,'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nI can''t remember (     ) I turned off the oven before leaving.','options',jsonb_build_array('what','who','which','where','if'),'answer','5'),
    jsonb_build_object('number',10,'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nShe is curious (     ) her brother will join the school band.','options',jsonb_build_array('if','what','who','which','where'),'answer','1'),

    -- ═══════════════════════════════════════
    -- Part 2: 밑줄 해석 객관식 (Q11-Q20)
    -- 밑줄 친 if의 올바른 해석 고르기
    -- 명사절 if = ~인지 아닌지, 부사절 if = ~하면
    -- ═══════════════════════════════════════
    jsonb_build_object('number',11,'question',E'다음 밑줄 친 if의 의미로 알맞은 것을 고르시오.\n\nI don''t know _if_ he is honest.','options',jsonb_build_array('~하면','~인지 아닌지','~때문에','~임에도 불구하고','~할 때'),'answer','2'),
    jsonb_build_object('number',12,'question',E'다음 밑줄 친 if의 의미로 알맞은 것을 고르시오.\n\n_If_ it rains tomorrow, we will stay home.','options',jsonb_build_array('~인지 아닌지','~할 때','~하면','~때문에','~임에도 불구하고'),'answer','3'),
    jsonb_build_object('number',13,'question',E'다음 밑줄 친 if의 의미로 알맞은 것을 고르시오.\n\nShe wonders _if_ the store sells fresh bread.','options',jsonb_build_array('~하면','~때문에','~할 때','~인지 아닌지','~임에도 불구하고'),'answer','4'),
    jsonb_build_object('number',14,'question',E'다음 밑줄 친 if의 의미로 알맞은 것을 고르시오.\n\n_If_ you study hard, you will pass the test.','options',jsonb_build_array('~인지 아닌지','~하면','~때문에','~할 때','~임에도 불구하고'),'answer','2'),
    jsonb_build_object('number',15,'question',E'다음 밑줄 친 if의 의미로 알맞은 것을 고르시오.\n\nPlease ask him _if_ he can come to the meeting.','options',jsonb_build_array('~하면','~할 때','~인지 아닌지','~때문에','~임에도 불구하고'),'answer','3'),
    jsonb_build_object('number',16,'question',E'다음 밑줄 친 if의 의미로 알맞은 것을 고르시오.\n\nWe are unsure _if_ the bus has already left.','options',jsonb_build_array('~하면','~인지 아닌지','~할 때','~때문에','~임에도 불구하고'),'answer','2'),
    jsonb_build_object('number',17,'question',E'다음 밑줄 친 if의 의미로 알맞은 것을 고르시오.\n\nYou will feel cold _if_ you don''t wear a coat.','options',jsonb_build_array('~인지 아닌지','~때문에','~하면','~할 때','~임에도 불구하고'),'answer','3'),
    jsonb_build_object('number',18,'question',E'다음 밑줄 친 if의 의미로 알맞은 것을 고르시오.\n\nI want to find out _if_ this recipe works well.','options',jsonb_build_array('~하면','~할 때','~때문에','~임에도 불구하고','~인지 아닌지'),'answer','5'),
    jsonb_build_object('number',19,'question',E'다음 밑줄 친 if의 의미로 알맞은 것을 고르시오.\n\nHe checked _if_ his name was on the list.','options',jsonb_build_array('~인지 아닌지','~하면','~할 때','~때문에','~임에도 불구하고'),'answer','1'),
    jsonb_build_object('number',20,'question',E'다음 밑줄 친 if의 의미로 알맞은 것을 고르시오.\n\n_If_ you are hungry, there is some food in the kitchen.','options',jsonb_build_array('~인지 아닌지','~때문에','~임에도 불구하고','~할 때','~하면'),'answer','5')
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 3: 명사절/부사절 구별 객관식 (Q21-Q35)
    -- "밑줄 친 if의 쓰임이 나머지와 다른 것을 고르시오"
    -- ═══════════════════════════════════════
    jsonb_build_object('number',21,'question',E'다음 밑줄 친 if의 쓰임이 나머지와 다른 것을 고르시오.','options',jsonb_build_array('I wonder if she passed the exam.','He asked if I wanted some water.','She doesn''t know if the movie is good.','If you press this button, the light turns on.','I''m curious if they arrived safely.'),'answer','4'),
    jsonb_build_object('number',22,'question',E'다음 밑줄 친 if의 쓰임이 나머지와 다른 것을 고르시오.','options',jsonb_build_array('If the weather is nice, let''s go outside.','If you don''t hurry, you''ll be late.','If she calls, tell her I''m busy.','I doubt if this answer is correct.','If he studies more, he will improve.'),'answer','4'),
    jsonb_build_object('number',23,'question',E'다음 밑줄 친 if의 쓰임이 나머지와 다른 것을 고르시오.','options',jsonb_build_array('Do you know if the teacher is here?','I forgot if I locked the front door.','Please check if the oven is off.','We wonder if they sell tickets online.','If it snows, school will be closed.'),'answer','5'),
    jsonb_build_object('number',24,'question',E'다음 밑줄 친 if의 쓰임이 나머지와 다른 것을 고르시오.','options',jsonb_build_array('If you eat too much candy, you''ll get a cavity.','I want to know if the train has left.','If you mix red and blue, you get purple.','If she is free, she will help us.','If it''s cold outside, wear a scarf.'),'answer','2'),
    jsonb_build_object('number',25,'question',E'다음 밑줄 친 if의 쓰임이 나머지와 다른 것을 고르시오.','options',jsonb_build_array('She asked if I could lend her a pencil.','He wonders if the game will be fun.','Tell me if you need any help.','I''m not sure if she likes cats.','Nobody knows if the rumor is true.'),'answer','3'),
    jsonb_build_object('number',26,'question',E'다음 밑줄 친 if의 쓰임이 나머지와 다른 것을 고르시오.','options',jsonb_build_array('I wonder if he will call me tonight.','They asked if we wanted to join them.','If you practice hard, you''ll win the match.','She doesn''t know if the store is still open.','He doubts if the story is real.'),'answer','3'),
    jsonb_build_object('number',27,'question',E'다음 밑줄 친 if의 쓰임이 나머지와 다른 것을 고르시오.','options',jsonb_build_array('If you run fast, you can catch the bus.','If you water the plants, they''ll grow well.','If he apologizes, I will forgive him.','If you touch that wire, you''ll get a shock.','Can you check if the printer is working?'),'answer','5'),
    jsonb_build_object('number',28,'question',E'다음 밑줄 친 if의 쓰임이 나머지와 다른 것을 고르시오.','options',jsonb_build_array('I''m curious if the new student is friendly.','He can''t decide if he should go or stay.','She noticed if anyone was watching her.','We''re unsure if the answer is right.','If you leave now, you won''t miss the train.'),'answer','5'),
    jsonb_build_object('number',29,'question',E'다음 밑줄 친 if의 쓰임이 나머지와 다른 것을 고르시오.','options',jsonb_build_array('If the alarm rings, leave the building quickly.','I need to find out if she got my message.','If you don''t eat breakfast, you''ll be tired.','If they finish early, they can play outside.','If you are sick, you should rest at home.'),'answer','2'),
    jsonb_build_object('number',30,'question',E'다음 밑줄 친 if의 쓰임이 나머지와 다른 것을 고르시오.','options',jsonb_build_array('He wondered if the museum was open on Sundays.','I asked if she needed a ride home.','Do you know if they have a pet?','Please find out if the flight is delayed.','If you wash your hands, you''ll stay healthy.'),'answer','5'),
    jsonb_build_object('number',31,'question',E'다음 밑줄 친 if의 쓰임이 나머지와 다른 것을 고르시오.','options',jsonb_build_array('She wonders if the cookies are ready.','If you boil water, it becomes steam.','He doesn''t know if the road is safe.','I doubt if this plan will succeed.','We can''t tell if the fruit is fresh.'),'answer','2'),
    jsonb_build_object('number',32,'question',E'다음 밑줄 친 if의 쓰임이 나머지와 다른 것을 고르시오.','options',jsonb_build_array('If you keep trying, you''ll get better.','If he works hard, he can earn more money.','If you stand in the rain, you''ll get wet.','I want to see if my friend passed the test.','If she listens carefully, she''ll understand.'),'answer','4'),
    jsonb_build_object('number',33,'question',E'다음 밑줄 친 if의 쓰임이 나머지와 다른 것을 고르시오.','options',jsonb_build_array('She remembers if she brought her umbrella.','He forgot if the meeting was at three.','I''m not certain if my answer is correct.','If you break the rule, you''ll be punished.','They wonder if the park is crowded.'),'answer','4'),
    jsonb_build_object('number',34,'question',E'다음 밑줄 친 if의 쓰임이 나머지와 다른 것을 고르시오.','options',jsonb_build_array('I asked the teacher if we had homework.','She questioned if the news was accurate.','He wants to know if the gym is open.','If you drink enough water, you''ll feel better.','We doubt if the rumor is true.'),'answer','4'),
    jsonb_build_object('number',35,'question',E'다음 밑줄 친 if의 쓰임이 나머지와 다른 것을 고르시오.','options',jsonb_build_array('If you save money, you can buy a new phone.','Can you tell me if the bus stops here?','I need to check if my email was sent.','She wonders if her dad will cook tonight.','He asked if I could help him move.'),'answer','1')
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 4: 빈칸에 알맞은 말 객관식 (Q36-Q45)
    -- 문장 또는 절 단위로 빈칸 채우기
    -- ═══════════════════════════════════════
    jsonb_build_object('number',36,'question',E'다음 빈칸에 들어갈 말로 알맞은 것을 고르시오.\n\nCan you find out ______?','options',jsonb_build_array('if the store closes at nine','what the store closes','the store if closes at nine','if closes the store at nine','that if the store closes'),'answer','1'),
    jsonb_build_object('number',37,'question',E'다음 빈칸에 들어갈 말로 알맞은 것을 고르시오.\n\nI wonder ______.','options',jsonb_build_array('if will it rain tomorrow','if it will rain tomorrow','that it will rain tomorrow','it will rain if tomorrow','will it rain if tomorrow'),'answer','2'),
    jsonb_build_object('number',38,'question',E'다음 빈칸에 들어갈 말로 알맞은 것을 고르시오.\n\nShe doesn''t know ______.','options',jsonb_build_array('if can she trust him','that she can trust him if','if she can trust him','she can if trust him','if trust she can him'),'answer','3'),
    jsonb_build_object('number',39,'question',E'다음 빈칸에 들어갈 말로 알맞은 것을 고르시오.\n\nHe asked me ______.','options',jsonb_build_array('if I have finished the project','if had I finished the project','that I finished the project if','if I had finished the project','I had finished if the project'),'answer','4'),
    jsonb_build_object('number',40,'question',E'다음 빈칸에 들어갈 말로 알맞은 것을 고르시오.\n\nWe need to decide ______.','options',jsonb_build_array('that we should join the club','if should we join the club','if we should join the club','we should if join the club','should we join if the club'),'answer','3'),
    jsonb_build_object('number',41,'question',E'다음 빈칸에 들어갈 말로 알맞은 것을 고르시오.\n\nPlease check ______.','options',jsonb_build_array('if are the windows closed','the windows if closed','if the windows are closed','that if are the windows closed','closed if the windows are'),'answer','3'),
    jsonb_build_object('number',42,'question',E'다음 빈칸에 들어갈 말로 알맞은 것을 고르시오.\n\nDo you remember ______?','options',jsonb_build_array('if did you lock the door','if you locked the door','you locked if the door','that you locked if the door','if locked you the door'),'answer','2'),
    jsonb_build_object('number',43,'question',E'다음 빈칸에 들어갈 말로 알맞은 것을 고르시오.\n\nI''m curious ______.','options',jsonb_build_array('if will she accept our invitation','she will accept if our invitation','if she will accept our invitation','that she will if accept our invitation','will she if accept our invitation'),'answer','3'),
    jsonb_build_object('number',44,'question',E'다음 빈칸에 들어갈 말로 알맞은 것을 고르시오.\n\nNobody understands ______.','options',jsonb_build_array('if is he serious about the plan','if he is serious about the plan','he is if serious about the plan','that if is he serious','if serious he is about the plan'),'answer','2'),
    jsonb_build_object('number',45,'question',E'다음 빈칸에 들어갈 말로 알맞은 것을 고르시오.\n\nThey couldn''t figure out ______.','options',jsonb_build_array('the machine if was broken','if was the machine broken','that the machine was if broken','if the machine was broken','was the machine if broken'),'answer','4')
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 5: 서술형 빈칸 채우기 (Q46-Q55)
    -- 빈칸에 알맞은 단어 또는 짧은 표현 쓰기
    -- ═══════════════════════════════════════
    jsonb_build_object('number',46,'question',E'다음 빈칸에 알맞은 한 단어를 쓰시오.\n\nI''m not sure ______ he lives near the school.','options',jsonb_build_array(),'answer','if','acceptedAnswers',jsonb_build_array('whether')),
    jsonb_build_object('number',47,'question',E'다음 빈칸에 알맞은 한 단어를 쓰시오.\n\nShe asked ______ I could help her with the dishes.','options',jsonb_build_array(),'answer','if','acceptedAnswers',jsonb_build_array('whether')),
    jsonb_build_object('number',48,'question',E'다음 빈칸에 알맞은 한 단어를 쓰시오.\n\nWe wonder ______ the new teacher is strict.','options',jsonb_build_array(),'answer','if','acceptedAnswers',jsonb_build_array('whether')),
    jsonb_build_object('number',49,'question',E'다음 빈칸에 알맞은 한 단어를 쓰시오.\n\nDo you know ______ today is a holiday?','options',jsonb_build_array(),'answer','if','acceptedAnswers',jsonb_build_array('whether')),
    jsonb_build_object('number',50,'question',E'다음 괄호 안의 단어를 알맞은 형태로 쓰시오.\n\nShe wondered if he ______ (come) to the meeting the next day.','options',jsonb_build_array(),'answer','would come'),
    jsonb_build_object('number',51,'question',E'다음 괄호 안의 단어를 알맞은 형태로 쓰시오.\n\nI want to know if she ______ (finish) her homework yet.','options',jsonb_build_array(),'answer','has finished','acceptedAnswers',jsonb_build_array('has finished','finished')),
    jsonb_build_object('number',52,'question',E'다음 괄호 안의 단어를 알맞은 형태로 쓰시오.\n\nHe asked me if I ______ (like) chocolate ice cream.','options',jsonb_build_array(),'answer','liked'),
    jsonb_build_object('number',53,'question',E'다음 괄호 안의 단어를 알맞은 형태로 쓰시오.\n\nWe need to check if the bus ______ (arrive) on time every day.','options',jsonb_build_array(),'answer','arrives'),
    jsonb_build_object('number',54,'question',E'다음 빈칸에 알맞은 한 단어를 쓰시오.\n\nCan you tell me ______ this seat is taken?','options',jsonb_build_array(),'answer','if','acceptedAnswers',jsonb_build_array('whether')),
    jsonb_build_object('number',55,'question',E'다음 괄호 안의 단어를 알맞은 형태로 쓰시오.\n\nI don''t know if she ______ (be) at the library right now.','options',jsonb_build_array(),'answer','is')
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 6: 단어 배열 서술형 (Q56-Q65)
    -- 주어진 단어를 배열하여 올바른 문장 쓰기
    -- ═══════════════════════════════════════
    jsonb_build_object('number',56,'question',E'다음 주어진 단어를 올바르게 배열하여 문장을 완성하시오.\n\n(wonder / if / I / she / the answer / knows)','options',jsonb_build_array(),'answer','I wonder if she knows the answer.','acceptedAnswers',jsonb_build_array()),
    jsonb_build_object('number',57,'question',E'다음 주어진 단어를 올바르게 배열하여 문장을 완성하시오.\n\n(know / if / don''t / I / he / will / come)','options',jsonb_build_array(),'answer','I don''t know if he will come.','acceptedAnswers',jsonb_build_array('I do not know if he will come.')),
    jsonb_build_object('number',58,'question',E'다음 주어진 단어를 올바르게 배열하여 문장을 완성하시오.\n\n(asked / she / if / me / I / was / hungry)','options',jsonb_build_array(),'answer','She asked me if I was hungry.','acceptedAnswers',jsonb_build_array()),
    jsonb_build_object('number',59,'question',E'다음 주어진 단어를 올바르게 배열하여 문장을 완성하시오.\n\n(check / if / please / is / the door / locked)','options',jsonb_build_array(),'answer','Please check if the door is locked.','acceptedAnswers',jsonb_build_array()),
    jsonb_build_object('number',60,'question',E'다음 주어진 단어를 올바르게 배열하여 문장을 완성하시오.\n\n(he / if / wonders / will / it / rain / tomorrow)','options',jsonb_build_array(),'answer','He wonders if it will rain tomorrow.','acceptedAnswers',jsonb_build_array()),
    jsonb_build_object('number',61,'question',E'다음 주어진 단어를 올바르게 배열하여 문장을 완성하시오.\n\n(remember / you / if / do / turned off / you / the light)','options',jsonb_build_array(),'answer','Do you remember if you turned off the light?','acceptedAnswers',jsonb_build_array()),
    jsonb_build_object('number',62,'question',E'다음 주어진 단어를 올바르게 배열하여 문장을 완성하시오.\n\n(find out / to / if / I / need / she / is / coming)','options',jsonb_build_array(),'answer','I need to find out if she is coming.','acceptedAnswers',jsonb_build_array()),
    jsonb_build_object('number',63,'question',E'다음 주어진 단어를 올바르게 배열하여 문장을 완성하시오.\n\n(curious / I''m / if / will / they / us / invite)','options',jsonb_build_array(),'answer','I''m curious if they will invite us.','acceptedAnswers',jsonb_build_array()),
    jsonb_build_object('number',64,'question',E'다음 주어진 단어를 올바르게 배열하여 문장을 완성하시오.\n\n(tell / can / me / you / if / is / open / the store)','options',jsonb_build_array(),'answer','Can you tell me if the store is open?','acceptedAnswers',jsonb_build_array()),
    jsonb_build_object('number',65,'question',E'다음 주어진 단어를 올바르게 배열하여 문장을 완성하시오.\n\n(doubts / if / he / the plan / work / will)','options',jsonb_build_array(),'answer','He doubts if the plan will work.','acceptedAnswers',jsonb_build_array())
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 7: 우리말 해석 객관식 (Q66-Q75)
    -- 한국어 문장 → 올바른 영어 번역 고르기
    -- ═══════════════════════════════════════
    jsonb_build_object('number',66,'question',E'다음 우리말을 영어로 바르게 옮긴 것을 고르시오.\n\n나는 그가 올지 아닌지 모르겠다.','options',jsonb_build_array('I don''t know if he will come.','I don''t know that he will come.','If he comes, I don''t know.','I know if he will not come.','I will know if he comes.'),'answer','1'),
    jsonb_build_object('number',67,'question',E'다음 우리말을 영어로 바르게 옮긴 것을 고르시오.\n\n그녀는 그 시험이 어려운지 궁금해했다.','options',jsonb_build_array('She was curious that the test was hard.','If the test is difficult, she was curious.','She was curious if the test was difficult.','She wondered that the test is difficult.','If she was curious, the test was difficult.'),'answer','3'),
    jsonb_build_object('number',68,'question',E'다음 우리말을 영어로 바르게 옮긴 것을 고르시오.\n\n그에게 내일 시간이 있는지 물어봐 주세요.','options',jsonb_build_array('Please ask that he is free tomorrow.','If he is free tomorrow, please ask him.','Please ask if is he free tomorrow.','Please ask him if he is free tomorrow.','If he has time, please ask tomorrow.'),'answer','4'),
    jsonb_build_object('number',69,'question',E'다음 우리말을 영어로 바르게 옮긴 것을 고르시오.\n\n우리는 그 식당이 아직 열려 있는지 확인해야 한다.','options',jsonb_build_array('We need to check if the restaurant is still open.','We check that the restaurant is still open.','If the restaurant is open, we should check.','We need that check if the restaurant is open.','If still open, we need to check the restaurant.'),'answer','1'),
    jsonb_build_object('number',70,'question',E'다음 우리말을 영어로 바르게 옮긴 것을 고르시오.\n\n나는 이 길이 맞는지 확신이 없다.','options',jsonb_build_array('If this road is right, I''m not sure.','I''m not sure that this road is right.','I''m sure if this road is not right.','This road is right if I''m not sure.','I''m not sure if this road is right.'),'answer','5'),
    jsonb_build_object('number',71,'question',E'다음 우리말을 영어로 바르게 옮긴 것을 고르시오.\n\n그는 자기 여동생이 그 선물을 좋아할지 의심했다.','options',jsonb_build_array('He doubted that his sister liked the gift.','If his sister liked the gift, he doubted.','He doubted if his sister would like the gift.','His sister doubted if he liked the gift.','He would doubt if his sister likes the gift.'),'answer','3'),
    jsonb_build_object('number',72,'question',E'다음 우리말을 영어로 바르게 옮긴 것을 고르시오.\n\n너는 버스가 여기에 서는지 아니?','options',jsonb_build_array('Do you know that the bus stops here?','If you know the bus, does it stop here?','You know if the bus stops here.','If the bus stops here, do you know?','Do you know if the bus stops here?'),'answer','5'),
    jsonb_build_object('number',73,'question',E'다음 우리말을 영어로 바르게 옮긴 것을 고르시오.\n\n그녀는 비가 올지 궁금해한다.','options',jsonb_build_array('She wonders if it will rain.','If it rains, she wonders.','She wonders that it will rain.','If she wonders, it will rain.','She will wonder if it rains.'),'answer','1'),
    jsonb_build_object('number',74,'question',E'다음 우리말을 영어로 바르게 옮긴 것을 고르시오.\n\n나에게 네가 준비됐는지 말해 줘.','options',jsonb_build_array('Tell me that you are ready.','If you are ready, tell me.','Tell me if are you ready.','Tell me if you are ready.','If tell me, you are ready.'),'answer','4'),
    jsonb_build_object('number',75,'question',E'다음 우리말을 영어로 바르게 옮긴 것을 고르시오.\n\n아무도 그 이야기가 사실인지 모른다.','options',jsonb_build_array('Nobody knows that the story is true.','If nobody knows, the story is true.','Nobody knows if the story is true.','If the story is true, nobody knows.','The story is true if nobody knows.'),'answer','3')
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 8: (A)(B) 빈칸 짝짓기 객관식 (Q76-Q80)
    -- 두 빈칸에 들어갈 알맞은 짝 고르기
    -- ═══════════════════════════════════════
    jsonb_build_object('number',76,'question',E'다음 빈칸 (A), (B)에 들어갈 말이 바르게 짝지어진 것을 고르시오.\n\nI don''t know (A) he will come. (B) he comes, tell him to wait.\n\n(A) / (B)','options',jsonb_build_array('if / If','that / If','if / That','what / If','who / If'),'answer','1'),
    jsonb_build_object('number',77,'question',E'다음 빈칸 (A), (B)에 들어갈 말이 바르게 짝지어진 것을 고르시오.\n\nShe wonders (A) her friend is sick. (B) her friend is sick, she should visit her.\n\n(A) / (B)','options',jsonb_build_array('that / If','if / If','what / When','if / That','who / If'),'answer','2'),
    jsonb_build_object('number',78,'question',E'다음 빈칸 (A), (B)에 들어갈 말이 바르게 짝지어진 것을 고르시오.\n\nPlease ask him (A) he can drive. (B) he can drive, he should take us to the airport.\n\n(A) / (B)','options',jsonb_build_array('that / That','what / If','if / If','if / That','who / When'),'answer','3'),
    jsonb_build_object('number',79,'question',E'다음 빈칸 (A), (B)에 들어갈 말이 바르게 짝지어진 것을 고르시오.\n\nWe want to know (A) the exam (B) difficult.\n\n(A) / (B)','options',jsonb_build_array('that / is','if / will be','what / is','if / will','which / be'),'answer','2'),
    jsonb_build_object('number',80,'question',E'다음 빈칸 (A), (B)에 들어갈 말이 바르게 짝지어진 것을 고르시오.\n\nHe is not sure (A) his answer is right. (B) his answer is right, he will get full marks.\n\n(A) / (B)','options',jsonb_build_array('that / If','if / That','what / If','if / If','who / When'),'answer','4')
  );

  a := jsonb_build_array(
    -- Part 1 (Q1-Q10)
    '3','4','5','2','5','1','4','2','5','1',
    -- Part 2 (Q11-Q20)
    '2','3','4','2','3','2','3','5','1','5',
    -- Part 3 (Q21-Q35)
    '4','4','5','2','3','3','5','5','2','5','2','4','4','4','1',
    -- Part 4 (Q36-Q45)
    '1','2','3','4','3','3','2','3','2','4',
    -- Part 5 서술형 (Q46-Q55)
    'if','if','if','if','would come','has finished','liked','arrives','if','is',
    -- Part 6 서술형 (Q56-Q65)
    'I wonder if she knows the answer.','I don''t know if he will come.','She asked me if I was hungry.','Please check if the door is locked.','He wonders if it will rain tomorrow.','Do you remember if you turned off the light?','I need to find out if she is coming.','I''m curious if they will invite us.','Can you tell me if the store is open?','He doubts if the plan will work.',
    -- Part 7 (Q66-Q75)
    '1','3','4','1','5','3','5','1','4','3',
    -- Part 8 (Q76-Q80)
    '1','2','3','2','4'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('명사절 접속사 if Step1', '명사절 접속사 if', q, a, 'problem', 'interactive');

  RAISE NOTICE '명사절 접속사 if Step1 템플릿 생성 완료 (80문제)';
END;
$$;
