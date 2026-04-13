DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = 'so that Step 3';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- Q1-Q2: 우리말 → 빈칸 완성
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1,
      'question',E'다음 우리말에 맞게 주어진 단어를 이용하여 빈칸에 알맞은 말을 쓰시오.\n\n그가 발표를 잘 준비할 수 있도록, 그녀는 자료를 미리 보내주었다. (prepare)\n→ She sent him the materials in advance ________ ________ he ________ ________ his presentation well.',
      'answer',E'so that, could prepare',
      'acceptedAnswers',jsonb_build_array(E'so that, could prepare',E'so that / could prepare',E'so that could prepare',E'so, that, could, prepare'),
      'explanation',E'so that + 주어 + could + 동사원형: 과거 시제 목적절'),

    jsonb_build_object('number',2,
      'question',E'다음 우리말에 맞게 주어진 단어를 이용하여 빈칸에 알맞은 말을 쓰시오.\n\n우리가 마감 시간을 맞출 수 있도록, 팀장은 회의를 일찍 시작했다. (meet)\n→ The team leader started the meeting early ________ ________ we ________ ________ the deadline.',
      'answer',E'so that, could meet',
      'acceptedAnswers',jsonb_build_array(E'so that, could meet',E'so that / could meet',E'so that could meet',E'so, that, could, meet'),
      'explanation',E'so that + 주어 + could + 동사원형: 과거 시제 목적절'),

    -- ═══════════════════════════════════════════
    -- Q3-Q6: 알맞은 표현 고르기
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',3,
      'question',E'다음 문장에서 알맞은 것을 고르시오.\n\nYou should double-check your answers (so as to / so as not to) make careless mistakes on the exam.',
      'answer',E'so as not to',
      'acceptedAnswers',jsonb_build_array(E'so as not to',E'So as not to'),
      'explanation',E'실수를 하지 않기 위해 → 부정 목적 so as not to'),

    jsonb_build_object('number',4,
      'question',E'다음 문장에서 알맞은 것을 고르시오.\n\nShe practiced her speech every day (so as to / so as not to) sound confident in front of the audience.',
      'answer',E'so as to',
      'acceptedAnswers',jsonb_build_array(E'so as to',E'So as to'),
      'explanation',E'자신감 있게 들리기 위해 → 긍정 목적 so as to'),

    jsonb_build_object('number',5,
      'question',E'다음 문장에서 알맞은 것을 고르시오.\n\nPlease speak more slowly (so that you / so that you don''t) confuse the listeners.',
      'answer',E'so that you don''t',
      'acceptedAnswers',jsonb_build_array(E'so that you don''t',E'So that you don''t',E'so that you do not'),
      'explanation',E'혼란시키지 않도록 → 부정 목적 so that ~ don''t'),

    jsonb_build_object('number',6,
      'question',E'다음 문장에서 알맞은 것을 고르시오.\n\nHe is reviewing his notes now (so that he''ll / so that he won''t) forget the key points before the test.',
      'answer',E'so that he won''t',
      'acceptedAnswers',jsonb_build_array(E'so that he won''t',E'So that he won''t',E'so that he will not'),
      'explanation',E'잊지 않기 위해 → 부정 목적 so that ~ won''t'),

    -- ═══════════════════════════════════════════
    -- Q7-Q9: 보기 단어 활용 so that 문장 완성
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',7,
      'question',E'다음 ＜보기＞에서 알맞은 단어를 두 가지 골라 so that을 활용한 문장을 완성하시오.\n＜보기＞ explain / stay / record / deliver / check\n\nI''ll ________ here ________ ________ you can ________ everything clearly.',
      'answer',E'stay, explain',
      'acceptedAnswers',jsonb_build_array(E'stay, explain',E'stay / explain',E'stay, so that, explain',E'stay / so that / explain'),
      'explanation',E'보기에서 stay와 explain을 골라 so that 문장 완성'),

    jsonb_build_object('number',8,
      'question',E'다음 ＜보기＞에서 알맞은 단어를 두 가지 골라 so that을 활용한 문장을 완성하시오.\n＜보기＞ explain / stay / record / deliver / review\n\nShe decided to ________ the lecture ________ ________ she could ________ it later.',
      'answer',E'record, review',
      'acceptedAnswers',jsonb_build_array(E'record, review',E'record / review',E'record / so that / review',E'record, so that, review'),
      'explanation',E'나중에 복습할 수 있도록 녹음 → record + review'),

    jsonb_build_object('number',9,
      'question',E'다음 ＜보기＞에서 알맞은 단어를 두 가지 골라 so that을 활용한 문장을 완성하시오.\n＜보기＞ explain / stay / record / deliver / check\n\nLet''s ________ the schedule ________ ________ we can ________ the package on time.',
      'answer',E'check, deliver',
      'acceptedAnswers',jsonb_build_array(E'check, deliver',E'check / deliver',E'check / so that / deliver',E'check, so that, deliver'),
      'explanation',E'보기에서 check와 deliver를 골라 so that 문장 완성'),

    -- ═══════════════════════════════════════════
    -- Q10-Q12: 보기 표현으로 부사절 완성
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',10,
      'question',E'다음 ＜보기＞의 표현과 so that을 활용하여 목적을 나타내는 부사절을 완성하시오.\n＜보기＞ his sister could use it / every student could read it / she could submit it before the deadline\n\nHe printed out the report _________________________________.',
      'answer',E'so that every student could read it',
      'acceptedAnswers',jsonb_build_array(E'so that every student could read it',E'so that every student could read it.'),
      'explanation',E'모든 학생이 읽을 수 있도록 → so that every student could read it'),

    jsonb_build_object('number',11,
      'question',E'다음 ＜보기＞의 표현과 so that을 활용하여 목적을 나타내는 부사절을 완성하시오.\n＜보기＞ his sister could use it / every student could read it / she could submit it before the deadline\n\nThe boy lent his laptop _________________________________.',
      'answer',E'so that his sister could use it',
      'acceptedAnswers',jsonb_build_array(E'so that his sister could use it',E'so that his sister could use it.'),
      'explanation',E'여동생이 사용할 수 있도록 → so that his sister could use it'),

    jsonb_build_object('number',12,
      'question',E'다음 ＜보기＞의 표현과 so that을 활용하여 목적을 나타내는 부사절을 완성하시오.\n＜보기＞ his sister could use it / every student could read it / she could submit it before the deadline\n\nShe stayed up late _________________________________.',
      'answer',E'so that she could submit it before the deadline',
      'acceptedAnswers',jsonb_build_array(E'so that she could submit it before the deadline',E'so that she could submit it before the deadline.'),
      'explanation',E'마감 전에 제출할 수 있도록 → so that she could submit it before the deadline'),

    -- ═══════════════════════════════════════════
    -- Q13-Q17: so that vs , so 구별
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',13,
      'question',E'다음 주어진 문장을 읽고, so가 in order that을 의미하면 ''so that''이라 고쳐 쓰고, therefore를 의미하면 콤마를 추가하여 '', so''라 고쳐 쓰시오.\n\n＜보기＞\n(1) I set my alarm so I could catch the early train. → so that\n(2) I missed the bus so I had to walk to school. → , so\n\nShe studied the map so she wouldn''t get lost in the city.',
      'answer',E'so that',
      'acceptedAnswers',jsonb_build_array(E'so that',E'So that'),
      'explanation',E'길을 잃지 않기 위해 → 목적 → so that'),

    jsonb_build_object('number',14,
      'question',E'다음 주어진 문장을 읽고, so가 in order that을 의미하면 ''so that''이라 고쳐 쓰고, therefore를 의미하면 콤마를 추가하여 '', so''라 고쳐 쓰시오.\n\n＜보기＞\n(1) I set my alarm so I could catch the early train. → so that\n(2) I missed the bus so I had to walk to school. → , so\n\nHe didn''t bring an umbrella so he got soaked in the rain.',
      'answer',E', so',
      'acceptedAnswers',jsonb_build_array(E', so',E',so',E', So'),
      'explanation',E'우산이 없어서 비에 젖었다 → 결과 → , so'),

    jsonb_build_object('number',15,
      'question',E'다음 주어진 문장을 읽고, so가 in order that을 의미하면 ''so that''이라 고쳐 쓰고, therefore를 의미하면 콤마를 추가하여 '', so''라 고쳐 쓰시오.\n\n＜보기＞\n(1) I set my alarm so I could catch the early train. → so that\n(2) I missed the bus so I had to walk to school. → , so\n\nThe teacher wrote the instructions on the board so every student could follow them.',
      'answer',E'so that',
      'acceptedAnswers',jsonb_build_array(E'so that',E'So that'),
      'explanation',E'학생들이 따라할 수 있도록 → 목적 → so that'),

    jsonb_build_object('number',16,
      'question',E'다음 주어진 문장을 읽고, so가 in order that을 의미하면 ''so that''이라 고쳐 쓰고, therefore를 의미하면 콤마를 추가하여 '', so''라 고쳐 쓰시오.\n\n＜보기＞\n(1) I set my alarm so I could catch the early train. → so that\n(2) I missed the bus so I had to walk to school. → , so\n\nMinjun finished his homework early so he could watch the game.',
      'answer',E'so that',
      'acceptedAnswers',jsonb_build_array(E'so that',E'So that'),
      'explanation',E'경기를 볼 수 있도록 → 목적 → so that'),

    jsonb_build_object('number',17,
      'question',E'다음 주어진 문장을 읽고, so가 in order that을 의미하면 ''so that''이라 고쳐 쓰고, therefore를 의미하면 콤마를 추가하여 '', so''라 고쳐 쓰시오.\n\n＜보기＞\n(1) I set my alarm so I could catch the early train. → so that\n(2) I missed the bus so I had to walk to school. → , so\n\nThe store was out of stock so we had to order online.',
      'answer',E', so',
      'acceptedAnswers',jsonb_build_array(E', so',E',so',E', So'),
      'explanation',E'품절이어서 온라인 주문해야 했다 → 결과 → , so'),

    -- ═══════════════════════════════════════════
    -- Q18-Q20: 어순 배열
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',18,
      'question',E'다음 주어진 표현을 바르게 배열하여 문장을 완성하시오.\n\nHe goes to bed before midnight (he / stay focused / so / that / can / the next day).\n→ He goes to bed before midnight _________________________________.',
      'answer',E'so that he can stay focused the next day',
      'acceptedAnswers',jsonb_build_array(E'so that he can stay focused the next day',E'so that he can stay focused the next day.'),
      'explanation',E'so that + 주어 + can + 동사: 목적 부사절 어순 배열'),

    jsonb_build_object('number',19,
      'question',E'다음 주어진 표현을 바르게 배열하여 문장을 완성하시오.\n\nCan you turn down the music (study / that / so / I / can / in silence)?\n→ Can you turn down the music _________________________________?',
      'answer',E'so that I can study in silence',
      'acceptedAnswers',jsonb_build_array(E'so that I can study in silence',E'so that I can study in silence?'),
      'explanation',E'so that + 주어 + can + 동사: 목적 부사절 어순 배열'),

    jsonb_build_object('number',20,
      'question',E'다음 주어진 표현을 바르게 배열하여 문장을 완성하시오.\n\nThe city installed more streetlights (can / so / walk safely at night / that / residents).\n→ The city installed more streetlights _________________________________.',
      'answer',E'so that residents can walk safely at night',
      'acceptedAnswers',jsonb_build_array(E'so that residents can walk safely at night',E'so that residents can walk safely at night.'),
      'explanation',E'so that + 주어 + can + 동사: 목적 부사절 어순 배열'),

    -- ═══════════════════════════════════════════
    -- Q21-Q22: so that으로 다시 쓰기
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',21,
      'question',E'다음 주어진 문장을 ''so that''을 이용하여 다시 쓸 때, 빈칸을 완성하시오.\n\nI memorized his phone number because I wanted to call him anytime.\n→ I memorized his phone number _________________________________ I ________ call him anytime.',
      'answer',E'so that, could',
      'acceptedAnswers',jsonb_build_array(E'so that, could',E'so that / could',E'so that could'),
      'explanation',E'because I wanted → so that I could: 과거 시제 목적 전환'),

    jsonb_build_object('number',22,
      'question',E'다음 주어진 문장을 ''so that''을 이용하여 다시 쓸 때, 빈칸을 완성하시오.\n\nShe is practicing the piano hard because she wants to perform well at the recital.\n→ She is practicing the piano hard _________________________________ she ________ perform well at the recital.',
      'answer',E'so that, could',
      'acceptedAnswers',jsonb_build_array(E'so that, could',E'so that / could',E'so that, can',E'so that / can'),
      'explanation',E'because she wants → so that she could/can: 목적 전환'),

    -- ═══════════════════════════════════════════
    -- Q23-Q25: 동의 문장 빈칸
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',23,
      'question',E'다음 두 문장의 의미가 같도록 빈칸에 들어갈 알맞은 말을 쓰시오.\n\nHe wore a mask so that he wouldn''t spread the virus.\n→ He wore a mask in ________ ________ ________ spread the virus.',
      'answer',E'order not to',
      'acceptedAnswers',jsonb_build_array(E'order not to',E'order / not / to',E'order, not, to'),
      'explanation',E'so that ~ wouldn''t → in order not to: 부정 목적 전환'),

    jsonb_build_object('number',24,
      'question',E'다음 두 문장의 의미가 같도록 빈칸에 들어갈 알맞은 말을 쓰시오.\n\nShe left the house early so that she could avoid the traffic.\n→ She left the house early ________ ________ ________ avoid the traffic.',
      'answer',E'in order to',
      'acceptedAnswers',jsonb_build_array(E'in order to',E'in / order / to',E'in, order, to'),
      'explanation',E'so that ~ could → in order to: 긍정 목적 전환'),

    jsonb_build_object('number',25,
      'question',E'다음 두 문장의 의미가 같도록 빈칸에 들어갈 알맞은 말을 쓰시오.\n\nThey practiced every day so that they could win the championship.\n→ They practiced every day in ________ ________ win the championship.',
      'answer',E'order to',
      'acceptedAnswers',jsonb_build_array(E'order to',E'order / to',E'order, to'),
      'explanation',E'so that ~ could → in order to: 목적 전환 (in은 이미 제시)'),

    -- ═══════════════════════════════════════════
    -- Q26-Q28: 영작
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',26,
      'question',E'다음 우리말과 일치하도록 주어진 단어를 사용하여 영작하시오.\n\n모든 팀원이 계획을 이해할 수 있도록, 그는 천천히 설명했다.\n→ He explained slowly ________ ________ every team member ________ ________ the plan.',
      'answer',E'so that, could understand',
      'acceptedAnswers',jsonb_build_array(E'so that, could understand',E'so that / could understand',E'so, that, could, understand',E'so that could understand'),
      'explanation',E'so that + 주어 + could + 동사: 과거 시제 목적절'),

    jsonb_build_object('number',27,
      'question',E'다음 우리말과 일치하도록 주어진 단어를 사용하여 영작하시오.\n\n나는 중요한 내용을 놓치지 않도록 강의를 녹음했다.\n→ I recorded the lecture ________ ________ ________ ________ miss any important content.',
      'answer',E'so as not to',
      'acceptedAnswers',jsonb_build_array(E'so as not to',E'so / as / not / to',E'so, as, not, to'),
      'explanation',E'~하지 않기 위해 → so as not to + 동사원형'),

    jsonb_build_object('number',28,
      'question',E'다음 우리말과 일치하도록 영작하시오.\n\n(1) 아이들이 그 영화를 이해할 수 있도록 자막을 추가해 주세요.\n→ Please add subtitles _________________________________.\n\n(2) 그의 발언은 많은 사람들에게 영향을 끼쳤다. 그래서 그는 책임감을 느꼈다.\n→ His speech had an impact on many people, ________ he felt a sense of responsibility.',
      'answer',E'(1) so that children could understand the movie (2) so',
      'acceptedAnswers',jsonb_build_array(E'(1) so that children could understand the movie (2) so',E'(1) so that the children could understand the movie (2) so',E'(1) so that kids could understand the movie (2) so',E'(1) so that children can understand the movie (2) so',E'(1) so that the children can understand the movie (2) so',E'so that children could understand the movie, so',E'so that children could understand the movie / so',E'so that children can understand the movie, so'),
      'explanation',E'(1) so that + 목적절 (2) , so = 결과 (therefore)'),

    -- ═══════════════════════════════════════════
    -- Q29-Q31: 두 문장 → 한 문장
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',29,
      'question',E'다음 ＜보기＞와 같이 두 문장을 한 문장으로 만드시오.\n\n＜보기＞\nShe practiced every night. She wanted to improve her pronunciation.\n→ She practiced every night so that she could improve her pronunciation.\n\nHe saved up for months. He wanted to buy a new laptop.',
      'answer',E'He saved up for months so that he could buy a new laptop.',
      'acceptedAnswers',jsonb_build_array(E'He saved up for months so that he could buy a new laptop.',E'He saved up for months so that he could buy a new laptop'),
      'explanation',E'두 문장을 so that으로 연결: 목적 부사절'),

    jsonb_build_object('number',30,
      'question',E'다음 ＜보기＞와 같이 두 문장을 한 문장으로 만드시오.\n\n＜보기＞\nShe practiced every night. She wanted to improve her pronunciation.\n→ She practiced every night so that she could improve her pronunciation.\n\nShe volunteered at the hospital. She wanted to gain experience in the medical field.',
      'answer',E'She volunteered at the hospital so that she could gain experience in the medical field.',
      'acceptedAnswers',jsonb_build_array(E'She volunteered at the hospital so that she could gain experience in the medical field.',E'She volunteered at the hospital so that she could gain experience in the medical field'),
      'explanation',E'두 문장을 so that으로 연결: 목적 부사절'),

    jsonb_build_object('number',31,
      'question',E'다음 ＜보기＞와 같이 두 문장을 한 문장으로 만드시오.\n\n＜보기＞\nShe practiced every night. She wanted to improve her pronunciation.\n→ She practiced every night so that she could improve her pronunciation.\n\nThey left two hours early. They wanted to arrive before the storm hit.',
      'answer',E'They left two hours early so that they could arrive before the storm hit.',
      'acceptedAnswers',jsonb_build_array(E'They left two hours early so that they could arrive before the storm hit.',E'They left two hours early so that they could arrive before the storm hit'),
      'explanation',E'두 문장을 so that으로 연결: 목적 부사절'),

    -- ═══════════════════════════════════════════
    -- Q32-Q34: 빈칸
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',32,
      'question',E'다음 각 빈칸에 알맞은 말을 쓰시오.\n\nShe spoke in a low voice ________ ________ people around her couldn''t hear her conversation.',
      'answer',E'so that',
      'acceptedAnswers',jsonb_build_array(E'so that',E'So that'),
      'explanation',E'~할 수 없도록 → so that (목적)'),

    jsonb_build_object('number',33,
      'question',E'다음 각 빈칸에 알맞은 말을 쓰시오.\n\nI was ________ nervous ________ I couldn''t say a single word on stage.',
      'answer',E'so, that',
      'acceptedAnswers',jsonb_build_array(E'so, that',E'so / that',E'so that'),
      'explanation',E'so + 형용사 + that: 결과 구문 (너무 ~해서 ~했다)'),

    jsonb_build_object('number',34,
      'question',E'다음 각 빈칸에 알맞은 말을 쓰시오.\n\nPlease keep the door closed in ________ ________ the noise doesn''t disturb the meeting.',
      'answer',E'order that',
      'acceptedAnswers',jsonb_build_array(E'order that',E'order / that',E'Order that'),
      'explanation',E'in order that = so that: 목적 접속사'),

    -- ═══════════════════════════════════════════
    -- Q35-Q36: 보기 단어 활용 빈칸
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',35,
      'question',E'다음 ＜보기＞에 있는 단어를 이용하여 목적을 나타내는 문장이 되도록 빈칸을 채우시오.\n＜보기＞ finish / catch / send / save / review\n\nThe student is studying late at night ________ ________ ________ ________ ________ all the material before the exam.',
      'answer',E'so that she could review',
      'acceptedAnswers',jsonb_build_array(E'so that she could review',E'so that he could review',E'so / that / she / could / review',E'so / that / he / could / review'),
      'explanation',E'보기에서 review를 골라 so that 목적절 완성'),

    jsonb_build_object('number',36,
      'question',E'다음 ＜보기＞에 있는 단어를 이용하여 목적을 나타내는 문장이 되도록 빈칸을 채우시오.\n＜보기＞ finish / catch / send / save / review\n\nShe is running to the station ________ ________ ________ ________ ________ the last train.',
      'answer',E'so that she could catch',
      'acceptedAnswers',jsonb_build_array(E'so that she could catch',E'so that she can catch',E'so / that / she / could / catch'),
      'explanation',E'보기에서 catch를 골라 so that 목적절 완성'),

    -- ═══════════════════════════════════════════
    -- Q37-Q40: 인물-목적 연결
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',37,
      'question',E'다음 각 인물의 행동에 대한 적절한 목적을 ＜보기＞에서 찾아 so that을 사용하여 한 문장으로 연결하시오.\n\n인물: Jiho is charging his phone.\n＜보기＞ to stay fit and healthy / to buy a new camera / to communicate with foreign friends / to use it during the trip\n\nJiho is charging his phone ________ he can _________________________________.',
      'answer',E'so that, use it during the trip',
      'acceptedAnswers',jsonb_build_array(E'so that he can use it during the trip',E'so that, use it during the trip',E'so that he can use it during the trip.'),
      'explanation',E'Jiho의 행동 목적 → 여행 중 사용 → to use it during the trip'),

    jsonb_build_object('number',38,
      'question',E'다음 각 인물의 행동에 대한 적절한 목적을 ＜보기＞에서 찾아 so that을 사용하여 한 문장으로 연결하시오.\n\n인물: Sora is taking an online English course.\n＜보기＞ to stay fit and healthy / to buy a new camera / to communicate with foreign friends / to use it during the trip',
      'answer',E'Sora is taking an online English course so that she can communicate with foreign friends.',
      'acceptedAnswers',jsonb_build_array(E'Sora is taking an online English course so that she can communicate with foreign friends.',E'Sora is taking an online English course so that she can communicate with foreign friends'),
      'explanation',E'Sora의 목적 → 외국 친구들과 소통 → communicate with foreign friends'),

    jsonb_build_object('number',39,
      'question',E'다음 각 인물의 행동에 대한 적절한 목적을 ＜보기＞에서 찾아 so that을 사용하여 한 문장으로 연결하시오.\n\n인물: Minho runs every morning.\n＜보기＞ to stay fit and healthy / to buy a new camera / to communicate with foreign friends / to use it during the trip',
      'answer',E'Minho runs every morning so that he can stay fit and healthy.',
      'acceptedAnswers',jsonb_build_array(E'Minho runs every morning so that he can stay fit and healthy.',E'Minho runs every morning so that he can stay fit and healthy'),
      'explanation',E'Minho의 목적 → 건강 유지 → stay fit and healthy'),

    jsonb_build_object('number',40,
      'question',E'다음 각 인물의 행동에 대한 적절한 목적을 ＜보기＞에서 찾아 so that을 사용하여 한 문장으로 연결하시오.\n\n인물: Yuna opened a savings account.\n＜보기＞ to stay fit and healthy / to buy a new camera / to communicate with foreign friends / to use it during the trip',
      'answer',E'Yuna opened a savings account so that she could buy a new camera.',
      'acceptedAnswers',jsonb_build_array(E'Yuna opened a savings account so that she could buy a new camera.',E'Yuna opened a savings account so that she could buy a new camera'),
      'explanation',E'Yuna의 목적 → 새 카메라 구매 → buy a new camera'),

    -- ═══════════════════════════════════════════
    -- Q41-Q55: 실전편
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',41,
      'question',E'[실전편]\n다음 두 문장의 의미가 같도록 빈칸에 들어갈 알맞은 말을 쓰시오.\n\nShe wore earplugs so that she wouldn''t be disturbed by the noise.\n→ She wore earplugs in ________ ________ ________ be disturbed by the noise.',
      'answer',E'order not to',
      'acceptedAnswers',jsonb_build_array(E'order not to',E'order / not / to',E'order, not, to'),
      'explanation',E'so that ~ wouldn''t → in order not to: 부정 목적 전환'),

    jsonb_build_object('number',42,
      'question',E'[실전편]\n다음 대화의 내용을 한 문장으로 쓸 때 빈칸에 들어갈 알맞은 말을 쓰시오.\n\nA: Why did you go to the bookstore?\nB: To pick up a book I ordered.\n→ I went to the bookstore ________ that I ________ pick up a book I had ordered.',
      'answer',E'so, could',
      'acceptedAnswers',jsonb_build_array(E'so, could',E'so / could',E'so could'),
      'explanation',E'목적 → so that + could (과거)'),

    jsonb_build_object('number',43,
      'question',E'[실전편]\n다음 우리말과 일치하도록 빈칸에 들어갈 알맞은 말을 쓰시오.\n\n나는 그 대학교에 입학할 수 있도록 열심히 준비하고 있다.\n→ I am preparing hard ________ ________ I ________ ________ the university.',
      'answer',E'so that, could enter',
      'acceptedAnswers',jsonb_build_array(E'so that, could enter',E'so that / could enter',E'so that, can enter',E'so that / can enter',E'so, that, could, enter',E'so, that, can, enter'),
      'explanation',E'so that + 주어 + could/can + 동사원형'),

    jsonb_build_object('number',44,
      'question',E'[실전편]\n다음 우리말과 일치하도록 빈칸에 들어갈 알맞은 말을 쓰시오.\n\n좋은 습관을 기를 수 있도록 우리는 매일 꾸준히 노력해야 한다.\n→ We should make consistent efforts every day ________ ________ we could develop good habits.',
      'answer',E'so that',
      'acceptedAnswers',jsonb_build_array(E'so that',E'So that'),
      'explanation',E'so that + 주어 + could: 목적 접속사'),

    jsonb_build_object('number',45,
      'question',E'[실전편]\n다음 우리말과 일치하도록 빈칸에 들어갈 알맞은 말을 쓰시오.\n\n그들은 신분을 숨기기 위해서 모자를 눌러썼다.\n→ They pulled their hats down ________ ________ they could hide their identities.',
      'answer',E'so that',
      'acceptedAnswers',jsonb_build_array(E'so that',E'So that'),
      'explanation',E'so that + 주어 + could: 과거 시제 목적절'),

    jsonb_build_object('number',46,
      'question',E'[실전편]\n다음 ＜보기＞에서 빈칸에 들어갈 알맞은 말을 골라 쓰시오.\n\n＜보기＞\nI could concentrate on my work\nshe could improve her presentation skills\nhe could return the borrowed books\nhe could be on time for the interview\nI could sleep better at night\n\n→ I turned off all my devices so that _________________________________.',
      'answer',E'I could concentrate on my work',
      'acceptedAnswers',jsonb_build_array(E'I could concentrate on my work',E'I could concentrate on my work.'),
      'explanation',E'기기를 끈 목적 → 일에 집중하기 위해'),

    jsonb_build_object('number',47,
      'question',E'[실전편]\n다음 ＜보기＞와 같이 두 문장의 의미가 같도록 문장을 바꿔 쓰시오.\n\n＜보기＞\nShe woke up early so that she could catch the first bus.\n→ She woke up early in order to catch the first bus.\n\nHe is reviewing his notes so that he can do well on the exam.\n→ He is reviewing his notes _________________________________.',
      'answer',E'in order to do well on the exam',
      'acceptedAnswers',jsonb_build_array(E'in order to do well on the exam',E'in order to do well on the exam.'),
      'explanation',E'so that he can → in order to: 목적 전환'),

    jsonb_build_object('number',48,
      'question',E'[실전편]\n다음 ＜보기＞에서 알맞은 말을 골라 문장을 완성하시오.\n\n＜보기＞\nso that he could focus on his recovery\nso that she could finish the project on time\nso that they could enjoy the performance from the front\nso that I could avoid the morning rush\nso that she became exhausted\n\n(1) I took an earlier train _________________________________.\n(2) Her colleague covered her tasks _________________________________.\n(3) They arrived at the concert hall early _________________________________.',
      'answer',E'(1) so that I could avoid the morning rush (2) so that she could finish the project on time (3) so that they could enjoy the performance from the front',
      'acceptedAnswers',jsonb_build_array(E'(1) so that I could avoid the morning rush (2) so that she could finish the project on time (3) so that they could enjoy the performance from the front',E'so that I could avoid the morning rush / so that she could finish the project on time / so that they could enjoy the performance from the front',E'(1) so that I could avoid the morning rush\n(2) so that she could finish the project on time\n(3) so that they could enjoy the performance from the front'),
      'explanation',E'보기에서 각 상황에 맞는 목적절 선택'),

    jsonb_build_object('number',49,
      'question',E'[실전편]\n다음 우리말과 일치하도록 ＜보기＞에서 필요한 단어만 골라 사용하여 문장을 완성하시오.\n\n＜보기＞ in / I / to focus / so / as / that / can focus / order\n\n내가 집중할 수 있게 TV 좀 꺼줄래?\n→ Could you turn off the TV _________________________________?',
      'answer',E'so that I can focus',
      'acceptedAnswers',jsonb_build_array(E'so that I can focus',E'so that I can focus?'),
      'explanation',E'보기에서 so, that, I, can focus를 선택하여 목적절 완성'),

    jsonb_build_object('number',50,
      'question',E'[실전편]\n다음 ＜조건＞에 맞게 두 문장을 한 문장으로 각각 만드시오.\n\n＜조건＞ Write two pieces of advice for Jisu by using words in brackets. Use ''so that ~ can …''.\n\nJisu wants to read English novels on her own.\nBut her vocabulary is not strong enough.\n\n(1) _____________________________________________ (need, build)\n(2) _____________________________________________ (need, read)',
      'answer',E'(1) Jisu needs to build her vocabulary so that she can read English novels on her own. (2) Jisu needs to read more books so that she can strengthen her vocabulary.',
      'acceptedAnswers',jsonb_build_array(E'(1) Jisu needs to build her vocabulary so that she can read English novels on her own. (2) Jisu needs to read more books so that she can strengthen her vocabulary.',E'(1) Jisu needs to build her vocabulary so that she can read English novels on her own.\n(2) Jisu needs to read more books so that she can strengthen her vocabulary.',E'Jisu needs to build her vocabulary so that she can read English novels on her own. / Jisu needs to read more books so that she can strengthen her vocabulary.'),
      'explanation',E'조건에 맞게 so that ~ can 구문으로 조언 작성'),

    jsonb_build_object('number',51,
      'question',E'[실전편]\n다음 ＜보기＞와 같이 두 문장을 한 문장으로 만드시오.\n\n＜보기＞\nHe trained hard every day. He wanted to qualify for the national team.\n→ He trained hard every day so that he could qualify for the national team.\n\n(1) We booked the tickets in advance. We wanted to get good seats.\n(2) She spoke quietly. She wanted to keep the baby asleep.\n(3) He will review the contract carefully. He wants to avoid any misunderstandings.',
      'answer',E'(1) We booked the tickets in advance so that we could get good seats. (2) She spoke quietly so that she could keep the baby asleep. (3) He will review the contract carefully so that he can avoid any misunderstandings.',
      'acceptedAnswers',jsonb_build_array(E'(1) We booked the tickets in advance so that we could get good seats. (2) She spoke quietly so that she could keep the baby asleep. (3) He will review the contract carefully so that he can avoid any misunderstandings.',E'We booked the tickets in advance so that we could get good seats. / She spoke quietly so that she could keep the baby asleep. / He will review the contract carefully so that he can avoid any misunderstandings.',E'(1) We booked the tickets in advance so that we could get good seats.\n(2) She spoke quietly so that she could keep the baby asleep.\n(3) He will review the contract carefully so that he can avoid any misunderstandings.'),
      'explanation',E'두 문장을 so that으로 연결 (과거→could, 미래→can)'),

    jsonb_build_object('number',52,
      'question',E'[실전편]\n다음 (1)에 주어진 문장에 공통으로 들어갈 말을 쓰고, 그 표현을 사용하여 (2)에 주어진 우리말을 영작하시오.\n\n(1)\nMinji studied hard ________ ________ she could pass the college entrance exam.\nYou''d better leave now ________ ________ you won''t be late for the interview.\n\n(2) 나는 발표를 잘 마칠 수 있도록 밤새 준비했다.\n\n(1) 공통으로 들어갈 말: ________ ________\n(2) _____________________________________________',
      'answer',E'(1) so that (2) I prepared all night so that I could finish my presentation well.',
      'acceptedAnswers',jsonb_build_array(E'(1) so that (2) I prepared all night so that I could finish my presentation well.',E'(1) so that\n(2) I prepared all night so that I could finish my presentation well.',E'so that / I prepared all night so that I could finish my presentation well.',E'(1) so that (2) I prepared all night so that I could finish my presentation well'),
      'explanation',E'(1) so that 공통 삽입 (2) so that + could 영작'),

    jsonb_build_object('number',53,
      'question',E'[실전편]\n다음 우리말과 일치하도록 ＜보기＞에서 두 문장을 골라 ''so that~''을 사용하여 영작하시오.\n\n＜보기＞\nShe submitted the report early.\nHe explained the instructions twice.\nWe took a different route.\nEveryone could understand the directions.\nWe could avoid the traffic jam.\nShe could get feedback before the deadline.\n\n우리는 교통 체증을 피할 수 있도록 다른 길로 갔다.',
      'answer',E'We took a different route so that we could avoid the traffic jam.',
      'acceptedAnswers',jsonb_build_array(E'We took a different route so that we could avoid the traffic jam.',E'We took a different route so that we could avoid the traffic jam'),
      'explanation',E'보기에서 원인+결과 문장을 골라 so that으로 연결'),

    jsonb_build_object('number',54,
      'question',E'[실전편]\n다음 우리말을 괄호 안에 제시된 단어를 사용하여 ＜조건＞에 맞게 영작하시오.\n\n＜조건＞ 괄호 안의 주어진 단어를 모두 활용하여 영작할 것. 필요시 단어의 형태를 바꿀 것.\n\n나는 장학금을 받기 위해서 열심히 공부했다.\n(1) I studied hard _________________________________. (the scholarship, win, to, in order)\n(2) I studied hard _________________________________. (so that, the scholarship, win, might, I)',
      'answer',E'(1) in order to win the scholarship (2) so that I might win the scholarship',
      'acceptedAnswers',jsonb_build_array(E'(1) in order to win the scholarship (2) so that I might win the scholarship',E'in order to win the scholarship / so that I might win the scholarship',E'(1) in order to win the scholarship\n(2) so that I might win the scholarship'),
      'explanation',E'(1) in order to + 동사원형 (2) so that + might + 동사원형'),

    jsonb_build_object('number',55,
      'question',E'[실전편]\n다음 두 문장을 ＜조건＞에 맞게 한 문장으로 만드시오.\n＜조건＞ ''so that~'' 이나 ''so~that''을 사용하여 쓸 것\n\n(1) She handed him the notes. She wanted him to review them before the meeting.\n(2) The weather was so foggy. So the flight was delayed.',
      'answer',E'(1) She handed him the notes so that he could review them before the meeting. (2) The weather was so foggy that the flight was delayed.',
      'acceptedAnswers',jsonb_build_array(E'(1) She handed him the notes so that he could review them before the meeting. (2) The weather was so foggy that the flight was delayed.',E'She handed him the notes so that he could review them before the meeting. / The weather was so foggy that the flight was delayed.',E'(1) She handed him the notes so that he could review them before the meeting.\n(2) The weather was so foggy that the flight was delayed.'),
      'explanation',E'(1) so that + could: 목적 (2) so + 형용사 + that: 결과')
  );

  a := jsonb_build_array(
    E'so that, could prepare',
    E'so that, could meet',
    E'so as not to',
    E'so as to',
    E'so that you don''t',
    E'so that he won''t',
    E'stay, explain',
    E'record, review',
    E'check, deliver',
    E'so that every student could read it',
    E'so that his sister could use it',
    E'so that she could submit it before the deadline',
    E'so that',
    E', so',
    E'so that',
    E'so that',
    E', so',
    E'so that he can stay focused the next day',
    E'so that I can study in silence',
    E'so that residents can walk safely at night',
    E'so that, could',
    E'so that, could',
    E'order not to',
    E'in order to',
    E'order to',
    E'so that, could understand',
    E'so as not to',
    E'(1) so that children could understand the movie (2) so',
    E'He saved up for months so that he could buy a new laptop.',
    E'She volunteered at the hospital so that she could gain experience in the medical field.',
    E'They left two hours early so that they could arrive before the storm hit.',
    E'so that',
    E'so, that',
    E'order that',
    E'so that she could review',
    E'so that she could catch',
    E'so that he can use it during the trip',
    E'Sora is taking an online English course so that she can communicate with foreign friends.',
    E'Minho runs every morning so that he can stay fit and healthy.',
    E'Yuna opened a savings account so that she could buy a new camera.',
    E'order not to',
    E'so, could',
    E'so that, could enter',
    E'so that',
    E'so that',
    E'I could concentrate on my work',
    E'in order to do well on the exam',
    E'(1) so that I could avoid the morning rush (2) so that she could finish the project on time (3) so that they could enjoy the performance from the front',
    E'so that I can focus',
    E'(1) Jisu needs to build her vocabulary so that she can read English novels on her own. (2) Jisu needs to read more books so that she can strengthen her vocabulary.',
    E'(1) We booked the tickets in advance so that we could get good seats. (2) She spoke quietly so that she could keep the baby asleep. (3) He will review the contract carefully so that he can avoid any misunderstandings.',
    E'(1) so that (2) I prepared all night so that I could finish my presentation well.',
    E'We took a different route so that we could avoid the traffic jam.',
    E'(1) in order to win the scholarship (2) so that I might win the scholarship',
    E'(1) She handed him the notes so that he could review them before the meeting. (2) The weather was so foggy that the flight was delayed.'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES (
    'so that Step 3',
    'so that',
    q,
    a,
    'problem',
    'interactive'
  );
END $$;
