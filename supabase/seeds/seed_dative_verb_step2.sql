DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = '수여동사 Step2';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- Part 1: 빈칸 - 동사 고르기 (Q1~Q10)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1,
      'question',E'다음 빈칸에 들어갈 말로 어색한 것은?\n\nJames ___ a lovely painting to his neighbor.',
      'options',jsonb_build_array('gave','sent','showed','kept','lent'),
      'answer','4'),

    jsonb_build_object('number',2,
      'question',E'다음 빈칸에 들어갈 말로 알맞은 것은?\n\nGrandpa ___ a warm sweater for my little sister.',
      'options',jsonb_build_array('told','gave','showed','bought','sent'),
      'answer','4'),

    jsonb_build_object('number',3,
      'question',E'다음 빈칸에 들어갈 말로 어법상 어색한 것을 모두 고르면?\n\nShe ___ a package to her neighbor.',
      'options',jsonb_build_array('gave','sent','cooked','handed','found'),
      'answer','3, 5'),

    jsonb_build_object('number',4,
      'question',E'다음 빈칸에 들어갈 말로 알맞은 것은?\n\nJenny ___ a delicious lunch for her coworkers.',
      'options',jsonb_build_array('told','taught','cooked','lent','wrote'),
      'answer','3'),

    jsonb_build_object('number',5,
      'question',E'다음 문장의 빈칸에 들어갈 말로 어색한 것은?\n\nBrian ___ the package to Anna last week.',
      'options',jsonb_build_array('sent','gave','bought','handed','showed'),
      'answer','3'),

    jsonb_build_object('number',6,
      'question',E'다음 중 빈칸에 들어갈 말로 어색한 것은?\n\nMom should send ___ this invitation tomorrow.',
      'options',jsonb_build_array('you','him','them','Jenny''s','me'),
      'answer','4'),

    jsonb_build_object('number',7,
      'question',E'다음 빈칸에 들어갈 단어로 알맞은 것은?\n\nMy sister ___ a nice scarf for me.',
      'options',jsonb_build_array('showed','gave','told','found','sent'),
      'answer','4'),

    jsonb_build_object('number',8,
      'question',E'다음 중 빈칸에 들어갈 말로 어색한 것은?\n\nRyan ___ me a wonderful gift.',
      'options',jsonb_build_array('bought','made','donated','gave','got'),
      'answer','3'),

    jsonb_build_object('number',9,
      'question',E'다음 중 빈칸에 들어갈 말로 알맞지 않은 것은?\n\nShe ___ us some snacks yesterday.',
      'options',jsonb_build_array('brought','made','gave','bought','had'),
      'answer','5'),

    jsonb_build_object('number',10,
      'question',E'다음 중 빈칸에 들어갈 말로 어색한 것은?\n\nMs. Park ___ us some advice.',
      'options',jsonb_build_array('gave','offered','told','wanted','sent'),
      'answer','4'),

    -- ═══════════════════════════════════════════
    -- Part 2: 빈칸 - 전치사 (Q11~Q14)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',11,
      'question',E'다음 빈칸에 공통으로 들어갈 말로 알맞은 것은?\n\n• She cooked a special dinner ___ us.\n• He found a nice apartment ___ his family.',
      'options',jsonb_build_array('to','on','for','at','of'),
      'answer','3'),

    jsonb_build_object('number',12,
      'question',E'다음 괄호 안의 우리말과 같도록 빈칸 ★에 들어갈 알맞은 말은?\n\nCan you buy ___ ___ ★ me?\n(그 선물을 나에게 사 줄 수 있니?)',
      'options',jsonb_build_array('me','the','to','gift','for'),
      'answer','5'),

    jsonb_build_object('number',13,
      'question',E'다음 빈칸 (A)~(C)에 들어갈 전치사가 바르게 짝지어진 것은?\n\n(A) She often tells interesting stories ___ us.\n(B) My brother found a good seat ___ me.\n(C) The teacher asked a difficult question ___ him.\n\n     (A)   (B)   (C)',
      'options',jsonb_build_array(
        'to — for — of',
        'to — of — for',
        'for — to — of',
        'for — of — to',
        'of — for — to'),
      'answer','1'),

    jsonb_build_object('number',14,
      'question',E'다음 빈칸 ⓐ~ⓒ에 들어갈 말이 바르게 짝지어진 것은?\n\n• Tom cooked a nice dinner ⓐ___ his family.\n• Amy asked a favor ⓑ___ her friend.\n• The boy sent a letter ⓒ___ his teacher.\n\n     ⓐ    ⓑ    ⓒ',
      'options',jsonb_build_array(
        'to — for — of',
        'to — of — for',
        'for — of — to',
        'for — to — of',
        'of — to — for'),
      'answer','3'),

    -- ═══════════════════════════════════════════
    -- Part 3: 나머지와 다른 전치사 (Q15~Q18)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',15,
      'question',E'다음 빈칸에 들어갈 단어가 나머지와 다른 것을 모두 고르면? (정답 2개)',
      'options',jsonb_build_array(
        'She cooked dinner ___ her family.',
        'He built a doghouse ___ his pet.',
        'I gave my homework ___ the teacher.',
        'Can you get some water ___ me?',
        'Will you lend your notes ___ us?'),
      'answer','3, 5'),

    jsonb_build_object('number',16,
      'question',E'다음 중 빈칸에 들어갈 단어가 나머지와 다른 하나는?',
      'options',jsonb_build_array(
        'Jake sent a message ___ his teacher.',
        'She gave the report ___ her boss.',
        'He told the news ___ everyone.',
        'My aunt cooked a big meal ___ us.',
        'I showed my drawings ___ him.'),
      'answer','4'),

    jsonb_build_object('number',17,
      'question',E'다음 중 빈칸에 들어갈 말이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'She wrote a poem ___ me.',
        'He taught science ___ me.',
        'My dad found a nice bag ___ me.',
        'Tom handed the paper ___ me.',
        'The girl passed the salt ___ me.'),
      'answer','3'),

    jsonb_build_object('number',18,
      'question',E'다음 중 빈칸에 들어갈 단어가 다른 하나는?',
      'options',jsonb_build_array(
        'Mom made a birthday cake ___ me.',
        'She got some medicine ___ him.',
        'He lent his umbrella ___ me.',
        'Can you save a seat ___ me?',
        'Dad bought a new laptop ___ my brother.'),
      'answer','3'),

    -- ═══════════════════════════════════════════
    -- Part 4: 문장 형식 구별 (Q19~Q22)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',19,
      'question',E'다음 주어진 문장과 형식이 같은 것은?\n\nTom sent me a letter.',
      'options',jsonb_build_array(
        'He asked a question of me.',
        'She showed me her new dress.',
        'You lent your pen to me.',
        'He built a house for his family.',
        'His father cooked dinner for his friends.'),
      'answer','2'),

    jsonb_build_object('number',20,
      'question',E'다음 주어진 문장과 형식이 같은 것은?\n\nShe made me a sandwich.',
      'options',jsonb_build_array(
        'He is a good teacher.',
        'I found the movie boring.',
        'I''ll tell you a secret.',
        'The cat chased the mouse.',
        'There is a library near my school.'),
      'answer','3'),

    jsonb_build_object('number',21,
      'question',E'다음 중 문장의 형식이 나머지와 다른 하나는?',
      'options',jsonb_build_array(
        'We call him a genius.',
        'My mother bought me a cake.',
        'The boy sent me a gift.',
        'Bring me some water.',
        'She showed me her photos.'),
      'answer','1'),

    jsonb_build_object('number',22,
      'question',E'다음 <보기>에서 4형식 문장을 모두 고른 것은?\n\n<보기>\nⓐ Dad told me a funny story.\nⓑ Sarah''s mom gave a present to her.\nⓒ Amy''s dad bought a dress for her.\nⓓ Jake''s sister made him a scarf.',
      'options',jsonb_build_array('ⓐ, ⓑ','ⓐ, ⓓ','ⓐ, ⓑ, ⓓ','ⓑ, ⓒ, ⓓ','ⓐ, ⓑ, ⓒ, ⓓ'),
      'answer','2'),

    -- ═══════════════════════════════════════════
    -- Part 5: 어법 판별 (Q23~Q40)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',23,
      'question',E'다음 중 어법상 올바른 문장은?',
      'options',jsonb_build_array(
        'She passed the salt to me.',
        'My aunt cooked some food to us.',
        'My sister wrote a message for me.',
        'The teacher asked a difficult question for us.',
        'He bought a nice jacket to his friend.'),
      'answer','1'),

    jsonb_build_object('number',24,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'My father cooked me some pasta.',
        'You should not forget to help him.',
        'Jenny built for David a bookshelf.',
        'Amy sent a package to me.',
        'I''d like some hot chocolate.'),
      'answer','3'),

    jsonb_build_object('number',25,
      'question',E'다음 중 어법상 올바른 문장은?',
      'options',jsonb_build_array(
        'Tom gave a nice present me.',
        'Ms. Lee taught history us.',
        'She sent a birthday card for me.',
        'My uncle made some juice us.',
        'He cooked a special breakfast for his family.'),
      'answer','5'),

    jsonb_build_object('number',26,
      'question',E'다음 중 어법상 올바른 문장은?',
      'options',jsonb_build_array(
        'She didn''t bring the food us.',
        'I wrote the letter my teacher.',
        'Can you pass me the menu?',
        'He sold his car me last month.',
        'My mom told a bedtime story for me.'),
      'answer','3'),

    jsonb_build_object('number',27,
      'question',E'다음 중 어법상 올바른 문장은?',
      'options',jsonb_build_array(
        'He handed the report to his boss.',
        'Amy didn''t sent me a text message.',
        'Can I ask a favor for you?',
        'Mom cooked breakfast to us.',
        'I will buy their a new toy.'),
      'answer','1'),

    jsonb_build_object('number',28,
      'question',E'다음 중 어법상 어색한 문장은?',
      'options',jsonb_build_array(
        'I''ll find a good restaurant for you.',
        'I''ll send the document to you.',
        'He asked a strange question of me.',
        'She passed the menu to me.',
        'My friend gave his ticket me.'),
      'answer','5'),

    jsonb_build_object('number',29,
      'question',E'다음 중 어법상 올바른 문장은?',
      'options',jsonb_build_array(
        'She bought a scarf to her mother.',
        'A student asked a question to me.',
        'He passed his notebook me.',
        'The girl gave a flower for the boy.',
        'My mom prepared a delicious dinner for the guests.'),
      'answer','5'),

    jsonb_build_object('number',30,
      'question',E'다음 중 어법상 올바른 문장은?',
      'options',jsonb_build_array(
        'He taught math for us.',
        'She asked a favor to me.',
        'He will write a letter for you.',
        'Amy cooked some soup me.',
        'Sarah lent me her umbrella.'),
      'answer','5'),

    jsonb_build_object('number',31,
      'question',E'다음 중 어법상 올바른 문장은?',
      'options',jsonb_build_array(
        'I told to him the secret.',
        'She gave to me a present.',
        'Mr. Park teaches science us.',
        'He found me a comfortable seat.',
        'The man asked to me a favor.'),
      'answer','4'),

    jsonb_build_object('number',32,
      'question',E'다음 중 어법상 올바른 문장은?',
      'options',jsonb_build_array(
        'He teaches Korean us.',
        'She showed our her painting.',
        'She didn''t lend me her book.',
        'Tom bought a birthday gift to me.',
        'The boy asked the teacher''s name for me.'),
      'answer','3'),

    jsonb_build_object('number',33,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'She teaches us science.',
        'He will bring me a glass of water.',
        'I''ll cook some pasta you.',
        'Please lend me your eraser.',
        'You can send poor children some books.'),
      'answer','3'),

    jsonb_build_object('number',34,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'Dad will make us some pancakes.',
        'My sister told a funny joke for me.',
        'The girl sent a thank-you card to me.',
        'Jake asks his mom many questions.',
        'I built a model airplane for my brother.'),
      'answer','2'),

    jsonb_build_object('number',35,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'My mom bought me a warm coat.',
        'He found me the missing key.',
        'I''ll ask my professor of the homework.',
        'Dad will make us a big dinner.',
        'She forgot to buy the ticket for me.'),
      'answer','3'),

    jsonb_build_object('number',36,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'Steve taught math students at the academy.',
        'I sent two postcards to my aunt.',
        'My sister found a great recipe for her friend.',
        'Can you show me your passport?',
        'Can you cook some noodles for me?'),
      'answer','1'),

    jsonb_build_object('number',37,
      'question',E'다음 중 어법상 올바른 문장은?',
      'options',jsonb_build_array(
        'He cooked breakfast to us.',
        'Did you get her a present for?',
        'Will you pass your notebook me?',
        'My mother prepared a nice dinner to me.',
        'The children asked a question of the teacher.'),
      'answer','5'),

    jsonb_build_object('number',38,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'She teaches us Korean.',
        'He will lend me some money.',
        'I''ll get some drinks for you.',
        'Please hand me your report.',
        'My dad told a scary story for me.'),
      'answer','5'),

    jsonb_build_object('number',39,
      'question',E'다음 중 어법상 올바른 것끼리 짝지어진 것은?\n\nⓐ My sister will make me a birthday cake.\nⓑ He sends his dad a gift every Christmas.\nⓒ Please pass the water to me.\nⓓ Jessica teaches Korean the students this year.\nⓔ Mom cooks delicious pasta to us.',
      'options',jsonb_build_array('ⓐ, ⓑ, ⓓ','ⓒ, ⓓ','ⓐ, ⓔ','ⓐ, ⓑ, ⓒ','ⓒ, ⓔ'),
      'answer','4'),

    jsonb_build_object('number',40,
      'question',E'다음 중 어법상 올바른 문장의 개수는?\n\n• Can you lend it to me?\n• Did you bring the food her?\n• I want to cook for you a meal.\n• Can you hand to me the book, please?\n• I''ll give to you some advice if you need.\n• I sent to my friend a postcard last week.',
      'options',jsonb_build_array('1개','2개','3개','4개','5개'),
      'answer','1'),

    -- ═══════════════════════════════════════════
    -- Part 6: 영작 / 배열 (Q41~Q46)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',41,
      'question',E'다음 주어진 단어로 완전한 문장으로 만들 때 세 번째 빈칸에 오는 단어는?\n\n(two, for, me, buy, Paris, tickets)\n→ Buy ( 1 )( 2 )( 3 )( 4 )( 5 ).',
      'options',jsonb_build_array('Paris','for','me','two','tickets'),
      'answer','5'),

    jsonb_build_object('number',42,
      'question',E'다음 우리말을 영어로 바르게 옮긴 것은?\n\n나는 나의 여동생에게 예쁜 목걸이를 사주었다.',
      'options',jsonb_build_array(
        'I bought a pretty necklace my sister.',
        'I bought my sister a pretty necklace.',
        'I bought a pretty necklace of my sister.',
        'My sister bought me a pretty necklace.',
        'My sister bought a pretty necklace to me.'),
      'answer','2'),

    jsonb_build_object('number',43,
      'question',E'다음 우리말을 영어로 바르게 옮긴 것은?\n\n그녀는 나에게 감사 편지를 써주었다.',
      'options',jsonb_build_array(
        'She wrote a thank-you letter to me.',
        'She gave to me a thank-you letter.',
        'She wrote me to a thank-you letter.',
        'She wrote to me a thank-you letter.',
        'She wrote to a thank-you letter me.'),
      'answer','1'),

    jsonb_build_object('number',44,
      'question',E'다음 우리말을 바르게 영작한 것은?\n\n아빠가 나에게 운동화를 사주셨다.',
      'options',jsonb_build_array(
        'My dad bought me sneakers.',
        'My dad bought sneakers me.',
        'My dad bought sneakers of me.',
        'My dad brought me sneakers.',
        'My dad brought sneakers to me.'),
      'answer','1'),

    jsonb_build_object('number',45,
      'question',E'다음 대화의 밑줄 친 우리말을 영어로 바르게 옮긴 것은?\n\nA: Hey, did you hear? Tom is engaged!\nB: Yes! 그는 어제 그의 여자 친구에게 꽃다발을 보냈어.',
      'options',jsonb_build_array(
        'He sent a bouquet his girlfriend yesterday.',
        'He sent of his girlfriend a bouquet yesterday.',
        'He sent a bouquet to his girlfriend yesterday.',
        'He sent yesterday his girlfriend a bouquet.',
        'He sent a bouquet for his girlfriend yesterday.'),
      'answer','3'),

    jsonb_build_object('number',46,
      'question',E'다음 우리말을 영어로 옮길 때 빈칸에 들어갈 말로 알맞은 것은?\n\n그녀는 우리에게 수학을 가르친다.\n→ She ___.',
      'options',jsonb_build_array(
        'teaches math the students',
        'teaches to us math',
        'teaches us math',
        'teaches math for us',
        'teaches us to math'),
      'answer','3'),

    -- ═══════════════════════════════════════════
    -- Part 7: 문장 전환 3↔4형식 (Q47~Q60)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',47,
      'question',E'다음 <보기>와 같이 문장을 바꿀 때 올바른 것을 모두 고르면?\n\n<보기>\nMy aunt showed me her garden.\n→ My aunt showed her garden to me.',
      'options',jsonb_build_array(
        'She will cook you a special dinner.\n→ She will cook a special dinner to you.',
        'The boy asked them a question.\n→ The boy asked a question to them.',
        'I lent him my umbrella.\n→ I lent my umbrella to him.',
        'She taught me Korean.\n→ She taught Korean for me.',
        'Dad bought us ice cream.\n→ Dad bought ice cream for us.'),
      'answer','3, 5'),

    jsonb_build_object('number',48,
      'question',E'다음 중 문장을 바꿔 쓴 것이 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'Amy sent him a message.\n→ Amy sent a message to him.',
        'She told me the truth.\n→ She told the truth to me.',
        'I found her a nice seat.\n→ I found a nice seat for her.',
        'His dad made us delicious soup.\n→ His dad made delicious soup of us.',
        'The boy showed us his collection.\n→ The boy showed his collection to us.'),
      'answer','4'),

    jsonb_build_object('number',49,
      'question',E'다음 중 문장의 전환이 어법상 바른 것은?',
      'options',jsonb_build_array(
        'My aunt sent me a gift.\n→ My aunt sent a gift for me.',
        'Kate brought me a book.\n→ Kate brought a book for me.',
        'She showed me her painting.\n→ She showed her painting to me.',
        'Let me find you a nice place.\n→ Let me find a nice place to you.',
        'He should teach Amy this lesson today.\n→ He should teach this lesson for Amy today.'),
      'answer','3'),

    jsonb_build_object('number',50,
      'question',E'다음 중 4형식 문장을 3형식 문장으로 바르게 바꾼 것은?',
      'options',jsonb_build_array(
        'We will send you a birthday card.\n→ We will send a birthday card for you.',
        'She made her daughter a pretty hat.\n→ She made a pretty hat of her daughter.',
        'I cooked my family a big dinner.\n→ I cooked a big dinner for my family.',
        'He showed us his garden.\n→ He showed his garden of us.',
        'I wrote you a long letter.\n→ I wrote a long letter for you.'),
      'answer','3'),

    jsonb_build_object('number',51,
      'question',E'다음 중 주어진 문장을 어법상 바르게 바꿔 쓴 것은?',
      'options',jsonb_build_array(
        'She told her kids a bedtime story.\n→ She told a bedtime story to her kids.',
        'My uncle bought me a watch.\n→ My uncle bought a watch to me.',
        'He passed me the ball.\n→ He passed the ball for me.',
        'My grandma cooked me some stew.\n→ My grandma cooked some stew to me.',
        'I can also read them picture books.\n→ I can also read picture books for them.'),
      'answer','1'),

    jsonb_build_object('number',52,
      'question',E'다음 두 문장의 의미가 같도록 문장의 형식을 전환할 때 어색한 것은?',
      'options',jsonb_build_array(
        'She sends me a message.\n→ She sends a message to me.',
        'I wrote a story for her.\n→ I wrote her a story.',
        'We asked him a favor.\n→ We asked a favor of him.',
        'He cooked me some noodles.\n→ He cooked some noodles to me.',
        'Will you read an interesting book to me?\n→ Will you read me an interesting book?'),
      'answer','4'),

    jsonb_build_object('number',53,
      'question',E'다음 4형식 문장을 3형식 문장으로 바꾼 것 중 어색한 것은?',
      'options',jsonb_build_array(
        'Sarah asked me a favor.\n→ Sarah asked a favor of me.',
        'Linda gave Tom a pencil case.\n→ Linda gave a pencil case for Tom.',
        'Jake bought his sister a doll.\n→ Jake bought a doll for his sister.',
        'Mina sent her friend a postcard.\n→ Mina sent a postcard to her friend.',
        'Brian showed his classmates some photos.\n→ Brian showed some photos to his classmates.'),
      'answer','2'),

    jsonb_build_object('number',54,
      'question',E'다음 중 4형식 문장을 3형식 문장으로 바르게 바꾼 것은?',
      'options',jsonb_build_array(
        'We will teach you a new song.\n→ We will teach a new song for you.',
        'She found her daughter a nice dress.\n→ She found a nice dress to her daughter.',
        'The woman asked me my phone number.\n→ The woman asked my phone number for me.',
        'He handed me a note.\n→ He handed a note to me.',
        'Can you pass me the water?\n→ Can you pass the water of me?'),
      'answer','4'),

    jsonb_build_object('number',55,
      'question',E'다음 중 문장의 변환이 알맞은 것은?',
      'options',jsonb_build_array(
        'My teacher had a kind smile on her face.\n→ My teacher smiles kindly.',
        'I showed my new toy to everybody.\n→ I showed everybody my new toy.',
        'Because she was tired, her voice was weak.\n→ She was tired. Her voice sounded weakly.',
        'Minjun bought Sohee a bracelet.\n→ Minjun bought a bracelet to Sohee.',
        'Dad made me a warm scarf.\n→ Dad made a warm scarf to me.'),
      'answer','2'),

    jsonb_build_object('number',56,
      'question',E'다음 <보기>와 같이 주어진 문장을 알맞게 고친 것은?\n\n<보기>\nAmy wrote me a letter.\n→ Amy wrote a letter to me.',
      'options',jsonb_build_array(
        'Did you send the teacher a card?\n→ Did you send a card on the teacher?',
        'She bought me a warm scarf.\n→ She bought a warm scarf to me.',
        'Find Mary a good book.\n→ Find a good book for Mary.',
        'He told me the answer by phone.\n→ He told by phone the answer to me.',
        'My mom taught me how to cook pasta.\n→ My mom taught how to cook pasta of me.'),
      'answer','3'),

    jsonb_build_object('number',57,
      'question',E'다음 중 문장을 바꿔 쓴 것이 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'I got my sister some stickers.\n→ I got some stickers for my sister.',
        'Chris asked me his girlfriend''s number.\n→ Chris asked his girlfriend''s number of me.',
        'Amy made lunch for us all.\n→ Amy made us all lunch.',
        'I''ll teach you some Korean if you want.\n→ I''ll teach some Korean for you if you want.',
        'Can you find me a nice hotel when you go there?\n→ Can you find a nice hotel for me when you go there?'),
      'answer','4'),

    jsonb_build_object('number',58,
      'question',E'다음 중 주어진 문장을 어법상 바르게 바꿔 쓴 것은?',
      'options',jsonb_build_array(
        'Brian gave Sujin a flower.\n→ Brian gave a flower to Sujin.',
        'Yuna sent her friend a letter.\n→ Yuna sent a letter her friend.',
        'My boyfriend cooks me breakfast.\n→ My boyfriend cooks breakfast to me.',
        'Minseo bought his dad a tie.\n→ Minseo bought a tie to his dad.',
        'The girl is asking the boy a question.\n→ The girl is asking a question to the boy.'),
      'answer','1'),

    jsonb_build_object('number',59,
      'question',E'다음 중 문장의 전환이 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'Can you lend me some of your notes?\n= Can you lend some of your notes for me?',
        'Why didn''t you cook dinner for him?\n= Why didn''t you cook him dinner?',
        'She shows us her artwork.\n= She shows her artwork to us.',
        'Can I ask you a question?\n= Can I ask a question of you?',
        'I''ll get some snacks for you.\n= I''ll get you some snacks.'),
      'answer','1'),

    jsonb_build_object('number',60,
      'question',E'다음 문장을 바르게 바꾸어 쓴 것은?',
      'options',jsonb_build_array(
        'Ben gave the girl a chocolate.\n→ Ben gave a chocolate the girl.',
        'I sent my cousin a gift.\n→ I sent a gift for my cousin.',
        'Tom passed some water to the boy.\n→ Tom passed to the boy some water.',
        'Julia made her mom cookies.\n→ Julia made cookies for her mom.',
        'Grandpa showed me his old album.\n→ Grandpa showed his old album for me.'),
      'answer','4')
  );

  a := jsonb_build_array(
    '4','4','3, 5','3','3','4','4','3','5','4',
    '3','5','1','3',
    '3, 5','4','3','3',
    '2','3','1','2',
    '1','3','5','3','1','5','5','5','4','3','3','2','3','1','5','5','4','1',
    '5','2','1','1','3','3',
    '3, 5','4','3','3','1','4','2','4','2','3','4','1','1','4'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('수여동사 Step2', '수여동사', q, a, 'problem', 'interactive');

  RAISE NOTICE '수여동사 Step2 템플릿 생성 완료 (60문제, paraphrased)';
END;
$$;
