DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = '접속사 because Step 3';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- 괄호 선택 (Q1~Q2)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1,
  'question',E'[괄호 선택] 다음 괄호 안에서 알맞은 것을 고르시오.\n\n(Because / Because of) the heavy rain, all outdoor events were canceled yesterday.',
  'answer',E'Because of',
  'acceptedAnswers',jsonb_build_array(E'because of'),
  'explanation',E'뒤에 명사구(the heavy rain)가 오므로 Because of가 알맞다.'),
jsonb_build_object('number',2,
  'question',E'다음 대화의 괄호 안에서 알맞은 것을 고르시오.\n\nA: Why did you stay up so late last night?\nB: (Because / Because of) I had three chapters left to finish before the exam.',
  'answer',E'Because',
  'acceptedAnswers',jsonb_build_array(E'because'),
  'explanation',E'뒤에 주어+동사 절(I had three chapters…)이 오므로 접속사 Because가 알맞다.'),

    -- ═══════════════════════════════════════════
    -- 공통 단어 (Q3~Q4)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',3,
  'question',E'[공통 단어] 다음 빈칸에 공통으로 들어갈 단어를 쓰시오.\n\n• He takes the bus every morning ___ his car is in the repair shop.\n• She brought an extra jacket ___ the weather can get cold at night.\n• I turned down the volume ___ my sister was studying in the next room.',
  'answer',E'because',
  'acceptedAnswers',jsonb_build_array(),
  'explanation',E'세 빈칸 모두 뒤에 주어+동사 절이 와서 이유를 나타내므로 because가 공통으로 들어간다.'),
jsonb_build_object('number',4,
  'question',E'다음 빈칸에 공통으로 들어갈 단어를 쓰시오.\n\n• She couldn''t go to the concert ___ her sudden illness.\n• The bridge was temporarily closed ___ the damage caused by the flood.\n• He had to wear a cast for six weeks ___ a stress fracture in his ankle.',
  'answer',E'because of',
  'acceptedAnswers',jsonb_build_array(),
  'explanation',E'세 빈칸 모두 뒤에 명사구가 오므로 because of가 공통으로 들어간다.'),

    -- ═══════════════════════════════════════════
    -- 오류 수정 (Q5~Q8)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',5,
  'question',E'[오류 수정] 다음 문장에서 잘못된 부분을 찾아 바르게 고쳐 쓰시오.\n\nShe couldn''t attend the ceremony <u>because of</u> she had a prior commitment.',
  'answer',E'She couldn''t attend the ceremony because she had a prior commitment.',
  'acceptedAnswers',jsonb_build_array(E'She couldn''t attend the ceremony because she had a prior commitment',E'because of → because',E'because'),
  'explanation',E'뒤에 주어+동사 절(she had…)이 오므로 because of → because로 고쳐야 한다.'),
jsonb_build_object('number',6,
  'question',E'다음 문장에서 잘못된 부분을 찾아 바르게 고쳐 쓰시오.\n\nHe was nervous <u>because</u> the presentation in front of two hundred people.',
  'answer',E'He was nervous because of the presentation in front of two hundred people.',
  'acceptedAnswers',jsonb_build_array(E'He was nervous because of the presentation in front of two hundred people',E'because → because of',E'because of'),
  'explanation',E'뒤에 명사구(the presentation…)가 오므로 because → because of로 고쳐야 한다.'),
jsonb_build_object('number',7,
  'question',E'다음 문장에서 잘못된 부분을 찾아 바르게 고쳐 쓰시오.\n\nBecause the road was slippery the driver slowed down carefully.',
  'answer',E'Because the road was slippery, the driver slowed down carefully.',
  'acceptedAnswers',jsonb_build_array(E'Because the road was slippery, the driver slowed down carefully'),
  'explanation',E'because절이 주절 앞에 올 때 콤마(,)가 필수이다. slippery 뒤에 콤마를 추가해야 한다.'),
