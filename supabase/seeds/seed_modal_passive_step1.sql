-- 조동사가 포함된 수동태 Step 1 — 55문항 (60 answer items)
-- template_topic: 조동사가 포함된 수동태
-- category: problem, mode: interactive

DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = E'조동사가 포함된 수동태 Step 1';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- Warm-up: 2지선다 MCQ (Q1~Q10)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1,
      'question',E'[Warm-up] 알맞은 것을 고르시오.\n\nThis bridge can ___ by pedestrians only.',
      'options',jsonb_build_array('use','be used'),
      'answer','2',
      'explanation',E'주어(This bridge)가 행위의 대상 → 수동태 can be used'),
    jsonb_build_object('number',2,
      'question',E'알맞은 것을 고르시오.\n\nThe deadline must ___ under any circumstances.',
      'options',jsonb_build_array('not be missed','be not missed'),
      'answer','1',
      'explanation',E'조동사 수동태 부정문: 조동사 + not + be + p.p.'),
    jsonb_build_object('number',3,
      'question',E'알맞은 것을 고르시오.\n\nStudents should ___ their reports by Friday.',
      'options',jsonb_build_array('submit','be submitted'),
      'answer','1',
      'explanation',E'students가 행위의 주체 → 능동태 should submit'),
    jsonb_build_object('number',4,
      'question',E'알맞은 것을 고르시오.\n\nWild animals should ___ in their natural habitat.',
      'options',jsonb_build_array('not disturb','not be disturbed'),
      'answer','2',
      'explanation',E'wild animals가 행위의 대상 → should not be disturbed'),
    jsonb_build_object('number',5,
      'question',E'알맞은 것을 고르시오.\n\nThe new policy will ___ at tomorrow''s meeting.',
      'options',jsonb_build_array('announce','be announced'),
      'answer','2',
      'explanation',E'the new policy가 행위의 대상 → 수동태 will be announced'),
    jsonb_build_object('number',6,
      'question',E'알맞은 것을 고르시오.\n\nYou can ___ the library''s digital resources from home.',
      'options',jsonb_build_array('access','be accessed'),
      'answer','1',
      'explanation',E'you가 행위의 주체 → 능동태 can access'),
    jsonb_build_object('number',7,
      'question',E'알맞은 것을 고르시오.\n\nThe injured player may ___ off the field by the medical team.',
      'options',jsonb_build_array('carry','be carried'),
      'answer','2',
      'explanation',E'the injured player가 행위의 대상 → 수동태 may be carried'),
    jsonb_build_object('number',8,
      'question',E'알맞은 것을 고르시오.\n\nThis medicine must ___ twice a day after meals.',
      'options',jsonb_build_array('take','be taken'),
      'answer','2',
      'explanation',E'this medicine가 행위의 대상 → 수동태 must be taken'),
    jsonb_build_object('number',9,
      'question',E'알맞은 것을 고르시오.\n\nThe company might ___ its new product next spring.',
      'options',jsonb_build_array('launch','be launched'),
      'answer','1',
      'explanation',E'the company가 행위의 주체 → 능동태 might launch'),
    jsonb_build_object('number',10,
      'question',E'알맞은 것을 고르시오.\n\nAll personal data will ___ under the new privacy law.',
      'options',jsonb_build_array('protect','be protected'),
      'answer','2',
      'explanation',E'all personal data가 행위의 대상 → 수동태 will be protected'),

    -- ═══════════════════════════════════════════
    -- Part 1: 능동→수동 전환 서술형 (Q11~Q20)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',11,
      'question',E'[Part 1] 두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nWe can recycle these plastic bottles.\n→ These plastic bottles ___ ___ ___.',
      'answer',E'can be recycled',
      'acceptedAnswers',jsonb_build_array(),
      'explanation',E'능동→수동: can recycle → can be recycled'),
    jsonb_build_object('number',12,
      'question',E'두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nThe city should repair the broken road immediately.\n→ The broken road ___ ___ ___ by the city immediately.',
      'answer',E'should be repaired',
      'acceptedAnswers',jsonb_build_array(),
      'explanation',E'능동→수동: should repair → should be repaired'),
    jsonb_build_object('number',13,
      'question',E'두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nScientists will discover new solutions to climate change.\n→ New solutions to climate change ___ ___ ___ by scientists.',
      'answer',E'will be discovered',
      'acceptedAnswers',jsonb_build_array(),
      'explanation',E'능동→수동: will discover → will be discovered'),
    jsonb_build_object('number',14,
      'question',E'두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nYou must not park your car in front of the hospital.\n→ Your car ___ ___ ___ ___ in front of the hospital.',
      'answer',E'must not be parked',
      'acceptedAnswers',jsonb_build_array(),
      'explanation',E'능동→수동 부정: must not park → must not be parked'),
    jsonb_build_object('number',15,
      'question',E'두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nThe government may introduce stricter environmental regulations.\n→ Stricter environmental regulations ___ ___ ___ by the government.',
      'answer',E'may be introduced',
      'acceptedAnswers',jsonb_build_array(),
      'explanation',E'능동→수동: may introduce → may be introduced'),
    jsonb_build_object('number',16,
      'question',E'두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nCould the students finish the project in one week?\n→ (1)___ the project (2)___ ___ by the students in one week?',
      'answer',E'Could / be finished',
      'acceptedAnswers',jsonb_build_array(),
      'explanation',E'능동→수동 의문문: Could ~ finish → Could ~ be finished',
      'subParts',jsonb_build_array(
        jsonb_build_object('label','(1)','answer','Could','acceptedAnswers',jsonb_build_array()),
        jsonb_build_object('label','(2)','answer','be finished','acceptedAnswers',jsonb_build_array())
      )),
    jsonb_build_object('number',17,
      'question',E'두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nPeople should not throw trash on the street.\n→ Trash ___ ___ ___ ___ on the street.',
      'answer',E'should not be thrown',
      'acceptedAnswers',jsonb_build_array(),
      'explanation',E'능동→수동 부정: should not throw → should not be thrown'),
    jsonb_build_object('number',18,
      'question',E'두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nA famous architect will design the new library.\n→ The new library ___ ___ ___ by a famous architect.',
      'answer',E'will be designed',
      'acceptedAnswers',jsonb_build_array(),
      'explanation',E'능동→수동: will design → will be designed'),
    jsonb_build_object('number',19,
      'question',E'두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nWill they hold the ceremony indoors?\n→ (1)___ the ceremony (2)___ ___ indoors?',
      'answer',E'Will / be held',
      'acceptedAnswers',jsonb_build_array(),
      'explanation',E'능동→수동 의문문: Will ~ hold → Will ~ be held',
      'subParts',jsonb_build_array(
        jsonb_build_object('label','(1)','answer','Will','acceptedAnswers',jsonb_build_array()),
        jsonb_build_object('label','(2)','answer','be held','acceptedAnswers',jsonb_build_array())
      )),
    jsonb_build_object('number',20,
      'question',E'두 문장이 같은 뜻이 되도록 빈칸을 채우시오.\n\nVolunteers might plant hundreds of trees this weekend.\n→ Hundreds of trees ___ ___ ___ by volunteers this weekend.',
      'answer',E'might be planted',
      'acceptedAnswers',jsonb_build_array(),
      'explanation',E'능동→수동: might plant → might be planted'),

    -- ═══════════════════════════════════════════
    -- Part 2: 5지선다 MCQ (Q21~Q30)
    -- ═══════════════════════════════════════════

    -- 어법상 틀린 것 고르기 (Q21~Q25)
    jsonb_build_object('number',21,
      'question',E'[Part 2] 어법상 틀린 것을 고르시오.',
      'options',jsonb_build_array(
        'These documents can be printed at the library.',
        'The old building should not be demolished.',
        'All packages will be delivered by tomorrow morning.',
        'The report may be submitted online or by mail.',
        'The concert tickets must purchased in advance.'
      ),
      'answer','5',
      'explanation',E'must purchased → must be purchased (조동사 + be + p.p. 형태 필수)'),
    jsonb_build_object('number',22,
      'question',E'어법상 틀린 것을 고르시오.',
      'options',jsonb_build_array(
        'Students must complete the survey by Monday.',
        'The broken equipment will be not repaired until next week.',
        'Wild dolphins can be seen near the coast in summer.',
        'The medicine should be taken with a full glass of water.',
        'New traffic rules may be introduced next year.'
      ),
      'answer','2',
      'explanation',E'will be not repaired → will not be repaired (부정문: 조동사 + not + be + p.p.)'),
    jsonb_build_object('number',23,
      'question',E'어법상 틀린 것을 고르시오.',
      'options',jsonb_build_array(
        'The application form can filled out online or in person.',
        'The winner will be announced at the end of the ceremony.',
        'Passengers should fasten their seatbelts at all times.',
        'Pets must not be left alone in hot cars.',
        'The bridge might be closed for repairs next month.'
      ),
      'answer','1',
      'explanation',E'can filled out → can be filled out (조동사 + be + p.p. 형태 필수)'),
    jsonb_build_object('number',24,
      'question',E'어법상 틀린 것을 고르시오.',
      'options',jsonb_build_array(
        'The new policy should not be enforced without proper notice.',
        'These shoes can be worn in both indoor and outdoor settings.',
        'The suspect might be released if there is no evidence.',
        'All visitors must be register at the front desk upon arrival.',
        'The letter will be sent by express delivery.'
      ),
      'answer','4',
      'explanation',E'must be register → must be registered (be 뒤에 반드시 p.p.)'),
    jsonb_build_object('number',25,
      'question',E'어법상 틀린 것을 고르시오.',
      'options',jsonb_build_array(
        'The trash should be sorted before it can be recycled.',
        'The results of the experiment could not be ignored.',
        'The project will complete by the end of the month.',
        'This button must not be pressed under any circumstances.',
        'The stray cats may be adopted from the local shelter.'
      ),
      'answer','3',
      'explanation',E'will complete → will be completed (the project는 행위의 대상 → 수동태 필요)'),

    -- 어법상 옳은 것 고르기 (Q26~Q30)
    jsonb_build_object('number',26,
      'question',E'어법상 옳은 것을 고르시오.',
      'options',jsonb_build_array(
        'The homework should finished before you go to bed.',
        'The museum can be visited free of charge on Sundays.',
        'This song can be not downloaded for free anymore.',
        'The package will delivered to your address by Friday.',
        'All students must completed the online safety course.'
      ),
      'answer','2',
      'explanation',E'can be visited 올바른 형태 (조동사 + be + p.p.)'),
    jsonb_build_object('number',27,
      'question',E'어법상 옳은 것을 고르시오.',
      'options',jsonb_build_array(
        'The files can copied to the USB drive.',
        'New employees should given a training session.',
        'The fence will be paint by the end of the week.',
        'This form must filled out in black ink only.',
        'The deadline may not be extended this time.'
      ),
      'answer','5',
      'explanation',E'may not be extended 올바른 형태 (부정문 어순 올바름)'),
    jsonb_build_object('number',28,
      'question',E'어법상 옳은 것을 고르시오.',
      'options',jsonb_build_array(
        'The injured athlete could not be moved carefully.',
        'All food waste should be sort before disposal.',
        'The announcement will be made at noon tomorrow.',
        'The car can be not driven without a valid license.',
        'Students must submitting their essays by midnight.'
      ),
      'answer','3',
      'explanation',E'will be made 올바른 형태 (조동사 + be + p.p.)'),
    jsonb_build_object('number',29,
      'question',E'어법상 옳은 것을 고르시오.',
      'options',jsonb_build_array(
        'All participants should registers their names online.',
        'The parcel might delivered to the wrong address.',
        'The building will be not demolished until next year.',
        'The windows must not be opened during the flight.',
        'The medicine can taken without a doctor''s prescription.'
      ),
      'answer','4',
      'explanation',E'must not be opened 올바른 형태 (부정문 어순 올바름)'),
    jsonb_build_object('number',30,
      'question',E'어법상 옳은 것을 고르시오.',
      'options',jsonb_build_array(
        'All electronic devices must be turned off during takeoff.',
        'The report should submitted to the office by Monday.',
        'The road may be not repaired until spring arrives.',
        'The children might frightened by the loud noise.',
        'These plants should water twice a week in summer.'
      ),
      'answer','1',
      'explanation',E'must be turned off 올바른 형태 (조동사 + be + p.p.)'),

    -- ═══════════════════════════════════════════
    -- Part 3: 오류 수정 서술형 (Q31~Q40)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',31,
      'question',E'[Part 3] 문법적 오류를 찾아 고치시오. 오류가 없으면 "No error"라고 쓰시오.\n\nThe final results will announced by the committee next Friday.',
      'answer',E'The final results will be announced by the committee next Friday.',
      'acceptedAnswers',jsonb_build_array('will announced → will be announced','will be announced'),
      'explanation',E'will announced → will be announced (be 빠짐)'),
    jsonb_build_object('number',32,
      'question',E'문법적 오류를 찾아 고치시오. 오류가 없으면 "No error"라고 쓰시오.\n\nVisitors must not be entered the restricted area without a permit.',
      'answer',E'Visitors must not enter the restricted area without a permit.',
      'acceptedAnswers',jsonb_build_array('must not be entered → must not enter','must not enter'),
      'explanation',E'must not be entered → must not enter (visitors가 행위의 주체 → 능동태)'),
    jsonb_build_object('number',33,
      'question',E'문법적 오류를 찾아 고치시오. 오류가 없으면 "No error"라고 쓰시오.\n\nThe school''s heating system should be checked before winter begins.',
      'answer',E'No error',
      'acceptedAnswers',jsonb_build_array('no error'),
      'explanation',E'should be checked 올바른 수동태 형태'),
    jsonb_build_object('number',34,
      'question',E'문법적 오류를 찾아 고치시오. 오류가 없으면 "No error"라고 쓰시오.\n\nAll mobile phones must be not switched on inside the examination hall.',
      'answer',E'All mobile phones must not be switched on inside the examination hall.',
      'acceptedAnswers',jsonb_build_array('must be not switched on → must not be switched on','must not be switched on'),
      'explanation',E'must be not → must not be (부정문 어순: 조동사 + not + be + p.p.)'),
    jsonb_build_object('number',35,
      'question',E'문법적 오류를 찾아 고치시오. 오류가 없으면 "No error"라고 쓰시오.\n\nThe bridge can be cross by cyclists and pedestrians during the festival.',
      'answer',E'The bridge can be crossed by cyclists and pedestrians during the festival.',
      'acceptedAnswers',jsonb_build_array('can be cross → can be crossed','can be crossed','crossed'),
      'explanation',E'can be cross → can be crossed (be 뒤에 반드시 p.p.)'),
    jsonb_build_object('number',36,
      'question',E'문법적 오류를 찾아 고치시오. 오류가 없으면 "No error"라고 쓰시오.\n\nNew safety regulations may be introduced in workplaces across the country.',
      'answer',E'No error',
      'acceptedAnswers',jsonb_build_array('no error'),
      'explanation',E'may be introduced 올바른 수동태 형태'),
    jsonb_build_object('number',37,
      'question',E'문법적 오류를 찾아 고치시오. 오류가 없으면 "No error"라고 쓰시오.\n\nThis equipment should handle with care to prevent damage.',
      'answer',E'This equipment should be handled with care to prevent damage.',
      'acceptedAnswers',jsonb_build_array('should handle → should be handled','should be handled'),
      'explanation',E'should handle → should be handled (this equipment가 행위의 대상 → 수동태)'),
    jsonb_build_object('number',38,
      'question',E'문법적 오류를 찾아 고치시오. 오류가 없으면 "No error"라고 쓰시오.\n\nThe concert tickets could not be reserved online due to a system error.',
      'answer',E'No error',
      'acceptedAnswers',jsonb_build_array('no error'),
      'explanation',E'could not be reserved 올바른 수동태 부정 형태'),
    jsonb_build_object('number',39,
      'question',E'문법적 오류를 찾아 고치시오. 오류가 없으면 "No error"라고 쓰시오.\n\nAll waste materials will be separate and recycled at the new facility.',
      'answer',E'All waste materials will be separated and recycled at the new facility.',
      'acceptedAnswers',jsonb_build_array('will be separate → will be separated','will be separated','separated'),
      'explanation',E'will be separate → will be separated (be 뒤에 반드시 p.p.)'),
    jsonb_build_object('number',40,
      'question',E'문법적 오류를 찾아 고치시오. 오류가 없으면 "No error"라고 쓰시오.\n\nThe city''s oldest market might demolish to make way for a new shopping center.',
      'answer',E'The city''s oldest market might be demolished to make way for a new shopping center.',
      'acceptedAnswers',jsonb_build_array('might demolish → might be demolished','might be demolished'),
      'explanation',E'might demolish → might be demolished (the market가 행위의 대상 → 수동태)'),

    -- ═══════════════════════════════════════════
    -- Part 4: 단락·대화문 빈칸 + subParts (Q41~Q43)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',41,
      'question',E'[Part 4] 괄호 안의 동사를 조동사와 함께 알맞은 수동태 형태로 빈칸에 쓰시오.\n\nOur city has launched a new environmental campaign. Starting next month, single-use plastic bags (A)___ (ban) in all supermarkets. Citizens are encouraged to bring reusable bags instead. Food waste (B)___ (collect) separately every Tuesday and Thursday. In addition, all parks and public spaces (C)___ (clean) more frequently by environmental volunteers. The mayor stated that these measures (D)___ (maintain) for at least five years.',
      'answer',E'will be banned / will be collected / will be cleaned / will be maintained',
      'acceptedAnswers',jsonb_build_array(),
      'explanation',E'(A) ban → will be banned. (B) collect → will be collected. (C) clean → will be cleaned. (D) maintain → will be maintained',
      'subParts',jsonb_build_array(
        jsonb_build_object('label','(A)','answer','will be banned','acceptedAnswers',jsonb_build_array()),
        jsonb_build_object('label','(B)','answer','will be collected','acceptedAnswers',jsonb_build_array()),
        jsonb_build_object('label','(C)','answer','will be cleaned','acceptedAnswers',jsonb_build_array()),
        jsonb_build_object('label','(D)','answer','will be maintained','acceptedAnswers',jsonb_build_array())
      )),
    jsonb_build_object('number',42,
      'question',E'괄호 안의 동사를 조동사와 함께 알맞은 수동태 형태로 빈칸에 쓰시오.\n\nOur school has updated its rules for the new semester. First, all student ID cards (A)___ (replace) with new digital cards. Students are reminded that electronic devices (B)___ (not / use) in classrooms without the teacher''s permission. Also, all homework assignments (C)___ (submit) through the school''s online platform from now on.',
      'answer',E'will be replaced / must not be used / must be submitted',
      'acceptedAnswers',jsonb_build_array(),
      'explanation',E'(A) replace → will be replaced. (B) not use → must not be used. (C) submit → must be submitted',
      'subParts',jsonb_build_array(
        jsonb_build_object('label','(A)','answer','will be replaced','acceptedAnswers',jsonb_build_array()),
        jsonb_build_object('label','(B)','answer','must not be used','acceptedAnswers',jsonb_build_array('should not be used')),
        jsonb_build_object('label','(C)','answer','must be submitted','acceptedAnswers',jsonb_build_array('should be submitted'))
      )),
    jsonb_build_object('number',43,
      'question',E'괄호 안의 동사를 조동사와 함께 알맞은 수동태 형태로 빈칸에 쓰시오.\n\nMina: Did you hear about the school festival?\nJunho: Yes! I heard all the decorations (A)___ (set up) by the student council.\nMina: Right. And the food stalls (B)___ (not / operate) without a health and safety check first.',
      'answer',E'will be set up / cannot be operated',
      'acceptedAnswers',jsonb_build_array(),
      'explanation',E'(A) set up → will be set up (동사구 통째로 수동). (B) not operate → cannot be operated',
      'subParts',jsonb_build_array(
        jsonb_build_object('label','(A)','answer','will be set up','acceptedAnswers',jsonb_build_array()),
        jsonb_build_object('label','(B)','answer','cannot be operated','acceptedAnswers',jsonb_build_array('can not be operated'))
      )),

    -- ═══════════════════════════════════════════
    -- Part 5: 어순 배열 (Q44~Q49)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',44,
      'question',E'[Part 5] 주어진 단어들을 알맞은 순서로 배열하시오.\n\n이 박물관은 월요일에는 방문될 수 없다.\n(on / visited / be / Mondays / cannot / this museum)',
      'answer',E'This museum cannot be visited on Mondays.',
      'acceptedAnswers',jsonb_build_array('This museum cannot be visited on Mondays'),
      'explanation',E'조동사 수동태: 주어 + 조동사 + be + p.p.'),
    jsonb_build_object('number',45,
      'question',E'주어진 단어들을 알맞은 순서로 배열하시오.\n\n그 서류들은 내일까지 제출되어야 한다.\n(by / be / the documents / submitted / must / tomorrow)',
      'answer',E'The documents must be submitted by tomorrow.',
      'acceptedAnswers',jsonb_build_array('The documents must be submitted by tomorrow'),
      'explanation',E'조동사 수동태: 주어 + must + be + p.p.'),
    jsonb_build_object('number',46,
      'question',E'주어진 단어들을 알맞은 순서로 배열하시오.\n\n다음 올림픽은 어디서 개최될 예정인가요?\n(be / the next Olympics / where / held / will)',
      'answer',E'Where will the next Olympics be held?',
      'acceptedAnswers',jsonb_build_array('Where will the next Olympics be held'),
      'explanation',E'조동사 수동태 의문문: 의문사 + 조동사 + 주어 + be + p.p.'),
    jsonb_build_object('number',47,
      'question',E'주어진 단어들을 알맞은 순서로 배열하시오.\n\n이 정보는 누구에게도 공유되어서는 안 된다.\n(should / this information / shared / anyone / not / with / be)',
      'answer',E'This information should not be shared with anyone.',
      'acceptedAnswers',jsonb_build_array('This information should not be shared with anyone'),
      'explanation',E'조동사 수동태 부정문: 주어 + 조동사 + not + be + p.p.'),
    jsonb_build_object('number',48,
      'question',E'주어진 단어들을 알맞은 순서로 배열하시오.\n\n언제 그 새 규칙이 시행될 예정인가요?\n(the new rule / when / enforced / will / be)',
      'answer',E'When will the new rule be enforced?',
      'acceptedAnswers',jsonb_build_array('When will the new rule be enforced'),
      'explanation',E'조동사 수동태 의문문: 의문사 + 조동사 + 주어 + be + p.p.'),
    jsonb_build_object('number',49,
      'question',E'주어진 단어들을 알맞은 순서로 배열하시오.\n\n신선한 과일과 채소는 냉장고에 보관되어야 한다.\n(kept / fresh fruits and vegetables / the refrigerator / should / be / in)',
      'answer',E'Fresh fruits and vegetables should be kept in the refrigerator.',
      'acceptedAnswers',jsonb_build_array('Fresh fruits and vegetables should be kept in the refrigerator'),
      'explanation',E'조동사 수동태: 주어 + should + be + p.p.'),

    -- ═══════════════════════════════════════════
    -- Part 6: 조건 영작 (Q50~Q55)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',50,
      'question',E'[Part 6] 주어진 조건에 맞게 영작하시오.\n[조건] must 사용 / 수동태 / return, library book, by Friday\n\n도서관 책은 금요일까지 반납되어야 한다.',
      'answer',E'Library books must be returned by Friday.',
      'acceptedAnswers',jsonb_build_array('Library books must be returned by Friday'),
      'explanation',E'must + be + p.p.: Library books must be returned by Friday.'),
    jsonb_build_object('number',51,
      'question',E'주어진 조건에 맞게 영작하시오.\n[조건] should not 사용 / 수동태 / leave, unattended, child\n\n어린아이들은 혼자 두어서는 안 된다.',
      'answer',E'Children should not be left unattended.',
      'acceptedAnswers',jsonb_build_array('Children should not be left unattended'),
      'explanation',E'should not + be + p.p.: Children should not be left unattended.'),
    jsonb_build_object('number',52,
      'question',E'주어진 조건에 맞게 영작하시오.\n[조건] will 사용 / 수동태 / 의문문 / repair, the roof\n\n그 지붕은 언제 수리될 예정인가요?',
      'answer',E'When will the roof be repaired?',
      'acceptedAnswers',jsonb_build_array('When will the roof be repaired'),
      'explanation',E'will + be + p.p. 의문문: When will the roof be repaired?'),
    jsonb_build_object('number',53,
      'question',E'주어진 조건에 맞게 영작하시오.\n[조건] can 사용 / 수동태 / purchase, ticket, at the entrance\n\n입장권은 입구에서 구매될 수 있다.',
      'answer',E'Tickets can be purchased at the entrance.',
      'acceptedAnswers',jsonb_build_array('Tickets can be purchased at the entrance'),
      'explanation',E'can + be + p.p.: Tickets can be purchased at the entrance.'),
    jsonb_build_object('number',54,
      'question',E'주어진 조건에 맞게 영작하시오.\n[조건] may not 사용 / 수동태 / extend, the deadline\n\n마감 기한은 연장되지 않을 수도 있다.',
      'answer',E'The deadline may not be extended.',
      'acceptedAnswers',jsonb_build_array('The deadline may not be extended'),
      'explanation',E'may not + be + p.p.: The deadline may not be extended.'),
    jsonb_build_object('number',55,
      'question',E'주어진 조건에 맞게 영작하시오.\n[조건] should 사용 / 수동태 / sort, recycle, waste\n\n쓰레기는 재활용되기 전에 분리되어야 한다.',
      'answer',E'Waste should be sorted before it is recycled.',
      'acceptedAnswers',jsonb_build_array('Waste should be sorted before it is recycled','Waste should be sorted before it can be recycled'),
      'explanation',E'should + be + p.p.: Waste should be sorted before it is recycled.')
  );

  a := jsonb_build_array();

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES (
    E'조동사가 포함된 수동태 Step 1',
    E'조동사가 포함된 수동태',
    q,
    a,
    'problem',
    'interactive'
  );
END $$;
