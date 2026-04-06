DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = '의문사+to부정사 Step1';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- Part 1: 빈칸을 의문사+to부정사 형태로 채우기 (Q1~Q14)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1,
      'question',E'다음 우리말에 맞게 빈칸을 의문사+to부정사 형태로 채우시오.\n\n그녀는 그 기계를 어떻게 고치는지 배웠다.\n→ She learned ___ ___ ___ the machine.',
      'answer','how to fix'),

    jsonb_build_object('number',2,
      'question',E'다음 우리말에 맞게 빈칸을 의문사+to부정사 형태로 채우시오.\n\n나는 어디에서 차를 주차해야 할지 모르겠다.\n→ I don''t know ___ ___ ___ my car.',
      'answer','where to park'),

    jsonb_build_object('number',3,
      'question',E'다음 우리말에 맞게 빈칸을 의문사+to부정사 형태로 채우시오.\n\n그는 저녁으로 무엇을 요리할지 결정했다.\n→ He decided ___ ___ ___ for dinner.',
      'answer','what to cook'),

    jsonb_build_object('number',4,
      'question',E'다음 우리말에 맞게 빈칸을 의문사+to부정사 형태로 채우시오.\n\n그 선생님은 우리에게 그 문제를 어떻게 푸는지 보여주었다.\n→ The teacher showed us ___ ___ ___ the problem.',
      'answer','how to solve'),

    jsonb_build_object('number',5,
      'question',E'다음 우리말에 맞게 빈칸을 의문사+to부정사 형태로 채우시오.\n\n우리는 언제 출발해야 하는지 알아야 한다.\n→ We need to know ___ ___ ___.',
      'answer','when to leave'),

    jsonb_build_object('number',6,
      'question',E'다음 우리말에 맞게 빈칸을 의문사+to부정사 형태로 채우시오.\n\n그녀에게 편지를 어디로 보내야 하는지 말해 주세요.\n→ Please tell me ___ ___ ___ the letter.',
      'answer','where to send'),

    jsonb_build_object('number',7,
      'question',E'다음 우리말에 맞게 빈칸을 의문사+to부정사 형태로 채우시오.\n\n나는 생일 파티에 무엇을 가져가야 할지 모르겠다.\n→ I don''t know ___ ___ ___ to the birthday party.',
      'answer','what to bring'),

    jsonb_build_object('number',8,
      'question',E'다음 우리말에 맞게 빈칸을 의문사+to부정사 형태로 채우시오.\n\n그 코치가 나에게 더 빨리 수영하는 법을 가르쳐 주었다.\n→ The coach taught me ___ ___ ___ faster.',
      'answer','how to swim'),

    jsonb_build_object('number',9,
      'question',E'다음 우리말에 맞게 빈칸을 의문사+to부정사 형태로 채우시오.\n\n나는 어떤 색을 골라야 할지 결정할 수 없었다.\n→ I couldn''t decide ___ ___ ___ ___.',
      'answer','which color to choose'),

    jsonb_build_object('number',10,
      'question',E'다음 우리말에 맞게 빈칸을 의문사+to부정사 형태로 채우시오.\n\n너는 어디에서 그 표를 살 수 있는지 아니?\n→ Do you know ___ ___ ___ the tickets?',
      'answer','where to buy'),

    jsonb_build_object('number',11,
      'question',E'다음 우리말에 맞게 빈칸을 의문사+to부정사 형태로 채우시오.\n\n나의 엄마는 항상 무엇을 준비해야 할지 안다.\n→ My mom always knows ___ ___ ___.',
      'answer','what to prepare'),

    jsonb_build_object('number',12,
      'question',E'다음 우리말에 맞게 빈칸을 의문사+to부정사 형태로 채우시오.\n\n아무도 나에게 그 앱을 어떻게 사용하는지 알려주지 않았다.\n→ Nobody told me ___ ___ ___ the app.',
      'answer','how to use'),

    jsonb_build_object('number',13,
      'question',E'다음 우리말에 맞게 빈칸을 의문사+to부정사 형태로 채우시오.\n\n우리는 언제 프로젝트를 시작해야 하는지 궁금했다.\n→ We wondered ___ ___ ___ the project.',
      'answer','when to start'),

    jsonb_build_object('number',14,
      'question',E'다음 우리말에 맞게 빈칸을 의문사+to부정사 형태로 채우시오.\n\n나는 누구에게 도움을 요청해야 할지 몰랐다.\n→ I didn''t know ___ ___ ___.',
      'answer','who to ask'),

    -- ═══════════════════════════════════════════
    -- Part 2: should/can 문장 → to부정사 빈칸 변환 (Q15~Q28)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',15,
      'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nShe doesn''t know how she should respond to the message.\n→ She doesn''t know ___ ___ ___ to the message.',
      'answer','how to respond'),

    jsonb_build_object('number',16,
      'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nHe couldn''t decide what he should wear to the interview.\n→ He couldn''t decide ___ ___ ___ to the interview.',
      'answer','what to wear'),

    jsonb_build_object('number',17,
      'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nCan you tell me where I should park my bicycle?\n→ Can you tell me ___ ___ ___ my bicycle?',
      'answer','where to park'),

    jsonb_build_object('number',18,
      'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nI forgot when I should submit the report.\n→ I forgot ___ ___ ___ the report.',
      'answer','when to submit'),

    jsonb_build_object('number',19,
      'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nPlease explain how I should organize my notes.\n→ Please explain ___ ___ ___ my notes.',
      'answer','how to organize'),

    jsonb_build_object('number',20,
      'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nShe asked me which route she should take to the station.\n→ She asked me ___ ___ ___ ___ to the station.',
      'answer','which route to take'),

    jsonb_build_object('number',21,
      'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nWe didn''t know what we should pack for the trip.\n→ We didn''t know ___ ___ ___ for the trip.',
      'answer','what to pack'),

    jsonb_build_object('number',22,
      'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nThe tourists wondered where they should exchange their money.\n→ The tourists wondered ___ ___ ___ their money.',
      'answer','where to exchange'),

    jsonb_build_object('number',23,
      'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nMy dad taught me how I should repair a flat tire.\n→ My dad taught me ___ ___ ___ a flat tire.',
      'answer','how to repair'),

    jsonb_build_object('number',24,
      'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nThe students asked the teacher when they should begin the experiment.\n→ The students asked the teacher ___ ___ ___ the experiment.',
      'answer','when to begin'),

    jsonb_build_object('number',25,
      'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nI can''t figure out what I should write in this essay.\n→ I can''t figure out ___ ___ ___ in this essay.',
      'answer','what to write'),

    jsonb_build_object('number',26,
      'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nShe remembered where she should return the library books.\n→ She remembered ___ ___ ___ the library books.',
      'answer','where to return'),

    jsonb_build_object('number',27,
      'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nThe manual shows you how you should connect the printer to your computer.\n→ The manual shows you ___ ___ ___ the printer to your computer.',
      'answer','how to connect'),

    jsonb_build_object('number',28,
      'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nI wasn''t sure who I should invite to the ceremony.\n→ I wasn''t sure ___ ___ ___ to the ceremony.',
      'answer','who to invite'),

    -- ═══════════════════════════════════════════
    -- Part 3: to부정사 → should/could 문장으로 다시 쓰기 (Q29~Q36)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',29,
      'question',E'다음 문장을 <보기>와 같이 다시 쓰시오.\n\n<보기>\nWe don''t know where to put the sofa.\n→ We don''t know where we should put the sofa.\n\nShe didn''t know what to bring to the picnic.\n→ She didn''t know ___.',
      'answer','what she should bring to the picnic'),

    jsonb_build_object('number',30,
      'question',E'다음 문장을 <보기>와 같이 다시 쓰시오.\n\n<보기>\nWe don''t know where to put the sofa.\n→ We don''t know where we should put the sofa.\n\nWe haven''t decided what to cook for the party.\n→ We haven''t decided ___.',
      'answer','what we should cook for the party'),

    jsonb_build_object('number',31,
      'question',E'다음 문장을 <보기>와 같이 다시 쓰시오.\n\n<보기>\nWe don''t know where to put the sofa.\n→ We don''t know where we should put the sofa.\n\nShe can''t remember where to return the library books.\n→ She can''t remember ___.',
      'answer','where she should return the library books'),

    jsonb_build_object('number',32,
      'question',E'다음 문장을 <보기>와 같이 다시 쓰시오.\n\n<보기>\nWe don''t know where to put the sofa.\n→ We don''t know where we should put the sofa.\n\nMy brother showed me how to tie a necktie.\n→ ___',
      'answer','My brother showed me how I should tie a necktie.'),

    jsonb_build_object('number',33,
      'question',E'다음 문장을 <보기>와 같이 다시 쓰시오.\n\n<보기>\nWe don''t know where to put the sofa.\n→ We don''t know where we should put the sofa.\n\nI''m not sure when to submit the homework.\n→ I''m not sure ___.',
      'answer','when I should submit the homework'),

    jsonb_build_object('number',34,
      'question',E'다음 문장을 <보기>와 같이 다시 쓰시오.\n\n<보기>\nWe don''t know where to put the sofa.\n→ We don''t know where we should put the sofa.\n\nThe guide explained to us how to reach the mountain top safely.\n→ ___',
      'answer','The guide explained to us how we could reach the mountain top safely.'),

    jsonb_build_object('number',35,
      'question',E'다음 문장을 <보기>와 같이 다시 쓰시오.\n\n<보기>\nWe don''t know where to put the sofa.\n→ We don''t know where we should put the sofa.\n\nThe notice tells visitors which gate to enter.\n→ ___',
      'answer','The notice tells visitors which gate they should enter.'),

    jsonb_build_object('number',36,
      'question',E'다음 문장을 <보기>와 같이 다시 쓰시오.\n\n<보기>\nWe don''t know where to put the sofa.\n→ We don''t know where we should put the sofa.\n\nThey are discussing where to hold the festival.\n→ They are discussing ___.',
      'answer','where they should hold the festival'),

    -- ═══════════════════════════════════════════
    -- Part 4: 대화 속 주어진 동사를 의문사+to부정사로 (Q37~Q42)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',37,
      'question',E'다음 대화의 빈칸에 주어진 동사를 사용하여 <의문사 + to부정사> 형태로 쓰시오.\n\nA: This recipe looks really complicated.\nB: I agree. I don''t know ___ all these ingredients. (mix)',
      'answer','how to mix'),

    jsonb_build_object('number',38,
      'question',E'다음 대화의 빈칸에 주어진 동사를 사용하여 <의문사 + to부정사> 형태로 쓰시오.\n\nA: I have too many clothes for this suitcase.\nB: I''m not sure ___ in such a small bag. (pack)',
      'answer','what to pack'),

    jsonb_build_object('number',39,
      'question',E'다음 대화의 빈칸에 주어진 동사를 사용하여 <의문사 + to부정사> 형태로 쓰시오.\n\nA: We need to set up the tent before dark.\nB: But I can''t decide ___. How about near the river? (camp)',
      'answer','where to camp'),

    jsonb_build_object('number',40,
      'question',E'다음 대화의 빈칸에 주어진 동사를 사용하여 <의문사 + to부정사> 형태로 쓰시오.\n\nA: The medicine should be taken at the right time.\nB: Could you tell me ___ it? In the morning or at night? (take)',
      'answer','when to take'),

    jsonb_build_object('number',41,
      'question',E'다음 대화의 빈칸에 주어진 동사를 사용하여 <의문사 + to부정사> 형태로 쓰시오.\n\nA: The computer screen went black suddenly.\nB: Don''t worry. Let me show you ___ it. (restart)',
      'answer','how to restart'),

    jsonb_build_object('number',42,
      'question',E'다음 대화의 빈칸에 주어진 동사를 사용하여 <의문사 + to부정사> 형태로 쓰시오.\n\nA: We need someone to lead the group project.\nB: I''m not sure ___. Maybe you or Jake? (choose)',
      'answer','who to choose'),

    -- ═══════════════════════════════════════════
    -- Part 5: 단어 박스에서 골라 의문사+to부정사로 빈칸 채우기 (Q43~Q60)
    -- ═══════════════════════════════════════════

    -- Group A: how/what + to infinitive (9 verbs)
    jsonb_build_object('number',43,
      'question',E'[보기] 상자에서 알맞은 동사를 골라 <의문사 + to부정사> 형태로 빈칸을 채우시오.\n\n| fix | grow | pack | handle | organize | fold | operate | decorate | wear |\n\nThe washing machine broke down, but nobody knew _______________.',
      'answer','how to fix'),

    jsonb_build_object('number',44,
      'question',E'상자에서 알맞은 동사를 골라 <의문사 + to부정사> 형태로 빈칸을 채우시오.\n\n| fix | grow | pack | handle | organize | fold | operate | decorate | wear |\n\nMy grandmother taught me _______________ tomatoes in the backyard.',
      'answer','how to grow'),

    jsonb_build_object('number',45,
      'question',E'상자에서 알맞은 동사를 골라 <의문사 + to부정사> 형태로 빈칸을 채우시오.\n\n| fix | grow | pack | handle | organize | fold | operate | decorate | wear |\n\nWe are going on a trip tomorrow, but I still don''t know _______________ in my suitcase.',
      'answer','what to pack'),

    jsonb_build_object('number',46,
      'question',E'상자에서 알맞은 동사를 골라 <의문사 + to부정사> 형태로 빈칸을 채우시오.\n\n| fix | grow | pack | handle | organize | fold | operate | decorate | wear |\n\nThe customer was very angry, and I didn''t know _______________ the situation.',
      'answer','how to handle'),

    jsonb_build_object('number',47,
      'question',E'상자에서 알맞은 동사를 골라 <의문사 + to부정사> 형태로 빈칸을 채우시오.\n\n| fix | grow | pack | handle | organize | fold | operate | decorate | wear |\n\nThere are so many files on my desk. Can you teach me _______________ them neatly?',
      'answer','how to organize'),

    jsonb_build_object('number',48,
      'question',E'상자에서 알맞은 동사를 골라 <의문사 + to부정사> 형태로 빈칸을 채우시오.\n\n| fix | grow | pack | handle | organize | fold | operate | decorate | wear |\n\nShe watched a video to learn _______________ paper into a crane.',
      'answer','how to fold'),

    jsonb_build_object('number',49,
      'question',E'상자에서 알맞은 동사를 골라 <의문사 + to부정사> 형태로 빈칸을 채우시오.\n\n| fix | grow | pack | handle | organize | fold | operate | decorate | wear |\n\nThe new printer arrived, but the manual doesn''t explain _______________ it.',
      'answer','how to operate'),

    jsonb_build_object('number',50,
      'question',E'상자에서 알맞은 동사를 골라 <의문사 + to부정사> 형태로 빈칸을 채우시오.\n\n| fix | grow | pack | handle | organize | fold | operate | decorate | wear |\n\nChristmas is coming. Let''s decide _______________ the classroom.',
      'answer','how to decorate'),

    jsonb_build_object('number',51,
      'question',E'상자에서 알맞은 동사를 골라 <의문사 + to부정사> 형태로 빈칸을 채우시오.\n\n| fix | grow | pack | handle | organize | fold | operate | decorate | wear |\n\nI have a job interview tomorrow, but I haven''t decided _______________ yet.',
      'answer','what to wear'),

    -- Group B: how/what/where + to infinitive (5 verbs)
    jsonb_build_object('number',52,
      'question',E'[보기] 상자에서 알맞은 동사를 골라 <의문사 + to부정사> 형태로 빈칸을 채우시오.\n\n| store | prepare | arrange | deliver | select |\n\nWe bought too much food. I don''t know _______________ all of it in this tiny kitchen.',
      'answer','where to store'),

    jsonb_build_object('number',53,
      'question',E'상자에서 알맞은 동사를 골라 <의문사 + to부정사> 형태로 빈칸을 채우시오.\n\n| store | prepare | arrange | deliver | select |\n\nThe guests are coming tonight, but I''m not sure _______________ for dinner.',
      'answer','what to prepare'),

    jsonb_build_object('number',54,
      'question',E'상자에서 알맞은 동사를 골라 <의문사 + to부정사> 형태로 빈칸을 채우시오.\n\n| store | prepare | arrange | deliver | select |\n\nThe living room looks messy. She asked me _______________ the furniture.',
      'answer','how to arrange'),

    jsonb_build_object('number',55,
      'question',E'상자에서 알맞은 동사를 골라 <의문사 + to부정사> 형태로 빈칸을 채우시오.\n\n| store | prepare | arrange | deliver | select |\n\nI have a package for Mr. Kim, but I don''t know _______________ it.',
      'answer','where to deliver'),

    jsonb_build_object('number',56,
      'question',E'상자에서 알맞은 동사를 골라 <의문사 + to부정사> 형태로 빈칸을 채우시오.\n\n| store | prepare | arrange | deliver | select |\n\nThere are many colors available. She can''t decide _______________ for her bedroom wall.',
      'answer','what to select'),

    -- Group C: what/where + to infinitive (4 verbs)
    jsonb_build_object('number',57,
      'question',E'[보기] 상자에서 알맞은 동사를 골라 <의문사 + to부정사> 형태로 빈칸을 채우시오.\n\n| hang | plant | order | place |\n\nI bought a new painting, but I can''t decide _______________ it.',
      'answer','where to hang'),

    jsonb_build_object('number',58,
      'question',E'상자에서 알맞은 동사를 골라 <의문사 + to부정사> 형태로 빈칸을 채우시오.\n\n| hang | plant | order | place |\n\nSpring has come. My father is wondering _______________ in the garden.',
      'answer','what to plant'),

    jsonb_build_object('number',59,
      'question',E'상자에서 알맞은 동사를 골라 <의문사 + to부정사> 형태로 빈칸을 채우시오.\n\n| hang | plant | order | place |\n\nThis is my first time at this restaurant. Can you help me decide _______________?',
      'answer','what to order'),

    jsonb_build_object('number',60,
      'question',E'상자에서 알맞은 동사를 골라 <의문사 + to부정사> 형태로 빈칸을 채우시오.\n\n| hang | plant | order | place |\n\nWe received new bookshelves, but we don''t know _______________ them in the classroom.',
      'answer','where to place'),

    -- ═══════════════════════════════════════════
    -- Part 6: 단어 배열 (Q61~Q76)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',61,
      'question',E'다음 우리말에 맞게 주어진 단어를 바르게 배열하시오.\n\n그녀는 피아노 치는 법을 배우고 있다.\n(is, how, she, the piano, play, learning, to)',
      'answer','She is learning how to play the piano.'),

    jsonb_build_object('number',62,
      'question',E'다음 우리말에 맞게 주어진 단어를 바르게 배열하시오.\n\n우리는 그 박물관을 어디에서 찾아야 할지 몰랐다.\n(to, the museum, didn''t, find, where, we, know)',
      'answer','We didn''t know where to find the museum.'),

    jsonb_build_object('number',63,
      'question',E'다음 우리말에 맞게 주어진 단어를 바르게 배열하시오.\n\n그는 점심으로 무엇을 주문할지 결정할 수 없었다.\n(couldn''t, for, to, lunch, decide, he, order, what)',
      'answer','He couldn''t decide what to order for lunch.'),

    jsonb_build_object('number',64,
      'question',E'다음 우리말에 맞게 주어진 단어를 바르게 배열하시오.\n\n아버지가 나에게 자동차를 세차하는 방법을 알려주셨다.\n(to, told, a car, my father, how, wash, me)',
      'answer','My father told me how to wash a car.'),

    jsonb_build_object('number',65,
      'question',E'다음 우리말에 맞게 주어진 단어를 바르게 배열하시오.\n\n너는 그 보고서를 언제 제출해야 할지 기억하니?\n(submit, to, do, the report, when, remember, you)',
      'answer','Do you remember when to submit the report?'),

    jsonb_build_object('number',66,
      'question',E'다음 우리말에 맞게 주어진 단어를 바르게 배열하시오.\n\n나는 어떤 길을 선택해야 할지 확신이 없었다.\n(wasn''t, which, take, to, I, sure, path)',
      'answer','I wasn''t sure which path to take.'),

    jsonb_build_object('number',67,
      'question',E'다음 우리말에 맞게 주어진 단어를 바르게 배열하시오.\n\nMina는 오늘 저녁에 무엇을 만들지 아직 정하지 않았다.\n(hasn''t, what, tonight, yet, to, decided, cook, Mina)',
      'answer','Mina hasn''t decided what to cook tonight yet.'),

    jsonb_build_object('number',68,
      'question',E'다음 우리말에 맞게 주어진 단어를 바르게 배열하시오.\n\n선생님은 학생들에게 현미경을 사용하는 방법을 보여주었다.\n(use, how, showed, to, the microscope, the students, the teacher)',
      'answer','The teacher showed the students how to use the microscope.'),

    jsonb_build_object('number',69,
      'question',E'다음 우리말에 맞게 주어진 단어를 바르게 배열하시오.\n\n그들은 캠핑 텐트를 어디에 칠지 논의했다.\n(discussed, up, set, their tent, they, to, where)',
      'answer','They discussed where to set up their tent.'),

    jsonb_build_object('number',70,
      'question',E'다음 우리말에 맞게 주어진 단어를 바르게 배열하시오.\n\n우리 어머니는 언제 약을 먹어야 하는지 알고 계시다.\n(when, the medicine, knows, take, my mother, to)',
      'answer','My mother knows when to take the medicine.'),

    jsonb_build_object('number',71,
      'question',E'다음 우리말에 맞게 주어진 단어를 바르게 배열하시오.\n\n나는 내 비밀을 누구에게 말해야 할지 모르겠다.\n(who, don''t, my secret, tell, I, to, know)',
      'answer','I don''t know who to tell my secret.'),

    jsonb_build_object('number',72,
      'question',E'다음 우리말에 맞게 주어진 단어를 바르게 배열하시오.\n\n할아버지는 우리에게 낚시하는 법을 가르쳐 주셨다.\n(how, taught, my grandfather, fish, us, to)',
      'answer','My grandfather taught us how to fish.'),

    jsonb_build_object('number',73,
      'question',E'다음 우리말에 맞게 주어진 단어를 바르게 배열하시오.\n\nJason과 Emily는 파티에서 무엇을 연주할지 토론했다.\n(play, discussed, at, the party, Emily, to, and, Jason, what)',
      'answer','Jason and Emily discussed what to play at the party.'),

    jsonb_build_object('number',74,
      'question',E'다음 우리말에 맞게 주어진 단어를 바르게 배열하시오.\n\n그녀는 그 편지를 어디에 보내야 할지 물었다.\n(the letter, where, send, she, to, asked)',
      'answer','She asked where to send the letter.'),

    jsonb_build_object('number',75,
      'question',E'다음 우리말에 맞게 주어진 단어를 바르게 배열하시오.\n\n너는 이 소프트웨어를 설치하는 방법을 알고 있니?\n(know, software, install, to, this, how, you, do)',
      'answer','Do you know how to install this software?'),

    jsonb_build_object('number',76,
      'question',E'다음 우리말에 맞게 주어진 단어를 바르게 배열하시오.\n\n그 코치는 우리에게 언제 연습을 시작할지 알려줄 것이다.\n(when, will, us, practice, tell, the coach, to, start)',
      'answer','The coach will tell us when to start practice.'),

    -- ═══════════════════════════════════════════
    -- Part 7: 영작 — 한→영 (Q77~Q90)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',77,
      'question',E'다음 우리말을 주어진 단어를 이용하여 영작하시오.\n\n그녀는 기타 치는 법을 안다.\n(know, play, guitar)',
      'answer','She knows how to play the guitar.'),

    jsonb_build_object('number',78,
      'question',E'다음 우리말을 주어진 단어를 이용하여 영작하시오.\n\n나는 다음에 무엇을 말해야 할지 몰랐다.\n(know, say)',
      'answer','I didn''t know what to say next.'),

    jsonb_build_object('number',79,
      'question',E'다음 우리말을 주어진 단어를 이용하여 영작하시오.\n\n그들은 어디에서 점심을 먹을지 정했다.\n(decide, eat, lunch)',
      'answer','They decided where to eat lunch.'),

    jsonb_build_object('number',80,
      'question',E'다음 우리말을 주어진 단어를 이용하여 영작하시오.\n\n그 의사는 나에게 언제 약을 먹어야 할지 알려주었다.\n(tell, take, medicine)',
      'answer','The doctor told me when to take the medicine.'),

    jsonb_build_object('number',81,
      'question',E'다음 우리말을 주어진 단어를 이용하여 영작하시오.\n\n우리 엄마는 나에게 쿠키를 만드는 법을 가르쳐 주셨다.\n(teach, make, cookies)',
      'answer','My mom taught me how to make cookies.'),

    jsonb_build_object('number',82,
      'question',E'다음 우리말을 주어진 단어를 이용하여 영작하시오.\n\n나는 어떤 대학을 지원해야 할지 결정할 수 없다.\n(decide, university, apply)',
      'answer','I can''t decide which university to apply to.'),

    jsonb_build_object('number',83,
      'question',E'다음 우리말을 주어진 단어를 이용하여 영작하시오.\n\n너는 시험을 위해 무엇을 공부해야 할지 아니?\n(know, study, exam)',
      'answer','Do you know what to study for the exam?'),

    jsonb_build_object('number',84,
      'question',E'다음 우리말을 주어진 단어를 이용하여 영작하시오.\n\n관광객들은 어디에서 기차를 탈 수 있는지 물었다.\n(ask, catch, train)',
      'answer','The tourists asked where to catch the train.'),

    jsonb_build_object('number',85,
      'question',E'다음 우리말을 주어진 단어를 이용하여 영작하시오.\n\nTom은 자전거를 수리하는 방법을 배울 것이다.\n(learn, fix, bicycle)',
      'answer','Tom will learn how to fix a bicycle.'),

    jsonb_build_object('number',86,
      'question',E'다음 우리말을 주어진 단어를 이용하여 영작하시오.\n\n그녀는 이 문제에 대해 누구에게 도움을 요청해야 할지 몰랐다.\n(know, ask, help)',
      'answer','She didn''t know who to ask for help with this problem.'),

    jsonb_build_object('number',87,
      'question',E'다음 우리말을 주어진 단어를 이용하여 영작하시오.\n\n아이들은 방학 동안 무엇을 할지 신이 났다.\n(excited, do, vacation)',
      'answer','The children were excited about what to do during vacation.'),

    jsonb_build_object('number',88,
      'question',E'다음 우리말을 주어진 단어를 이용하여 영작하시오.\n\n나에게 이 근처에서 어디에 주차할 수 있는지 알려주세요.\n(tell, park, around here)',
      'answer','Please tell me where to park around here.'),

    jsonb_build_object('number',89,
      'question',E'다음 우리말을 주어진 단어를 이용하여 영작하시오.\n\n그 요리사는 관객에게 완벽한 스테이크를 요리하는 방법을 보여주었다.\n(show, audience, cook, perfect steak)',
      'answer','The chef showed the audience how to cook a perfect steak.'),

    jsonb_build_object('number',90,
      'question',E'다음 우리말을 주어진 단어를 이용하여 영작하시오.\n\n우리는 다음 회의를 언제 열어야 할지 아직 결정하지 못했다.\n(decide, hold, meeting)',
      'answer','We haven''t decided when to hold the next meeting yet.')
  );

  a := jsonb_build_array(
    'how to fix','where to park','what to cook','how to solve',
    'when to leave','where to send','what to bring','how to swim',
    'which color to choose','where to buy','what to prepare','how to use',
    'when to start','who to ask',
    'how to respond','what to wear','where to park','when to submit',
    'how to organize','which route to take','what to pack','where to exchange',
    'how to repair','when to begin','what to write','where to return',
    'how to connect','who to invite',
    'what she should bring to the picnic',
    'what we should cook for the party',
    'where she should return the library books',
    'My brother showed me how I should tie a necktie.',
    'when I should submit the homework',
    'The guide explained to us how we could reach the mountain top safely.',
    'The notice tells visitors which gate they should enter.',
    'where they should hold the festival',
    'how to mix','what to pack','where to camp','when to take',
    'how to restart','who to choose',
    'how to fix','how to grow','what to pack','how to handle',
    'how to organize','how to fold','how to operate','how to decorate','what to wear',
    'where to store','what to prepare','how to arrange','where to deliver','what to select',
    'where to hang','what to plant','what to order','where to place',
    'She is learning how to play the piano.',
    'We didn''t know where to find the museum.',
    'He couldn''t decide what to order for lunch.',
    'My father told me how to wash a car.',
    'Do you remember when to submit the report?',
    'I wasn''t sure which path to take.',
    'Mina hasn''t decided what to cook tonight yet.',
    'The teacher showed the students how to use the microscope.',
    'They discussed where to set up their tent.',
    'My mother knows when to take the medicine.',
    'I don''t know who to tell my secret.',
    'My grandfather taught us how to fish.',
    'Jason and Emily discussed what to play at the party.',
    'She asked where to send the letter.',
    'Do you know how to install this software?',
    'The coach will tell us when to start practice.',
    'She knows how to play the guitar.',
    'I didn''t know what to say next.',
    'They decided where to eat lunch.',
    'The doctor told me when to take the medicine.',
    'My mom taught me how to make cookies.',
    'I can''t decide which university to apply to.',
    'Do you know what to study for the exam?',
    'The tourists asked where to catch the train.',
    'Tom will learn how to fix a bicycle.',
    'She didn''t know who to ask for help with this problem.',
    'The children were excited about what to do during vacation.',
    'Please tell me where to park around here.',
    'The chef showed the audience how to cook a perfect steak.',
    'We haven''t decided when to hold the next meeting yet.'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('의문사+to부정사 Step1', '의문사+to부정사', q, a, 'problem', 'interactive');

  RAISE NOTICE '의문사+to부정사 Step1 템플릿 생성 완료 (90문제, 서술형, paraphrased)';
END;
$$;
