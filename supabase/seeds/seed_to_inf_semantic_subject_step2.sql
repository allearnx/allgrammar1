DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = 'to부정사의 의미상의 주어 Step2';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- Part 1: 빈칸 채우기 기본 (Q1~Q5)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1,
      'question',E'다음 빈칸에 들어갈 말로 가장 적절한 것은?\n\nIt is generous _______ to share your lunch with others.',
      'options',jsonb_build_array('by you','for you','of you','to you','with you'),
      'answer','3'),

    jsonb_build_object('number',2,
      'question',E'다음 빈칸에 들어갈 말로 알맞은 것은?\n\nIt is essential _______ to wear safety helmets at the site.',
      'options',jsonb_build_array('to them','of them','by them','for them','with them'),
      'answer','4'),

    jsonb_build_object('number',3,
      'question',E'다음 빈칸에 들어갈 말이 차례대로 연결된 것은?\n\nIt is _______ noisy _______ us to study in this room.',
      'options',jsonb_build_array('very — for','too — for','so — of','too — of','so — for'),
      'answer','2'),

    jsonb_build_object('number',4,
      'question',E'다음 빈칸에 들어갈 말로 가장 적절한 것은?\n\nIt is _______ of her to forgive him so easily.',
      'options',jsonb_build_array('essential','impossible','necessary','convenient','generous'),
      'answer','5'),

    jsonb_build_object('number',5,
      'question',E'다음 빈칸에 들어갈 말로 알맞은 것은?\n\nIt is necessary for everyone _______ the safety rules carefully.',
      'options',jsonb_build_array('follow','following','to follow','followed','are following'),
      'answer','3'),

    -- ═══════════════════════════════════════════
    -- Part 2: 적절하지 않은 것 (Q6~Q7)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',6,
      'question',E'다음 빈칸에 들어갈 말로 적절하지 않은 것은?\n\nIt is _______ for them to finish the project on time.',
      'options',jsonb_build_array('polite','hard','possible','important','easy'),
      'answer','1'),

    jsonb_build_object('number',7,
      'question',E'다음 대화의 빈칸에 들어갈 말로 적절하지 않은 것은?\n\nA: Did you see what she did for the homeless?\nB: Yes, it was _______ of her to do that.',
      'options',jsonb_build_array('thoughtful','brave','wise','difficult','generous'),
      'answer','4'),

    -- ═══════════════════════════════════════════
    -- Part 3: 전환 / 영작 (Q8~Q15)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',8,
      'question',E'다음 우리말을 아래와 같이 쓸 때, 빈칸에 들어갈 말이 차례대로 연결된 것은?\n\n그가 매일 운동하는 것은 중요한 일이다.\n→ It is important _______ him _______ exercise every day.',
      'options',jsonb_build_array('of — to','of — doing','for — to','for — doing','of — to be done'),
      'answer','3'),

    jsonb_build_object('number',9,
      'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 들어갈 말이 차례대로 짝지어진 것은?\n\nTo learn a foreign language takes a lot of effort.\n= _______ takes a lot of effort _______ a foreign language.',
      'options',jsonb_build_array('That — to learned','It — to learn','That — learning','It — learning','It — to learning'),
      'answer','2'),

    jsonb_build_object('number',10,
      'question',E'다음 두 문장을 한 문장으로 바꿔 쓸 때 빈칸에 들어갈 말로 바르게 연결된 것은?\n\nHe enjoys solving math puzzles. + To solve math puzzles is exciting.\n→ _______ is exciting _______ him to solve math puzzles.',
      'options',jsonb_build_array('That — for','It — of','That — of','It — that','It — for'),
      'answer','5'),

    jsonb_build_object('number',11,
      'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 배열할 때 네 번째로 오는 것은?\n\n그의 여동생이 매일 5시에 일어나는 것은 놀랍다.\n(surprising, it, to, every day, his sister, is, get up at 5, for)',
      'options',jsonb_build_array('surprising','his sister','to','for','every day'),
      'answer','4'),

    jsonb_build_object('number',12,
      'question',E'다음 우리말을 바르게 영작한 것은?\n\n그녀가 그 에세이를 완성하는 데 5시간이 걸렸다.',
      'options',jsonb_build_array(
        'It took 5 hours for her to finish the essay.',
        'It took to her 5 hours to finish the essay.',
        'It took for her 5 hours to finish the essay.',
        'It took her 5 hours finish the essay.',
        'It took her 5 hours finishing the essay.'),
      'answer','1'),

    jsonb_build_object('number',13,
      'question',E'다음 우리말을 바르게 영작한 것은?\n\n학생들이 밤늦게까지 깨어 있는 것은 건강에 좋지 않다.',
      'options',jsonb_build_array(
        'Students stay up late unhealthily.',
        'It is unhealthy students to stay up late.',
        'To stay up late is unhealthy of students.',
        'It is unhealthy of students to stay up late.',
        'It is unhealthy for students to stay up late.'),
      'answer','5'),

    jsonb_build_object('number',14,
      'question',E'다음 우리말을 바르게 영작한 것은?\n\n그가 이 무거운 상자를 혼자 드는 것이 가능할까?',
      'options',jsonb_build_array(
        'Is it possible of him to lift this heavy box alone?',
        'Is it possible for him to lift this heavy box alone?',
        'Is it possible him to lifting this heavy box alone?',
        'Is it possible to him lift this heavy box alone?',
        'Is it possible for him lifting this heavy box alone?'),
      'answer','2'),

    jsonb_build_object('number',15,
      'question',E'다음 우리말을 바르게 영작한 것은?\n\n노인들이 빙판길을 걷는 것은 위험하다.',
      'options',jsonb_build_array(
        'Old people walk on icy roads dangerously.',
        'It is dangerous of elderly people to walk on icy roads.',
        'To walk on icy roads is dangerous of elderly people.',
        'It is dangerous for elderly people to walk on icy roads.',
        'Elderly people walk dangerously on icy roads.'),
      'answer','4'),

    -- ═══════════════════════════════════════════
    -- Part 4: 짝짓기 (Q16~Q18)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',16,
      'question',E'다음 빈칸에 들어갈 말이 순서대로 바르게 짝지어진 것은?\n\n• It is difficult _______ her to wake up before sunrise.\n• It was important _______ them to prepare for the interview.\n• It was brave _______ you to speak the truth.',
      'options',jsonb_build_array('for — for — of','of — of — for','of — for — of','for — of — for','for — of — of'),
      'answer','1'),

    jsonb_build_object('number',17,
      'question',E'다음 빈칸 ⓐ~ⓒ에 들어갈 말이 차례대로 바르게 나열된 것은?\n\n• It was hard ⓐ_______ us to accept the result.\n• It was careless ⓑ_______ her to leave the door unlocked.\n• It is selfish ⓒ_______ him not to share with others.',
      'options',jsonb_build_array('of — for — of','for — for — for','for — of — of','of — of — for','of — of — of'),
      'answer','3'),

    jsonb_build_object('number',18,
      'question',E'다음 (A)~(E)의 빈칸에 들어갈 말이 알맞게 연결된 것은?\n\n(A) It was tough _______ me to finish the marathon.\n(B) It was foolish _______ him to trust a complete stranger.\n(C) It is simple _______ her to solve this puzzle.\n(D) It would be impossible _______ us to climb that mountain.\n(E) _______ eat breakfast every day is healthy.\n\n     (A)     (B)     (C)     (D)     (E)',
      'options',jsonb_build_array(
        'of — for — of — for — To',
        'for — of — for — for — To',
        'for — for — of — for — For',
        'of — of — for — of — To',
        'for — of — of — for — For'),
      'answer','2'),

    -- ═══════════════════════════════════════════
    -- Part 5: 다른 것 / 같은 것 고르기 (Q19~Q23)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',19,
      'question',E'다음 중 빈칸에 들어갈 말이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'It is hard _______ students to memorize all the vocabulary.',
        'It is risky _______ them to cross the busy street alone.',
        'It is necessary _______ us to wear seat belts in the car.',
        'It was not simple _______ him to learn the new software.',
        'It was thoughtful _______ her to bring us some snacks.'),
      'answer','5'),

    jsonb_build_object('number',20,
      'question',E'다음 중 빈칸에 들어갈 말이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'It is wise _______ him to save money for the future.',
        'It is tricky _______ us to solve this riddle.',
        'Is it safe _______ me to drink this water?',
        'It is impossible _______ her to run a full marathon.',
        'It is essential _______ them to follow the instructions.'),
      'answer','1'),

    jsonb_build_object('number',21,
      'question',E'다음 중 빈칸에 들어갈 말이 나머지와 다른 하나는?',
      'options',jsonb_build_array(
        'It is challenging _______ her to keep up with the advanced class.',
        'It is careless _______ you to lose your phone again.',
        'It was silly _______ them to believe that rumor.',
        'It was rude _______ him to interrupt the speaker.',
        'It is clever _______ her to find a shortcut home.'),
      'answer','1'),

    jsonb_build_object('number',22,
      'question',E'Choose the sentence that has a different word in the blank from the others.',
      'options',jsonb_build_array(
        'It is important _______ you to practice every day.',
        'It was considerate _______ her to offer her seat.',
        'It is risky _______ children to play near the road.',
        'It was tough _______ me to carry all these bags.',
        'Is it possible _______ them to arrive before noon?'),
      'answer','2'),

    jsonb_build_object('number',23,
      'question',E'다음 주어진 문장의 빈칸에 들어갈 말과 같은 것은?\n\nIt is selfish _______ him not to share his toys.',
      'options',jsonb_build_array(
        'It is easy _______ Tom to fix broken computers.',
        'It is necessary _______ us to bring our own lunch boxes.',
        'It was hard _______ them to wake up so early.',
        'It was foolish _______ her to trust that stranger.',
        'It is possible _______ me to finish it by Friday.'),
      'answer','4'),

    -- ═══════════════════════════════════════════
    -- Part 6: It / for 쓰임 구별 (Q24~Q28)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',24,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        '<u>It</u> is getting warmer these days.',
        '<u>It</u> is generous of you to donate to charity.',
        '<u>It</u> is hard to believe his story.',
        '<u>It</u> is necessary for us to save water.',
        '<u>It</u> was exciting for her to travel abroad.'),
      'answer','1'),

    jsonb_build_object('number',25,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은?\n\n<보기> <u>It</u> is dangerous for kids to play near the cliff.',
      'options',jsonb_build_array(
        '<u>It</u> rained heavily all day yesterday.',
        '<u>It</u> is mine, not yours.',
        '<u>It</u> is almost midnight now.',
        '<u>It</u> is important for students to read more books.',
        '<u>It</u> looks like a cat from here.'),
      'answer','4'),

    jsonb_build_object('number',26,
      'question',E'다음 중 밑줄 친 <u>It</u>의 쓰임이 <보기>와 같은 것은?\n\n<보기> <u>It</u> is wise of you to start preparing early.',
      'options',jsonb_build_array(
        'She bought a new laptop, and <u>it</u> works very well.',
        '<u>It</u> was so foggy that we could not see anything.',
        '<u>It</u> is not safe for children to use sharp scissors.',
        '<u>It</u> is about 3 kilometers from here to the station.',
        'If <u>it</u> snows tomorrow, the school will be closed.'),
      'answer','3'),

    jsonb_build_object('number',27,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은?\n\n<보기> It is challenging <u>for</u> her to manage the team alone.',
      'options',jsonb_build_array(
        'We waited <u>for</u> about 30 minutes.',
        'Thank you <u>for</u> your help.',
        'This is the best place <u>for</u> him to practice swimming.',
        '<u>For</u> breakfast, she usually has cereal.',
        'He is looking <u>for</u> a part-time job.'),
      'answer','3'),

    jsonb_build_object('number',28,
      'question',E'다음 중 밑줄 친 <u>It</u>의 쓰임과 같은 것은?\n\n<보기> <u>It</u> was thoughtful of her to write a thank-you card.',
      'options',jsonb_build_array(
        '<u>It</u> was snowing when we arrived at the airport.',
        '<u>It</u> is 20 minutes by subway from here.',
        'My cat is sleeping because <u>it</u> ate too much.',
        '<u>It</u> is not far from the school to the library.',
        '<u>It</u> is necessary for everyone to follow the rules.'),
      'answer','5'),

    -- ═══════════════════════════════════════════
    -- Part 7: 어법 판별 (Q29~Q41)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',29,
      'question',E'다음 밑줄 친 부분 중 어법상 옳은 것은?',
      'options',jsonb_build_array(
        'It is brave <u>of her</u> to speak up in front of everyone.',
        'It is hard <u>of us</u> to complete this task alone.',
        'It is not safe <u>of children</u> to cross the street alone.',
        'It is very nice <u>for you</u> to help carry the groceries.',
        'Is it okay <u>for his</u> to use your computer?'),
      'answer','1'),

    jsonb_build_object('number',30,
      'question',E'다음 밑줄 친 부분 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'It would be tough <u>for beginners</u> to understand this concept.',
        'It is foolish <u>for you</u> to spend all your savings at once.',
        'It is polite <u>of her</u> to hold the door open for others.',
        'It is so kind <u>of them</u> to volunteer at the shelter.',
        'It is essential <u>for students</u> to submit homework on time.'),
      'answer','2'),

    jsonb_build_object('number',31,
      'question',E'다음 밑줄 친 부분 중 어법상 옳은 것은?',
      'options',jsonb_build_array(
        'It was silly <u>for him</u> to argue with the teacher.',
        'It is necessary <u>of everyone</u> to arrive on time.',
        'It is generous <u>for her</u> to donate half of her allowance.',
        'It is rude <u>for them</u> to leave without saying goodbye.',
        'It was wise <u>of him</u> to save his pocket money.'),
      'answer','5'),

    jsonb_build_object('number',32,
      'question',E'다음 중 어법상 옳은 문장은?',
      'options',jsonb_build_array(
        'It is easy for her speaking three languages.',
        'It is important of him to exercise regularly.',
        'It was difficult for them to find the right answer.',
        'It is careless for you to forget your keys again.',
        'It is impossible for his to finish the work on time.'),
      'answer','3'),

    jsonb_build_object('number',33,
      'question',E'다음 중 어법상 어색한 문장은?',
      'options',jsonb_build_array(
        'It is nice for her to say such things about me.',
        'To get enough sleep is very important for your health.',
        'It will be hard for him to accept the truth.',
        'It is possible for us to finish the project by Friday.',
        'It was challenging for the team to win the championship.'),
      'answer','1'),

    jsonb_build_object('number',34,
      'question',E'다음 중 어법상 어색한 문장은?',
      'options',jsonb_build_array(
        'It is generous of you to share your notes with me.',
        'It was tough for her to climb the mountain.',
        'It is essential for all passengers to fasten seat belts.',
        'It is impossible of a beginner to master this in a week.',
        'It is very brave of him to rescue the drowning child.'),
      'answer','4'),

    jsonb_build_object('number',35,
      'question',E'다음 중 어법상 옳은 문장은?',
      'options',jsonb_build_array(
        'It is tough of me to handle this alone.',
        'It is considerate for her to remember my birthday.',
        'It is thrilling of us to ride the roller coaster.',
        'It was smart of her to bring an extra umbrella.',
        'It is risky of small children to swim without adults.'),
      'answer','4'),

    jsonb_build_object('number',36,
      'question',E'다음 중 어법상 옳은 문장은?',
      'options',jsonb_build_array(
        'It is scary for me to watching horror movies alone.',
        'It was brave of the firefighter to enter the burning building.',
        'It is hard her to live far from her family.',
        'It was ridiculous for him to believe such a lie.',
        'It is simple of me to solve this math problem.'),
      'answer','2'),

    jsonb_build_object('number',37,
      'question',E'다음 중 어법상 옳은 문장은?',
      'options',jsonb_build_array(
        'It was not easy of me to make that decision.',
        'It is generous for Tom to help his classmates.',
        'It is important to say for you ''yes'' sometimes.',
        'It was careless for her to leave the stove on.',
        'It is very thoughtful of you to bring flowers for her.'),
      'answer','5'),

    jsonb_build_object('number',38,
      'question',E'다음 중 어법상 옳은 문장은? (정답 2개)',
      'options',jsonb_build_array(
        'It was kind of her to pack lunch for the whole team.',
        'It is tough to him understand the instructions.',
        'It is easy that he solves math problems quickly.',
        'It is challenging of him to run a full marathon.',
        'It is important for us to respect other people''s opinions.'),
      'answer','1, 5'),

    jsonb_build_object('number',39,
      'question',E'다음 중 어법상 옳은 문장은? (정답 2개)',
      'options',jsonb_build_array(
        'It is strange of him to act like that.',
        'It was considerate of you to remember her birthday.',
        'It will be simple of her to pass the driving test.',
        'It is impossible of the problem to be solved quickly.',
        'It was exciting for us to visit the science museum.'),
      'answer','2, 5'),

    jsonb_build_object('number',40,
      'question',E'Which sentence is grammatically correct?',
      'options',jsonb_build_array(
        'It is very generous for her to help everyone.',
        'It was so careless of him to forget the meeting.',
        'It is useless of you to argue with the manager.',
        'It was considerate for them to bring snacks for the party.',
        'It is hard for me wake up early on weekends.'),
      'answer','2'),

    jsonb_build_object('number',41,
      'question',E'다음 중 어법상 옳은 문장끼리 알맞게 짝지어진 것은?\n\nⓐ It is honest of her to admit her mistakes.\nⓑ It is rude for you to talk during the movie.\nⓒ It isn''t safe students to walk home alone at night.\nⓓ It was clever of him to save money from a young age.\nⓔ This book is easy enough for beginners to understand.',
      'options',jsonb_build_array('ⓐ, ⓑ, ⓒ','ⓐ, ⓒ, ⓓ','ⓐ, ⓓ, ⓔ','ⓑ, ⓒ, ⓓ','ⓑ, ⓓ, ⓔ'),
      'answer','3')
  );

  a := jsonb_build_array(
    '3','4','2','5','3','1','4','3','2','5',
    '4','1','5','2','4','1','3','2','5','1',
    '1','2','4','1','4','3','3','5','1','2',
    '5','3','1','4','4','2','5','1, 5','2, 5','2',
    '3'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('to부정사의 의미상의 주어 Step2', 'to부정사의 의미상의 주어', q, a, 'problem', 'interactive');

  RAISE NOTICE 'to부정사의 의미상의 주어 Step2 템플릿 생성 완료 (41문제, 전체 객관식, paraphrased)';
END;
$$;
