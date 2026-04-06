DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = 'to부정사의 형용사적 용법 Step3';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- Part 1: 빈칸 채우기 (Q1~Q6)
    -- ═══════════════════════════════════════════

    -- Q1 (C: to부정사 + 전치사)
    jsonb_build_object('number',1,
      'question',E'다음 문장의 빈칸에 들어갈 말로 가장 적절한 것은?\n\nI need a chair _______________.',
      'options',jsonb_build_array('to sit','to sit on','sitting','for sit on','sit on'),
      'answer','2'),

    -- Q2 (C: to부정사 + 전치사)
    jsonb_build_object('number',2,
      'question',E'다음 문장의 빈칸에 들어갈 말로 가장 적절한 것은?\n\nShe wants a topic _______________.',
      'options',jsonb_build_array('to talk','talk about','to talking about','to talk about','for talking'),
      'answer','4'),

    -- Q3 (B: 부정형 to부정사)
    jsonb_build_object('number',3,
      'question',E'다음 문장의 빈칸에 들어갈 말로 가장 적절한 것은?\n\nHe made a decision _______________ anymore.',
      'options',jsonb_build_array('to not wait','not waiting','not to wait','wait not to','to wait not'),
      'answer','3'),

    -- Q4 (D: 공통 빈칸)
    jsonb_build_object('number',4,
      'question',E'다음 빈칸에 공통으로 들어갈 알맞은 것은?\n\n• There is nothing _______ about the test.\n• She has a lot of things _______ before the trip.',
      'options',jsonb_build_array('worry','worries','worrying','to worry','worried'),
      'answer','4'),

    -- Q5 (F: 쌍 빈칸 ⓐⓑ)
    jsonb_build_object('number',5,
      'question',E'다음 빈칸 ⓐ, ⓑ에 들어갈 말이 차례대로 짝지어진 것은?\n\n• She needs a bowl ⓐ_______.\n• I want a friend ⓑ_______.',
      'options',jsonb_build_array('to put - talk with','putting in - to talk','to put the soup in - to talk with','to put in - talking to','for putting - to talk'),
      'answer','3'),

    -- Q6 (F: 쌍 빈칸 ⓐⓑ)
    jsonb_build_object('number',6,
      'question',E'Which of the following best fits in the blanks?\n\n• He is looking for a wall ⓐ_______.\n• We need a box ⓑ_______.',
      'options',jsonb_build_array(
        'ⓐ to hang      ⓑ to keep',
        'ⓐ to hang the picture on  ⓑ to keep our tools in',
        'ⓐ hanging on    ⓑ keeping in',
        'ⓐ for hanging   ⓑ for keep',
        'ⓐ to hang on    ⓑ to keeping in'),
      'answer','2'),

    -- ═══════════════════════════════════════════
    -- Part 2: 문장 구성 (Q7~Q11)
    -- ═══════════════════════════════════════════

    -- Q7 (G: 우리말 영작)
    jsonb_build_object('number',7,
      'question',E'다음 우리말을 바르게 영작한 것은?\n\n나는 같이 놀 친구가 필요하다.',
      'options',jsonb_build_array(
        'I need a friend play with.',
        'I need a friend to play.',
        'I need a friend to play with.',
        'I need to play a friend with.',
        'I need a friend for playing.'),
      'answer','3'),

    -- Q8 (G: 우리말 영작)
    jsonb_build_object('number',8,
      'question',E'다음 우리말을 바르게 영작한 것은?\n\n그에게는 할 일이 많다.',
      'options',jsonb_build_array(
        'He has many things doing.',
        'He has many things to do.',
        'He has to do many things.',
        'He has many to do things.',
        'He to do has many things.'),
      'answer','2'),

    -- Q9 (G: 우리말 영작 — 올바른 것 고르기)
    jsonb_build_object('number',9,
      'question',E'다음 중 우리말을 바르게 영작한 것은?',
      'options',jsonb_build_array(
        '살 집이 필요해. → I need a house to live.',
        '마실 물이 없다. → There is no water to drink.',
        '그녀는 함께 일할 사람이 필요하다. → She needs a person to work.',
        '나는 앉을 벤치가 필요하다. → I need a bench to sit.',
        '쓸 연필 있어? → Do you have a pencil to write?'),
      'answer','2'),

    -- Q10 (E: 단어 배열)
    jsonb_build_object('number',10,
      'question',E'다음 우리말과 일치하도록 괄호 안에 주어진 단어들을 배열할 때 세 번째로 올 단어는?\n\n나는 걸을 수 있는 공원이 필요하다.\n(a, in, need, to, park, walk, I)',
      'options',jsonb_build_array('a','park','need','walk','to'),
      'answer','1'),

    -- Q11 (H: 두 문장 합치기)
    jsonb_build_object('number',11,
      'question',E'다음 두 문장을 한 문장으로 연결한 것이 올바른 것은?\n\nHe bought a notebook. + He writes in it.',
      'options',jsonb_build_array(
        'He bought a notebook to write.',
        'He bought a notebook writing in.',
        'He bought a notebook to write in.',
        'He bought a notebook to writing in.',
        'He bought a notebook for write in.'),
      'answer','3'),

    -- ═══════════════════════════════════════════
    -- Part 3: 용법 구별 (Q12~Q39)
    -- ═══════════════════════════════════════════

    -- Q12 (I: 보기와 같은 쓰임)
    jsonb_build_object('number',12,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은?\n\n<보기> She has a plan to follow.',
      'options',jsonb_build_array(
        'He promised to help his mom.',
        'I was glad to see you.',
        'To be kind is important.',
        'We have many chores to finish.',
        'She ran fast to win the race.'),
      'answer','4'),

    -- Q13 (I: 보기와 같은 쓰임)
    jsonb_build_object('number',13,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은?\n\n<보기> He needs someone to help him.',
      'options',jsonb_build_array(
        'My dream is to become a singer.',
        'She went to the library to return books.',
        'I have a question to ask you.',
        'To swim in the ocean is fun.',
        'He was shocked to hear the truth.'),
      'answer','3'),

    -- Q14 (I: 보기와 같은 쓰임)
    jsonb_build_object('number',14,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은?\n\n<보기> There are many places to visit in Seoul.',
      'options',jsonb_build_array(
        'He decided to change his career.',
        'I was nervous to give the speech.',
        'She needs a bag to carry her books in.',
        'To eat healthy food is a good habit.',
        'His goal is to learn coding.'),
      'answer','3'),

    -- Q15 (I: 보기와 같은 쓰임)
    jsonb_build_object('number',15,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은?\n\n<보기> Give me something cold to drink.',
      'options',jsonb_build_array(
        'She plans to study abroad.',
        'He exercises every day to stay healthy.',
        'To learn a new language takes effort.',
        'I have nothing to wear to the party.',
        'My wish is to travel to Europe.'),
      'answer','4'),

    -- Q16 (I: 보기와 같은 쓰임)
    jsonb_build_object('number',16,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은?\n\n<보기> Do you have any games to play?',
      'options',jsonb_build_array(
        'She used a ladder to reach the shelf.',
        'He was disappointed to fail the test.',
        'I need some tools to fix the bike with.',
        'To practice every day is the key.',
        'Her job is to take care of animals.'),
      'answer','3'),

    -- Q17 (I: 보기와 같은 쓰임)
    jsonb_build_object('number',17,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은?\n\n<보기> She was the first person to arrive.',
      'options',jsonb_build_array(
        'He went to the market to buy vegetables.',
        'I want to learn how to cook.',
        'She has a report to hand in by Friday.',
        'To wake up early is not easy for me.',
        'His dream is to become a pilot.'),
      'answer','3'),

    -- Q18 (I: 보기와 같은 쓰임)
    jsonb_build_object('number',18,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은?\n\n<보기> I need a place to hang my coat.',
      'options',jsonb_build_array(
        'He was relieved to pass the exam.',
        'She wants to adopt a puppy.',
        'To read before bed helps you sleep.',
        'We have enough space to park the car.',
        'They went to the café to chat.'),
      'answer','4'),

    -- Q19 (I: 보기와 같은 쓰임)
    jsonb_build_object('number',19,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은?\n\n<보기> He has a lot of bills to pay.',
      'options',jsonb_build_array(
        'She decided to quit her job.',
        'To be patient is a virtue.',
        'He was the last one to leave the room.',
        'I studied hard to get a good grade.',
        'My plan is to save money.'),
      'answer','3'),

    -- Q20 (K: 나머지와 다른 것)
    jsonb_build_object('number',20,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'I have a lot of clothes to iron.',
        'He needs a reason to stay.',
        'She has several tasks to complete.',
        'They want to go on vacation.',
        'There are many things to consider.'),
      'answer','4'),

    -- Q21 (K: 나머지와 다른 것)
    jsonb_build_object('number',21,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'She has a gift to give her brother.',
        'He needs a place to keep his tools.',
        'I went to the store to buy some snacks.',
        'There are many subjects to study.',
        'We have enough time to prepare.'),
      'answer','3'),

    -- Q22 (K: 나머지와 다른 것)
    jsonb_build_object('number',22,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'I have some files to organize.',
        'She needs a person to rely on.',
        'He has many photos to sort.',
        'We were excited to hear the announcement.',
        'There are lots of dishes to try.'),
      'answer','4'),

    -- Q23 (K: 나머지와 다른 것)
    jsonb_build_object('number',23,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'She has an essay to revise.',
        'To master a skill requires practice.',
        'He has a jacket to return.',
        'I need a spoon to eat the soup with.',
        'There are many apps to explore.'),
      'answer','2'),

    -- Q24 (K: 나머지와 다른 것)
    jsonb_build_object('number',24,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'He has a message to deliver.',
        'She has a car to wash.',
        'I have some gifts to wrap.',
        'We need a plan to follow.',
        'He hopes to win the competition.'),
      'answer','5'),

    -- Q25 (K: 나머지와 다른 것)
    jsonb_build_object('number',25,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'She has a recipe to try this weekend.',
        'I need a shelf to put my books on.',
        'He walked to the park to feed the ducks.',
        'There are many movies to choose from.',
        'We have some boxes to unpack.'),
      'answer','3'),

    -- Q26 (K: 나머지와 다른 것)
    jsonb_build_object('number',26,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'I have a coat to hang up.',
        'She found a nice spot to rest.',
        'He has several books to read.',
        'They have no money to spend.',
        'She was proud to receive the award.'),
      'answer','5'),

    -- Q27 (K: 나머지와 다른 것)
    jsonb_build_object('number',27,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'I have a puzzle to solve.',
        'She needs a topic to write about.',
        'His ambition is to run a marathon.',
        'There are many skills to master.',
        'He has a fence to paint.'),
      'answer','3'),

    -- Q28 (K: 나머지와 다른 것)
    jsonb_build_object('number',28,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'She has a song to memorize.',
        'I need a hook to hang my bag on.',
        'He brought snacks to share with the class.',
        'We saved money to donate to charity.',
        'There are many rules to remember.'),
      'answer','4'),

    -- Q29 (K: 나머지와 다른 것)
    jsonb_build_object('number',29,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'He has an appointment to keep.',
        'She needs a cloth to wipe the table with.',
        'I want to learn to play the guitar.',
        'There are many files to review.',
        'We have a deadline to meet.'),
      'answer','3'),

    -- Q30 (K: 나머지와 다른 것)
    jsonb_build_object('number',30,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'I have some calls to make.',
        'She has a presentation to prepare.',
        'He opened the window to let in fresh air.',
        'There are many websites to check.',
        'We need a rope to tie the box with.'),
      'answer','3'),

    -- Q31 (K: 나머지와 다른 것)
    jsonb_build_object('number',31,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'She has a garden to water.',
        'He needs a brush to paint with.',
        'I have some laundry to fold.',
        'She learned to ride a bicycle.',
        'There are many pages to read.'),
      'answer','4'),

    -- Q32 (K: 나머지와 다른 것)
    jsonb_build_object('number',32,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'He has a project to work on.',
        'She bought thread to sew with.',
        'I have some plants to water.',
        'We were surprised to find the answer.',
        'There are many paths to explore.'),
      'answer','4'),

    -- Q33 (K: 나머지와 다른 것)
    jsonb_build_object('number',33,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'I have a speech to write.',
        'She has some homework to check.',
        'He went to the station to buy a ticket.',
        'There are many colors to pick from.',
        'We need a towel to dry our hands with.'),
      'answer','3'),

    -- Q34 (J: 같은 쓰임끼리 묶기)
    jsonb_build_object('number',34,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것끼리 짝지어진 것은?\n\n<보기> She has a lot of documents to print.\n\nⓐ He decided to move to another city.\nⓑ I need a knife to cut the cake with.\nⓒ They ran to the bus stop to catch the bus.\nⓓ There are many toys to clean up.\nⓔ She was happy to get the gift.',
      'options',jsonb_build_array('ⓐ, ⓑ','ⓐ, ⓓ','ⓑ, ⓒ','ⓑ, ⓓ','ⓒ, ⓔ'),
      'answer','4'),

    -- Q35 (J: 같은 쓰임끼리 묶기)
    jsonb_build_object('number',35,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것끼리 짝지어진 것은?\n\n<보기> He needs a blanket to cover himself with.\n\nⓐ She likes to bake cookies on weekends.\nⓑ I have a list of errands to run.\nⓒ We need a mat to sit on.\nⓓ He went out to walk the dog.\nⓔ There are many channels to subscribe to.',
      'options',jsonb_build_array('ⓐ, ⓑ, ⓒ','ⓑ, ⓒ, ⓓ','ⓑ, ⓒ, ⓔ','ⓐ, ⓓ, ⓔ','ⓒ, ⓓ, ⓔ'),
      'answer','3'),

    -- Q36 (J: 같은 쓰임끼리 묶기)
    jsonb_build_object('number',36,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것끼리 짝지어진 것은?\n\n<보기> I need a friend to go camping with.\n\nⓐ She has many packages to deliver.\nⓑ He hopes to get a scholarship.\nⓒ There are some chairs to set up.\nⓓ We came early to get good seats.\nⓔ He needs a partner to dance with.',
      'options',jsonb_build_array('ⓐ, ⓑ, ⓒ','ⓐ, ⓒ, ⓓ','ⓐ, ⓒ, ⓔ','ⓑ, ⓓ, ⓔ','ⓒ, ⓓ, ⓔ'),
      'answer','3'),

    -- Q37 (L: ⓐ~ⓔ 같은 짝)
    jsonb_build_object('number',37,
      'question',E'다음 밑줄 친 ⓐ~ⓔ 중 쓰임이 같은 것끼리 짝지어진 것은?\n\n• She needs ⓐto find a new apartment.\n• He went to the store ⓑto pick up some groceries.\n• I have a lot of emails ⓒto reply to.\n• Her plan is ⓓto start her own business.\n• We were surprised ⓔto see him there.',
      'options',jsonb_build_array('ⓐ, ⓑ','ⓑ, ⓒ','ⓐ, ⓓ','ⓒ, ⓔ','ⓓ, ⓔ'),
      'answer','3'),

    -- Q38 (N: 서로 다른 짝)
    jsonb_build_object('number',38,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 서로 다른 것끼리 짝지어진 것은?',
      'options',jsonb_build_array(
        'I have some clothes to mend. / She has many tasks to handle.',
        'He needs a room to sleep in. / I need a desk to study at.',
        'She went to the gym to exercise. / He stopped by the store to buy milk.',
        'To be honest is always the best policy. / To travel alone can be scary.',
        'He has a lot of work to do. / She was lucky to win the lottery.'),
      'answer','5'),

    -- Q39 (O: 기호 분류 서술형)
    jsonb_build_object('number',39,
      'question',E'다음 <보기>의 문장 중에서 밑줄 친 부분의 쓰임이 같은 것끼리 기호를 쓰시오.\n\nⓐ I have many gifts to wrap before Christmas.\nⓑ She decided to take a break.\nⓒ He needs a surface to paint on.\nⓓ We have a lot of food to prepare.\nⓔ They went to the beach to swim.\nⓕ Her goal is to become a teacher.',
      'answer','ⓐ, ⓒ, ⓓ'),

    -- ═══════════════════════════════════════════
    -- Part 4: 어법 오류 판별 (Q40~Q50)
    -- ═══════════════════════════════════════════

    -- Q40 (M: 어법상 옳은 것)
    jsonb_build_object('number',40,
      'question',E'다음 중 어법상 옳은 것은?',
      'options',jsonb_build_array(
        'She needs a room to sleep.',
        'I want something cold to drinking.',
        'He has a lot of dishes to wash.',
        'Give me a pen to write.',
        'I need a wall to hang.'),
      'answer','3'),

    -- Q41 (P: 어색한 것)
    jsonb_build_object('number',41,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'I need a bag to put my things in.',
        'She has many letters to send.',
        'He wants a place to park.',
        'There are many songs to download.',
        'We have enough chairs to sit on.'),
      'answer','3'),

    -- Q42 (P: 어색한 것)
    jsonb_build_object('number',42,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'She has no one to depend on.',
        'I need a basket to put the fruit.',
        'He has a lot of work to finish.',
        'There are many countries to visit.',
        'We have enough paper to print on.'),
      'answer','2'),

    -- Q43 (P: 어색한 것)
    jsonb_build_object('number',43,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'I have a lot of books to read.',
        'She needs a cloth to clean the window with.',
        'He wants someone to play.',
        'We have many things to discuss.',
        'There are lots of problems to deal with.'),
      'answer','3'),

    -- Q44 (P: 어색한 것)
    jsonb_build_object('number',44,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'She has a presentation to give tomorrow.',
        'He needs a floor to sleep.',
        'I have enough time to rest.',
        'There are many museums to explore.',
        'We need a hook to hang our coats on.'),
      'answer','2'),

    -- Q45 (P: 어색한 것)
    jsonb_build_object('number',45,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'He has a lot of to do things.',
        'She needs a partner to work with.',
        'There are many options to choose from.',
        'I have an assignment to submit.',
        'We need more space to move around in.'),
      'answer','1'),

    -- Q46 (P: 어색한 것)
    jsonb_build_object('number',46,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'I have no friends to rely on.',
        'She has a pretty dress to wear to the party.',
        'He needs a bucket to carrying water.',
        'We have a lot of topics to cover.',
        'There is nothing to complain about.'),
      'answer','3'),

    -- Q47 (P: 어색한 것)
    jsonb_build_object('number',47,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'She bought a basket to keep fruit in.',
        'I need someone to depend.',
        'He has many projects to manage.',
        'There are lots of songs to sing along to.',
        'We have some packages to deliver.'),
      'answer','2'),

    -- Q48 (P: 어색한 것)
    jsonb_build_object('number',48,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'He has a comfortable bed to sleep in.',
        'She needs some paper to draw.',
        'I have a few reports to finish.',
        'There are many trails to hike on.',
        'We need a ladder to climb up on.'),
      'answer','2'),

    -- Q49 (Q: 어색한 것 모두 고르기)
    jsonb_build_object('number',49,
      'question',E'다음 중 어법상 어색한 것을 모두 고르면?',
      'options',jsonb_build_array(
        'She has a beautiful garden to relax in.',
        'I need a chair to sit.',
        'He wants something to eaten.',
        'There are many books to choose from.',
        'We have a lot of work to do.'),
      'answer','2, 3'),

    -- Q50 (Q: 어색한 것 모두 고르기)
    jsonb_build_object('number',50,
      'question',E'다음 중 어법상 어색한 것을 모두 고르면?',
      'options',jsonb_build_array(
        'I have a lot of emails to answer.',
        'She needs a room to practice.',
        'He has no wall to hang the picture.',
        'There are many things to think about.',
        'We need a jar to put the cookies in.'),
      'answer','2, 3')
  );

  a := jsonb_build_array(
    '2','4','3','4','3','2',
    '3','2','2','1','3',
    '4','3','3','4','3','3','4','3',
    '4','3','4','2','5','3','5','3','4','3','3','4','4','3',
    '4','3','3','3','5',
    'ⓐ, ⓒ, ⓓ',
    '3',
    '3','2','3','2','1','3','2','2',
    '2, 3','2, 3'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('to부정사의 형용사적 용법 Step3', 'to부정사의 형용사적 용법', q, a, 'problem', 'interactive');

  RAISE NOTICE 'to부정사의 형용사적 용법 Step3 템플릿 생성 완료 (50문제)';
END;
$$;
