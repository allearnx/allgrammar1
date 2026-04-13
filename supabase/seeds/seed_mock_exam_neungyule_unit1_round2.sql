DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title IN ('중2 능률김 1과 예상문제 [제2차]', '중2 능률김 1과 예상문제 2차(변형)');

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- [1~2] 영영풀이
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1,
      'question',E'[1~2] 다음 영영 풀이에 해당하는 단어로 가장 적절한 것을 고르시오.\n\n"an award that is given to a person who wins a competition" (4점)',
      'options',jsonb_build_array('prize','site','advice','reason','mind'),
      'answer','1',
      'explanation',E'"대회에서 이긴 사람에게 주어지는 상" = prize. site 장소 / advice 충고 / reason 이유 / mind 마음.'),

    jsonb_build_object('number',2,
      'question',E'[1~2] 다음 영영 풀이에 해당하는 단어로 가장 적절한 것을 고르시오.\n\n"always behaving in the same way or having the same standards; not changing" (4점)',
      'options',jsonb_build_array('positive','honest','active','consistent','thoughtful'),
      'answer','4',
      'explanation',E'"항상 같은 방식으로 행동하는, 변하지 않는" = consistent(일관된).'),

    -- ═══════════════════════════════════════════
    -- [3~4] Yuna camping 대화
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',3,
      'question',E'[3~4] 다음 대화를 읽고 물음에 답하시오.\n\nB: Hi, Yuna. What are you doing?\nG: Hi, Tom! I''m packing my bag. I''m going to go camping with my family tomorrow.\nB: Oh, I see. What are you planning to do at the camping site?\nG: My family and I are planning to have a barbecue, take a walk, and look at the stars.\nB: That sounds really fun. I love going camping.\nG: Then why don''t you come with us?\nB: (A)______________! What time should we meet?\nG: We are planning to leave at 9:30 a.m. Can you come to my house (B)<u>around</u> 9:00 a.m.?\nB: Sure! See you tomorrow!\n\n───────────\n\n위 대화의 내용과 일치하지 않는 것은? (5점)',
      'options',jsonb_build_array(
        '유나는 내일 가족과 함께 캠핑을 갈 예정이다.',
        '유나의 가족은 캠핑장에서 별을 볼 계획이 있다.',
        '톰은 캠핑 가는 것을 평소에도 아주 좋아한다.',
        '유나와 톰은 내일 아침 9시 30분에 유나의 집에서 만나기로 했다.',
        '유나의 가족은 캠핑장에서 바비큐를 해 먹을 계획이다.'),
      'answer','4',
      'explanation',E'유나의 가족이 출발하는 시간은 9:30 a.m.이지만, 톰에게 유나의 집으로 오라고 한 시간은 around 9:00 a.m.(9시쯤)이므로 9시 30분에 만난다는 설명은 일치하지 않는다.'),

    jsonb_build_object('number',4,
      'question',E'[3~4] 지문 참고\n\n빈칸 (A)에 들어갈 응답으로 가장 적절한 것과 (B)의 영영 풀이가 바르게 짝지어진 것은? (4점)',
      'options',jsonb_build_array(
        'I''d love to — until now',
        'I''m sorry, I can''t — completely or entirely',
        'I''d love to — approximately or about',
        'That''s a good idea — in the beginning',
        'I''d love to — at the correct time'),
      'answer','3',
      'explanation',E'캠핑 제안에 긍정적으로 답하며 시간을 묻는 흐름이므로 "I''d love to(나도 그러고 싶어)"가 적절. around는 시간·수치 앞에서 "대략, ~쯤(approximately or about)"을 뜻한다.'),

    -- ═══════════════════════════════════════════
    -- [5~8] Bora 본문
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',5,
      'question',E'[5~8] 다음 글을 읽고 물음에 답하시오.\n\nA new school year started! You can make new friends and be a good friend to others, too. What kind of friend do you want to be? Three students will tell you their stories.\n\nBora: I want to be someone who (A)is / are happy about my friends'' good news. Minji and I are both interested in art. When she won first prize in the school''s art competition, I felt jealous. I couldn''t congratulate her at first. But I knew she worked really hard. Finally, I congratulated her, and she was happy about <u>ⓐit</u>.\n\n───────────\n\n빈칸 (A)에 들어갈 말로 가장 적절한 것은? (3점)',
      'options',jsonb_build_array('is','are','was','were','being'),
      'answer','1',
      'explanation',E'주격 관계대명사절의 동사는 선행사에 수 일치. 선행사 someone(단수)이고 필자의 바람이므로 현재시제 is.'),

    jsonb_build_object('number',6,
      'question',E'[5~8] 지문 참고\n\n위 글에 나타난 Bora의 심경 변화로 가장 적절한 것은? (4점)',
      'options',jsonb_build_array(
        'jealous → upset',
        'upset → happy',
        'jealous → happy',
        'happy → jealous',
        'happy → upset'),
      'answer','3',
      'explanation',E'Bora는 Minji가 상을 받았을 때 처음엔 "I felt jealous"(질투)했지만, 결국 축하하며 "she was happy"로 끝났다. 심경 변화: jealous → happy.'),

    jsonb_build_object('number',7,
      'question',E'[5~8] 지문 참고\n\n위 글의 내용과 일치하는 것은? (4점)',
      'options',jsonb_build_array(
        'Bora and Minji have different hobbies.',
        'Minji won a prize without working hard.',
        'Bora was happy for Minji from the very beginning.',
        'Minji was upset because Bora didn''t congratulate her.',
        'Bora changed her mind and celebrated Minji''s success.'),
      'answer','5',
      'explanation',E'처음에 Bora는 축하하지 못했지만 결국 마음을 바꿔 축하했다 → Bora changed her mind and celebrated.'),

    jsonb_build_object('number',8,
      'question',E'[5~8] 지문 참고\n\n다음 중 밑줄 친 ''who''의 용법이 위 글의 ''who''와 같은 것은? (4점)',
      'options',jsonb_build_array(
        '<u>Who</u> is that tall boy over there?',
        'I want to know <u>who</u> made this cake.',
        'Tell me <u>who</u> is the strongest in your class.',
        'Do you have a friend <u>who</u> lives in Seoul?',
        '<u>Who</u> wants to go to the photo booth with me?'),
      'answer','4',
      'explanation',E'위 글의 who는 주격 관계대명사(someone who is happy). ④도 주격 관계대명사(a friend who lives). ①⑤는 의문사, ②③은 간접의문문.'),

    -- ═══════════════════════════════════════════
    -- [9~12] Kangmin 본문
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',9,
      'question',E'[9~12] 다음 글을 읽고 물음에 답하시오.\n\nKangmin: I want to be a friend who (A)gives / give honest advice. One of my friends was always late. People had to wait for him, and <u>(B)it</u> made everyone upset. So, I decided to talk to him. "Can you please be on time?" I said. "We want to fully enjoy our time together." Talking to my friend about <u>ⓒthis problem</u> was not easy. But thankfully, he understood. Now he is always on time!\n\n───────────\n\n빈칸 (A)에 들어갈 말로 가장 적절한 것은? (3점)',
      'options',jsonb_build_array('give','gives','giving','to give','gave'),
      'answer','2',
      'explanation',E'주격 관계대명사절의 동사는 선행사(a friend, 단수)에 수 일치 → gives.'),

    jsonb_build_object('number',10,
      'question',E'[9~12] 지문 참고\n\n위 글에서 알 수 있는 교훈으로 가장 적절한 것은? (4점)',
      'options',jsonb_build_array(
        '친구의 비밀은 절대 말하지 않아야 한다.',
        '친구에게 선물을 자주 줘야 한다.',
        '나쁜 습관이 있는 친구는 피해야 한다.',
        '솔직한 충고가 친구 관계를 더 좋게 만든다.',
        '시간 약속은 중요하지 않다.'),
      'answer','4',
      'explanation',E'강민이가 솔직한 충고("Can you please be on time?")를 했고, 친구가 이해하여 "Now he is always on time!"이 되었다. 솔직한 충고가 관계를 개선한 사례.'),

    jsonb_build_object('number',11,
      'question',E'[9~12] 지문 참고\n\n밑줄 친 ⓒthis problem의 구체적인 내용으로 가장 적절한 것은? (4점)',
      'options',jsonb_build_array(
        'the friend''s poor health',
        'the friend''s habit of being late',
        'the difficulty of making new friends',
        'the cost of buying chocolate cookies',
        'the difficulty of talking to old friends'),
      'answer','2',
      'explanation',E'앞에서 "One of my friends was always late"라고 했으므로 this problem = 친구의 늦는 습관.'),

    jsonb_build_object('number',12,
      'question',E'[9~12] 지문 참고\n\n위 글의 제목으로 가장 적절한 것은? (4점)',
      'options',jsonb_build_array(
        'The Value of Giving Honest Advice',
        'How to Prepare for a New School Year',
        'The Difficulty of Being a Punctual Person',
        'Making New Friends Through Social Media',
        'Tips for Enjoying Free Time with Your Friends'),
      'answer','1',
      'explanation',E'강민이가 솔직한 충고를 통해 친구의 문제를 해결한 이야기 → "솔직한 충고의 가치".'),

    -- ═══════════════════════════════════════════
    -- [13~16] Siyeon 본문
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',13,
      'question',E'[13~16] 다음 글을 읽고 물음에 답하시오.\n\nSiyeon: I try to cheer up my friends when they are having a hard time. One day, Jisu posted, "It was a hard day," on her social media. I wanted to do something to make her happy. So, I <u>(A)bought her chocolate cookies</u>, her favorite snack. Then we watched a movie that had a funny story and took pictures together at a photo booth. We had a great time, and she said she felt better.\n\n───────────\n\n밑줄 친 (A)와 의미가 같은 문장은? (4점)',
      'options',jsonb_build_array(
        'I bought chocolate cookies to her.',
        'I bought chocolate cookies for her.',
        'I bought chocolate cookies of her.',
        'I bought to her chocolate cookies.',
        'I bought for her chocolate cookies.'),
      'answer','2',
      'explanation',E'buy는 4형식을 3형식으로 바꿀 때 전치사 for를 쓴다. "bought her chocolate cookies" = "bought chocolate cookies for her".'),

    jsonb_build_object('number',14,
      'question',E'[13~16] 지문 참고\n\n위 글의 시연이를 설명하는 단어로 가장 적절하지 않은 것은? (3점)',
      'options',jsonb_build_array('caring','kind','thoughtful','considerate','jealous'),
      'answer','5',
      'explanation',E'caring(배려하는) / kind(친절한) / thoughtful(사려 깊은) / considerate(배려심 있는)는 모두 긍정적. jealous(질투하는)는 부정적 감정이라 부적절.'),

    jsonb_build_object('number',15,
      'question',E'[13~16] 지문 참고\n\n위 글의 내용으로 대답할 수 없는 질문은? (4점)',
      'options',jsonb_build_array(
        'What did Jisu post on her social media?',
        'What is Jisu''s favorite snack?',
        'Where did Siyeon and Jisu take pictures?',
        'What kind of movie did they watch?',
        'How much did Siyeon spend on the cookies?'),
      'answer','5',
      'explanation',E'쿠키 가격에 대한 정보는 본문에 없다.'),

    jsonb_build_object('number',16,
      'question',E'[13~16] 지문 참고\n\n다음 중 밑줄 친 관계대명사 뒤 동사의 수 일치가 어법상 옳은 것은? (4점)',
      'options',jsonb_build_array(
        'I like movies <u>which has</u> happy endings.',
        'Look at the cat <u>that are</u> sleeping on the sofa.',
        'He has two brothers <u>who lives</u> in Busan.',
        'These are the books <u>that contains</u> funny stories.',
        'She is a girl <u>who works</u> very hard for her dream.'),
      'answer','5',
      'explanation',E'주격 관계대명사 뒤 동사는 선행사에 수 일치. ⑤ a girl(단수) → works ✓ / ①movies→have / ②cat→is / ③brothers→live / ④books→contain.'),

    -- ═══════════════════════════════════════════
    -- [17~20] Juhee 본문
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',17,
      'question',E'[17~20] 다음 글을 읽고 물음에 답하시오.\n\nI want to be someone who accepts the differences between my friends and me. I''m expressive, but my friend Juhee is quiet and shy. So I''m usually the one who suggests that we hang out. Also, I talk more when we meet. Juhee listens to me carefully, but she doesn''t talk much. Sometimes <u>(A)this</u> makes me upset. However, Juhee is kind and thoughtful. She does things that show me that she cares about me. When I forget to bring something to school, she (B)lends / borrows me her things. One time, I broke my leg. She helped me by carrying my things and walking with me. Now I understand that we have <u>(C)different</u> ways of expressing care for others. And I think that''s okay.\n\n───────────\n\n밑줄 친 (A)가 가리키는 구체적인 상황으로 가장 적절한 것은? (4점)',
      'options',jsonb_build_array(
        '주희가 너무 조용하고 말을 많이 하지 않는 것',
        '주희가 친구의 말을 아주 주의 깊게 듣는 것',
        '필자가 주희에게 먼저 놀자고 제안하는 것',
        '필자가 주희보다 말을 훨씬 더 많이 하는 것',
        '주희가 필자의 물건을 대신 들어주는 것'),
      'answer','1',
      'explanation',E'"Juhee listens to me carefully, but she doesn''t talk much. Sometimes this makes me upset." → this = 주희가 말을 많이 하지 않는 것.'),

    jsonb_build_object('number',18,
      'question',E'[17~20] 지문 참고\n\n괄호 (B)에서 어법상 알맞은 표현과 빈칸 (C)의 영영 풀이가 바르게 짝지어진 것은? (5점)',
      'options',jsonb_build_array(
        'lends - not the same',
        'lends - feeling happy and positive',
        'borrows - not the same',
        'borrows - telling the truth, not lying',
        'lends - happening fast, taking a short time'),
      'answer','1',
      'explanation',E'물건을 안 가져온 필자에게 주희가 "빌려주는" 상황 → lend. different = not the same.'),

    jsonb_build_object('number',19,
      'question',E'[17~20] 지문 참고\n\n위 글의 주제로 가장 적절한 것은? (4점)',
      'options',jsonb_build_array(
        'The difficulty of making a shy friend',
        'How to help a friend with a broken leg',
        'Understanding different ways of caring',
        'The importance of being an expressive person',
        'Why you should bring your own things to school'),
      'answer','3',
      'explanation',E'필자와 주희가 서로 다른 방식으로 관심을 표현한다는 것을 이해하게 된 이야기.'),

    jsonb_build_object('number',20,
      'question',E'[17~20] 지문 참고\n\n위 글의 Juhee에 대한 설명으로 일치하지 않는 것은? (3점)',
      'options',jsonb_build_array(
        '수줍음이 많고 조용한 성격이다.',
        '친구의 이야기를 주의 깊게 들어준다.',
        '사려 깊고 친절한 성격의 소유자이다.',
        '친구가 물건을 안 가져왔을 때 빌려준다.',
        '친구가 다쳤을 때 먼저 놀자고 제안했다.'),
      'answer','5',
      'explanation',E'다리가 부러진 사람은 필자(I)이며 주희는 짐을 들어주고 함께 걸어주었다. "먼저 놀자고 제안"은 본문에 없음.'),

    -- ═══════════════════════════════════════════
    -- [21~26] 종합 어법 및 어휘
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',21,
      'question',E'다음 중 빈칸에 들어갈 말이 나머지 넷과 다른 하나는? (3점)',
      'options',jsonb_build_array(
        'My mom made a cake _____ me.',
        'He bought a new bike _____ his son.',
        'She cooked a delicious dinner _____ us.',
        'I showed my new hairstyle _____ my friends.',
        'They found a small box _____ the little girl.'),
      'answer','4',
      'explanation',E'make / buy / cook / find는 전치사 for를 쓰지만, show는 to를 쓴다.'),

    jsonb_build_object('number',22,
      'question',E'다음 중 어법상 옳은 문장의 개수는? (4점)\n\nⓐ I have a friend who like board games.\nⓑ There are some students who are late.\nⓒ He is the man who teach us English.\nⓓ I want to be someone who makes people laugh.\nⓔ Look at the birds which is flying in the sky.',
      'options',jsonb_build_array('1개','2개','3개','4개','5개'),
      'answer','2',
      'explanation',E'ⓑ students(복수) → are ✓ / ⓓ someone(단수) → makes ✓ 2개 정답. ⓐ friend→likes / ⓒ man→teaches / ⓔ birds→are로 고쳐야 함.'),

    jsonb_build_object('number',23,
      'question',E'다음 문장의 밑줄 친 부분과 쓰임이 같은 것은? (4점)\n\nI decided <u>to talk</u> to my friend.',
      'options',jsonb_build_array(
        'I have a lot of work <u>to do</u>.',
        'She wants <u>to buy</u> some chocolate cookies.',
        'They went to the park <u>to take</u> a walk.',
        'It is very important <u>to be</u> on time.',
        'I need a pen <u>to write</u> a letter.'),
      'answer','2',
      'explanation',E'decided to talk = to부정사 명사적 용법(타동사의 목적어). ② wants to buy도 동일. ①⑤ 형용사적, ③ 부사적(목적), ④ 진주어.'),

    jsonb_build_object('number',24,
      'question',E'빈칸 (A), (B)에 들어갈 단어로 가장 적절하게 짝지어진 것은? (3점)\n\n"He is very (A)<u>honest</u>. He always tells the truth. Also, he is a (B)<u>positive</u> person who thinks about good qualities of things."',
      'options',jsonb_build_array(
        '(A) 정직한 - (B) 긍정적인',
        '(A) 정직한 - (B) 사려 깊은',
        '(A) 사려 깊은 - (B) 긍정적인',
        '(A) 사려 깊은 - (B) 활동적인',
        '(A) 친절한 - (B) 긍정적인'),
      'answer','1',
      'explanation',E'honest = 정직한 / positive = 긍정적인.'),

    jsonb_build_object('number',25,
      'question',E'다음 중 우리말 영작이 틀린 것은? (4점)',
      'options',jsonb_build_array(
        '그는 나에게 책 한 권을 주었다. (He gave me a book.)',
        '나는 그녀에게 충고를 해주었다. (I gave some advice for her.)',
        '나는 미술에 관심이 있는 친구가 있다. (I have a friend who is interested in art.)',
        '그것은 나를 속상하게 만들었다. (It made me upset.)',
        '그는 시간을 잘 지키는 친구이다. (He is a friend who is on time.)'),
      'answer','2',
      'explanation',E'give는 전치사 to를 쓴다 → "I gave some advice to her."'),

    jsonb_build_object('number',26,
      'question',E'다음 ⓐ~ⓔ 중 어법상 틀린 것의 개수는? (4점)\n\nⓐ I bought a present for my sister.\nⓑ He is the boy which won the first prize.\nⓒ There are many people who lives in Seoul.\nⓓ She told a funny joke to us.\nⓔ I want to be someone who are happy.',
      'options',jsonb_build_array('1개','2개','3개','4개','5개'),
      'answer','3',
      'explanation',E'ⓑ boy(사람) → which→who/that / ⓒ people(복수) → lives→live / ⓔ someone(단수) → are→is. 3개 틀림.')
  );

  a := jsonb_build_array(
    '1','4','4','3','1','3','5','4','2','4',
    '2','1','2','5','5','5','1','1','3','5',
    '4','2','2','1','2','3'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES (
    '중2 능률김 1과 예상문제 2차(변형)',
    '예상문제',
    q,
    a,
    'mock_exam',
    'interactive'
  );

  RAISE NOTICE '중2 능률김 1과 예상문제 2차(변형) 템플릿 생성 완료 (26문제, 100점)';
END;
$$;
