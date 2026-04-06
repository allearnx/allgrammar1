DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = 'to부정사의 형용사적 용법 Step2';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- Part 1: 빈칸 채우기 (Q1~Q6)
    -- ═══════════════════════════════════════════

    -- Q1 (C: to부정사 + 전치사)
    jsonb_build_object('number',1,
      'question',E'다음 문장의 빈칸에 들어갈 말로 가장 적절한 것은?\n\nShe needs some paper _______________.',
      'options',jsonb_build_array('to write','to write on','writing on','for write','write on'),
      'answer','2'),

    -- Q2 (C: to부정사 + 전치사)
    jsonb_build_object('number',2,
      'question',E'다음 문장의 빈칸에 들어갈 말로 가장 적절한 것은?\n\nTom has many friends _______________.',
      'options',jsonb_build_array('to play','with play to','to play with','play to with','to with play'),
      'answer','3'),

    -- Q3 (B: 부정형 to부정사)
    jsonb_build_object('number',3,
      'question',E'다음 문장의 빈칸에 들어갈 말로 가장 적절한 것은?\n\nShe left home early _______________ for class.',
      'options',jsonb_build_array('not late','not be late','not to late','not to be late','to be late not'),
      'answer','4'),

    -- Q4 (D: 공통 빈칸)
    jsonb_build_object('number',4,
      'question',E'다음 빈칸에 공통으로 들어갈 알맞은 것은?\n\n• He has many papers _______ before the deadline.\n• I have a lot of tasks _______ this week.',
      'options',jsonb_build_array('finish','finishes','to finish','finishing','finished'),
      'answer','3'),

    -- Q5 (F: 쌍 빈칸 ⓐⓑ)
    jsonb_build_object('number',5,
      'question',E'다음 빈칸 ⓐ, ⓑ에 들어갈 말이 차례대로 짝지어진 것은?\n\n• He needs a knife ⓐ_______.\n• We need a mat ⓑ_______.',
      'options',jsonb_build_array('to cut - sitting on','cuts - to sit','to cut with - to sit on','cutting - to sit on','to cut on - to sit with'),
      'answer','3'),

    -- Q6 (F: 쌍 빈칸 ⓐⓑ)
    jsonb_build_object('number',6,
      'question',E'Which of the following best fits in the blanks?\n\n• She wants something ⓐ_______; any crayon or marker will do.\n• He needs a surface ⓑ_______.',
      'options',jsonb_build_array(
        'ⓐ to draw      ⓑ to work',
        'ⓐ to draw with  ⓑ to work on',
        'ⓐ to draw on    ⓑ to work with',
        'ⓐ for drawing   ⓑ to work at',
        'ⓐ for drawing with  ⓑ to working'),
      'answer','2'),

    -- ═══════════════════════════════════════════
    -- Part 2: 문장 구성 (Q7~Q11)
    -- ═══════════════════════════════════════════

    -- Q7 (G: 우리말 영작)
    jsonb_build_object('number',7,
      'question',E'다음 우리말을 바르게 영작한 것은?\n\n나는 재미있는 것을 읽고 싶다.',
      'options',jsonb_build_array(
        'I want interesting something to read.',
        'I want to read interesting something.',
        'I want something interesting to read.',
        'I want something to interesting read.',
        'I want interesting to something read.'),
      'answer','3'),

    -- Q8 (G: 우리말 영작)
    jsonb_build_object('number',8,
      'question',E'다음 우리말을 바르게 영작한 것은?\n\n우리는 먹을 것이 필요하다.',
      'options',jsonb_build_array(
        'We need to something eat.',
        'We need eat something.',
        'We need something eat to.',
        'We need to eat something.',
        'We need something to eat.'),
      'answer','5'),

    -- Q9 (G: 우리말 영작 — 올바른 것 고르기)
    jsonb_build_object('number',9,
      'question',E'다음 중 우리말을 바르게 영작한 것은?',
      'options',jsonb_build_array(
        '그녀는 입을 옷이 없다. → She has no clothes to wear.',
        '나는 앉을 의자가 필요해. → I need a chair to sit.',
        '마실 물 좀 주세요. → Please give me water drink to.',
        '그는 같이 공부할 친구가 있다. → He has a friend to study.',
        '쓸 종이가 있니? → Do you have paper to write?'),
      'answer','1'),

    -- Q10 (E: 단어 배열)
    jsonb_build_object('number',10,
      'question',E'다음 우리말과 일치하도록 괄호 안에 주어진 단어들을 배열할 때 네 번째로 올 단어는?\n\n그는 살 집이 없다.\n(house, has, in, no, to, he, live)',
      'options',jsonb_build_array('to','live','no','house','in'),
      'answer','4'),

    -- Q11 (H: 두 문장 합치기)
    jsonb_build_object('number',11,
      'question',E'다음 두 문장을 한 문장으로 연결한 것이 올바른 것은?\n\nShe has a desk. + She studies at it.',
      'options',jsonb_build_array(
        'She has a desk to study.',
        'She has a desk studying at.',
        'She has a desk to study at.',
        'She has a desk to studying at.',
        'She has a desk for study at.'),
      'answer','3'),

    -- ═══════════════════════════════════════════
    -- Part 3: 용법 구별 (Q12~Q39)
    -- ═══════════════════════════════════════════

    -- Q12 (I: 보기와 같은 쓰임)
    jsonb_build_object('number',12,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은?\n\n<보기> I have some work to finish today.',
      'options',jsonb_build_array(
        'She hopes to travel around the world.',
        'He went outside to get some fresh air.',
        'They need a bigger room to study in.',
        'To exercise regularly is important for health.',
        'His goal is to become a pilot.'),
      'answer','3'),

    -- Q13 (I: 보기와 같은 쓰임)
    jsonb_build_object('number',13,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은?\n\n<보기> Do you have anything to say?',
      'options',jsonb_build_array(
        'I''m happy to see you again.',
        'My plan is to leave early tomorrow.',
        'She decided to learn French.',
        'He has no time to waste.',
        'We went to the park to fly a kite.'),
      'answer','4'),

    -- Q14 (I: 보기와 같은 쓰임)
    jsonb_build_object('number',14,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은?\n\n<보기> She bought a dress to wear at the party.',
      'options',jsonb_build_array(
        'He grew up to be a famous singer.',
        'I want to try something new.',
        'There are many things to see in this city.',
        'To read books is a great hobby.',
        'She was surprised to hear the news.'),
      'answer','3'),

    -- Q15 (I: 보기와 같은 쓰임)
    jsonb_build_object('number',15,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은?\n\n<보기> There is nothing interesting to watch tonight.',
      'options',jsonb_build_array(
        'He promised to call me tomorrow.',
        'I need a bag to carry my books in.',
        'My dream is to open a bakery.',
        'She ran fast to catch the bus.',
        'To learn a musical instrument takes time.'),
      'answer','2'),

    -- Q16 (I: 보기와 같은 쓰임)
    jsonb_build_object('number',16,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은?\n\n<보기> He has a lot of friends to help him.',
      'options',jsonb_build_array(
        'They stopped to take a rest.',
        'I was sad to lose the game.',
        'She wants to be a nurse.',
        'We have enough chairs to sit on.',
        'To be honest, I don''t like it.'),
      'answer','4'),

    -- Q17 (I: 보기와 같은 쓰임)
    jsonb_build_object('number',17,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은?\n\n<보기> It''s time to go home.',
      'options',jsonb_build_array(
        'He studied hard to pass the exam.',
        'My sister likes to draw pictures.',
        'I was glad to meet him at the party.',
        'She went to the store to buy milk.',
        'I have an important meeting to attend tomorrow.'),
      'answer','5'),

    -- Q18 (I: 보기와 같은 쓰임)
    jsonb_build_object('number',18,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은?\n\n<보기> She needs a partner to practice with.',
      'options',jsonb_build_array(
        'I''m sorry to bother you.',
        'He wants to learn how to swim.',
        'There is no place to park near here.',
        'My goal is to save enough money.',
        'She cried to hear the sad song.'),
      'answer','3'),

    -- Q19 (I: 보기와 같은 쓰임)
    jsonb_build_object('number',19,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은?\n\n<보기> We need a box to put these toys in.',
      'options',jsonb_build_array(
        'He woke up early to exercise.',
        'To speak in public is not easy.',
        'My wish is to visit Paris someday.',
        'She was lucky to find the lost ring.',
        'I have a lot of emails to reply to.'),
      'answer','5'),

    -- Q20 (K: 나머지와 다른 것)
    jsonb_build_object('number',20,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'I need a towel to dry my hands.',
        'She has many books to donate.',
        'He is looking for a place to rest.',
        'There are no tickets to buy for this show.',
        'I went to the gym to work out.'),
      'answer','5'),

    -- Q21 (K: 나머지와 다른 것)
    jsonb_build_object('number',21,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'He has a project to complete by Friday.',
        'There are many problems to solve.',
        'I need a tool to fix this shelf.',
        'She was excited to receive the award.',
        'We have enough food to share.'),
      'answer','4'),

    -- Q22 (K: 나머지와 다른 것)
    jsonb_build_object('number',22,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'She has two reports to submit.',
        'I need a blanket to keep warm.',
        'He wants a pet to take care of.',
        'There is nothing to worry about.',
        'He left early to avoid the traffic.'),
      'answer','5'),

    -- Q23 (K: 나머지와 다른 것)
    jsonb_build_object('number',23,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'I have some questions to ask the teacher.',
        'Can you give me something to drink?',
        'She is the best person to lead the team.',
        'We traveled to Japan to see the cherry blossoms.',
        'There are a lot of emails to check.'),
      'answer','4'),

    -- Q24 (K: 나머지와 다른 것)
    jsonb_build_object('number',24,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'He saved money to buy a new phone.',
        'I have a few letters to mail.',
        'She needs a recipe to follow.',
        'There is no reason to be angry.',
        'He has a test to prepare for.'),
      'answer','1'),

    -- Q25 (K: 나머지와 다른 것)
    jsonb_build_object('number',25,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'She has a dress to iron before the party.',
        'I am happy to help you.',
        'He bought a notebook to write in.',
        'There are many places to explore.',
        'We have no more space to store things.'),
      'answer','2'),

    -- Q26 (K: 나머지와 다른 것)
    jsonb_build_object('number',26,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'He was the last person to leave the office.',
        'She found a good spot to take photos.',
        'I have some clothes to wash.',
        'He went to the library to return the books.',
        'There is a lot of work to do this week.'),
      'answer','4'),

    -- Q27 (K: 나머지와 다른 것)
    jsonb_build_object('number',27,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'I need someone to talk to.',
        'She has nothing to be afraid of.',
        'He is looking for a way to improve.',
        'We have time to discuss the plan.',
        'My dream is to become a doctor.'),
      'answer','5'),

    -- Q28 (K: 나머지와 다른 것)
    jsonb_build_object('number',28,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'She needs a room to practice in.',
        'He has many tasks to handle.',
        'I went to the station to pick up my friend.',
        'There are several options to consider.',
        'We have a lot of groceries to buy.'),
      'answer','3'),

    -- Q29 (K: 나머지와 다른 것)
    jsonb_build_object('number',29,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'He has no one to rely on.',
        'There are some rules to follow.',
        'To play the violin is not easy.',
        'I need a ladder to reach the top shelf.',
        'She has an exam to study for.'),
      'answer','3'),

    -- Q30 (K: 나머지와 다른 것)
    jsonb_build_object('number',30,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'I have a package to send by tomorrow.',
        'She has no reason to worry.',
        'We need a plan to follow.',
        'He has many songs to practice.',
        'She sat down to take a break.'),
      'answer','5'),

    -- Q31 (K: 나머지와 다른 것)
    jsonb_build_object('number',31,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'There is no water to drink here.',
        'I need a key to open the door.',
        'He wants to learn Spanish.',
        'She has a list of chores to finish.',
        'He was the first to arrive at school.'),
      'answer','3'),

    -- Q32 (K: 나머지와 다른 것)
    jsonb_build_object('number',32,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'She needs some paper to print on.',
        'Do you have a pen to lend me?',
        'There are lots of games to try.',
        'He has an essay to write by Monday.',
        'She woke up to find the house empty.'),
      'answer','5'),

    -- Q33 (K: 나머지와 다른 것)
    jsonb_build_object('number',33,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'He has a problem to deal with.',
        'She needs new shoes to run in.',
        'Is there any seat to sit in?',
        'I have many friends to hang out with.',
        'He practiced hard to win first place.'),
      'answer','5'),

    -- Q34 (J: 같은 쓰임끼리 묶기)
    jsonb_build_object('number',34,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것끼리 짝지어진 것은?\n\n<보기> I have many things to prepare for the trip.\n\nⓐ She decided to join the swimming club.\nⓑ He needs a jacket to wear in winter.\nⓒ They went to the beach to surf.\nⓓ I have no money to spend this month.\nⓔ He was surprised to see her there.',
      'options',jsonb_build_array('ⓐ, ⓑ','ⓐ, ⓓ','ⓑ, ⓒ','ⓑ, ⓓ','ⓒ, ⓔ'),
      'answer','4'),

    -- Q35 (J: 같은 쓰임끼리 묶기)
    jsonb_build_object('number',35,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것끼리 짝지어진 것은?\n\n<보기> She has no friends to talk with.\n\nⓐ I want to eat something sweet.\nⓑ There are many movies to watch this weekend.\nⓒ He needs a place to store his bike.\nⓓ She ran to the door to open it.\nⓔ We are looking for a room to rent.',
      'options',jsonb_build_array('ⓐ, ⓑ, ⓒ','ⓑ, ⓒ, ⓓ','ⓑ, ⓒ, ⓔ','ⓐ, ⓓ, ⓔ','ⓒ, ⓓ, ⓔ'),
      'answer','3'),

    -- Q36 (J: 같은 쓰임끼리 묶기)
    jsonb_build_object('number',36,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것끼리 짝지어진 것은?\n\n<보기> He bought a bag to carry his laptop in.\n\nⓐ We need someone to guide us.\nⓑ She started to sing a beautiful song.\nⓒ I have a lot of laundry to fold.\nⓓ He drove fast to arrive on time.\nⓔ Do you have anything to add?',
      'options',jsonb_build_array('ⓐ, ⓑ, ⓒ','ⓐ, ⓒ, ⓓ','ⓐ, ⓒ, ⓔ','ⓑ, ⓓ, ⓔ','ⓒ, ⓓ, ⓔ'),
      'answer','3'),

    -- Q37 (L: ⓐ~ⓔ 같은 짝)
    jsonb_build_object('number',37,
      'question',E'다음 밑줄 친 ⓐ~ⓔ 중 쓰임이 같은 것끼리 짝지어진 것은?\n\n• She wants ⓐto learn Korean next year.\n• He ran to the station ⓑto catch the last train.\n• I have a lot of work ⓒto finish.\n• His dream is ⓓto travel around the world.\n• We were happy ⓔto win the prize.',
      'options',jsonb_build_array('ⓐ, ⓑ','ⓑ, ⓒ','ⓐ, ⓓ','ⓒ, ⓔ','ⓓ, ⓔ'),
      'answer','3'),

    -- Q38 (N: 서로 다른 짝)
    jsonb_build_object('number',38,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 서로 다른 것끼리 짝지어진 것은?',
      'options',jsonb_build_array(
        'I have no paper to write on. / She needs a bag to put her books in.',
        'He likes to play basketball. / My hobby is to collect stickers.',
        'She went to the store to buy groceries. / He stopped by the café to get coffee.',
        'He lived to be ninety years old. / She grew up to become a lawyer.',
        'I have some letters to mail. / She is happy to be here.'),
      'answer','5'),

    -- Q39 (O: 기호 분류 서술형)
    jsonb_build_object('number',39,
      'question',E'다음 <보기>의 문장 중에서 밑줄 친 부분의 쓰임이 같은 것끼리 기호를 쓰시오.\n\nⓐ She has a lot of dishes to wash.\nⓑ I am excited to start the new project.\nⓒ He wants to buy a new laptop.\nⓓ There is nothing to eat in the fridge.\nⓔ They went to the airport to pick up their parents.\nⓕ Her dream is to become a chef.',
      'answer','ⓐ, ⓓ'),

    -- ═══════════════════════════════════════════
    -- Part 4: 어법 오류 판별 (Q40~Q50)
    -- ═══════════════════════════════════════════

    -- Q40 (M: 어법상 옳은 것)
    jsonb_build_object('number',40,
      'question',E'다음 중 어법상 옳은 것은?',
      'options',jsonb_build_array(
        'I have no friends to play.',
        'She needs a house to live.',
        'He has a lot of homework to do.',
        'I need a pen to write.',
        'Give me a chair to sit.'),
      'answer','3'),

    -- Q41 (P: 어색한 것)
    jsonb_build_object('number',41,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'Do you have a book to lend me?',
        'She has many friends to spend time with.',
        'He needs a partner to practice.',
        'There are many movies to watch.',
        'I have some errands to run.'),
      'answer','3'),

    -- Q42 (P: 어색한 것)
    jsonb_build_object('number',42,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'She has no one to talk to.',
        'I need a desk to study at.',
        'He bought a sofa to sit.',
        'We have a lot of food to share.',
        'There are many songs to listen to.'),
      'answer','3'),

    -- Q43 (P: 어색한 것)
    jsonb_build_object('number',43,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'I need a blanket to cover myself with.',
        'She has no room to keep her things in.',
        'He wants some music to listen.',
        'We have enough water to drink.',
        'There are many problems to think about.'),
      'answer','3'),

    -- Q44 (P: 어색한 것)
    jsonb_build_object('number',44,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'He has a lot of tasks to complete.',
        'She needs a surface to write.',
        'I don''t have time to waste.',
        'We have a nice garden to relax in.',
        'There are many apps to download.'),
      'answer','2'),

    -- Q45 (P: 어색한 것)
    jsonb_build_object('number',45,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'He has a lot of things to doing.',
        'She needs a room to stay in.',
        'There are many places to visit.',
        'I have an assignment to finish.',
        'We need more chairs to sit on.'),
      'answer','1'),

    -- Q46 (P: 어색한 것)
    jsonb_build_object('number',46,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'I have no friends to hang out with.',
        'She has a nice garden to grow flowers in.',
        'He needs a bag to carrying his laptop.',
        'We have a lot of work to do.',
        'There is nothing to be scared of.'),
      'answer','3'),

    -- Q47 (P: 어색한 것)
    jsonb_build_object('number',47,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'She bought a notebook to write in.',
        'I need someone to talk.',
        'He has many photos to show us.',
        'There are lots of books to choose from.',
        'We have some dishes to try.'),
      'answer','2'),

    -- Q48 (P: 어색한 것)
    jsonb_build_object('number',48,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'He has a small studio to live in.',
        'She needs a bowl to put the salad.',
        'I have a few things to pack.',
        'There are many museums to visit.',
        'We need a wall to hang the picture on.'),
      'answer','2'),

    -- Q49 (Q: 어색한 것 모두 고르기)
    jsonb_build_object('number',49,
      'question',E'다음 중 어법상 어색한 것을 모두 고르면?',
      'options',jsonb_build_array(
        'She has a notebook to write.',
        'I need a friend to study with.',
        'He wants to something cold drink.',
        'There are many parks to walk in.',
        'We have enough room to sit.'),
      'answer','1, 3'),

    -- Q50 (Q: 어색한 것 모두 고르기)
    jsonb_build_object('number',50,
      'question',E'다음 중 어법상 어색한 것을 모두 고르면?',
      'options',jsonb_build_array(
        'I have no time to cook this morning.',
        'She has a lot of clothes to wearing.',
        'He needs a desk to study at.',
        'She has no friend to talk.',
        'There are many interesting things to see.'),
      'answer','2, 4')
  );

  a := jsonb_build_array(
    '2','3','4','3','3','2',
    '3','5','1','4','3',
    '3','4','3','2','4','5','3','5',
    '5','4','5','4','1','2','4','5','3','3','5','3','5','5',
    '4','3','3','3','5',
    'ⓐ, ⓓ',
    '3',
    '3','3','3','2','1','3','2','2',
    '1, 3','2, 4'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('to부정사의 형용사적 용법 Step2', 'to부정사의 형용사적 용법', q, a, 'problem', 'interactive');

  RAISE NOTICE 'to부정사의 형용사적 용법 Step2 템플릿 생성 완료 (50문제)';
END;
$$;