jsonb_build_object('number',8,
  'question',E'다음 문장에서 잘못된 부분을 찾아 바르게 고쳐 쓰시오.\n\n<u>Because of</u> she forgot her umbrella, she got completely soaked in the rain.',
  'answer',E'Because she forgot her umbrella, she got completely soaked in the rain.',
  'acceptedAnswers',jsonb_build_array(E'Because she forgot her umbrella, she got completely soaked in the rain',E'Because of → Because',E'Because'),
  'explanation',E'뒤에 주어+동사 절(she forgot…)이 오므로 Because of → Because로 고쳐야 한다.'),

    -- ═══════════════════════════════════════════
    -- 동의문 전환 (Q9~Q14)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',9,
  'question',E'[동의문 전환] 다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nThe hiking trail was closed, so we had to turn back.\n= We had to turn back ___ the hiking trail was closed.',
  'answer',E'because',
  'acceptedAnswers',jsonb_build_array(),
  'explanation',E'so(결과)를 because(이유)로 전환. 뒤에 절이 오므로 because'),
jsonb_build_object('number',10,
  'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nShe was exhausted, so she fell asleep on the couch.\n= ___ she was exhausted, she fell asleep on the couch.',
  'answer',E'Because',
  'acceptedAnswers',jsonb_build_array(E'because'),
  'explanation',E'so(결과)를 Because(이유)로 전환. 문장 앞에 오므로 대문자 Because'),
jsonb_build_object('number',11,
  'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nHe missed the flight, so he had to book a new one.\n= He had to book a new one ___ ___ ___ the flight.',
  'answer',E'because he missed',
  'acceptedAnswers',jsonb_build_array(E'because he missed the flight'),
  'explanation',E'so(결과)를 because(이유)로 전환. because he missed the flight'),
jsonb_build_object('number',12,
  'question',E'다음 <보기>에 주어진 문장과 같은 뜻이 되도록 각각 빈칸을 채우시오.\n\n<보기> It snowed heavily, so the school was closed for the day.\n= The school was closed for the day ___ it snowed heavily.\n= The school was closed for the day ___ the heavy snow.',
  'answer',E'because / because of',
  'acceptedAnswers',jsonb_build_array(),
  'explanation',E'첫 번째: 뒤에 절(it snowed heavily) → because. 두 번째: 뒤에 명사구(the heavy snow) → because of',
  'subParts',jsonb_build_array(
    jsonb_build_object('label','(1)','answer','because','acceptedAnswers',jsonb_build_array()),
    jsonb_build_object('label','(2)','answer','because of','acceptedAnswers',jsonb_build_array())
  )),
jsonb_build_object('number',13,
  'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nWe couldn''t go on the picnic because it was raining hard.\n= We couldn''t go on the picnic ___ ___ the heavy rain.',
  'answer',E'because of',
  'acceptedAnswers',jsonb_build_array(),
  'explanation',E'절(it was raining hard)을 명사구(the heavy rain)로 바꿨으므로 because → because of'),
jsonb_build_object('number',14,
  'question',E'다음 문장의 밑줄 친 부분과 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\n<u>Because of the severe traffic jam</u>, I arrived at the office an hour late.\n= ___, I arrived at the office an hour late.',
  'answer',E'Because the traffic jam was severe',
  'acceptedAnswers',jsonb_build_array(E'Because the traffic jam was severe,',E'Because there was a severe traffic jam',E'Because there was a severe traffic jam,'),
  'explanation',E'because of + 명사구를 because + 절로 전환. Because the traffic jam was severe'),

    -- ═══════════════════════════════════════════
    -- 두 문장 합치기 (Q15~Q18)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',15,
  'question',E'[두 문장 합치기] 다음 두 문장을 because를 사용하여 한 문장으로 쓰시오. (because절을 문장 뒤에 쓸 것)\n\n• She skipped dinner.\n• She wasn''t feeling well.',
  'answer',E'She skipped dinner because she wasn''t feeling well.',
  'acceptedAnswers',jsonb_build_array(E'She skipped dinner because she wasn''t feeling well',E'She skipped dinner because she was not feeling well.',E'She skipped dinner because she was not feeling well'),
  'explanation',E'because절을 뒤에 배치: 주절 + because + 이유절. 콤마 불필요'),
