DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = '5형식 make Step2';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- Part 1: 빈칸 채우기 (Q1~Q10)
    -- ═══════════════════════════════════════════

    -- Q1 (빈칸: 들어갈 수 없는 것)
    jsonb_build_object('number',1,
      'question',E'다음 빈칸에 들어갈 수 없는 것을 고르시오.\n\nThe news made her ___.',
      'options',jsonb_build_array('surprised','proud','upset','relieved','boring'),
      'answer','5'),

    -- Q2 (빈칸: 어법상 알맞은 말)
    jsonb_build_object('number',2,
      'question',E'다음 빈칸에 어법상 알맞은 말을 고르시오.\n\nThe loud noise made the baby ___.',
      'options',jsonb_build_array('cry','to cry','cried','crying','to crying'),
      'answer','1'),

    -- Q3 (빈칸: 알맞지 않은 것)
    jsonb_build_object('number',3,
      'question',E'다음 빈칸에 알맞지 않은 것을 고르시오.\n\nThe long journey made us ___.',
      'options',jsonb_build_array('exhausted','hungry','sleepy','thirsty','to walking'),
      'answer','5'),

    -- Q4 (빈칸: 모두 고르기)
    jsonb_build_object('number',4,
      'question',E'다음 빈칸에 들어갈 수 있는 것을 모두 고르시오.\n\nRegular exercise will ___ you strong.',
      'options',jsonb_build_array('let','tell','give','keep','make'),
      'answer','4, 5'),

    -- Q5 (빈칸: 들어갈 수 없는 것)
    jsonb_build_object('number',5,
      'question',E'다음 빈칸에 들어갈 수 없는 것을 고르시오.\n\nThe coach made the players ___.',
      'options',jsonb_build_array('confident','nervous','loudly','champions','motivated'),
      'answer','3'),

    -- Q6 (빈칸: 순서대로 짝짓기)
    jsonb_build_object('number',6,
      'question',E'다음 각 빈칸에 들어갈 말로 순서대로 짝지어진 것을 고르시오.\n\nRain makes me ___. / The award made the actor ___.',
      'options',jsonb_build_array('gloomy - proud','gloomily - proud','gloomy - pride','boring - sadly','gloomily - proudly'),
      'answer','1'),

    -- Q7 (빈칸: 공통으로 들어갈 말)
    jsonb_build_object('number',7,
      'question',E'다음 두 문장의 빈칸에 공통으로 들어갈 말을 고르시오.\n\nHe ___ his girlfriend a beautiful necklace. / The hot weather ___ everyone uncomfortable.',
      'options',jsonb_build_array('kept','gave','made','helped','wanted'),
      'answer','3'),

    -- Q8 (빈칸: 알맞은 것 - 비교급)
    jsonb_build_object('number',8,
      'question',E'다음 빈칸에 알맞은 것을 고르시오.\n\nThe new haircut made Brian ___.',
      'options',jsonb_build_array('handsomer','greatly','perfectly','wonderfully','importantly'),
      'answer','1'),

    -- Q9 (빈칸: 알맞은 것 - 과거분사)
    jsonb_build_object('number',9,
      'question',E'다음 빈칸에 알맞은 것을 고르시오.\n\nPlease keep me ___ about any changes in the schedule.',
      'options',jsonb_build_array('inform','informed','informing','to inform','to be informed'),
      'answer','2'),

    -- Q10 (빈칸: 알맞은 것 - 형용사만 OC)
    jsonb_build_object('number',10,
      'question',E'다음 빈칸에 알맞은 것을 고르시오.\n\nSwimming every weekend makes her ___.',
      'options',jsonb_build_array('energy','cheerfulness','brightly','energetic','gently'),
      'answer','4'),

    -- ═══════════════════════════════════════════
    -- Part 2: 의미/대체/대화 (Q11~Q14)
    -- ═══════════════════════════════════════════

    -- Q11 (문장 의미 파악)
    jsonb_build_object('number',11,
      'question',E'다음 문장의 의미로 가장 알맞은 것은?\n\nYou make me proud.',
      'options',jsonb_build_array(
        'I want to feel proud with you.',
        'I feel proud because of you.',
        'I can be proud without you.',
        'We are both proud of each other.',
        'You want me to be proud.'),
      'answer','2'),

    -- Q12 (밑줄 대신 바꿔쓸 수 없는 것)
    jsonb_build_object('number',12,
      'question',E'다음 대화의 밑줄 친 부분을 대신할 수 없는 것은?\n\nA: How did you feel after reading the letter?\nB: After reading it, I felt <u>down</u>.',
      'options',jsonb_build_array('unhappy','upset','sorrowful','miserable','cheerful'),
      'answer','5'),

    -- Q13 (대화 공통 빈칸 — 어색한 것)
    jsonb_build_object('number',13,
      'question',E'다음 대화의 공통 빈칸 ⓐ, ⓑ에 들어갈 말로 어색한 것은?\n\nA: I always struggle with speaking English in class. I feel ⓐ___.\nB: I understand. It makes me ⓑ___, too.',
      'options',jsonb_build_array('stressed','relaxed','uncomfortable','tense','insecure'),
      'answer','2'),

    -- Q14 (대화 빈칸 - p.p.)
    jsonb_build_object('number',14,
      'question',E'다음 대화의 빈칸에 들어갈 말로 알맞은 것은?\n\nA: Why do you want to become a famous author?\nB: I want to make my stories ___ to everyone.',
      'options',jsonb_build_array('hear','heard','known','knowing','to know'),
      'answer','3'),

    -- ═══════════════════════════════════════════
    -- Part 3: 영작 선택 (Q15~Q17)
    -- ═══════════════════════════════════════════

    -- Q15 (우리말 영작 - 3인칭 단수 + 형용사)
    jsonb_build_object('number',15,
      'question',E'다음 우리말을 영어로 바르게 옮긴 것은?\n\n"운동은 우리를 건강하게 만든다."',
      'options',jsonb_build_array(
        'Exercise make us healthy.',
        'Exercise make us healthily.',
        'Exercise makes us healthy.',
        'Exercise makes us healthily.',
        'Exercise makes us health.'),
      'answer','3'),

    -- Q16 (우리말 영작 - bored vs boring)
    jsonb_build_object('number',16,
      'question',E'다음 우리말을 영어로 바르게 옮긴 것은?\n\n"그 영화는 나를 지루하게 만들었다."',
      'options',jsonb_build_array(
        'The movie make bored.',
        'It made boring movie me.',
        'It made me movie boring.',
        'The movie made me bored.',
        'The movie make me boring.'),
      'answer','4'),

    -- Q17 (우리말 영작 - 동명사 주어 + 비교급)
    jsonb_build_object('number',17,
      'question',E'다음 우리말을 영어로 바르게 옮긴 것은?\n\n"매운 음식을 먹는 것은 너를 더 목마르게 만든다."',
      'options',jsonb_build_array(
        'Eat spicy food make you thirsty.',
        'Spicy food eat makes you thirsty.',
        'Spicy food makes you thirstier.',
        'Eating spicy food makes you thirstier.',
        'Food eat spicy makes you thirstier.'),
      'answer','4'),

    -- ═══════════════════════════════════════════
    -- Part 4: make 쓰임 구별 (Q18~Q25)
    -- ═══════════════════════════════════════════

    -- Q18 (밑줄 쓰임 다른 하나 - 사역 vs 일반)
    jsonb_build_object('number',18,
      'question',E'다음 중 밑줄 친 make(made)의 쓰임이 나머지와 다른 하나는?',
      'options',jsonb_build_array(
        'The story <u>made</u> her laugh.',
        'I <u>made</u> him apologize to her.',
        'She <u>made</u> them finish the homework.',
        'He <u>made</u> me wait for an hour.',
        'My sister <u>made</u> a birthday card for me.'),
      'answer','5'),

    -- Q19 (밑줄 쓰임 다른 하나 - 수여 vs 5형식)
    jsonb_build_object('number',19,
      'question',E'다음 중 밑줄 친 make(made/makes)의 쓰임이 나머지와 다른 하나는?',
      'options',jsonb_build_array(
        'My dad <u>made</u> me pancakes.',
        'She always <u>makes</u> me nervous.',
        'Horror movies always <u>make</u> me scream.',
        'His new hairstyle <u>makes</u> him look cooler.',
        'Drinking too much coffee can <u>make</u> you restless.'),
      'answer','1'),

    -- Q20 (밑줄 쓰임 다른 하나 - 수여 vs 5형식)
    jsonb_build_object('number',20,
      'question',E'다음 중 밑줄 친 make(made)의 쓰임이 나머지와 다른 하나는?',
      'options',jsonb_build_array(
        'My teacher <u>made</u> me redo the assignment.',
        'The drama <u>made</u> her a famous actress.',
        E'I''m sorry to <u>make</u> you disappointed.',
        'Grandma <u>made</u> me a pair of woolen gloves.',
        'These shoes <u>make</u> you look taller.'),
      'answer','4'),

    -- Q21 (보기와 같은 쓰임 - 5형식)
    jsonb_build_object('number',21,
      'question',E'다음 <보기>의 밑줄 친 부분과 쓰임이 같은 것은?\n\n<보기> The loud noise <u>made</u> me annoyed.',
      'options',jsonb_build_array(
        'She <u>made</u> us all tea.',
        'I <u>make</u> my own lunch.',
        'English exams <u>made</u> me stressed.',
        E'I''ll <u>make</u> you some pasta.',
        'He kept <u>making</u> the same error.'),
      'answer','3'),

    -- Q22 (보기와 같은 쓰임 - 5형식)
    jsonb_build_object('number',22,
      'question',E'다음 <보기>의 밑줄 친 부분과 쓰임이 같은 것은?\n\n<보기> Reading books will <u>make</u> you smarter!',
      'options',jsonb_build_array(
        'She will <u>make</u> a wonderful pie.',
        'The coach <u>made</u> my performance better.',
        'He <u>made</u> a toy robot for his daughter.',
        E'I''ll <u>make</u> you a warm scarf.',
        'Can you <u>make</u> me some lemonade?'),
      'answer','2'),

    -- Q23 (보기와 같은 쓰임 - 5형식)
    jsonb_build_object('number',23,
      'question',E'다음 <보기>의 밑줄 친 부분과 쓰임이 같은 것은?\n\n<보기> Staying up late can <u>make</u> you tired.',
      'options',jsonb_build_array(
        E'That''s what she <u>made</u>.',
        'You <u>make</u> me proud.',
        'I believe you can <u>make</u> it.',
        'Why did you <u>make</u> the soup?',
        'Dad is <u>making</u> breakfast in the kitchen.'),
      'answer','2'),

    -- Q24 (문장구조 다른 것)
    jsonb_build_object('number',24,
      'question',E'다음 중 문장의 구조가 나머지와 다른 하나는?',
      'options',jsonb_build_array(
        'This song makes me calm.',
        'She made her daughter a pianist.',
        'My aunt made me the sweater.',
        'He makes me practice every day.',
        'Rainy days make people sleepy.'),
      'answer','3'),

    -- Q25 (대화 속 make 쓰임 다른 것)
    jsonb_build_object('number',25,
      'question',E'다음 대화 중 밑줄 친 make(makes)의 쓰임이 나머지와 다른 하나는?',
      'options',jsonb_build_array(
        E'A: What''s the matter?\nB: The presentation <u>makes</u> me a bit anxious.',
        E'A: You always <u>make</u> me concerned.\nB: I''m sorry, I won''t do it again.',
        E'A: The weather keeps changing. I feel gloomy.\nB: It <u>makes</u> me gloomy, too.',
        E'A: Hey! How was your day?\nB: I had so many tasks. That <u>makes</u> me exhausted.',
        E'A: Tomorrow is Jisu''s birthday.\nB: Right, I''ll <u>make</u> her a card.'),
      'answer','5'),

    -- ═══════════════════════════════════════════
    -- Part 5: 어법 판단 (Q26~Q35)
    -- ═══════════════════════════════════════════

    -- Q26 (밑줄 쓰임 올바른 것)
    jsonb_build_object('number',26,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 올바른 것은?',
      'options',jsonb_build_array(
        'The rain made her <u>sadly</u>.',
        'The concert made the audience <u>thrilled</u>.',
        'His words always make me <u>angrily</u>.',
        'The noise made the baby <u>crying</u>.',
        'The lecture made the students <u>boring</u>.'),
      'answer','2'),

    -- Q27 (어법상 올바른 문장)
    jsonb_build_object('number',27,
      'question',E'다음 중 어법상 올바른 문장은?',
      'options',jsonb_build_array(
        'He always makes me <u>nervously</u>.',
        'The uniform made <u>she</u> uncomfortable.',
        'The story made him <u>boring</u>.',
        'The teacher made <u>they</u> proud.',
        'Homework always makes the children <u>tired</u>.'),
      'answer','5'),

    -- Q28 (밑줄 올바른 것 - 어순/형용사/부사 종합)
    jsonb_build_object('number',28,
      'question',E'다음 중 밑줄 친 부분이 올바른 것은?',
      'options',jsonb_build_array(
        'Please <u>keep tidy the office</u>.',
        'Watching dramas <u>make he drowsy</u>.',
        'The hen is <u>keeping the chicks safe</u>.',
        'My sister <u>made upset my father</u>.',
        'My cat always <u>makes me cheerfully</u>.'),
      'answer','3'),

    -- Q29 (밑줄 어색한 것)
    jsonb_build_object('number',29,
      'question',E'다음 중 밑줄 친 부분이 어색한 것은?',
      'options',jsonb_build_array(
        'The guard kept the building <u>securely</u> from intruders.',
        'I always keep my desk <u>neat</u>.',
        'This blanket will keep the baby <u>warm</u>.',
        'Your kindness makes me <u>grateful</u>.',
        'The long speech made everyone <u>drowsy</u>.'),
      'answer','1'),

    -- Q30 (어법상 옳은 것 - OC=명사)
    jsonb_build_object('number',30,
      'question',E'다음 중 어법상 옳은 것은?',
      'options',jsonb_build_array(
        'This hat makes him <u>looks</u> funny.',
        'The coach made her a great athlete.',
        'The weather made everyone very <u>gloomily</u>.',
        'My dad made me <u>cleaned</u> the garage.',
        'Too much stress can make you <u>are</u> anxious.'),
      'answer','2'),

    -- Q31 (어법상 어색한 것)
    jsonb_build_object('number',31,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'The police keep our neighborhood <u>safe</u>.',
        'Practicing math makes me <u>exhausted</u>.',
        'We found the exhibition <u>fascinating</u>.',
        'The children made their babysitter <u>frustrated</u>.',
        'The refrigerator keeps the vegetables <u>freshly</u>.'),
      'answer','5'),

    -- Q32 (어색한 문장 모두 고르기)
    jsonb_build_object('number',32,
      'question',E'다음 중 어법상 어색한 문장을 모두 고르면?',
      'options',jsonb_build_array(
        'Exercise makes you stronger.',
        'The drama makes them <u>tearfully</u>.',
        'True love makes people brave.',
        'Do you really want to make <u>he</u> jealous?',
        'You always make her cheerful.'),
      'answer','2, 4'),

    -- Q33 (어색한 문장)
    jsonb_build_object('number',33,
      'question',E'다음 중 어법상 어색한 문장은?',
      'options',jsonb_build_array(
        'My parrot makes me <u>joyfully</u>.',
        'It will make you nervous.',
        'The cooler can keep the drinks cold.',
        'The duck is keeping the ducklings warm.',
        'The colors in this painting make the scene vivid.'),
      'answer','1'),

    -- Q34 (어색한 문장)
    jsonb_build_object('number',34,
      'question',E'다음 중 어법상 어색한 문장은?',
      'options',jsonb_build_array(
        'Everything she said made him furious.',
        'The waiter kept the soup <u>warmly</u>.',
        'The riddle made Brian puzzled.',
        'The mechanic kept the motor running.',
        'This dressing makes the salad tangy and fresh.'),
      'answer','2'),

    -- Q35 (보기 어법상 옳은 것 모두 고르기)
    jsonb_build_object('number',35,
      'question',E'다음 (A)~(E) 중 어법상 옳은 것을 모두 고른 것은?\n\n(A) I helped dad fix the fence.\n(B) The play made me boring.\n(C) My father won''t let me stay up late.\n(D) Our captain made us practicing all day.\n(E) The unclear instructions made us frustrating.',
      'options',jsonb_build_array('(A), (B)','(A), (C)','(B), (C)','(A), (D), (E)','(B), (C), (E)'),
      'answer','2')
  );

  a := jsonb_build_array(
    '5','1','5','4, 5','3','1','3','1','2','4',
    '2','5','2','3',
    '3','4','4',
    '5','1','4','3','2','2','3','5',
    '2','5','3','1','2','5','2, 4','1','2','2'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('5형식 make Step2', '5형식 make', q, a, 'problem', 'interactive');

  RAISE NOTICE '5형식 make Step2 템플릿 생성 완료 (35문제)';
END;
$$;
