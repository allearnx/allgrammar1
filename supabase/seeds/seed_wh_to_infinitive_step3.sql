-- 의문사+to부정사 Step3 서술형 40문제 (패러프레이즈, 중상 난이도)
DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = '의문사+to부정사 Step3';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- Part 1: 우리말→빈칸 영작 (Q1~Q8)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1,
      'question',E'다음 우리말과 일치하도록 빈칸에 알맞은 말을 쓰시오.\n\n우리는 이 식당에서 무엇을 주문해야 할지 몰랐다.\n→ We didn''t know ___ ___ ___ at this restaurant.',
      'answer','what to order',
      'acceptedAnswers',jsonb_build_array('what to order')),

    jsonb_build_object('number',2,
      'question',E'다음 우리말과 일치하도록 빈칸에 알맞은 말을 쓰시오.\n\n그녀는 나에게 초콜릿 케이크를 굽는 방법을 알려주었다.\n→ She told me ___ ___ ___ a chocolate cake.',
      'answer','how to bake',
      'acceptedAnswers',jsonb_build_array('how to bake','how to make')),

    jsonb_build_object('number',3,
      'question',E'다음 우리말과 일치하도록 빈칸에 알맞은 말을 쓰시오.\n\n학생들은 언제 수업에 등록해야 하는지 확인했다.\n→ The students checked ___ ___ ___ for the class.',
      'answer','when to register',
      'acceptedAnswers',jsonb_build_array('when to register','when to sign up')),

    jsonb_build_object('number',4,
      'question',E'다음 우리말과 일치하도록 빈칸에 알맞은 말을 쓰시오.\n\n나는 이 무거운 상자를 어디에 놓아야 할지 몰랐다.\n→ I didn''t know ___ ___ ___ this heavy box.',
      'answer','where to put',
      'acceptedAnswers',jsonb_build_array('where to put','where to place')),

    jsonb_build_object('number',5,
      'question',E'다음 우리말과 일치하도록 빈칸에 알맞은 말을 쓰시오.\n\n그는 두 개의 셔츠 중 어느 것을 골라야 할지 결정할 수 없었다.\n→ He couldn''t decide ___ ___ ___ between the two shirts.',
      'answer','which to choose',
      'acceptedAnswers',jsonb_build_array('which to choose','which to pick')),

    jsonb_build_object('number',6,
      'question',E'다음 우리말과 일치하도록 빈칸에 알맞은 말을 쓰시오.\n\n삼촌이 우리에게 바다에서 낚시하는 법을 가르쳐 주셨다.\n→ Our uncle taught us ___ ___ ___ in the sea.',
      'answer','how to fish',
      'acceptedAnswers',jsonb_build_array('how to fish')),

    jsonb_build_object('number',7,
      'question',E'다음 우리말과 일치하도록 빈칸에 알맞은 말을 쓰시오.\n\n그녀는 졸업 파티에 누구를 초대해야 할지 고민하고 있다.\n→ She is thinking about ___ ___ ___ to the graduation party.',
      'answer','who to invite',
      'acceptedAnswers',jsonb_build_array('who to invite','whom to invite')),

    jsonb_build_object('number',8,
      'question',E'다음 우리말과 일치하도록 빈칸에 알맞은 말을 쓰시오.\n\n그 영상은 고장 난 자전거를 수리하는 방법을 설명해 준다.\n→ The video explains ___ ___ ___ a broken bicycle.',
      'answer','how to repair',
      'acceptedAnswers',jsonb_build_array('how to repair','how to fix')),

    -- ═══════════════════════════════════════════
    -- Part 2: 두 문장→한 문장 결합 (Q9~Q12)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',9,
      'question',E'다음 <보기>와 같이 두 문장을 의문사+to부정사를 사용하여 한 문장으로 결합하시오.\n\n<보기>\nI''ll explain to you. + What should you do?\n→ I''ll explain to you what to do.\n\nI was not sure. + What should I bring to the picnic?',
      'answer','I was not sure what to bring to the picnic.',
      'acceptedAnswers',jsonb_build_array('I was not sure what to bring to the picnic.','I wasn''t sure what to bring to the picnic.')),

    jsonb_build_object('number',10,
      'question',E'다음 <보기>와 같이 두 문장을 의문사+to부정사를 사용하여 한 문장으로 결합하시오.\n\n<보기>\nI''ll explain to you. + What should you do?\n→ I''ll explain to you what to do.\n\nShe showed me. + How should I wrap the gift?',
      'answer','She showed me how to wrap the gift.',
      'acceptedAnswers',jsonb_build_array('She showed me how to wrap the gift.')),

    jsonb_build_object('number',11,
      'question',E'다음 <보기>와 같이 두 문장을 의문사+to부정사를 사용하여 한 문장으로 결합하시오.\n\n<보기>\nI''ll explain to you. + What should you do?\n→ I''ll explain to you what to do.\n\nWe haven''t decided yet. + When should we leave for the airport?',
      'answer','We haven''t decided when to leave for the airport yet.',
      'acceptedAnswers',jsonb_build_array('We haven''t decided when to leave for the airport yet.','We haven''t decided yet when to leave for the airport.')),

    jsonb_build_object('number',12,
      'question',E'다음 <보기>와 같이 두 문장을 의문사+to부정사를 사용하여 한 문장으로 결합하시오.\n\n<보기>\nI''ll explain to you. + What should you do?\n→ I''ll explain to you what to do.\n\nPlease tell me. + Where should I return these library books?',
      'answer','Please tell me where to return these library books.',
      'acceptedAnswers',jsonb_build_array('Please tell me where to return these library books.')),

    -- ═══════════════════════════════════════════
    -- Part 3: 역변환 — 의문사+to부정사 → should 절 (Q13~Q15)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',13,
      'question',E'다음 <보기>와 같이 밑줄 친 부분을 주어가 있는 절로 바꾸어 쓰시오.\n\n<보기>\nTell me when to turn left.\n→ Tell me when I should turn left.\n\nThey couldn''t decide what to pack for the trip.\n→ They couldn''t decide ___.',
      'answer','what they should pack for the trip',
      'acceptedAnswers',jsonb_build_array('what they should pack for the trip','what they could pack for the trip','what they can pack for the trip')),

    jsonb_build_object('number',14,
      'question',E'다음 <보기>와 같이 밑줄 친 부분을 주어가 있는 절로 바꾸어 쓰시오.\n\n<보기>\nTell me when to turn left.\n→ Tell me when I should turn left.\n\nI want to learn how to fix this bicycle.\n→ I want to learn ___.',
      'answer','how I should fix this bicycle',
      'acceptedAnswers',jsonb_build_array('how I should fix this bicycle','how I could fix this bicycle','how I can fix this bicycle')),

    jsonb_build_object('number',15,
      'question',E'다음 <보기>와 같이 밑줄 친 부분을 주어가 있는 절로 바꾸어 쓰시오.\n\n<보기>\nTell me when to turn left.\n→ Tell me when I should turn left.\n\nShe asked where to park the car.\n→ She asked ___.',
      'answer','where she should park the car',
      'acceptedAnswers',jsonb_build_array('where she should park the car','where she could park the car','where she can park the car')),

    -- ═══════════════════════════════════════════
    -- Part 4: 의문사 선택 — 괄호에서 고르기 (Q16~Q19)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',16,
      'question',E'다음 문장의 괄호 안에서 알맞은 것을 골라 쓰시오.\n\nI''d like to learn [ what / how ] to play the violin.',
      'answer','how',
      'acceptedAnswers',jsonb_build_array('how')),

    jsonb_build_object('number',17,
      'question',E'다음 문장의 괄호 안에서 알맞은 것을 골라 쓰시오.\n\nThere are two desserts left. I can''t decide [ which / where ] to eat first.',
      'answer','which',
      'acceptedAnswers',jsonb_build_array('which')),

    jsonb_build_object('number',18,
      'question',E'다음 문장의 괄호 안에서 알맞은 것을 골라 쓰시오.\n\nWe need to figure out [ when / where ] to hang these paintings in the gallery.',
      'answer','where',
      'acceptedAnswers',jsonb_build_array('where')),

    jsonb_build_object('number',19,
      'question',E'다음 문장의 괄호 안에서 알맞은 것을 골라 쓰시오.\n\nThe schedule keeps changing. Nobody knows [ how / when ] to start the rehearsal.',
      'answer','when',
      'acceptedAnswers',jsonb_build_array('when')),

    -- ═══════════════════════════════════════════
    -- Part 5: 단어 배열 (Q20~Q23)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',20,
      'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\nI don''t know ___.\n( where / my / to / luggage / store )',
      'answer','where to store my luggage',
      'acceptedAnswers',jsonb_build_array('where to store my luggage')),

    jsonb_build_object('number',21,
      'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\nThe teacher explained ___.\n( how / this / to / use / program )',
      'answer','how to use this program',
      'acceptedAnswers',jsonb_build_array('how to use this program')),

    jsonb_build_object('number',22,
      'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\nA: I''m hungry. What should we eat?\nB: ___ for lunch?\n( Can / tell / you / me / what / eat / to )',
      'answer','Can you tell me what to eat',
      'acceptedAnswers',jsonb_build_array('Can you tell me what to eat')),

    jsonb_build_object('number',23,
      'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\nMy sister is babysitting tonight.\n___ well.\n( Maybe / knows / she / how / care / take / to / of / babies )',
      'answer','Maybe she knows how to take care of babies',
      'acceptedAnswers',jsonb_build_array('Maybe she knows how to take care of babies','Maybe she knows how to take care of babies.')),

    -- ═══════════════════════════════════════════
    -- Part 6: 어법 오류 수정 (Q24~Q26)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',24,
      'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nShe couldn''t decide what wearing to the school festival.',
      'answer',E'what wearing → what to wear',
      'acceptedAnswers',jsonb_build_array('what wearing → what to wear','what wearing -> what to wear','what to wear')),

    jsonb_build_object('number',25,
      'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nHe asked the coach how swimming faster in the pool.',
      'answer',E'how swimming → how to swim',
      'acceptedAnswers',jsonb_build_array('how swimming → how to swim','how swimming -> how to swim','how to swim')),

    jsonb_build_object('number',26,
      'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nThey were confused about where going for the field trip.',
      'answer',E'where going → where to go',
      'acceptedAnswers',jsonb_build_array('where going → where to go','where going -> where to go','where to go')),

    -- ═══════════════════════════════════════════
    -- Part 7: 대화문 빈칸 (Q27~Q30)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',27,
      'question',E'다음 대화의 빈칸에 들어갈 알맞은 말을 ''의문사+to부정사'' 구문을 사용하여 완성하시오.\n\nA: I want to email this file to my teacher, but I''m stuck.\nB: Don''t worry. I''ll show you ___.',
      'answer','how to send',
      'acceptedAnswers',jsonb_build_array('how to send','how to send it','how to send the file')),

    jsonb_build_object('number',28,
      'question',E'다음 대화의 빈칸에 들어갈 알맞은 말을 ''의문사+to부정사'' 구문을 사용하여 완성하시오.\n\nA: Summer vacation is coming. Do you have any plans?\nB: Not yet. I haven''t decided ___.',
      'answer','where to travel',
      'acceptedAnswers',jsonb_build_array('where to travel','where to go')),

    jsonb_build_object('number',29,
      'question',E'다음 대화의 빈칸에 들어갈 알맞은 말을 ''의문사+to부정사'' 구문을 사용하여 완성하시오.\n\nA: My grandmother lives alone in the countryside.\nB: Really? Do you know ___?\nA: I usually go on weekends.',
      'answer','when to visit',
      'acceptedAnswers',jsonb_build_array('when to visit','when to visit her')),

    jsonb_build_object('number',30,
      'question',E'다음 대화의 빈칸에 들어갈 알맞은 말을 ''의문사+to부정사'' 구문을 사용하여 완성하시오.\n\nA: We have guests coming tonight.\nB: Oh no! I have no idea ___.\nA: How about spaghetti? Everyone likes it.',
      'answer','what to cook',
      'acceptedAnswers',jsonb_build_array('what to cook','what to cook for them','what to make')),

    -- ═══════════════════════════════════════════
    -- Part 8: 조건 영작 (Q31~Q34)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',31,
      'question',E'다음 우리말과 일치하도록 <조건>에 맞게 영작하시오.\n\n나는 시험을 위해 어떤 과목을 공부해야 할지 결정하지 못했다.\n\n<조건>\n- 주어: I\n- 동사: decide 사용\n- 의문사+to부정사 구문 포함',
      'answer','I couldn''t decide which subject to study for the exam.',
      'acceptedAnswers',jsonb_build_array('I couldn''t decide which subject to study for the exam.','I haven''t decided which subject to study for the exam.','I could not decide which subject to study for the exam.')),

    jsonb_build_object('number',32,
      'question',E'다음 우리말과 일치하도록 <조건>에 맞게 영작하시오.\n\n아버지가 나에게 텐트를 세우는 방법을 가르쳐 주셨다.\n\n<조건>\n- 주어: My father\n- 동사: teach 사용 (과거형)\n- 의문사+to부정사 구문 포함',
      'answer','My father taught me how to set up a tent.',
      'acceptedAnswers',jsonb_build_array('My father taught me how to set up a tent.','My father taught me how to put up a tent.')),

    jsonb_build_object('number',33,
      'question',E'다음 우리말과 일치하도록 <조건>에 맞게 영작하시오.\n\n그 안내판은 방문객들에게 어디에서 표를 살 수 있는지 알려준다.\n\n<조건>\n- 주어: The sign\n- 동사: tell 사용\n- 의문사+to부정사 구문 포함',
      'answer','The sign tells visitors where to buy tickets.',
      'acceptedAnswers',jsonb_build_array('The sign tells visitors where to buy tickets.','The sign tells visitors where to purchase tickets.','The sign tells the visitors where to buy tickets.')),

    jsonb_build_object('number',34,
      'question',E'다음 우리말과 일치하도록 <조건>에 맞게 영작하시오.\n\n우리 선생님은 발표를 언제 시작할지 아직 결정하지 못하셨다.\n\n<조건>\n- 주어: Our teacher\n- 동사: decide 사용 (현재완료 부정)\n- 의문사+to부정사 구문 포함',
      'answer','Our teacher hasn''t decided when to start the presentation yet.',
      'acceptedAnswers',jsonb_build_array('Our teacher hasn''t decided when to start the presentation yet.','Our teacher has not decided when to start the presentation yet.','Our teacher hasn''t decided when to begin the presentation yet.')),

    -- ═══════════════════════════════════════════
    -- Part 9: 영작 + 공통 단어 (Q35~Q37)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',35,
      'question',E'다음 우리말을 ''의문사+to부정사'' 구문을 사용하여 영작하시오.\n\n나는 이 편지를 누구에게 보내야 할지 모르겠다.',
      'answer','I don''t know who to send this letter to.',
      'acceptedAnswers',jsonb_build_array('I don''t know who to send this letter to.','I don''t know whom to send this letter to.','I do not know who to send this letter to.')),

    jsonb_build_object('number',36,
      'question',E'다음 우리말을 ''의문사+to부정사'' 구문을 사용하여 영작하시오.\n\n그 관광객들은 어느 버스를 타야 할지 물었다.',
      'answer','The tourists asked which bus to take.',
      'acceptedAnswers',jsonb_build_array('The tourists asked which bus to take.','The tourists asked which bus to ride.')),

    jsonb_build_object('number',37,
      'question',E'다음 세 문장의 빈칸에 공통으로 들어갈 세 단어를 쓰시오.\n\n(a) I don''t know ___ ___ ___ about this situation.\n(b) She asked me ___ ___ ___ next.\n(c) He couldn''t figure out ___ ___ ___ with the broken radio.',
      'answer','what to do',
      'acceptedAnswers',jsonb_build_array('what to do')),

    -- ═══════════════════════════════════════════
    -- Part 10: 보기 골라 완성 (Q38~Q40)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',38,
      'question',E'다음 <보기>에서 알맞은 단어를 골라 빈칸 (A)와 (B)를 완성하시오.\n\n<보기> to / where / how / what / drive / plant / wear\n\n(A) Can you teach me ___ ___ ___ a car safely?\n(B) I haven''t decided ___ ___ ___ these flowers in the garden.',
      'answer','(A) how to drive (B) where to plant',
      'acceptedAnswers',jsonb_build_array('(A) how to drive (B) where to plant')),

    jsonb_build_object('number',39,
      'question',E'다음 <보기>에서 알맞은 단어를 골라 대화의 빈칸을 완성하시오.\n\n<보기> can / tell / make / where / how / to\n\nA: I want to bake bread for my family, but I''ve never tried.\nB: ___ you ___ me ___ ___ ___ it?\nA: Sure! Let''s start with a simple recipe.',
      'answer','Can you tell me how to make',
      'acceptedAnswers',jsonb_build_array('Can you tell me how to make')),

    jsonb_build_object('number',40,
      'question',E'다음 <보기>에서 알맞은 말을 골라 빈칸 (A), (B), (C)를 완성하시오. (한 번씩만 사용)\n\n<보기> how to solve / when to submit / where to find\n\n(A) The students asked the teacher ___ the homework.\n(B) I don''t know ___ good information about Korean history.\n(C) She taught her little brother ___ the math puzzle.',
      'answer','(A) when to submit (B) where to find (C) how to solve',
      'acceptedAnswers',jsonb_build_array('(A) when to submit (B) where to find (C) how to solve'))
  );

  a := jsonb_build_array(
    'what to order',
    'how to bake',
    'when to register',
    'where to put',
    'which to choose',
    'how to fish',
    'who to invite',
    'how to repair',
    'I was not sure what to bring to the picnic.',
    'She showed me how to wrap the gift.',
    E'We haven''t decided when to leave for the airport yet.',
    'Please tell me where to return these library books.',
    'what they should pack for the trip',
    'how I should fix this bicycle',
    'where she should park the car',
    'how',
    'which',
    'where',
    'when',
    'where to store my luggage',
    'how to use this program',
    'Can you tell me what to eat',
    'Maybe she knows how to take care of babies',
    E'what wearing → what to wear',
    E'how swimming → how to swim',
    E'where going → where to go',
    'how to send',
    'where to travel',
    'when to visit',
    'what to cook',
    E'I couldn''t decide which subject to study for the exam.',
    'My father taught me how to set up a tent.',
    'The sign tells visitors where to buy tickets.',
    E'Our teacher hasn''t decided when to start the presentation yet.',
    E'I don''t know who to send this letter to.',
    'The tourists asked which bus to take.',
    'what to do',
    '(A) how to drive (B) where to plant',
    'Can you tell me how to make',
    '(A) when to submit (B) where to find (C) how to solve'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES (
    '의문사+to부정사 Step3',
    '의문사+to부정사',
    q,
    a,
    'grammar',
    'practice'
  );

  RAISE NOTICE '의문사+to부정사 Step3 템플릿 생성 완료 (40문제, 서술형, paraphrased)';
END;
$$;
