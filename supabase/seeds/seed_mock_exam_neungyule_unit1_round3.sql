DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = '중2 능률김 1과 예상문제 3차(변형)';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- [1~3] Bora + Kangmin + Siyeon 3인 소개글
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1,
      'question',E'[1~3] 다음 글을 읽고, 물음에 답하시오.\n\nA new school year started! You can make new friends and be a good friend to others, too. What kind of friend do you want to be? Three students will tell you their stories.\n\n【Bora】\nI want to be someone who is (A)______ about my friends'' good news. Minji and I are both interested in art. When she won first prize in the school''s art competition, I felt jealous. I couldn''t congratulate her at first. But I knew she worked really hard. Finally, I congratulated her, and she was happy about it.\n\n【Kangmin】\nI want to be a friend who gives honest advice. One of my friends was always late. People had to wait for him, and it made everyone upset. So, I decided to talk to him. "Can you please be on time?" I said. "We want to fully enjoy our time together." Talking to my friend about this problem was not easy. But thankfully, he understood. Now he is always on time!\n\n【Siyeon】\nI try to cheer up my friends when they are having a hard time. One day, Jisu posted, "It was a hard day," on her social media. I wanted to do something to make her happy. So, I bought her chocolate cookies, her favorite snack. Then we watched a movie that had a funny story and took pictures together at a photo booth. We had a great time, and she said she felt better.\n\n───────────\n\n빈칸 (A)에 들어갈 말로 가장 적절한 것은? (4점)',
      'options',jsonb_build_array('upset','honest','happy','jealous','late'),
      'answer','3',
      'explanation',E'Bora가 지향하는 것은 친구의 좋은 소식(good news)에 "기뻐하는" 사람. 뒤 문장에서 질투를 극복하고 "congratulated her, and she was happy"로 이어지므로 (A) = happy.'),

    jsonb_build_object('number',2,
      'question',E'[1~3] 지문 참고\n\n윗글의 내용과 일치하지 않는 것은? (4점)',
      'options',jsonb_build_array(
        'Bora and Minji are both interested in art.',
        'Bora congratulated Minji right away when she heard the news.',
        'Kangmin''s friend was always late.',
        'Kangmin''s friend understood after their talk.',
        'Siyeon bought Jisu chocolate cookies to cheer her up.'),
      'answer','2',
      'explanation',E'"I couldn''t congratulate her at first"라고 했으므로 Bora는 소식을 들은 직후 바로 축하하지 못했다. ② right away가 틀림.'),

    jsonb_build_object('number',3,
      'question',E'[1~3] 지문 참고\n\n윗글을 읽고 답할 수 없는 것은? (5점)',
      'options',jsonb_build_array(
        'How long have Bora and Minji been friends?',
        'What did Kangmin say to his friend about being late?',
        'What did Siyeon buy for Jisu?',
        'What did Siyeon and Jisu do together?',
        'How did Jisu feel after spending time with Siyeon?'),
      'answer','1',
      'explanation',E'Bora와 Minji가 친구가 된 기간은 본문에 전혀 언급되지 않는다. ②~⑤는 모두 본문에서 확인 가능.'),

    -- ═══════════════════════════════════════════
    -- [4~6] Jinsu 스케이트보드 대화
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',4,
      'question',E'[4~6] 다음 대화를 읽고, 물음에 답하시오.\n\nG: Jinsu, what is your hobby?\nB: I like to ride my skateboard. It''s very fun.\nG: Wow, that''s cool. I want to try riding a skateboard someday.\nB: What are you planning to do this Sunday?\nG: I don''t have any plans. Why?\nB: I''m planning to ride my skateboard on Sunday. I can teach you.\nG: Great! What time should we meet?\nB: Let''s meet at 2:00 p.m. at Central Square.\n(G: Girl, B: Boy)\n\n───────────\n\n대화의 흐름상 빈칸에 들어갈 말로 가장 적절한 것은? (4점)\n\nG: Jinsu, I tried skateboarding on Sunday. It was really fun!\nB: That''s great! Are you going to keep practicing?\nG: Yes! ________________________\nB: Sure! Let''s practice again next weekend.',
      'options',jsonb_build_array(
        'I don''t want to ride a skateboard anymore.',
        'I think skateboarding is too dangerous for me.',
        'I''m going to quit after today.',
        'Can you teach me again sometime?',
        'I already know how to ride well.'),
      'answer','4',
      'explanation',E'뒤에 진수가 "Sure! Let''s practice again next weekend."라고 답했으므로 소녀의 말은 다시 가르쳐 달라는 요청이어야 한다 → ④.'),

    jsonb_build_object('number',5,
      'question',E'[4~6] 지문 참고\n\n위 대화의 내용과 일치하지 않는 것은? (3점)',
      'options',jsonb_build_array(
        'Jinsu''s hobby is skateboarding.',
        'The girl wants to try skateboarding someday.',
        'Jinsu is planning to ride his skateboard on Sunday.',
        'They will meet at 2:00 p.m.',
        'They will meet at the school gym.'),
      'answer','5',
      'explanation',E'"Let''s meet at 2:00 p.m. at Central Square."라고 했으므로 만남 장소는 Central Square. school gym이 아님.'),

    jsonb_build_object('number',6,
      'question',E'[4~6] 지문 참고\n\n대화에서 알 수 없는 것은? (4점)',
      'options',jsonb_build_array(
        'How long Jinsu has been skateboarding',
        'What the girl wants to try',
        'What Jinsu is planning to do on Sunday',
        'What time they will meet',
        'Where they will meet'),
      'answer','1',
      'explanation',E'진수가 스케이트보드를 얼마나 오래 타 왔는지는 대화에 전혀 나오지 않는다. ②~⑤는 모두 확인 가능.'),

    -- ═══════════════════════════════════════════
    -- [7~8] Yuna 캠핑 대화
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',7,
      'question',E'[7~8] 다음 대화를 읽고, 물음에 답하시오.\n\nB: Hi, Yuna. What are you doing?\nG: Hi, Tom! I''m packing my bag. I''m going to go camping with my family tomorrow.\nB: Oh, I see. What are you planning to do at the camping site?\nG: My family and I are planning to have a barbecue, take a walk, and look at the stars.\nB: That sounds really fun. I love going camping.\nG: Then why don''t you come with us?\nB: I''d love to! What time should we meet?\nG: We are planning to leave at 9:30 a.m. Can you come to my house around 9:00 a.m.?\nB: Sure! See you tomorrow!\n(B: Boy, G: Girl)\n\n───────────\n\n위 대화의 내용과 일치하는 것은? (4점)',
      'options',jsonb_build_array(
        'Yuna is going camping alone.',
        'Tom will go to Yuna''s house at 9:00 a.m.',
        'They are planning to leave at 9:00 a.m.',
        'Tom doesn''t like camping.',
        'Yuna and Tom will go to a movie theater.'),
      'answer','2',
      'explanation',E'"Can you come to my house around 9:00 a.m.?"로 Yuna가 Tom에게 9시쯤 집으로 오라고 했다. ①가족과 함께, ③출발 9:30, ④Tom은 캠핑을 좋아함, ⑤캠핑 가는 상황이므로 모두 틀림.'),

    jsonb_build_object('number',8,
      'question',E'[7~8] 지문 참고\n\n위 대화에서 Yuna가 계획하지 않은 것은? (4점)',
      'options',jsonb_build_array(
        'having a barbecue',
        'taking a walk',
        'going to the cinema',
        'looking at the stars',
        'inviting Tom to come along'),
      'answer','3',
      'explanation',E'Yuna의 계획: 바비큐, 산책, 별 보기, Tom 초대. 영화관(cinema)은 언급되지 않음.'),

    -- ═══════════════════════════════════════════
    -- [9~11] Juhee 지문 (어법)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',9,
      'question',E'[9~11] 다음 글을 읽고, 물음에 답하시오.\n\nI want to be someone <u>ⓐwho accepts</u> the differences between my friends and me. I''m expressive, but my friend Juhee is quiet and shy. So I''m usually the one <u>ⓑwho suggests</u> that we hang out. Also, I talk more when we meet. Juhee listens to me carefully, but she doesn''t talk much. Sometimes this makes me upset. However, Juhee is kind and thoughtful. She does things <u>ⓒthat show</u> me she cares about me. She is a friend <u>ⓓwhich lends</u> me her things when I forget to bring something to school. One time, I broke my leg. She helped me by carrying my things and walking with me. Now I understand that we have <u>ⓔdifferent</u> ways of expressing care for others. And I think that''s okay.\n\n───────────\n\n윗글의 주제로 가장 적절한 것은? (4점)',
      'options',jsonb_build_array(
        'the importance of talking a lot',
        'how to make new friends at school',
        'why shy people are better friends',
        'the best way to help a sick friend',
        'accepting different ways of showing care in friendship'),
      'answer','5',
      'explanation',E'필자와 주희가 서로 다른 방식으로 관심을 표현한다는 것을 이해하게 된 이야기. "we have different ways of expressing care"가 핵심.'),

    jsonb_build_object('number',10,
      'question',E'[9~11] 지문 참고\n\nJuhee에 관한 윗글의 내용과 일치하지 않는 것은? (3점)',
      'options',jsonb_build_array(
        '조용하고 수줍음이 많다.',
        '친구에게 만나자고 자주 제안한다.',
        '친구의 말을 주의 깊게 듣는다.',
        '친절하고 배려심이 많다.',
        '다리가 다친 친구를 도와주었다.'),
      'answer','2',
      'explanation',E'놀자고 먼저 제안하는 사람은 필자(I)이다: "I''m usually the one who suggests that we hang out." ② 틀림.'),

    jsonb_build_object('number',11,
      'question',E'[9~11] 지문 참고\n\n밑줄 친 ⓐ~ⓔ 중 어법상 틀린 것은? (4점)',
      'options',jsonb_build_array('ⓐ','ⓑ','ⓒ','ⓓ','ⓔ'),
      'answer','4',
      'explanation',E'사람(a friend)을 선행사로 하는 관계대명사는 who 또는 that을 써야 한다. ⓓ which는 사물 선행사에만 쓸 수 있으므로 which → who가 옳다.'),

    -- ═══════════════════════════════════════════
    -- [12~13] Bora 확장 지문 (문장 삽입 + 요약)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',12,
      'question',E'[12~13] 다음 글을 읽고, 물음에 답하시오.\n\nI want to be someone who is happy about my friends'' good news. Minji and I are both interested in art. When she won first prize in the school''s art competition, I felt <u>ⓐjealous</u>. I couldn''t congratulate her <u>ⓑat first</u>. But I knew she worked really hard. <u>ⓒFinally</u>, I congratulated her, and she was <u>ⓓhappy</u> about it. That moment taught me something important. A true friend is someone <u>ⓔwho</u> is happy about others'' success, even when it is hard.\n\n───────────\n\n윗글에서 다음 문장이 들어가기에 가장 적절한 곳은? (5점)\n\n[ It was not easy, but it was the right thing to do. ]',
      'options',jsonb_build_array('ⓐ 앞','ⓑ 앞','ⓒ 앞','ⓓ 앞','ⓔ 앞'),
      'answer','3',
      'explanation',E'"쉽지 않았지만 옳은 일이었다"는 문장은, 질투심으로 축하하지 못하다가 결국 축하하기로 결심하는 흐름에 들어가야 한다. "But I knew she worked really hard. [삽입] Finally, I congratulated her" → ⓒ Finally 앞.'),

    jsonb_build_object('number',13,
      'question',E'[12~13] 지문 참고\n\n윗글의 마지막 문장을 요약할 때, 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은? (4점)\n\nA true friend is someone who is (A)______ about others'' success, even when it is (B)______.',
      'options',jsonb_build_array(
        '(A) upset — (B) easy',
        '(A) jealous — (B) hard',
        '(A) happy — (B) hard',
        '(A) happy — (B) easy',
        '(A) lucky — (B) hard'),
      'answer','3',
      'explanation',E'본문 마지막 문장을 그대로 확인: "A true friend is someone who is happy about others'' success, even when it is hard." → (A) happy / (B) hard.'),

    -- ═══════════════════════════════════════════
    -- [14~15] Kangmin 확장 지문 (어법 오류)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',14,
      'question',E'[14~15] 다음 글을 읽고, 물음에 답하시오.\n\nI want to be a friend <u>(A)who gives</u> honest advice. One of my friends was always late. People had to wait for him, and it made everyone upset. So, I decided to talk to him.\n"Can you please be on time?" I said. "We want to fully enjoy our time together." Talking to my friend about this problem <u>(B)were</u> not easy. But thankfully, <u>(C)he</u> understood. Now <u>(D)he</u> is always on time!\nI learned something important. A good friend is someone <u>(E)who</u> tells you the truth, even when it is hard to hear.\n\n───────────\n\n(A)~(E) 중 어법상 틀린 것은? (4점)',
      'options',jsonb_build_array('(A)','(B)','(C)','(D)','(E)'),
      'answer','2',
      'explanation',E'(B)의 주어는 동명사구 "Talking to my friend about this problem"으로 단수 취급. 따라서 were → was가 옳다.'),

    jsonb_build_object('number',15,
      'question',E'[14~15] 지문 참고\n\n윗글의 내용과 일치하지 않는 것은? (3점)',
      'options',jsonb_build_array(
        'The writer wants to be a friend who gives honest advice.',
        'One of the writer''s friends was always late.',
        'The writer decided to talk to his friend about the problem.',
        'His friend understood after their talk.',
        'His friend did not change his behavior in the end.'),
      'answer','5',
      'explanation',E'마지막에 "Now he is always on time!"이라고 했으므로 친구는 행동을 고쳤다. ⑤ did not change가 틀림.'),

    -- ═══════════════════════════════════════════
    -- [16~18] 세 가지 조언 확장 지문
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',16,
      'question',E'[16~18] 다음 글을 읽고, 물음에 답하시오.\n\nWhat kind of friend do you want to be? Here are three simple things you can do to be a good friend.\n\nFirst, be (A)<u>upset / happy</u> about your friends'' good news. When something good happens to your friend, celebrate with them. It is not always easy, but it makes your friendship stronger.\n\nSecond, give (B)<u>honest / late</u> advice. If your friend has a bad habit, tell them kindly. A good friend is someone who tells the truth. Your friend will thank you later.\n\nFinally, cheer up your friends when they are having a hard time. Do something (C)<u>special / upset</u> for them, like buying their favorite snack or watching a funny movie together. Small actions can make a big difference.\n\nThese three things can help you become the kind of friend everyone needs!\n\n───────────\n\n(A)~(C) 중 문맥상 낱말의 쓰임이 올바른 것으로 짝지어진 것은? (4점)',
      'options',jsonb_build_array(
        '(A) upset — (B) honest — (C) special',
        '(A) happy — (B) late — (C) upset',
        '(A) upset — (B) late — (C) special',
        '(A) happy — (B) honest — (C) special',
        '(A) happy — (B) honest — (C) upset'),
      'answer','4',
      'explanation',E'(A) 친구의 좋은 소식에 "기뻐해라" → happy / (B) "솔직한" 충고 → honest / (C) 친구를 위해 "특별한" 일을 해라 → special.'),

    jsonb_build_object('number',17,
      'question',E'[16~18] 지문 참고\n\n윗글의 목적으로 가장 적절한 것은? (3점)',
      'options',jsonb_build_array(
        '좋은 친구가 되는 방법을 소개하려고',
        '친구와 싸웠을 때 화해하는 방법을 알려주려고',
        '친구를 사귀기 어려운 이유를 설명하려고',
        '나쁜 습관을 고치는 방법을 안내하려고',
        '학교생활에서 지켜야 할 규칙을 소개하려고'),
      'answer','1',
      'explanation',E'"Here are three simple things you can do to be a good friend."로 시작해 좋은 친구가 되는 세 가지 방법을 소개하는 글이다.'),

    jsonb_build_object('number',18,
      'question',E'[16~18] 지문 참고\n\n윗글을 읽고 답할 수 없는 것은? (3점)',
      'options',jsonb_build_array(
        'What is the first thing you can do to be a good friend?',
        'What should you do when your friend has a bad habit?',
        'How many friends does the writer have?',
        'What can you do to cheer up a friend?',
        'What do small actions do for a friend?'),
      'answer','3',
      'explanation',E'필자가 몇 명의 친구를 갖고 있는지는 본문에 전혀 나오지 않는다. ①②④⑤는 모두 확인 가능.'),

    -- ═══════════════════════════════════════════
    -- [19~20] Siyeon 확장 지문 (문장 삽입 + 제목)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',19,
      'question',E'[19~20] 다음 글을 읽고, 물음에 답하시오.\n\nI try to cheer up my friends when they are having a hard time. One day, Jisu posted, "It was a hard day," on her social media. I wanted to do something to make her happy.\n\nSo, I bought her chocolate cookies, her favorite snack. ( ① ) Then we watched a movie that had a funny story. ( ② ) We also took pictures together at a photo booth. ( ③ ) We had a great time. ( ④ ) She said she felt better. ( ⑤ )\n\nI learned that small actions can make a big difference. When your friend is having a hard time, just being there for them is enough.\n\n───────────\n\n윗글에서 다음 문장이 들어가기에 가장 적절한 곳은? (5점)\n\n[ I was really happy to see her smile again. ]',
      'options',jsonb_build_array('①','②','③','④','⑤'),
      'answer','5',
      'explanation',E'"She said she felt better." 다음에 필자가 그녀의 미소를 다시 보고 기뻤다는 감상이 이어지는 것이 자연스럽다 → ⑤.'),

    jsonb_build_object('number',20,
      'question',E'[19~20] 지문 참고\n\n윗글의 제목으로 가장 적절한 것은? (4점)',
      'options',jsonb_build_array(
        'Small Actions, Big Difference',
        'How to Use Social Media Safely',
        'The Best Movies to Watch with Friends',
        'Why Photo Booths Are Popular',
        'How to Make Chocolate Cookies'),
      'answer','1',
      'explanation',E'마지막 문장 "small actions can make a big difference"가 글의 핵심 메시지. → ① Small Actions, Big Difference.'),

    -- ═══════════════════════════════════════════
    -- 21 단독 대화 빈칸
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',21,
      'question',E'대화의 빈칸에 들어갈 말로 가장 적절한 것은? (2점)\n\nA: Your friend won the art competition. How do you feel?\nB: Honestly, I felt a little jealous at first.\nA: That''s normal. What did you do?\nB: ____________________________\nA: That was a great thing to do!\n(A: Girl, B: Boy)',
      'options',jsonb_build_array(
        'I didn''t say anything to her.',
        'I told her I was upset about it.',
        'I congratulated her and told her she deserved it.',
        'I decided not to be friends with her anymore.',
        'I asked the teacher to change the result.'),
      'answer','3',
      'explanation',E'A가 "That was a great thing to do!"(정말 잘한 일이야!)라고 반응했으므로 B의 대답은 긍정적인 행동이어야 한다 → ③ 축하해 주고 자격이 있다고 말함.'),

    -- ═══════════════════════════════════════════
    -- [22~23] Miho 어법 지문 + 어법 개수
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',22,
      'question',E'[22~23] 다음 글을 읽고, 물음에 답하시오.\n\nI want to be a friend <u>ⓐwho</u> gives honest advice. One day, I noticed that my friend Miho had a bad habit. She was always late. I decided to talk to her. I sent <u>ⓑher</u> a message and asked if we could meet. When we met, I told <u>ⓒto her</u> the truth. I said, "Being late makes everyone upset." She listened carefully. Then she <u>ⓓsaid</u>, "You''re right. I''m sorry." Now she is always on time. I am really happy <u>ⓔthat</u> I talked to her.\n\n───────────\n\nⓐ~ⓔ 중 어법상 틀린 것은? (4점)',
      'options',jsonb_build_array('ⓐ','ⓑ','ⓒ','ⓓ','ⓔ'),
      'answer','3',
      'explanation',E'tell은 "tell + 사람 + 사물"(4형식) 또는 "tell + 사물 + to + 사람"(3형식) 어순을 따른다. ⓒ "told to her the truth"는 전치사+사람이 사물보다 앞에 와서 어순이 틀림 → "told her the truth"가 옳음.'),

    jsonb_build_object('number',23,
      'question',E'다음 중 어법상 옳은 문장의 개수는? (4점)\n\nⓐ She is a friend who always listen to me.\nⓑ I gave her a chocolate cookie.\nⓒ He bought to her a present.\nⓓ Bora is someone who wants to be a good friend.\nⓔ They showed to us the photo booth pictures.',
      'options',jsonb_build_array('1개','2개','3개','4개','5개'),
      'answer','2',
      'explanation',E'옳은 문장: ⓑ(give 4형식), ⓓ(someone + who wants, 단수 수일치). 틀림: ⓐ friend 단수 → listens / ⓒ bought her a present / ⓔ showed us the pictures. 2개.'),

    -- ═══════════════════════════════════════════
    -- 24 Mina 종합 지문
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',24,
      'question',E'다음 글을 읽고, 물음에 답하시오.\n\nMina read about three ways to be a good friend. First, she congratulated her friend Jisu when Jisu won a prize at the art competition. Second, she gave honest advice to her friend who was always late. Third, she cheered up a sad friend by buying snacks and watching a funny movie together. Mina believes that small actions can make a big difference.\n\n───────────\n\n윗글의 내용과 일치하지 않는 것은? (4점)',
      'options',jsonb_build_array(
        'Mina gave dishonest advice to her friend.',
        'Mina congratulated Jisu on winning a prize.',
        'Mina cheered up a friend by watching a movie.',
        'Mina bought snacks for her sad friend.',
        'Mina thinks small actions can make a big difference.'),
      'answer','1',
      'explanation',E'본문에 "she gave honest advice"라고 했으므로 ① dishonest(불정직한)는 내용과 반대. 일치하지 않는 것은 ①.'),

    -- ═══════════════════════════════════════════
    -- 25 어휘 영영풀이
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',25,
      'question',E'다음 영영풀이에 해당하는 어휘로 가장 적절한 것은? (4점)\n\n"feeling upset because somebody has something that you want"',
      'options',jsonb_build_array('honest','jealous','thoughtful','upset','lucky'),
      'answer','2',
      'explanation',E'"누군가가 내가 원하는 것을 가지고 있어서 기분이 상한" = jealous(질투하는).'),

    -- ═══════════════════════════════════════════
    -- 26 Kangmin 관점 전환 지문
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',26,
      'question',E'다음 글을 읽고, 물음에 답하시오.\n\nMy favorite kind of friend is Kangmin. He is someone who gives honest advice. Last year, I had a bad habit. I was always late. People had to wait for me, and it made everyone upset. One day, Kangmin decided to talk to me. He said, "Can you please be on time? We want to fully enjoy our time together." Talking about this was not easy for him. But thankfully, I understood. Now I am always on time. I am happy to have a friend like Kangmin.\n\n───────────\n\n윗글을 읽고 답할 수 없는 것은? (4점)',
      'options',jsonb_build_array(
        'What kind of friend is Kangmin?',
        'What bad habit did the writer have?',
        'What did Kangmin say to the writer?',
        'Did the writer change after talking with Kangmin?',
        'How long has the writer known Kangmin?'),
      'answer','5',
      'explanation',E'필자가 Kangmin을 얼마나 오래 알아 왔는지는 본문에 전혀 나오지 않는다. ①~④는 모두 확인 가능.')
  );

  a := jsonb_build_array(
    '3','2','1','4','5','1','2','3','5','2',
    '4','3','3','2','5','4','1','3','5','1',
    '3','3','2','1','2','5'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES (
    '중2 능률김 1과 예상문제 3차(변형)',
    '예상문제',
    q,
    a,
    'mock_exam',
    'interactive'
  );

  RAISE NOTICE '중2 능률김 1과 예상문제 3차(변형) 템플릿 생성 완료 (26문제, 100점)';
END;
$$;
