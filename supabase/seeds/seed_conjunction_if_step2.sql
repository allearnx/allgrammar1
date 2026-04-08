-- 명사절 접속사 if Step2 50문제
DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title IN ('접속사 if Step2', '명사절 접속사 if Step2');

  q := jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 1: 어법 판단 객관식 (Q1-Q8)
    -- ═══════════════════════════════════════
    -- #1 어법상 옳은 문장 (명사절 if에서 will 사용 가능)
    jsonb_build_object('number',1,'question',E'다음 중 어법상 옳은 문장은?','options',jsonb_build_array('I wonder if will she come to the party.','She asked me if I will help her tomorrow.','He wants to know if does the store open at nine.','I don''t know if she will join the meeting.','Tell me if can you finish the project.'),'answer','4'),

    -- #2 어법상 옳은 문장 (명사절 if 어순)
    jsonb_build_object('number',2,'question',E'다음 중 어법상 옳은 문장은?','options',jsonb_build_array('I wonder if is he a good student.','Do you know if the library is open today?','She asked if could I help her.','He doesn''t know if are they coming.','I''m curious if has she finished the homework.'),'answer','2'),

    -- #3 어법상 틀린 문장 (명사절 if 의문사 어순 오류)
    jsonb_build_object('number',3,'question',E'다음 중 어법상 틀린 문장은?','options',jsonb_build_array('I wonder if he likes basketball.','She doesn''t know if the bus has already left.','Do you know if will it rain this weekend?','I''m not sure if they received my email.','He asked me if I wanted to go shopping.'),'answer','3'),

    -- #4 어법상 옳은 문장 (명사절 if vs 부사절 if: will 사용 구분)
    jsonb_build_object('number',4,'question',E'다음 중 어법상 옳은 문장은?','options',jsonb_build_array('If it will snow tomorrow, we will stay home.','I wonder if it will snow tomorrow.','If she will arrive late, we will start without her.','If you will study harder, you can pass the test.','If they will come to the party, I will be happy.'),'answer','2'),

    -- #5 어법상 틀린 문장 (명사절 if 어순 오류)
    jsonb_build_object('number',5,'question',E'다음 중 어법상 틀린 문장은?','options',jsonb_build_array('I don''t know if she passed the exam.','He wondered if the movie was interesting.','Can you check if is the door locked?','She asked me if I had finished my homework.','We are not sure if they will attend the concert.'),'answer','3'),

    -- #6 어법상 옳은 문장 (if vs whether 차이: or not)
    jsonb_build_object('number',6,'question',E'다음 중 어법상 옳은 문장은?','options',jsonb_build_array('I don''t know if he will come or not.','She wonders if or not the train is on time.','He asked if or not I liked the movie.','Tell me if or not you can make it.','I''m curious if or not she passed the test.'),'answer','1'),

    -- #7 어법상 틀린 문장 (if를 whether로 바꿀 수 있는지 판별)
    jsonb_build_object('number',7,'question',E'다음 중 어법상 틀린 문장은?','options',jsonb_build_array('I wonder whether she will come.','Do you know whether the shop closes early?','He asked me whether I enjoyed the trip.','I''m not sure whether or not he is honest.','She wants to know if does the teacher allow late submissions.'),'answer','5'),

    -- #8 어법상 옳은 문장 (명사절 if 주어+동사 어순)
    jsonb_build_object('number',8,'question',E'다음 중 어법상 옳은 문장은?','options',jsonb_build_array('Please tell me if are you available tomorrow.','I wonder if did she buy a new phone.','He doesn''t know if will the concert be canceled.','Can you find out if the restaurant is still open?','She asked if was I feeling better.'),'answer','4')
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 2: 어색한 문장 고르기 객관식 (Q9-Q15)
    -- ═══════════════════════════════════════
    -- #9 의미가 가장 어색한 문장
    jsonb_build_object('number',9,'question',E'다음 중 의미가 가장 어색한 문장은?','options',jsonb_build_array('I wonder if she enjoyed the movie.','He asked if the test was difficult.','She doesn''t know if the sun rises in the west.','I want to find out if the museum is open on Sundays.','Do you know if the concert starts at seven?'),'answer','3'),

    -- #10 의미가 가장 자연스럽지 않은 문장
    jsonb_build_object('number',10,'question',E'다음 중 의미가 가장 자연스럽지 않은 문장은?','options',jsonb_build_array('I''m not sure if he remembers my name.','She wonders if the homework is due tomorrow.','He asked me if water is dry.','I want to know if the store sells school supplies.','Do you know if there is a pharmacy nearby?'),'answer','3'),

    -- #11 의미가 가장 어색한 문장
    jsonb_build_object('number',11,'question',E'다음 중 의미가 가장 어색한 문장은?','options',jsonb_build_array('I wonder if she can swim.','He doesn''t know if the exam is on Monday.','She asked me if cats can fly.','Do you know if the library has that book?','I''m curious if the new teacher is kind.'),'answer','3'),

    -- #12 의미가 가장 자연스럽지 않은 문장
    jsonb_build_object('number',12,'question',E'다음 중 의미가 가장 자연스럽지 않은 문장은?','options',jsonb_build_array('She wondered if the movie was sold out.','I want to check if the meeting was canceled.','He is curious if ice is hot.','Do you know if the bus comes every ten minutes?','I''m not sure if she likes chocolate cake.'),'answer','3'),

    -- #13 의미가 가장 어색한 문장
    jsonb_build_object('number',13,'question',E'다음 중 의미가 가장 어색한 문장은?','options',jsonb_build_array('I wonder if the cafeteria is open today.','She asked me if I had seen the announcement.','He doesn''t know if she brought her textbook.','I want to find out if fish live on land.','Do you know if the school trip is next week?'),'answer','4'),

    -- #14 의미가 가장 자연스럽지 않은 문장
    jsonb_build_object('number',14,'question',E'다음 중 의미가 가장 자연스럽지 않은 문장은?','options',jsonb_build_array('I''m curious if he will join the soccer team.','She wants to know if the deadline was extended.','He asked if the book report was due Friday.','I wonder if tomorrow is yesterday.','Do you know if she speaks French?'),'answer','4'),

    -- #15 의미가 가장 어색한 문장
    jsonb_build_object('number',15,'question',E'다음 중 의미가 가장 어색한 문장은?','options',jsonb_build_array('I''m not sure if he understood the lesson.','She wonders if the teacher will give a quiz.','Do you know if stones are soft?','He asked me if I had any plans for the weekend.','I want to check if the tickets are still available.'),'answer','3')
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 3: 문맥 파악 객관식 (Q16-Q22)
    -- ═══════════════════════════════════════
    -- #16 대화 빈칸 채우기
    jsonb_build_object('number',16,'question',E'다음 대화의 빈칸에 들어갈 말로 가장 적절한 것은?\n\nA: The sky looks really dark.\nB: I know. I wonder ________________.\nA: Let''s bring an umbrella just in case.','options',jsonb_build_array('if it rains tomorrow','if it will rain this afternoon','if it rained yesterday','if does it rain soon','if will it rain later'),'answer','2'),

    -- #17 대화 빈칸 채우기
    jsonb_build_object('number',17,'question',E'다음 대화의 빈칸에 들어갈 말로 가장 적절한 것은?\n\nA: Did you hear about the field trip?\nB: Not yet. Do you know ________________?\nA: I heard it might be next Friday.','options',jsonb_build_array('if is it next week','if the field trip is next week','if will the field trip be next week','whether is the trip next week','that the trip is next week'),'answer','2'),

    -- #18 대화 빈칸 채우기
    jsonb_build_object('number',18,'question',E'다음 대화의 빈칸에 들어갈 말로 가장 적절한 것은?\n\nA: I sent an email to the teacher yesterday.\nB: Oh, really? I''m curious ________________.\nA: Me too. I hope she says yes.','options',jsonb_build_array('if she will reply','if will she reply','if does she reply','that she replied','if replied she'),'answer','1'),

    -- #19 글의 빈칸 채우기
    jsonb_build_object('number',19,'question',E'다음 글의 빈칸에 들어갈 말로 가장 적절한 것은?\n\nLast week, our class decided to have a talent show. Everyone was excited, but nobody knew ________________. We asked our homeroom teacher, and she said she would tell us by Wednesday.','options',jsonb_build_array('if will the show be on Friday','if the show would be on Friday','that the show was on Friday','if was the show on Friday','if on Friday would the show be'),'answer','2'),

    -- #20 글의 빈칸 채우기
    jsonb_build_object('number',20,'question',E'다음 글의 빈칸에 들어갈 말로 가장 적절한 것은?\n\nJina lost her wallet on the bus yesterday. She went to the bus company and asked ________________. The staff told her to wait a few days.','options',jsonb_build_array('if someone had found it','if had someone found it','if someone will find it','that someone found it','if did someone find it'),'answer','1'),

    -- #21 대화 빈칸 채우기 (if vs whether)
    jsonb_build_object('number',21,'question',E'다음 대화의 빈칸에 들어갈 말로 가장 적절한 것은?\n\nA: Are you going to the science fair?\nB: I haven''t decided yet. I''m thinking about ________________.\nA: I think you should go. It sounds fun!','options',jsonb_build_array('if I should go','if should I go','if to go or not','whether to go or not','that I should go'),'answer','4'),

    -- #22 글의 빈칸 채우기
    jsonb_build_object('number',22,'question',E'다음 글의 빈칸에 들어갈 말로 가장 적절한 것은?\n\nMinho wanted to buy a birthday gift for his friend. He visited three different shops, but he couldn''t decide ________________. Finally, he chose a nice notebook.','options',jsonb_build_array('if what to buy','if to buy what','whether he should buy a book or a pen','if should he buy a book','that he bought a pen'),'answer','3')
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 4: 서술형 — 문장 전환 whether ↔ if (Q23-Q30)
    -- ═══════════════════════════════════════
    -- #23 whether → if
    jsonb_build_object('number',23,'question',E'다음 문장을 if를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nI wonder whether she is coming to the party.','options',jsonb_build_array(),'answer',E'I wonder if she is coming to the party.','acceptedAnswers',jsonb_build_array('I wonder if she is coming to the party.')),

    -- #24 if → whether
    jsonb_build_object('number',24,'question',E'다음 문장을 whether를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nDo you know if he passed the exam?','options',jsonb_build_array(),'answer',E'Do you know whether he passed the exam?','acceptedAnswers',jsonb_build_array('Do you know whether he passed the exam?')),

    -- #25 직접 의문문 → 간접 의문문 (I wonder if)
    jsonb_build_object('number',25,'question',E'다음 문장을 "I wonder"로 시작하는 간접 의문문으로 바꾸시오.\n\nIs he coming to the concert tonight?','options',jsonb_build_array(),'answer',E'I wonder if he is coming to the concert tonight.','acceptedAnswers',jsonb_build_array('I wonder whether he is coming to the concert tonight.','I wonder if he is coming to the concert tonight.')),

    -- #26 직접 의문문 → 간접 의문문 (Do you know if)
    jsonb_build_object('number',26,'question',E'다음 문장을 "Do you know"로 시작하는 간접 의문문으로 바꾸시오.\n\nDoes she like science?','options',jsonb_build_array(),'answer',E'Do you know if she likes science?','acceptedAnswers',jsonb_build_array('Do you know whether she likes science?','Do you know if she likes science?')),

    -- #27 직접 화법 → 간접 화법 (asked if)
    jsonb_build_object('number',27,'question',E'다음 문장을 간접 화법으로 바꾸시오.\n\nShe asked, "Are you tired?"','options',jsonb_build_array(),'answer',E'She asked if I was tired.','acceptedAnswers',jsonb_build_array('She asked whether I was tired.','She asked me if I was tired.','She asked me whether I was tired.')),

    -- #28 직접 화법 → 간접 화법 (asked if + 시제 변화)
    jsonb_build_object('number',28,'question',E'다음 문장을 간접 화법으로 바꾸시오.\n\nHe asked me, "Did you finish the report?"','options',jsonb_build_array(),'answer',E'He asked me if I had finished the report.','acceptedAnswers',jsonb_build_array('He asked me whether I had finished the report.','He asked if I had finished the report.')),

    -- #29 whether → if
    jsonb_build_object('number',29,'question',E'다음 문장을 if를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nShe wants to know whether the store closes at nine.','options',jsonb_build_array(),'answer',E'She wants to know if the store closes at nine.','acceptedAnswers',jsonb_build_array('She wants to know if the store closes at nine.')),

    -- #30 직접 의문문 → 간접 의문문 (I''m not sure if)
    jsonb_build_object('number',30,'question',E'다음 문장을 "I''m not sure"로 시작하는 간접 의문문으로 바꾸시오.\n\nWill the teacher give us homework today?','options',jsonb_build_array(),'answer',E'I''m not sure if the teacher will give us homework today.','acceptedAnswers',jsonb_build_array('I''m not sure whether the teacher will give us homework today.','I''m not sure if the teacher will give us homework today.'))
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 5: 서술형 — 빈칸 채우기 (Q31-Q38)
    -- ═══════════════════════════════════════
    -- #31 빈칸에 알맞은 접속사 쓰기
    jsonb_build_object('number',31,'question',E'다음 빈칸에 들어갈 알맞은 말을 쓰시오.\n\nI''m not sure _______ she will attend the meeting tomorrow.','options',jsonb_build_array(),'answer',E'if','acceptedAnswers',jsonb_build_array('if','whether')),

    -- #32 빈칸에 알맞은 접속사 쓰기
    jsonb_build_object('number',32,'question',E'다음 빈칸에 들어갈 알맞은 말을 쓰시오.\n\nHe asked me _______ I had ever been to Jeju Island.','options',jsonb_build_array(),'answer',E'if','acceptedAnswers',jsonb_build_array('if','whether')),

    -- #33 빈칸에 동사 알맞은 형태 쓰기 (명사절 if에서 will 가능)
    jsonb_build_object('number',33,'question',E'다음 괄호 안의 단어를 알맞은 형태로 바꿔 쓰시오.\n\nI wonder if she _______ (come) to the party next Saturday.','options',jsonb_build_array(),'answer',E'will come','acceptedAnswers',jsonb_build_array('will come')),

    -- #34 빈칸에 동사 알맞은 형태 쓰기 (간접 화법 시제 일치)
    jsonb_build_object('number',34,'question',E'다음 괄호 안의 단어를 알맞은 형태로 바꿔 쓰시오.\n\nShe asked me if I _______ (like) playing soccer.','options',jsonb_build_array(),'answer',E'liked','acceptedAnswers',jsonb_build_array('liked')),

    -- #35 빈칸에 알맞은 말 쓰기 (whether + or not)
    jsonb_build_object('number',35,'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸에 알맞은 말을 쓰시오.\n\nI don''t know if he will come.\n= I don''t know _______ he will come or not.','options',jsonb_build_array(),'answer',E'whether','acceptedAnswers',jsonb_build_array('whether')),

    -- #36 빈칸에 알맞은 접속사 쓰기 (if vs that 구분)
    jsonb_build_object('number',36,'question',E'다음 빈칸에 if 또는 that 중 알맞은 것을 쓰시오.\n\nI believe _______ she is telling the truth.','options',jsonb_build_array(),'answer',E'that','acceptedAnswers',jsonb_build_array('that')),

    -- #37 빈칸에 알맞은 접속사 쓰기 (if vs that 구분)
    jsonb_build_object('number',37,'question',E'다음 빈칸에 if 또는 that 중 알맞은 것을 쓰시오.\n\nI''m not sure _______ he is at home right now.','options',jsonb_build_array(),'answer',E'if','acceptedAnswers',jsonb_build_array('if','whether')),

    -- #38 빈칸에 알맞은 말 쓰기
    jsonb_build_object('number',38,'question',E'다음 빈칸에 들어갈 알맞은 말을 쓰시오.\n\nPlease check _______ the door is locked before you leave.','options',jsonb_build_array(),'answer',E'if','acceptedAnswers',jsonb_build_array('if','whether'))
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 6: 서술형 — 오류 수정 (완전한 문장) (Q39-Q44)
    -- ═══════════════════════════════════════
    -- #39 의문문 어순 오류 → 평서문 어순
    jsonb_build_object('number',39,'question',E'다음 문장에서 틀린 부분을 고쳐 완전한 문장으로 다시 쓰시오.\n\nI wonder if is she a good singer.','options',jsonb_build_array(),'answer',E'I wonder if she is a good singer.','acceptedAnswers',jsonb_build_array('I wonder if she is a good singer.')),

    -- #40 의문문 어순 오류 → 평서문 어순
    jsonb_build_object('number',40,'question',E'다음 문장에서 틀린 부분을 고쳐 완전한 문장으로 다시 쓰시오.\n\nDo you know if can he speak French?','options',jsonb_build_array(),'answer',E'Do you know if he can speak French?','acceptedAnswers',jsonb_build_array('Do you know if he can speak French?')),

    -- #41 that → if (확실하지 않은 내용에 that 사용 오류)
    jsonb_build_object('number',41,'question',E'다음 문장에서 틀린 부분을 고쳐 완전한 문장으로 다시 쓰시오.\n\nI don''t know that she will come to the meeting.','options',jsonb_build_array(),'answer',E'I don''t know if she will come to the meeting.','acceptedAnswers',jsonb_build_array('I don''t know whether she will come to the meeting.','I don''t know if she will come to the meeting.')),

    -- #42 의문문 어순 오류 (do 삽입 오류)
    jsonb_build_object('number',42,'question',E'다음 문장에서 틀린 부분을 고쳐 완전한 문장으로 다시 쓰시오.\n\nShe asked me if did I enjoy the concert.','options',jsonb_build_array(),'answer',E'She asked me if I enjoyed the concert.','acceptedAnswers',jsonb_build_array('She asked me if I enjoyed the concert.','She asked me whether I enjoyed the concert.')),

    -- #43 if or not → whether or not (if + or not 오류)
    jsonb_build_object('number',43,'question',E'다음 문장에서 틀린 부분을 고쳐 완전한 문장으로 다시 쓰시오.\n\nI''m curious if or not he passed the test.','options',jsonb_build_array(),'answer',E'I''m curious whether or not he passed the test.','acceptedAnswers',jsonb_build_array('I''m curious whether or not he passed the test.','I''m curious if he passed the test or not.')),

    -- #44 의문문 어순 오류 + will
    jsonb_build_object('number',44,'question',E'다음 문장에서 틀린 부분을 고쳐 완전한 문장으로 다시 쓰시오.\n\nHe wants to know if will the game be canceled.','options',jsonb_build_array(),'answer',E'He wants to know if the game will be canceled.','acceptedAnswers',jsonb_build_array('He wants to know if the game will be canceled.','He wants to know whether the game will be canceled.'))
  )
  ||
  jsonb_build_array(
    -- ═══════════════════════════════════════
    -- Part 7: 모두고르기 (Q45-Q50)
    -- ═══════════════════════════════════════
    -- #45 if가 명사절로 쓰인 것 모두 고르기
    jsonb_build_object('number',45,'question',E'다음 중 if가 명사절(~인지 아닌지)로 쓰인 것을 모두 고르시오.','options',jsonb_build_array('I wonder if he passed the exam.','If you study hard, you will pass the test.','Do you know if the store is open today?','If it rains, we will stay home.','I''m curious if she received my message.'),'answer','1,3,5'),

    -- #46 if가 명사절로 쓰인 것 모두 고르기
    jsonb_build_object('number',46,'question',E'다음 중 if가 명사절(~인지 아닌지)로 쓰인 것을 모두 고르시오.','options',jsonb_build_array('She asked me if I could help her.','If the weather is nice, let''s go for a walk.','Nobody knows if the rumor is true.','If you don''t hurry, you will be late.','He wants to find out if the museum is free on weekends.'),'answer','1,3,5'),

    -- #47 어법상 옳은 문장 모두 고르기 (명사절 if 어순 관련)
    jsonb_build_object('number',47,'question',E'다음 중 어법상 옳은 문장을 모두 고르시오.','options',jsonb_build_array('I wonder if she will come to the party.','Do you know if is the library open?','He asked me if I had seen the movie.','She wants to know if can he drive.','I''m not sure if the meeting starts at two.'),'answer','1,3,5'),

    -- #48 어법상 옳은 문장 모두 고르기 (if/whether/that 구분)
    jsonb_build_object('number',48,'question',E'다음 중 어법상 옳은 문장을 모두 고르시오.','options',jsonb_build_array('I believe that honesty is important.','I don''t know that she will join us.','She asked him whether he liked soccer.','He wonders if the bus has already left.','I''m sure if she is a kind person.'),'answer','1,3,4'),

    -- #49 if가 명사절로 쓰인 것 모두 고르기
    jsonb_build_object('number',49,'question',E'다음 중 밑줄 친 if가 "~인지 아닌지"의 뜻으로 쓰인 것을 모두 고르시오.','options',jsonb_build_array('Can you tell me <u>if</u> this seat is taken?','<u>If</u> you press this button, the machine will start.','I''m not sure <u>if</u> the concert has been canceled.','<u>If</u> we leave now, we can catch the early train.','She doubts <u>if</u> he will keep his promise.'),'answer','1,3,5'),

    -- #50 어법상 옳은 문장 모두 고르기 (명사절 if 종합)
    jsonb_build_object('number',50,'question',E'다음 중 어법상 옳은 문장을 모두 고르시오.','options',jsonb_build_array('I wonder if will she come tomorrow.','Please check if the window is closed.','He asked me if did I finish my homework.','Do you know if the exam is on Monday?','She is curious whether he will accept the offer.'),'answer','2,4,5')
  );

  a := jsonb_build_array(
    -- Part 1: 어법 판단 (Q1-Q8)
    '4','2','3','2','3','1','5','4',
    -- Part 2: 어색한 문장 (Q9-Q15)
    '3','3','3','3','4','4','3',
    -- Part 3: 문맥 파악 (Q16-Q22)
    '2','2','1','2','1','4','3',
    -- Part 4: 문장 전환 서술형 (Q23-Q30)
    'I wonder if she is coming to the party.',
    'Do you know whether he passed the exam?',
    'I wonder if he is coming to the concert tonight.',
    'Do you know if she likes science?',
    'She asked if I was tired.',
    'He asked me if I had finished the report.',
    'She wants to know if the store closes at nine.',
    'I''m not sure if the teacher will give us homework today.',
    -- Part 5: 빈칸 채우기 서술형 (Q31-Q38)
    'if','if','will come','liked','whether','that','if','if',
    -- Part 6: 오류 수정 서술형 (Q39-Q44)
    'I wonder if she is a good singer.',
    'Do you know if he can speak French?',
    'I don''t know if she will come to the meeting.',
    'She asked me if I enjoyed the concert.',
    'I''m curious whether or not he passed the test.',
    'He wants to know if the game will be canceled.',
    -- Part 7: 모두고르기 (Q45-Q50)
    '1,3,5','1,3,5','1,3,5','1,3,4','1,3,5','2,4,5'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('명사절 접속사 if Step2', '명사절 접속사 if', q, a, 'problem', 'interactive');

  RAISE NOTICE '명사절 접속사 if Step2 템플릿 생성 완료 (50문제)';
END;
$$;