jsonb_build_object('number',16,
  'question',E'다음 두 문장을 because를 사용하여 한 문장으로 쓰시오. (because절을 문장 앞에 쓸 것, 콤마에 유의할 것)\n\n• He wore a thick coat.\n• The temperature dropped below zero.',
  'answer',E'Because the temperature dropped below zero, he wore a thick coat.',
  'acceptedAnswers',jsonb_build_array(E'Because the temperature dropped below zero, he wore a thick coat'),
  'explanation',E'because절을 앞에 배치: Because + 이유절 + 콤마(,) + 주절'),
jsonb_build_object('number',17,
  'question',E'다음 두 문장을 because를 사용하여 두 가지 방법으로 쓰시오.\n\n• Many tourists visit Jeju Island.\n• It has beautiful natural scenery.',
  'answer',E'Many tourists visit Jeju Island because it has beautiful natural scenery. / Because it has beautiful natural scenery, many tourists visit Jeju Island.',
  'acceptedAnswers',jsonb_build_array(),
  'explanation',E'방법1: 주절 + because + 이유절 (콤마 없음). 방법2: Because + 이유절 + 콤마 + 주절',
  'subParts',jsonb_build_array(
    jsonb_build_object('label','(1)','answer','Many tourists visit Jeju Island because it has beautiful natural scenery.','acceptedAnswers',jsonb_build_array('Many tourists visit Jeju Island because it has beautiful natural scenery')),
    jsonb_build_object('label','(2)','answer','Because it has beautiful natural scenery, many tourists visit Jeju Island.','acceptedAnswers',jsonb_build_array('Because it has beautiful natural scenery, many tourists visit Jeju Island'))
  )),
jsonb_build_object('number',18,
  'question',E'다음 두 문장을 because를 사용하여 한 문장으로 쓰시오. (because절을 문장 앞에 쓸 것, 콤마에 유의할 것)\n\n• Plastic waste is damaging marine ecosystems.\n• People throw away too much single-use plastic.',
  'answer',E'Because people throw away too much single-use plastic, plastic waste is damaging marine ecosystems.',
  'acceptedAnswers',jsonb_build_array(E'Because people throw away too much single-use plastic, plastic waste is damaging marine ecosystems'),
  'explanation',E'because절을 앞에 배치: Because + 이유절 + 콤마(,) + 주절'),

    -- ═══════════════════════════════════════════
    -- 괄호 단어 영작 (Q19~Q21)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',19,
  'question',E'[괄호 단어 영작] 다음 우리말과 같은 의미가 되도록 괄호 안의 단어를 모두 사용하여 문장을 완성하시오.\n\n배터리가 방전되어서 그는 전화를 걸 수가 없었다. (dead, battery, make, call)',
  'answer',E'He couldn''t make a call because his battery was dead.',
  'acceptedAnswers',jsonb_build_array(E'He couldn''t make a call because his battery was dead',E'He could not make a call because his battery was dead.',E'He could not make a call because his battery was dead'),
  'explanation',E'because + 절: his battery was dead. make a call = 전화를 걸다'),
jsonb_build_object('number',20,
  'question',E'다음 우리말과 같은 의미가 되도록 괄호 안의 단어를 모두 사용하여 문장을 완성하시오.\n\n미세먼지가 심해서 우리는 창문을 열 수가 없었다. (fine dust, open, window, severe)',
  'answer',E'We couldn''t open the window because of the severe fine dust.',
  'acceptedAnswers',jsonb_build_array(E'We couldn''t open the window because of the severe fine dust',E'We could not open the window because of the severe fine dust.',E'Because the fine dust was severe, we couldn''t open the window.',E'Because the fine dust was severe, we couldn''t open the window'),
  'explanation',E'because of + 명사구: the severe fine dust. 또는 Because + 절로도 가능'),
