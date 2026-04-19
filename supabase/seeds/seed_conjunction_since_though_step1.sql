-- 접속사 since/though Step 1 — 100문항 (8파트)
-- template_topic: 접속사 since/though
-- category: problem, mode: interactive

DO $$
DECLARE
  q1 jsonb;
  q2 jsonb;
  q3 jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = E'접속사 since/though Step 1';

  -- Part 1~4 (Q1~Q49)
  q1 := jsonb_build_array(

jsonb_build_object(
  'id', 1,
  'type', 'mcq',
  'question', E'괄호 안에서 문맥에 알맞은 접속사를 고르시오.\n\n( _______ ) she studied hard, she passed the exam easily.',
  'options', jsonb_build_array('Since', 'Though'),
  'answer', '1',
  'explanation', E'열심히 공부해서 시험에 쉽게 합격했다는 이유-결과 관계이므로 Since가 적절합니다.'
),
jsonb_build_object(
  'id', 2,
  'type', 'mcq',
  'question', E'괄호 안에서 문맥에 알맞은 접속사를 고르시오.\n\n( _______ ) it was raining heavily, we decided to go hiking.',
  'options', jsonb_build_array('Since', 'Though'),
  'answer', '2',
  'explanation', E'비가 많이 왔지만 하이킹을 가기로 했다는 양보 관계이므로 Though가 적절합니다.'
),
jsonb_build_object(
  'id', 3,
  'type', 'mcq',
  'question', E'괄호 안에서 문맥에 알맞은 접속사를 고르시오.\n\nI couldn''t sleep ( _______ ) it was too noisy outside.',
  'options', jsonb_build_array('since', 'though'),
  'answer', '1',
  'explanation', E'밖이 너무 시끄러워서 잠을 못 잤다는 이유-결과 관계이므로 since가 적절합니다.'
),
jsonb_build_object(
  'id', 4,
  'type', 'mcq',
  'question', E'괄호 안에서 문맥에 알맞은 접속사를 고르시오.\n\n( _______ ) he is only ten years old, he can speak three languages.',
  'options', jsonb_build_array('Although', 'Since'),
  'answer', '1',
  'explanation', E'겨우 10살인데 3개 국어를 할 수 있다는 양보 관계이므로 Although가 적절합니다.'
),
jsonb_build_object(
  'id', 5,
  'type', 'mcq',
  'question', E'괄호 안에서 문맥에 알맞은 접속사를 고르시오.\n\nShe went to school ( _______ ) she had a high fever.',
  'options', jsonb_build_array('since', 'even though'),
  'answer', '2',
  'explanation', E'고열이 있었지만 학교에 갔다는 양보 관계이므로 even though가 적절합니다.'
),
jsonb_build_object(
  'id', 6,
  'type', 'mcq',
  'question', E'괄호 안에서 문맥에 알맞은 접속사를 고르시오.\n\nWe canceled the picnic ( _______ ) the weather forecast said it would rain all day.',
  'options', jsonb_build_array('since', 'though'),
  'answer', '1',
  'explanation', E'일기예보에서 하루 종일 비가 온다고 해서 소풍을 취소했다는 이유-결과 관계이므로 since가 적절합니다.'
),
jsonb_build_object(
  'id', 7,
  'type', 'mcq',
  'question', E'괄호 안에서 문맥에 알맞은 접속사를 고르시오.\n\n( _______ ) he works out every day, he doesn''t look very muscular.',
  'options', jsonb_build_array('Though', 'Since'),
  'answer', '1',
  'explanation', E'매일 운동하지만 근육질로 보이지 않는다는 양보 관계이므로 Though가 적절합니다.'
),
jsonb_build_object(
  'id', 8,
  'type', 'mcq',
  'question', E'괄호 안에서 문맥에 알맞은 접속사를 고르시오.\n\nI lent her my umbrella ( _______ ) she forgot to bring hers.',
  'options', jsonb_build_array('since', 'although'),
  'answer', '1',
  'explanation', E'그녀가 우산을 깜빡해서 빌려주었다는 이유-결과 관계이므로 since가 적절합니다.'
),
jsonb_build_object(
  'id', 9,
  'type', 'mcq',
  'question', E'괄호 안에서 문맥에 알맞은 접속사를 고르시오.\n\n( _______ ) the movie got bad reviews, many people still went to see it.',
  'options', jsonb_build_array('Although', 'Since'),
  'answer', '1',
  'explanation', E'영화가 악평을 받았지만 많은 사람들이 여전히 보러 갔다는 양보 관계이므로 Although가 적절합니다.'
),
jsonb_build_object(
  'id', 10,
  'type', 'mcq',
  'question', E'괄호 안에서 문맥에 알맞은 접속사를 고르시오.\n\nHe kept playing video games ( _______ ) his mom told him to stop.',
  'options', jsonb_build_array('since', 'even though'),
  'answer', '2',
  'explanation', E'엄마가 그만하라고 했지만 계속 게임을 했다는 양보 관계이므로 even though가 적절합니다.'
),
jsonb_build_object(
  'id', 11,
  'type', 'mcq',
  'question', E'괄호 안에서 문맥에 알맞은 접속사를 고르시오.\n\n( _______ ) nobody answered the door, I assumed they were all out.',
  'options', jsonb_build_array('Since', 'Though'),
  'answer', '1',
  'explanation', E'아무도 문에 나오지 않아서 모두 외출한 줄 알았다는 이유-결과 관계이므로 Since가 적절합니다.'
),
jsonb_build_object(
  'id', 12,
  'type', 'mcq',
  'question', E'괄호 안에서 문맥에 알맞은 접속사를 고르시오.\n\nShe always feels nervous before a performance ( _______ ) she has been on stage hundreds of times.',
  'options', jsonb_build_array('since', 'although'),
  'answer', '2',
  'explanation', E'수백 번 무대에 섰지만 여전히 긴장한다는 양보 관계이므로 although가 적절합니다.'
),
jsonb_build_object(
  'id', 13,
  'type', 'mcq',
  'question', E'괄호 안에서 문맥에 알맞은 접속사를 고르시오.\n\n( _______ ) the store was about to close, the clerk still helped us find what we needed.',
  'options', jsonb_build_array('Since', 'Though'),
  'answer', '2',
  'explanation', E'가게가 곧 닫히려 했지만 직원이 여전히 도와주었다는 양보 관계이므로 Though가 적절합니다.'
),
jsonb_build_object(
  'id', 14,
  'type', 'mcq',
  'question', E'괄호 안에서 알맞은 것을 고르시오. (접속사 vs 전치사 구분에 주의할 것)\n\n( _______ ) the cold weather, they went swimming in the ocean.',
  'options', jsonb_build_array('Although', 'Despite'),
  'answer', '2',
  'explanation', E'뒤에 명사구(the cold weather)가 왔으므로 전치사 Despite가 적절합니다. Although 뒤에는 절(주어+동사)이 와야 합니다.'
),
jsonb_build_object(
  'id', 15,
  'type', 'mcq',
  'question', E'괄호 안에서 알맞은 것을 고르시오. (접속사 vs 전치사 구분에 주의할 것)\n\n( _______ ) it was cold, they went swimming in the ocean.',
  'options', jsonb_build_array('Although', 'Despite'),
  'answer', '1',
  'explanation', E'뒤에 절(it was cold)이 왔으므로 접속사 Although가 적절합니다. Despite 뒤에는 명사구가 와야 합니다.'
),
jsonb_build_object(
  'id', 16,
  'type', 'mcq',
  'question', E'괄호 안에서 알맞은 것을 고르시오. (접속사 vs 전치사 구분에 주의할 것)\n\n( _______ ) his injury, the athlete finished the race.',
  'options', jsonb_build_array('In spite of', 'Though'),
  'answer', '1',
  'explanation', E'뒤에 명사구(his injury)가 왔으므로 전치사 In spite of가 적절합니다. Though 뒤에는 절(주어+동사)이 와야 합니다.'
),
jsonb_build_object(
  'id', 17,
  'type', 'mcq',
  'question', E'괄호 안에서 알맞은 것을 고르시오. (접속사 vs 전치사 구분에 주의할 것)\n\n( _______ ) she practiced every day, she couldn''t master the piano piece.',
  'options', jsonb_build_array('Despite', 'Although'),
  'answer', '2',
  'explanation', E'뒤에 절(she practiced every day)이 왔으므로 접속사 Although가 적절합니다. Despite 뒤에는 명사구가 와야 합니다.'
),
jsonb_build_object(
  'id', 18,
  'type', 'mcq',
  'question', E'괄호 안에서 알맞은 것을 고르시오. (접속사 vs 전치사 구분에 주의할 것)\n\nWe enjoyed the trip ( _______ ) the bad road conditions.',
  'options', jsonb_build_array('despite', 'although'),
  'answer', '1',
  'explanation', E'뒤에 명사구(the bad road conditions)가 왔으므로 전치사 despite가 적절합니다. although 뒤에는 절(주어+동사)이 와야 합니다.'
),
jsonb_build_object(
  'id', 19,
  'type', 'mcq',
  'question', E'괄호 안에서 알맞은 것을 고르시오. (접속사 vs 전치사 구분에 주의할 것)\n\n( _______ ) all our efforts, we failed to win the championship.',
  'options', jsonb_build_array('In spite of', 'Even though'),
  'answer', '1',
  'explanation', E'뒤에 명사구(all our efforts)가 왔으므로 전치사 In spite of가 적절합니다. Even though 뒤에는 절(주어+동사)이 와야 합니다.'
),
jsonb_build_object(
  'id', 20,
  'type', 'mcq',
  'question', E'괄호 안에서 알맞은 것을 고르시오. (접속사 vs 전치사 구분에 주의할 것)\n\n( _______ ) he had no experience, he got the job.',
  'options', jsonb_build_array('Despite', 'Although'),
  'answer', '2',
  'explanation', E'뒤에 절(he had no experience)이 왔으므로 접속사 Although가 적절합니다. Despite 뒤에는 명사구가 와야 합니다.'
),
jsonb_build_object(
  'id', 21,
  'type', 'mcq',
  'question', E'괄호 안에서 알맞은 것을 고르시오. (접속사 vs 전치사 구분에 주의할 것)\n\n( _______ ) the heavy traffic, she arrived on time for the meeting.',
  'options', jsonb_build_array('Despite', 'Although'),
  'answer', '1',
  'explanation', E'뒤에 명사구(the heavy traffic)가 왔으므로 전치사 Despite가 적절합니다. Although 뒤에는 절(주어+동사)이 와야 합니다.'
),
jsonb_build_object(
  'id', 22,
  'type', 'mcq',
  'question', E'괄호 안에서 알맞은 것을 고르시오. (접속사 vs 전치사 구분에 주의할 것)\n\nHe kept smiling ( _______ ) he was clearly in pain.',
  'options', jsonb_build_array('in spite of', 'although'),
  'answer', '2',
  'explanation', E'뒤에 절(he was clearly in pain)이 왔으므로 접속사 although가 적절합니다. in spite of 뒤에는 명사구가 와야 합니다.'
),
jsonb_build_object(
  'id', 23,
  'type', 'mcq',
  'question', E'괄호 안에서 알맞은 것을 고르시오. (접속사 vs 전치사 구분에 주의할 것)\n\n( _______ ) her young age, she is one of the best scientists in the country.',
  'options', jsonb_build_array('Despite', 'Although'),
  'answer', '1',
  'explanation', E'뒤에 명사구(her young age)가 왔으므로 전치사 Despite가 적절합니다. Although 뒤에는 절(주어+동사)이 와야 합니다.'
),
jsonb_build_object(
  'id', 24,
  'type', 'mcq',
  'question', E'괄호 안에서 알맞은 것을 고르시오. (접속사 vs 전치사 구분에 주의할 것)\n\nThe restaurant stays busy ( _______ ) its high prices.',
  'options', jsonb_build_array('in spite of', 'although'),
  'answer', '1',
  'explanation', E'뒤에 명사구(its high prices)가 왔으므로 전치사 in spite of가 적절합니다. although 뒤에는 절(주어+동사)이 와야 합니다.'
),
jsonb_build_object(
  'id', 25,
  'type', 'mcq',
  'question', E'괄호 안에서 알맞은 것을 고르시오. (접속사 vs 전치사 구분에 주의할 것)\n\n( _______ ) the fact that it was freezing outside, he went out without a coat.',
  'options', jsonb_build_array('Despite', 'Although'),
  'answer', '1',
  'explanation', E'뒤에 명사구(the fact that ...)가 왔으므로 전치사 Despite가 적절합니다. the fact that 전체가 명사구 역할을 합니다.'
),
jsonb_build_object(
  'id', 26,
  'type', 'mcq',
  'question', E'괄호 안에서 알맞은 것을 고르시오. (접속사 vs 전치사 구분에 주의할 것)\n\nShe passed the test ( _______ ) studying only the night before.',
  'options', jsonb_build_array('in spite of', 'although'),
  'answer', '1',
  'explanation', E'뒤에 동명사구(studying only the night before)가 왔으므로 전치사 in spite of가 적절합니다. 동명사구는 명사 역할을 합니다.'
),
jsonb_build_object(
  'id', 27,
  'type', 'mcq',
  'question', E'다음 중 문장의 흐름이 자연스러우면 O, 어색하면 X를 고르시오.\n\nThough it was snowing, we decided to stay inside and watch movies.',
  'options', jsonb_build_array('O', 'X'),
  'answer', '2',
  'explanation', E'though는 양보의 접속사로 "~임에도 불구하고"라는 뜻입니다. 눈이 왔지만 실내에 있었다는 것은 예상과 같은 결과이므로 어색합니다. "눈이 왔기 때문에(since) 실내에 있었다"가 자연스럽습니다.'
),
jsonb_build_object(
  'id', 28,
  'type', 'mcq',
  'question', E'다음 중 문장의 흐름이 자연스러우면 O, 어색하면 X를 고르시오.\n\nSince she missed the bus, she was late for school.',
  'options', jsonb_build_array('O', 'X'),
  'answer', '1',
  'explanation', E'버스를 놓쳐서(이유) 학교에 지각했다(결과)는 자연스러운 이유-결과 관계입니다.'
),
jsonb_build_object(
  'id', 29,
  'type', 'mcq',
  'question', E'다음 중 문장의 흐름이 자연스러우면 O, 어색하면 X를 고르시오.\n\nThough he studied very hard, he got an A on the test.',
  'options', jsonb_build_array('O', 'X'),
  'answer', '2',
  'explanation', E'though 뒤에는 예상과 반대되는 결과가 와야 합니다. 열심히 공부해서 A를 받는 것은 당연한 결과이므로 어색합니다. "열심히 공부했기 때문에(since) A를 받았다"가 자연스럽습니다.'
),
jsonb_build_object(
  'id', 30,
  'type', 'mcq',
  'question', E'다음 중 문장의 흐름이 자연스러우면 O, 어색하면 X를 고르시오.\n\nAlthough she is very shy, she gave a great speech in front of 500 people.',
  'options', jsonb_build_array('O', 'X'),
  'answer', '1',
  'explanation', E'매우 수줍음이 많지만(양보) 500명 앞에서 훌륭한 연설을 했다(예상 밖 결과)는 자연스러운 양보 관계입니다.'
),
jsonb_build_object(
  'id', 31,
  'type', 'mcq',
  'question', E'다음 중 문장의 흐름이 자연스러우면 O, 어색하면 X를 고르시오.\n\nSince he is very generous, nobody likes him.',
  'options', jsonb_build_array('O', 'X'),
  'answer', '2',
  'explanation', E'관대하기 때문에 아무도 좋아하지 않는다는 것은 이유-결과가 모순됩니다. "관대함에도 불구하고(although) 아무도 좋아하지 않는다"가 자연스럽습니다.'
),
jsonb_build_object(
  'id', 32,
  'type', 'mcq',
  'question', E'다음 중 문장의 흐름이 자연스러우면 O, 어색하면 X를 고르시오.\n\nThough the book was very long, I finished it in two days.',
  'options', jsonb_build_array('O', 'X'),
  'answer', '1',
  'explanation', E'책이 매우 길었지만(양보) 이틀 만에 완독했다(예상 밖 결과)는 자연스러운 양보 관계입니다.'
),
jsonb_build_object(
  'id', 33,
  'type', 'mcq',
  'question', E'다음 중 문장의 흐름이 자연스러우면 O, 어색하면 X를 고르시오.\n\nSince it was a holiday, all the shops were closed.',
  'options', jsonb_build_array('O', 'X'),
  'answer', '1',
  'explanation', E'휴일이어서(이유) 모든 가게가 문을 닫았다(결과)는 자연스러운 이유-결과 관계입니다.'
),
jsonb_build_object(
  'id', 34,
  'type', 'mcq',
  'question', E'다음 중 문장의 흐름이 자연스러우면 O, 어색하면 X를 고르시오.\n\nAlthough she couldn''t get good grades since she studied very hard.',
  'options', jsonb_build_array('O', 'X'),
  'answer', '2',
  'explanation', E'although(양보)와 since(이유)를 같은 문장에서 혼용했고, 주절이 없는 불완전한 문장입니다. 접속사가 두 개이면 절이 세 개 필요하지만 절이 두 개뿐입니다.'
),
jsonb_build_object(
  'id', 35,
  'type', 'mcq',
  'question', E'다음 중 문장의 흐름이 자연스러우면 O, 어색하면 X를 고르시오.\n\nEven though he has a lot of money, he is still unhappy.',
  'options', jsonb_build_array('O', 'X'),
  'answer', '1',
  'explanation', E'돈이 많지만(양보) 여전히 불행하다(예상 밖 결과)는 자연스러운 양보 관계입니다.'
),
jsonb_build_object(
  'id', 36,
  'type', 'mcq',
  'question', E'다음 중 문장의 흐름이 자연스러우면 O, 어색하면 X를 고르시오.\n\nThough coke is bad for your health, the doctor advised me to drink it every day.',
  'options', jsonb_build_array('O', 'X'),
  'answer', '2',
  'explanation', E'콜라가 건강에 나쁘다는 것을 인정하면서 의사가 매일 마시라고 권하는 것은 상식적으로 모순됩니다. 문법적으로는 양보 구조이지만 내용의 흐름이 어색합니다.'
),
jsonb_build_object(
  'id', 37,
  'type', 'mcq',
  'question', E'밑줄 친 since의 의미가 ''이유(because)''이면 A, ''시간(~이후로)''이면 B라고 쓰시오.\n\nI have lived in Seoul <u>since</u> I was born.',
  'options', jsonb_build_array('A (이유)', 'B (시간)'),
  'answer', '2',
  'explanation', E'태어난 이후로 서울에 살고 있다는 뜻으로, since가 시간(~이후로)의 의미로 쓰였습니다. 현재완료(have lived)와 함께 쓰여 시간의 기점을 나타냅니다.'
),
jsonb_build_object(
  'id', 38,
  'type', 'mcq',
  'question', E'밑줄 친 since의 의미가 ''이유(because)''이면 A, ''시간(~이후로)''이면 B라고 쓰시오.\n\n<u>Since</u> it was getting dark, we decided to head home.',
  'options', jsonb_build_array('A (이유)', 'B (시간)'),
  'answer', '1',
  'explanation', E'어두워지고 있어서 집에 가기로 했다는 뜻으로, since가 이유(because)의 의미로 쓰였습니다.'
),
jsonb_build_object(
  'id', 39,
  'type', 'mcq',
  'question', E'밑줄 친 since의 의미가 ''이유(because)''이면 A, ''시간(~이후로)''이면 B라고 쓰시오.\n\nShe has been my best friend <u>since</u> middle school.',
  'options', jsonb_build_array('A (이유)', 'B (시간)'),
  'answer', '2',
  'explanation', E'중학교 이후로 절친이었다는 뜻으로, since가 시간(~이후로)의 의미로 쓰였습니다. 현재완료(has been)와 함께 쓰여 시간의 기점을 나타냅니다.'
),
jsonb_build_object(
  'id', 40,
  'type', 'mcq',
  'question', E'밑줄 친 since의 의미가 ''이유(because)''이면 A, ''시간(~이후로)''이면 B라고 쓰시오.\n\nI didn''t go out <u>since</u> I had a lot of homework to finish.',
  'options', jsonb_build_array('A (이유)', 'B (시간)'),
  'answer', '1',
  'explanation', E'숙제가 많아서 외출하지 않았다는 뜻으로, since가 이유(because)의 의미로 쓰였습니다.'
),
jsonb_build_object(
  'id', 41,
  'type', 'mcq',
  'question', E'밑줄 친 since의 의미가 ''이유(because)''이면 A, ''시간(~이후로)''이면 B라고 쓰시오.\n\nHe has changed a lot <u>since</u> he started living alone.',
  'options', jsonb_build_array('A (이유)', 'B (시간)'),
  'answer', '2',
  'explanation', E'혼자 살기 시작한 이후로 많이 변했다는 뜻으로, since가 시간(~이후로)의 의미로 쓰였습니다. 현재완료(has changed)와 함께 쓰여 시간의 기점을 나타냅니다.'
),
jsonb_build_object(
  'id', 42,
  'type', 'mcq',
  'question', E'밑줄 친 since의 의미가 ''이유(because)''이면 A, ''시간(~이후로)''이면 B라고 쓰시오.\n\n<u>Since</u> you''re an expert on this topic, could you explain it to us?',
  'options', jsonb_build_array('A (이유)', 'B (시간)'),
  'answer', '1',
  'explanation', E'이 주제의 전문가이니까 설명해달라는 뜻으로, since가 이유(because)의 의미로 쓰였습니다.'
),
jsonb_build_object(
  'id', 43,
  'type', 'mcq',
  'question', E'밑줄 친 since의 의미가 ''이유(because)''이면 A, ''시간(~이후로)''이면 B라고 쓰시오.\n\nIt has been three years <u>since</u> they moved to Canada.',
  'options', jsonb_build_array('A (이유)', 'B (시간)'),
  'answer', '2',
  'explanation', E'캐나다로 이사한 지 3년이 되었다는 뜻으로, since가 시간(~이후로)의 의미로 쓰였습니다. "It has been + 기간 + since"는 시간 표현의 대표적인 패턴입니다.'
),
jsonb_build_object(
  'id', 44,
  'type', 'mcq',
  'question', E'밑줄 친 since의 의미가 ''이유(because)''이면 A, ''시간(~이후로)''이면 B라고 쓰시오.\n\nWe haven''t spoken to each other <u>since</u> the argument last summer.',
  'options', jsonb_build_array('A (이유)', 'B (시간)'),
  'answer', '2',
  'explanation', E'지난 여름 다툼 이후로 서로 말을 하지 않았다는 뜻으로, since가 시간(~이후로)의 의미로 쓰였습니다. 현재완료(haven''t spoken)와 함께 쓰여 시간의 기점을 나타냅니다.'
),
jsonb_build_object(
  'id', 45,
  'type', 'mcq',
  'question', E'밑줄 친 since의 의미가 ''이유(because)''이면 A, ''시간(~이후로)''이면 B라고 쓰시오.\n\n<u>Since</u> the train was delayed, many passengers missed their connections.',
  'options', jsonb_build_array('A (이유)', 'B (시간)'),
  'answer', '1',
  'explanation', E'기차가 지연되어서 많은 승객이 환승을 놓쳤다는 뜻으로, since가 이유(because)의 의미로 쓰였습니다.'
),
jsonb_build_object(
  'id', 46,
  'type', 'mcq',
  'question', E'밑줄 친 since의 의미가 ''이유(because)''이면 A, ''시간(~이후로)''이면 B라고 쓰시오.\n\nShe has been interested in marine biology <u>since</u> she watched a documentary about the ocean.',
  'options', jsonb_build_array('A (이유)', 'B (시간)'),
  'answer', '2',
  'explanation', E'바다에 관한 다큐멘터리를 본 이후로 해양 생물학에 관심을 가져왔다는 뜻으로, since가 시간(~이후로)의 의미로 쓰였습니다. 현재완료(has been interested)와 함께 쓰여 시간의 기점을 나타냅니다.'
),
jsonb_build_object(
  'id', 47,
  'type', 'mcq',
  'question', E'밑줄 친 since의 의미가 ''이유(because)''이면 A, ''시간(~이후로)''이면 B라고 쓰시오.\n\n<u>Since</u> he didn''t have enough money, he borrowed some from his friend.',
  'options', jsonb_build_array('A (이유)', 'B (시간)'),
  'answer', '1',
  'explanation', E'돈이 충분하지 않아서 친구에게 빌렸다는 뜻으로, since가 이유(because)의 의미로 쓰였습니다.'
),
jsonb_build_object(
  'id', 48,
  'type', 'mcq',
  'question', E'밑줄 친 since의 의미가 ''이유(because)''이면 A, ''시간(~이후로)''이면 B라고 쓰시오.\n\nI haven''t eaten anything <u>since</u> this morning.',
  'options', jsonb_build_array('A (이유)', 'B (시간)'),
  'answer', '2',
  'explanation', E'오늘 아침 이후로 아무것도 먹지 않았다는 뜻으로, since가 시간(~이후로)의 의미로 쓰였습니다. 현재완료(haven''t eaten)와 함께 쓰여 시간의 기점을 나타냅니다.'
),
jsonb_build_object(
  'id', 49,
  'type', 'mcq',
  'question', E'밑줄 친 since의 의미가 ''이유(because)''이면 A, ''시간(~이후로)''이면 B라고 쓰시오.\n\nThe town has grown rapidly <u>since</u> the new factory opened.',
  'options', jsonb_build_array('A (이유)', 'B (시간)'),
  'answer', '2',
  'explanation', E'새 공장이 문을 연 이후로 마을이 급성장했다는 뜻으로, since가 시간(~이후로)의 의미로 쓰였습니다. 현재완료(has grown)와 함께 쓰여 시간의 기점을 나타냅니다.'
)
  );

  -- Part 5~6 (Q50~Q74)
  q2 := jsonb_build_array(

    -- Part 5: since / though 이용하여 문장 다시 쓰기 (Q50-Q61)
    jsonb_build_object(
      'id', 50,
      'type', 'short_answer',
      'question', E'다음 문장을 since 또는 though를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nIt was very cold, so we stayed indoors.',
      'answer', 'Since it was very cold, we stayed indoors.',
      'acceptedAnswers', jsonb_build_array('Since it was very cold, we stayed indoors.', 'Since it was very cold, we stayed indoors', 'We stayed indoors since it was very cold.', 'We stayed indoors since it was very cold'),
      'explanation', E'so(그래서) → 이유-결과 관계 → since 사용. \"It was very cold, so we stayed indoors.\"에서 so 앞이 이유이므로 since절로 바꿀 수 있다.',
      'similar_answers', jsonb_build_array('Since it was very cold, we stayed indoors.', 'We stayed indoors since it was very cold.')
    ),
    jsonb_build_object(
      'id', 51,
      'type', 'short_answer',
      'question', E'다음 문장을 since 또는 though를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nShe was tired, but she finished all her homework.',
      'answer', 'Though she was tired, she finished all her homework.',
      'acceptedAnswers', jsonb_build_array('Though she was tired, she finished all her homework.', 'Though she was tired, she finished all her homework', 'Although she was tired, she finished all her homework.', 'Although she was tired, she finished all her homework'),
      'explanation', E'but(그러나) → 양보 관계 → though 사용. \"She was tired, but she finished all her homework.\"에서 but 앞의 내용에도 불구하고 뒤의 결과가 나왔으므로 though를 사용한다.',
      'similar_answers', jsonb_build_array('Though she was tired, she finished all her homework.', 'Although she was tired, she finished all her homework.')
    ),
    jsonb_build_object(
      'id', 52,
      'type', 'short_answer',
      'question', E'다음 문장을 since 또는 though를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nHe didn\'t have a map, but he found the place easily.',
      'answer', E'Though he didn\'t have a map, he found the place easily.',
      'acceptedAnswers', jsonb_build_array(E'Though he didn\'t have a map, he found the place easily.', E'Though he didn\'t have a map, he found the place easily', E'Although he didn\'t have a map, he found the place easily.', E'Although he didn\'t have a map, he found the place easily'),
      'explanation', E'but(그러나) → 양보 관계 → though 사용. 지도가 없었음에도 불구하고 쉽게 찾았으므로 though를 사용한다.',
      'similar_answers', jsonb_build_array(E'Though he didn\'t have a map, he found the place easily.', E'Although he didn\'t have a map, he found the place easily.')
    ),
    jsonb_build_object(
      'id', 53,
      'type', 'short_answer',
      'question', E'다음 문장을 since 또는 though를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nI couldn\'t buy the shoes because they were too expensive.',
      'answer', E'Since the shoes were too expensive, I couldn\'t buy them.',
      'acceptedAnswers', jsonb_build_array(E'Since the shoes were too expensive, I couldn\'t buy them.', E'Since the shoes were too expensive, I couldn\'t buy them', E'I couldn\'t buy the shoes since they were too expensive.', E'I couldn\'t buy the shoes since they were too expensive'),
      'explanation', E'because(~때문에) → 이유-결과 관계 → since 사용. 신발이 너무 비쌌기 때문에 살 수 없었으므로 since를 사용한다.',
      'similar_answers', jsonb_build_array(E'Since the shoes were too expensive, I couldn\'t buy them.', E'I couldn\'t buy the shoes since they were too expensive.')
    ),
    jsonb_build_object(
      'id', 54,
      'type', 'short_answer',
      'question', E'다음 문장을 since 또는 though를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nThe concert was amazing, but I didn\'t enjoy it much.',
      'answer', E'Though the concert was amazing, I didn\'t enjoy it much.',
      'acceptedAnswers', jsonb_build_array(E'Though the concert was amazing, I didn\'t enjoy it much.', E'Though the concert was amazing, I didn\'t enjoy it much', E'Although the concert was amazing, I didn\'t enjoy it much.', E'Although the concert was amazing, I didn\'t enjoy it much'),
      'explanation', E'but(그러나) → 양보 관계 → though 사용. 콘서트가 훌륭했음에도 불구하고 많이 즐기지 못했으므로 though를 사용한다.',
      'similar_answers', jsonb_build_array(E'Though the concert was amazing, I didn\'t enjoy it much.', E'Although the concert was amazing, I didn\'t enjoy it much.')
    ),
    jsonb_build_object(
      'id', 55,
      'type', 'short_answer',
      'question', E'다음 문장을 since 또는 though를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nTom studied hard for the exam, but he still got a low score.',
      'answer', 'Though Tom studied hard for the exam, he still got a low score.',
      'acceptedAnswers', jsonb_build_array('Though Tom studied hard for the exam, he still got a low score.', 'Though Tom studied hard for the exam, he still got a low score', 'Although Tom studied hard for the exam, he still got a low score.', 'Although Tom studied hard for the exam, he still got a low score'),
      'explanation', E'but(그러나) → 양보 관계 → though 사용. 열심히 공부했음에도 불구하고 낮은 점수를 받았으므로 though를 사용한다.',
      'similar_answers', jsonb_build_array('Though Tom studied hard for the exam, he still got a low score.', 'Although Tom studied hard for the exam, he still got a low score.')
    ),
    jsonb_build_object(
      'id', 56,
      'type', 'short_answer',
      'question', E'다음 문장을 since 또는 though를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nWe couldn\'t go camping because of the typhoon.',
      'answer', E'Since there was a typhoon, we couldn\'t go camping.',
      'acceptedAnswers', jsonb_build_array(E'Since there was a typhoon, we couldn\'t go camping.', E'Since there was a typhoon, we couldn\'t go camping', E'We couldn\'t go camping since there was a typhoon.', E'We couldn\'t go camping since there was a typhoon'),
      'explanation', E'because of(~때문에) → 이유-결과 관계 → since 사용. \"because of + 명사\"를 \"since + 주어 + 동사\" 절로 바꿔야 한다.',
      'similar_answers', jsonb_build_array(E'Since there was a typhoon, we couldn\'t go camping.', E'We couldn\'t go camping since there was a typhoon.')
    ),
    jsonb_build_object(
      'id', 57,
      'type', 'short_answer',
      'question', E'다음 문장을 since 또는 though를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nShe has lived in New York for ten years, but she still misses Korea.',
      'answer', 'Though she has lived in New York for ten years, she still misses Korea.',
      'acceptedAnswers', jsonb_build_array('Though she has lived in New York for ten years, she still misses Korea.', 'Though she has lived in New York for ten years, she still misses Korea', 'Although she has lived in New York for ten years, she still misses Korea.', 'Although she has lived in New York for ten years, she still misses Korea'),
      'explanation', E'but(그러나) → 양보 관계 → though 사용. 10년이나 뉴욕에 살았음에도 불구하고 여전히 한국이 그리우므로 though를 사용한다.',
      'similar_answers', jsonb_build_array('Though she has lived in New York for ten years, she still misses Korea.', 'Although she has lived in New York for ten years, she still misses Korea.')
    ),
    jsonb_build_object(
      'id', 58,
      'type', 'short_answer',
      'question', E'다음 문장을 since 또는 though를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nHe is very young. Therefore, he can\'t drive a car.',
      'answer', E'Since he is very young, he can\'t drive a car.',
      'acceptedAnswers', jsonb_build_array(E'Since he is very young, he can\'t drive a car.', E'Since he is very young, he can\'t drive a car', E'He can\'t drive a car since he is very young.', E'He can\'t drive a car since he is very young'),
      'explanation', E'Therefore(그러므로) → 이유-결과 관계 → since 사용. 매우 어리기 때문에 운전을 할 수 없으므로 since를 사용한다.',
      'similar_answers', jsonb_build_array(E'Since he is very young, he can\'t drive a car.', E'He can\'t drive a car since he is very young.')
    ),
    jsonb_build_object(
      'id', 59,
      'type', 'short_answer',
      'question', E'다음 문장을 since 또는 though를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nShe has a lot of money, but she never buys expensive things.',
      'answer', 'Though she has a lot of money, she never buys expensive things.',
      'acceptedAnswers', jsonb_build_array('Though she has a lot of money, she never buys expensive things.', 'Though she has a lot of money, she never buys expensive things', 'Although she has a lot of money, she never buys expensive things.', 'Although she has a lot of money, she never buys expensive things'),
      'explanation', E'but(그러나) → 양보 관계 → though 사용. 돈이 많음에도 불구하고 비싼 물건을 사지 않으므로 though를 사용한다.',
      'similar_answers', jsonb_build_array('Though she has a lot of money, she never buys expensive things.', 'Although she has a lot of money, she never buys expensive things.')
    ),
    jsonb_build_object(
      'id', 60,
      'type', 'short_answer',
      'question', E'다음 문장을 since 또는 though를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nHe had eaten a big lunch an hour ago, but he was already hungry.',
      'answer', 'Though he had eaten a big lunch an hour ago, he was already hungry.',
      'acceptedAnswers', jsonb_build_array('Though he had eaten a big lunch an hour ago, he was already hungry.', 'Though he had eaten a big lunch an hour ago, he was already hungry', 'Although he had eaten a big lunch an hour ago, he was already hungry.', 'Although he had eaten a big lunch an hour ago, he was already hungry'),
      'explanation', E'but(그러나) → 양보 관계 → though 사용. 한 시간 전에 큰 점심을 먹었음에도 불구하고 이미 배가 고팠으므로 though를 사용한다.',
      'similar_answers', jsonb_build_array('Though he had eaten a big lunch an hour ago, he was already hungry.', 'Although he had eaten a big lunch an hour ago, he was already hungry.')
    ),
    jsonb_build_object(
      'id', 61,
      'type', 'short_answer',
      'question', E'다음 문장을 since 또는 though를 사용하여 같은 의미의 문장으로 다시 쓰시오.\n\nMy parents were not home during the weekend. So I had to take care of my little brother.',
      'answer', 'Since my parents were not home during the weekend, I had to take care of my little brother.',
      'acceptedAnswers', jsonb_build_array('Since my parents were not home during the weekend, I had to take care of my little brother.', 'Since my parents were not home during the weekend, I had to take care of my little brother', 'I had to take care of my little brother since my parents were not home during the weekend.', 'I had to take care of my little brother since my parents were not home during the weekend'),
      'explanation', E'So(그래서) → 이유-결과 관계 → since 사용. 부모님이 주말에 집에 안 계셨기 때문에 남동생을 돌봐야 했으므로 since를 사용한다.',
      'similar_answers', jsonb_build_array('Since my parents were not home during the weekend, I had to take care of my little brother.', 'I had to take care of my little brother since my parents were not home during the weekend.')
    ),

    -- Part 6: 두 문장을 since / though를 이용하여 한 문장으로 쓰기 (Q62-Q74)
    jsonb_build_object(
      'id', 62,
      'type', 'short_answer',
      'question', E'주어진 두 문장을 since 또는 though를 사용하여 한 문장으로 연결하시오.\n\n• It was already midnight.\n• The streets were still crowded.',
      'answer', 'Though it was already midnight, the streets were still crowded.',
      'acceptedAnswers', jsonb_build_array('Though it was already midnight, the streets were still crowded.', 'Though it was already midnight, the streets were still crowded', 'Although it was already midnight, the streets were still crowded.', 'Although it was already midnight, the streets were still crowded', 'The streets were still crowded though it was already midnight.', 'The streets were still crowded though it was already midnight', 'The streets were still crowded although it was already midnight.', 'The streets were still crowded although it was already midnight'),
      'explanation', E'자정이었음에도 불구하고 거리가 여전히 붐볐다 → 양보 관계 → though 사용.',
      'similar_answers', jsonb_build_array('Though it was already midnight, the streets were still crowded.', 'Although it was already midnight, the streets were still crowded.')
    ),
    jsonb_build_object(
      'id', 63,
      'type', 'short_answer',
      'question', E'주어진 두 문장을 since 또는 though를 사용하여 한 문장으로 연결하시오.\n\n• He had a bad cold.\n• He couldn\'t go to school.',
      'answer', E'Since he had a bad cold, he couldn\'t go to school.',
      'acceptedAnswers', jsonb_build_array(E'Since he had a bad cold, he couldn\'t go to school.', E'Since he had a bad cold, he couldn\'t go to school', E'He couldn\'t go to school since he had a bad cold.', E'He couldn\'t go to school since he had a bad cold'),
      'explanation', E'심한 감기에 걸렸기 때문에 학교에 갈 수 없었다 → 이유-결과 관계 → since 사용.',
      'similar_answers', jsonb_build_array(E'Since he had a bad cold, he couldn\'t go to school.', E'He couldn\'t go to school since he had a bad cold.')
    ),
    jsonb_build_object(
      'id', 64,
      'type', 'short_answer',
      'question', E'주어진 두 문장을 since 또는 though를 사용하여 한 문장으로 연결하시오.\n\n• She was nervous.\n• She gave a confident presentation.',
      'answer', 'Though she was nervous, she gave a confident presentation.',
      'acceptedAnswers', jsonb_build_array('Though she was nervous, she gave a confident presentation.', 'Though she was nervous, she gave a confident presentation', 'Although she was nervous, she gave a confident presentation.', 'Although she was nervous, she gave a confident presentation', 'She gave a confident presentation though she was nervous.', 'She gave a confident presentation though she was nervous', 'She gave a confident presentation although she was nervous.', 'She gave a confident presentation although she was nervous'),
      'explanation', E'긴장했음에도 불구하고 자신감 있는 발표를 했다 → 양보 관계 → though 사용.',
      'similar_answers', jsonb_build_array('Though she was nervous, she gave a confident presentation.', 'Although she was nervous, she gave a confident presentation.')
    ),
    jsonb_build_object(
      'id', 65,
      'type', 'short_answer',
      'question', E'주어진 두 문장을 since 또는 though를 사용하여 한 문장으로 연결하시오.\n\n• Nobody was at home.\n• I left a note on the door.',
      'answer', 'Since nobody was at home, I left a note on the door.',
      'acceptedAnswers', jsonb_build_array('Since nobody was at home, I left a note on the door.', 'Since nobody was at home, I left a note on the door', 'I left a note on the door since nobody was at home.', 'I left a note on the door since nobody was at home'),
      'explanation', E'아무도 집에 없었기 때문에 문에 메모를 남겼다 → 이유-결과 관계 → since 사용.',
      'similar_answers', jsonb_build_array('Since nobody was at home, I left a note on the door.', 'I left a note on the door since nobody was at home.')
    ),
    jsonb_build_object(
      'id', 66,
      'type', 'short_answer',
      'question', E'주어진 두 문장을 since 또는 though를 사용하여 한 문장으로 연결하시오.\n\n• It was her first time on stage.\n• She performed perfectly.',
      'answer', 'Though it was her first time on stage, she performed perfectly.',
      'acceptedAnswers', jsonb_build_array('Though it was her first time on stage, she performed perfectly.', 'Though it was her first time on stage, she performed perfectly', 'Although it was her first time on stage, she performed perfectly.', 'Although it was her first time on stage, she performed perfectly', 'She performed perfectly though it was her first time on stage.', 'She performed perfectly though it was her first time on stage', 'She performed perfectly although it was her first time on stage.', 'She performed perfectly although it was her first time on stage'),
      'explanation', E'무대에 처음 섰음에도 불구하고 완벽하게 공연했다 → 양보 관계 → though 사용.',
      'similar_answers', jsonb_build_array('Though it was her first time on stage, she performed perfectly.', 'Although it was her first time on stage, she performed perfectly.')
    ),
    jsonb_build_object(
      'id', 67,
      'type', 'short_answer',
      'question', E'주어진 두 문장을 since 또는 though를 사용하여 한 문장으로 연결하시오.\n\n• I had nothing to do at home.\n• I decided to take a walk in the park.',
      'answer', 'Since I had nothing to do at home, I decided to take a walk in the park.',
      'acceptedAnswers', jsonb_build_array('Since I had nothing to do at home, I decided to take a walk in the park.', 'Since I had nothing to do at home, I decided to take a walk in the park', 'I decided to take a walk in the park since I had nothing to do at home.', 'I decided to take a walk in the park since I had nothing to do at home'),
      'explanation', E'집에서 할 일이 없었기 때문에 공원에 산책하러 갔다 → 이유-결과 관계 → since 사용.',
      'similar_answers', jsonb_build_array('Since I had nothing to do at home, I decided to take a walk in the park.', 'I decided to take a walk in the park since I had nothing to do at home.')
    ),
    jsonb_build_object(
      'id', 68,
      'type', 'short_answer',
      'question', E'주어진 두 문장을 since 또는 though를 사용하여 한 문장으로 연결하시오.\n\n• He failed the exam several times.\n• He never gave up on his dream.',
      'answer', 'Though he failed the exam several times, he never gave up on his dream.',
      'acceptedAnswers', jsonb_build_array('Though he failed the exam several times, he never gave up on his dream.', 'Though he failed the exam several times, he never gave up on his dream', 'Although he failed the exam several times, he never gave up on his dream.', 'Although he failed the exam several times, he never gave up on his dream', 'He never gave up on his dream though he failed the exam several times.', 'He never gave up on his dream though he failed the exam several times', 'He never gave up on his dream although he failed the exam several times.', 'He never gave up on his dream although he failed the exam several times'),
      'explanation', E'시험에 여러 번 떨어졌음에도 불구하고 꿈을 포기하지 않았다 → 양보 관계 → though 사용.',
      'similar_answers', jsonb_build_array('Though he failed the exam several times, he never gave up on his dream.', 'Although he failed the exam several times, he never gave up on his dream.')
    ),
    jsonb_build_object(
      'id', 69,
      'type', 'short_answer',
      'question', E'주어진 두 문장을 since 또는 though를 사용하여 한 문장으로 연결하시오.\n\n• The movie got terrible reviews.\n• It became a huge box office hit.',
      'answer', 'Though the movie got terrible reviews, it became a huge box office hit.',
      'acceptedAnswers', jsonb_build_array('Though the movie got terrible reviews, it became a huge box office hit.', 'Though the movie got terrible reviews, it became a huge box office hit', 'Although the movie got terrible reviews, it became a huge box office hit.', 'Although the movie got terrible reviews, it became a huge box office hit', 'It became a huge box office hit though the movie got terrible reviews.', 'It became a huge box office hit though the movie got terrible reviews', 'It became a huge box office hit although the movie got terrible reviews.', 'It became a huge box office hit although the movie got terrible reviews'),
      'explanation', E'영화가 끔찍한 평가를 받았음에도 불구하고 큰 흥행을 했다 → 양보 관계 → though 사용.',
      'similar_answers', jsonb_build_array('Though the movie got terrible reviews, it became a huge box office hit.', 'Although the movie got terrible reviews, it became a huge box office hit.')
    ),
    jsonb_build_object(
      'id', 70,
      'type', 'short_answer',
      'question', E'주어진 두 문장을 since 또는 though를 사용하여 한 문장으로 연결하시오.\n\n• Mia lost her phone.\n• She couldn\'t contact anyone.',
      'answer', E'Since Mia lost her phone, she couldn\'t contact anyone.',
      'acceptedAnswers', jsonb_build_array(E'Since Mia lost her phone, she couldn\'t contact anyone.', E'Since Mia lost her phone, she couldn\'t contact anyone', E'She couldn\'t contact anyone since Mia lost her phone.', E'She couldn\'t contact anyone since Mia lost her phone'),
      'explanation', E'Mia가 전화를 잃어버렸기 때문에 아무에게도 연락할 수 없었다 → 이유-결과 관계 → since 사용.',
      'similar_answers', jsonb_build_array(E'Since Mia lost her phone, she couldn\'t contact anyone.', E'She couldn\'t contact anyone since Mia lost her phone.')
    ),
    jsonb_build_object(
      'id', 71,
      'type', 'short_answer',
      'question', E'주어진 두 문장을 since 또는 though를 사용하여 한 문장으로 연결하시오.\n\n• The flight was delayed by three hours.\n• We still caught our connecting flight.',
      'answer', 'Though the flight was delayed by three hours, we still caught our connecting flight.',
      'acceptedAnswers', jsonb_build_array('Though the flight was delayed by three hours, we still caught our connecting flight.', 'Though the flight was delayed by three hours, we still caught our connecting flight', 'Although the flight was delayed by three hours, we still caught our connecting flight.', 'Although the flight was delayed by three hours, we still caught our connecting flight', 'We still caught our connecting flight though the flight was delayed by three hours.', 'We still caught our connecting flight though the flight was delayed by three hours', 'We still caught our connecting flight although the flight was delayed by three hours.', 'We still caught our connecting flight although the flight was delayed by three hours'),
      'explanation', E'비행기가 3시간 지연되었음에도 불구하고 환승 비행기를 탔다 → 양보 관계 → though 사용.',
      'similar_answers', jsonb_build_array('Though the flight was delayed by three hours, we still caught our connecting flight.', 'Although the flight was delayed by three hours, we still caught our connecting flight.')
    ),
    jsonb_build_object(
      'id', 72,
      'type', 'short_answer',
      'question', E'주어진 두 문장을 since 또는 though를 사용하여 한 문장으로 연결하시오.\n\n• He is good at painting.\n• He could easily learn how to draw cartoons.',
      'answer', 'Since he is good at painting, he could easily learn how to draw cartoons.',
      'acceptedAnswers', jsonb_build_array('Since he is good at painting, he could easily learn how to draw cartoons.', 'Since he is good at painting, he could easily learn how to draw cartoons', 'He could easily learn how to draw cartoons since he is good at painting.', 'He could easily learn how to draw cartoons since he is good at painting'),
      'explanation', E'그림을 잘 그리기 때문에 만화 그리는 법을 쉽게 배울 수 있다 → 이유-결과 관계 → since 사용.',
      'similar_answers', jsonb_build_array('Since he is good at painting, he could easily learn how to draw cartoons.', 'He could easily learn how to draw cartoons since he is good at painting.')
    ),
    jsonb_build_object(
      'id', 73,
      'type', 'short_answer',
      'question', E'주어진 두 문장을 since 또는 though를 사용하여 한 문장으로 연결하시오.\n\n• Ms. Wilson is not Korean.\n• She enjoys eating kimchi very much.',
      'answer', 'Though Ms. Wilson is not Korean, she enjoys eating kimchi very much.',
      'acceptedAnswers', jsonb_build_array('Though Ms. Wilson is not Korean, she enjoys eating kimchi very much.', 'Though Ms. Wilson is not Korean, she enjoys eating kimchi very much', 'Although Ms. Wilson is not Korean, she enjoys eating kimchi very much.', 'Although Ms. Wilson is not Korean, she enjoys eating kimchi very much', 'She enjoys eating kimchi very much though Ms. Wilson is not Korean.', 'She enjoys eating kimchi very much though Ms. Wilson is not Korean', 'She enjoys eating kimchi very much although Ms. Wilson is not Korean.', 'She enjoys eating kimchi very much although Ms. Wilson is not Korean'),
      'explanation', E'Wilson 선생님은 한국인이 아님에도 불구하고 김치 먹는 것을 매우 좋아한다 → 양보 관계 → though 사용.',
      'similar_answers', jsonb_build_array('Though Ms. Wilson is not Korean, she enjoys eating kimchi very much.', 'Although Ms. Wilson is not Korean, she enjoys eating kimchi very much.')
    ),
    jsonb_build_object(
      'id', 74,
      'type', 'short_answer',
      'question', E'주어진 두 문장을 since 또는 though를 사용하여 한 문장으로 연결하시오.\n\n• The problem is very hard to solve.\n• You should ask someone for help.',
      'answer', 'Since the problem is very hard to solve, you should ask someone for help.',
      'acceptedAnswers', jsonb_build_array('Since the problem is very hard to solve, you should ask someone for help.', 'Since the problem is very hard to solve, you should ask someone for help', 'You should ask someone for help since the problem is very hard to solve.', 'You should ask someone for help since the problem is very hard to solve'),
      'explanation', E'문제가 풀기 매우 어렵기 때문에 누군가에게 도움을 요청해야 한다 → 이유-결과 관계 → since 사용.',
      'similar_answers', jsonb_build_array('Since the problem is very hard to solve, you should ask someone for help.', 'You should ask someone for help since the problem is very hard to solve.')
    )
  );

  -- Part 7~8 (Q75~Q100)
  q3 := jsonb_build_array(

    -- Part 7: 어법 오류 찾아 고쳐 쓰기 (Q75-Q87)
    jsonb_build_object(
      'id', 75,
      'type', 'short_answer',
      'question', E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 쓰시오.\n\nAlthough the bad weather, we went on a picnic.',
      'answer', E'Although → Despite / In spite of',
      'acceptedAnswers', jsonb_build_array('Although → Despite', 'Although → In spite of', 'Despite the bad weather', 'In spite of the bad weather', 'Despite', 'In spite of'),
      'explanation', E'although 뒤에는 절(주어+동사)이 와야 하지만 명사구(the bad weather)가 왔으므로 전치사 despite/in spite of로 바꿔야 한다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 76,
      'type', 'short_answer',
      'question', E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 쓰시오.\n\nDespite he was tired, he stayed up late to finish the project.',
      'answer', E'Despite → Though / Although',
      'acceptedAnswers', jsonb_build_array('Despite → Though', 'Despite → Although', 'Though he was tired', 'Although he was tired', 'Though', 'Although'),
      'explanation', E'despite 뒤에는 명사구가 와야 하지만 절(he was tired)이 왔으므로 접속사 though/although로 바꿔야 한다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 77,
      'type', 'short_answer',
      'question', E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 쓰시오.\n\nAlthough he studied hard, but he failed the exam.',
      'answer', E'but 삭제',
      'acceptedAnswers', jsonb_build_array('but 삭제', 'Although he studied hard, he failed the exam.', 'Although he studied hard, he failed the exam'),
      'explanation', E'although와 but은 함께 쓸 수 없다. 둘 중 하나만 사용해야 한다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 78,
      'type', 'short_answer',
      'question', E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 쓰시오.\n\nThough began last, she finished first.',
      'answer', E'Though began last → Though she began last',
      'acceptedAnswers', jsonb_build_array('Though she began last', 'Though began last → Though she began last'),
      'explanation', E'though절에는 주어+동사가 필요하다. 주어 she가 빠져 있다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 79,
      'type', 'short_answer',
      'question', E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 쓰시오.\n\nIn spite of she worked hard, she didn''t get a promotion.',
      'answer', E'In spite of → Although / Though',
      'acceptedAnswers', jsonb_build_array('In spite of → Although', 'In spite of → Though', 'Although she worked hard', 'Though she worked hard', 'Although', 'Though'),
      'explanation', E'in spite of 뒤에는 명사구가 와야 하지만 절(she worked hard)이 왔으므로 접속사로 바꿔야 한다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 80,
      'type', 'short_answer',
      'question', E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 쓰시오.\n\nShe got up late since she was on time for school.',
      'answer', E'since → though / although',
      'acceptedAnswers', jsonb_build_array('since → though', 'since → although', 'though', 'although'),
      'explanation', E'늦게 일어났는데 제시간에 도착한 것은 이유 관계가 아닌 양보 관계이므로 though/although를 써야 한다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 81,
      'type', 'short_answer',
      'question', E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 쓰시오.\n\nI couldn''t sleep although I very tired.',
      'answer', E'although I very tired → although I was very tired',
      'acceptedAnswers', jsonb_build_array('although I was very tired', 'I was very tired'),
      'explanation', E'be동사(was)가 누락되었다. although 절에도 완전한 절(주어+동사)이 와야 한다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 82,
      'type', 'short_answer',
      'question', E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 쓰시오.\n\nEven though of the rain, the baseball game was not canceled.',
      'answer', E'Even though of → Despite / In spite of',
      'acceptedAnswers', jsonb_build_array('Even though of → Despite', 'Even though of → In spite of', 'Despite the rain', 'In spite of the rain', 'Despite', 'In spite of'),
      'explanation', E'even though 뒤에는 절이 와야 하고 of는 올 수 없다. 명사구(the rain)이므로 despite/in spite of를 써야 한다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 83,
      'type', 'short_answer',
      'question', E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 쓰시오.\n\nDespite of the storm, the airplane landed safely.',
      'answer', E'Despite of → Despite',
      'acceptedAnswers', jsonb_build_array('Despite of → Despite', 'Despite', 'Despite the storm'),
      'explanation', E'despite 뒤에 of를 쓰지 않는다. in spite of와 혼동하지 않도록 주의해야 한다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 84,
      'type', 'short_answer',
      'question', E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 쓰시오.\n\nAlthough our house is small, but it''s big enough for our family.',
      'answer', E'but 삭제',
      'acceptedAnswers', jsonb_build_array('but 삭제', E'Although our house is small, it\'s big enough for our family.', E'Although our house is small, it\'s big enough for our family'),
      'explanation', E'although와 but은 중복 사용할 수 없다. 둘 중 하나만 사용해야 한다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 85,
      'type', 'short_answer',
      'question', E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 쓰시오.\n\nShe couldn''t get good grades though she studied very hard.',
      'answer', E'오류 없음',
      'acceptedAnswers', jsonb_build_array('오류 없음', '오류없음'),
      'explanation', E'열심히 공부했지만 성적이 안 나온 것은 양보 관계이므로 though 사용이 올바르다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 86,
      'type', 'short_answer',
      'question', E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 쓰시오.\n\nSince he is very rich, he is not happy at all.',
      'answer', E'Since → Though / Although',
      'acceptedAnswers', jsonb_build_array('Since → Though', 'Since → Although', 'Though', 'Although'),
      'explanation', E'부유한 것이 불행의 이유가 되는 것은 어색하다. 양보 관계이므로 though/although를 써야 한다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 87,
      'type', 'short_answer',
      'question', E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 쓰시오.\n\nThough I was because I missed the bus, I was late for the meeting.',
      'answer', E'Though I was because → Since',
      'acceptedAnswers', jsonb_build_array('Since I missed the bus, I was late for the meeting.', 'Since I missed the bus, I was late for the meeting', 'Because I missed the bus, I was late for the meeting.', 'Because I missed the bus, I was late for the meeting'),
      'explanation', E'though와 because 접속사를 중복 사용할 수 없다. 버스를 놓쳐서 지각한 것은 이유 관계이므로 since/because를 써야 한다.',
      'options', '[]'::jsonb
    ),
    -- Part 8: 조건 영작 (Q88-Q100)
    jsonb_build_object(
      'id', 88,
      'type', 'short_answer',
      'question', E'주어진 우리말과 조건에 맞게 영작하시오.\n\n비가 오고 있었기 때문에, 우리는 축구를 할 수 없었다.\n【조건】since, play soccer 사용 / 10단어',
      'answer', E'Since it was raining, we couldn''t play soccer.',
      'acceptedAnswers', jsonb_build_array(E'Since it was raining, we couldn\'t play soccer.', E'Since it was raining, we couldn\'t play soccer', E'Since it was raining, we could not play soccer.', E'Since it was raining, we could not play soccer'),
      'explanation', E'since(~이기 때문에)를 사용하여 이유를 나타내는 부사절을 만든다. 과거진행(was raining) + couldn''t play soccer.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 89,
      'type', 'short_answer',
      'question', E'주어진 우리말과 조건에 맞게 영작하시오.\n\n비록 그는 나이가 많지만, 매우 활동적이다.\n【조건】although, active 사용 / 8단어',
      'answer', E'Although he is old, he is very active.',
      'acceptedAnswers', jsonb_build_array('Although he is old, he is very active.', 'Although he is old, he is very active'),
      'explanation', E'although(비록 ~이지만)를 사용하여 양보를 나타내는 부사절을 만든다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 90,
      'type', 'short_answer',
      'question', E'주어진 우리말과 조건에 맞게 영작하시오.\n\n그녀는 시험이 있었기 때문에 긴장했다.\n【조건】since, have an exam 사용 / 9단어',
      'answer', E'She was nervous since she had an exam.',
      'acceptedAnswers', jsonb_build_array('She was nervous since she had an exam.', 'She was nervous since she had an exam', 'Since she had an exam, she was nervous.', 'Since she had an exam, she was nervous'),
      'explanation', E'since(~이기 때문에)를 사용하여 이유를 나타낸다. have an exam의 과거형 had an exam을 사용한다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 91,
      'type', 'short_answer',
      'question', E'주어진 우리말과 조건에 맞게 영작하시오.\n\n비록 서비스는 느렸지만, 웨이터들은 친절했다.\n【조건】though, waiters 사용 / 9단어',
      'answer', E'Though the service was slow, the waiters were kind.',
      'acceptedAnswers', jsonb_build_array('Though the service was slow, the waiters were kind.', 'Though the service was slow, the waiters were kind'),
      'explanation', E'though(비록 ~이지만)를 사용하여 양보를 나타내는 부사절을 만든다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 92,
      'type', 'short_answer',
      'question', E'주어진 우리말과 조건에 맞게 영작하시오.\n\n그녀는 숙제가 있었기 때문에 늦게까지 자지 않고 있었다.\n【조건】since, stay up late 사용 / 10단어',
      'answer', E'Since she had homework to do, she stayed up late.',
      'acceptedAnswers', jsonb_build_array('Since she had homework to do, she stayed up late.', 'Since she had homework to do, she stayed up late', 'She stayed up late since she had homework to do.', 'She stayed up late since she had homework to do'),
      'explanation', E'since(~이기 때문에)를 사용하여 이유를 나타낸다. stay up late(늦게까지 깨어 있다)의 과거형 stayed up late를 사용한다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 93,
      'type', 'short_answer',
      'question', E'주어진 우리말과 조건에 맞게 영작하시오.\n\n비록 그 집은 작지만, 우리 가족에게는 충분히 크다.\n【조건】although, enough 사용 / 11단어',
      'answer', E'Although our house is small, it is big enough for our family.',
      'acceptedAnswers', jsonb_build_array(E'Although our house is small, it is big enough for our family.', E'Although our house is small, it is big enough for our family', E'Although our house is small, it\'s big enough for our family.', E'Although our house is small, it\'s big enough for our family'),
      'explanation', E'although(비록 ~이지만)를 사용하여 양보를 나타낸다. big enough for(~에게 충분히 큰)를 사용한다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 94,
      'type', 'short_answer',
      'question', E'주어진 우리말과 조건에 맞게 영작하시오.\n\n날씨가 추웠기 때문에 나는 따뜻한 코트를 입었다.\n【조건】since, warm coat 사용 / 10단어',
      'answer', E'Since it was cold, I wore a warm coat.',
      'acceptedAnswers', jsonb_build_array('Since it was cold, I wore a warm coat.', 'Since it was cold, I wore a warm coat', 'I wore a warm coat since it was cold.', 'I wore a warm coat since it was cold'),
      'explanation', E'since(~이기 때문에)를 사용하여 이유를 나타낸다. wear의 과거형 wore를 사용한다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 95,
      'type', 'short_answer',
      'question', E'주어진 우리말과 조건에 맞게 영작하시오.\n\n나는 열심히 노력했지만 내 성적은 나아지지 않았다.\n【조건】though, grades, improve 사용 / 11단어',
      'answer', E'Though I tried hard, my grades didn''t improve.',
      'acceptedAnswers', jsonb_build_array(E'Though I tried hard, my grades didn\'t improve.', E'Though I tried hard, my grades didn\'t improve', 'Though I tried hard, my grades did not improve.', 'Though I tried hard, my grades did not improve'),
      'explanation', E'though(비록 ~이지만)를 사용하여 양보를 나타낸다. improve(나아지다, 향상하다)를 사용한다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 96,
      'type', 'short_answer',
      'question', E'주어진 우리말과 조건에 맞게 영작하시오.\n\n그는 지도가 없었음에도 불구하고 그곳에 쉽게 도착했다.\n【조건】though, map, get there 사용 / 12단어',
      'answer', E'Though he didn''t have a map, he got there easily.',
      'acceptedAnswers', jsonb_build_array(E'Though he didn\'t have a map, he got there easily.', E'Though he didn\'t have a map, he got there easily', 'Though he did not have a map, he got there easily.', 'Though he did not have a map, he got there easily'),
      'explanation', E'though(비록 ~이지만)를 사용하여 양보를 나타낸다. get there(그곳에 도착하다)의 과거형 got there를 사용한다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 97,
      'type', 'short_answer',
      'question', E'주어진 우리말과 조건에 맞게 영작하시오.\n\n그녀는 30개국 이상을 여행했기 때문에 영어를 유창하게 한다.\n【조건】since, travel, fluently 사용 / 13단어',
      'answer', E'Since she has traveled to more than 30 countries, she speaks English fluently.',
      'acceptedAnswers', jsonb_build_array('Since she has traveled to more than 30 countries, she speaks English fluently.', 'Since she has traveled to more than 30 countries, she speaks English fluently'),
      'explanation', E'since(~이기 때문에)를 사용하여 이유를 나타낸다. 경험을 나타내는 현재완료(has traveled)를 사용한다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 98,
      'type', 'short_answer',
      'question', E'주어진 우리말과 조건에 맞게 영작하시오.\n\n비록 그녀는 어렸지만 혼자 힘으로 사업을 시작했다.\n【조건】even though, on her own 사용 / 12단어',
      'answer', E'Even though she was young, she started a business on her own.',
      'acceptedAnswers', jsonb_build_array('Even though she was young, she started a business on her own.', 'Even though she was young, she started a business on her own'),
      'explanation', E'even though(비록 ~일지라도)를 사용하여 강한 양보를 나타낸다. on her own(혼자 힘으로)을 사용한다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 99,
      'type', 'short_answer',
      'question', E'주어진 우리말과 조건에 맞게 영작하시오.\n\n나는 쉽게 살이 찌기 때문에 항상 다이어트 중이다.\n【조건】since, gain weight, on a diet 사용 / 11단어',
      'answer', E'I am always on a diet since I gain weight easily.',
      'acceptedAnswers', jsonb_build_array('I am always on a diet since I gain weight easily.', 'I am always on a diet since I gain weight easily', 'Since I gain weight easily, I am always on a diet.', 'Since I gain weight easily, I am always on a diet'),
      'explanation', E'since(~이기 때문에)를 사용하여 이유를 나타낸다. gain weight(살이 찌다), on a diet(다이어트 중인)를 사용한다.',
      'options', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 100,
      'type', 'short_answer',
      'question', E'주어진 우리말과 조건에 맞게 영작하시오.\n\n비록 그는 50년도 더 전에 세상을 떠났지만, 그의 정신은 우리와 함께 영원히 남아 있을 것이다.\n【조건】though, pass away, spirit, remain 사용 / 17단어',
      'answer', E'Though he passed away more than 50 years ago, his spirit will remain with us forever.',
      'acceptedAnswers', jsonb_build_array('Though he passed away more than 50 years ago, his spirit will remain with us forever.', 'Though he passed away more than 50 years ago, his spirit will remain with us forever'),
      'explanation', E'though(비록 ~이지만)를 사용하여 양보를 나타낸다. pass away(세상을 떠나다), spirit(정신), remain(남아 있다)을 사용한다.',
      'options', '[]'::jsonb
    )
  );

  a := jsonb_build_array('1', '2', '1', '1', '2', '1', '1', '1', '1', '2', '1', '2', '2', '2', '1', '1', '2', '1', '1', '2', '1', '2', '1', '1', '1', '1', '2', '1', '2', '1', '2', '1', '1', '2', '1', '2', '2', '1', '2', '1', '2', '1', '2', '2', '1', '2', '1', '2', '2', 'Since it was very cold, we stayed indoors.', 'Though she was tired, she finished all her homework.', E'Though he didn\'t have a map, he found the place easily.', E'Since the shoes were too expensive, I couldn\'t buy them.', E'Though the concert was amazing, I didn\'t enjoy it much.', 'Though Tom studied hard for the exam, he still got a low score.', E'Since there was a typhoon, we couldn\'t go camping.', 'Though she has lived in New York for ten years, she still misses Korea.', E'Since he is very young, he can\'t drive a car.', 'Though she has a lot of money, she never buys expensive things.', 'Though he had eaten a big lunch an hour ago, he was already hungry.', 'Since my parents were not home during the weekend, I had to take care of my little brother.', 'Though it was already midnight, the streets were still crowded.', E'Since he had a bad cold, he couldn\'t go to school.', 'Though she was nervous, she gave a confident presentation.', 'Since nobody was at home, I left a note on the door.', 'Though it was her first time on stage, she performed perfectly.', 'Since I had nothing to do at home, I decided to take a walk in the park.', 'Though he failed the exam several times, he never gave up on his dream.', 'Though the movie got terrible reviews, it became a huge box office hit.', E'Since Mia lost her phone, she couldn\'t contact anyone.', 'Though the flight was delayed by three hours, we still caught our connecting flight.', 'Since he is good at painting, he could easily learn how to draw cartoons.', 'Though Ms. Wilson is not Korean, she enjoys eating kimchi very much.', 'Since the problem is very hard to solve, you should ask someone for help.', E'Although → Despite / In spite of', E'Despite → Though / Although', E'but 삭제', E'Though began last → Though she began last', E'In spite of → Although / Though', E'since → though / although', E'although I very tired → although I was very tired', E'Even though of → Despite / In spite of', E'Despite of → Despite', E'but 삭제', E'오류 없음', E'Since → Though / Although', E'Though I was because → Since', E'Since it was raining, we couldn''t play soccer.', E'Although he is old, he is very active.', E'She was nervous since she had an exam.', E'Though the service was slow, the waiters were kind.', E'Since she had homework to do, she stayed up late.', E'Although our house is small, it is big enough for our family.', E'Since it was cold, I wore a warm coat.', E'Though I tried hard, my grades didn''t improve.', E'Though he didn''t have a map, he got there easily.', E'Since she has traveled to more than 30 countries, she speaks English fluently.', E'Even though she was young, she started a business on her own.', E'I am always on a diet since I gain weight easily.', E'Though he passed away more than 50 years ago, his spirit will remain with us forever.');

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES (
    E'접속사 since/though Step 1',
    E'접속사 since/though',
    q1 || q2 || q3,
    a,
    'problem',
    'interactive'
  );
END $$;
