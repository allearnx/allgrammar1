-- 조동사가 포함된 수동태 Step 2 — 객관식 35문항
-- template_topic: 조동사가 포함된 수동태
-- category: problem, mode: interactive

DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = E'조동사가 포함된 수동태 Step 2';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- 유형 A: 빈칸 선택형 (Q1~Q5)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1,
      'question',E'다음 빈칸에 들어갈 말로 가장 적절한 것은?\n\nAll personal information collected by the app ___ strictly under the new privacy law.',
      'options',jsonb_build_array('must protect','must protected','must be protected','must is protected','must to be protected'),
      'answer','3',
      'explanation',E'주어(All personal information)가 보호받는 대상 → 조동사 수동태: must be protected'),
    jsonb_build_object('number',2,
      'question',E'다음 빈칸에 들어갈 말로 가장 적절한 것은?\n\nThe results of the experiment ___ until all data has been verified by the research team.',
      'options',jsonb_build_array('should not publish','should not be published','should be not published','should not published','should not be publish'),
      'answer','2',
      'explanation',E'조동사 수동태 부정: should not be published. not은 조동사 뒤, be 앞에 위치한다.'),
    jsonb_build_object('number',3,
      'question',E'다음 빈칸 ⓐ, ⓑ에 들어갈 말로 알맞은 것은?\n• The conference room ⓐ___ in advance if you want to use it.\n• The manager ⓑ___ all final decisions at the end of the week.',
      'options',jsonb_build_array(
        'must book — will announce',
        'must be booked — will announce',
        'must be booked — will be announced',
        'must book — will be announced',
        'must be book — will announce'),
      'answer','2',
      'explanation',E'ⓐ 회의실은 예약되는 대상 → must be booked (수동태)\nⓑ 매니저가 결정을 발표하는 주체 → will announce (능동태)'),
    jsonb_build_object('number',4,
      'question',E'다음 빈칸 (A), (B), (C)에 들어갈 말로 가장 적절한 것은?\n• Tickets for the event (A)___ online or at the door.\n• Pets (B)___ inside the venue under any circumstances.\n• All bags (C)___ at the entrance for security purposes.',
      'options',jsonb_build_array(
        'can purchase — must not allow — will be checked',
        'can be purchased — must not be allowed — will be checked',
        'can be purchased — must not allow — will check',
        'can purchase — must not be allowed — will check',
        'can be purchased — must not allowed — will checked'),
      'answer','2',
      'explanation',E'(A) 티켓은 구매되는 대상 → can be purchased\n(B) 반려동물은 허용되는 대상 → must not be allowed\n(C) 가방은 검사되는 대상 → will be checked'),
    jsonb_build_object('number',5,
      'question',E'다음 빈칸에 들어갈 말로 적절하지 않은 것은?\n\nThe old factory _____________ into a community arts center.',
      'options',jsonb_build_array('can be converted','might be converted','should be converted','will be converted','must converted'),
      'answer','5',
      'explanation',E'⑤ must converted → must be converted (be가 빠져 있어 어색하다)'),

    -- ═══════════════════════════════════════════
    -- 유형 B: 동사형태 짝짓기 (Q6~Q10)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',6,
      'question',E'다음 ⓐ~ⓒ의 괄호 안 동사를 알맞은 형태로 바꿀 때, 짝지어진 것으로 옳은 것은?\n• The ancient temple must ⓐ(preserve) for future generations.\n• Our team will ⓑ(announce) the winners at tomorrow''s ceremony.\n• Electronic devices should ⓒ(turn off) before entering the exam hall.',
      'options',jsonb_build_array(
        'be preserved — announce — be turned off',
        'be preserved — announce — turned off',
        'preserved — announcing — be turned off',
        'preserve — be announced — turn off',
        'be preserved — be announced — be turned off'),
      'answer','1',
      'explanation',E'ⓐ 사원은 보존되는 대상 → be preserved\nⓑ 팀이 발표하는 주체 → announce (능동태)\nⓒ 전자기기는 꺼지는 대상 → be turned off'),
    jsonb_build_object('number',7,
      'question',E'다음 ⓐ~ⓒ의 괄호 안 동사를 알맞은 형태로 바꿀 때, 짝지어진 것으로 옳은 것은?\n• The deadline ⓐ(not/extend) under any circumstances.\n• A formal complaint ⓑ(file) with the authorities by the end of this week.\n• Students ⓒ(not/permit) to use their phones during the test.',
      'options',jsonb_build_array(
        'must not be extended — will be filed — must not be permitted',
        'must be not extended — will be filed — must not permit',
        'must not be extended — will file — must not permitted',
        'must not extended — will be filed — must not be permitted',
        'must not be extended — will filed — must not be permitted'),
      'answer','1',
      'explanation',E'ⓐ 마감은 연장되는 대상 + 부정: must not be extended\nⓑ 불만은 제출되는 대상: will be filed\nⓒ 학생들은 허용되는 대상 + 부정: must not be permitted'),
    jsonb_build_object('number',8,
      'question',E'다음 ⓐ~ⓒ의 괄호 안 동사를 알맞은 형태로 바꿀 때, 짝지어진 것으로 옳은 것은?\n• The suspect ⓐ(release) until more evidence is found.\n• The organization will ⓑ(hold) its annual fundraiser next spring.\n• All safety equipment ⓒ(check) before the workers enter the site.',
      'options',jsonb_build_array(
        'can be released — hold — must be checked',
        'cannot be released — hold — must be checked',
        'can release — hold — must be check',
        'cannot release — held — must check',
        'cannot be released — holds — must checked'),
      'answer','2',
      'explanation',E'ⓐ 용의자는 석방되는 대상 + 부정(until = 아직 안 됨): cannot be released\nⓑ 조직이 행사를 개최하는 주체: hold (능동태)\nⓒ 장비는 점검되는 대상: must be checked'),
    jsonb_build_object('number',9,
      'question',E'다음 ⓐ~ⓒ의 괄호 안 동사를 알맞은 형태로 바꿀 때, 짝지어진 것으로 옳은 것은?\n• The new bridge ⓐ(complete) by the construction company next year.\n• Passengers ⓑ(not/allow) to stand in the aisle during takeoff.\n• Children under twelve ⓒ(accompany) by an adult at all times.',
      'options',jsonb_build_array(
        'will complete — must not be allowed — must be accompanied',
        'will be completed — must not allow — must accompanied',
        'will be completed — must not be allowed — must be accompanied',
        'will be completing — must be not allowed — must be accompanied',
        'will be completed — must not be allowed — must accompany'),
      'answer','3',
      'explanation',E'ⓐ 다리는 완공되는 대상: will be completed\nⓑ 승객은 허용되는 대상 + 부정: must not be allowed\nⓒ 아이들은 동반되는 대상: must be accompanied'),
    jsonb_build_object('number',10,
      'question',E'다음 ⓐ~ⓒ의 괄호 안 동사를 알맞은 형태로 바꿀 때, 짝지어진 것으로 옳은 것은?\n• The winners ⓐ(notify) by email within three business days.\n• You ⓑ(must/return) your library books before the due date.\n• The damaged road ⓒ(repair) before the rainy season begins.',
      'options',jsonb_build_array(
        'will notified — must return — should be repaired',
        'will be notified — must return — should be repaired',
        'will be notified — must be returned — should repair',
        'will be notify — must return — should be repaired',
        'will be notified — must returned — should be repaired'),
      'answer','2',
      'explanation',E'ⓐ 수상자는 통보받는 대상: will be notified\nⓑ You가 책을 반납하는 주체: must return (능동태)\nⓒ 도로는 수리되는 대상: should be repaired'),

    -- ═══════════════════════════════════════════
    -- 유형 C: 영작 선택 (Q11~Q15)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',11,
      'question',E'다음 우리말을 바르게 영작한 것은?\n\n이 약은 식후에 복용되어야 한다.',
      'options',jsonb_build_array(
        'This medicine should taken after meals.',
        'This medicine should be not taken after meals.',
        'This medicine should takes after meals.',
        'This medicine should be taken after meals.',
        'This medicine should is taken after meals.'),
      'answer','4',
      'explanation',E'should + be + p.p.: This medicine should be taken after meals.'),
    jsonb_build_object('number',12,
      'question',E'다음 우리말을 바르게 영작한 것은?\n\n쓰레기는 어떤 상황에서도 길거리에 버려져서는 안 된다.',
      'options',jsonb_build_array(
        'Trash must not throw on the street under any circumstances.',
        'Trash must not be thrown on the street under any circumstances.',
        'Trash must be not thrown on the street under any circumstances.',
        'Trash must thrown not on the street under any circumstances.',
        'Trash must not be throw on the street under any circumstances.'),
      'answer','2',
      'explanation',E'must not + be + p.p.: Trash must not be thrown on the street.'),
    jsonb_build_object('number',13,
      'question',E'다음 우리말을 바르게 영작한 것은?\n\n그 역사적인 건물은 정부에 의해 보존될 수 있다.',
      'options',jsonb_build_array(
        'The historic building can preserve by the government.',
        'The historic building can preserved by the government.',
        'The historic building can be preserved by the government.',
        'The historic building can be preserve by the government.',
        'The government can be preserved the historic building.'),
      'answer','3',
      'explanation',E'can + be + p.p.: The historic building can be preserved by the government.'),
    jsonb_build_object('number',14,
      'question',E'다음 우리말을 바르게 영작한 것은?\n\n다음 올림픽은 어디서 개최될 예정인가요?',
      'options',jsonb_build_array(
        'Where the next Olympics will be held?',
        'Where will the next Olympics held?',
        'Where will be held the next Olympics?',
        'Where will the next Olympics be held?',
        'Where the next Olympics will held?'),
      'answer','4',
      'explanation',E'의문사 + 조동사 + 주어 + be + p.p.: Where will the next Olympics be held?'),
    jsonb_build_object('number',15,
      'question',E'다음 우리말을 바르게 영작한 것은?\n\n이 자전거는 어둠 속에서도 볼 수 있다.',
      'options',jsonb_build_array(
        'This bicycle can see in the dark.',
        'This bicycle cannot be seen in the dark.',
        'This bicycle can be seen in the dark.',
        'This bicycle could seen in the dark.',
        'This bicycle can seen be in the dark.'),
      'answer','3',
      'explanation',E'자전거는 보이는 대상 → can + be + p.p.: This bicycle can be seen in the dark.'),

    -- ═══════════════════════════════════════════
    -- 유형 D-1: 어법상 어색한 것 (Q16~Q19)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',16,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'The contract must be signed by both parties before the deal is finalized.',
        'The broken window should be not replaced until the insurance claim is approved.',
        'Volunteers can be registered on the organization''s official website.',
        'The proposal might be rejected if it doesn''t meet the required standards.',
        'All participants will be notified of the results within one week.'),
      'answer','2',
      'explanation',E'② should be not replaced → should not be replaced (not은 조동사 뒤, be 앞에 온다)'),
    jsonb_build_object('number',17,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'Homework assignments must hand in by the end of the class.',
        'Safety goggles should be worn at all times in the laboratory.',
        'The packages will be delivered to your address by Friday afternoon.',
        'Mobile phones must not be used during the examination.',
        'The application form may be downloaded from the school website.'),
      'answer','1',
      'explanation',E'① must hand in → must be handed in (숙제는 제출되는 대상 → 수동태 필요)'),
    jsonb_build_object('number',18,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'The rules of the competition must be followed by all participants.',
        'The venue for the graduation ceremony has not been confirmed yet.',
        'Children should be not left alone in the car, even for a short time.',
        'The new software update may be installed on compatible devices only.',
        'Stray animals in this area can be reported to the local animal shelter.'),
      'answer','3',
      'explanation',E'③ should be not left → should not be left (not은 조동사 뒤, be 앞에 온다)'),
    jsonb_build_object('number',19,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'The issue will be addressed at the next board meeting.',
        'Fresh produce must store in a cool, dry place to prevent spoilage.',
        'The championship game might be postponed due to the severe weather.',
        'Important documents should not be shared with unauthorized individuals.',
        'The bridge may be closed for maintenance during the winter months.'),
      'answer','2',
      'explanation',E'② must store → must be stored (신선식품은 보관되는 대상 → 수동태 필요)'),

    -- ═══════════════════════════════════════════
    -- 유형 D-2: 어법상 옳은 것 (Q20~Q23)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',20,
      'question',E'다음 중 어법상 옳은 것은?',
      'options',jsonb_build_array(
        'The conference will hold in Seoul next autumn.',
        'The survey results must be not released to the public.',
        'The students should informed of any changes to the schedule.',
        'These seats can reserved through the official website only.',
        'The injured hiker could be rescued by the mountain rescue team.'),
      'answer','5',
      'explanation',E'⑤ could be rescued — 올바른 조동사 수동태\n① will hold → will be held\n② must be not → must not be\n③ should informed → should be informed\n④ can reserved → can be reserved'),
    jsonb_build_object('number',21,
      'question',E'다음 중 어법상 옳은 것은?',
      'options',jsonb_build_array(
        'The famous painting might steal from the museum overnight.',
        'The event will be not canceled even if it rains heavily.',
        'These chemicals should handle with extreme care at all times.',
        'Visitors must not be entered the restricted zone without permission.',
        'The samples must be kept at a temperature below minus ten degrees.'),
      'answer','5',
      'explanation',E'⑤ must be kept — 올바른 조동사 수동태\n① might steal → might be stolen\n② will be not → will not be\n③ should handle → should be handled\n④ must not be entered → must not enter (visitors가 주체)'),
    jsonb_build_object('number',22,
      'question',E'다음 중 어법상 옳은 것은?',
      'options',jsonb_build_array(
        'This form must filled out completely before submission.',
        'The new traffic regulations will be enforce starting next month.',
        'A refund can not be issued after thirty days of purchase.',
        'The children''s playground should be inspected regularly for safety.',
        'Your passport must be renewed before it can used for travel.'),
      'answer','4',
      'explanation',E'④ should be inspected — 올바른 조동사 수동태\n① must filled → must be filled\n② will be enforce → will be enforced\n③ can not be → cannot be\n⑤ can used → can be used'),
    jsonb_build_object('number',23,
      'question',E'다음 중 어법상 옳은 것은?',
      'options',jsonb_build_array(
        'The missing child will be found by the police soon.',
        'The deadline might extended by another week if needed.',
        'The old hospital will demolish to build a new shopping center.',
        'Noise must not be made be after ten o''clock in this building.',
        'All passengers should fasten their seatbelts be during turbulence.'),
      'answer','1',
      'explanation',E'① will be found — 올바른 조동사 수동태\n② might extended → might be extended\n③ will demolish → will be demolished\n④ be made be → be made (be 중복)\n⑤ seatbelts be → seatbelts (be 불필요)'),

    -- ═══════════════════════════════════════════
    -- 유형 E: 복수정답·고급형 (Q24~Q28)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',24,
      'type','select_all',
      'question',E'다음 중 어법상 어색한 것을 모두 고르면?',
      'options',jsonb_build_array(
        'The safety instructions must be followed at all times on the construction site.',
        'The meeting room can be not reserved without prior approval from management.',
        'Donations may be made online, by phone, or at any branch location.',
        'These fragile items should wrapped carefully before being shipped.',
        'The renovation project will be completed by the end of the year.'),
      'answer',jsonb_build_array('2','4'),
      'explanation',E'② can be not reserved → cannot be reserved (not 위치 오류)\n④ should wrapped → should be wrapped (be 빠짐)'),
    jsonb_build_object('number',25,
      'type','select_all',
      'question',E'다음 중 어법상 어색한 것을 모두 고르면?\nⓐ The suspect might be released on bail pending the investigation.\nⓑ All windows and doors must be not locked when leaving the building.\nⓒ The presentation slides should be reviewed before the meeting begins.\nⓓ The school gym can used for community events on weekends.\nⓔ The package will be delivered to the wrong address if you don''t check.',
      'options',jsonb_build_array('ⓐ, ⓒ','ⓑ, ⓓ','ⓐ, ⓔ','ⓒ, ⓓ','ⓑ, ⓔ'),
      'answer','2',
      'explanation',E'ⓑ must be not locked → must not be locked (not 위치 오류)\nⓓ can used → can be used (be 빠짐)'),
    jsonb_build_object('number',26,
      'question',E'다음 중 어법상 옳은 문장끼리 알맞게 짝지어진 것은?\nⓐ The antique vase should be handle with extreme care.\nⓑ The winners of the competition will be announced on Friday.\nⓒ All food in the cafeteria must be not wasted unnecessarily.\nⓓ The old factory might be converted into a cultural center.\nⓔ Participants can registered for the workshop on the official website.\nⓕ Dangerous chemicals must not be stored near flammable materials.',
      'options',jsonb_build_array('ⓐ, ⓑ','ⓑ, ⓓ','ⓑ, ⓓ, ⓕ','ⓐ, ⓒ, ⓓ','ⓑ, ⓓ, ⓔ, ⓕ'),
      'answer','3',
      'explanation',E'ⓑ will be announced ✓\nⓓ might be converted ✓\nⓕ must not be stored ✓\nⓐ be handle → be handled\nⓒ must be not → must not be\nⓔ can registered → can be registered'),
    jsonb_build_object('number',27,
      'question',E'다음 글의 밑줄 친 부분 중 어법상 어색한 것의 총 개수는?\n\nStarting next semester, all students <u>①will require</u> to wear uniforms. Smartphones <u>②must not be used</u> during class hours. Any student who wishes to bring a guest on campus <u>③must be submitted</u> a written request one week in advance. Lockers <u>④should be cleaned</u> out at the end of each term. Lost items <u>⑤can be claimed</u> at the main office within thirty days.',
      'options',jsonb_build_array('1개','2개','3개','4개','5개'),
      'answer','2',
      'explanation',E'① will require → will be required (학생들은 요구받는 대상 → 수동태)\n③ must be submitted → must submit (학생이 제출하는 주체 → 능동태)\n②④⑤는 올바른 수동태'),
    jsonb_build_object('number',28,
      'question',E'다음 중 어법상 어색한 문장의 총 개수는?\nⓐ The application must be submitted before the deadline.\nⓑ The new highway will complete by the end of next year.\nⓒ Visitors should be not allowed to photograph the exhibits.\nⓓ The contract may be reviewed by a legal team before signing.\nⓔ These instructions must followed carefully to avoid accidents.\nⓕ The stolen artwork might be recovered by the police.',
      'options',jsonb_build_array('1개','2개','3개','4개','5개'),
      'answer','3',
      'explanation',E'ⓑ will complete → will be completed (be 빠짐)\nⓒ should be not allowed → should not be allowed (not 위치 오류)\nⓔ must followed → must be followed (be 빠짐)\nⓐⓓⓕ는 올바른 수동태'),

    -- ═══════════════════════════════════════════
    -- 유형 F: 지문형 빈칸 (Q29~Q32)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',29,
      'question',E'[29~30] 다음 글을 읽고 물음에 답하시오.\n\nThe city council has announced a major renovation plan for the downtown area. According to the plan, all historic buildings (A)___ to preserve the city''s cultural heritage. New bicycle lanes (B)___ along the main roads to encourage eco-friendly transportation. Citizens are invited to share their opinions before the final plan is approved.\n\n빈칸 (A)에 들어갈 말로 가장 적절한 것은?',
      'options',jsonb_build_array('must restore','must restored','must be restored','must restoring','must be restore'),
      'answer','3',
      'explanation',E'역사적 건물은 복원되는 대상 → must be restored'),
    jsonb_build_object('number',30,
      'question',E'[29~30] 다음 글을 읽고 물음에 답하시오.\n\nThe city council has announced a major renovation plan for the downtown area. According to the plan, all historic buildings (A)___ to preserve the city''s cultural heritage. New bicycle lanes (B)___ along the main roads to encourage eco-friendly transportation. Citizens are invited to share their opinions before the final plan is approved.\n\n빈칸 (B)에 들어갈 말로 가장 적절한 것은?',
      'options',jsonb_build_array('will install','will be installed','will installing','will installed','will be install'),
      'answer','2',
      'explanation',E'자전거 도로는 설치되는 대상 → will be installed'),
    jsonb_build_object('number',31,
      'question',E'[31~32] 다음 대화를 읽고 물음에 답하시오.\n\nJiyeon: Did you hear about the school festival next month?\nMinho: Yes! I heard the main stage (A)___ by the drama club. They''ve been preparing for weeks.\nJiyeon: That''s exciting. By the way, I heard food stalls (B)___ outside the gym area this year.\nMinho: Really? That sounds like fun. I hope the weather is good.\n\n빈칸 (A)에 들어갈 말로 가장 적절한 것은?',
      'options',jsonb_build_array('will decorate','will decorated','will be decorated','will be decorate','will decorating'),
      'answer','3',
      'explanation',E'무대는 장식되는 대상 → will be decorated'),
    jsonb_build_object('number',32,
      'question',E'[31~32] 다음 대화를 읽고 물음에 답하시오.\n\nJiyeon: Did you hear about the school festival next month?\nMinho: Yes! I heard the main stage (A)___ by the drama club. They''ve been preparing for weeks.\nJiyeon: That''s exciting. By the way, I heard food stalls (B)___ outside the gym area this year.\nMinho: Really? That sounds like fun. I hope the weather is good.\n\n빈칸 (B)에 들어갈 말로 가장 적절한 것은?',
      'options',jsonb_build_array('will be set up','will set up','will be setting up','will set','will be setup'),
      'answer','1',
      'explanation',E'음식 부스는 설치되는 대상 → will be set up (동사구 set up 통째로 수동태 처리)'),

    -- ═══════════════════════════════════════════
    -- 유형 G: 전환 오류 찾기 (Q33~Q35)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',33,
      'question',E'다음 능동태 문장을 수동태로 전환했을 때 어색한 것은?\n① The company will launch a new product next spring.\n→ A new product will be launched by the company next spring.\n② You must not leave your bike in front of the entrance.\n→ Your bike must not be left in front of the entrance.\n③ Can they deliver the order by tomorrow morning?\n→ Can the order be delivered by tomorrow morning?\n④ Someone might have stolen the painting during the night.\n→ The painting might be stolen during the night by someone.\n⑤ The government should address this issue immediately.\n→ This issue should be addressed by the government immediately.',
      'options',jsonb_build_array('①','②','③','④','⑤'),
      'answer','4',
      'explanation',E'④ might have stolen(완료형) → 수동태는 might have been stolen이어야 한다. might be stolen은 단순 수동태로 시제가 달라진다.'),
    jsonb_build_object('number',34,
      'question',E'다음 중 두 문장의 뜻이 서로 같지 않은 것은?\n① People should recycle plastic bottles.\n= Plastic bottles should be recycled.\n② They will announce the results tomorrow.\n= The results will be announced tomorrow.\n③ You must not park here after six o''clock.\n= Parking here must not be allowed after six o''clock.\n④ A doctor must examine the patient right away.\n= The patient must be examined by a doctor right away.\n⑤ The school may cancel the field trip due to the weather.\n= The field trip may be canceled by the school due to the weather.',
      'options',jsonb_build_array('①','②','③','④','⑤'),
      'answer','3',
      'explanation',E'③ 원문: "주차하면 안 된다" (행위 금지) / 전환문: "주차가 허용되어서는 안 된다" (허용 금지) → 의미가 미묘하게 다르다. 정확한 수동태는 "Here must not be parked after six o''clock."'),
    jsonb_build_object('number',35,
      'question',E'다음 중 수동태 전환이 어색한 것은?\n① We should protect endangered animals.\n→ Endangered animals should be protected.\n② They might discover a new planet soon.\n→ A new planet might be discovered soon.\n③ The committee will select three finalists.\n→ Three finalists will be selected by the committee.\n④ You must hand in the report by Monday.\n→ The report must be handed in by Monday.\n⑤ He will teach us English grammar next semester.\n→ English grammar will be taught us by him next semester.',
      'options',jsonb_build_array('①','②','③','④','⑤'),
      'answer','5',
      'explanation',E'⑤ will be taught us → will be taught to us (4형식→수동태 시 간접목적어 앞에 전치사 to 필요) 또는 We will be taught English grammar by him.')
  );

  a := jsonb_build_array();

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES (
    E'조동사가 포함된 수동태 Step 2',
    E'조동사가 포함된 수동태',
    q,
    a,
    'problem',
    'interactive'
  );
END $$;
