-- 접속사 if Step3 49문제 (서술형, 패러프레이즈)
-- 난이도: 하(Q1-2) → 중(Q3-22) → 중상(Q23-36) → 상(Q37-49)
DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = '접속사 if Step3';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════
    -- 하 (Q1-Q2): 단어뱅크 빈칸
    -- ═══════════════════════════════════════

    -- Q1: 단어뱅크 빈칸
    jsonb_build_object('number',1,'question',E'다음 <보기>에서 알맞은 단어를 골라 빈칸을 채우시오.\n\n<보기> prepare, complete, snow, discover, be, depart, adjust, visit, arrive, rush\n\nCan I go outside if I _______ my assignment?','options',jsonb_build_array(),'answer','complete','acceptedAnswers',jsonb_build_array('complete')),

    -- Q2: 단어뱅크 빈칸
    jsonb_build_object('number',2,'question',E'다음 <보기>에서 알맞은 단어를 골라 빈칸을 채우시오.\n\n<보기> prepare, complete, snow, discover, be, depart, adjust, visit, arrive, rush\n\nI will give your regards to Emma if I _______ her.','options',jsonb_build_array(),'answer','visit','acceptedAnswers',jsonb_build_array('visit')),

    -- ═══════════════════════════════════════
    -- 중 (Q3-Q22)
    -- ═══════════════════════════════════════

    -- Q3-5: 단어뱅크 빈칸 (같은 보기)
    jsonb_build_object('number',3,'question',E'다음 <보기>에서 알맞은 단어를 골라 빈칸을 채우시오. (필요시 형태를 바꿀 것)\n\n<보기> prepare, complete, snow, discover, be, depart, adjust, visit, arrive, rush\n\nIf your dad _______ his schedule, let me know.','options',jsonb_build_array(),'answer','adjusts','acceptedAnswers',jsonb_build_array('adjusts')),

    jsonb_build_object('number',4,'question',E'다음 <보기>에서 알맞은 단어를 골라 빈칸을 채우시오. (필요시 형태를 바꿀 것)\n\n<보기> prepare, complete, snow, discover, be, depart, adjust, visit, arrive, rush\n\nLisa can win the competition if she _______ hard.','options',jsonb_build_array(),'answer','prepares','acceptedAnswers',jsonb_build_array('prepares')),

    jsonb_build_object('number',5,'question',E'다음 <보기>에서 알맞은 단어를 골라 빈칸을 채우시오. (필요시 형태를 바꿀 것)\n\n<보기> prepare, complete, snow, discover, be, depart, adjust, visit, arrive, rush\n\nTom can make it to the meeting if he _______.','options',jsonb_build_array(),'answer','rushes','acceptedAnswers',jsonb_build_array('rushes')),

    -- Q6-9: 매칭 연결 (4 entries)
    jsonb_build_object('number',6,'question',E'다음 (가)에서 알맞은 것을 골라 (나)와 연결하여 완성된 문장을 쓰시오.\n\n(가) Kevin will be upset / I''ll visit the Eiffel Tower / Sara will be disappointed / We will join your team\n(나) if I travel to Paris / if he doesn''t get up now / if you ask us / if Mike forgets her birthday\n\n(1) Kevin will be upset ↔ ?','options',jsonb_build_array(),'answer','Kevin will be upset if he doesn''t get up now.','acceptedAnswers',jsonb_build_array('Kevin will be upset if he doesn''t get up now.','Kevin will be upset if he does not get up now.')),

    jsonb_build_object('number',7,'question',E'다음 (가)에서 알맞은 것을 골라 (나)와 연결하여 완성된 문장을 쓰시오.\n\n(가) Kevin will be upset / I''ll visit the Eiffel Tower / Sara will be disappointed / We will join your team\n(나) if I travel to Paris / if he doesn''t get up now / if you ask us / if Mike forgets her birthday\n\n(2) I''ll visit the Eiffel Tower ↔ ?','options',jsonb_build_array(),'answer','I''ll visit the Eiffel Tower if I travel to Paris.','acceptedAnswers',jsonb_build_array('I''ll visit the Eiffel Tower if I travel to Paris.','I will visit the Eiffel Tower if I travel to Paris.')),

    jsonb_build_object('number',8,'question',E'다음 (가)에서 알맞은 것을 골라 (나)와 연결하여 완성된 문장을 쓰시오.\n\n(가) Kevin will be upset / I''ll visit the Eiffel Tower / Sara will be disappointed / We will join your team\n(나) if I travel to Paris / if he doesn''t get up now / if you ask us / if Mike forgets her birthday\n\n(3) Sara will be disappointed ↔ ?','options',jsonb_build_array(),'answer','Sara will be disappointed if Mike forgets her birthday.','acceptedAnswers',jsonb_build_array('Sara will be disappointed if Mike forgets her birthday.')),

    jsonb_build_object('number',9,'question',E'다음 (가)에서 알맞은 것을 골라 (나)와 연결하여 완성된 문장을 쓰시오.\n\n(가) Kevin will be upset / I''ll visit the Eiffel Tower / Sara will be disappointed / We will join your team\n(나) if I travel to Paris / if he doesn''t get up now / if you ask us / if Mike forgets her birthday\n\n(4) We will join your team ↔ ?','options',jsonb_build_array(),'answer','We will join your team if you ask us.','acceptedAnswers',jsonb_build_array('We will join your team if you ask us.'))
  )
  ||
  jsonb_build_array(
    -- Q10-12: 텍스트 보기 빈칸 완성
    jsonb_build_object('number',10,'question',E'다음 보기의 내용을 참고하여 빈칸을 완성하시오.\n\n<보기> 학교까지 이동 수단별 소요 시간:\n걸어가면 30분 / 자전거 15분 / 버스 10분 / 엄마가 태워주면 5분\n\nIf Amy walks to school, it will take 30 minutes.\n\nIf she _______________________, it will take 15 minutes.','options',jsonb_build_array(),'answer','rides a bike','acceptedAnswers',jsonb_build_array('rides a bike','rides her bike','rides a bike to school')),

    jsonb_build_object('number',11,'question',E'다음 보기의 내용을 참고하여 빈칸을 완성하시오.\n\n<보기> 학교까지 이동 수단별 소요 시간:\n걸어가면 30분 / 자전거 15분 / 버스 10분 / 엄마가 태워주면 5분\n\nIf Amy walks to school, it will take 30 minutes.\n\nIf she _______________________, it will take 10 minutes.','options',jsonb_build_array(),'answer','takes the bus','acceptedAnswers',jsonb_build_array('takes the bus','takes the bus to school','takes a bus')),

    jsonb_build_object('number',12,'question',E'다음 보기의 내용을 참고하여 빈칸을 완성하시오.\n\n<보기> 학교까지 이동 수단별 소요 시간:\n걸어가면 30분 / 자전거 15분 / 버스 10분 / 엄마가 태워주면 5분\n\nIf Amy walks to school, it will take 30 minutes.\n\nIf she gets a ride from her mom, _______________________.','options',jsonb_build_array(),'answer','it will take 5 minutes','acceptedAnswers',jsonb_build_array('it will take 5 minutes','it will take five minutes')),

    -- Q13-15: 텍스트 표현 활용 빈칸
    jsonb_build_object('number',13,'question',E'다음 보기의 순서를 참고하여 빈칸을 완성하시오.\n\n<보기> 순서: cross the bridge → enter the cave → solve the riddle → find the treasure\n\nIf you cross the bridge, you will enter the cave.\n\n_______________________, you will find a hidden door.','options',jsonb_build_array(),'answer','If you enter the cave','acceptedAnswers',jsonb_build_array('If you enter the cave')),

    jsonb_build_object('number',14,'question',E'다음 보기의 순서를 참고하여 빈칸을 완성하시오.\n\n<보기> 순서: cross the bridge → enter the cave → solve the riddle → find the treasure\n\nIf you cross the bridge, you will enter the cave.\n\nIf you solve the riddle, _______________________.','options',jsonb_build_array(),'answer','you will find the treasure','acceptedAnswers',jsonb_build_array('you will find the treasure','you''ll find the treasure')),

    jsonb_build_object('number',15,'question',E'다음 보기의 순서를 참고하여 빈칸을 완성하시오.\n\n<보기> 순서: cross the bridge → enter the cave → solve the riddle → find the treasure\n\nIf you cross the bridge, you will enter the cave.\n\n_______________________, you will become the richest person in the village.','options',jsonb_build_array(),'answer','If you find the treasure','acceptedAnswers',jsonb_build_array('If you find the treasure')),

    -- Q16: 단어 배열
    jsonb_build_object('number',16,'question',E'다음 괄호 안에 주어진 낱말들을 배열하여 올바른 문장으로 쓰시오.\n\n(that / if / believe / you / way), you will feel much better.','options',jsonb_build_array(),'answer','If you believe that way','acceptedAnswers',jsonb_build_array('If you believe that way')),

    -- Q17-20: 두 문장 → if 전환
    jsonb_build_object('number',17,'question',E'다음 <보기>와 같이 두 문장을 if를 사용한 한 문장으로 쓰시오.\n\n<보기> Clean your room. Then your mom will be happy.\n→ If you clean your room, your mom will be happy.\n\nWake up early. Then you will catch the sunrise.','options',jsonb_build_array(),'answer','If you wake up early, you will catch the sunrise.','acceptedAnswers',jsonb_build_array('If you wake up early, you will catch the sunrise.','If you wake up early, you''ll catch the sunrise.')),

    jsonb_build_object('number',18,'question',E'다음 <보기>와 같이 두 문장을 if를 사용한 한 문장으로 쓰시오.\n\n<보기> Clean your room. Then your mom will be happy.\n→ If you clean your room, your mom will be happy.\n\nSave your money. Then you won''t regret it later.','options',jsonb_build_array(),'answer','If you save your money, you won''t regret it later.','acceptedAnswers',jsonb_build_array('If you save your money, you won''t regret it later.','If you save your money, you will not regret it later.'))
  )
  ||
  jsonb_build_array(
    jsonb_build_object('number',19,'question',E'다음 <보기>와 같이 두 문장을 if를 사용한 한 문장으로 쓰시오.\n\n<보기> Clean your room. Then your mom will be happy.\n→ If you clean your room, your mom will be happy.\n\nListen carefully. Then I will explain the rules to you.','options',jsonb_build_array(),'answer','If you listen carefully, I will explain the rules to you.','acceptedAnswers',jsonb_build_array('If you listen carefully, I will explain the rules to you.','If you listen carefully, I''ll explain the rules to you.')),

    jsonb_build_object('number',20,'question',E'다음 <보기>와 같이 두 문장을 if를 사용한 한 문장으로 쓰시오.\n\n<보기> Clean your room. Then your mom will be happy.\n→ If you clean your room, your mom will be happy.\n\nPractice every day, and you will become a great pianist.','options',jsonb_build_array(),'answer','If you practice every day, you will become a great pianist.','acceptedAnswers',jsonb_build_array('If you practice every day, you will become a great pianist.','If you practice every day, you''ll become a great pianist.')),

    -- Q21-22: 영어표현 참고 빈칸
    jsonb_build_object('number',21,'question',E'다음 우리말과 일치하도록 <보기>에서 적절한 표현을 골라 빈칸을 완성하시오.\n\n<보기> regularly / wake up / early / exercise / stay healthy / go to bed\n\n네가 일찍 자면 일찍 일어날 것이다.\n→ If you _______, you will _______.','options',jsonb_build_array(),'answer','If you go to bed early, you will wake up early.','acceptedAnswers',jsonb_build_array('If you go to bed early, you will wake up early.','If you go to bed early, you''ll wake up early.')),

    jsonb_build_object('number',22,'question',E'다음 우리말과 일치하도록 <보기>에서 적절한 표현을 골라 빈칸을 완성하시오.\n\n<보기> regularly / wake up / early / exercise / stay healthy / go to bed\n\n네가 규칙적으로 운동하면 건강할 것이다.\n→ If you _______, you will _______.','options',jsonb_build_array(),'answer','If you exercise regularly, you will stay healthy.','acceptedAnswers',jsonb_build_array('If you exercise regularly, you will stay healthy.','If you exercise regularly, you''ll stay healthy.')),

    -- ═══════════════════════════════════════
    -- 중상 (Q23-Q36)
    -- ═══════════════════════════════════════

    -- Q23-24: 단어 배열
    jsonb_build_object('number',23,'question',E'다음 주어진 단어들을 올바르게 배열하여 문장을 완성하시오. (필요 없는 단어는 사용하지 말 것, 필요한 경우 고쳐 활용할 것)\n\n(the train / miss / will) ← if절 부분\n(wait / have to / one hour) ← 주절 부분\n\nIf Emily _______, she _______.','options',jsonb_build_array(),'answer','If Emily misses the train, she will have to wait one hour.','acceptedAnswers',jsonb_build_array('If Emily misses the train, she will have to wait one hour.','If Emily misses the train, she will have to wait for one hour.')),

    jsonb_build_object('number',24,'question',E'다음 주어진 단어들을 올바르게 배열하여 문장을 완성하시오. (필요 없는 단어는 사용하지 말 것, 필요한 경우 고쳐 활용할 것)\n\n(arrive / will / on time) ← if절 부분\n(be / very grateful / will) ← 주절 부분\n\nIf the package _______, I _______.','options',jsonb_build_array(),'answer','If the package arrives on time, I will be very grateful.','acceptedAnswers',jsonb_build_array('If the package arrives on time, I will be very grateful.','If the package arrives on time, I''ll be very grateful.')),

    -- Q25-26: 우리말 → 단어 활용 영작
    jsonb_build_object('number',25,'question',E'다음 <보기>의 단어를 활용하여 우리말을 영어로 쓰시오.\n\n<보기> stay / rain / go hiking / free / together\n\n내일 비가 온다면, 나는 집에 머무를 거야.','options',jsonb_build_array(),'answer','If it rains tomorrow, I will stay home.','acceptedAnswers',jsonb_build_array('If it rains tomorrow, I will stay home.','If it rains tomorrow, I will stay at home.','If it rains tomorrow, I''ll stay home.','If it rains tomorrow, I''ll stay at home.')),

    jsonb_build_object('number',26,'question',E'다음 <보기>의 단어를 활용하여 우리말을 영어로 쓰시오.\n\n<보기> stay / rain / go hiking / free / together\n\n네가 오늘 한가하다면, 우리는 같이 하이킹하러 갈 수 있어.','options',jsonb_build_array(),'answer','If you are free today, we can go hiking together.','acceptedAnswers',jsonb_build_array('If you are free today, we can go hiking together.','We can go hiking together if you are free today.'))
  )
  ||
  jsonb_build_array(
    -- Q27: 단어 골라 문장 완성
    jsonb_build_object('number',27,'question',E'다음 <보기>에서 알맞은 단어를 골라 우리말과 일치하는 문장을 완성하시오.\n\n<보기> me / you / will / if / that / ten / dollars / lend / borrow\n\n나에게 10달러를 빌려주면, 다음 주에 너에게 갚을 것이다.','options',jsonb_build_array(),'answer','If you lend me ten dollars, I will pay you back next week.','acceptedAnswers',jsonb_build_array('If you lend me ten dollars, I will pay you back next week.','If you lend me ten dollars, I''ll pay you back next week.')),

    -- Q28: 보기 단어 활용 빈칸
    jsonb_build_object('number',28,'question',E'다음 <보기>의 단어를 활용하여 빈칸을 완성하시오.\n\n<보기> will, is, stay, rainy\n\n만약 이번 주 토요일에 비가 온다면, 그녀는 집에 머무를 것이다.\n→ If it _______ _______ this Saturday, she _______ _______ home.','options',jsonb_build_array(),'answer','If it is rainy this Saturday, she will stay home.','acceptedAnswers',jsonb_build_array('If it is rainy this Saturday, she will stay home.','If it is rainy this Saturday, she will stay at home.')),

    -- Q29: 두 문장 → if 연결
    jsonb_build_object('number',29,'question',E'다음 두 문장을 if를 사용한 한 문장으로 쓰시오.\n\nI''ll save my allowance. Then I won''t be broke.','options',jsonb_build_array(),'answer','If I save my allowance, I won''t be broke.','acceptedAnswers',jsonb_build_array('If I save my allowance, I won''t be broke.','If I save my allowance, I will not be broke.')),

    -- Q30-31: 같은 뜻 빈칸 (Unless)
    jsonb_build_object('number',30,'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸에 알맞은 말을 쓰시오.\n\nIf we don''t practice hard, we can''t win the match.\n= _______ we practice hard, we can''t win the match.','options',jsonb_build_array(),'answer','Unless','acceptedAnswers',jsonb_build_array('Unless')),

    jsonb_build_object('number',31,'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸에 알맞은 말을 쓰시오.\n\nIf you don''t read more books, you will fall behind.\n= _______ you read more books, you will fall behind.','options',jsonb_build_array(),'answer','Unless','acceptedAnswers',jsonb_build_array('Unless')),

    -- Q32: 같은 뜻 빈칸 (if 대위)
    jsonb_build_object('number',32,'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸에 알맞은 말을 쓰시오.\n\nIf you don''t wake up now, we''ll miss the flight.\n= _______ you wake up now, we won''t _______ the flight.','options',jsonb_build_array(),'answer','If / miss','acceptedAnswers',jsonb_build_array('If / miss','If, miss')),

    -- Q33: 같은 뜻 빈칸
    jsonb_build_object('number',33,'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸에 알맞은 말을 쓰시오.\n\nYou have to practice daily. You want to improve your skills.\n= If you want to improve your skills, you _______ _______ _______ _______.','options',jsonb_build_array(),'answer','have to practice daily','acceptedAnswers',jsonb_build_array('have to practice daily','have to practice every day')),

    -- Q34-35: 오류 수정
    jsonb_build_object('number',34,'question',E'다음 주어진 문장의 잘못된 부분을 고쳐 완전한 문장으로 다시 쓰시오.\n\nIf it will not snow tomorrow, I will go for a walk in the park.','options',jsonb_build_array(),'answer','If it does not snow tomorrow, I will go for a walk in the park.','acceptedAnswers',jsonb_build_array('If it does not snow tomorrow, I will go for a walk in the park.','If it doesn''t snow tomorrow, I will go for a walk in the park.','If it doesn''t snow tomorrow, I''ll go for a walk in the park.')),

    jsonb_build_object('number',35,'question',E'다음 주어진 문장의 잘못된 부분을 고쳐 완전한 문장으로 다시 쓰시오.\n\nIf you will break the rules, you will be punished.','options',jsonb_build_array(),'answer','If you break the rules, you will be punished.','acceptedAnswers',jsonb_build_array('If you break the rules, you will be punished.','If you break the rules, you''ll be punished.'))
  )
  ||
  jsonb_build_array(
    -- Q36: 영작
    jsonb_build_object('number',36,'question',E'다음 우리말을 영어로 쓰시오.\n\n이번 주말에 시간이 있다면, 나는 박물관을 방문할 것이다.','options',jsonb_build_array(),'answer','If I have time this weekend, I will visit the museum.','acceptedAnswers',jsonb_build_array('If I have time this weekend, I will visit the museum.','I will visit the museum if I have time this weekend.','If I have time this weekend, I''ll visit the museum.')),

    -- ═══════════════════════════════════════
    -- 상 (Q37-Q49)
    -- ═══════════════════════════════════════

    -- Q37: 같은 뜻 빈칸 (unless)
    jsonb_build_object('number',37,'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸에 알맞은 말을 쓰시오.\n\nYou cannot borrow books if you don''t have a library card.\n= You cannot borrow books _______ _______ _______ _______ _______ _______.','options',jsonb_build_array(),'answer','unless you have a library card','acceptedAnswers',jsonb_build_array('unless you have a library card')),

    -- Q38: 우리말 → 빈칸 (Unless)
    jsonb_build_object('number',38,'question',E'다음 우리말과 일치하도록 빈칸에 알맞은 말을 쓰시오.\n\n만일 내일 그가 회의에 참석하지 않으면, 우리는 걱정할 거야.\n= _______ _______ _______ to the meeting tomorrow, we will be worried.','options',jsonb_build_array(),'answer','Unless he comes','acceptedAnswers',jsonb_build_array('Unless he comes','If he doesn''t come')),

    -- Q39: 우리말 → 빈칸 영작
    jsonb_build_object('number',39,'question',E'다음 우리말과 일치하도록 빈칸에 알맞은 말을 쓰시오.\n\n만일 네가 그 대회에서 이긴다면, 내가 너에게 새 자전거를 사 줄게.\n→ _______ _______ _______ _______ _______ _______, I will buy you a new bicycle.','options',jsonb_build_array(),'answer','If you win the competition','acceptedAnswers',jsonb_build_array('If you win the competition','If you win the contest')),

    -- Q40-41: 오류 수정
    jsonb_build_object('number',40,'question',E'다음 주어진 문장의 잘못된 부분을 고쳐 완전한 문장으로 다시 쓰시오.\n\nYou will stay healthy if you will exercise every morning.','options',jsonb_build_array(),'answer','You will stay healthy if you exercise every morning.','acceptedAnswers',jsonb_build_array('You will stay healthy if you exercise every morning.')),

    jsonb_build_object('number',41,'question',E'다음 주어진 문장의 잘못된 부분을 고쳐 완전한 문장으로 다시 쓰시오.\n\nIf I will not feel well tomorrow, I won''t go to school.','options',jsonb_build_array(),'answer','If I do not feel well tomorrow, I won''t go to school.','acceptedAnswers',jsonb_build_array('If I do not feel well tomorrow, I won''t go to school.','If I don''t feel well tomorrow, I won''t go to school.','If I don''t feel well tomorrow, I will not go to school.')),

    -- Q42-43: 오류 수정
    jsonb_build_object('number',42,'question',E'다음 주어진 문장에서 어법상 틀린 부분을 찾아 올바르게 고쳐 쓰시오.\n\nIf he will call me, I will let you know.','options',jsonb_build_array(),'answer','If he calls me, I will let you know.','acceptedAnswers',jsonb_build_array('If he calls me, I will let you know.','If he calls me, I''ll let you know.')),

    jsonb_build_object('number',43,'question',E'다음 주어진 문장에서 어법상 틀린 부분을 찾아 올바르게 고쳐 쓰시오.\n\nIf it be sunny tomorrow, we''ll go on a picnic.','options',jsonb_build_array(),'answer','If it is sunny tomorrow, we''ll go on a picnic.','acceptedAnswers',jsonb_build_array('If it is sunny tomorrow, we''ll go on a picnic.','If it is sunny tomorrow, we will go on a picnic.'))
  )
  ||
  jsonb_build_array(
    -- Q44-45: if 문장 만들기
    jsonb_build_object('number',44,'question',E'다음 <보기>의 표현들을 연결하여 if를 사용한 완전한 문장을 쓰시오.\n\n<보기>\n• lose anything\n• become healthier\n• You don''t eat junk food.\n• You write it down.\n\n(1) 적는 것과 관련된 if 문장을 쓰시오.','options',jsonb_build_array(),'answer','If you write it down, you won''t lose anything.','acceptedAnswers',jsonb_build_array('If you write it down, you won''t lose anything.','You won''t lose anything if you write it down.','If you write it down, you will not lose anything.')),

    jsonb_build_object('number',45,'question',E'다음 <보기>의 표현들을 연결하여 if를 사용한 완전한 문장을 쓰시오.\n\n<보기>\n• lose anything\n• become healthier\n• You don''t eat junk food.\n• You write it down.\n\n(2) 건강과 관련된 if 문장을 쓰시오.','options',jsonb_build_array(),'answer','If you don''t eat junk food, you will become healthier.','acceptedAnswers',jsonb_build_array('If you don''t eat junk food, you will become healthier.','You will become healthier if you don''t eat junk food.','If you don''t eat junk food, you''ll become healthier.')),

    -- Q46-47: 조건문 영작
    jsonb_build_object('number',46,'question',E'다음 우리말을 영어로 쓰시오.\n\n만약 내일 눈이 온다면, 우리는 공원에 갈 것이다.','options',jsonb_build_array(),'answer','If it snows tomorrow, we will go to the park.','acceptedAnswers',jsonb_build_array('If it snows tomorrow, we will go to the park.','We will go to the park if it snows tomorrow.','If it snows tomorrow, we''ll go to the park.')),

    jsonb_build_object('number',47,'question',E'다음 우리말을 영어로 쓰시오.\n\n만약 더 일찍 출발하지 않는다면, 너는 늦을 것이다.','options',jsonb_build_array(),'answer','If you don''t leave earlier, you will be late.','acceptedAnswers',jsonb_build_array('If you don''t leave earlier, you will be late.','You will be late if you don''t leave earlier.','If you do not leave earlier, you will be late.','If you don''t leave earlier, you''ll be late.')),

    -- Q48-49: 대화 동사 활용
    jsonb_build_object('number',48,'question',E'다음 대화의 빈칸에 괄호 안의 동사를 알맞은 형태로 쓰시오.\n\nA: The sky is very dark tonight. I''m certain that it (1)_______(snow) tomorrow.\nB: Will you stay home if it (2)_______(snow) tomorrow?\n\n(1)의 답을 쓰시오.','options',jsonb_build_array(),'answer','will snow','acceptedAnswers',jsonb_build_array('will snow')),

    jsonb_build_object('number',49,'question',E'다음 대화의 빈칸에 괄호 안의 동사를 알맞은 형태로 쓰시오.\n\nA: The sky is very dark tonight. I''m certain that it (1)_______(snow) tomorrow.\nB: Will you stay home if it (2)_______(snow) tomorrow?\n\n(2)의 답을 쓰시오.','options',jsonb_build_array(),'answer','snows','acceptedAnswers',jsonb_build_array('snows'))
  );

  a := jsonb_build_array(
    -- 하 (Q1-2)
    'complete','visit',
    -- 중 (Q3-22)
    'adjusts','prepares','rushes',
    'Kevin will be upset if he doesn''t get up now.',
    'I''ll visit the Eiffel Tower if I travel to Paris.',
    'Sara will be disappointed if Mike forgets her birthday.',
    'We will join your team if you ask us.',
    'rides a bike','takes the bus','it will take 5 minutes',
    'If you enter the cave','you will find the treasure','If you find the treasure',
    'If you believe that way',
    'If you wake up early, you will catch the sunrise.',
    'If you save your money, you won''t regret it later.',
    'If you listen carefully, I will explain the rules to you.',
    'If you practice every day, you will become a great pianist.',
    'If you go to bed early, you will wake up early.',
    'If you exercise regularly, you will stay healthy.',
    -- 중상 (Q23-36)
    'If Emily misses the train, she will have to wait one hour.',
    'If the package arrives on time, I will be very grateful.',
    'If it rains tomorrow, I will stay home.',
    'If you are free today, we can go hiking together.',
    'If you lend me ten dollars, I will pay you back next week.',
    'If it is rainy this Saturday, she will stay home.',
    'If I save my allowance, I won''t be broke.',
    'Unless','Unless',
    'If / miss',
    'have to practice daily',
    'If it does not snow tomorrow, I will go for a walk in the park.',
    'If you break the rules, you will be punished.',
    'If I have time this weekend, I will visit the museum.',
    -- 상 (Q37-49)
    'unless you have a library card',
    'Unless he comes',
    'If you win the competition',
    'You will stay healthy if you exercise every morning.',
    'If I do not feel well tomorrow, I won''t go to school.',
    'If he calls me, I will let you know.',
    'If it is sunny tomorrow, we''ll go on a picnic.',
    'If you write it down, you won''t lose anything.',
    'If you don''t eat junk food, you will become healthier.',
    'If it snows tomorrow, we will go to the park.',
    'If you don''t leave earlier, you will be late.',
    'will snow',
    'snows'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('접속사 if Step3', '접속사 if', q, a, 'problem', 'interactive');

  RAISE NOTICE '접속사 if Step3 템플릿 생성 완료 (49문제)';
END;
$$;
