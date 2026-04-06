DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = '수여동사 Step3';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- Part 1: 전치사 빈칸 to/for/of (Q1~Q6)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1,
      'question',E'다음 빈칸에 알맞은 전치사를 쓰시오.\n\nRyan showed his drawings ___ the whole class.',
      'answer','to'),

    jsonb_build_object('number',2,
      'question',E'다음 빈칸에 알맞은 전치사를 쓰시오.\n\nMy uncle prepared a special meal ___ the guests.',
      'answer','for'),

    jsonb_build_object('number',3,
      'question',E'다음 빈칸에 알맞은 전치사를 쓰시오.\n\nThe student asked a difficult question ___ the professor.',
      'answer','of'),

    jsonb_build_object('number',4,
      'question',E'다음 빈칸에 알맞은 전치사를 쓰시오.\n\nSophie wrote a long letter ___ her grandmother.',
      'answer','to'),

    jsonb_build_object('number',5,
      'question',E'다음 빈칸 (A)~(C)에 들어갈 전치사를 각각 쓰시오.\n\n(A) She read a fairy tale ___ the children.\n(B) He saved a window seat ___ his friend.\n(C) The manager asked a favor ___ his assistant.',
      'answer','(A) to (B) for (C) of'),

    jsonb_build_object('number',6,
      'question',E'다음 빈칸에 알맞은 전치사를 각각 쓰시오.\n\n(1) Leo handed the document ___ his boss.\n(2) She found a nice dress ___ her daughter.\n(3) He passed the remote control ___ me.\n(4) They asked the boy''s address ___ him.',
      'answer','(1) to (2) for (3) to (4) of'),

    -- ═══════════════════════════════════════════
    -- Part 2: 형식 전환 빈칸 (Q7~Q20)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',7,
      'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nHe teaches us science.\n= He teaches science ___ ___.',
      'answer','to us'),

    jsonb_build_object('number',8,
      'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nGrandma knitted me a warm sweater.\n= Grandma knitted a warm sweater ___ ___.',
      'answer','for me'),

    jsonb_build_object('number',9,
      'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nNara bought a bracelet for her friend.\n= Nara bought ___ ___ ___ ___.',
      'answer','her friend a bracelet'),

    jsonb_build_object('number',10,
      'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nAlex sent an invitation to his cousin.\n= Alex sent ___ ___ ___ ___.',
      'answer','his cousin an invitation'),

    jsonb_build_object('number',11,
      'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nEthan lent his classmate a calculator.\n= Ethan lent ___ ___ ___ ___ ___.',
      'answer','a calculator to his classmate'),

    jsonb_build_object('number',12,
      'question',E'다음 <보기>를 참고하여 주어진 문장을 다시 쓰시오.\n\n<보기>\nHe gives me a notebook.\n= He gives a notebook to me.\n\nI''ll bring you my camera.\n= I''ll bring ___.',
      'answer','my camera to you'),

    jsonb_build_object('number',13,
      'question',E'다음 <보기>를 참고하여 주어진 문장을 다시 쓰시오.\n\n<보기>\nHe gives me a notebook.\n= He gives a notebook to me.\n\nMy aunt cooked us a big dinner.\n= My aunt cooked ___.',
      'answer','a big dinner for us'),

    jsonb_build_object('number',14,
      'question',E'다음 <보기>를 참고하여 주어진 문장을 다시 쓰시오.\n\n<보기>\nHe gives me a notebook.\n= He gives a notebook to me.\n\nThe reporter asked the mayor a tough question.\n= The reporter asked ___.',
      'answer','a tough question of the mayor'),

    jsonb_build_object('number',15,
      'question',E'다음 주어진 문장과 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nHe got me a new backpack.\n= He got ___ ___ ___ ___ ___.',
      'answer','a new backpack for me'),

    jsonb_build_object('number',16,
      'question',E'다음 <보기>와 같이 주어진 문장과 의미가 같도록 고쳐 쓰시오.\n\n<보기>\nCould you pass me some ketchup?\n→ Could you pass some ketchup to me?\n\nMy cousin lent me her laptop.',
      'answer','My cousin lent her laptop to me.'),

    jsonb_build_object('number',17,
      'question',E'다음 문장을 4형식 문장으로 바꿔 쓰시오.\n\nPlease send some photos of the trip to me.',
      'answer','Please send me some photos of the trip.'),

    jsonb_build_object('number',18,
      'question',E'다음 <보기>를 참고하여 빈칸에 알맞은 말을 쓰시오.\n\n<보기>\nMy friend wrote me a letter.\n= My friend wrote a letter to me.\n\n(1) The coach asked ___ ___ ___.\n= The coach asked a favor of them.\n\n(2) He will make you delicious cookies.\n= He will make ___ ___ ___ ___.',
      'answer','(1) them a favor (2) delicious cookies for you'),

    jsonb_build_object('number',19,
      'question',E'다음 주어진 문장과 같은 의미가 되도록 빈칸을 완성하시오.\n\nHe will send you some cookies.\n→ ___ ___ send ___ ___ ___ ___.',
      'answer','He will send some cookies to you.'),

    jsonb_build_object('number',20,
      'question',E'다음 <보기>와 같이 문장 전환이 올바르면 O, 틀리면 X를 쓰고 바르게 고쳐 쓰시오.\n\n<보기>\nShe bought him a cake.\n→ She bought a cake for him. (O)\n\n(1) He gave the winner a trophy.\n→ He gave a trophy to the winner. ( )\n\n(2) Mom cooked us a nice dinner.\n→ Mom cooked a nice dinner to us. ( )',
      'answer','(1) O (2) X → Mom cooked a nice dinner for us.'),

    -- ═══════════════════════════════════════════
    -- Part 3: 오류 수정 (Q21~Q26)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',21,
      'question',E'다음 문장에서 어색한 부분을 찾아 바르게 고쳐 문장을 다시 쓰시오.\n\nShe gave a nice present of me.',
      'answer','She gave a nice present to me.'),

    jsonb_build_object('number',22,
      'question',E'다음 문장에서 어색한 부분을 찾아 바르게 고쳐 문장을 다시 쓰시오.\n\nMy dad bought a jacket to my brother.',
      'answer','My dad bought a jacket for my brother.'),

    jsonb_build_object('number',23,
      'question',E'다음 문장에서 어색한 부분을 찾아 바르게 고쳐 문장을 다시 쓰시오.\n\nHis mom made for him a birthday cake.',
      'answer','His mom made him a birthday cake.'),

    jsonb_build_object('number',24,
      'question',E'다음 문장에서 어색한 부분을 찾아 바르게 고쳐 문장을 다시 쓰시오.\n\nThe teacher told a funny story for the students.',
      'answer','The teacher told a funny story to the students.'),

    jsonb_build_object('number',25,
      'question',E'다음 문장에서 어색한 부분을 바르게 고쳐 문장으로 다시 쓰시오.\n\nⓐ She cooked dinner to her family.\n\nⓑ He asked a question for his teacher.',
      'answer','ⓐ She cooked dinner for her family. ⓑ He asked a question of his teacher.'),

    jsonb_build_object('number',26,
      'question',E'다음 문장에서 어색한 부분을 찾아 바르게 고쳐 문장을 다시 쓰시오.\n\nLucas sent a package for his cousin last week.',
      'answer','Lucas sent a package to his cousin last week.'),

    -- ═══════════════════════════════════════════
    -- Part 4: 배열 (Q27~Q36)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',27,
      'question',E'다음 괄호 안에 주어진 말을 알맞게 배열하여 문장을 완성하시오.\n\n(my uncle / a watch / gave / me)',
      'answer','My uncle gave me a watch.'),

    jsonb_build_object('number',28,
      'question',E'다음 괄호 안에 주어진 말을 알맞게 배열하여 문장을 완성하시오.\n\n(sent / Grace / her cousin / a postcard)',
      'answer','Grace sent her cousin a postcard.'),

    jsonb_build_object('number',29,
      'question',E'다음 괄호 안에 주어진 말을 알맞게 배열하여 문장을 완성하시오.\n\n(Ms. Jung / an e-mail / us / sent)',
      'answer','Ms. Jung sent us an e-mail.'),

    jsonb_build_object('number',30,
      'question',E'다음 괄호 안에 주어진 말을 알맞게 배열하여 문장을 완성하시오.\n\n(the salt / you / pass / can / to / me)\n→ ___?',
      'answer','Can you pass the salt to me?'),

    jsonb_build_object('number',31,
      'question',E'다음 우리말과 같도록 괄호 안의 단어를 바르게 배열하시오.\n\n내 어머니는 나에게 스카프를 만들어 주셨다.\n(a scarf / made / my mother / me)',
      'answer','My mother made me a scarf.'),

    jsonb_build_object('number',32,
      'question',E'다음 우리말과 같도록 괄호 안의 단어를 바르게 배열하시오.\n\n그는 우리에게 맛있는 피자를 주문해 줄 것이다.\n(he / order / will / us / pizza / delicious)',
      'answer','He will order us delicious pizza.'),

    jsonb_build_object('number',33,
      'question',E'다음 대화가 자연스럽도록 괄호 안에 주어진 단어를 배열하여 문장을 완성하시오.\n\nA: What did your parents get you for Christmas?\nB: (me / a / got / tablet / they)',
      'answer','They got me a tablet.'),

    jsonb_build_object('number',34,
      'question',E'다음 괄호 안에 주어진 단어를 모두 이용하여 한 문장을 만드시오.\n\n(lent / her notes / Olivia / to / yesterday / me)',
      'answer','Olivia lent her notes to me yesterday.'),

    jsonb_build_object('number',35,
      'question',E'다음 우리말을 괄호 안에 주어진 단어를 재배열하여 영작하시오.\n\n<조건>\n1. ''I''로 시작할 것\n2. 필요하다면 단어를 변형시킬 것\n\n제가 당신에게 커피 세 잔을 가져다 드릴게요.\n(bring / cup / of / you / will / three / coffee)',
      'answer','I will bring you three cups of coffee.'),

    jsonb_build_object('number',36,
      'question',E'다음 괄호 안에 주어진 문장을 바르게 배열하여 올바른 문장을 완성하시오.\n\nToday is my birthday. I got a lot of things from my family and friends. My mom (me, made, a special cake). I am so happy.\n\n→ My mom ___.',
      'answer','My mom made me a special cake.'),

    -- ═══════════════════════════════════════════
    -- Part 5: 대화 / 글 / 표 빈칸 완성 (Q37~Q46)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',37,
      'question',E'다음 대화의 빈칸에 들어갈 말을 괄호 안의 조건에 맞게 쓰시오.\n\nA: What does Mr. Han teach you?\nB: ___.\n(science, he, we, teach를 응용할 것 / 4~5단어로 쓸 것)',
      'answer','He teaches us science.'),

    jsonb_build_object('number',38,
      'question',E'다음 대화의 빈칸에 들어갈 말을 괄호 안에 주어진 단어를 활용하여 쓰시오.\n\nA: How much money did Nara lend you?\nB: She ___.\n(fifty dollars, me)',
      'answer','lent me fifty dollars'),

    jsonb_build_object('number',39,
      'question',E'다음 질문에 대한 대답을 완전한 영어문장으로 쓰시오.\n\n(1) Q: Who told you the news?\nA: My brother ___.\n\n(2) Q: Who made a sweater for you?\nA: My mom ___.',
      'answer','(1) told me the news (2) made me a sweater / made a sweater for me'),

    jsonb_build_object('number',40,
      'question',E'다음 표를 바탕으로 Yuri의 일기를 완성하시오.\n\n| Who? | How? | What? |\n| father | bought | a doll |\n| mother | made | a birthday cake |\n| brother | sent | a birthday card |\n\nYuri''s Diary — Sunday, March 8\nToday is my birthday. I got a lot of things from my family.\nFather (1)___ ___ ___ ___.\nMother (2)___ ___ ___ ___ ___.\nAnd my brother (3)___ ___ ___ ___ ___.',
      'answer','(1) bought me a doll (2) made me a birthday cake (3) sent me a birthday card'),

    jsonb_build_object('number',41,
      'question',E'다음 글의 내용으로 보아 빈칸에 들어갈 표현을 주어진 단어를 모두 이용하여 쓰시오. (필요한 경우 어형을 변화시킬 것)\n\nIt was Ethan''s birthday. He got many presents.\nHis parents (1)___.\n(him, a book, buy)\n\nHis friends (2)___.\n(a surprise party, him, throw)',
      'answer','(1) bought him a book (2) threw him a surprise party'),

    jsonb_build_object('number',42,
      'question',E'다음 <보기>와 같이 주어진 단어를 이용하여 문장을 완성하시오.\n\n<보기>\nI''m so hungry. Bring me some food, please.\n(bring / some food)\n\nI have a problem. ___, please.\n(give / some advice)',
      'answer','Give me some advice'),

    jsonb_build_object('number',43,
      'question',E'다음 <보기>와 같이 주어진 단어를 이용하여 문장을 완성하시오.\n\n<보기>\nIt''s Yuri''s birthday. Let''s buy her a present.\n(buy / a present)\n\n(1) We visited the museum. The guide ___.\n(show / old paintings)\n\n(2) I forgot my pen. Can you ___?\n(lend / your pen / to)',
      'answer','(1) showed us old paintings (2) lend your pen to me'),

    jsonb_build_object('number',44,
      'question',E'다음 상자 안에 주어진 정보를 활용하여 <보기>와 같이 두 문장을 영작하시오. (단, 과거 시제로 쓰되, 이미 사용된 단어는 사용하지 말 것)\n\n| a poem | him | he | cook | write | buy | a meal | a toy | he |\n\n<보기> Lucas wrote him a poem.\n(1) Lucas ___.\n(2) Lucas ___.',
      'answer','(1) cooked him a meal (2) bought him a toy'),

    jsonb_build_object('number',45,
      'question',E'다음 대화의 내용상 빈칸에 들어갈 말을 <보기>에 주어진 단어를 활용해서 문장을 만드시오. (필요시 형태 변형 및 단어 추가 가능)\n\nA: Do you know my friend, Chris?\nB: Yes, I know him. Why?\nA: ___ I am going to do something special for his birthday.\n\n(buy, present, him, want)',
      'answer','I want to buy him a present.'),

    jsonb_build_object('number',46,
      'question',E'다음 밑줄 친 우리말을 영작하시오.\n\nI love cooking. I can bake cookies for my neighbors. (A)나는 또한 그들에게 따뜻한 수프를 만들어 줄 수 있습니다.\n\n<보기> make, warm, soup\n\n→ I can also ___ ___ ___ ___.',
      'answer','make them warm soup'),

    -- ═══════════════════════════════════════════
    -- Part 6: 문장 합치기 (Q47~Q52)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',47,
      'question',E'다음 두 개의 문장에서 밑줄 친 낱말을 문장의 끝에 위치시켜 주어진 <예시>처럼 바꾸어 쓰시오.\n\n<예시>\nRyan sent a package. It was to his uncle.\n→ Ryan sent a package to his uncle.\n\n(1) Nara lent some money. It was to her friend.\n→ ___\n\n(2) Chris wrote a poem. He wrote it for Lily.\n→ ___',
      'answer','(1) Nara lent some money to her friend. (2) Chris wrote a poem for Lily.'),

    jsonb_build_object('number',48,
      'question',E'다음 두 개의 문장에서 밑줄 친 낱말을 문장의 끝에 위치시켜 주어진 <예시>처럼 바꾸어 쓰시오.\n\n<예시>\nRyan sent a package. It was to his uncle.\n→ Ryan sent a package to his uncle.\n\n(1) Grace told the secret. She told all her classmates.\n→ ___\n\n(2) Leo cooked dinner. He cooked it for his family.\n→ ___',
      'answer','(1) Grace told all her classmates the secret. (2) Leo cooked dinner for his family.'),

    jsonb_build_object('number',49,
      'question',E'다음 두 개의 문장에서 밑줄 친 낱말을 문장의 끝에 위치시켜 주어진 <예시>처럼 바꾸어 쓰시오.\n\n<예시>\nRyan sent a package. It was to his uncle.\n→ Ryan sent a package to his uncle.\n\n(1) Sophie lent her camera. She lent it to Ethan.\n→ ___\n\n(2) Olivia gave some help. She helped her neighbor.\n→ ___',
      'answer','(1) Sophie lent her camera to Ethan. (2) Olivia gave her neighbor some help.'),

    jsonb_build_object('number',50,
      'question',E'다음 문장을 전치사를 이용하여 같은 의미의 문장으로 바꾸어 쓰시오.\n\nYou can always ask me a question.',
      'answer','You can always ask a question of me.'),

    jsonb_build_object('number',51,
      'question',E'다음 주어진 문장과 같은 의미가 되도록 형식을 바꿔 다시 쓰시오.\n\n(1) Noah tells the children funny stories.\n= Noah ___.\n\n(2) My mom bought me a new laptop.\n= My mom ___.',
      'answer','(1) tells funny stories to the children (2) bought a new laptop for me'),

    jsonb_build_object('number',52,
      'question',E'다음 <보기>를 참고하여 두 문장의 의미가 같도록 주어진 문장을 바꿔 쓰시오.\n\n<보기>\nI''ll give Mom a gift.\n→ I''ll give a gift to Mom.\n\nMy father will buy her some flowers.\n→ My father will ___.',
      'answer','buy some flowers for her'),

    -- ═══════════════════════════════════════════
    -- Part 7: 영작 한→영 (Q53~Q60)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',53,
      'question',E'다음 괄호 안에 주어진 단어를 사용하여 우리말을 영어로 옮기시오.\n\n나는 내 남동생에게 이 목걸이를 졸업 선물로 줄 거야.\n(necklace)',
      'answer','I will give my brother this necklace as a graduation present.'),

    jsonb_build_object('number',54,
      'question',E'다음 우리말을 수여동사 표현을 이용하여 조건에 맞게 영작하시오.\n\n<조건>\n1. 제시어를 사용하여 완전한 문장으로 완성할 것\n2. 시제에 유의하여 쓸 것\n(제시어: the new bag)\n\n나는 내 친구들에게 새 가방을 보여주었다.',
      'answer','I showed my friends the new bag.'),

    jsonb_build_object('number',55,
      'question',E'다음 우리말을 영어로 쓰시오. (단, 동사 make를 사용할 것)\n\nOlivia는 그녀의 친구들에게 점심을 만들어 주었다.\n(1) 4형식: ___\n(2) 3형식: ___',
      'answer','(1) Olivia made her friends lunch. (2) Olivia made lunch for her friends.'),

    jsonb_build_object('number',56,
      'question',E'다음의 우리말과 일치하는 4형식 문장이 되도록 <조건>에 맞게 영작하시오.\n\n<조건>\n1. <보기>에 주어진 모든 단어를 사용할 것\n2. 필요시 단어의 형태를 적절히 변형할 것\n\n<보기> give, on, Noah, children, snacks, Saturday, free\n\nNoah는 토요일마다 아이들에게 무료 간식을 나눠준다.',
      'answer','Noah gives children free snacks on Saturday.'),

    jsonb_build_object('number',57,
      'question',E'다음 대화의 밑줄 친 우리말을 영작하시오.\n\nAmy: Hey, I heard it was your birthday yesterday!\nLucas: Yeah, it was great.\nAmy: What did your friends get you?\nLucas: Hana가 나에게 책을 사 주었어.',
      'answer','Hana bought me a book.'),

    jsonb_build_object('number',58,
      'question',E'다음 우리말을 영어로 쓰시오.\n\nRyan은 Sophie에게 새 시계를 사 주었다.\n(1) 3형식: ___\n(2) 4형식: ___',
      'answer','(1) Ryan bought a new watch for Sophie. (2) Ryan bought Sophie a new watch.'),

    jsonb_build_object('number',59,
      'question',E'다음 대화를 읽고 밑줄 친 ⓐ와 ⓑ의 우리말을 주어진 단어를 이용하여 영어로 쓰시오.\n\nThe following is a conversation between Hana and Chris after their trip.\n\nChris: So, Hana, did you think about your presents for your family?\nHana: Yes. ⓐ나는 부모님에게 머그컵 두 개를 사드리고 싶어. (want)\n\nChris: That''s a great idea. What about your brother?\nHana: ⓑ나는 Max에게 열쇠고리를 사줄 거야. (key chain)',
      'answer','ⓐ I want to buy my parents two mugs. ⓑ I will buy Max a key chain.'),

    jsonb_build_object('number',60,
      'question',E'다음 해석에 맞게 괄호 안에 주어진 단어와 <조건>을 참고하여 빈칸을 완성하시오.\n\n<조건>\n• 괄호 안에 주어진 단어를 시제에 맞게 변형할 것\n• 반드시 각 빈칸에 단어를 하나씩만 써 넣어 모든 빈칸을 완성할 것\n\n(1) Sophie는 Nara에게 목걸이 하나를 만들어 주었다.\n→ Sophie ___ ___ ___ ___ Nara. (make)\n\n(2) Leo는 그의 누나에게 편지 한 통을 써 줄 것이다.\n→ Leo ___ ___ ___ ___ ___ his sister. (write)',
      'answer','(1) made a necklace for (2) will write a letter to')
  );

  a := jsonb_build_array(
    'to','for','of','to','(A) to (B) for (C) of','(1) to (2) for (3) to (4) of',
    'to us','for me','her friend a bracelet','his cousin an invitation',
    'a calculator to his classmate','my camera to you','a big dinner for us',
    'a tough question of the mayor','a new backpack for me',
    'My cousin lent her laptop to me.','Please send me some photos of the trip.',
    '(1) them a favor (2) delicious cookies for you','He will send some cookies to you.',
    '(1) O (2) X → Mom cooked a nice dinner for us.',
    'She gave a nice present to me.','My dad bought a jacket for my brother.',
    'His mom made him a birthday cake.','The teacher told a funny story to the students.',
    'ⓐ She cooked dinner for her family. ⓑ He asked a question of his teacher.',
    'Lucas sent a package to his cousin last week.',
    'My uncle gave me a watch.','Grace sent her cousin a postcard.',
    'Ms. Jung sent us an e-mail.','Can you pass the salt to me?',
    'My mother made me a scarf.','He will order us delicious pizza.',
    'They got me a tablet.','Olivia lent her notes to me yesterday.',
    'I will bring you three cups of coffee.','My mom made me a special cake.',
    'He teaches us science.','lent me fifty dollars',
    '(1) told me the news (2) made me a sweater',
    '(1) bought me a doll (2) made me a birthday cake (3) sent me a birthday card',
    '(1) bought him a book (2) threw him a surprise party',
    'Give me some advice',
    '(1) showed us old paintings (2) lend your pen to me',
    '(1) cooked him a meal (2) bought him a toy',
    'I want to buy him a present.',
    'make them warm soup',
    '(1) Nara lent some money to her friend. (2) Chris wrote a poem for Lily.',
    '(1) Grace told all her classmates the secret. (2) Leo cooked dinner for his family.',
    '(1) Sophie lent her camera to Ethan. (2) Olivia gave her neighbor some help.',
    'You can always ask a question of me.',
    '(1) tells funny stories to the children (2) bought a new laptop for me',
    'buy some flowers for her',
    'I will give my brother this necklace as a graduation present.',
    'I showed my friends the new bag.',
    '(1) Olivia made her friends lunch. (2) Olivia made lunch for her friends.',
    'Noah gives children free snacks on Saturday.',
    'Hana bought me a book.',
    '(1) Ryan bought a new watch for Sophie. (2) Ryan bought Sophie a new watch.',
    'ⓐ I want to buy my parents two mugs. ⓑ I will buy Max a key chain.',
    '(1) made a necklace for (2) will write a letter to'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('수여동사 Step3', '수여동사', q, a, 'problem', 'interactive');

  RAISE NOTICE '수여동사 Step3 템플릿 생성 완료 (60문제, 서술형, paraphrased)';
END;
$$;
