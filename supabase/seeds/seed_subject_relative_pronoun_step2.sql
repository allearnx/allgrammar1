DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = '주격관계대명사 Step2';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- Part 1: 빈칸 - 관계대명사 고르기 (Q1~Q10)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1,
      'question',E'다음 빈칸에 들어갈 말로 알맞은 것은?\n\nThis is the museum ___ opens at 10 every day.',
      'options',jsonb_build_array('who','which','when','whom','where'),
      'answer','2'),

    jsonb_build_object('number',2,
      'question',E'다음 문장의 빈칸에 들어갈 말로 적절하지 않은 것은?\n\nShe has ___ which can do many tricks.',
      'options',jsonb_build_array('a brother','a parrot','a robot','a puppy','a toy car'),
      'answer','1'),

    jsonb_build_object('number',3,
      'question',E'다음 문장의 빈칸에 들어갈 말로 가장 적절한 것은?\n\nHe has ___ who teaches math at a university.',
      'options',jsonb_build_array('a computer','a book','some dogs','a bicycle','an older sister'),
      'answer','5'),

    jsonb_build_object('number',4,
      'question',E'다음 대화의 빈칸에 들어갈 말로 알맞은 것은?\n\nA: Who was Marie Curie?\nB: She was a famous scientist ___ discovered radium.',
      'options',jsonb_build_array('what','whom','whose','which','who'),
      'answer','5'),

    jsonb_build_object('number',5,
      'question',E'다음 문장의 빈칸에 들어갈 말로 가장 적절한 것은?\n\nShe has a cat that ___ very quietly.',
      'options',jsonb_build_array('walk','to walk','is walk','walks','walking'),
      'answer','4'),

    jsonb_build_object('number',6,
      'question',E'다음 빈칸에 들어갈 말로 가장 알맞은 것은?\n\nIt is a great program for students ___ want to study abroad.',
      'options',jsonb_build_array('whose','which','whom','who','what'),
      'answer','4'),

    jsonb_build_object('number',7,
      'question',E'다음 문장의 빈칸에 생략된 표현으로 가장 적절한 것은?\n\nShe wants to hire the workers ___ experienced in coding.',
      'options',jsonb_build_array('who is','who are','which is','which are','that is'),
      'answer','2'),

    jsonb_build_object('number',8,
      'question',E'다음 빈칸에 들어갈 말로 가장 알맞은 것은?\n\nThere is a boy who ___ to join our team.',
      'options',jsonb_build_array('want','wants','have wanted','wanting','to want'),
      'answer','2'),

    jsonb_build_object('number',9,
      'question',E'다음 중 밑줄 친 부분과 바꿔 쓸 수 있는 것은?\n\nShe is the teacher that inspired many students.',
      'options',jsonb_build_array('who','which','whose','of which','what'),
      'answer','1'),

    jsonb_build_object('number',10,
      'question',E'다음 빈칸 ⓐ와 ⓑ에 공통으로 들어갈 말로 알맞은 것은?\n\n• I have a cousin ⓐ___ speaks three languages.\n• This is the laptop ⓑ___ has a large screen.',
      'options',jsonb_build_array('who','whom','which','whose','that'),
      'answer','5'),

    -- ═══════════════════════════════════════════
    -- Part 2: 공통 빈칸 / 짝짓기 (Q11~Q20)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',11,
      'question',E'다음 빈칸에 공통으로 들어갈 말로 가장 적절한 것은?\n\n• She knows many artists ___ paint murals.\n• I need a phone ___ has a good camera.\n• There is a nurse ___ works at this clinic.',
      'options',jsonb_build_array('that','who','which','whom','whose'),
      'answer','1'),

    jsonb_build_object('number',12,
      'question',E'다음 빈칸에 공통으로 들어갈 말로 가장 적절한 것은?\n\n• The river ___ runs through the city is beautiful.\n• This is the laptop ___ was on sale yesterday.',
      'options',jsonb_build_array('who','which','whom','what','whose'),
      'answer','2'),

    jsonb_build_object('number',13,
      'question',E'다음 모든 빈칸에 공통으로 들어갈 말로 가장 적절한 것은?\n\n• I met a woman ___ speaks Italian fluently.\n• He has neighbors ___ are very friendly.\n• She lives in a town ___ has a famous castle.',
      'options',jsonb_build_array('who','that','which','whose','what'),
      'answer','2'),

    jsonb_build_object('number',14,
      'question',E'다음 문장의 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?\n\n• I see the girl (A)___ is dancing on the stage.\n• He found a wallet (B)___ was lying on the ground.\n\n     (A)     (B)',
      'options',jsonb_build_array('who — who','who — which','which — who','which — which','whom — which'),
      'answer','2'),

    jsonb_build_object('number',15,
      'question',E'다음 중 빈칸에 들어갈 말이 차례대로 짝지어진 것은?\n\n• There are many tourists ___ visit this temple.\n• I know a café ___ serves great coffee.',
      'options',jsonb_build_array('who — whose','who — which','whom — who','whom — which','which — which'),
      'answer','2'),

    jsonb_build_object('number',16,
      'question',E'다음 문장의 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?\n\n• Can you see the bird (A)___ is sitting on the fence?\n• He is the doctor (B)___ saved her life.\n\n     (A)     (B)',
      'options',jsonb_build_array('that — which','that — whom','which — which','which — who','who — which'),
      'answer','4'),

    jsonb_build_object('number',17,
      'question',E'다음 문장의 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?\n\n• Look at the boy and the dog (A)___ are playing in the park.\n• My mom bought me this jacket (B)___ is waterproof.\n\n     (A)     (B)',
      'options',jsonb_build_array('that — which','who — which','that — who','which — which','who — that'),
      'answer','1'),

    jsonb_build_object('number',18,
      'question',E'다음 문장의 빈칸 (A), (B), (C)에 들어갈 말로 가장 적절한 것은?\n\n• Japan is a country (A)___ has many earthquakes.\n• There are many birds (B)___ live near the lake.\n• Ms. Park is a person (C)___ loves reading.\n\n     (A)     (B)     (C)',
      'options',jsonb_build_array('which — who — who','which — which — who','who — who — which','that — which — which','who — that — whose'),
      'answer','2'),

    jsonb_build_object('number',19,
      'question',E'다음 문장의 빈칸 (A), (B), (C)에 들어갈 말로 가장 적절한 것은?\n\n• There is a girl (A)___ wants to talk to you.\n• Look at the bridge (B)___ has colorful lights.\n• Every student (C)___ passed the exam looks happy.\n\n     (A)     (B)     (C)',
      'options',jsonb_build_array('that — that — which','who — which — which','which — who — who','which — who — that','who — which — that'),
      'answer','5'),

    jsonb_build_object('number',20,
      'question',E'다음 두 문장을 한 문장으로 고쳐 쓸 때, 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?\n\n(1) I have a sister. She works at a hospital.\n→ I have a sister (A)___ works at a hospital.\n\n(2) I visited the tower. It has a nice view.\n→ I visited the tower (B)___ has a nice view.\n\n     (A)     (B)',
      'options',jsonb_build_array('who — which','who — and','which — that','that — who','what — which'),
      'answer','1'),

    -- ═══════════════════════════════════════════
    -- Part 3: who / which 구별 (Q21~Q26)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',21,
      'question',E'다음 중 빈칸에 which가 들어갈 수 없는 것은?',
      'options',jsonb_build_array(
        'She has two dogs ___ are very playful.',
        'There is a bakery ___ sells fresh bread.',
        'Give me the pen ___ is on the table.',
        'He has a toy ___ makes funny sounds.',
        'Lisa is the student ___ can speak French.'),
      'answer','5'),

    jsonb_build_object('number',22,
      'question',E'다음 중 빈칸에 who가 들어갈 수 없는 것은?',
      'options',jsonb_build_array(
        'He is the teacher ___ helped me.',
        'Look at the fish ___ is swimming in the bowl.',
        'She is the lady ___ ran to me.',
        'Mr. Kim has a daughter ___ is a nurse.',
        'He has an uncle ___ lives in Canada.'),
      'answer','2'),

    jsonb_build_object('number',23,
      'question',E'다음 중 빈칸에 who가 들어갈 수 없는 것은?',
      'options',jsonb_build_array(
        'There is a boy ___ can play the violin well.',
        'Look at the man and the horse ___ are crossing the river.',
        'I met the students ___ go to Hana Middle School.',
        'The woman ___ is standing there is my aunt.',
        'There are lots of children ___ don''t have clean water.'),
      'answer','2'),

    jsonb_build_object('number',24,
      'question',E'다음 빈칸에 들어갈 말이 나머지 넷과 다른 하나는?\n(단, that은 제외할 것)',
      'options',jsonb_build_array(
        'I know a boy ___ plays basketball.',
        'She has a friend ___ is a dancer.',
        'Look at the sky ___ is full of stars.',
        'He has a sister ___ lives in London.',
        'We need a person ___ can fix computers.'),
      'answer','3'),

    jsonb_build_object('number',25,
      'question',E'다음 빈칸에 들어갈 말이 나머지 넷과 다른 하나는?\n(단, that은 제외할 것)',
      'options',jsonb_build_array(
        'He is one of the teachers ___ are respected.',
        'She is the girl ___ won the contest.',
        'He bought a bike ___ was on sale.',
        'She is the nurse ___ helped the patient.',
        'He has two brothers ___ became doctors.'),
      'answer','3'),

    jsonb_build_object('number',26,
      'question',E'다음 빈칸에 들어갈 말이 나머지 넷과 다른 하나는?\n(단, that은 제외할 것)',
      'options',jsonb_build_array(
        'This is the movie ___ won the award.',
        'Here is the cake ___ my mom baked.',
        'The house ___ stands on the hill is old.',
        'I love the garden ___ has many flowers.',
        'He has two daughters ___ became pilots.'),
      'answer','5'),

    -- ═══════════════════════════════════════════
    -- Part 4: 관계대명사 vs 의문사/접속사 구별 (Q27~Q34)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',27,
      'question',E'다음 중 밑줄 친 who의 쓰임이 나머지와 다른 것은?',
      'options',jsonb_build_array(
        'She is the doctor who saved my life.',
        'Who is the man standing over there?',
        'She isn''t sure who she should ask.',
        'Who will win the game tonight?',
        'Who do you admire most?'),
      'answer','1'),

    jsonb_build_object('number',28,
      'question',E'다음 중 밑줄 친 which의 쓰임이 나머지와 다른 것은?',
      'options',jsonb_build_array(
        'Which flavor of ice cream do you prefer?',
        'Tell me which color you like best.',
        'I don''t know which road leads to the park.',
        'She asked me which seat to take.',
        'Look at the cat which is climbing the tree.'),
      'answer','5'),

    jsonb_build_object('number',29,
      'question',E'다음 중 밑줄 친 who의 쓰임이 나머지와 다른 것은?',
      'options',jsonb_build_array(
        'I can''t tell who made this mess.',
        'Do you know who that man is?',
        'Who is the tallest student in the class?',
        'The woman who lives next door is a dentist.',
        'Who do you think did this?'),
      'answer','4'),

    jsonb_build_object('number',30,
      'question',E'다음 중 밑줄 친 who의 쓰임이 나머지와 다른 것은?',
      'options',jsonb_build_array(
        'Guess who this is.',
        'Who is that boy?',
        'Do you know who the owner is?',
        'I don''t remember who that man is.',
        'He is the student who broke the rules.'),
      'answer','5'),

    jsonb_build_object('number',31,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 다른 하나는?',
      'options',jsonb_build_array(
        'Do you know who my English teacher is?',
        'There was an old castle that became a museum.',
        'She gave me a ring which was made of silver.',
        'I know a pilot who flew around the world.',
        'Students who study hard usually get good grades.'),
      'answer','1'),

    jsonb_build_object('number',32,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은?\n\n<보기>\nI can create a robot that helps elderly people.',
      'options',jsonb_build_array(
        'Where did you find that?',
        'I believe that she is honest.',
        'Are you sure that it will rain?',
        'The dog that is barking loudly is mine.',
        'Do you think that he will come?'),
      'answer','4'),

    jsonb_build_object('number',33,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 다른 하나는?',
      'options',jsonb_build_array(
        'Look at the bird that is sitting on the roof.',
        'There is a small shop that sells old books.',
        'He thinks that the movie is boring.',
        'I bought a shirt that has long sleeves.',
        'She always eats food that is healthy.'),
      'answer','3'),

    jsonb_build_object('number',34,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 <보기>와 같은 것은? (정답 2개)\n\n<보기> A girl that called this morning left a message.',
      'options',jsonb_build_array(
        'That bag is mine.',
        'This is cheaper than that.',
        'Is he the boy that won the prize?',
        'I hope that you feel better.',
        'A man and his cat that were sitting on the bench looked peaceful.'),
      'answer','3, 5'),

    -- ═══════════════════════════════════════════
    -- Part 5: 두 문장 연결 + 배열 + 영작 (Q35~Q46)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',35,
      'question',E'다음 두 문장을 한 문장으로 만들 때, 빈칸에 들어갈 말로 가장 적절한 것은? (정답 2개)\n\nI have a bike. It is very expensive.\n→ I have a bike ___ is very expensive.',
      'options',jsonb_build_array('who','whom','which','that','what'),
      'answer','3, 4'),

    jsonb_build_object('number',36,
      'question',E'다음 두 문장을 한 문장으로 바르게 연결한 것은?\n\n• I know the girl.\n• She is in the library.',
      'options',jsonb_build_array(
        'I know the girl who in the library.',
        'I know the girl which is in the library.',
        'I know the girl who is in the library.',
        'I know the girl who are in the library.',
        'I know the girl that they are in the library.'),
      'answer','3'),

    jsonb_build_object('number',37,
      'question',E'다음 두 문장을 한 문장으로 바르게 연결한 것은?\n\n• Min is in the hospital.\n• He was sick yesterday.',
      'options',jsonb_build_array(
        'Min is in the hospital who was sick yesterday.',
        'Min is in the hospital which was sick yesterday.',
        'Min who was sick yesterday is in the hospital.',
        'Min which was sick yesterday is in the hospital.',
        'Min who was sick is in the hospital yesterday.'),
      'answer','3'),

    jsonb_build_object('number',38,
      'question',E'다음 두 문장을 한 문장으로 바르게 연결한 것은?\n\n• I have a digital camera.\n• It is very useful.',
      'options',jsonb_build_array(
        'I have a digital camera and is very useful.',
        'I have a digital camera what is very useful.',
        'I have a digital camera which is very useful.',
        'I have a digital camera whose is very useful.',
        'I have a digital camera who is very useful.'),
      'answer','3'),

    jsonb_build_object('number',39,
      'question',E'다음 두 문장을 한 문장으로 바르게 연결한 것은?\n\n• The car is Tom''s car.\n• The car has a blue roof.',
      'options',jsonb_build_array(
        'The car is Tom''s car when has a blue roof.',
        'The car which has a blue roof is Tom''s car.',
        'The car is a blue car that Tom lives in.',
        'The car is Tom''s car who has a blue roof.',
        'The car which has a blue roof is Tom.'),
      'answer','2'),

    jsonb_build_object('number',40,
      'question',E'다음 두 문장을 한 문장으로 바르게 연결한 것은? (정답 2개)\n\n• Sujin likes Minho.\n• He has a kind smile.',
      'options',jsonb_build_array(
        'Sujin likes Minho which has a kind smile.',
        'Sujin likes Minho that has a kind smile.',
        'Sujin likes Minho whom has a kind smile.',
        'Sujin likes Minho of which has a kind smile.',
        'Sujin likes Minho who has a kind smile.'),
      'answer','2, 5'),

    jsonb_build_object('number',41,
      'question',E'다음 두 문장을 한 문장으로 쓸 때, 알맞은 것을 고르면?\n\n• The woman has just arrived.\n• She sent you an email.',
      'options',jsonb_build_array(
        'The woman sent you an email who has just arrived.',
        'The woman who sent you an email has just arrived.',
        'The woman sent this email which has just arrived.',
        'The woman which sent you an email has just arrived.',
        'The woman has just arrived that sent you an email.'),
      'answer','2'),

    jsonb_build_object('number',42,
      'question',E'다음 빈칸에 들어갈 말로 알맞은 것은?\n\nI want to buy a new camera ___.',
      'options',jsonb_build_array(
        'who has a large screen',
        'when I saw yesterday',
        'which it takes great photos',
        'that fits in my pocket',
        'that the store sells it'),
      'answer','4'),

    jsonb_build_object('number',43,
      'question',E'다음 우리말을 바르게 영작한 것은?\n\n나는 피아노를 잘 치는 소녀를 알고 있다.',
      'options',jsonb_build_array(
        'I know a girl which play the piano.',
        'I know a girl who play the piano well.',
        'I know a girl which the piano plays.',
        'I know a girl who plays the piano well.',
        'I know a girl which plays the piano well.'),
      'answer','4'),

    jsonb_build_object('number',44,
      'question',E'다음 우리말을 바르게 영작한 것은?\n\n나는 많은 그림이 있는 책들을 좋아한다.',
      'options',jsonb_build_array(
        'I like books who has a lot of pictures.',
        'I like books which have lot of pictures.',
        'I like books which have a lot of pictures.',
        'I like books who have a lot of pictures.',
        'I like books which have a lot of picture.'),
      'answer','3'),

    jsonb_build_object('number',45,
      'question',E'다음 <보기>에 주어진 단어들을 바르게 배열하여 문장을 완성한 것은?\n\n<보기>\nyour / something / find / can / that / catches / you / attention / ?\n',
      'options',jsonb_build_array(
        'Can you find something that catches your attention?',
        'Can you something find that catches your attention?',
        'Can you find that something catches your attention?',
        'Can you catches something find that your attention?',
        'Can you find something catches that your attention?'),
      'answer','1'),

    jsonb_build_object('number',46,
      'question',E'다음 두 문장을 한 문장으로 바르게 연결한 것은?\n\n• I have an electronic dictionary.\n• It is very useful.',
      'options',jsonb_build_array(
        'I have an electronic dictionary and is very useful.',
        'I have an electronic dictionary what is very useful.',
        'I have an electronic dictionary which is very useful.',
        'I have an electronic dictionary whose is very useful.',
        'I have an electronic dictionary who is very useful.'),
      'answer','3'),

    -- ═══════════════════════════════════════════
    -- Part 6: 어법 판별 (Q47~Q70)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',47,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'I want a house that has a large garden.',
        'She has a cousin which lives in Paris.',
        'I know a boy that speaks Chinese very well.',
        'He has two daughters who became pilots.',
        'It is a very interesting book which is popular in Korea.'),
      'answer','2'),

    jsonb_build_object('number',48,
      'question',E'다음 중 밑줄 친 부분이 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'Have you seen a movie who was directed by Spielberg?',
        'I met a boy who was waiting at the bus stop.',
        'I have a nephew that is very smart.',
        'He has a son that is good at soccer.',
        'Look at the kite which is flying in the sky.'),
      'answer','1'),

    jsonb_build_object('number',49,
      'question',E'다음 중 밑줄 친 부분의 쓰임이 올바른 것은?',
      'options',jsonb_build_array(
        'Look at the tower that stand on the square.',
        'A dolphin is an animal that live in the ocean.',
        'The man who is reading a newspaper are my uncle.',
        'Ms. Lee has a daughter who like to draw pictures.',
        'The bridge which connects the two cities is famous.'),
      'answer','5'),

    jsonb_build_object('number',50,
      'question',E'다음 중 밑줄 친 부분이 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'An airplane is a machine which flies.',
        'I don''t like people who never stops talking.',
        'Grace lives in the house which is 100 years old.',
        'My father will buy a new car which costs $5000.',
        'Do you know anybody who can play the drums?'),
      'answer','2'),

    jsonb_build_object('number',51,
      'question',E'다음 중 밑줄 친 부분이 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'A firefighter is a person who fights fires.',
        'She has to finish a project which has 12 sections.',
        'A whale is a mammal which is the biggest in the ocean.',
        'I want to meet the woman that wears a yellow dress.',
        'He didn''t read the email from me who was on the desk.'),
      'answer','5'),

    jsonb_build_object('number',52,
      'question',E'다음 중 밑줄 친 부분이 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'Jake was a brave boy who lived next door.',
        'Look at the mountain which stands on the horizon.',
        'A pilot is a person whom flies airplanes.',
        'Einstein is the scientist who discovered relativity.',
        'Mozart is a name that everyone knows.'),
      'answer','3'),

    jsonb_build_object('number',53,
      'question',E'다음 중 밑줄 친 부분이 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'Rachel found the boy who took her wallet.',
        'Tom is wearing shoes that are too big for him.',
        'Lisa works for a company who makes robots.',
        'She''d like to meet a man who knows how to cook.',
        'Hemingway was a writer who couldn''t live without adventure.'),
      'answer','3'),

    jsonb_build_object('number',54,
      'question',E'다음 중 밑줄 친 부분이 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'He has a garden which is very beautiful.',
        'The man who is talking to my sister are my uncle.',
        'I joined three clubs which have a lot of members.',
        'Who brought the dog that is sleeping over there?',
        'The chef who works at that restaurant is very talented.'),
      'answer','2'),

    jsonb_build_object('number',55,
      'question',E'다음 중 밑줄 친 부분이 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'I want to have a doll which can talk.',
        'It was about a man who tried to climb the mountain.',
        'A penguin is an animal who walks slowly.',
        'There are lots of people that do not have enough food.',
        'The door which is on the right doesn''t work.'),
      'answer','3'),

    jsonb_build_object('number',56,
      'question',E'다음 중 밑줄 친 부분이 어법상 옳은 것은?',
      'options',jsonb_build_array(
        'This is a boy which comes from Brazil.',
        'I live in a house who has a big backyard.',
        'A dolphin is an animal which has a long nose.',
        'I want to have a robot who can wash my dishes.',
        'A film editor is a person which edits films.'),
      'answer','3'),

    jsonb_build_object('number',57,
      'question',E'다음 중 어법상 어색한 문장은?',
      'options',jsonb_build_array(
        'This is a girl who comes from Canada.',
        'He sat on the bench which had a broken leg.',
        'I like the boy that is standing under the tall tree.',
        'Ryan has two books which have many pictures.',
        'A baker is a person who bake bread.'),
      'answer','5'),

    jsonb_build_object('number',58,
      'question',E'다음 중 어법상 옳은 문장은?',
      'options',jsonb_build_array(
        'I read a book which was on the shelf.',
        'I saw a bus who went to the station.',
        'I met a girl which was wearing a red hat.',
        'I teach a boy whom can''t read the English book.',
        'Japan is a country who has many interesting things.'),
      'answer','1'),

    jsonb_build_object('number',59,
      'question',E'다음 중 어법상 어색한 문장은?',
      'options',jsonb_build_array(
        'There is a girl who is playing the guitar.',
        'This is a book which is about science.',
        'Mark is the famous chef who was on TV.',
        'Emily is the person who really hates rain.',
        'Mrs. Lee has a small garden who looks beautiful.'),
      'answer','5'),

    jsonb_build_object('number',60,
      'question',E'다음 중 어법상 옳은 문장은?',
      'options',jsonb_build_array(
        'I know the men that is standing there.',
        'This is the boy who like to play soccer.',
        'Did you see a house who has a large pool?',
        'I want to have a robot who can clean my room.',
        'Jake has two books which have many beautiful pictures.'),
      'answer','5'),

    jsonb_build_object('number',61,
      'question',E'다음 중 어법상 올바른 문장은?',
      'options',jsonb_build_array(
        'Tom has a cat which have a black tail.',
        'Mr. Kim has a friend which lives in Rome.',
        'A person who drink much water is healthy.',
        'The boy whom is standing there is Ryan.',
        'Edison was a man who traveled a lot when he was young.'),
      'answer','5'),

    jsonb_build_object('number',62,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'I like people that are kind to others.',
        'A painter is a person which paints pictures.',
        'I want to be a good teacher who loves students.',
        'What was the problem that happened yesterday?',
        'You have to catch the train which leaves at five.'),
      'answer','2'),

    jsonb_build_object('number',63,
      'question',E'다음 중 어법상 올바른 문장은? (정답 2개)',
      'options',jsonb_build_array(
        'I want to buy a dog who can be my friend.',
        'There were few passengers which got hurt.',
        'I live in a house which has a big living room.',
        'A director is a person who makes movies.',
        'It is a wand who have magic power.'),
      'answer','3, 4'),

    jsonb_build_object('number',64,
      'question',E'다음 중 어법상 옳은 문장은?',
      'options',jsonb_build_array(
        'Amy has a brother whom is handsome.',
        'Look at the girl which is waiting for the bus.',
        'This is the book who is very popular in Korea.',
        'Is he the man whom sings to Julie every night?',
        'The students that attend this school must wear uniforms.'),
      'answer','5'),

    jsonb_build_object('number',65,
      'question',E'다음 중 어법상 옳은 문장은?',
      'options',jsonb_build_array(
        'I have a friend who sister knows you.',
        'A diver is a person who swim underwater.',
        'That is a lady whom gave me a lot of advice.',
        'The electronic dictionary that has many features is useful.',
        'The children and the plants which grow together can be friends.'),
      'answer','4'),

    jsonb_build_object('number',66,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        'I called the girls who laughed at me.',
        'He met a woman who was an artist.',
        'Is an artist a person which paints a painting?',
        'The boy who lives next door is a pianist.',
        'I have a book which is very interesting.'),
      'answer','3'),

    jsonb_build_object('number',67,
      'question',E'다음 중 어법상 옳은 문장은?',
      'options',jsonb_build_array(
        'She is the girl that can help you.',
        'I have a book which are interesting.',
        'This is a dictionary who is so cheap.',
        'This is the woman who work at the bank.',
        'This is the book that explain how to use a computer.'),
      'answer','1'),

    jsonb_build_object('number',68,
      'question',E'다음 중 어법상 옳은 문장은?',
      'options',jsonb_build_array(
        'This is the dog who bit me yesterday.',
        'I need a room which has enough space.',
        'A movie star which is famous disappeared.',
        'The children who was eating apples were late for class.',
        'Do you know the girls who is singing on the stage?'),
      'answer','2'),

    jsonb_build_object('number',69,
      'question',E'다음 중 어법상 옳은 문장은? (정답 2개)',
      'options',jsonb_build_array(
        'There aren''t many sugar in the jar.',
        'There was a lot of food on the table.',
        'The hotel which had a swimming pool was nice.',
        'The statue is a landmark who is very old.',
        'Only three of the students which passed the exam got awards.'),
      'answer','2, 3'),

    jsonb_build_object('number',70,
      'question',E'다음 중 어법상 옳은 문장은?',
      'options',jsonb_build_array(
        'The waiter who served us was very polite.',
        'What happened to the pictures which was on the wall?',
        'The bus who goes to the airport runs every hour.',
        'A thief is someone who break into a house.',
        'You always ask the questions which is difficult to answer.'),
      'answer','1')
  );

  a := jsonb_build_array(
    '2','1','5','5','4','4','2','2','1','5',
    '1','2','2','2','2','4','1','2','5','1',
    '5','2','2','3','3','5',
    '1','5','4','5','1','4','3','3, 5',
    '3, 4','3','3','3','2','2, 5','2','4','4','3','1','3',
    '2','1','5','2','5','3','3','2','3','3','5','1','5','5','5','2','3, 4','5','4','3','1','2','2, 3','1'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('주격관계대명사 Step2', '주격관계대명사', q, a, 'problem', 'interactive');

  RAISE NOTICE '주격관계대명사 Step2 템플릿 생성 완료 (70문제, 객관식, paraphrased)';
END;
$$;