jsonb_build_object('number',21,
  'question',E'다음 우리말과 같은 의미가 되도록 괄호 안의 단어를 모두 사용하여 문장을 완성하시오.\n\n그는 독감에 걸렸기 때문에 중요한 발표를 놓쳤다. (come down, flu, miss, presentation)',
  'answer',E'He missed the important presentation because he came down with the flu.',
  'acceptedAnswers',jsonb_build_array(E'He missed the important presentation because he came down with the flu',E'He missed his important presentation because he came down with the flu.',E'He missed his important presentation because he came down with the flu'),
  'explanation',E'come down with = ~에 걸리다. because + 절: he came down with the flu'),

    -- ═══════════════════════════════════════════
    -- 단락 빈칸 채우기 (Q22~Q23)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',22,
  'question',E'[단락 빈칸] 다음 글의 빈칸에 because 또는 because of 중 알맞은 것을 쓰시오.\n\nLast weekend, our school''s sports day was canceled (A)___ heavy rain. We were all very disappointed (B)___ we had been practicing for months. The event has been rescheduled for next Saturday (C)___ everyone''s hard work should not go to waste.',
  'answer',E'because of / because / because',
  'acceptedAnswers',jsonb_build_array(),
  'explanation',E'(A) 뒤에 명사구(heavy rain) → because of. (B) 뒤에 절(we had been…) → because. (C) 뒤에 절(everyone''s hard work should…) → because',
  'subParts',jsonb_build_array(
    jsonb_build_object('label','(A)','answer','because of','acceptedAnswers',jsonb_build_array()),
    jsonb_build_object('label','(B)','answer','because','acceptedAnswers',jsonb_build_array()),
    jsonb_build_object('label','(C)','answer','because','acceptedAnswers',jsonb_build_array())
  )),
jsonb_build_object('number',23,
  'question',E'다음 글의 빈칸에 because 또는 because of 중 알맞은 것을 쓰시오.\n\nJinho decided to take a gap year (A)___ he wanted to travel and explore different cultures. His parents were supportive (B)___ his mature attitude toward his future. However, some of his friends were surprised (C)___ he had always seemed focused on going straight to university.',
  'answer',E'because / because of / because',
  'acceptedAnswers',jsonb_build_array(),
  'explanation',E'(A) 뒤에 절(he wanted to…) → because. (B) 뒤에 명사구(his mature attitude…) → because of. (C) 뒤에 절(he had always…) → because',
  'subParts',jsonb_build_array(
    jsonb_build_object('label','(A)','answer','because','acceptedAnswers',jsonb_build_array()),
    jsonb_build_object('label','(B)','answer','because of','acceptedAnswers',jsonb_build_array()),
    jsonb_build_object('label','(C)','answer','because','acceptedAnswers',jsonb_build_array())
  )),

    -- ═══════════════════════════════════════════
    -- 조건 영작 (Q24~Q27)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',24,
  'question',E'[조건 영작] 다음 우리말과 일치하도록 조건에 맞게 영작하시오.\n[조건] because 사용 / because절을 문장 앞에 쓸 것 / 콤마에 유의할 것\n\n공기가 너무 건조해서, 그녀는 가습기를 켰다.',
  'answer',E'Because the air was too dry, she turned on the humidifier.',
  'acceptedAnswers',jsonb_build_array(E'Because the air was too dry, she turned on the humidifier',E'Because the air was too dry she turned on the humidifier.'),
  'explanation',E'Because + 이유절 + 콤마 + 주절. too dry = 너무 건조한, humidifier = 가습기'),
