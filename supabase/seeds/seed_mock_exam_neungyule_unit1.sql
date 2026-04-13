DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title IN ('중2 능률김 1과 예상문제', '중2 능률김 1과 예상문제 1차(변형)');

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- [1~2] 영영풀이
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1,
      'question',E'[1~2] 다음 영영 풀이에 해당하는 단어로 가장 적절한 것을 고르시오.\n\n"thinking about the good qualities of somebody or something" (4점)',
      'options',jsonb_build_array('active','positive','honest','caring','thoughtful'),
      'answer','2',
      'explanation',E'"좋은 점을 생각하는" = positive(긍정적인). active 활동적인 / honest 정직한 / caring 배려하는 / thoughtful 사려 깊은.'),

    jsonb_build_object('number',2,
      'question',E'[1~2] 다음 영영 풀이에 해당하는 단어로 가장 적절한 것을 고르시오.\n\n"a small space with walls for doing something privately" (3점)',
      'options',jsonb_build_array('site','center','cinema','booth','square'),
      'answer','4',
      'explanation',E'"벽이 있는 작은 공간" = booth. site 장소 / center 중심 / cinema 영화관 / square 광장.'),

    -- ═══════════════════════════════════════════
    -- [3~4] 대화 (Jinsu skateboard)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',3,
      'question',E'[3~4] 대화를 읽고 물음에 답하시오.\n\nG: Jinsu, what is your hobby?\nB: I like to ride my skateboard. It''s very fun.\nG: Wow, that''s cool. I want to try riding a skateboard someday.\nB: (A)_________________________ this Sunday?\nG: I don''t have any plans. Why?\nB: I''m planning to ride my skateboard on Sunday. I can teach you.\n\n───────────\n\n빈칸 (A)에 들어갈 말로 가장 적절하지 않은 것은? (4점)',
      'options',jsonb_build_array(
        'What are you planning to do',
        'What do you plan to do',
        'What are your plans for',
        'What will you do',
        'Why don''t you do'),
      'answer','5',
      'explanation',E'G가 "I don''t have any plans"로 답했으므로 빈칸에는 "일정을 묻는 표현"이 들어가야 한다. ⑤ "Why don''t you do ~?"는 제안 표현이라 부적절.'),

    jsonb_build_object('number',4,
      'question',E'[3~4] 지문 참고\n\n대화의 내용과 일치하는 것은? (4점)',
      'options',jsonb_build_array(
        'Jinsu is planning to buy a new skateboard.',
        'The girl already knows how to ride a skateboard.',
        'Jinsu and the girl will meet this Saturday.',
        'The girl has a special plan for this Sunday.',
        'Jinsu offered to teach the girl how to ride a skateboard.'),
      'answer','5',
      'explanation',E'B가 "I can teach you"라고 말했으므로 ⑤가 정답. ①②는 언급 없음, ③은 Sunday, ④는 "no plans"라고 했음.'),

    -- ═══════════════════════════════════════════
    -- [5~6] 대화 (Yuna camping)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',5,
      'question',E'[5~6] 대화를 읽고 물음에 답하시오.\n\nB: Hi, Yuna. What are you doing?\nG: Hi, Tom! I''m <u>ⓐpacking</u> my bag. I''m going to go camping with my family tomorrow.\nB: Oh, I see. What are you planning to do at the camping <u>ⓑsite</u>?\nG: My family and I are planning to have a barbecue, <u>ⓒtake a walk</u>, and look at the stars.\nB: That <u>ⓓsounds</u> really fun. I love going camping.\nG: Then <u>ⓔwhy don''t you</u> come with us?\nB: I''d love to! What time should we meet?\n\n───────────\n\n밑줄 친 ⓐ~ⓔ 중 문맥상 쓰임이 적절하지 않은 것은? (4점)',
      'options',jsonb_build_array(
        'ⓐ: 짐을 싸다',
        'ⓑ: 장소',
        'ⓒ: 산책하다',
        'ⓓ: ~처럼 보이다',
        'ⓔ: ~하는 게 어때'),
      'answer','4',
      'explanation',E'sound는 "~처럼 들리다"라는 뜻. "~처럼 보이다"는 look이다.'),

    jsonb_build_object('number',6,
      'question',E'[5~6] 지문 참고\n\n대화의 내용으로 답할 수 없는 질문은? (3점)',
      'options',jsonb_build_array(
        'When is Yuna going camping?',
        'Who is Yuna going camping with?',
        'What activities will Yuna do at the camping site?',
        'Does Tom like going camping?',
        'What time will they meet tomorrow?'),
      'answer','5',
      'explanation',E'Tom이 "What time should we meet?"이라고 물었을 뿐, Yuna가 아직 시간을 답하지 않았다.'),

    -- ═══════════════════════════════════════════
    -- [7~10] Bora 본문
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',7,
      'question',E'[7~10] 글을 읽고 물음에 답하시오.\n\nA new school year started! You can make new friends and be a good friend to others, too. What kind of friend do you want to be? Three students will tell you their stories.\n\nBora: I want to be someone (A)________ is happy about my friends'' good news. Minji and I are both interested in art. When she (B)won / win first prize in the school''s art competition, I felt jealous. I couldn''t congratulate her at first. But I knew she worked really hard. Finally, I <u>(C)congratulated</u> her, and she was happy about it.\n\n───────────\n\n빈칸 (A)에 들어갈 말로 가장 적절한 것은? (4점)',
      'options',jsonb_build_array('who','which','whom','whose','what'),
      'answer','1',
      'explanation',E'선행사 someone은 사람, 뒤에 동사(is)가 이어지므로 주격 관계대명사 who.'),

    jsonb_build_object('number',8,
      'question',E'[7~10] 지문 참고\n\n괄호 (B)에서 어법상 알맞은 형태와 밑줄 친 (C)의 영영 풀이가 바르게 짝지어진 것은? (5점)',
      'options',jsonb_build_array(
        'win - to tell someone that you are happy about their success',
        'win - to give someone an award for their hard work',
        'won - to tell someone that you are happy about their success',
        'won - to feel upset because someone has something you want',
        'won - to make up one''s mind to do something'),
      'answer','3',
      'explanation',E'When절이 과거(felt jealous)이므로 won. congratulate = "상대의 성공을 축하하다" 뜻으로 ①·③과 일치하는데, 시제(won)와 함께 ③이 정답.'),

    jsonb_build_object('number',9,
      'question',E'[7~10] 지문 참고\n\n위 글의 Bora에 대한 내용과 일치하지 않는 것은? (3점)',
      'options',jsonb_build_array(
        '민지와 함께 미술에 관심이 있다.',
        '민지가 미술 대회에서 우승했을 때 처음에 질투를 느꼈다.',
        '민지가 노력했다는 사실을 알고 있었다.',
        '결국 민지를 축하해 주지 못해 속상해했다.',
        '민지는 보라의 축하를 받고 기뻐했다.'),
      'answer','4',
      'explanation',E'본문: "Finally, I congratulated her." → 결국 축하해 주었으므로 ④가 내용과 다름.'),

    jsonb_build_object('number',10,
      'question',E'[7~10] 지문 참고\n\n다음 중 밑줄 친 주격 관계대명사의 쓰임이 어색한 것은? (4점)',
      'options',jsonb_build_array(
        'I have a friend <u>who</u> lives in Seoul.',
        'Look at the dog <u>which</u> is running in the park.',
        'This is the book <u>who</u> has many beautiful pictures.',
        'He is a teacher <u>that</u> teaches English to us.',
        'I like movies <u>which</u> have happy endings.'),
      'answer','3',
      'explanation',E'book은 사물이므로 who가 아닌 which 또는 that을 써야 한다.'),

    -- ═══════════════════════════════════════════
    -- [11~14] Kangmin 본문
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',11,
      'question',E'[11~14] 글을 읽고 물음에 답하시오.\n\nKangmin: I want to be a friend (A)who gives / giving honest advice. One of my friends was always late. People had to wait for him, and it made everyone <u>(B)upset</u>. So, I decided <u>(C)to talk</u> to him. "Can you please be on time?" I said. "We want to fully enjoy our time together." Talking to my friend about this problem was not easy. But <u>(D)thankfully</u>, he understood. Now he is always on time!\n\n───────────\n\n괄호 (A)에서 어법상 알맞은 표현을 고르시오. (3점)',
      'options',jsonb_build_array(
        'who give',
        'who gives',
        'which gives',
        'giving',
        'gives'),
      'answer','2',
      'explanation',E'선행사 a friend는 사람이고 단수, 뒤에 동사가 필요하므로 "who gives"가 맞다.'),

    jsonb_build_object('number',12,
      'question',E'[11~14] 지문 참고\n\n밑줄 친 (B)와 의미가 가장 가까운 것은? (4점)',
      'options',jsonb_build_array('happy','excited','unhappy','positive','active'),
      'answer','3',
      'explanation',E'upset(속상한) ≒ unhappy(기분이 좋지 않은).'),

    jsonb_build_object('number',13,
      'question',E'[11~14] 지문 참고\n\n밑줄 친 (C)와 어법상 쓰임이 같은 것은? (4점)',
      'options',jsonb_build_array(
        'I have a lot of work <u>to do</u>.',
        'He went to the library <u>to study</u>.',
        'My dream is <u>to be</u> a doctor.',
        'She wants <u>to buy</u> some cookies.',
        'It is important <u>to keep</u> a promise.'),
      'answer','4',
      'explanation',E'decided to talk = to부정사 명사적 용법(타동사의 목적어). ④ wants to buy도 동일한 타동사의 목적어. ①은 형용사적, ②는 부사적, ③은 명사적 보어, ⑤는 진주어.'),

    jsonb_build_object('number',14,
      'question',E'[11~14] 지문 참고\n\n위 글에 나타난 필자(Kangmin)의 심경 변화로 가장 적절한 것은? (3점)',
      'options',jsonb_build_array(
        'upset → disappointed',
        'worried → relieved',
        'angry → upset',
        'bored → excited',
        'confused → scared'),
      'answer','2',
      'explanation',E'친구에게 충고하는 것이 "not easy"했으므로 걱정(worried)했지만, "thankfully, he understood"로 안도(relieved)했다.'),

    -- ═══════════════════════════════════════════
    -- [15~18] Siyeon 본문
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',15,
      'question',E'[15~18] 글을 읽고 물음에 답하시오.\n\nSiyeon: I try to cheer up my friends when they are having a hard time. One day, Jisu posted, "It was a hard day," on her social media. I wanted to do something to make her happy. So, I <u>(A)bought her chocolate cookies</u>, her favorite snack. Then we watched a movie <u>(B)that</u> had a funny story and took pictures together at a photo booth. We had a great time, and she said she felt better.\n\n───────────\n\n밑줄 친 (A)와 의미가 같은 문장은? (3점)',
      'options',jsonb_build_array(
        'I bought chocolate cookies to her.',
        'I bought chocolate cookies for her.',
        'I bought chocolate cookies of her.',
        'I bought for her chocolate cookies.',
        'I bought to her chocolate cookies.'),
      'answer','2',
      'explanation',E'buy는 4형식을 3형식으로 바꿀 때 전치사 for를 쓴다. "bought her chocolate cookies" = "bought chocolate cookies for her".'),

    jsonb_build_object('number',16,
      'question',E'[15~18] 지문 참고\n\n밑줄 친 (B)와 용법이 다른 것은? (4점)',
      'options',jsonb_build_array(
        'I know <u>that</u> he is a good student.',
        'This is the house <u>that</u> has a red roof.',
        'I saw a cat <u>that</u> was sleeping on the sofa.',
        'He is the boy <u>that</u> won the first prize.',
        'Do you have a pen <u>that</u> writes well?'),
      'answer','1',
      'explanation',E'(B) that은 주격 관계대명사. ②③④⑤ 모두 관계대명사 that이지만 ①은 "~라는 것"이라는 뜻의 명사절 접속사 that.'),

    jsonb_build_object('number',17,
      'question',E'[15~18] 지문 참고\n\n위 글의 내용과 일치하는 것은? (4점)',
      'options',jsonb_build_array(
        '지수는 시연이에게 초콜릿 쿠키를 사주었다.',
        '시연이는 지수의 전화를 받고 밖으로 나갔다.',
        '시연이와 지수는 슬픈 영화를 보며 울었다.',
        '지수는 시연이와 시간을 보낸 후 기분이 나아졌다.',
        '그들은 사진 촬영 부스에서 혼자 사진을 찍었다.'),
      'answer','4',
      'explanation',E'본문: "she said she felt better". ①은 시연이가 지수에게, ③은 funny story 영화, ⑤는 together.'),

    jsonb_build_object('number',18,
      'question',E'[15~18] 지문 참고\n\n위 글의 목적으로 가장 적절한 것은? (3점)',
      'options',jsonb_build_array(
        '지수에게 사과하기 위해',
        '새로운 친구를 사귀는 법을 알려주려고',
        '자신이 어떤 친구인지 소개하기 위해',
        '소셜 미디어 사용법을 설명하려고',
        '친구에게 솔직한 충고를 하기 위해'),
      'answer','3',
      'explanation',E'시연이가 "I try to cheer up my friends"로 시작해 자신이 어떤 친구인지 이야기하고 있다.'),

    -- ═══════════════════════════════════════════
    -- [19~21] Juhee 본문
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',19,
      'question',E'[19~21] 글을 읽고 물음에 답하시오.\n\nI want to be someone who accepts the differences between my friends and me. I''m expressive, but my friend Juhee is quiet and shy. So I''m usually the one who suggests that we hang out. Also, I talk more when we meet. Juhee listens to me carefully, but she doesn''t talk much. Sometimes this makes me upset. However, Juhee is kind and thoughtful. She does things that show me that she cares about me. When I forget to bring something to school, (A)_________________. One time, I broke my leg. She helped me by carrying my things and walking with me. Now I understand that we have (B)_______ ways of expressing care for others. And I think that''s okay.\n\n───────────\n\n글의 흐름상 빈칸 (A)에 들어갈 말로 가장 적절한 것은? (5점)',
      'options',jsonb_build_array(
        'she gives me her things',
        'she lends her things me',
        'she lends me her things',
        'she lends things for me',
        'she lends to me her things'),
      'answer','3',
      'explanation',E'학교에 준비물을 잊고 왔을 때 친구가 "빌려주는" 상황이 자연스럽다. lend는 4형식으로 "lends me her things"가 올바른 어순. ①은 give(준다)라 문맥과 맞지 않고, ②④⑤는 어순/전치사 오류.'),

    jsonb_build_object('number',20,
      'question',E'[19~21] 지문 참고\n\n빈칸 (B)에 들어갈 단어로 가장 적절한 것은? (3점)',
      'options',jsonb_build_array('same','similar','common','different','easy'),
      'answer','4',
      'explanation',E'필자는 표현적이고 Juhee는 조용한 성격 → 서로 다른(different) 방식으로 관심을 표현한다는 흐름.'),

    jsonb_build_object('number',21,
      'question',E'[19~21] 지문 참고\n\n위 글의 Juhee에 대한 설명으로 옳은 것을 <보기>에서 모두 고른 것은? (4점)\n\n<보기>\nㄱ. 자신의 감정을 표현하는 데 적극적이다.\nㄴ. 수줍음이 많고 조용한 편이다.\nㄷ. 친구의 말을 주의 깊게 들어준다.\nㄹ. 친구가 다쳤을 때 짐을 들어주며 도와주었다.',
      'options',jsonb_build_array(
        'ㄱ, ㄴ',
        'ㄴ, ㄷ',
        'ㄱ, ㄴ, ㄷ',
        'ㄴ, ㄷ, ㄹ',
        'ㄱ, ㄴ, ㄷ, ㄹ'),
      'answer','4',
      'explanation',E'ㄱ은 필자(I) 얘기. Juhee는 조용하고(ㄴ), 주의 깊게 듣고(ㄷ), 다리 부러졌을 때 짐을 들어줌(ㄹ).'),

    -- ═══════════════════════════════════════════
    -- [22~26] 어법 / 관계대명사 / 수여동사
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',22,
      'question',E'다음 중 문장의 전환이 올바르지 않은 것은? (4점)',
      'options',jsonb_build_array(
        'She told us a funny joke. → She told a funny joke to us.',
        'My mom made me a board game. → My mom made a board game for me.',
        'I asked him a question. → I asked a question of him.',
        'He sent his friend a present. → He sent a present for his friend.',
        'I showed them my new skateboard. → I showed my new skateboard to them.'),
      'answer','4',
      'explanation',E'send는 전치사 to를 쓴다. "He sent a present to his friend"가 맞다.'),

    jsonb_build_object('number',23,
      'question',E'다음 밑줄 친 부분의 용법이 <보기>와 같은 것은? (4점)\n\n<보기>\nI want to be a friend <u>who</u> gives honest advice.',
      'options',jsonb_build_array(
        '<u>Who</u> is that tall boy over there?',
        'I don''t know <u>who</u> made this cake.',
        'Tell me <u>who</u> your favorite singer is.',
        'This is the girl <u>who</u> lives next door.',
        '<u>Who</u> wants to play a board game with me?'),
      'answer','4',
      'explanation',E'<보기>의 who는 주격 관계대명사. ④도 주격 관계대명사(the girl who lives). ①⑤는 의문사, ②③은 간접의문문의 의문사.'),

    jsonb_build_object('number',24,
      'question',E'다음 중 어법상 틀린 문장을 모두 고르면? (5점)\n\nⓐ I bought for my sister a doll.\nⓑ There is a boy who likes you.\nⓒ He gave some advice for me.\nⓓ I have a friend which speaks English well.\nⓔ She showed her prize to her parents.',
      'options',jsonb_build_array(
        'ⓐ, ⓑ',
        'ⓑ, ⓒ',
        'ⓐ, ⓒ, ⓓ',
        'ⓑ, ⓓ, ⓔ',
        'ⓐ, ⓒ, ⓓ, ⓔ'),
      'answer','3',
      'explanation',E'ⓐ "bought for X a Y" 어순 오류 → "bought a doll for my sister" 또는 "bought my sister a doll". ⓒ give는 전치사 to를 쓴다 → "gave some advice to me". ⓓ 선행사 friend는 사람이므로 which → who/that.'),

    jsonb_build_object('number',25,
      'question',E'다음 두 문장을 한 문장으로 연결할 때 빈칸에 알맞은 말은? (4점)\n\nI have a cat. It has blue eyes.\n→ I have a cat _______ _______ blue eyes.',
      'options',jsonb_build_array(
        'who has',
        'which has',
        'who have',
        'which have',
        'that having'),
      'answer','2',
      'explanation',E'cat은 동물(사물)이므로 which/that. cat이 단수이므로 has. 따라서 "which has".'),

    jsonb_build_object('number',26,
      'question',E'다음 ⓐ~ⓔ 중 어법상 옳은 것의 개수는? (5점)\n\nⓐ Jinsu gave me a book.\nⓑ The girl who is sitting there is my sister.\nⓒ I made a sandwich to my friend.\nⓓ He bought a present for his mother.\nⓔ I like people which are kind.',
      'options',jsonb_build_array('1개','2개','3개','4개','5개'),
      'answer','3',
      'explanation',E'ⓐ(O), ⓑ(O), ⓓ(O) 3개. ⓒ는 make + for (to→for), ⓔ는 선행사 people이 사람이므로 which→who/that.')
  );

  a := jsonb_build_array(
    '2','4','5','5','4','5','1','3','4','3',
    '2','3','4','2','2','1','4','3','3','4',
    '4','4','4','3','2','3'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES (
    '중2 능률김 1과 예상문제 1차(변형)',
    '예상문제',
    q,
    a,
    'mock_exam',
    'interactive'
  );

  RAISE NOTICE '중2 능률김 1과 예상문제 1차(변형) 템플릿 생성 완료 (26문제, 100점)';
END;
$$;
