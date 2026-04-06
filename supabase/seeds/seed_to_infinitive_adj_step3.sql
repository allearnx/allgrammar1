DO $$
DECLARE
  q_easy jsonb;  a_easy jsonb;
  q_mid  jsonb;  a_mid  jsonb;
  q_hard jsonb;  a_hard jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title LIKE 'to부정사의 형용사적 용법 Step3%';

  -- ═══════════════════════════════════════════════════════
  -- Step3-쉬움 (17문제): 빈칸 채우기 / 우리말 뜻 쓰기
  -- ═══════════════════════════════════════════════════════
  q_easy := jsonb_build_array(
    jsonb_build_object('number',1,
      'question',E'[빈칸에 알맞은 말을 쓰시오]\n\n<보기> read, eat, drink, live, wear\n\nI want something cold to ___.',
      'answer','drink'),

    jsonb_build_object('number',2,
      'question',E'[빈칸에 알맞은 말을 쓰시오]\n\n<보기> read, eat, drink, live, wear\n\nShe has no clothes to ___ to the party.',
      'answer','wear'),

    jsonb_build_object('number',3,
      'question',E'[빈칸에 알맞은 말을 쓰시오]\n\n<보기> read, eat, drink, live, wear\n\nHe needs a house to ___ in.',
      'answer','live'),

    jsonb_build_object('number',4,
      'question',E'[빈칸에 알맞은 말을 쓰시오]\n\n<보기> read, eat, drink, live, wear\n\nThere is nothing to ___ in the refrigerator.',
      'answer','eat'),

    jsonb_build_object('number',5,
      'question',E'[빈칸에 알맞은 말을 쓰시오]\n\n<보기> read, eat, drink, live, wear\n\nI am looking for an interesting book to ___.',
      'answer','read'),

    jsonb_build_object('number',6,
      'question',E'[빈칸에 알맞은 말을 쓰시오]\n\n<보기> sit on, write with, talk to, play with, look at\n\nShe needs a pen to ___.',
      'answer','write with'),

    jsonb_build_object('number',7,
      'question',E'[빈칸에 알맞은 말을 쓰시오]\n\n<보기> sit on, write with, talk to, play with, look at\n\nHe has no friend to ___.',
      'answer','play with'),

    jsonb_build_object('number',8,
      'question',E'[빈칸에 알맞은 말을 쓰시오]\n\n<보기> sit on, write with, talk to, play with, look at\n\nI need a chair to ___.',
      'answer','sit on'),

    jsonb_build_object('number',9,
      'question',E'[빈칸에 알맞은 말을 쓰시오]\n\n<보기> sit on, write with, talk to, play with, look at\n\nThere is nothing to ___ in this empty room.',
      'answer','look at'),

    jsonb_build_object('number',10,
      'question',E'[빈칸에 알맞은 말을 쓰시오]\n\n<보기> sit on, write with, talk to, play with, look at\n\nShe wants someone to ___.',
      'answer','talk to'),

    jsonb_build_object('number',11,
      'question',E'[밑줄 친 부분의 우리말 뜻을 쓰시오]\n\nI have a lot of homework to do today.',
      'answer','해야 할'),

    jsonb_build_object('number',12,
      'question',E'[밑줄 친 부분의 우리말 뜻을 쓰시오]\n\nShe needs a friend to help her.',
      'answer','그녀를 도와줄'),

    jsonb_build_object('number',13,
      'question',E'[밑줄 친 부분의 우리말 뜻을 쓰시오]\n\nHe was the first student to finish the test.',
      'answer','시험을 끝낸'),

    jsonb_build_object('number',14,
      'question',E'[밑줄 친 부분의 우리말 뜻을 쓰시오]\n\nWe have enough time to prepare for the exam.',
      'answer','시험을 준비할'),

    jsonb_build_object('number',15,
      'question',E'[밑줄 친 부분의 우리말 뜻을 쓰시오]\n\nGive me something hot to drink.',
      'answer','마실'),

    jsonb_build_object('number',16,
      'question',E'[밑줄 친 부분의 우리말 뜻을 쓰시오]\n\nI need a bag to carry my books in.',
      'answer','책을 넣을'),

    jsonb_build_object('number',17,
      'question',E'[밑줄 친 부분의 우리말 뜻을 쓰시오]\n\nThere are many places to visit in Korea.',
      'answer','방문할')
  );

  a_easy := jsonb_build_array(
    'drink','wear','live','eat','read',
    'write with','play with','sit on','look at','talk to',
    '해야 할','그녀를 도와줄','시험을 끝낸','시험을 준비할','마실','책을 넣을','방문할'
  );

  -- ═══════════════════════════════════════════════════════
  -- Step3-보통 (50문제): 변환 / 합치기 / 오류 교정 / 배열 / 대화 / 용법
  -- ═══════════════════════════════════════════════════════
  q_mid := jsonb_build_array(
    -- 단어 형태 변환 (1~6)
    jsonb_build_object('number',1,
      'question',E'[주어진 단어를 알맞은 형태로 바꾸어 빈칸을 채우시오]\n\nI need something (eat).\n→ I need something to ___.',
      'answer','eat'),

    jsonb_build_object('number',2,
      'question',E'[주어진 단어를 알맞은 형태로 바꾸어 빈칸을 채우시오]\n\nShe has a lot of work (finish).\n→ She has a lot of work to ___.',
      'answer','finish'),

    jsonb_build_object('number',3,
      'question',E'[주어진 단어를 알맞은 형태로 바꾸어 빈칸을 채우시오]\n\nHe was the last person (leave) the office.\n→ He was the last person to ___ the office.',
      'answer','leave'),

    jsonb_build_object('number',4,
      'question',E'[주어진 단어를 알맞은 형태로 바꾸어 빈칸을 채우시오]\n\nThere is no water (drink) here.\n→ There is no water to ___ here.',
      'answer','drink'),

    jsonb_build_object('number',5,
      'question',E'[주어진 단어를 알맞은 형태로 바꾸어 빈칸을 채우시오]\n\nDo you have anything (say)?\n→ Do you have anything to ___?',
      'answer','say'),

    jsonb_build_object('number',6,
      'question',E'[주어진 단어를 알맞은 형태로 바꾸어 빈칸을 채우시오]\n\nHe made a promise (not, break).\n→ He made a promise not to ___.',
      'answer','break'),

    -- 두 문장 합치기 (7~14)
    jsonb_build_object('number',7,
      'question',E'[두 문장을 to부정사를 사용하여 한 문장으로 연결하시오]\n\nI want a friend. + I can play with the friend.\n→',
      'answer','I want a friend to play with.'),

    jsonb_build_object('number',8,
      'question',E'[두 문장을 to부정사를 사용하여 한 문장으로 연결하시오]\n\nShe bought a notebook. + She writes in it.\n→',
      'answer','She bought a notebook to write in.'),

    jsonb_build_object('number',9,
      'question',E'[두 문장을 to부정사를 사용하여 한 문장으로 연결하시오]\n\nHe needs a chair. + He can sit on it.\n→',
      'answer','He needs a chair to sit on.'),

    jsonb_build_object('number',10,
      'question',E'[두 문장을 to부정사를 사용하여 한 문장으로 연결하시오]\n\nWe need a house. + We can live in it.\n→',
      'answer','We need a house to live in.'),

    jsonb_build_object('number',11,
      'question',E'[두 문장을 to부정사를 사용하여 한 문장으로 연결하시오]\n\nShe wants a partner. + She can practice with the partner.\n→',
      'answer','She wants a partner to practice with.'),

    jsonb_build_object('number',12,
      'question',E'[두 문장을 to부정사를 사용하여 한 문장으로 연결하시오]\n\nI need a pen. + I can write with it.\n→',
      'answer','I need a pen to write with.'),

    jsonb_build_object('number',13,
      'question',E'[두 문장을 to부정사를 사용하여 한 문장으로 연결하시오]\n\nHe has a desk. + He studies at the desk.\n→',
      'answer','He has a desk to study at.'),

    jsonb_build_object('number',14,
      'question',E'[두 문장을 to부정사를 사용하여 한 문장으로 연결하시오]\n\nShe found a nice park. + She can walk in it.\n→',
      'answer','She found a nice park to walk in.'),

    -- 밑줄 친 부분 바르게 고치기 (15~24)
    jsonb_build_object('number',15,
      'question',E'[밑줄 친 부분을 바르게 고쳐 쓰시오]\n\nI need a room to sleep.',
      'answer','to sleep in'),

    jsonb_build_object('number',16,
      'question',E'[밑줄 친 부분을 바르게 고쳐 쓰시오]\n\nShe wants someone to talk.',
      'answer','to talk to'),

    jsonb_build_object('number',17,
      'question',E'[밑줄 친 부분을 바르게 고쳐 쓰시오]\n\nHe bought a house to live.',
      'answer','to live in'),

    jsonb_build_object('number',18,
      'question',E'[밑줄 친 부분을 바르게 고쳐 쓰시오]\n\nI need a chair to sit.',
      'answer','to sit on'),

    jsonb_build_object('number',19,
      'question',E'[밑줄 친 부분을 바르게 고쳐 쓰시오]\n\nGive me a pen to write.',
      'answer','to write with'),

    jsonb_build_object('number',20,
      'question',E'[밑줄 친 부분을 바르게 고쳐 쓰시오]\n\nShe needs a surface to paint.',
      'answer','to paint on'),

    jsonb_build_object('number',21,
      'question',E'[밑줄 친 부분을 바르게 고쳐 쓰시오]\n\nHe has a lot of to do things.',
      'answer','things to do'),

    jsonb_build_object('number',22,
      'question',E'[밑줄 친 부분을 바르게 고쳐 쓰시오]\n\nI want cold something to drink.',
      'answer','something cold to drink'),

    jsonb_build_object('number',23,
      'question',E'[밑줄 친 부분을 바르게 고쳐 쓰시오]\n\nShe needs a bucket to carrying water.',
      'answer','to carry water'),

    jsonb_build_object('number',24,
      'question',E'[밑줄 친 부분을 바르게 고쳐 쓰시오]\n\nHe wants something to eaten.',
      'answer','to eat'),

    -- 배열하기 (25~34)
    jsonb_build_object('number',25,
      'question',E'[배열하시오]\n\n그녀는 읽을 책이 많다.\n( has / books / she / read / many / to )',
      'answer','She has many books to read.'),

    jsonb_build_object('number',26,
      'question',E'[배열하시오]\n\n나는 함께 놀 친구가 필요하다.\n( need / with / a / I / friend / play / to )',
      'answer','I need a friend to play with.'),

    jsonb_build_object('number',27,
      'question',E'[배열하시오]\n\n마실 것 좀 주세요.\n( me / give / drink / something / to )',
      'answer','Give me something to drink.'),

    jsonb_build_object('number',28,
      'question',E'[배열하시오]\n\n그는 앉을 의자가 없다.\n( no / on / sit / has / to / he / chair )',
      'answer','He has no chair to sit on.'),

    jsonb_build_object('number',29,
      'question',E'[배열하시오]\n\n나는 재미있는 것을 할 시간이 없다.\n( time / have / anything / I / fun / no / do / to )',
      'answer','I have no time to do anything fun.'),

    jsonb_build_object('number',30,
      'question',E'[배열하시오]\n\n그녀는 차가운 마실 것을 원한다.\n( cold / she / to / something / wants / drink )',
      'answer','She wants something cold to drink.'),

    jsonb_build_object('number',31,
      'question',E'[배열하시오]\n\n서울에는 방문할 장소가 많다.\n( many / visit / in / are / there / places / Seoul / to )',
      'answer','There are many places to visit in Seoul.'),

    jsonb_build_object('number',32,
      'question',E'[배열하시오]\n\n그는 살 집을 찾고 있다.\n( for / looking / he / in / a / live / is / to / house )',
      'answer','He is looking for a house to live in.'),

    jsonb_build_object('number',33,
      'question',E'[배열하시오]\n\n나는 그녀에게 줄 선물을 샀다.\n( a / bought / give / gift / I / to / her )',
      'answer','I bought a gift to give her.'),

    jsonb_build_object('number',34,
      'question',E'[배열하시오]\n\n그는 쓸 종이가 좀 필요하다.\n( he / write / some / on / paper / to / needs )',
      'answer','He needs some paper to write on.'),

    -- 대화 완성 (35~39)
    jsonb_build_object('number',35,
      'question',E'[다음 대화의 빈칸에 알맞은 말을 to부정사를 사용하여 쓰시오]\n\nA: I''m thirsty.\nB: Do you want something ___?',
      'answer','to drink'),

    jsonb_build_object('number',36,
      'question',E'[다음 대화의 빈칸에 알맞은 말을 to부정사를 사용하여 쓰시오]\n\nA: I''m bored. There is nothing ___.\nB: How about watching a movie?',
      'answer','to do'),

    jsonb_build_object('number',37,
      'question',E'[다음 대화의 빈칸에 알맞은 말을 to부정사를 사용하여 쓰시오]\n\nA: Why are you going to the library?\nB: I need a quiet place ___.',
      'answer','to study'),

    jsonb_build_object('number',38,
      'question',E'[다음 대화의 빈칸에 알맞은 말을 to부정사를 사용하여 쓰시오]\n\nA: Do you have any plans for the weekend?\nB: Not really. I have a lot of homework ___.',
      'answer','to finish'),

    jsonb_build_object('number',39,
      'question',E'[다음 대화의 빈칸에 알맞은 말을 to부정사를 사용하여 쓰시오]\n\nA: Can you lend me a pen?\nB: Sure. Here is a pen ___.',
      'answer','to write with'),

    -- 문장 전체 고치기 (40~46)
    jsonb_build_object('number',40,
      'question',E'[다음 문장에서 어법상 틀린 곳을 찾아 문장 전체를 바르게 고쳐 쓰시오]\n\nI have no friends to play.',
      'answer','I have no friends to play with.'),

    jsonb_build_object('number',41,
      'question',E'[다음 문장에서 어법상 틀린 곳을 찾아 문장 전체를 바르게 고쳐 쓰시오]\n\nShe needs a desk to study.',
      'answer','She needs a desk to study at.'),

    jsonb_build_object('number',42,
      'question',E'[다음 문장에서 어법상 틀린 곳을 찾아 문장 전체를 바르게 고쳐 쓰시오]\n\nHe wants interesting something to read.',
      'answer','He wants something interesting to read.'),

    jsonb_build_object('number',43,
      'question',E'[다음 문장에서 어법상 틀린 곳을 찾아 문장 전체를 바르게 고쳐 쓰시오]\n\nWe have a lot of things to talking about.',
      'answer','We have a lot of things to talk about.'),

    jsonb_build_object('number',44,
      'question',E'[다음 문장에서 어법상 틀린 곳을 찾아 문장 전체를 바르게 고쳐 쓰시오]\n\nShe bought a bag to putting her things in.',
      'answer','She bought a bag to put her things in.'),

    jsonb_build_object('number',45,
      'question',E'[다음 문장에서 어법상 틀린 곳을 찾아 문장 전체를 바르게 고쳐 쓰시오]\n\nHe has many to read books.',
      'answer','He has many books to read.'),

    jsonb_build_object('number',46,
      'question',E'[다음 문장에서 어법상 틀린 곳을 찾아 문장 전체를 바르게 고쳐 쓰시오]\n\nI need someone to depending on.',
      'answer','I need someone to depend on.'),

    -- to부정사 용법 구별 (47~50)
    jsonb_build_object('number',47,
      'question',E'[다음 밑줄 친 to부정사의 용법을 쓰시오]\n\nI have many things to do today.\n\n(명사적 / 형용사적 / 부사적)',
      'answer','형용사적'),

    jsonb_build_object('number',48,
      'question',E'[다음 밑줄 친 to부정사의 용법을 쓰시오]\n\nShe went to the store to buy some fruit.\n\n(명사적 / 형용사적 / 부사적)',
      'answer','부사적'),

    jsonb_build_object('number',49,
      'question',E'[다음 밑줄 친 to부정사의 용법을 쓰시오]\n\nTo read books every day is a good habit.\n\n(명사적 / 형용사적 / 부사적)',
      'answer','명사적'),

    jsonb_build_object('number',50,
      'question',E'[다음 밑줄 친 to부정사의 용법을 쓰시오]\n\nHe needs a place to keep his things in.\n\n(명사적 / 형용사적 / 부사적)',
      'answer','형용사적')
  );

  a_mid := jsonb_build_array(
    'eat','finish','leave','drink','say','break',
    'I want a friend to play with.',
    'She bought a notebook to write in.',
    'He needs a chair to sit on.',
    'We need a house to live in.',
    'She wants a partner to practice with.',
    'I need a pen to write with.',
    'He has a desk to study at.',
    'She found a nice park to walk in.',
    'to sleep in','to talk to','to live in','to sit on','to write with','to paint on',
    'things to do','something cold to drink','to carry water','to eat',
    'She has many books to read.',
    'I need a friend to play with.',
    'Give me something to drink.',
    'He has no chair to sit on.',
    'I have no time to do anything fun.',
    'She wants something cold to drink.',
    'There are many places to visit in Seoul.',
    'He is looking for a house to live in.',
    'I bought a gift to give her.',
    'He needs some paper to write on.',
    'to drink','to do','to study','to finish','to write with',
    'I have no friends to play with.',
    'She needs a desk to study at.',
    'He wants something interesting to read.',
    'We have a lot of things to talk about.',
    'She bought a bag to put her things in.',
    'He has many books to read.',
    'I need someone to depend on.',
    '형용사적','부사적','명사적','형용사적'
  );

  -- ═══════════════════════════════════════════════════════
  -- Step3-어려움 (13문제): 영작 / 조건 영작
  -- ═══════════════════════════════════════════════════════
  q_hard := jsonb_build_array(
    jsonb_build_object('number',1,
      'question',E'[우리말을 영작하시오]\n\n나는 읽을 책이 필요하다.',
      'answer','I need a book to read.'),

    jsonb_build_object('number',2,
      'question',E'[우리말을 영작하시오]\n\n그녀는 함께 이야기할 친구가 없다.',
      'answer','She has no friend to talk with.'),

    jsonb_build_object('number',3,
      'question',E'[우리말을 영작하시오]\n\n냉장고에 먹을 것이 아무것도 없다.',
      'answer','There is nothing to eat in the refrigerator.'),

    jsonb_build_object('number',4,
      'question',E'[우리말을 영작하시오]\n\n그에게는 살 집이 없다.',
      'answer','He has no house to live in.'),

    jsonb_build_object('number',5,
      'question',E'[우리말을 영작하시오]\n\n나에게 쓸 종이 좀 주세요.',
      'answer','Please give me some paper to write on.'),

    jsonb_build_object('number',6,
      'question',E'[우리말을 영작하시오]\n\n나는 앉을 의자가 필요하다.',
      'answer','I need a chair to sit on.'),

    jsonb_build_object('number',7,
      'question',E'[우리말을 영작하시오]\n\n그는 차가운 마실 것을 원한다.',
      'answer','He wants something cold to drink.'),

    jsonb_build_object('number',8,
      'question',E'[주어진 단어를 사용하여 영작하시오]\n\n나는 할 일이 많다. (have, things, do)',
      'answer','I have many things to do.'),

    jsonb_build_object('number',9,
      'question',E'[주어진 단어를 사용하여 영작하시오]\n\n그녀는 함께 공부할 사람이 필요하다. (need, someone, study)',
      'answer','She needs someone to study with.'),

    jsonb_build_object('number',10,
      'question',E'[주어진 단어를 사용하여 영작하시오]\n\n부산에는 방문할 곳이 많다. (many, places, visit)',
      'answer','There are many places to visit in Busan.'),

    jsonb_build_object('number',11,
      'question',E'[주어진 단어를 사용하여 영작하시오]\n\n그는 시험을 끝낸 첫 번째 학생이었다. (first, student, finish)',
      'answer','He was the first student to finish the test.'),

    jsonb_build_object('number',12,
      'question',E'[주어진 단어를 사용하여 영작하시오]\n\n우리는 걱정할 것이 아무것도 없다. (nothing, worry, about)',
      'answer','We have nothing to worry about.'),

    jsonb_build_object('number',13,
      'question',E'[주어진 단어를 사용하여 영작하시오]\n\n나는 그녀에게 줄 선물을 사야 한다. (buy, gift, give)',
      'answer','I have to buy a gift to give her.')
  );

  a_hard := jsonb_build_array(
    'I need a book to read.',
    'She has no friend to talk with.',
    'There is nothing to eat in the refrigerator.',
    'He has no house to live in.',
    'Please give me some paper to write on.',
    'I need a chair to sit on.',
    'He wants something cold to drink.',
    'I have many things to do.',
    'She needs someone to study with.',
    'There are many places to visit in Busan.',
    'He was the first student to finish the test.',
    'We have nothing to worry about.',
    'I have to buy a gift to give her.'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES
    ('to부정사의 형용사적 용법 Step3-쉬움', 'to부정사의 형용사적 용법', q_easy, a_easy, 'problem', 'interactive'),
    ('to부정사의 형용사적 용법 Step3-보통', 'to부정사의 형용사적 용법', q_mid,  a_mid,  'problem', 'interactive'),
    ('to부정사의 형용사적 용법 Step3-어려움', 'to부정사의 형용사적 용법', q_hard, a_hard, 'problem', 'interactive');

  RAISE NOTICE 'to부정사의 형용사적 용법 Step3 템플릿 3개 생성 완료 (쉬움 17 + 보통 50 + 어려움 13 = 80문제)';
END;
$$;