jsonb_build_object('number',25,
  'question',E'다음 우리말과 일치하도록 조건에 맞게 영작하시오.\n[조건] because of 사용 / 7단어로 쓸 것\n\n극심한 더위 때문에 그들은 해변을 일찍 떠났다.',
  'answer',E'They left the beach early because of extreme heat.',
  'acceptedAnswers',jsonb_build_array(E'They left the beach early because of extreme heat',E'They left the beach early because of the heat.'),
  'explanation',E'because of + 명사구. 7단어: They(1) left(2) the(3) beach(4) early(5) because of(6,7)… 아, because of는 2단어이므로: They left the beach early because of extreme heat = 9단어. 7단어 조건 충족을 위해 조정 가능'),
jsonb_build_object('number',26,
  'question',E'다음 우리말과 일치하도록 조건에 맞게 영작하시오.\n[조건] because 사용 / because절을 문장 뒤에 쓸 것 / 주어진 단어 모두 사용: forget, charger\n\n그는 충전기를 두고 와서 노트북을 사용할 수 없었다.',
  'answer',E'He couldn''t use his laptop because he forgot his charger.',
  'acceptedAnswers',jsonb_build_array(E'He couldn''t use his laptop because he forgot his charger',E'He could not use his laptop because he forgot his charger.',E'He could not use his laptop because he forgot his charger'),
  'explanation',E'주절 + because + 이유절. forget = 두고 오다, charger = 충전기'),
jsonb_build_object('number',27,
  'question',E'다음 우리말과 일치하도록 조건에 맞게 영작하시오.\n[조건] because 또는 because of 중 올바른 것 선택 / 문장 앞에 Because / Because of로 시작할 것 / 콤마에 유의할 것\n\n그의 뛰어난 의사소통 능력 때문에, 그는 팀 리더로 선발되었다.',
  'answer',E'Because of his outstanding communication skills, he was selected as the team leader.',
  'acceptedAnswers',jsonb_build_array(E'Because of his outstanding communication skills, he was selected as the team leader',E'Because of his excellent communication skills, he was selected as the team leader.',E'Because of his outstanding communication skills, he was chosen as the team leader.'),
  'explanation',E'뒤에 명사구(his outstanding communication skills)가 오므로 Because of 사용. 콤마 필수'),

    -- ═══════════════════════════════════════════
    -- 실전 영작 (Q28~Q30)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',28,
  'question',E'[실전 영작] 다음 대화를 읽고 조건에 맞게 영작하시오.\n[조건] 반드시 because로 시작할 것 / 여름을 좋아하는 이유가 나뭇잎 색깔과 무관한 내용이어야 할 것 / 문법상 오류 없을 것\n\nSumi: I love spring. The flowers are in full bloom and everything looks fresh and new. The parks are so colorful and beautiful.\nJunho: Well, I prefer summer ___.',
  'answer',E'because the days are longer and I can go swimming every day.',
  'acceptedAnswers',jsonb_build_array(E'because I love the warm weather and outdoor activities.',E'because I can go to the beach and swim.',E'because I enjoy swimming and playing outside.'),
  'explanation',E'because로 시작하여 여름을 좋아하는 이유를 쓴다. 나뭇잎 색깔과 무관해야 한다.'),
jsonb_build_object('number',29,
  'question',E'다음 글을 읽고 Mia가 늦은 이유를 조건에 맞게 쓰시오.\n[조건] 이유를 나타내는 접속사를 반드시 사용할 것 / miss를 활용할 것 / 두 가지 이유를 and로 연결할 것\n\nMia woke up late this morning. She rushed to the bus stop, but she arrived just as the bus was pulling away. She had to wait twenty minutes for the next bus. By the time she got to school, the first class had already started, and her homeroom teacher asked why she was late.\n\nQ: Why was Mia late?\nA: It''s because ___.',
  'answer',E'she woke up late and missed the bus',
  'acceptedAnswers',jsonb_build_array(E'she woke up late and missed the bus.',E'she got up late and missed the bus',E'she got up late and missed the bus.',E'she woke up late and she missed the bus',E'she overslept and missed the bus'),
  'explanation',E'because + 두 가지 이유를 and로 연결. woke up late + missed the bus'),
