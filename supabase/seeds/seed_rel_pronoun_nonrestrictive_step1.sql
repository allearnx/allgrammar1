DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates
  WHERE template_topic = '관계대명사의 계속적 용법'
    AND title LIKE '%Step 1%';

  q := jsonb_build_array(
        jsonb_build_object(
      'number', 1,
      'question', E'[Part 1] 계속적 용법이 되도록 필요한 곳에 콤마(,)를 넣어 전체 문장을 다시 쓰시오.\n\nMy grandfather who is 80 years old still goes jogging every morning.',
      'answer', E'My grandfather, who is 80 years old, still goes jogging every morning.',
      'similar_answers', jsonb_build_array(E'My grandfather, who is 80 years old, still goes jogging every morning'),
      'explanation', E'고유명사/유일한 존재(My grandfather)이므로 계속적 용법 사용 — who 앞뒤에 콤마'
    ),
    jsonb_build_object(
      'number', 2,
      'question', E'계속적 용법이 되도록 필요한 곳에 콤마(,)를 넣어 전체 문장을 다시 쓰시오.\n\nParis which is the capital of France is famous for the Eiffel Tower.',
      'answer', E'Paris, which is the capital of France, is famous for the Eiffel Tower.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'고유명사 Paris는 유일하므로 계속적 용법 사용'
    ),
    jsonb_build_object(
      'number', 3,
      'question', E'계속적 용법이 되도록 필요한 곳에 콤마(,)를 넣어 전체 문장을 다시 쓰시오.\n\nShe called her best friend Amy who lives in Busan.',
      'answer', E'She called her best friend Amy, who lives in Busan.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'Amy라는 이름으로 이미 특정된 사람이므로 계속적 용법'
    ),
    jsonb_build_object(
      'number', 4,
      'question', E'계속적 용법이 되도록 필요한 곳에 콤마(,)를 넣어 전체 문장을 다시 쓰시오.\n\nThe singer whose voice is amazing released a new album last week.',
      'answer', E'The singer, whose voice is amazing, released a new album last week.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'이미 특정된 가수에 대한 부연 설명이므로 계속적 용법'
    ),
    jsonb_build_object(
      'number', 5,
      'question', E'계속적 용법이 되도록 필요한 곳에 콤마(,)를 넣어 전체 문장을 다시 쓰시오.\n\nI watched the documentary which was filmed in Antarctica.',
      'answer', E'I watched the documentary, which was filmed in Antarctica.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'특정 다큐멘터리에 대한 부연 설명'
    ),
    jsonb_build_object(
      'number', 6,
      'question', E'계속적 용법이 되도록 필요한 곳에 콤마(,)를 넣어 전체 문장을 다시 쓰시오.\n\nProfessor Han who taught us biology retired last semester.',
      'answer', E'Professor Han, who taught us biology, retired last semester.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'고유명사 Professor Han — 계속적 용법'
    ),
    jsonb_build_object(
      'number', 7,
      'question', E'계속적 용법이 되도록 필요한 곳에 콤마(,)를 넣어 전체 문장을 다시 쓰시오.\n\nHe bought a new laptop which turned out to have a defect.',
      'answer', E'He bought a new laptop, which turned out to have a defect.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'새 노트북에 대한 부연 설명'
    ),
    jsonb_build_object(
      'number', 8,
      'question', E'계속적 용법이 되도록 필요한 곳에 콤마(,)를 넣어 전체 문장을 다시 쓰시오.\n\nMy neighbor Mr. Choi who has three cats is a very quiet person.',
      'answer', E'My neighbor Mr. Choi, who has three cats, is a very quiet person.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'고유명사 Mr. Choi — 계속적 용법'
    ),
    jsonb_build_object(
      'number', 9,
      'question', E'계속적 용법이 되도록 필요한 곳에 콤마(,)를 넣어 전체 문장을 다시 쓰시오.\n\nShe passed the final exam which made her parents very proud.',
      'answer', E'She passed the final exam, which made her parents very proud.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'앞 문장 전체(기말고사 합격)를 선행사로 하는 계속적 용법'
    ),
    jsonb_build_object(
      'number', 10,
      'question', E'계속적 용법이 되도록 필요한 곳에 콤마(,)를 넣어 전체 문장을 다시 쓰시오.\n\nEdison who invented the light bulb changed the world forever.',
      'answer', E'Edison, who invented the light bulb, changed the world forever.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'고유명사 Edison — 계속적 용법'
    ),
    jsonb_build_object(
      'number', 11,
      'question', E'[Part 2] 다음 두 문장을 관계대명사의 계속적 용법을 사용하여 한 문장으로 쓰시오.\n\n• I called my old teacher.\n• She remembered me at once.',
      'answer', E'I called my old teacher, who remembered me at once.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'선행사 my old teacher(사람) + 주격 who'
    ),
    jsonb_build_object(
      'number', 12,
      'question', E'다음 두 문장을 관계대명사의 계속적 용법을 사용하여 한 문장으로 쓰시오.\n\n• We visited the science museum.\n• It was closed for renovation.',
      'answer', E'We visited the science museum, which was closed for renovation.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'선행사 the science museum(사물) + 주격 which'
    ),
    jsonb_build_object(
      'number', 13,
      'question', E'다음 두 문장을 관계대명사의 계속적 용법을 사용하여 한 문장으로 쓰시오.\n\n• My brother runs a small café downtown.\n• He makes the best coffee I''ve ever tasted.',
      'answer', E'My brother, who makes the best coffee I''ve ever tasted, runs a small café downtown.',
      'similar_answers', jsonb_build_array(E'My brother, who makes the best coffee I''ve ever tasted, runs a small cafe downtown.'),
      'explanation', E'선행사 My brother(사람) + who절 삽입'
    ),
    jsonb_build_object(
      'number', 14,
      'question', E'다음 두 문장을 관계대명사의 계속적 용법을 사용하여 한 문장으로 쓰시오.\n\n• She lent me her bicycle.\n• It had a broken bell.',
      'answer', E'She lent me her bicycle, which had a broken bell.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'선행사 her bicycle(사물) + which'
    ),
    jsonb_build_object(
      'number', 15,
      'question', E'다음 두 문장을 관계대명사의 계속적 용법을 사용하여 한 문장으로 쓰시오.\n\n• I decided to take the early bus.\n• It arrived ten minutes late.',
      'answer', E'I decided to take the early bus, which arrived ten minutes late.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'선행사 the early bus(사물) + which'
    ),
    jsonb_build_object(
      'number', 16,
      'question', E'다음 두 문장을 관계대명사의 계속적 용법을 사용하여 한 문장으로 쓰시오.\n\n• We met Dr. Yoon at the conference.\n• She is an expert in climate science.',
      'answer', E'We met Dr. Yoon at the conference, who is an expert in climate science.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'선행사 Dr. Yoon(사람) + who'
    ),
    jsonb_build_object(
      'number', 17,
      'question', E'다음 두 문장을 관계대명사의 계속적 용법을 사용하여 한 문장으로 쓰시오.\n\n• He apologized to me.\n• It surprised everyone in the room.',
      'answer', E'He apologized to me, which surprised everyone in the room.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'앞 문장 전체를 선행사로 하는 which'
    ),
    jsonb_build_object(
      'number', 18,
      'question', E'다음 두 문장을 관계대명사의 계속적 용법을 사용하여 한 문장으로 쓰시오.\n\n• I have a younger sister.\n• She won first prize in a national art competition.',
      'answer', E'I have a younger sister, who won first prize in a national art competition.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'선행사 a younger sister(사람) + who'
    ),
    jsonb_build_object(
      'number', 19,
      'question', E'다음 두 문장을 관계대명사의 계속적 용법을 사용하여 한 문장으로 쓰시오.\n\n• They moved to a new apartment last month.\n• It is right next to the subway station.',
      'answer', E'They moved to a new apartment last month, which is right next to the subway station.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'선행사 a new apartment(사물) + which'
    ),
    jsonb_build_object(
      'number', 20,
      'question', E'다음 두 문장을 관계대명사의 계속적 용법을 사용하여 한 문장으로 쓰시오.\n\n• My coach encouraged me to keep practicing.\n• He is known for his strict training style.',
      'answer', E'My coach, who is known for his strict training style, encouraged me to keep practicing.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'선행사 My coach(사람) + who절 삽입'
    ),
    jsonb_build_object(
      'number', 21,
      'question', E'다음 두 문장을 관계대명사의 계속적 용법을 사용하여 한 문장으로 쓰시오.\n\n• She forgot to bring her umbrella.\n• It made her completely soaked in the rain.',
      'answer', E'She forgot to bring her umbrella, which made her completely soaked in the rain.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'앞 문장 전체를 선행사로 하는 which'
    ),
    jsonb_build_object(
      'number', 22,
      'question', E'다음 두 문장을 관계대명사의 계속적 용법을 사용하여 한 문장으로 쓰시오.\n\n• The team won the championship three times in a row.\n• This delighted all the fans.',
      'answer', E'The team won the championship three times in a row, which delighted all the fans.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'앞 문장 전체를 선행사 → which'
    ),
    jsonb_build_object(
      'number', 23,
      'question', E'다음 두 문장을 관계대명사의 계속적 용법을 사용하여 한 문장으로 쓰시오.\n\n• I talked to a stranger on the train.\n• He turned out to be my father''s old friend.',
      'answer', E'I talked to a stranger on the train, who turned out to be my father''s old friend.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'선행사 a stranger(사람) + who'
    ),
    jsonb_build_object(
      'number', 24,
      'question', E'다음 두 문장을 관계대명사의 계속적 용법을 사용하여 한 문장으로 쓰시오.\n\n• She donated all her savings to the shelter.\n• It moved many people deeply.',
      'answer', E'She donated all her savings to the shelter, which moved many people deeply.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'앞 문장 전체를 선행사 → which'
    ),
    jsonb_build_object(
      'number', 25,
      'question', E'[Part 3] 주어진 상황 설명에 알맞은 문장을 고르시오.\n\n[상황] I have only one dog. It is very energetic.',
      'options', jsonb_build_array(E'My dog which is very energetic runs around all day.', E'My dog, which is very energetic, runs around all day.'),
      'answer', E'2',
      'explanation', E'개가 한 마리뿐이므로 계속적 용법(콤마 사용)이 적절'
    ),
    jsonb_build_object(
      'number', 26,
      'question', E'주어진 상황 설명에 알맞은 문장을 고르시오.\n\n[상황] There are many students in the school. I''m talking about one specific student who likes science.',
      'options', jsonb_build_array(E'The student who likes science joined the research club.', E'The student, who likes science, joined the research club.'),
      'answer', E'1',
      'explanation', E'여러 학생 중 과학을 좋아하는 특정 학생을 한정 → 한정적 용법'
    ),
    jsonb_build_object(
      'number', 27,
      'question', E'주어진 상황 설명에 알맞은 문장을 고르시오.\n\n[상황] Minjun has four brothers. One of them is a doctor.',
      'options', jsonb_build_array(E'Minjun''s brother who is a doctor works at a children''s hospital.', E'Minjun''s brother, who is a doctor, works at a children''s hospital.'),
      'answer', E'1',
      'explanation', E'형제가 여럿이므로 의사인 형제를 특정 → 한정적 용법'
    ),
    jsonb_build_object(
      'number', 28,
      'question', E'주어진 상황 설명에 알맞은 문장을 고르시오.\n\n[상황] Sora has only one cat. It keeps waking her up at night.',
      'options', jsonb_build_array(E'Sora''s cat which wakes her up at night is very naughty.', E'Sora''s cat, which wakes her up at night, is very naughty.'),
      'answer', E'2',
      'explanation', E'고양이가 한 마리뿐이므로 계속적 용법'
    ),
    jsonb_build_object(
      'number', 29,
      'question', E'다음 두 문장의 의미 차이에 대한 설명으로 옳은 것은?\n\na. I have a friend who speaks four languages.\nb. I have a friend, who speaks four languages.',
      'options', jsonb_build_array(
        E'a는 여러 친구 중 4개 국어를 하는 친구를 특정 / b는 친구가 한 명뿐이며 그에 대한 부연 설명',
        E'a는 친구가 한 명뿐 / b는 여러 친구 중 특정 친구',
        E'a와 b의 의미는 같다',
        E'a는 한정적 용법 / b도 한정적 용법',
        E'a는 4개 국어를 못 하는 친구 / b는 4개 국어를 하는 친구'
      ),
      'answer', E'1',
      'explanation', E'a(한정적 용법): 여러 친구 중 4개 국어를 하는 친구가 있다. b(계속적 용법): 친구가 한 명 있는데, 그는 4개 국어를 한다.'
    ),
    jsonb_build_object(
      'number', 30,
      'question', E'주어진 상황 설명에 알맞은 문장을 고르시오.\n\n[상황] There are two laptops on the desk. I''m describing the one that is broken.',
      'options', jsonb_build_array(E'The laptop which is broken needs to be repaired.', E'The laptop, which is broken, needs to be repaired.'),
      'answer', E'1',
      'explanation', E'두 대 중 고장난 것을 특정 → 한정적 용법'
    ),
    jsonb_build_object(
      'number', 31,
      'question', E'주어진 상황 설명에 알맞은 문장을 고르시오.\n\n[상황] My grandmother has only one house. It was built 60 years ago.',
      'options', jsonb_build_array(E'My grandmother''s house which was built 60 years ago is still very sturdy.', E'My grandmother''s house, which was built 60 years ago, is still very sturdy.'),
      'answer', E'2',
      'explanation', E'집이 한 채뿐이므로 계속적 용법'
    ),
    jsonb_build_object(
      'number', 32,
      'question', E'주어진 상황 설명에 알맞은 문장을 고르시오.\n\n[상황] Junho has many jackets. Only the ones that are waterproof are useful on rainy days.',
      'options', jsonb_build_array(E'Junho''s jackets which are waterproof are useful on rainy days.', E'Junho''s jackets, which are waterproof, are useful on rainy days.'),
      'answer', E'1',
      'explanation', E'여러 재킷 중 방수 기능이 있는 것들을 특정 → 한정적 용법'
    ),
    jsonb_build_object(
      'number', 33,
      'question', E'주어진 상황 설명에 알맞은 문장을 고르시오.\n\n[상황] Kevin has three sisters. All of them became nurses.',
      'options', jsonb_build_array(E'Kevin''s sisters who became nurses work at the same hospital.', E'Kevin''s sisters, who became nurses, work at the same hospital.'),
      'answer', E'2',
      'explanation', E'세 자매 모두 간호사가 됨 — 부연 설명이므로 계속적 용법'
    ),
    jsonb_build_object(
      'number', 34,
      'question', E'다음 두 문장의 의미 차이에 대한 설명으로 옳은 것은?\n\na. I like teachers who give clear explanations.\nb. I like my teacher, who gives clear explanations.',
      'options', jsonb_build_array(
        E'a와 b는 같은 의미이다',
        E'a는 설명을 잘 하는 선생님들 전반을 좋아함 / b는 나의 선생님 한 분에 대한 부연 설명',
        E'a는 나의 선생님 한 분 / b는 여러 선생님들',
        E'a는 한정적 용법 / b도 한정적 용법',
        E'a는 계속적 용법 / b는 한정적 용법'
      ),
      'answer', E'2',
      'explanation', E'a(한정적 용법): 설명을 명확하게 해주는 선생님을 좋아한다(일반적). b(계속적 용법): 나의 선생님을 좋아하는데, 그는 설명을 명확하게 해준다(특정 한 분 부연).'
    ),
    jsonb_build_object(
      'number', 35,
      'question', E'[Part 4] [A]와 [B]를 연결하여 관계대명사의 계속적 용법(, who / , which)으로 한 문장을 쓰시오.\n\n[A] I admire my science teacher.\n[B] He explains everything we need to know.',
      'answer', E'I admire my science teacher, who explains everything we need to know.',
      'similar_answers', jsonb_build_array(E'I admire my science teacher, who explained everything we needed to know.'),
      'explanation', E'선행사 my science teacher(사람) + 주격 who'
    ),
    jsonb_build_object(
      'number', 36,
      'question', E'[A]와 [B]를 연결하여 관계대명사의 계속적 용법(, who / , which)으로 한 문장을 쓰시오.\n\n[A] We stayed at a small hotel.\n[B] It was a very small but cozy place.',
      'answer', E'We stayed at a small hotel, which was a very small but cozy place.',
      'similar_answers', jsonb_build_array(E'We stayed at a small hotel, which was very small but cozy.'),
      'explanation', E'선행사 a small hotel(사물) + which'
    ),
    jsonb_build_object(
      'number', 37,
      'question', E'[A]와 [B]를 연결하여 관계대명사의 계속적 용법(, who / , which)으로 한 문장을 쓰시오.\n\n[A] She introduced me to her cousin.\n[B] She works as a marine biologist.',
      'answer', E'She introduced me to her cousin, who works as a marine biologist.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'선행사 her cousin(사람) + who'
    ),
    jsonb_build_object(
      'number', 38,
      'question', E'[A]와 [B]를 연결하여 관계대명사의 계속적 용법(, who / , which)으로 한 문장을 쓰시오.\n\n[A] He submitted his report late.\n[B] It upset his professor greatly.',
      'answer', E'He submitted his report late, which upset his professor greatly.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'앞 문장 전체를 선행사 → which'
    ),
    jsonb_build_object(
      'number', 39,
      'question', E'[A]와 [B]를 연결하여 관계대명사의 계속적 용법(, who / , which)으로 한 문장을 쓰시오.\n\n[A] I lost my house key.\n[B] It turned out to be under my school bag.',
      'answer', E'I lost my house key, which turned out to be under my school bag.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'선행사 my house key(사물) + which'
    ),
    jsonb_build_object(
      'number', 40,
      'question', E'[A]와 [B]를 연결하여 관계대명사의 계속적 용법(, who / , which)으로 한 문장을 쓰시오.\n\n[A] They canceled the outdoor concert.\n[B] It disappointed everyone who had bought tickets.',
      'answer', E'They canceled the outdoor concert, which disappointed everyone who had bought tickets.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'앞 문장 전체를 선행사 → which'
    ),
    jsonb_build_object(
      'number', 41,
      'question', E'[A]와 [B]를 연결하여 관계대명사의 계속적 용법(, who / , which)으로 한 문장을 쓰시오.\n\n[A] She received a scholarship.\n[B] It covered all her tuition fees.',
      'answer', E'She received a scholarship, which covered all her tuition fees.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'선행사 a scholarship(사물) + which'
    ),
    jsonb_build_object(
      'number', 42,
      'question', E'[A]와 [B]를 연결하여 관계대명사의 계속적 용법(, who / , which)으로 한 문장을 쓰시오.\n\n[A] I read the novel twice.\n[B] It was really touching and made me cry.',
      'answer', E'I read the novel twice, which was really touching and made me cry.',
      'similar_answers', jsonb_build_array(),
      'explanation', E'선행사 the novel(사물) + which'
    ),
    jsonb_build_object(
      'number', 43,
      'question', E'[A]와 [B]를 연결하여 관계대명사의 계속적 용법(, who / , which)으로 한 문장을 쓰시오.\n\n[A] We adopted a puppy last spring.\n[B] 자유롭게 [B]를 작성하여 문장을 완성하시오.',
      'answer', E'We adopted a puppy last spring, which has become part of our family.',
      'similar_answers', jsonb_build_array(E'We adopted a puppy last spring, which has grown a lot since then.', E'We adopted a puppy last spring, which was the best decision we ever made.'),
      'explanation', E'선행사 a puppy(사물) 또는 앞 문장 전체 → which'
    ),
    jsonb_build_object(
      'number', 44,
      'question', E'[A]와 [B]를 연결하여 관계대명사의 계속적 용법(, who / , which)으로 한 문장을 쓰시오.\n\n[A] He sent me a long message.\n[B] It was really touching and made me cry.',
      'answer', E'He sent me a long message, which was really touching and made me cry.',
      'similar_answers', jsonb_build_array(E'He sent me a long message, which explained everything we needed to know.'),
      'explanation', E'선행사 a long message(사물) + which'
    ),
    jsonb_build_object(
      'number', 45,
      'question', E'[Part 5] 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nShe passed the audition, and it made her dream come true.\n→ She passed the audition, ________ made her dream come true.',
      'answer', E'which',
      'similar_answers', jsonb_build_array(),
      'explanation', E'and it → which (접속사+대명사 → 관계대명사)'
    ),
    jsonb_build_object(
      'number', 46,
      'question', E'두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nI respect my grandfather, for he devoted his life to education.\n→ I respect my grandfather, ________ devoted his life to education.',
      'answer', E'who',
      'similar_answers', jsonb_build_array(),
      'explanation', E'for he → who'
    ),
    jsonb_build_object(
      'number', 47,
      'question', E'두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nHe told me he would quit his job, but it was a lie.\n→ He told me he would quit his job, ________ was a lie.',
      'answer', E'which',
      'similar_answers', jsonb_build_array(),
      'explanation', E'but it → which'
    ),
    jsonb_build_object(
      'number', 48,
      'question', E'두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nShe scolded her son, and he burst into tears.\n→ She scolded her son, ________ burst into tears.',
      'answer', E'who',
      'similar_answers', jsonb_build_array(),
      'explanation', E'and he → who'
    ),
    jsonb_build_object(
      'number', 49,
      'question', E'두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nI bought a new phone, and it stopped working after two days.\n→ I bought a new phone, ________ stopped working after two days.',
      'answer', E'which',
      'similar_answers', jsonb_build_array(),
      'explanation', E'and it → which'
    ),
    jsonb_build_object(
      'number', 50,
      'question', E'두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nMy cat knocked over the vase, and it shattered on the floor.\n→ My cat knocked over the vase, ________ shattered on the floor.',
      'answer', E'which',
      'similar_answers', jsonb_build_array(E'and it'),
      'explanation', E'and it → which (관계대명사로 전환)'
    ),
    jsonb_build_object(
      'number', 51,
      'question', E'두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nWe don''t trust him, for he always breaks his promises.\n→ We don''t trust him, ________ always breaks his promises.',
      'answer', E'who',
      'similar_answers', jsonb_build_array(),
      'explanation', E'for he → who'
    ),
    jsonb_build_object(
      'number', 52,
      'question', E'두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nI scored full marks on the test, and it shocked even my teacher.\n→ I scored full marks on the test, ________ shocked even my teacher.',
      'answer', E'which',
      'similar_answers', jsonb_build_array(),
      'explanation', E'and it → which'
    ),
    jsonb_build_object(
      'number', 53,
      'question', E'두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nJenny ignored everyone at the party, which seemed rude to many guests.\n→ Jenny ignored everyone at the party, ________ seemed rude to many guests.',
      'answer', E'and it',
      'similar_answers', jsonb_build_array(E'and this', E'and that'),
      'explanation', E'which → and it (관계대명사 → 접속사+대명사)'
    ),
    jsonb_build_object(
      'number', 54,
      'question', E'두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nI visited my old school, but it had been completely rebuilt.\n→ I visited my old school, ________ had been completely rebuilt.',
      'answer', E'which',
      'similar_answers', jsonb_build_array(),
      'explanation', E'but it → which'
    ),
    jsonb_build_object(
      'number', 55,
      'question', E'두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nShe apologized sincerely, which finally calmed him down.\n→ She apologized sincerely, ________ finally calmed him down.',
      'answer', E'and it',
      'similar_answers', jsonb_build_array(E'and this', E'and that'),
      'explanation', E'which → and it (관계대명사 → 접속사+대명사)'
    ),
    jsonb_build_object(
      'number', 56,
      'question', E'두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nHe refused to help me, and it hurt my feelings deeply.\n→ He refused to help me, ________ hurt my feelings deeply.',
      'answer', E'which',
      'similar_answers', jsonb_build_array(),
      'explanation', E'and it → which'
    ),
    jsonb_build_object(
  'number', 57,
  'question', E'[Part 6] My uncle, ________ lives in Vancouver, is coming to visit us next month.',
  'options', jsonb_build_array(E'that', E'who', E'which', E'whom', E'whose'),
  'answer', E'2',
  'explanation', E'선행사 My uncle(사람) + 주격 → who. 계속적 용법에 that 불가.'
),
jsonb_build_object(
  'number', 58,
  'question', E'She won the gold medal, ________ made her whole family burst into tears.',
  'options', jsonb_build_array(E'who', E'that', E'what', E'which', E'it'),
  'answer', E'4',
  'explanation', E'앞 문장 전체를 선행사 → which'
),
jsonb_build_object(
  'number', 59,
  'question', E'I ran into my old classmate Junho, ________ is now a famous chef.',
  'options', jsonb_build_array(E'which', E'that', E'whose', E'whom', E'who'),
  'answer', E'5',
  'explanation', E'선행사 Junho(사람, 고유명사) + 주격 → who'
),
jsonb_build_object(
  'number', 60,
  'question', E'He announced his resignation, ________ shocked the entire company.',
  'options', jsonb_build_array(E'who', E'whom', E'which', E'that', E'what'),
  'answer', E'3',
  'explanation', E'앞 문장 전체를 선행사 → which'
),
jsonb_build_object(
  'number', 61,
  'question', E'다음 빈칸 (A), (B)에 들어갈 말로 바르게 짝지어진 것은?\n\n• We hired a new assistant, (A)________ is very efficient and organized.\n• She handed in her assignment early, (B)________ impressed the professor.',
  'options', jsonb_build_array(E'who – which', E'which – who', E'that – which', E'who – that', E'whose – which'),
  'answer', E'1',
  'explanation', E'(A) 사람 주격 → who, (B) 앞 문장 전체 → which'
),
jsonb_build_object(
  'number', 62,
  'question', E'다음 빈칸 (A), (B)에 들어갈 말로 바르게 짝지어진 것은?\n\n• I met the director of the film, (A)________ had won several international awards.\n• He introduced me to his sister, (B)________ studies architecture in Italy.',
  'options', jsonb_build_array(E'which – who', E'who – who', E'that – which', E'which – which', E'whose – which'),
  'answer', E'1',
  'explanation', E'(A) the film(사물)이 수상 → which, (B) his sister(사람) → who'
),
jsonb_build_object(
  'number', 63,
  'question', E'다음 중 어법상 올바른 문장을 <u>모두</u> 고르면? (정답 2개)',
  'options', jsonb_build_array(E'He bought a new guitar, that he played every night.', E'She moved to Jeju, which is famous for its beaches.', E'I talked to the nurse, whom was very kind to me.', E'My dog passed away last week, which broke my heart.', E'They loved the movie, what made them laugh and cry.'),
  'answer', E'2,4',
  'explanation', E'①that→which(계속적 용법에 that 불가), ③whom→who(주격), ⑤what→which(계속적 용법에 what 불가)'
),
jsonb_build_object(
  'number', 64,
  'question', E'다음 중 어법상 올바른 문장을 <u>모두</u> 고르면? (정답 2개)',
  'options', jsonb_build_array(E'I know a girl, which is great at painting.', E'He finished the project on time, which relieved everyone.', E'She has two sons, who are both engineers.', E'We visited the temple, that was built over 500 years ago.', E'He lied to me, whom made me very upset.'),
  'answer', E'2,3',
  'explanation', E'①which→who(사람), ④that→which(계속적 용법), ⑤whom→which(앞 문장 전체가 선행사)'
),
jsonb_build_object(
  'number', 65,
  'question', E'다음 우리말을 바르게 영작한 것은?\n나는 그 소식을 들었는데, 그것은 나를 매우 슬프게 했다.',
  'options', jsonb_build_array(E'I heard the news, that made me very sad.', E'I heard the news, what made me very sad.', E'I heard the news, who made me very sad.', E'I heard the news, which it made me very sad.', E'I heard the news, which made me very sad.'),
  'answer', E'5',
  'explanation', E'계속적 용법 — 사물 선행사 → which. that/what/who 불가, it 중복 불가.'
),
jsonb_build_object(
  'number', 66,
  'question', E'다음 중 빈칸에 들어갈 말이 나머지 넷과 다른 것은?',
  'options', jsonb_build_array(E'I met Professor Kim, ________ gave a brilliant lecture.', E'He introduced his mother, ________ used to be a ballet dancer.', E'She visited the museum, ________ has a famous collection of Korean art.', E'I ran into Jiwon, ________ I hadn''t seen for three years.', E'My aunt, ________ lives in New Zealand, called me yesterday.'),
  'answer', E'3',
  'explanation', E'③만 선행사가 사물(museum) → which, 나머지는 사람 → who/whom'
),
jsonb_build_object(
  'number', 67,
  'question', E'다음 대화의 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?\n\nA: Did you see Mr. Park at the event?\nB: Yes! I sat next to him. He''s the professor, (A)________ wrote that famous economics textbook.\nA: Really? And I met his daughter, (B)________ just started working at a tech company.',
  'options', jsonb_build_array(E'which – which', E'that – who', E'who – who', E'which – who', E'who – which'),
  'answer', E'3',
  'explanation', E'(A) Mr. Park/the professor(사람) → who, (B) his daughter(사람) → who'
),
jsonb_build_object(
  'number', 68,
  'question', E'다음 중 어법상 어색한 문장은?',
  'options', jsonb_build_array(E'She talked to the stranger, who smiled back at her.', E'I returned the book, which you lent me last month.', E'My sister, who is a nurse, works night shifts.', E'He missed the bus, that made him late for the meeting.', E'They canceled the trip, which disappointed us greatly.'),
  'answer', E'4',
  'explanation', E'④ that → which (계속적 용법에 that 사용 불가)'
),
jsonb_build_object(
  'number', 69,
  'question', E'다음 중 어법상 어색한 문장은?',
  'options', jsonb_build_array(E'Everybody loves Ms. Shin, who is always cheerful.', E'We booked the hotel, which it was right on the beach.', E'He told me he passed the exam, which was a relief.', E'The dog, which belongs to my neighbor, barks all night.', E'I helped an elderly woman, who thanked me warmly.'),
  'answer', E'2',
  'explanation', E'② which it → which (관계대명사절에 대명사 it 중복 불가)'
),
jsonb_build_object(
  'number', 70,
  'question', E'다음 중 어법상 올바른 문장을 <u>모두</u> 고르면? (정답 2개)',
  'options', jsonb_build_array(E'I presented my idea to the committee, that rejected it.', E'She donated her prize money to charity, which inspired many people.', E'The café, which it opened last month, is already very popular.', E'My teacher, whom trained me for three years, will retire next year.', E'He wrote a letter to his old friend, who hadn''t contacted him in years.'),
  'answer', E'2,5',
  'explanation', E'①that→which(계속적 용법), ③which it→which(it 중복), ④whom→who(주어 자리에는 주격 who)'
),
jsonb_build_object(
  'number', 71,
  'question', E'[Part 7] 다음 단어들을 알맞은 순서로 배열하여 문장을 완성하시오.\n\n나는 남동생이 하나 있는데, 그는 프로 게이머가 되고 싶어 한다.\n(a brother, I, who, professional gamer, have, wants to be, a)',
  'answer', E'I have a brother, who wants to be a professional gamer.',
  'similar_answers', jsonb_build_array(),
  'explanation', E'I have a brother(나는 남동생이 하나 있다) + , who wants to be a professional gamer(그는 프로 게이머가 되고 싶어 한다). 사람 선행사 → who.'
),
jsonb_build_object(
  'number', 72,
  'question', E'다음 단어들을 알맞은 순서로 배열하여 문장을 완성하시오.\n\n그녀는 그 소설을 다 읽었는데, 그것은 매우 감동적이었다.\n(she, the novel, finished, which, very moving, was)',
  'answer', E'She finished the novel, which was very moving.',
  'similar_answers', jsonb_build_array(),
  'explanation', E'She finished the novel(그녀는 소설을 다 읽었다) + , which was very moving(그것은 매우 감동적이었다). 사물 선행사 → which.'
),
jsonb_build_object(
  'number', 73,
  'question', E'다음 단어들을 알맞은 순서로 배열하여 문장을 완성하시오.\n\n그는 그 경기에서 졌는데, 그것이 그를 더 열심히 훈련하게 만들었다.\n(the match, him, he, which, lost, train, harder, made)',
  'answer', E'He lost the match, which made him train harder.',
  'similar_answers', jsonb_build_array(),
  'explanation', E'He lost the match(그는 경기에서 졌다) + , which made him train harder(그것이 그를 더 열심히 훈련하게 만들었다). 앞 문장 전체 선행사 → which.'
),
jsonb_build_object(
  'number', 74,
  'question', E'다음 단어들을 알맞은 순서로 배열하여 문장을 완성하시오.\n\n나의 사촌 Mia는 미국에 사는데, 이번 여름에 한국을 방문할 예정이다.\n(my cousin Mia, who, this summer, lives in the U.S., visit Korea, is planning to)',
  'answer', E'My cousin Mia, who lives in the U.S., is planning to visit Korea this summer.',
  'similar_answers', jsonb_build_array(E'My cousin Mia, who lives in the U.S., is planning to visit Korea this summer'),
  'explanation', E'My cousin Mia, who lives in the U.S.(미국에 사는 사촌 Mia) + is planning to visit Korea this summer(이번 여름에 한국 방문 예정). 삽입절 구조의 계속적 용법.'
),
jsonb_build_object(
  'number', 75,
  'question', E'다음 단어들을 알맞은 순서로 배열하여 문장을 완성하시오.\n\n서울을 방문하면 경복궁에 꼭 가야 하는데, 그곳은 조선 시대에 지어졌다.\nWhen you visit Seoul, _________________________.\n(Gyeongbokgung, during, was built, must, you, the Joseon Dynasty, visit, which)',
  'answer', E'When you visit Seoul, you must visit Gyeongbokgung, which was built during the Joseon Dynasty.',
  'similar_answers', jsonb_build_array(),
  'explanation', E'you must visit Gyeongbokgung(경복궁에 꼭 가야 한다) + , which was built during the Joseon Dynasty(그곳은 조선 시대에 지어졌다). 사물 선행사 → which.'
),
jsonb_build_object(
  'number', 76,
  'question', E'다음 단어들을 알맞은 순서로 배열하여 문장을 완성하시오.\n\n그들은 새 카페를 열었는데, 그것은 내 집 바로 앞에 있다.\n(opened, which, right, they, is, a new café, my house, in front of)',
  'answer', E'They opened a new café, which is right in front of my house.',
  'similar_answers', jsonb_build_array(E'They opened a new cafe, which is right in front of my house.'),
  'explanation', E'They opened a new café(새 카페를 열었다) + , which is right in front of my house(내 집 바로 앞에 있다). 사물 선행사 → which.'
),
jsonb_build_object(
  'number', 77,
  'question', E'다음 단어들을 알맞은 순서로 배열하여 문장을 완성하시오.\n\n나는 수학 선생님을 매우 좋아하는데, 그는 수업을 항상 재미있게 해주신다.\n(my math teacher, I, who, really like, always makes, class fun)',
  'answer', E'I really like my math teacher, who always makes class fun.',
  'similar_answers', jsonb_build_array(),
  'explanation', E'I really like my math teacher(수학 선생님을 매우 좋아한다) + , who always makes class fun(항상 수업을 재미있게 해주신다). 사람 선행사 → who.'
),
jsonb_build_object(
  'number', 78,
  'question', E'다음 단어들을 알맞은 순서로 배열하여 문장을 완성하시오.\n\n그녀는 그 시험에 불합격했는데, 그것은 그녀에게 큰 충격이었다.\n(the exam, she, which, failed, was, a big shock, to her)',
  'answer', E'She failed the exam, which was a big shock to her.',
  'similar_answers', jsonb_build_array(),
  'explanation', E'She failed the exam(시험에 불합격했다) + , which was a big shock to her(그녀에게 큰 충격이었다). 앞 문장 전체 선행사 → which.'
),
jsonb_build_object(
  'number', 79,
  'question', E'[Part 8] 다음 문장에서 어법상 틀린 부분을 찾아 고치시오.\n\nI met a writer, that published three novels this year.',
  'subParts', jsonb_build_array(
    jsonb_build_object('label', E'틀린 부분', 'answer', E'that', 'acceptedAnswers', jsonb_build_array(E'that')),
    jsonb_build_object('label', E'고친 표현', 'answer', E'who', 'acceptedAnswers', jsonb_build_array(E'who', E'which'))
  ),
  'answer', E'that / who',
  'explanation', E'계속적 용법에 that 불가 + 선행사가 사람(a writer) → who'
),
jsonb_build_object(
  'number', 80,
  'question', E'다음 문장에서 어법상 틀린 부분을 찾아 고치시오.\n\nShe told me about her trip, who was absolutely amazing.',
  'subParts', jsonb_build_array(
    jsonb_build_object('label', E'틀린 부분', 'answer', E'who', 'acceptedAnswers', jsonb_build_array(E'who')),
    jsonb_build_object('label', E'고친 표현', 'answer', E'which', 'acceptedAnswers', jsonb_build_array(E'which'))
  ),
  'answer', E'who / which',
  'explanation', E'선행사 her trip(사물) → which'
),
jsonb_build_object(
  'number', 81,
  'question', E'다음 문장에서 어법상 틀린 부분을 찾아 고치시오.\n\nMy best friend, which has lived abroad for five years, is finally coming back.',
  'subParts', jsonb_build_array(
    jsonb_build_object('label', E'틀린 부분', 'answer', E'which', 'acceptedAnswers', jsonb_build_array(E'which')),
    jsonb_build_object('label', E'고친 표현', 'answer', E'who', 'acceptedAnswers', jsonb_build_array(E'who'))
  ),
  'answer', E'which / who',
  'explanation', E'선행사 My best friend(사람) → who'
),
jsonb_build_object(
  'number', 82,
  'question', E'다음 문장에서 어법상 틀린 부분을 찾아 고치시오.\n\nHe ignored all my advice, whom really annoyed me.',
  'subParts', jsonb_build_array(
    jsonb_build_object('label', E'틀린 부분', 'answer', E'whom', 'acceptedAnswers', jsonb_build_array(E'whom')),
    jsonb_build_object('label', E'고친 표현', 'answer', E'which', 'acceptedAnswers', jsonb_build_array(E'which'))
  ),
  'answer', E'whom / which',
  'explanation', E'앞 문장 전체가 선행사 → which'
),
jsonb_build_object(
  'number', 83,
  'question', E'다음 문장에서 어법상 틀린 부분을 찾아 고치시오.\n\nThey offered me a promotion, what I wasn''t expecting at all.',
  'subParts', jsonb_build_array(
    jsonb_build_object('label', E'틀린 부분', 'answer', E'what', 'acceptedAnswers', jsonb_build_array(E'what')),
    jsonb_build_object('label', E'고친 표현', 'answer', E'which', 'acceptedAnswers', jsonb_build_array(E'which'))
  ),
  'answer', E'what / which',
  'explanation', E'계속적 용법에 what 사용 불가 → which'
),
jsonb_build_object(
  'number', 84,
  'question', E'다음 문장에서 어법상 틀린 부분을 찾아 고치시오.\n\nDr. Kim, who be a famous researcher, gave a lecture at our school.',
  'subParts', jsonb_build_array(
    jsonb_build_object('label', E'틀린 부분', 'answer', E'be', 'acceptedAnswers', jsonb_build_array(E'be')),
    jsonb_build_object('label', E'고친 표현', 'answer', E'is', 'acceptedAnswers', jsonb_build_array(E'is'))
  ),
  'answer', E'be / is',
  'explanation', E'동사 원형 be → 3인칭 단수 현재 is'
),
jsonb_build_object(
  'number', 85,
  'question', E'다음 문장에서 어법상 틀린 부분을 찾아 고치시오.\n\nShe won the championship, that surprised her coaches.',
  'subParts', jsonb_build_array(
    jsonb_build_object('label', E'틀린 부분', 'answer', E'that', 'acceptedAnswers', jsonb_build_array(E'that')),
    jsonb_build_object('label', E'고친 표현', 'answer', E'which', 'acceptedAnswers', jsonb_build_array(E'which'))
  ),
  'answer', E'that / which',
  'explanation', E'계속적 용법에 that 불가 → which'
),
jsonb_build_object(
  'number', 86,
  'question', E'다음 문장에서 어법상 틀린 부분을 찾아 고치시오.\n\nI enjoy talking to my grandfather, which always tells interesting stories.',
  'subParts', jsonb_build_array(
    jsonb_build_object('label', E'틀린 부분', 'answer', E'which', 'acceptedAnswers', jsonb_build_array(E'which')),
    jsonb_build_object('label', E'고친 표현', 'answer', E'who', 'acceptedAnswers', jsonb_build_array(E'who'))
  ),
  'answer', E'which / who',
  'explanation', E'선행사 my grandfather(사람) → who'
),
jsonb_build_object(
  'number', 87,
  'question', E'다음 문장에서 어법상 틀린 부분을 찾아 고치시오.\n\nHe returned the money he borrowed, which it meant a lot to me.',
  'subParts', jsonb_build_array(
    jsonb_build_object('label', E'틀린 부분', 'answer', E'which it', 'acceptedAnswers', jsonb_build_array(E'which it')),
    jsonb_build_object('label', E'고친 표현', 'answer', E'which', 'acceptedAnswers', jsonb_build_array(E'which'))
  ),
  'answer', E'which it / which',
  'explanation', E'관계대명사 which가 주어 역할 → it 중복 삭제'
),
jsonb_build_object(
  'number', 88,
  'question', E'다음 문장에서 어법상 틀린 부분을 찾아 고치시오.\n\nMy parents, who lives in the countryside, grow their own vegetables.',
  'subParts', jsonb_build_array(
    jsonb_build_object('label', E'틀린 부분', 'answer', E'lives', 'acceptedAnswers', jsonb_build_array(E'lives')),
    jsonb_build_object('label', E'고친 표현', 'answer', E'live', 'acceptedAnswers', jsonb_build_array(E'live'))
  ),
  'answer', E'lives / live',
  'explanation', E'선행사 My parents(복수) → 동사도 복수형 live'
),
jsonb_build_object(
  'number', 89,
  'question', E'다음 문장에서 어법상 틀린 부분을 찾아 고치시오.\n\nShe wrote a poem, that moved everyone in the audience to tears.',
  'subParts', jsonb_build_array(
    jsonb_build_object('label', E'틀린 부분', 'answer', E'that', 'acceptedAnswers', jsonb_build_array(E'that')),
    jsonb_build_object('label', E'고친 표현', 'answer', E'which', 'acceptedAnswers', jsonb_build_array(E'which'))
  ),
  'answer', E'that / which',
  'explanation', E'계속적 용법에 that 불가 → which'
),
jsonb_build_object(
  'number', 90,
  'question', E'다음 문장에서 어법상 틀린 부분을 찾아 고치시오.\n\nI looked up to Coach Lee, whom trained me for three years.',
  'subParts', jsonb_build_array(
    jsonb_build_object('label', E'틀린 부분', 'answer', E'whom', 'acceptedAnswers', jsonb_build_array(E'whom')),
    jsonb_build_object('label', E'고친 표현', 'answer', E'who', 'acceptedAnswers', jsonb_build_array(E'who'))
  ),
  'answer', E'whom / who',
  'explanation', E'관계사절에서 주어 자리 → 주격 who (whom은 목적격)'
),
jsonb_build_object(
  'number', 91,
  'question', E'[Part 9] 다음 우리말을 영작하시오.\n\n나는 새 이어폰을 샀는데, 그것은 이틀 만에 고장났다.\n(buy, break down)',
  'answer', E'I bought new earphones, which broke down after two days.',
  'similar_answers', jsonb_build_array(E'I bought new earphones, which broke down in two days.', E'I bought new earphones, which broke down after 2 days.'),
  'explanation', E'I bought new earphones(새 이어폰을 샀다) + , which broke down after two days(이틀 만에 고장났다). 사물 선행사 → which.'
),
jsonb_build_object(
  'number', 92,
  'question', E'다음 우리말을 영작하시오.\n\n우리 선생님은 항상 우리를 응원해 주시는데, 그분은 올해 퇴직하실 예정이다.\n(encourage, retire)',
  'answer', E'Our teacher, who always encourages us, is going to retire this year.',
  'similar_answers', jsonb_build_array(E'Our teacher, who always encourages us, will retire this year.', E'Our teacher, who always encourages us, is planning to retire this year.'),
  'explanation', E'Our teacher, who always encourages us(항상 우리를 응원해 주시는 선생님) + is going to retire this year(올해 퇴직 예정). 삽입절 구조의 계속적 용법.'
),
jsonb_build_object(
  'number', 93,
  'question', E'다음 우리말을 영작하시오.\n\n그는 아무 말도 하지 않았는데, 그것이 모두를 더욱 걱정하게 만들었다.\n(say anything, worry)',
  'answer', E'He didn''t say anything, which made everyone even more worried.',
  'similar_answers', jsonb_build_array(E'He did not say anything, which made everyone even more worried.', E'He didn''t say anything, which made everyone worry even more.'),
  'explanation', E'He didn''t say anything(아무 말도 하지 않았다) + , which made everyone even more worried(모두를 더욱 걱정하게 만들었다). 앞 문장 전체 선행사 → which.'
),
jsonb_build_object(
  'number', 94,
  'question', E'다음 우리말을 영작하시오.\n\n그녀는 봉사 활동에 참여했는데, 그것이 그녀의 인생관을 바꿔놓았다.\n(volunteer work, change, outlook on life)',
  'answer', E'She participated in volunteer work, which changed her outlook on life.',
  'similar_answers', jsonb_build_array(E'She took part in volunteer work, which changed her outlook on life.'),
  'explanation', E'She participated in volunteer work(봉사 활동에 참여했다) + , which changed her outlook on life(인생관을 바꿔놓았다). 앞 문장 전체 선행사 → which.'
),
jsonb_build_object(
  'number', 95,
  'question', E'다음 우리말을 영작하시오.\n\n우리 팀은 결승전에 진출했는데, 이것이 모든 팬들을 기쁘게 했다.\n(reach the final, please)',
  'answer', E'Our team reached the final, which pleased all the fans.',
  'similar_answers', jsonb_build_array(E'Our team reached the final, which pleased all of the fans.', E'Our team reached the finals, which pleased all the fans.'),
  'explanation', E'Our team reached the final(결승전에 진출했다) + , which pleased all the fans(모든 팬들을 기쁘게 했다). 앞 문장 전체 선행사 → which.'
),
jsonb_build_object(
  'number', 96,
  'question', E'■ [B] 대화문을 읽고 빈칸에 알맞은 관계대명사를 쓰시오.\n\nA: Have you met the new English teacher?\nB: Yes! She''s Ms. Bae, (A)________ just moved here from Busan. She gave us a really interesting project, (B)________ took us the whole weekend to finish.',
  'subParts', jsonb_build_array(
    jsonb_build_object('label', E'(A)', 'answer', E'who', 'acceptedAnswers', jsonb_build_array(E'who')),
    jsonb_build_object('label', E'(B)', 'answer', E'which', 'acceptedAnswers', jsonb_build_array(E'which'))
  ),
  'answer', E'who / which',
  'explanation', E'(A) Ms. Bae(사람) → who, (B) a really interesting project(사물) → which'
),
jsonb_build_object(
  'number', 97,
  'question', E'대화문을 읽고 빈칸에 알맞은 관계대명사를 쓰시오.\n\nA: How was the field trip yesterday?\nB: It was great! We visited the space center, (A)________ was way bigger than I expected. Our guide was Dr. Choi, (B)________ used to work for NASA.',
  'subParts', jsonb_build_array(
    jsonb_build_object('label', E'(A)', 'answer', E'which', 'acceptedAnswers', jsonb_build_array(E'which')),
    jsonb_build_object('label', E'(B)', 'answer', E'who', 'acceptedAnswers', jsonb_build_array(E'who'))
  ),
  'answer', E'which / who',
  'explanation', E'(A) the space center(사물) → which, (B) Dr. Choi(사람) → who'
),
jsonb_build_object(
  'number', 98,
  'question', E'대화문을 읽고 빈칸에 알맞은 관계대명사를 쓰시오.\n\nA: I heard you got into the school play!\nB: Yes! I got the lead role, (A)________ made me so nervous but happy. My drama teacher, (B)________ has been coaching me for two years, said she was proud of me.',
  'subParts', jsonb_build_array(
    jsonb_build_object('label', E'(A)', 'answer', E'which', 'acceptedAnswers', jsonb_build_array(E'which')),
    jsonb_build_object('label', E'(B)', 'answer', E'who', 'acceptedAnswers', jsonb_build_array(E'who'))
  ),
  'answer', E'which / who',
  'explanation', E'(A) 앞 문장 전체(lead role 획득) → which, (B) My drama teacher(사람) → who'
),
jsonb_build_object(
  'number', 99,
  'question', E'대화문을 읽고 빈칸에 알맞은 관계대명사를 쓰시오.\n\nA: Did you go to Jaeho''s party last Saturday?\nB: Yes! I met his older brother Hyunwoo, (A)________ is studying medicine in Seoul. He gave me some great advice about studying, (B)________ really helped me a lot.',
  'subParts', jsonb_build_array(
    jsonb_build_object('label', E'(A)', 'answer', E'who', 'acceptedAnswers', jsonb_build_array(E'who')),
    jsonb_build_object('label', E'(B)', 'answer', E'which', 'acceptedAnswers', jsonb_build_array(E'which'))
  ),
  'answer', E'who / which',
  'explanation', E'(A) Hyunwoo(사람) → who, (B) 앞 문장 전체(조언) → which'
),
jsonb_build_object(
  'number', 100,
  'question', E'대화문을 읽고 빈칸에 알맞은 관계대명사를 쓰시오.\n(A)에는 한정적 용법, (B)에는 계속적 용법 관계대명사를 쓰시오.\n\nA: What did you think of the book I recommended?\nB: I loved it! The main character is a woman (A)________ gives up everything to travel the world alone. The ending was a bit unexpected, (B)________ I honestly found quite refreshing.',
  'subParts', jsonb_build_array(
    jsonb_build_object('label', E'(A)', 'answer', E'who', 'acceptedAnswers', jsonb_build_array(E'who')),
    jsonb_build_object('label', E'(B)', 'answer', E'which', 'acceptedAnswers', jsonb_build_array(E'which'))
  ),
  'answer', E'who / which',
  'explanation', E'(A) a woman(사람) + 한정적 용법(콤마 없음) → who, (B) The ending(사물) + 계속적 용법(콤마 있음) → which'
)
  );

  a := jsonb_build_array(E'My grandfather, who is 80 years old, still goes jogging every morning.', E'Paris, which is the capital of France, is famous for the Eiffel Tower.', E'She called her best friend Amy, who lives in Busan.', E'The singer, whose voice is amazing, released a new album last week.', E'I watched the documentary, which was filmed in Antarctica.', E'Professor Han, who taught us biology, retired last semester.', E'He bought a new laptop, which turned out to have a defect.', E'My neighbor Mr. Choi, who has three cats, is a very quiet person.', E'She passed the final exam, which made her parents very proud.', E'Edison, who invented the light bulb, changed the world forever.', E'I called my old teacher, who remembered me at once.', E'We visited the science museum, which was closed for renovation.', E'My brother, who makes the best coffee I''ve ever tasted, runs a small café downtown.', E'She lent me her bicycle, which had a broken bell.', E'I decided to take the early bus, which arrived ten minutes late.', E'We met Dr. Yoon at the conference, who is an expert in climate science.', E'He apologized to me, which surprised everyone in the room.', E'I have a younger sister, who won first prize in a national art competition.', E'They moved to a new apartment last month, which is right next to the subway station.', E'My coach, who is known for his strict training style, encouraged me to keep practicing.', E'She forgot to bring her umbrella, which made her completely soaked in the rain.', E'The team won the championship three times in a row, which delighted all the fans.', E'I talked to a stranger on the train, who turned out to be my father''s old friend.', E'She donated all her savings to the shelter, which moved many people deeply.', E'2', E'1', E'1', E'2', E'1', E'1', E'2', E'1', E'2', E'2', E'I admire my science teacher, who explains everything we need to know.', E'We stayed at a small hotel, which was a very small but cozy place.', E'She introduced me to her cousin, who works as a marine biologist.', E'He submitted his report late, which upset his professor greatly.', E'I lost my house key, which turned out to be under my school bag.', E'They canceled the outdoor concert, which disappointed everyone who had bought tickets.', E'She received a scholarship, which covered all her tuition fees.', E'I read the novel twice, which was really touching and made me cry.', E'We adopted a puppy last spring, which has become part of our family.', E'He sent me a long message, which was really touching and made me cry.', E'which', E'who', E'which', E'who', E'which', E'which', E'who', E'which', E'and it', E'which', E'and it', E'which', E'2', E'4', E'5', E'3', E'1', E'1', E'2,4', E'2,3', E'5', E'3', E'3', E'4', E'2', E'2,5', E'I have a brother, who wants to be a professional gamer.', E'She finished the novel, which was very moving.', E'He lost the match, which made him train harder.', E'My cousin Mia, who lives in the U.S., is planning to visit Korea this summer.', E'When you visit Seoul, you must visit Gyeongbokgung, which was built during the Joseon Dynasty.', E'They opened a new café, which is right in front of my house.', E'I really like my math teacher, who always makes class fun.', E'She failed the exam, which was a big shock to her.', E'that', E'who', E'that / who', E'who', E'which', E'who / which', E'which', E'who', E'which / who', E'whom', E'which', E'whom / which', E'what', E'which', E'what / which', E'be', E'is', E'be / is', E'that', E'which', E'that / which', E'which', E'who', E'which / who', E'which it', E'which', E'which it / which', E'lives', E'live', E'lives / live', E'that', E'which', E'that / which', E'whom', E'who', E'whom / who', E'I bought new earphones, which broke down after two days.', E'Our teacher, who always encourages us, is going to retire this year.', E'He didn''t say anything, which made everyone even more worried.', E'She participated in volunteer work, which changed her outlook on life.', E'Our team reached the final, which pleased all the fans.', E'who', E'which', E'who / which', E'which', E'who', E'which / who', E'which', E'who', E'which / who', E'who', E'which', E'who / which', E'who', E'which', E'who / which');

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES (
    '관계대명사의 계속적 용법 Step 1 (서술형·객관식 100문항)',
    '관계대명사의 계속적 용법',
    q,
    a,
    'problem',
    'interactive'
  );
END $$;
