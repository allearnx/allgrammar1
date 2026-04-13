-- 조동사가 포함된 수동태 Step 3 — 서술형 30문항
-- template_topic: 조동사가 포함된 수동태
-- category: problem, mode: interactive

DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = E'조동사가 포함된 수동태 Step 3';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- 동의문 전환 (Q1~Q6) ★★★
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1,
      'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nScientists will discover a cure for the disease within the next decade.\n→ A cure for the disease ___ ___ ___ within the next decade.',
      'answer',E'will be discovered',
      'acceptedAnswers',jsonb_build_array('will be discovered'),
      'explanation',E'능동태의 목적어(a cure)가 주어 → will + be + p.p.: will be discovered'),
    jsonb_build_object('number',2,
      'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nThe government should address the issue of rising housing costs immediately.\n→ The issue of rising housing costs ___ ___ ___ by the government immediately.',
      'answer',E'should be addressed',
      'acceptedAnswers',jsonb_build_array('should be addressed'),
      'explanation',E'should + be + p.p.: should be addressed'),
    jsonb_build_object('number',3,
      'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nVolunteers might plant over a thousand trees along the riverside this spring.\n→ Over a thousand trees ___ ___ ___ along the riverside this spring.',
      'answer',E'might be planted',
      'acceptedAnswers',jsonb_build_array('might be planted'),
      'explanation',E'might + be + p.p.: might be planted'),
    jsonb_build_object('number',4,
      'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nPassengers can use this waiting area free of charge during the delay.\n→ This waiting area ___ ___ ___ free of charge by passengers during the delay.',
      'answer',E'can be used',
      'acceptedAnswers',jsonb_build_array('can be used'),
      'explanation',E'can + be + p.p.: can be used'),
    jsonb_build_object('number',5,
      'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nStudents must not submit their assignments after the deadline has passed.\n→ Assignments ___ ___ ___ ___ after the deadline has passed.',
      'answer',E'must not be submitted',
      'acceptedAnswers',jsonb_build_array('must not be submitted'),
      'explanation',E'조동사 수동태 부정: must not + be + p.p.: must not be submitted'),
    jsonb_build_object('number',6,
      'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nWill the city council hold the public hearing next month?\n→ ___ the public hearing ___ ___ by the city council next month?',
      'answer',E'Will / be held',
      'acceptedAnswers',jsonb_build_array('Will / be held','Will, be held','Will be held'),
      'explanation',E'조동사 수동태 의문문: Will + 주어 + be + p.p.'),

    -- ═══════════════════════════════════════════
    -- 오류 수정 — 혼합형 (Q7~Q12) ★★★★
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',7,
      'question',E'다음 문장에서 어법상 어색한 부분을 찾아 고쳐 쓰시오. 오류가 없으면 "No error"라고 쓰시오.\n\nThe ancient artifacts discovered at the site must be not removed without permission from the authorities.',
      'answer',E'must be not removed → must not be removed',
      'acceptedAnswers',jsonb_build_array('must be not removed → must not be removed','must not be removed'),
      'explanation',E'부정문 어순: 조동사 + not + be + p.p. → must not be removed'),
    jsonb_build_object('number',8,
      'question',E'다음 문장에서 어법상 어색한 부분을 찾아 고쳐 쓰시오. 오류가 없으면 "No error"라고 쓰시오.\n\nAll personal health data collected by the app should kept strictly confidential at all times.',
      'answer',E'should kept → should be kept',
      'acceptedAnswers',jsonb_build_array('should kept → should be kept','should be kept'),
      'explanation',E'조동사 수동태: should + be + p.p. → should be kept (be 빠짐)'),
    jsonb_build_object('number',9,
      'question',E'다음 문장에서 어법상 어색한 부분을 찾아 고쳐 쓰시오. 오류가 없으면 "No error"라고 쓰시오.\n\nThe damaged equipment in the laboratory cannot be repaired without specialized tools and expertise.',
      'answer',E'No error',
      'acceptedAnswers',jsonb_build_array('No error','no error','NO ERROR'),
      'explanation',E'cannot + be + p.p. 형태가 올바르다. 오류 없음.'),
    jsonb_build_object('number',10,
      'question',E'다음 문장에서 어법상 어색한 부분을 찾아 고쳐 쓰시오. 오류가 없으면 "No error"라고 쓰시오.\n\nVisitors must not be entered the restricted zone under any circumstances during the renovation period.',
      'answer',E'must not be entered → must not enter',
      'acceptedAnswers',jsonb_build_array('must not be entered → must not enter','must not enter'),
      'explanation',E'visitors가 행위의 주체이므로 능동태가 올바르다: must not enter'),
    jsonb_build_object('number',11,
      'question',E'다음 문장에서 어법상 어색한 부분을 찾아 고쳐 쓰시오. 오류가 없으면 "No error"라고 쓰시오.\n\nThe annual report will be submit to the board of directors before the end of this quarter.',
      'answer',E'will be submit → will be submitted',
      'acceptedAnswers',jsonb_build_array('will be submit → will be submitted','will be submitted'),
      'explanation',E'be 뒤에는 과거분사(p.p.)가 와야 한다: submit → submitted'),
    jsonb_build_object('number',12,
      'question',E'다음 문장에서 어법상 어색한 부분을 찾아 고쳐 쓰시오. 오류가 없으면 "No error"라고 쓰시오.\n\nStray animals in the area may be reported to the local shelter, where they will be cared for properly.',
      'answer',E'No error',
      'acceptedAnswers',jsonb_build_array('No error','no error','NO ERROR'),
      'explanation',E'may be reported, will be cared for 모두 올바른 조동사 수동태이다. 오류 없음.'),

    -- ═══════════════════════════════════════════
    -- 단락·대화문 빈칸 (Q13~Q16) ★★★★
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',13,
      'question',E'다음 글의 빈칸에 주어진 단어를 이용하여 조동사 수동태의 알맞은 형태를 쓰시오.\n\nOur school has announced important updates for next semester. First, all student identification cards (13)___ with new digital versions by the end of this month.\n\n[replace / will]',
      'answer',E'will be replaced',
      'acceptedAnswers',jsonb_build_array('will be replaced'),
      'explanation',E'카드는 교체되는 대상 → will + be + p.p.: will be replaced'),
    jsonb_build_object('number',14,
      'question',E'다음 글의 빈칸에 주어진 단어를 이용하여 조동사 수동태의 알맞은 형태를 쓰시오.\n\nIn addition, electronic devices (14)___ in classrooms without the teacher''s prior permission.\n\n[not use / must]',
      'answer',E'must not be used',
      'acceptedAnswers',jsonb_build_array('must not be used'),
      'explanation',E'전자기기는 사용되는 대상 + 부정: must not + be + p.p.: must not be used'),
    jsonb_build_object('number',15,
      'question',E'다음 글의 빈칸에 주어진 단어를 이용하여 조동사 수동태의 알맞은 형태를 쓰시오.\n\nFinally, all homework assignments (15)___ through the school''s official online platform from now on.\n\n[submit / should]',
      'answer',E'should be submitted',
      'acceptedAnswers',jsonb_build_array('should be submitted'),
      'explanation',E'과제는 제출되는 대상 → should + be + p.p.: should be submitted'),
    jsonb_build_object('number',16,
      'question',E'다음 대화의 빈칸에 주어진 단어를 이용하여 조동사 수동태의 알맞은 형태를 쓰시오.\n\nJinho: Did you hear that the old community center is going to be rebuilt?\nSora: Yes! I heard it (16a)___ into a modern youth arts center. The whole project (16b)___ by next spring.\n\n(16a) [convert / will]\n(16b) [complete / should]',
      'answer',E'(16a) will be converted / (16b) should be completed',
      'acceptedAnswers',jsonb_build_array(
        '(16a) will be converted / (16b) should be completed',
        'will be converted / should be completed',
        'will be converted, should be completed'),
      'explanation',E'(16a) 센터는 전환되는 대상 → will be converted\n(16b) 프로젝트는 완료되는 대상 → should be completed'),

    -- ═══════════════════════════════════════════
    -- 어순 배열 (Q17~Q20) ★★★★
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',17,
      'question',E'주어진 단어들을 알맞은 순서로 배열하여 문장을 완성하시오.\n\n이 정보는 허가 없이는 누구와도 공유되어서는 안 된다.\n(anyone / should / not / this information / with / shared / without permission / be)',
      'answer',E'This information should not be shared with anyone without permission.',
      'acceptedAnswers',jsonb_build_array(
        'This information should not be shared with anyone without permission.',
        'This information should not be shared with anyone without permission'),
      'explanation',E'조동사 수동태 부정: 주어 + should not + be + p.p.'),
    jsonb_build_object('number',18,
      'question',E'주어진 단어들을 알맞은 순서로 배열하여 문장을 완성하시오.\n\n그 새로운 교통 규칙은 언제 시행될 예정인가요?\n(enforced / the new traffic rules / when / be / will)',
      'answer',E'When will the new traffic rules be enforced?',
      'acceptedAnswers',jsonb_build_array(
        'When will the new traffic rules be enforced?',
        'When will the new traffic rules be enforced'),
      'explanation',E'의문사 + 조동사 + 주어 + be + p.p.: When will the new traffic rules be enforced?'),
    jsonb_build_object('number',19,
      'question',E'주어진 단어들을 알맞은 순서로 배열하여 문장을 완성하시오.\n\n신선한 농산물은 반드시 서늘하고 건조한 곳에 보관되어야 한다.\n(be / fresh produce / a cool, dry place / must / in / kept)',
      'answer',E'Fresh produce must be kept in a cool, dry place.',
      'acceptedAnswers',jsonb_build_array(
        'Fresh produce must be kept in a cool, dry place.',
        'Fresh produce must be kept in a cool, dry place',
        'Fresh produce must be kept in a cool dry place.',
        'Fresh produce must be kept in a cool dry place'),
      'explanation',E'must + be + p.p.: Fresh produce must be kept in a cool, dry place.'),
    jsonb_build_object('number',20,
      'question',E'주어진 단어들을 알맞은 순서로 배열하여 문장을 완성하시오.\n\n그 회의 장소는 사전 승인 없이는 예약될 수 없다.\n(prior approval / be / the meeting room / reserved / cannot / without)',
      'answer',E'The meeting room cannot be reserved without prior approval.',
      'acceptedAnswers',jsonb_build_array(
        'The meeting room cannot be reserved without prior approval.',
        'The meeting room cannot be reserved without prior approval'),
      'explanation',E'cannot + be + p.p.: The meeting room cannot be reserved without prior approval.'),

    -- ═══════════════════════════════════════════
    -- 조건 영작 (Q21~Q26) ★★★★★
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',21,
      'question',E'주어진 조건에 맞게 우리말을 영작하시오.\n[조건] must 사용 / 수동태 / return, library book, by Friday\n\n도서관 책은 반드시 금요일까지 반납되어야 한다.',
      'answer',E'Library books must be returned by Friday.',
      'acceptedAnswers',jsonb_build_array(
        'Library books must be returned by Friday.',
        'Library books must be returned by Friday',
        'The library books must be returned by Friday.',
        'The library books must be returned by Friday'),
      'explanation',E'must + be + p.p.: Library books must be returned by Friday.'),
    jsonb_build_object('number',22,
      'question',E'주어진 조건에 맞게 우리말을 영작하시오.\n[조건] can 사용 / 수동태 / purchase, ticket, at the entrance\n\n입장권은 입구에서 구매될 수 있다.',
      'answer',E'Tickets can be purchased at the entrance.',
      'acceptedAnswers',jsonb_build_array(
        'Tickets can be purchased at the entrance.',
        'Tickets can be purchased at the entrance'),
      'explanation',E'can + be + p.p.: Tickets can be purchased at the entrance.'),
    jsonb_build_object('number',23,
      'question',E'주어진 조건에 맞게 우리말을 영작하시오.\n[조건] should not 사용 / 수동태 / leave, child, unattended, public place\n\n공공장소에서 어린아이들은 혼자 두어서는 안 된다.',
      'answer',E'Children should not be left unattended in public places.',
      'acceptedAnswers',jsonb_build_array(
        'Children should not be left unattended in public places.',
        'Children should not be left unattended in public places',
        'Children should not be left unattended in a public place.',
        'Children should not be left unattended in a public place'),
      'explanation',E'should not + be + p.p.: Children should not be left unattended in public places.'),
    jsonb_build_object('number',24,
      'question',E'주어진 조건에 맞게 우리말을 영작하시오.\n[조건] will 사용 / 수동태 의문문 / announce, winner, ceremony\n\n수상자들은 시상식에서 발표될 예정인가요?',
      'answer',E'Will the winners be announced at the ceremony?',
      'acceptedAnswers',jsonb_build_array(
        'Will the winners be announced at the ceremony?',
        'Will the winners be announced at the ceremony'),
      'explanation',E'조동사 수동태 의문문: Will + 주어 + be + p.p.'),
    jsonb_build_object('number',25,
      'question',E'주어진 조건에 맞게 우리말을 영작하시오.\n[조건] may not 사용 / 수동태 / extend, the deadline, this time\n\n이번에는 마감 기한이 연장되지 않을 수도 있다.',
      'answer',E'The deadline may not be extended this time.',
      'acceptedAnswers',jsonb_build_array(
        'The deadline may not be extended this time.',
        'The deadline may not be extended this time'),
      'explanation',E'may not + be + p.p.: The deadline may not be extended this time.'),
    jsonb_build_object('number',26,
      'question',E'주어진 조건에 맞게 우리말을 영작하시오.\n[조건] should 사용 / 수동태 / sort, recycle, waste, before\n\n쓰레기는 재활용되기 전에 반드시 분리되어야 한다.',
      'answer',E'Waste should be sorted before it is recycled.',
      'acceptedAnswers',jsonb_build_array(
        'Waste should be sorted before it is recycled.',
        'Waste should be sorted before it is recycled',
        'Waste should be sorted before it can be recycled.',
        'Waste should be sorted before it can be recycled'),
      'explanation',E'should + be + p.p.: Waste should be sorted before it is recycled.'),

    -- ═══════════════════════════════════════════
    -- 실전 영작 (Q27~Q30) ★★★★★
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',27,
      'question',E'다음 우리말을 조건에 맞게 완전한 영어 문장으로 쓰시오.\n[조건: can 포함 수동태]\n\n이 오래된 공장은 지역 문화 센터로 전환될 수 있다.',
      'answer',E'This old factory can be converted into a local cultural center.',
      'acceptedAnswers',jsonb_build_array(
        'This old factory can be converted into a local cultural center.',
        'This old factory can be converted into a local cultural center',
        'The old factory can be converted into a local cultural center.',
        'The old factory can be converted into a local cultural center'),
      'explanation',E'can + be + p.p.: This old factory can be converted into a local cultural center.'),
    jsonb_build_object('number',28,
      'question',E'다음 우리말을 조건에 맞게 완전한 영어 문장으로 쓰시오.\n[조건: must not 포함 수동태]\n\n멸종 위기에 처한 동물들은 어떤 이유로도 사냥되어서는 안 된다.',
      'answer',E'Endangered animals must not be hunted for any reason.',
      'acceptedAnswers',jsonb_build_array(
        'Endangered animals must not be hunted for any reason.',
        'Endangered animals must not be hunted for any reason'),
      'explanation',E'must not + be + p.p.: Endangered animals must not be hunted for any reason.'),
    jsonb_build_object('number',29,
      'question',E'다음 우리말을 조건에 맞게 완전한 영어 문장으로 쓰시오.\n[조건: will 포함 수동태 의문문]\n\n다음 세계 박람회는 어디서 개최될 예정인가요?',
      'answer',E'Where will the next World Expo be held?',
      'acceptedAnswers',jsonb_build_array(
        'Where will the next World Expo be held?',
        'Where will the next World Expo be held'),
      'explanation',E'의문사 + will + 주어 + be + p.p.: Where will the next World Expo be held?'),
    jsonb_build_object('number',30,
      'question',E'다음 글에서 밑줄 친 문장을 수동태로 전환하시오.\n\nOur school is planning a cultural exchange event next month. <u>A local artist will design the main stage backdrop.</u> Students from different classes will perform traditional dances and songs.',
      'answer',E'The main stage backdrop will be designed by a local artist.',
      'acceptedAnswers',jsonb_build_array(
        'The main stage backdrop will be designed by a local artist.',
        'The main stage backdrop will be designed by a local artist'),
      'explanation',E'능동태 → 수동태: 목적어(The main stage backdrop) + will be designed + by 행위자(a local artist)')
  );

  a := jsonb_build_array();

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES (
    E'조동사가 포함된 수동태 Step 3',
    E'조동사가 포함된 수동태',
    q,
    a,
    'problem',
    'interactive'
  );
END $$;
