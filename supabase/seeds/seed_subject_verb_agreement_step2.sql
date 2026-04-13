-- 주어동사수일치 Step 2 — 35문항 (객관식)
-- template_topic: 주어동사수일치
-- category: problem, mode: interactive

DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = E'주어동사수일치 Step 2';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- 유형 A: 단어 선택형 빈칸 (Q1~Q5)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1,
      'question',E'[유형 A] 다음 빈칸에 들어갈 말로 가장 적절한 것은?\n\n___ of the students in the advanced class were struggling with the final exam.',
      'options',jsonb_build_array('One','Each','Every','Much','Many'),
      'answer','5',
      'explanation',E'of the students(복수) + were(복수동사) → Many가 적절'),
    jsonb_build_object('number',2,
      'question',E'다음 빈칸에 들어갈 말로 가장 적절한 것은?\n\n___ of the information provided at the seminar was outdated and misleading.',
      'options',jsonb_build_array('Most','Many','Several','A few','Both'),
      'answer','1',
      'explanation',E'information은 불가산명사 → 단수동사 was와 호응하는 Most'),
    jsonb_build_object('number',3,
      'question',E'다음 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?\n\n• (A)___ of the budget was spent on advertising.\n• (B)___ of the employees have submitted their reports.',
      'options',jsonb_build_array(
        '(A) Most — (B) Many of',
        '(A) Half — (B) All of',
        '(A) Some — (B) One of',
        '(A) All of — (B) Much',
        '(A) One — (B) None of'
      ),
      'answer','2',
      'explanation',E'budget(단수) → was → Half. employees(복수) → have → All of'),
    jsonb_build_object('number',4,
      'question',E'다음 빈칸 (A), (B), (C)에 들어갈 말로 가장 적절한 것은?\n\n• (A)___ of my classmates is from a foreign country.\n• (B)___ of the homework has already been completed.\n• (C)___ of the athletes were selected for the national team.',
      'options',jsonb_build_array(
        '(A) One — (B) Most — (C) Many',
        '(A) Some — (B) Each — (C) All',
        '(A) Many — (B) Half — (C) One',
        '(A) All — (B) Some — (C) Each',
        '(A) Each — (B) Many — (C) Half'
      ),
      'answer','1',
      'explanation',E'(A) is(단수) → One of. (B) has(단수) → Most of(불가산). (C) were(복수) → Many of'),
    jsonb_build_object('number',5,
      'question',E'다음 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?\n\n• (A)___ of visitors to the park is increasing every year.\n• (B)___ of the visitors come from neighboring countries.',
      'options',jsonb_build_array(
        '(A) A number — (B) The number',
        '(A) The number — (B) A number',
        '(A) The number — (B) The number',
        '(A) A number — (B) A number',
        '(A) Some number — (B) A number'
      ),
      'answer','2',
      'explanation',E'(A) is increasing(단수) → The number of. (B) come(복수) → A number of'),

    -- ═══════════════════════════════════════════
    -- 유형 B: 동사형태 짝짓기 (Q6~Q10)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',6,
      'question',E'[유형 B] 다음 괄호 ⓐ, ⓑ, ⓒ에 주어진 단어의 알맞은 형태가 차례대로 연결된 것은?\n\n• Two thirds of the water on Earth ⓐ(be) salt water.\n• One of the biggest challenges we face ⓑ(be) climate change.\n• Most of the students in our class ⓒ(enjoy) studying science.',
      'options',jsonb_build_array(
        'ⓐ is — ⓑ are — ⓒ enjoy',
        'ⓐ are — ⓑ is — ⓒ enjoys',
        'ⓐ are — ⓑ are — ⓒ enjoy',
        'ⓐ is — ⓑ are — ⓒ enjoys',
        'ⓐ is — ⓑ is — ⓒ enjoy'
      ),
      'answer','5',
      'explanation',E'ⓐ water(불가산) → is. ⓑ One of → is. ⓒ students(복수) → enjoy'),
    jsonb_build_object('number',7,
      'question',E'다음 괄호 ⓐ, ⓑ, ⓒ에 주어진 단어의 알맞은 형태가 차례대로 연결된 것은?\n\n• A number of species ⓐ(disappear) due to habitat destruction every year.\n• The number of electric cars on the road ⓑ(grow) rapidly.\n• About 40 percent of all food produced globally ⓒ(waste).',
      'options',jsonb_build_array(
        'ⓐ disappear — ⓑ grows — ⓒ is wasted',
        'ⓐ disappears — ⓑ grow — ⓒ wastes',
        'ⓐ disappear — ⓑ grows — ⓒ wastes',
        'ⓐ disappears — ⓑ grows — ⓒ is wasted',
        'ⓐ disappear — ⓑ grow — ⓒ waste'
      ),
      'answer','1',
      'explanation',E'ⓐ A number of + 복수 → disappear. ⓑ The number of → grows. ⓒ food(불가산) → is wasted'),
    jsonb_build_object('number',8,
      'question',E'다음 괄호 ⓐ, ⓑ, ⓒ에 주어진 단어의 알맞은 형태가 차례대로 연결된 것은?\n\n• Half of the city''s population ⓐ(live) below the poverty line.\n• Each of the team members ⓑ(have) a specific role to fulfill.\n• 60 percent of the students ⓒ(walk) to school every morning.',
      'options',jsonb_build_array(
        'ⓐ lives — ⓑ has — ⓒ walk',
        'ⓐ lives — ⓑ have — ⓒ walks',
        'ⓐ live — ⓑ has — ⓒ walk',
        'ⓐ live — ⓑ have — ⓒ walks',
        'ⓐ lives — ⓑ has — ⓒ walks'
      ),
      'answer','1',
      'explanation',E'ⓐ population(단수) → lives. ⓑ Each of → has. ⓒ students(복수) → walk'),
    jsonb_build_object('number',9,
      'question',E'다음 괄호 ⓐ, ⓑ, ⓒ에 주어진 단어의 알맞은 형태가 차례대로 연결된 것은?\n\n• None of the furniture in the showroom ⓐ(be) for sale today.\n• Many of the participants ⓑ(arrive) before the event started.\n• One fourth of the Earth''s surface ⓒ(cover) by fresh water.',
      'options',jsonb_build_array(
        'ⓐ are — ⓑ arrived — ⓒ is covered',
        'ⓐ was — ⓑ arrive — ⓒ covers',
        'ⓐ is — ⓑ arrived — ⓒ are covered',
        'ⓐ was — ⓑ arrived — ⓒ is covered',
        'ⓐ are — ⓑ arrived — ⓒ covers'
      ),
      'answer','4',
      'explanation',E'ⓐ furniture(불가산) → was. ⓑ many(복수) → arrived. ⓒ surface(단수) → is covered'),
    jsonb_build_object('number',10,
      'question',E'다음 괄호 ⓐ, ⓑ, ⓒ에 주어진 단어의 알맞은 형태가 차례대로 연결된 것은?\n\n• Some of the evidence ⓐ(suggest) that the policy was ineffective.\n• Three quarters of the respondents ⓑ(say) they prefer working from home.\n• Every student in the program ⓒ(expect) to submit a final paper.',
      'options',jsonb_build_array(
        'ⓐ suggests — ⓑ say — ⓒ are expected',
        'ⓐ suggest — ⓑ says — ⓒ is expected',
        'ⓐ suggest — ⓑ say — ⓒ is expected',
        'ⓐ suggests — ⓑ says — ⓒ are expected',
        'ⓐ suggests — ⓑ say — ⓒ is expected'
      ),
      'answer','5',
      'explanation',E'ⓐ evidence(불가산) → suggests. ⓑ respondents(복수) → say. ⓒ Every → is expected'),

    -- ═══════════════════════════════════════════
    -- 유형 C: 다른 것 찾기 (Q11~Q13)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',11,
      'question',E'[유형 C] 다음 중 빈칸에 들어갈 현재형 동사가 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'Half of the coffee on the counter ___ already cold.',
        'One of the most visited places in Korea ___ Gyeongbokgung Palace.',
        'The number of tourists visiting the island ___ growing steadily.',
        'Most of the workers at the factory ___ on the night shift.',
        'Each of the museums in the city ___ a unique collection.'
      ),
      'answer','4',
      'explanation',E'④ workers(복수) → are. 나머지는 모두 단수동사 is'),
    jsonb_build_object('number',12,
      'question',E'다음 중 빈칸에 들어갈 현재형 동사가 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'About one fifth of the Earth''s surface ___ desert.',
        'A number of new restaurants ___ opened in the downtown area recently.',
        'Some of the advice given by the counselor ___ truly helpful.',
        'Most of the equipment in the lab ___ regularly maintained.',
        'Two thirds of the world''s population ___ in Asia.'
      ),
      'answer','2',
      'explanation',E'② A number of + 복수 → have. 나머지는 모두 단수동사 is'),
    jsonb_build_object('number',13,
      'question',E'다음 중 빈칸에 들어갈 현재형 동사가 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'Many of the suggestions made at the meeting ___ worth considering.',
        'Some of them ___ planning to start their own businesses after graduation.',
        '30 percent of the students in the survey ___ they prefer group projects.',
        'Half of the books on the required reading list ___ written by Korean authors.',
        'None of the information shared at the briefing ___ confidential.'
      ),
      'answer','5',
      'explanation',E'⑤ information(불가산) → is. 나머지는 모두 복수동사'),

    -- ═══════════════════════════════════════════
    -- 유형 D-1: 어법상 어색한 것 (Q14~Q17)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',14,
      'question',E'[유형 D] 다음 중 어법상 어색한 문장은?',
      'options',jsonb_build_array(
        'One of the most important skills in life is communication.',
        'A number of problems have arisen since the new rule was introduced.',
        'The number of endangered birds is increasing at an alarming rate.',
        'Most of the rice grown in Asia is consumed locally.',
        'Two thirds of the participants was from European countries.'
      ),
      'answer','5',
      'explanation',E'participants(복수) → was를 were로'),
    jsonb_build_object('number',15,
      'question',E'다음 중 어법상 어색한 문장은?',
      'options',jsonb_build_array(
        'Each of the volunteers were assigned a specific task.',
        'Half of the world''s coral reefs have been damaged by pollution.',
        'Some of the music played at the festival was composed by local artists.',
        'About 90 percent of the ocean floor remains unexplored.',
        'None of the documents submitted were complete.'
      ),
      'answer','1',
      'explanation',E'Each of + 복수명사 → 단수동사. were를 was로'),
    jsonb_build_object('number',16,
      'question',E'다음 중 어법상 어색한 문장은?',
      'options',jsonb_build_array(
        'Some of the passengers on the delayed flight are growing frustrated.',
        'The number of students enrolling in online courses are rising every semester.',
        'Half of the money raised at the charity event was donated to local schools.',
        'Many of the issues raised at the conference remain unresolved.',
        'One of the biggest threats to biodiversity is the destruction of natural habitats.'
      ),
      'answer','2',
      'explanation',E'The number of → 단수동사. are를 is로'),
    jsonb_build_object('number',17,
      'question',E'다음 중 어법상 어색한 문장은?',
      'options',jsonb_build_array(
        'Three fifths of the city''s budget is allocated to education.',
        'Most of the furniture in the office was replaced last month.',
        'Every employee working in this department has access to the system.',
        'A number of studies has shown that exercise improves mental health.',
        'Half of the students who took the test passed on their first attempt.'
      ),
      'answer','4',
      'explanation',E'A number of + 복수명사 → 복수동사. has를 have로'),

    -- ═══════════════════════════════════════════
    -- 유형 D-2: 어법상 옳은 것 (Q18~Q21)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',18,
      'question',E'다음 중 어법상 옳은 문장은?',
      'options',jsonb_build_array(
        'Some of his advice were not very practical in real life.',
        'The number of complaints received this month are quite high.',
        'Many of the student at our school participate in after-school clubs.',
        'One third of all plastic packaging is never recycled.',
        'A number of researcher has confirmed the findings of the study.'
      ),
      'answer','4',
      'explanation',E'plastic packaging(단수 취급) → is 올바름'),
    jsonb_build_object('number',19,
      'question',E'다음 중 어법상 옳은 문장은?',
      'options',jsonb_build_array(
        'Each of the exhibits in the gallery have a detailed description.',
        'About 75 percent of the Earth''s surface are covered by water.',
        'Most of the money donated to the organization go toward research.',
        'One of my colleagues have been working here for over ten years.',
        'Half of the seats in the auditorium were already taken when we arrived.'
      ),
      'answer','5',
      'explanation',E'seats(복수) → were 올바름'),
    jsonb_build_object('number',20,
      'question',E'다음 중 어법상 옳은 문장은?',
      'options',jsonb_build_array(
        'Two thirds of the houses in the area was damaged in the storm.',
        'A number of important decisions was made at yesterday''s meeting.',
        'The number of books published annually in Korea has grown significantly.',
        'None of the equipment needed for the experiment were available.',
        'Some of the new policies introduced by the government are facing criticism.'
      ),
      'answer','3',
      'explanation',E'The number of → 단수 → has grown 올바름'),
    jsonb_build_object('number',21,
      'question',E'다음 중 어법상 옳은 문장은?',
      'options',jsonb_build_array(
        'About 20 percent of the world''s population lives in extreme poverty.',
        'Much of the students in the program are international.',
        'One of the main reasons for the delay were the bad weather.',
        'The number of people attending the event were larger than expected.',
        'A number of scientist has raised concerns about the new policy.'
      ),
      'answer','1',
      'explanation',E'population(단수 취급) → lives 올바름'),

    -- ═══════════════════════════════════════════
    -- 유형 E: 복수정답·고급형 (Q22~Q26)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',22,
      'question',E'[유형 E] 다음 중 어법상 어색한 것을 모두 고르시오. (정답 2개)',
      'options',jsonb_build_array(
        'Half of the students in the survey prefer digital textbooks.',
        'The number of accidents on this road are decreasing.',
        'Each of the participants was given a name tag at the entrance.',
        'A number of new regulations has been proposed by the committee.',
        'Most of the land in this region is used for farming.'
      ),
      'answer','2,4',
      'explanation',E'② The number of → 단수동사(are → is). ④ A number of → 복수동사(has → have)'),
    jsonb_build_object('number',23,
      'question',E'다음 ⓐ~ⓔ 중 어법상 어색한 것끼리 짝지어진 것은?\n\nⓐ One of the biggest problems in modern cities are traffic congestion.\nⓑ Some of the water in the reservoir was contaminated after the flood.\nⓒ Three quarters of the audience were visibly moved by the performance.\nⓓ Many of the child participating in the program comes from low-income families.\nⓔ About 85 percent of all plastic ever produced have not been recycled.',
      'options',jsonb_build_array(
        'ⓐ, ⓑ',
        'ⓑ, ⓒ',
        'ⓐ, ⓓ',
        'ⓒ, ⓔ',
        'ⓐ, ⓔ'
      ),
      'answer','3',
      'explanation',E'ⓐ One of → 단수(are → is). ⓓ Many of the children → 복수(comes → come) + child → children'),
    jsonb_build_object('number',24,
      'question',E'다음 중 어법상 옳은 문장끼리 알맞게 짝지어진 것은?\n\nⓐ A number of volunteers have signed up for the beach cleanup event.\nⓑ Half of the world''s forest has been destroyed in the last century.\nⓒ None of the students were satisfied with the grading system.\nⓓ The number of people working remotely have grown since 2020.\nⓔ Over two thirds of the Earth''s freshwater is stored in glaciers.\nⓕ Every one of the players were ready for the championship game.',
      'options',jsonb_build_array(
        'ⓐ, ⓔ',
        'ⓑ, ⓒ',
        'ⓑ, ⓓ, ⓔ',
        'ⓐ, ⓒ, ⓓ, ⓔ',
        'ⓐ, ⓒ, ⓔ'
      ),
      'answer','5',
      'explanation',E'ⓐ A number of + 복수 → have ✓. ⓒ None of + 복수 → were ✓. ⓔ freshwater(불가산) → is ✓'),
    jsonb_build_object('number',25,
      'question',E'다음 글의 밑줄 친 동사 중 어법상 어색한 것의 총 개수는?\n\nOne of the most urgent issues facing our planet <u>are</u> plastic pollution. A number of scientists <u>have</u> warned that plastic waste <u>is</u> entering the ocean at an alarming rate. Currently, more than 80 percent of all marine debris <u>consist</u> of plastic. Each of the solutions proposed by environmental groups <u>require</u> global cooperation to be effective.',
      'options',jsonb_build_array('1개','2개','3개','4개','5개'),
      'answer','3',
      'explanation',E'are → is (One of → 단수), consist → consists (debris 단수), require → requires (Each of → 단수). 총 3개'),
    jsonb_build_object('number',26,
      'question',E'다음 중 어법상 어색한 문장의 총 개수는?\n\nⓐ The number of species becoming extinct each year are shocking.\nⓑ Most of the electricity used in this building comes from solar panels.\nⓒ A number of local businesses was forced to close due to rising costs.\nⓓ Half of the participants in the study were women over the age of forty.\nⓔ Some of the advice given by the expert were difficult to follow in practice.\nⓕ One fourth of the land in the country is protected as a national park.',
      'options',jsonb_build_array('2개','3개','4개','5개','6개'),
      'answer','2',
      'explanation',E'ⓐ The number of → are를 is로. ⓒ A number of + 복수 → was를 were로. ⓔ advice(불가산) → were를 was로. 총 3개'),

    -- ═══════════════════════════════════════════
    -- 유형 F: 영작 선택 (Q27~Q30)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',27,
      'question',E'[유형 F] 다음 우리말을 바르게 영작한 것은?\n\n전 세계 물의 약 97퍼센트는 마실 수 없는 소금물이다.',
      'options',jsonb_build_array(
        'About 97 percents of the world''s water is undrinkable salt water.',
        'About 97 percent of the world''s waters are undrinkable salt water.',
        'About 97 percent of the world''s water are undrinkable salt water.',
        'About 97 percent of the world''s water is undrinkable salt water.',
        'About 97 percents of the world''s waters are undrinkable salt water.'
      ),
      'answer','4',
      'explanation',E'water(불가산) → 단수동사 is. percent는 복수형 없음'),
    jsonb_build_object('number',28,
      'question',E'다음 우리말을 바르게 영작한 것은?\n\n그 학교 학생들의 5분의 3이 방과 후 활동에 참여한다.',
      'options',jsonb_build_array(
        'Five thirds of the students at the school participates in after-school activities.',
        'Three fifths of the students at the school participate in after-school activities.',
        'Three fifth of the students at the school participate in after-school activities.',
        'Five thirds of the students at the school participate in after-school activities.',
        'Three fifths of the student at the school participate in after-school activities.'
      ),
      'answer','2',
      'explanation',E'3/5 = Three fifths. students(복수) → participate'),
    jsonb_build_object('number',29,
      'question',E'다음 우리말을 바르게 영작한 것은?\n\n회의에 참석한 각각의 대표자들은 제안서를 제출했다.',
      'options',jsonb_build_array(
        'Each of the representatives at the meeting submitted a proposal.',
        'Every representatives at the meeting submitted a proposal.',
        'Each representatives at the meeting submitted a proposal.',
        'Each of the representative at the meeting submitted a proposal.',
        'Every of the representatives at the meeting submitted a proposal.'
      ),
      'answer','1',
      'explanation',E'Each of the + 복수명사 + 단수동사'),
    jsonb_build_object('number',30,
      'question',E'다음 우리말을 바르게 영작한 것은?\n\n이 지역 학교들에 다니는 학생들의 수가 빠르게 감소하고 있다.',
      'options',jsonb_build_array(
        'A number of students attending schools in this area is decreasing rapidly.',
        'The number of the students attending schools in this area are decreasing rapidly.',
        'A number of students attending schools in this area are decreasing rapidly.',
        'The number of students attending schools in this area is decreasing rapidly.',
        'The numbers of students attending schools in this area is decreasing rapidly.'
      ),
      'answer','4',
      'explanation',E'The number of + 복수명사 → 단수동사 is decreasing'),

    -- ═══════════════════════════════════════════
    -- 유형 G: 지문형 빈칸 (Q31~Q35)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',31,
      'question',E'[유형 G] 다음 글을 읽고 빈칸 (A)에 들어갈 말로 가장 적절한 것을 고르시오.\n\nFood waste is a serious global issue. According to recent reports, about one third of all food produced for human consumption (A)___ lost or wasted each year. Most of the wasted food (B)___ in developed countries, where consumers often throw away edible items. A number of organizations around the world (C)___ working to reduce food waste through education and better food distribution systems.',
      'options',jsonb_build_array('are','was','is','were','have been'),
      'answer','3',
      'explanation',E'food(불가산) → 단수동사 is'),
    jsonb_build_object('number',32,
      'question',E'다음 문장의 빈칸에 들어갈 말로 가장 적절한 것을 고르시오.\n\nMost of the wasted food ___ in developed countries.',
      'options',jsonb_build_array('occur','occurs','occurring','are occurred','have occur'),
      'answer','2',
      'explanation',E'food(불가산) → 단수동사 occurs'),
    jsonb_build_object('number',33,
      'question',E'다음 문장의 빈칸에 들어갈 말로 가장 적절한 것을 고르시오.\n\nA number of organizations around the world ___ working to reduce food waste.',
      'options',jsonb_build_array('is','was','are','has been','have been'),
      'answer','3',
      'explanation',E'A number of + 복수명사 → 복수동사 are (working)'),
    jsonb_build_object('number',34,
      'question',E'다음 대화를 읽고 빈칸 (A)에 들어갈 말로 가장 적절한 것을 고르시오.\n\nTeacher: Class, let''s look at the results of our school survey. It seems that the number of students who walk to school (A)___ significantly over the past three years.\nStudent A: That''s interesting! And what about students who use public transportation?\nTeacher: Good question. About 45 percent of the students surveyed (B)___ they take the bus or subway every day.',
      'options',jsonb_build_array('grow','are grown','has grown','is growing','have grew'),
      'answer','3',
      'explanation',E'The number of → 단수, over the past three years → 현재완료 → has grown'),
    jsonb_build_object('number',35,
      'question',E'다음 문장의 빈칸에 들어갈 말로 가장 적절한 것을 고르시오.\n\nAbout 45 percent of the students surveyed ___ they take the bus or subway every day.',
      'options',jsonb_build_array('says','is said','has said','say','was said'),
      'answer','4',
      'explanation',E'45 percent of the students(복수) → 복수동사 say')
  );

  a := jsonb_build_array();

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES (
    E'주어동사수일치 Step 2',
    E'주어동사수일치',
    q,
    a,
    'problem',
    'interactive'
  );
END $$;
