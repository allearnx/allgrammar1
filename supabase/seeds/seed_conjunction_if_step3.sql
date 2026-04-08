-- 명사절 접속사 if Step3 49문제 (전부 서술형)
-- 난이도: 하(Q1-Q10) → 중(Q11-Q25) → 중상(Q26-Q38) → 상(Q39-Q49)
DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title IN ('접속사 if Step3', '명사절 접속사 if Step3');

  q := jsonb_build_array(
    -- ═══════════════════════════════════════
    -- 하 (Q1-Q10): 단어뱅크 빈칸 채우기
    -- ═══════════════════════════════════════

    -- Q1: 접속사 단어뱅크
    jsonb_build_object('number',1,'question',E'다음 <보기>에서 알맞은 단어를 골라 빈칸을 채우시오.\n\n<보기> if, that, what, because, when\n\nI''m not sure _______ he will arrive on time.','options',jsonb_build_array(),'answer','if','acceptedAnswers',jsonb_build_array('if')),

    -- Q2: 접속사 단어뱅크
    jsonb_build_object('number',2,'question',E'다음 <보기>에서 알맞은 단어를 골라 빈칸을 채우시오.\n\n<보기> if, that, what, because, when\n\nShe doesn''t know _______ her brother passed the exam.','options',jsonb_build_array(),'answer','if','acceptedAnswers',jsonb_build_array('if')),

    -- Q3: 접속사 단어뱅크
    jsonb_build_object('number',3,'question',E'다음 <보기>에서 알맞은 단어를 골라 빈칸을 채우시오.\n\n<보기> if, that, what, because, when\n\nWe all know _______ he is the best player on the team.','options',jsonb_build_array(),'answer','that','acceptedAnswers',jsonb_build_array('that')),

    -- Q4: 접속사 단어뱅크
    jsonb_build_object('number',4,'question',E'다음 <보기>에서 알맞은 단어를 골라 빈칸을 채우시오.\n\n<보기> if, that, what, because, when\n\nI wonder _______ the library is open on Sundays.','options',jsonb_build_array(),'answer','if','acceptedAnswers',jsonb_build_array('if')),

    -- Q5: 접속사 단어뱅크
    jsonb_build_object('number',5,'question',E'다음 <보기>에서 알맞은 단어를 골라 빈칸을 채우시오.\n\n<보기> if, that, what, because, when\n\nDo you remember _______ she said at the meeting?','options',jsonb_build_array(),'answer','what','acceptedAnswers',jsonb_build_array('what')),

    -- Q6: 동사 단어뱅크
    jsonb_build_object('number',6,'question',E'다음 <보기>에서 알맞은 단어를 골라 빈칸을 채우시오. (필요시 형태를 바꿀 것)\n\n<보기> know, wonder, ask, decide, check\n\nShe _______ if the museum was open on Sundays.','options',jsonb_build_array(),'answer','wondered','acceptedAnswers',jsonb_build_array('wondered')),

    -- Q7: 동사 단어뱅크
    jsonb_build_object('number',7,'question',E'다음 <보기>에서 알맞은 단어를 골라 빈칸을 채우시오. (필요시 형태를 바꿀 것)\n\n<보기> know, wonder, ask, decide, check\n\nHe didn''t _______ if the answer was correct.','options',jsonb_build_array(),'answer','know','acceptedAnswers',jsonb_build_array('know')),

    -- Q8: 동사 단어뱅크
    jsonb_build_object('number',8,'question',E'다음 <보기>에서 알맞은 단어를 골라 빈칸을 채우시오. (필요시 형태를 바꿀 것)\n\n<보기> know, wonder, ask, decide, check\n\nPlease _______ if the door is locked before you leave.','options',jsonb_build_array(),'answer','check','acceptedAnswers',jsonb_build_array('check')),

    -- Q9: 동사 단어뱅크
    jsonb_build_object('number',9,'question',E'다음 <보기>에서 알맞은 단어를 골라 빈칸을 채우시오. (필요시 형태를 바꿀 것)\n\n<보기> know, wonder, ask, decide, check\n\nThe teacher _______ the students if they had finished their homework.','options',jsonb_build_array(),'answer','asked','acceptedAnswers',jsonb_build_array('asked')),

    -- Q10: 동사 단어뱅크
    jsonb_build_object('number',10,'question',E'다음 <보기>에서 알맞은 단어를 골라 빈칸을 채우시오. (필요시 형태를 바꿀 것)\n\n<보기> know, wonder, ask, decide, check\n\nI can''t _______ if I should go to the party or stay home.','options',jsonb_build_array(),'answer','decide','acceptedAnswers',jsonb_build_array('decide'))
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- 중 (Q11-Q25): 문장 전환 & 빈칸 완성
    -- ═══════════════════════════════════════

    -- Q11-Q16: 직접 의문문 → 간접 의문문
    -- Q11
    jsonb_build_object('number',11,'question',E'다음 직접 의문문을 간접 의문문으로 바꿔 쓰시오.\n\n"Is she coming to the concert?"\n→ I wonder _______________________________.','options',jsonb_build_array(),'answer','if she is coming to the concert','acceptedAnswers',jsonb_build_array('if she is coming to the concert','if she is coming to the concert.')),

    -- Q12
    jsonb_build_object('number',12,'question',E'다음 직접 의문문을 간접 의문문으로 바꿔 쓰시오.\n\n"Did he pass the math test?"\n→ I don''t know _______________________________.','options',jsonb_build_array(),'answer','if he passed the math test','acceptedAnswers',jsonb_build_array('if he passed the math test','if he passed the math test.')),

    -- Q13
    jsonb_build_object('number',13,'question',E'다음 직접 의문문을 간접 의문문으로 바꿔 쓰시오.\n\n"Will it rain tomorrow?"\n→ She asked _______________________________.','options',jsonb_build_array(),'answer','if it would rain tomorrow','acceptedAnswers',jsonb_build_array('if it would rain tomorrow','if it would rain tomorrow.','if it would rain the next day')),

    -- Q14
    jsonb_build_object('number',14,'question',E'다음 직접 의문문을 간접 의문문으로 바꿔 쓰시오.\n\n"Does he like chocolate?"\n→ I wonder _______________________________.','options',jsonb_build_array(),'answer','if he likes chocolate','acceptedAnswers',jsonb_build_array('if he likes chocolate','if he likes chocolate.')),

    -- Q15
    jsonb_build_object('number',15,'question',E'다음 직접 의문문을 간접 의문문으로 바꿔 쓰시오.\n\n"Can she speak French?"\n→ I''m curious _______________________________.','options',jsonb_build_array(),'answer','if she can speak French','acceptedAnswers',jsonb_build_array('if she can speak French','if she can speak French.')),

    -- Q16
    jsonb_build_object('number',16,'question',E'다음 직접 의문문을 간접 의문문으로 바꿔 쓰시오.\n\n"Are they still waiting for us?"\n→ I''m not sure _______________________________.','options',jsonb_build_array(),'answer','if they are still waiting for us','acceptedAnswers',jsonb_build_array('if they are still waiting for us','if they are still waiting for us.')),

    -- Q17-Q20: whether ↔ if 전환
    -- Q17
    jsonb_build_object('number',17,'question',E'다음 문장에서 whether를 if로 바꿔 같은 뜻의 문장으로 쓰시오.\n\nI wonder whether he likes classical music.','options',jsonb_build_array(),'answer','I wonder if he likes classical music.','acceptedAnswers',jsonb_build_array('I wonder if he likes classical music.')),

    -- Q18
    jsonb_build_object('number',18,'question',E'다음 문장에서 whether를 if로 바꿔 같은 뜻의 문장으로 쓰시오.\n\nShe asked whether the store was still open.','options',jsonb_build_array(),'answer','She asked if the store was still open.','acceptedAnswers',jsonb_build_array('She asked if the store was still open.')),

    -- Q19
    jsonb_build_object('number',19,'question',E'다음 문장에서 if를 whether로 바꿔 같은 뜻의 문장으로 쓰시오.\n\nI don''t know if the bus has already left.','options',jsonb_build_array(),'answer','I don''t know whether the bus has already left.','acceptedAnswers',jsonb_build_array('I don''t know whether the bus has already left.','I do not know whether the bus has already left.')),

    -- Q20
    jsonb_build_object('number',20,'question',E'다음 문장에서 if를 whether로 바꿔 같은 뜻의 문장으로 쓰시오.\n\nHe asked me if I wanted to join the club.','options',jsonb_build_array(),'answer','He asked me whether I wanted to join the club.','acceptedAnswers',jsonb_build_array('He asked me whether I wanted to join the club.')),

    -- Q21-Q25: 빈칸 완성 (힌트 기반)
    -- Q21
    jsonb_build_object('number',21,'question',E'다음 우리말 힌트를 참고하여 빈칸을 완성하시오.\n\nI asked the teacher _______________________. (숙제가 있는지)','options',jsonb_build_array(),'answer','if there was any homework','acceptedAnswers',jsonb_build_array('if there was any homework','if we had homework','if we had any homework','if there was homework')),

    -- Q22
    jsonb_build_object('number',22,'question',E'다음 우리말 힌트를 참고하여 빈칸을 완성하시오.\n\nShe wanted to know _______________________. (그가 올지)','options',jsonb_build_array(),'answer','if he would come','acceptedAnswers',jsonb_build_array('if he would come','if he was coming','if he was going to come')),

    -- Q23
    jsonb_build_object('number',23,'question',E'다음 우리말 힌트를 참고하여 빈칸을 완성하시오.\n\nI''m curious _______________________. (그 영화가 재미있는지)','options',jsonb_build_array(),'answer','if the movie is fun','acceptedAnswers',jsonb_build_array('if the movie is fun','if the movie is interesting','if the movie is good')),

    -- Q24
    jsonb_build_object('number',24,'question',E'다음 우리말 힌트를 참고하여 빈칸을 완성하시오.\n\nWe couldn''t tell _______________________. (그가 진심인지)','options',jsonb_build_array(),'answer','if he was serious','acceptedAnswers',jsonb_build_array('if he was serious','if he was being serious')),

    -- Q25
    jsonb_build_object('number',25,'question',E'다음 우리말 힌트를 참고하여 빈칸을 완성하시오.\n\nPlease find out _______________________. (가게가 아직 열려 있는지)','options',jsonb_build_array(),'answer','if the store is still open','acceptedAnswers',jsonb_build_array('if the store is still open','if the shop is still open'))
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- 중상 (Q26-Q38): 오류 수정 & 단어 배열
    -- ═══════════════════════════════════════

    -- Q26-Q33: 오류 수정 (완전한 문장으로)
    -- Q26: that → if 오류
    jsonb_build_object('number',26,'question',E'다음 문장에서 틀린 부분을 고쳐 완전한 문장으로 다시 쓰시오.\n\nI wonder that he is honest.','options',jsonb_build_array(),'answer','I wonder if he is honest.','acceptedAnswers',jsonb_build_array('I wonder if he is honest.','I wonder whether he is honest.')),

    -- Q27: 어순 오류 (의문문 어순 → 평서문 어순)
    jsonb_build_object('number',27,'question',E'다음 문장에서 틀린 부분을 고쳐 완전한 문장으로 다시 쓰시오.\n\nI don''t know if is he coming to the meeting.','options',jsonb_build_array(),'answer','I don''t know if he is coming to the meeting.','acceptedAnswers',jsonb_build_array('I don''t know if he is coming to the meeting.','I do not know if he is coming to the meeting.')),

    -- Q28: if 누락
    jsonb_build_object('number',28,'question',E'다음 문장에서 틀린 부분을 고쳐 완전한 문장으로 다시 쓰시오.\n\nI wonder he will come to the party.','options',jsonb_build_array(),'answer','I wonder if he will come to the party.','acceptedAnswers',jsonb_build_array('I wonder if he will come to the party.','I wonder whether he will come to the party.')),

    -- Q29: do 조동사 잔존 오류
    jsonb_build_object('number',29,'question',E'다음 문장에서 틀린 부분을 고쳐 완전한 문장으로 다시 쓰시오.\n\nShe asked if did he like pizza.','options',jsonb_build_array(),'answer','She asked if he liked pizza.','acceptedAnswers',jsonb_build_array('She asked if he liked pizza.')),

    -- Q30: 의문문 어순 오류 (does 잔존)
    jsonb_build_object('number',30,'question',E'다음 문장에서 틀린 부분을 고쳐 완전한 문장으로 다시 쓰시오.\n\nI want to know if does she need any help.','options',jsonb_build_array(),'answer','I want to know if she needs any help.','acceptedAnswers',jsonb_build_array('I want to know if she needs any help.')),

    -- Q31: that → if 오류 + 의미 구별
    jsonb_build_object('number',31,'question',E'다음 문장에서 틀린 부분을 고쳐 완전한 문장으로 다시 쓰시오.\n\nWe are not sure that the game has been canceled or not.','options',jsonb_build_array(),'answer','We are not sure if the game has been canceled or not.','acceptedAnswers',jsonb_build_array('We are not sure if the game has been canceled or not.','We are not sure whether the game has been canceled or not.')),

    -- Q32: 의문문 어순 오류 (can 위치)
    jsonb_build_object('number',32,'question',E'다음 문장에서 틀린 부분을 고쳐 완전한 문장으로 다시 쓰시오.\n\nHe asked me if can I help him with his project.','options',jsonb_build_array(),'answer','He asked me if I could help him with his project.','acceptedAnswers',jsonb_build_array('He asked me if I could help him with his project.')),

    -- Q33: if 누락 + 어순
    jsonb_build_object('number',33,'question',E'다음 문장에서 틀린 부분을 고쳐 완전한 문장으로 다시 쓰시오.\n\nDo you know has she finished her report?','options',jsonb_build_array(),'answer','Do you know if she has finished her report?','acceptedAnswers',jsonb_build_array('Do you know if she has finished her report?','Do you know whether she has finished her report?')),

    -- Q34-Q38: 단어 배열
    -- Q34
    jsonb_build_object('number',34,'question',E'다음 괄호 안에 주어진 단어들을 올바르게 배열하여 문장을 쓰시오.\n\n( if / know / don''t / I / she / will / come / to / the / party )','options',jsonb_build_array(),'answer','I don''t know if she will come to the party.','acceptedAnswers',jsonb_build_array('I don''t know if she will come to the party.','I do not know if she will come to the party.')),

    -- Q35
    jsonb_build_object('number',35,'question',E'다음 괄호 안에 주어진 단어들을 올바르게 배열하여 문장을 쓰시오.\n\n( wonder / if / I / honest / he / is )','options',jsonb_build_array(),'answer','I wonder if he is honest.','acceptedAnswers',jsonb_build_array('I wonder if he is honest.')),

    -- Q36
    jsonb_build_object('number',36,'question',E'다음 괄호 안에 주어진 단어들을 올바르게 배열하여 문장을 쓰시오.\n\n( asked / she / the / store / if / was / open / me )','options',jsonb_build_array(),'answer','She asked me if the store was open.','acceptedAnswers',jsonb_build_array('She asked me if the store was open.')),

    -- Q37
    jsonb_build_object('number',37,'question',E'다음 괄호 안에 주어진 단어들을 올바르게 배열하여 문장을 쓰시오.\n\n( remember / can''t / if / I / locked / the / I / door )','options',jsonb_build_array(),'answer','I can''t remember if I locked the door.','acceptedAnswers',jsonb_build_array('I can''t remember if I locked the door.','I cannot remember if I locked the door.')),

    -- Q38
    jsonb_build_object('number',38,'question',E'다음 괄호 안에 주어진 단어들을 올바르게 배열하여 문장을 쓰시오.\n\n( tell / could / you / me / the / museum / if / is / near / here )','options',jsonb_build_array(),'answer','Could you tell me if the museum is near here?','acceptedAnswers',jsonb_build_array('Could you tell me if the museum is near here?'))
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- 상 (Q39-Q49): 영작
    -- ═══════════════════════════════════════

    -- Q39
    jsonb_build_object('number',39,'question',E'다음 우리말을 영어로 쓰시오.\n\n나는 그녀가 시험에 합격했는지 궁금하다.\n[단어: wonder, pass, exam]','options',jsonb_build_array(),'answer','I wonder if she passed the exam.','acceptedAnswers',jsonb_build_array('I wonder if she passed the exam.','I wonder whether she passed the exam.')),

    -- Q40
    jsonb_build_object('number',40,'question',E'다음 우리말을 영어로 쓰시오.\n\n그는 내일 비가 올지 확신하지 못한다.\n[단어: sure, rain, tomorrow]','options',jsonb_build_array(),'answer','He is not sure if it will rain tomorrow.','acceptedAnswers',jsonb_build_array('He is not sure if it will rain tomorrow.','He isn''t sure if it will rain tomorrow.','He is not sure whether it will rain tomorrow.')),

    -- Q41
    jsonb_build_object('number',41,'question',E'다음 우리말을 영어로 쓰시오.\n\n선생님은 우리에게 숙제를 끝냈는지 물어보셨다.\n[단어: ask, finish, homework]','options',jsonb_build_array(),'answer','The teacher asked us if we had finished our homework.','acceptedAnswers',jsonb_build_array('The teacher asked us if we had finished our homework.','The teacher asked us if we finished our homework.','The teacher asked us whether we had finished our homework.')),

    -- Q42
    jsonb_build_object('number',42,'question',E'다음 우리말을 영어로 쓰시오.\n\n나는 그 식당이 아직 열려 있는지 모르겠다.\n[단어: know, restaurant, still, open]','options',jsonb_build_array(),'answer','I don''t know if the restaurant is still open.','acceptedAnswers',jsonb_build_array('I don''t know if the restaurant is still open.','I do not know if the restaurant is still open.','I don''t know whether the restaurant is still open.')),

    -- Q43
    jsonb_build_object('number',43,'question',E'다음 우리말을 영어로 쓰시오.\n\n그녀는 그가 자기 생일을 기억하는지 궁금했다.\n[단어: wonder, remember, birthday]','options',jsonb_build_array(),'answer','She wondered if he remembered her birthday.','acceptedAnswers',jsonb_build_array('She wondered if he remembered her birthday.','She wondered whether he remembered her birthday.')),

    -- Q44
    jsonb_build_object('number',44,'question',E'다음 우리말을 영어로 쓰시오.\n\n너는 그가 진실을 말하고 있는지 알고 있니?\n[단어: know, tell, truth]','options',jsonb_build_array(),'answer','Do you know if he is telling the truth?','acceptedAnswers',jsonb_build_array('Do you know if he is telling the truth?','Do you know whether he is telling the truth?')),

    -- Q45
    jsonb_build_object('number',45,'question',E'다음 우리말을 영어로 쓰시오.\n\n나는 내가 그 팀에 들어갈 수 있는지 확인하고 싶다.\n[단어: find out, join, team]','options',jsonb_build_array(),'answer','I want to find out if I can join the team.','acceptedAnswers',jsonb_build_array('I want to find out if I can join the team.','I want to find out whether I can join the team.')),

    -- Q46
    jsonb_build_object('number',46,'question',E'다음 우리말을 영어로 쓰시오.\n\n엄마는 내가 점심을 먹었는지 물어보셨다.\n[단어: ask, eat, lunch]','options',jsonb_build_array(),'answer','Mom asked me if I had eaten lunch.','acceptedAnswers',jsonb_build_array('Mom asked me if I had eaten lunch.','Mom asked me if I ate lunch.','My mom asked me if I had eaten lunch.','My mom asked me if I ate lunch.')),

    -- Q47
    jsonb_build_object('number',47,'question',E'다음 우리말을 영어로 쓰시오.\n\n우리는 그 버스가 제시간에 도착할지 확신할 수 없었다.\n[단어: sure, bus, arrive, on time]','options',jsonb_build_array(),'answer','We couldn''t be sure if the bus would arrive on time.','acceptedAnswers',jsonb_build_array('We couldn''t be sure if the bus would arrive on time.','We could not be sure if the bus would arrive on time.','We were not sure if the bus would arrive on time.','We weren''t sure if the bus would arrive on time.')),

    -- Q48
    jsonb_build_object('number',48,'question',E'다음 우리말을 영어로 쓰시오.\n\n그는 내일 눈이 올지 궁금해했다.\n[단어: wonder, snow, tomorrow]','options',jsonb_build_array(),'answer','He wondered if it would snow tomorrow.','acceptedAnswers',jsonb_build_array('He wondered if it would snow tomorrow.','He wondered whether it would snow tomorrow.','He wondered if it would snow the next day.')),

    -- Q49
    jsonb_build_object('number',49,'question',E'다음 우리말을 영어로 쓰시오.\n\n나는 그녀가 내 편지를 받았는지 아닌지 알고 싶다.\n[단어: want, know, receive, letter]','options',jsonb_build_array(),'answer','I want to know if she received my letter.','acceptedAnswers',jsonb_build_array('I want to know if she received my letter.','I want to know whether she received my letter.','I want to know whether she received my letter or not.','I want to know if she received my letter or not.'))
  );

  a := jsonb_build_array(
    -- 하 (Q1-Q10)
    'if','if','that','if','what',
    'wondered','know','check','asked','decide',
    -- 중 (Q11-Q25)
    'if she is coming to the concert',
    'if he passed the math test',
    'if it would rain tomorrow',
    'if he likes chocolate',
    'if she can speak French',
    'if they are still waiting for us',
    'I wonder if he likes classical music.',
    'She asked if the store was still open.',
    'I don''t know whether the bus has already left.',
    'He asked me whether I wanted to join the club.',
    'if there was any homework',
    'if he would come',
    'if the movie is fun',
    'if he was serious',
    'if the store is still open',
    -- 중상 (Q26-Q38)
    'I wonder if he is honest.',
    'I don''t know if he is coming to the meeting.',
    'I wonder if he will come to the party.',
    'She asked if he liked pizza.',
    'I want to know if she needs any help.',
    'We are not sure if the game has been canceled or not.',
    'He asked me if I could help him with his project.',
    'Do you know if she has finished her report?',
    'I don''t know if she will come to the party.',
    'I wonder if he is honest.',
    'She asked me if the store was open.',
    'I can''t remember if I locked the door.',
    'Could you tell me if the museum is near here?',
    -- 상 (Q39-Q49)
    'I wonder if she passed the exam.',
    'He is not sure if it will rain tomorrow.',
    'The teacher asked us if we had finished our homework.',
    'I don''t know if the restaurant is still open.',
    'She wondered if he remembered her birthday.',
    'Do you know if he is telling the truth?',
    'I want to find out if I can join the team.',
    'Mom asked me if I had eaten lunch.',
    'We couldn''t be sure if the bus would arrive on time.',
    'He wondered if it would snow tomorrow.',
    'I want to know if she received my letter.'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('명사절 접속사 if Step3', '명사절 접속사 if', q, a, 'problem', 'interactive');

  RAISE NOTICE '명사절 접속사 if Step3 템플릿 생성 완료 (49문제)';
END;
$$;
