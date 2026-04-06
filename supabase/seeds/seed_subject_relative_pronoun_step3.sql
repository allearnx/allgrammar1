DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = '주격관계대명사 Step3';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- Part 1: 빈칸에 관계대명사 쓰기 (Q1~Q8)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1,
      'question',E'다음 빈칸에 알맞은 관계대명사를 쓰시오.\n\nThe woman ___ lives across the street is a nurse.',
      'answer','who'),

    jsonb_build_object('number',2,
      'question',E'다음 빈칸에 알맞은 관계대명사를 쓰시오.\n\nI found a wallet ___ was lying on the sidewalk.',
      'answer','which'),

    jsonb_build_object('number',3,
      'question',E'다음 빈칸에 알맞은 관계대명사를 쓰시오.\n\nThe children ___ are running in the park look happy.',
      'answer','who'),

    jsonb_build_object('number',4,
      'question',E'다음 빈칸에 알맞은 관계대명사를 쓰시오.\n\nShe bought a backpack ___ has many pockets.',
      'answer','which'),

    jsonb_build_object('number',5,
      'question',E'다음 두 문장의 빈칸에 공통으로 들어갈 관계대명사를 쓰시오.\n\n• The singer ___ performed last night was amazing.\n• I have a cousin ___ works at a hospital.',
      'answer','who'),

    jsonb_build_object('number',6,
      'question',E'다음 빈칸에 알맞은 관계대명사를 쓰시오.\n(단, that은 제외할 것)\n\n그녀의 남동생은 축구를 잘하는 소년이다.\nHer brother is a boy ___ plays soccer well.',
      'answer','who'),

    jsonb_build_object('number',7,
      'question',E'다음 빈칸에 알맞은 관계대명사를 쓰시오.\n(단, that은 제외할 것)\n\n나는 아름다운 정원이 있는 집에 살고 싶다.\nI want to live in a house ___ has a beautiful garden.',
      'answer','which'),

    jsonb_build_object('number',8,
      'question',E'다음 대화의 빈칸에 알맞은 관계대명사를 쓰시오.\n\nA: Do you know that tall man over there?\nB: Yes. He is the coach ___ trained our basketball team.',
      'answer','who'),

    -- ═══════════════════════════════════════════
    -- Part 2: 두 문장 → 한 문장 합치기 (Q9~Q18)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',9,
      'question',E'다음 두 문장을 관계대명사를 사용하여 한 문장으로 합치시오.\n\nShe adopted a cat. The cat has blue eyes.',
      'answer','She adopted a cat which has blue eyes.'),

    jsonb_build_object('number',10,
      'question',E'다음 두 문장을 관계대명사를 사용하여 한 문장으로 합치시오.\n\nI met a firefighter. He saved three children.',
      'answer','I met a firefighter who saved three children.'),

    jsonb_build_object('number',11,
      'question',E'다음 두 문장을 관계대명사를 사용하여 한 문장으로 합치시오.\n\nWe visited a museum. It has many dinosaur fossils.',
      'answer','We visited a museum which has many dinosaur fossils.'),

    jsonb_build_object('number',12,
      'question',E'다음 두 문장을 관계대명사를 사용하여 한 문장으로 합치시오.\n\nThe chef is very famous. He works at that Italian restaurant.',
      'answer','The chef who works at that Italian restaurant is very famous.'),

    jsonb_build_object('number',13,
      'question',E'다음 두 문장을 관계대명사를 사용하여 한 문장으로 합치시오.\n\nThe nurse is my neighbor. She is wearing a white uniform.',
      'answer','The nurse who is wearing a white uniform is my neighbor.'),

    jsonb_build_object('number',14,
      'question',E'다음 두 문장을 관계대명사를 사용하여 한 문장으로 합치시오.\n(단, that은 제외할 것)\n\nHe wants to read the novel. The novel won an award.',
      'answer','He wants to read the novel which won an award.'),

    jsonb_build_object('number',15,
      'question',E'다음 두 문장을 관계대명사를 사용하여 한 문장으로 합치시오.\n(단, that은 제외할 것)\n\nMy uncle is a pilot. He flies to Europe every week.',
      'answer','My uncle is a pilot who flies to Europe every week.'),

    jsonb_build_object('number',16,
      'question',E'다음 <보기>와 같이 두 문장을 관계대명사를 사용하여 한 문장으로 합치시오.\n\n<보기>\nI know a boy. He can swim very fast.\n→ I know a boy who can swim very fast.\n\n(1) She has a parrot. It can say ten words.\n→ ___\n\n(2) We met a scientist. She discovered a new star.\n→ ___\n\n(3) There is a bridge. It connects the two islands.\n→ ___',
      'answer','(1) She has a parrot which can say ten words. (2) We met a scientist who discovered a new star. (3) There is a bridge which connects the two islands.'),

    jsonb_build_object('number',17,
      'question',E'다음 두 문장을 관계대명사를 사용하여 한 문장으로 합치시오.\n\n(1) My grandmother is very healthy. She exercises every morning.\n→ ___\n\n(2) He bought a drone. It can take pictures from the sky.\n→ ___',
      'answer','(1) My grandmother who exercises every morning is very healthy. (2) He bought a drone which can take pictures from the sky.'),

    jsonb_build_object('number',18,
      'question',E'다음 두 문장을 관계대명사를 사용하여 한 문장으로 합치시오.\n\nLook at the bicycle. It is parked near the gate.',
      'answer','Look at the bicycle which is parked near the gate.'),

    -- ═══════════════════════════════════════════
    -- Part 3: 두 문장 합치기 — 빈칸 형태 (Q19~Q26)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',19,
      'question',E'다음 두 문장을 한 문장으로 합칠 때, 빈칸에 알맞은 말을 쓰시오.\n\nI want to visit the country. It is famous for its food.\n→ I want to visit the country ___ ___ ___ ___ ___ ___.',
      'answer','which is famous for its food'),

    jsonb_build_object('number',20,
      'question',E'다음 두 문장을 한 문장으로 합칠 때, 빈칸에 알맞은 말을 쓰시오.\n\nThe student won first prize. He studied the hardest.\n→ The student ___ ___ ___ ___ won first prize.',
      'answer','who studied the hardest'),

    jsonb_build_object('number',21,
      'question',E'다음 두 문장을 합쳐서 빈칸을 완성하시오.\n\nI saw a girl. She was singing on the stage.\n→ I saw a girl ___ ___ ___ on the stage.',
      'answer','who was singing'),

    jsonb_build_object('number',22,
      'question',E'다음 두 문장을 합쳐서 빈칸을 완성하시오.\n\nA train stopped at the station. It came from Busan.\n→ The train ___ ___ ___ ___ stopped at the station.',
      'answer','which came from Busan'),

    jsonb_build_object('number',23,
      'question',E'다음 두 문장을 합쳐서 빈칸을 완성하시오.\n\nA boy helped me yesterday. He lives across the street.\n→ The boy ___ ___ ___ ___ ___ helped me yesterday.',
      'answer','who lives across the street'),

    jsonb_build_object('number',24,
      'question',E'다음 두 문장을 합쳐서 빈칸을 완성하시오.\n\nA laptop broke down. It was only two months old.\n→ The laptop ___ ___ ___ was only two months old.',
      'answer','which broke down'),

    jsonb_build_object('number',25,
      'question',E'다음 두 문장을 합쳐서 빈칸을 완성하시오.\n\n(1) An old man sat on the bench. He was reading a newspaper.\n→ An old man ___ ___ ___ ___ ___ sat on the bench.\n\n(2) She bought a dress. It was on sale.\n→ She bought a dress ___ ___ ___ ___.\n\n(3) I know the students. They won the science competition.\n→ I know the students ___ ___ ___ ___ ___.',
      'answer','(1) who was reading a newspaper (2) which was on sale (3) who won the science competition'),

    jsonb_build_object('number',26,
      'question',E'다음 두 문장을 합쳐서 빈칸을 완성하시오.\n\nEmma was staying with her grandmother. She has a lovely garden in the countryside.\n→ Emma was staying with her grandmother ___ ___ ___ ___ ___ ___ ___ ___.',
      'answer','who has a lovely garden in the countryside'),

    -- ═══════════════════════════════════════════
    -- Part 4: 의미 동일 변환 + 오류 수정 (Q27~Q32)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',27,
      'question',E'다음 두 문장의 의미가 같도록 빈칸에 알맞은 말을 쓰시오.\n\nDon''t touch the boiling water.\n= Don''t touch the water ___ ___ ___.',
      'answer','which is boiling'),

    jsonb_build_object('number',28,
      'question',E'다음 두 문장의 의미가 같도록 빈칸에 알맞은 말을 쓰시오.\n\nThe boy standing by the door is my cousin.\n= The boy ___ ___ ___ by the door is my cousin.',
      'answer','who is standing'),

    jsonb_build_object('number',29,
      'question',E'다음 두 문장의 의미가 같도록 빈칸에 알맞은 말을 쓰시오.\n\nLook at the falling leaves.\n= Look at the leaves ___ ___ ___.',
      'answer','which are falling'),

    jsonb_build_object('number',30,
      'question',E'다음 문장에서 어법상 틀린 부분을 찾아 바르게 고쳐 쓰시오.\n\nThe man lives next door is very friendly.\n→ ___',
      'answer','The man who lives next door is very friendly.'),

    jsonb_build_object('number',31,
      'question',E'다음 문장에서 어법상 틀린 부분을 찾아 바르게 고쳐 쓰시오.\n\nShe adopted a cat which were lost in the park.\n→ ___',
      'answer','She adopted a cat which was lost in the park.'),

    jsonb_build_object('number',32,
      'question',E'다음 문장에서 어법상 틀린 부분을 찾아 바르게 고쳐 쓰시오.\n\nI have a brother which works at a hospital.\n→ ___',
      'answer','I have a brother who works at a hospital.'),

    -- ═══════════════════════════════════════════
    -- Part 5: 단어 배열 (Q33~Q38)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',33,
      'question',E'다음 주어진 단어를 배열하여 문장을 완성하시오.\n※ 관계대명사를 추가하여 완성할 것\n\nA nurse ___.\n(sick / is / people / of / takes / someone / care)',
      'answer','A nurse is someone who takes care of sick people.'),

    jsonb_build_object('number',34,
      'question',E'다음 주어진 단어를 배열하여 문장을 완성하시오.\n※ 관계대명사를 추가하여 완성할 것\n\nA dolphin ___.\n(in / an animal / the ocean / is / swims)',
      'answer','A dolphin is an animal which swims in the ocean.'),

    jsonb_build_object('number',35,
      'question',E'다음 주어진 단어를 배열하여 문장을 완성하시오.\n※ 관계대명사를 추가하여 완성할 것\n\nA firefighter ___.\n(a person / puts out / is / fires)',
      'answer','A firefighter is a person who puts out fires.'),

    jsonb_build_object('number',36,
      'question',E'다음 우리말과 같도록 괄호 안의 단어를 바르게 배열하시오.\n\n안경을 쓰고 있는 그 남자는 나의 삼촌이다.\n(glasses / the man / wearing / is / is / my uncle)',
      'answer','The man who is wearing glasses is my uncle.'),

    jsonb_build_object('number',37,
      'question',E'다음 우리말과 같도록 괄호 안의 단어를 바르게 배열하시오.\n\n큰 날개를 가진 그 새는 독수리이다.\n(big wings / the bird / has / which / an eagle / is)',
      'answer','The bird which has big wings is an eagle.'),

    jsonb_build_object('number',38,
      'question',E'다음 대화가 자연스럽도록 괄호 안에 주어진 단어를 배열하여 문장을 완성하시오.\n\nA: What kind of friend do you want?\nB: ___.\n(a friend / honest / I / is / want)',
      'answer','I want a friend who is honest.'),

    -- ═══════════════════════════════════════════
    -- Part 6: 정의·매칭·표·목록 완성 (Q39~Q48)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',39,
      'question',E'다음 A와 B를 연결하여 관계대명사 who 또는 which를 사용한 완전한 문장을 쓰시오.\n\n| A | B |\n| (1) A vet | (a) delivers letters and packages |\n| (2) A pilot | (b) takes care of sick animals |\n| (3) A mail carrier | (c) flies airplanes |\n| (4) A librarian | (d) helps people find books |\n\n(1) A vet is ___.\n(2) A pilot is ___.\n(3) A mail carrier is ___.\n(4) A librarian is ___.',
      'answer','(1) a person who takes care of sick animals (2) a person who flies airplanes (3) a person who delivers letters and packages (4) a person who helps people find books'),

    jsonb_build_object('number',40,
      'question',E'다음 표를 보고, 관계대명사를 사용하여 빈칸을 완성하시오.\n\n| Person | Achievement |\n| Thomas Edison | invented the light bulb |\n| William Shakespeare | wrote famous plays |\n| Beethoven | composed great music |\n\n(1) Thomas Edison was an inventor ___ ___ ___ ___ ___.\n(2) William Shakespeare was a writer ___ ___ ___ ___.\n(3) Beethoven was a musician ___ ___ ___ ___.',
      'answer','(1) who invented the light bulb (2) who wrote famous plays (3) who composed great music'),

    jsonb_build_object('number',41,
      'question',E'다음에 주어진 단어를 이용하여 직업을 정의하는 문장을 완성하시오.\n\nteacher (educate / students at school)\n→ ___',
      'answer','A teacher is a person who educates students at school.'),

    jsonb_build_object('number',42,
      'question',E'다음에 주어진 단어를 이용하여 직업을 정의하는 문장을 완성하시오.\n\nchef (prepare / delicious meals)\n→ ___',
      'answer','A chef is a person who prepares delicious meals.'),

    jsonb_build_object('number',43,
      'question',E'다음 <보기>에서 알맞은 표현을 골라 관계대명사를 사용하여 빈칸을 완성하시오.\n\n<보기>\nⓐ she writes popular songs\nⓑ it tells the time\nⓒ he grows vegetables on a farm\nⓓ it keeps your food cold\nⓔ she designs buildings\n\n(1) A clock is a device ___ ___ ___ ___.\n(2) The man is a farmer ___ ___ ___ ___ ___ ___.\n(3) I like the singer ___ ___ ___ ___.\n(4) A refrigerator is a machine ___ ___ ___ ___ ___.',
      'answer','(1) which tells the time (2) who grows vegetables on a farm (3) who writes popular songs (4) which keeps your food cold'),

    jsonb_build_object('number',44,
      'question',E'다음 주어진 표현을 이용하여 관계대명사가 포함된 완전한 문장을 쓰시오.\n\n(1) boy / always tells jokes\n→ Look at that boy! That is the ___ ___ ___ ___ ___.\n\n(2) girl / speaks three languages\n→ She is amazing! That is the ___ ___ ___ ___ ___.',
      'answer','(1) boy who always tells jokes (2) girl who speaks three languages'),

    jsonb_build_object('number',45,
      'question',E'다음 주어진 표현을 이용하여 관계대명사가 포함된 완전한 문장을 쓰시오.\n\n(1) robot / can clean the house\n→ My dad bought a ___ ___ ___ ___ ___ ___.\n\n(2) app / helps you learn English\n→ I downloaded an ___ ___ ___ ___ ___ ___.',
      'answer','(1) robot which can clean the house (2) app which helps you learn English'),

    jsonb_build_object('number',46,
      'question',E'다음 표를 보고, 관계대명사를 사용하여 빈칸을 완성하시오.\n\n| Name | What they do |\n| My sister | paints beautiful pictures |\n| Mr. Kim | fixes broken computers |\n| Jimin | volunteers at an animal shelter |\n\n(1) My sister is a girl ___ ___ ___ ___.\n(2) Mr. Kim is a man ___ ___ ___ ___.\n(3) Jimin is a student ___ ___ ___ ___ ___ ___.',
      'answer','(1) who paints beautiful pictures (2) who fixes broken computers (3) who volunteers at an animal shelter'),

    jsonb_build_object('number',47,
      'question',E'다음에 주어진 단어를 이용하여 관계대명사 who 또는 which를 사용한 정의 문장을 쓰시오.\n\n(1) dictionary (book / contain / many words and their meanings)\n→ ___\n\n(2) astronaut (person / travel / into space)\n→ ___',
      'answer','(1) A dictionary is a book which contains many words and their meanings. (2) An astronaut is a person who travels into space.'),

    jsonb_build_object('number',48,
      'question',E'다음에 주어진 단어를 이용하여 관계대명사 who 또는 which를 사용한 정의 문장을 쓰시오.\n\n(1) smartphone (device / connect / people around the world)\n→ ___\n\n(2) dentist (person / take care of / your teeth)\n→ ___',
      'answer','(1) A smartphone is a device which connects people around the world. (2) A dentist is a person who takes care of your teeth.'),

    -- ═══════════════════════════════════════════
    -- Part 7: 한→영 서술 (Q49~Q56)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',49,
      'question',E'다음 우리말을 관계대명사를 사용하여 영작하시오.\n(단, that은 제외할 것)\n\n기타를 치고 있는 한 소녀가 있다.\n→ There ___ ___ ___ ___ ___ ___ ___ ___.',
      'answer','is a girl who is playing the guitar'),

    jsonb_build_object('number',50,
      'question',E'다음 우리말을 관계대명사를 사용하여 영작하시오.\n(단, that은 제외할 것)\n\n나무 위에 앉아 있는 새 한 마리가 있다.\n→ There ___ ___ ___ ___ ___ ___ ___ ___ ___.',
      'answer','is a bird which is sitting on the tree'),

    jsonb_build_object('number',51,
      'question',E'다음 우리말을 관계대명사를 사용하여 영작하시오.\n(단, that은 제외할 것)\n\n그녀는 여러 나라를 여행하는 친구가 있다.\n→ She has ___ ___ ___ ___ ___ ___ ___.',
      'answer','a friend who travels to many countries'),

    jsonb_build_object('number',52,
      'question',E'다음 우리말을 관계대명사를 사용하여 영작하시오.\n(단, that은 제외할 것)\n\n우리는 매우 빠르게 달리는 자동차를 보았다.\n→ We saw ___ ___ ___ ___ ___ ___.',
      'answer','a car which runs very fast'),

    jsonb_build_object('number',53,
      'question',E'다음 우리말과 주어진 단어를 이용하여 빈칸을 완성하시오.\n\n화가는 그림을 그리는 사람이다. (draw)\n→ A painter is a person ___ ___ pictures.',
      'answer','who draws'),

    jsonb_build_object('number',54,
      'question',E'다음 우리말과 주어진 단어를 이용하여 빈칸을 완성하시오.\n\n소방관은 불을 끄는 사람이다. (put out)\n→ A firefighter is someone ___ ___ ___ fires.',
      'answer','who puts out'),

    jsonb_build_object('number',55,
      'question',E'다음 우리말을 관계대명사를 사용하여 영작하시오.\n(단, that은 제외할 것)\n\n(1) 나에게 영어를 가르쳐 주는 선생님은 매우 친절하다.\n→ The teacher ___ ___ ___ ___ ___ ___ ___.\n\n(2) 지붕이 빨간 그 집은 우리 할머니 집이다.\n→ The house ___ ___ ___ ___ ___ is my grandmother''s house.',
      'answer','(1) who teaches me English is very kind (2) which has a red roof'),

    jsonb_build_object('number',56,
      'question',E'다음 우리말과 괄호 안에 주어진 단어를 이용하여 빈칸을 완성하시오.\n\n(1) 비가 많이 오는 계절이 있다. (which, bring)\n→ There is a season ___ ___ a lot of rain.\n\n(2) 우리 이웃에 매일 조깅하는 할아버지가 계신다. (who, jog)\n→ There is an old man in our neighborhood ___ ___ every day.',
      'answer','(1) which brings (2) who jogs'),

    -- ═══════════════════════════════════════════
    -- Part 8: 조건 영작 (Q57~Q60)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',57,
      'question',E'다음 조건에 맞게 영어 문장을 완성하시오.\n\n<조건>\n1. 관계대명사를 이용할 것 (that 제외)\n2. 단어 hospital, someone을 반드시 사용할 것\n3. 9단어로 된 완벽한 문장일 것\n\n의미: 간호사는 병원에서 일하는 사람이다.\n→ ___',
      'answer','A nurse is someone who works at a hospital.'),

    jsonb_build_object('number',58,
      'question',E'다음 조건에 맞게 영어 문장을 완성하시오.\n\n<조건>\n총 11단어 중 want / lives / I / a / near / friend / who 를 반드시 사용할 것\n\n의미: 나는 우리 학교 근처에 사는 친구를 사귀고 싶다.\n→ ___',
      'answer','I want to make a friend who lives near our school.'),

    jsonb_build_object('number',59,
      'question',E'다음 상황을 읽고, 조건에 맞게 영어 문장을 쓰시오.\n\n<상황>\n너의 반에 새로 전학 온 학생이 있다. 그 학생은 피아노를 아주 잘 친다. 이 학생에 대해 친구에게 소개하는 문장을 써라.\n\n<조건>\n1. 관계대명사를 반드시 사용할 것 (that 제외)\n2. new student, play, piano를 포함할 것\n3. 10단어 이상의 완전한 문장으로 쓸 것\n\n→ ___',
      'answer','The new student is a girl who plays the piano very well.'),

    jsonb_build_object('number',60,
      'question',E'다음 우리말을 조건에 맞게 영작하시오.\n\n<조건>\n관계대명사를 반드시 사용할 것 (that 제외)\n완전한 문장으로 쓸 것\n\n(1) 사진을 잘 찍는 한 소년이 있다.\n(필수 단어: boy, take, pictures)\n→ ___\n\n(2) 나는 날 수 있는 로봇을 만들고 싶다.\n(필수 단어: robot, fly, want)\n→ ___',
      'answer','(1) There is a boy who takes pictures well. (2) I want to make a robot which can fly.')
  );

  a := jsonb_build_array(
    'who','which','who','which','who','who','which','who',
    'She adopted a cat which has blue eyes.',
    'I met a firefighter who saved three children.',
    'We visited a museum which has many dinosaur fossils.',
    'The chef who works at that Italian restaurant is very famous.',
    'The nurse who is wearing a white uniform is my neighbor.',
    'He wants to read the novel which won an award.',
    'My uncle is a pilot who flies to Europe every week.',
    '(1) She has a parrot which can say ten words. (2) We met a scientist who discovered a new star. (3) There is a bridge which connects the two islands.',
    '(1) My grandmother who exercises every morning is very healthy. (2) He bought a drone which can take pictures from the sky.',
    'Look at the bicycle which is parked near the gate.',
    'which is famous for its food',
    'who studied the hardest',
    'who was singing',
    'which came from Busan',
    'who lives across the street',
    'which broke down',
    '(1) who was reading a newspaper (2) which was on sale (3) who won the science competition',
    'who has a lovely garden in the countryside',
    'which is boiling',
    'who is standing',
    'which are falling',
    'The man who lives next door is very friendly.',
    'She adopted a cat which was lost in the park.',
    'I have a brother who works at a hospital.',
    'A nurse is someone who takes care of sick people.',
    'A dolphin is an animal which swims in the ocean.',
    'A firefighter is a person who puts out fires.',
    'The man who is wearing glasses is my uncle.',
    'The bird which has big wings is an eagle.',
    'I want a friend who is honest.',
    '(1) a person who takes care of sick animals (2) a person who flies airplanes (3) a person who delivers letters and packages (4) a person who helps people find books',
    '(1) who invented the light bulb (2) who wrote famous plays (3) who composed great music',
    'A teacher is a person who educates students at school.',
    'A chef is a person who prepares delicious meals.',
    '(1) which tells the time (2) who grows vegetables on a farm (3) who writes popular songs (4) which keeps your food cold',
    '(1) boy who always tells jokes (2) girl who speaks three languages',
    '(1) robot which can clean the house (2) app which helps you learn English',
    '(1) who paints beautiful pictures (2) who fixes broken computers (3) who volunteers at an animal shelter',
    '(1) A dictionary is a book which contains many words and their meanings. (2) An astronaut is a person who travels into space.',
    '(1) A smartphone is a device which connects people around the world. (2) A dentist is a person who takes care of your teeth.',
    'is a girl who is playing the guitar',
    'is a bird which is sitting on the tree',
    'a friend who travels to many countries',
    'a car which runs very fast',
    'who draws',
    'who puts out',
    '(1) who teaches me English is very kind (2) which has a red roof',
    '(1) which brings (2) who jogs',
    'A nurse is someone who works at a hospital.',
    'I want to make a friend who lives near our school.',
    'The new student is a girl who plays the piano very well.',
    '(1) There is a boy who takes pictures well. (2) I want to make a robot which can fly.'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('주격관계대명사 Step3', '주격관계대명사', q, a, 'problem', 'interactive');

  RAISE NOTICE '주격관계대명사 Step3 템플릿 생성 완료 (60문제, 서술형, paraphrased)';
END;
$$;