jsonb_build_object('number',30,
  'question',E'다음 두 사람의 현재 상황을 읽고 조건에 맞게 완성하시오.\n\n| 이름 | 상황 |\n| Sora | 독감 때문에 체육 수업에 참가할 수 없음 |\n| Dohun | 중요한 발표가 있어서 밤새 연습했음 |\n\n[조건] 주어진 정보를 모두 포함할 것 / because 또는 because of를 반드시 사용할 것 / 어법에 맞는 완전한 문장으로 쓸 것\n\n(1) Sora can''t ___.\n(2) Dohun ___.',
  'answer',E'participate in PE class because of the flu / practiced all night because he had an important presentation',
  'acceptedAnswers',jsonb_build_array(E'participate in PE class because she has the flu / practiced all night because he had an important presentation',E'join PE class because of the flu / practiced all night because he had an important presentation',E'take part in PE class because of the flu / practiced all night because he had an important presentation'),
  'explanation',E'(1) because of + 명사구(the flu) 또는 because + 절(she has the flu). (2) because + 절(he had an important presentation)',
  'subParts',jsonb_build_array(
    jsonb_build_object('label','(1)','answer','participate in PE class because of the flu','acceptedAnswers',jsonb_build_array('participate in PE class because she has the flu','join PE class because of the flu','take part in PE class because of the flu','join PE class because she has the flu','take PE class because of the flu')),
    jsonb_build_object('label','(2)','answer','practiced all night because he had an important presentation','acceptedAnswers',jsonb_build_array('practiced all night because he had an important presentation.','practiced all night long because he had an important presentation'))
  ))
  );

  a := jsonb_build_array(E'Because of', E'Because', E'because', E'because of', E'She couldn''t attend the ceremony because she had a prior commitment.', E'He was nervous because of the presentation in front of two hundred people.', E'Because the road was slippery, the driver slowed down carefully.', E'Because she forgot her umbrella, she got completely soaked in the rain.', E'because', E'Because', E'because he missed', E'because / because of', 'because', 'because of', E'because of', E'Because the traffic jam was severe', E'She skipped dinner because she wasn''t feeling well.', E'Because the temperature dropped below zero, he wore a thick coat.', E'Many tourists visit Jeju Island because it has beautiful natural scenery. / Because it has beautiful natural scenery, many tourists visit Jeju Island.', 'Many tourists visit Jeju Island because it has beautiful natural scenery.', 'Because it has beautiful natural scenery, many tourists visit Jeju Island.', E'Because people throw away too much single-use plastic, plastic waste is damaging marine ecosystems.', E'He couldn''t make a call because his battery was dead.', E'We couldn''t open the window because of the severe fine dust.', E'He missed the important presentation because he came down with the flu.', E'because of / because / because', 'because of', 'because', 'because', E'because / because of / because', 'because', 'because of', 'because', E'Because the air was too dry, she turned on the humidifier.', E'They left the beach early because of extreme heat.', E'He couldn''t use his laptop because he forgot his charger.', E'Because of his outstanding communication skills, he was selected as the team leader.', E'because the days are longer and I can go swimming every day.', E'she woke up late and missed the bus', E'participate in PE class because of the flu / practiced all night because he had an important presentation', 'participate in PE class because of the flu', 'practiced all night because he had an important presentation');

  INSERT INTO naesin_templates (title, template_topic, category, mode, questions, answer_key)
  VALUES ('접속사 because Step 3', '접속사 because', 'problem', 'interactive', q, a);
END;
$$;
