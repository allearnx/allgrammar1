-- 주어동사수일치 Step 3 — 28문항 (서술형, 30 answer items)
-- template_topic: 주어동사수일치
-- category: problem, mode: interactive

DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = E'주어동사수일치 Step 3';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- 동사형태 빈칸 ★★★ (Q1~Q6)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1,
      'question',E'[★★★] 다음 빈칸에 주어진 동사의 알맞은 형태를 쓰시오.\n\nHalf of the electricity produced in this region ___ from wind turbines. (come)',
      'answer',E'comes',
      'acceptedAnswers',jsonb_build_array(),
      'explanation',E'electricity 불가산명사 → 단수동사 comes'),
    jsonb_build_object('number',2,
      'question',E'다음 빈칸에 주어진 동사의 알맞은 형태를 쓰시오.\n\nA number of scientists ___ warning that the planet''s average temperature is rising faster than expected. (be)',
      'answer',E'have been',
      'acceptedAnswers',jsonb_build_array('are'),
      'explanation',E'a number of + 복수명사 → 복수동사 have been'),
    jsonb_build_object('number',3,
      'question',E'다음 빈칸에 주어진 동사의 알맞은 형태를 쓰시오.\n\nThe number of students who choose to study abroad ___ significantly over the past decade. (increase)',
      'answer',E'has increased',
      'acceptedAnswers',jsonb_build_array(),
      'explanation',E'the number of + 복수명사 → 단수동사, over the past decade → 현재완료 has increased'),
    jsonb_build_object('number',4,
      'question',E'다음 빈칸에 주어진 동사의 알맞은 형태를 쓰시오.\n\nEach of the solutions proposed by the environmental committee ___ global cooperation to be implemented. (require)',
      'answer',E'requires',
      'acceptedAnswers',jsonb_build_array(),
      'explanation',E'each of + 복수명사 → 단수동사 requires'),
    jsonb_build_object('number',5,
      'question',E'다음 빈칸에 주어진 동사의 알맞은 형태를 쓰시오.\n\nTwo thirds of the delegates at the international conference ___ the new climate agreement last Friday. (support)',
      'answer',E'supported',
      'acceptedAnswers',jsonb_build_array(),
      'explanation',E'delegates 복수명사 → 복수동사, last Friday → 과거시제 supported'),
    jsonb_build_object('number',6,
      'question',E'다음 빈칸에 주어진 동사의 알맞은 형태를 쓰시오.\n\nNone of the evidence collected by the investigators ___ strong enough to support the accusation. (be)',
      'answer',E'was',
      'acceptedAnswers',jsonb_build_array(),
      'explanation',E'evidence 불가산명사 → 단수동사, 과거시제 was'),

    -- ═══════════════════════════════════════════
    -- 오류 수정 혼합형 ★★★★ (Q7~Q12)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',7,
      'question',E'[★★★★] 다음 문장에서 어법상 어색한 부분을 찾아 고쳐 쓰시오. 오류가 없으면 "No error"라고 쓰시오.\n\nA number of research has been conducted on the effects of social media on teenagers.',
      'answer',E'A number of research have been conducted on the effects of social media on teenagers.',
      'acceptedAnswers',jsonb_build_array('has → have','have'),
      'explanation',E'a number of + 복수명사 → 복수동사. has → have'),
    jsonb_build_object('number',8,
      'question',E'다음 문장에서 어법상 어색한 부분을 찾아 고쳐 쓰시오. 오류가 없으면 "No error"라고 쓰시오.\n\nThe number of people who rely on food banks for their daily meals are increasing in major cities.',
      'answer',E'The number of people who rely on food banks for their daily meals is increasing in major cities.',
      'acceptedAnswers',jsonb_build_array('are → is','is'),
      'explanation',E'the number of + 복수명사 → 단수동사. are → is'),
    jsonb_build_object('number',9,
      'question',E'다음 문장에서 어법상 어색한 부분을 찾아 고쳐 쓰시오. 오류가 없으면 "No error"라고 쓰시오.\n\nAbout half of all food produced for human consumption is lost or wasted before it reaches consumers.',
      'answer',E'No error',
      'acceptedAnswers',jsonb_build_array('no error'),
      'explanation',E'food 불가산명사 → 단수동사 is 올바름'),
    jsonb_build_object('number',10,
      'question',E'다음 문장에서 어법상 어색한 부분을 찾아 고쳐 쓰시오. 오류가 없으면 "No error"라고 쓰시오.\n\nOne of the most effective strategies for reducing carbon emissions are switching to renewable energy sources.',
      'answer',E'One of the most effective strategies for reducing carbon emissions is switching to renewable energy sources.',
      'acceptedAnswers',jsonb_build_array('are → is','is'),
      'explanation',E'one of + 복수명사 → 단수동사. are → is'),
    jsonb_build_object('number',11,
      'question',E'다음 문장에서 어법상 어색한 부분을 찾아 고쳐 쓰시오. 오류가 없으면 "No error"라고 쓰시오.\n\nOver 60 percent of the world''s freshwater resources is locked in glaciers and polar ice caps.',
      'answer',E'Over 60 percent of the world''s freshwater resources are locked in glaciers and polar ice caps.',
      'acceptedAnswers',jsonb_build_array('is → are','are'),
      'explanation',E'freshwater resources 복수명사 → 복수동사. is → are'),
    jsonb_build_object('number',12,
      'question',E'다음 문장에서 어법상 어색한 부분을 찾아 고쳐 쓰시오. 오류가 없으면 "No error"라고 쓰시오.\n\nEach of the participants in the workshop were required to submit a written reflection after each session.',
      'answer',E'Each of the participants in the workshop was required to submit a written reflection after each session.',
      'acceptedAnswers',jsonb_build_array('were → was','was'),
      'explanation',E'each of + 복수명사 → 단수동사. were → was'),

    -- ═══════════════════════════════════════════
    -- 동의문 전환 ★★★★ (Q13~Q18)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',13,
      'question',E'[★★★★] 다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nThree out of every ten students in our school walk to school.\n= ___ ___ the students in our school walk to school.',
      'answer',E'Thirty percent of',
      'acceptedAnswers',jsonb_build_array('30 percent of','30% of'),
      'explanation',E'3/10 = 30 percent → Thirty percent of'),
    jsonb_build_object('number',14,
      'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nOnly 400 out of 2,000 residents voted in favor of the proposal.\n= Only ___ ___ the residents voted in favor of the proposal.',
      'answer',E'one fifth of',
      'acceptedAnswers',jsonb_build_array('One fifth of','1/5 of','20 percent of','20% of'),
      'explanation',E'400/2000 = 1/5 → one fifth of'),
    jsonb_build_object('number',15,
      'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nMost of the information on this website is updated every week.\n= Most of the information on this website ___ ___ every week.',
      'answer',E'is updated',
      'acceptedAnswers',jsonb_build_array('gets updated'),
      'explanation',E'수동태 is updated 또는 gets updated'),
    jsonb_build_object('number',16,
      'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nThe number of electric vehicles sold last year was surprising.\n= It was surprising (1)___ electric vehicles (2)___ sold last year.',
      'answer',E'how many / were',
      'acceptedAnswers',jsonb_build_array(),
      'explanation',E'(1) how many: 수량 표현 전환. (2) were: electric vehicles 복수 → 복수동사',
      'subParts',jsonb_build_array(
        jsonb_build_object('label','(1)','answer','how many','acceptedAnswers',jsonb_build_array()),
        jsonb_build_object('label','(2)','answer','were','acceptedAnswers',jsonb_build_array())
      )),
    jsonb_build_object('number',17,
      'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nSome of the money collected at the event was donated to charity.\n= Not all ___ ___ ___ at the event was donated to charity.',
      'answer',E'of the money collected',
      'acceptedAnswers',jsonb_build_array('the money collected'),
      'explanation',E'Some of → Not all of: 부분 부정으로 전환'),
    jsonb_build_object('number',18,
      'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nHalf of the students in the survey said they prefer group projects to individual work.\n= ___ students in the survey said they prefer group projects to individual work.',
      'answer',E'Fifty percent of the',
      'acceptedAnswers',jsonb_build_array('50 percent of the','50% of the'),
      'explanation',E'Half of = Fifty percent of'),

    -- ═══════════════════════════════════════════
    -- 단락·대화문 빈칸 ★★★★ (Q19~Q20)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',19,
      'question',E'[★★★★] 다음 글의 빈칸에 알맞은 형태를 쓰시오.\n\nGlobal food systems face enormous pressure. According to a recent UN report, about one third of all food produced worldwide (A)___ wasted each year before it is consumed. Most of the wasted food (B)___ from households in high-income countries, where consumers often buy more than they need. Fortunately, the number of organizations actively working to reduce food waste (C)___ steadily over the past five years.',
      'answer',E'is / comes / has grown',
      'acceptedAnswers',jsonb_build_array(),
      'explanation',E'(A) food 불가산 → is. (B) food 불가산 → comes. (C) the number of → 단수, 현재완료 has grown',
      'subParts',jsonb_build_array(
        jsonb_build_object('label','(A)','answer','is','acceptedAnswers',jsonb_build_array()),
        jsonb_build_object('label','(B)','answer','comes','acceptedAnswers',jsonb_build_array()),
        jsonb_build_object('label','(C)','answer','has grown','acceptedAnswers',jsonb_build_array('has increased'))
      )),
    jsonb_build_object('number',20,
      'question',E'다음 대화의 빈칸에 알맞은 형태를 쓰시오.\n\nTeacher: Let''s look at this week''s survey results. About 45 percent of students in our school ___ they feel stressed about exams more than three times a week.\nStudent: That''s quite high. What can we do about it?',
      'answer',E'say',
      'acceptedAnswers',jsonb_build_array('said'),
      'explanation',E'45 percent of students 복수명사 → 복수동사 say'),

    -- ═══════════════════════════════════════════
    -- 조건 영작 ★★★★★ (Q21~Q24)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',21,
      'question',E'[★★★★★] 주어진 조건에 맞게 우리말을 영작하시오.\n[조건] two thirds of 사용 / budget, research, spend\n\n그 연구 예산의 3분의 2는 현장 조사에 쓰였다.',
      'answer',E'Two thirds of the research budget was spent on fieldwork.',
      'acceptedAnswers',jsonb_build_array('Two thirds of the research budget was spent on fieldwork','Two thirds of the research budget was spent on field work.','Two thirds of the research budget was spent on field work'),
      'explanation',E'budget(단수) → was spent. Two thirds of the research budget was spent on fieldwork.'),
    jsonb_build_object('number',22,
      'question',E'주어진 조건에 맞게 우리말을 영작하시오.\n[조건] a number of 사용 / 현재완료 시제 / report, confirm\n\n많은 보고서들이 기후 변화의 심각성을 확인해 왔다.',
      'answer',E'A number of reports have confirmed the severity of climate change.',
      'acceptedAnswers',jsonb_build_array('A number of reports have confirmed the severity of climate change'),
      'explanation',E'a number of + 복수 → have confirmed'),
    jsonb_build_object('number',23,
      'question',E'주어진 조건에 맞게 우리말을 영작하시오.\n[조건] the number of 사용 / 현재진행형 / child, live, poverty\n\n빈곤 속에서 살고 있는 어린이의 수가 여전히 증가하고 있다.',
      'answer',E'The number of children living in poverty is still increasing.',
      'acceptedAnswers',jsonb_build_array('The number of children living in poverty is still increasing'),
      'explanation',E'the number of → 단수 → is still increasing'),
    jsonb_build_object('number',24,
      'question',E'주어진 조건에 맞게 우리말을 영작하시오.\n[조건] one of 사용 / biggest, challenge, face, today, climate change 모두 사용\n\n오늘날 우리가 직면하는 가장 큰 도전 중 하나는 기후 변화이다.',
      'answer',E'One of the biggest challenges we face today is climate change.',
      'acceptedAnswers',jsonb_build_array('One of the biggest challenges we face today is climate change','One of the biggest challenges that we face today is climate change.','One of the biggest challenges that we face today is climate change'),
      'explanation',E'one of + 복수명사 → 단수동사 is'),

    -- ═══════════════════════════════════════════
    -- 실전 영작 ★★★★★ (Q25~Q28)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',25,
      'question',E'[★★★★★] 다음 우리말을 완전한 영어 문장으로 쓰시오.\n\n전 세계 산소의 약 절반이 바다의 식물성 플랑크톤에 의해 만들어진다.',
      'answer',E'About half of the world''s oxygen is produced by oceanic phytoplankton.',
      'acceptedAnswers',jsonb_build_array('About half of the world''s oxygen is produced by oceanic phytoplankton','About half of the world''s oxygen is made by oceanic phytoplankton.','About half of the world''s oxygen is made by oceanic phytoplankton'),
      'explanation',E'oxygen(불가산) → 단수동사 is produced'),
    jsonb_build_object('number',26,
      'question',E'다음 우리말을 완전한 영어 문장으로 쓰시오.\n\n도시의 많은 새로운 카페들이 지난 몇 달 동안 문을 열었다.',
      'answer',E'A number of new cafes in the city have opened over the past few months.',
      'acceptedAnswers',jsonb_build_array('A number of new cafes in the city have opened over the past few months','A number of new cafés in the city have opened over the past few months.','A number of new cafés in the city have opened over the past few months'),
      'explanation',E'a number of + 복수명사 → 복수동사 have opened'),
    jsonb_build_object('number',27,
      'question',E'다음 우리말을 완전한 영어 문장으로 쓰시오.\n\n그 강의 수질을 모니터링하는 과학자들의 4분의 3이 오염 수준이 위험하다고 경고한다.',
      'answer',E'Three quarters of the scientists monitoring the river''s water quality warn that pollution levels are dangerous.',
      'acceptedAnswers',jsonb_build_array('Three quarters of the scientists monitoring the river''s water quality warn that pollution levels are dangerous','Three fourths of the scientists monitoring the river''s water quality warn that pollution levels are dangerous.','Three fourths of the scientists monitoring the river''s water quality warn that pollution levels are dangerous'),
      'explanation',E'scientists(복수) → 복수동사 warn'),
    jsonb_build_object('number',28,
      'question',E'다음 우리말을 완전한 영어 문장으로 쓰시오.\n\n그 학교의 각 학생은 매 학기 말에 지역사회 봉사 시간을 기록해야 한다.',
      'answer',E'Each of the students at the school must record their community service hours at the end of every semester.',
      'acceptedAnswers',jsonb_build_array('Each of the students at the school must record their community service hours at the end of every semester','Each student at the school must record their community service hours at the end of every semester.','Each student at the school must record their community service hours at the end of every semester'),
      'explanation',E'each of + 복수명사 → 단수동사 must record')
  );

  a := jsonb_build_array(E'comes', E'have been', E'has increased', E'requires', E'supported', E'was', E'A number of research have been conducted on the effects of social media on teenagers.', E'The number of people who rely on food banks for their daily meals is increasing in major cities.', E'No error', E'One of the most effective strategies for reducing carbon emissions is switching to renewable energy sources.', E'Over 60 percent of the world''s freshwater resources are locked in glaciers and polar ice caps.', E'Each of the participants in the workshop was required to submit a written reflection after each session.', E'Thirty percent of', E'one fifth of', E'is updated', E'how many / were', 'how many', 'were', E'of the money collected', E'Fifty percent of the', E'is / comes / has grown', 'is', 'comes', 'has grown', E'say', E'Two thirds of the research budget was spent on fieldwork.', E'A number of reports have confirmed the severity of climate change.', E'The number of children living in poverty is still increasing.', E'One of the biggest challenges we face today is climate change.', E'About half of the world''s oxygen is produced by oceanic phytoplankton.', E'A number of new cafes in the city have opened over the past few months.', E'Three quarters of the scientists monitoring the river''s water quality warn that pollution levels are dangerous.', E'Each of the students at the school must record their community service hours at the end of every semester.');

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES (
    E'주어동사수일치 Step 3',
    E'주어동사수일치',
    q,
    a,
    'problem',
    'interactive'
  );
END $$;
