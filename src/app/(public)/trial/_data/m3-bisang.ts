import type { ExamSet } from './types';

export const m3Bisang: ExamSet = {
  id: 'm3-bisang',
  label: '중3 비상',
  grade: 3,
  sections: [
    // Section 1: Music passage (Questions 1-2)
    {
      passage: `(A) You may hear music coming from somewhere on the way to school. Or you may listen to music on your phone. You can hear music in many places like shops, schools, or restaurants. But, did you know that music influences our lives in many ways? Let's look at how it ⓐ affects / effects our lives.

(B) Stores actually use music to sell more products. How is it possible? When you go shopping, you hear music in the background. Slow music makes people move more slowly through a store, so they end up buying more. Fast music makes people move more quickly through a store, so they end up buying less. So stores play slow and sad songs to make people stay longer and buy more. But at closing time, stores don't want people to stay so they play fast music. Now you know how stores make you shop.

(C) Let's find out another example of the ⓑ affects / effects of music on our lives. Have you ever heard that music is helpful for your health? Listening to relaxing music reduces stress by lowering hormone levels in your body. Stress causes various diseases. So reducing stress will help you become healthier. Actually, there is a study that showed patients who did not listen to relaxing music had ⓒ more / less pain than patients who listened to music. Isn't it amazing? On a stressful day, why don't you turn on some music?`,
      questions: [
        {
          id: 1,
          type: 'mc',
          question:
            'ⓐ~ⓒ에서 알맞은 단어를 골라 바르게 나열한 것은?',
          options: [
            '① affects, affects, less',
            '② affects, effects, less',
            '③ affects, effects, more',
            '④ effects, effects, more',
            '⑤ effects, affects, more',
          ],
          answer: 3,
        },
        {
          id: 2,
          type: 'subjective',
          question: `아래 조건에 맞게 단락 (B), (C)에 관한 문장 (1)~(3)을 완성하시오.

<조건>
(1), (3) : 괄호 안에 주어진 단어만 사용하되, 어법에 맞게 변형할 것
(2) : and, buy, for, it, longer, makes, more, people, possible, stay, to만 사용하여 배열할 것

Title: How Music Influences Our Lives
[Main idea] / [Supporting Idea]
(B) (1) Music is __________ to sell more. (use) / (2) Slow and sad music __________________________.
(C) Music reduces stress levels in our body. / (3) Music can lower hormone levels __________ to stress. (relate)`,
          answer:
            '(1) used (2) makes it possible for people to stay longer and buy more. (3) related',
        },
      ],
    },
    // Section 2: Standalone grammar question (Question 3)
    {
      questions: [
        {
          id: 3,
          type: 'mc',
          question: '어법상 틀린 문장은?',
          options: [
            '① What I said was wait for instructions.',
            '② I will have my car washed every Sunday.',
            '③ What happens is that he is afraid of losing his investment.',
            '④ He never listens to me. I think you can make him change his mind.',
            '⑤ After many hours of questioning, the detective got the suspect tell the truth.',
          ],
          answer: 5,
        },
      ],
    },
    // Section 3: Lucy interviews Chavez passage (Questions 4-6)
    {
      passage: `After the concert, Lucy was eager to write a story about the orchestra. She met Favio Chavez, the conductor, and asked him about the orchestra.

Lucy: Why did you start 'The Junk Orchestra'?

Chavez: When I went to a small town, ⓐcalled Cateura in Paraguay to work on a recycling program in 2005, I saw children who lived in a town mostly ⓑfilling with garbage. I wanted to add something positive to their lives, so I decided to share my love of music with them.

Lucy: Why didx you use garbage to make instruments?

Chavez: (A)One person's garbage is another person's treasure. Nicolas Gomez, a local garbage picker, helped me a lot. Thanks to him, children could play music with musical instruments ⓒmaking out of garbage. The wonderful thing about these instruments was that the children didn't have to worry about spending a lot of money on them.

Lucy: What do you want people to learn through your music?

Chavez: I want people to know that even something worthless can make ⓓinspired music.

After interviewing Chavez, Lucy realized that it really doesn't matter what instrument you play with as long as you put your heart into playing it. The children of Cateura showed her that an orchestra ⓔforming by people has great power.`,
      questions: [
        {
          id: 4,
          type: 'mc',
          question: '밑줄 친 ⓐ~ⓔ 중 어법상 옳은 것은?',
          options: ['① ⓐ', '② ⓑ', '③ ⓒ', '④ ⓓ', '⑤ ⓔ'],
          answer: 1,
        },
        {
          id: 5,
          type: 'mc',
          question: `<보기>의 a~f 중, 위의 글을 읽고 응답할 수 있는 질문만 골라 바르게 나열한 것은?

<보기>
a. Why did Chavez go to Cateura?
b. When did Chavez go to Cateura?
c. Which instrument did the concert begin with?
d. What was written on the back of the concert ticket?
e. What did Chavez want to share with the children of Cateura?
f. What did the writer think about 'The Junk Orchestra' before the concert?`,
          options: [
            '① a, c, d',
            '② a, b, e',
            '③ b, c, f',
            '④ b, d, f',
            '⑤ d, e, f',
          ],
          answer: 2,
        },
        {
          id: 6,
          type: 'mc',
          question: '밑줄 친 문장 (A)의 뜻풀이로 알맞은 것은?',
          options: [
            '① What is useful to one person must be useful to another.',
            '② Something worthless to one person is worthless to others, too.',
            '③ What is useless to one person might be valuable to another.',
            '④ Something which looks like garbage to one person is also garbage to another.',
            '⑤ When one person thinks something is valuable, others can think it has greater value.',
          ],
          answer: 3,
        },
      ],
    },
    // Section 4: Movie script dialogue (Question 7)
    {
      passage: `<보기>
(A) Wow, you're so creative. Thanks.
(B) Not well. The deadline is this weekend, but I ran out of ideas.
(C) Don't worry. I might help you come up with an idea. What made it hard?
(D) In this scene, the brother and the sister plan to get the housekeeper fired, but I have no idea how they can do it.
(E) Hmm, interesting. How about using an allergy to peach fuzz to make it look like the housekeeper has a contagious disease?

M: How's your movie script going?
W: (1)__________
M: (2)__________
W: (3)__________
M: (4)__________
W: (5)__________
M: No problem. I am so happy to help you.`,
      questions: [
        {
          id: 7,
          type: 'mc',
          question:
            '<보기>의 문장을 바르게 배열하여 대화를 완성하고자 할 때, (4)번 칸에 배치할 문장은?',
          options: [
            '① (A)',
            '② (B)',
            '③ (C)',
            '④ (D)',
            '⑤ (E)',
          ],
          answer: 5,
        },
      ],
    },
    // Section 5: Puneet and Puru passage (Questions 8-10)
    {
      passage: `After their father's death, Puneet and Puru ⓐtook their share of their father's wealth and settled in different cities. Five years passed. Puru, who had been following his father's ⓑwill carefully, had no money left. But his brother, Puneet, was richer than ever. Puru was puzzled about where he had gone wrong, so he visited Puneet to find out.

Puneet welcomed Puru with open arms. That night, when the brothers sat down to ⓒchat after dinner, Puru asked the question that had been on his mind for days.

(A)"It was our father's advice that I followed, but I am unhappy. I built a house in every city. But because I could not always stay there, I hired people to look after the ⓓluxurious house. Father said we should sleep comfortably and enjoy good food, so I bought a bed designed by experts. And a great ⓔchef prepared my meals every day. Father told us to spend like a rich man, so, I bought what I wanted without worrying about money. But look at me now! I'm empty-handed. Did you not follow our father's wisdom? Tell me, brother, how did you get so rich?"`,
      questions: [
        {
          id: 8,
          type: 'mc',
          question:
            '문장의 It ~ that이 밑줄 친 (A)와 같은 용법으로 쓰인 것은?',
          options: [
            '① It is true that Lucy won the race.',
            '② It is in the park that he walks his dog.',
            '③ It is false that he sent some flowers to me.',
            '④ It is important that he should attend the party.',
            '⑤ It is interesting that people believed the rumor.',
          ],
          answer: 2,
        },
        {
          id: 9,
          type: 'mc',
          question: `밑줄 친 ⓐ~ⓔ 의 뜻풀이로 옳은 것을 모두 고른 것은?

ⓐ to have their own portion
ⓑ to show that someone is willing or ready to do something
ⓒ to talk with someone in a casual way
ⓓ extremely comfortable or elegant, especially involving low expense
ⓔ a person who has special skills or knowledge about a particular subject`,
          options: [
            '① ⓐ, ⓒ',
            '② ⓐ, ⓔ',
            '③ ⓒ, ⓓ',
            '④ ⓑ, ⓓ',
            '⑤ ⓓ, ⓔ',
          ],
          answer: 1,
        },
        {
          id: 10,
          type: 'mc',
          question: '글의 내용과 일치하지 않는 것은?',
          options: [
            '① Puru followed his father\'s advice in his own way.',
            '② Their father left his wealth for each of them when he died.',
            '③ In five years after his father\'s death, Puru got no money left.',
            '④ Puru made many friends to have his house looked after by them.',
            '⑤ Puru was curious about the reason why he was empty-handed while his brother got richer than before.',
          ],
          answer: 4,
        },
      ],
    },
    // Section 6: Dialogue - Aladin (Question 11)
    {
      passage: `W: Jason, what are you reading?
M: I'm reading a book called Aladin.
W: Oh, I've heard about it. A genie makes Aladin's wishes come true, right?
M: Yeah. What would you do if you __________ with the magic of a genie?
W: I would thank him for creating Hangeul.
M: That's great!`,
      questions: [
        {
          id: 11,
          type: 'mc',
          question: '내용상 대화의 빈칸에 알맞은 어구는?',
          options: [
            '① could live forever',
            '② could be a superhero',
            '③ could have anything you want',
            '④ won the lottery and got a lot of money',
            '⑤ could time travel and meet King Sejong',
          ],
          answer: 5,
        },
      ],
    },
    // Section 7: Dialogue - Helmet (Question 12)
    {
      passage: `A: Jake, here's a package for you.
B: I bought a used helmet online a few days ago.
A: Oh, open it and let me see it.
B: Okay. Oh, this outer part is a little broken. The seller said that it's perfectly fine though.
A: Didn't you check the pictures of the helmet before you bought it?
B: No, I just trusted the seller. __________
A: You should call the seller and ask for a refund.`,
      questions: [
        {
          id: 12,
          type: 'mc',
          question: '내용상 대화의 빈칸에 들어갈 문장으로 적절하지 않은 것은?',
          options: [
            '① I shouldn\'t have trusted him.',
            '② I shouldn\'t have read the review.',
            '③ He shouldn\'t have sold a broken helmet.',
            '④ I should have checked it out a bit more.',
            '⑤ He shouldn\'t have said it is perfectly fine.',
          ],
          answer: 2,
        },
      ],
    },
    // Section 7b: Hamburger / environment chain (Question 13)
    {
      passage: '다음은 햄버거 소비와 환경의 관계를 나타낸 것이다.\n\n[햄버거 소비 증가] → [소 사육 증가] → [목초지 필요 증가] → [산림 벌채 증가]',
      questions: [
        {
          id: 13,
          type: 'mc',
          question: '위 관계를 설명하는 문장 중, 어법상 옳은 것은?',
          options: [
            '① As we eat more hamburgers, we need to raise more cow.',
            '② As we raise more cow, we need more land to raise them.',
            '③ As we need more land to raise cow, we cut more tree to make land.',
            '④ As we cut more tree to make land, the more forests disappear from the Earth.',
            '⑤ In conclusion, the more hamburgers we eat, the more forests disappear from the Earth.',
          ],
          answer: 5,
        },
      ],
    },
    // Section 8: COVID-19 passage (Questions 14-15)
    {
      passage: `Hello, it's us, Tim and Moby, and as you can see from Moby's outfit, we're coming to you from the future. The reason we went through all this trouble is to tell you something really, really important. Thank you.

During the long months of the pandemic, thank you for ⓐsocial distancing and staying at least six feet apart from anyone you don't live with. You stuck to the rules, even when it was tough to miss out on fun gatherings. More than anything else, that reduced the ⓑtransmission of the Corona virus.

Thanks for taking 20 seconds to scrub your hands with soap and water all the time. That kills germs, and helps stop the (A)spread of the virus.

Thanks for wearing a mask whenever you leave the house. You listened to the research that masks were the key to stopping the spread of COVID-19 because coughing, sneezing, and even just talking releases thousands of tiny ⓒdroplets, each of which can carry the Corona virus!

Things got pretty confusing when the world started opening up again. But you changed your behavior to keep up with the public health ⓓguidelines, like staying home when you felt even a little sick. You set the example, and reminded grown-ups that this stuff is important.

It was hard, and some of us experienced heart-breaking loss along the way. But we worked together, listened to the experts, and made it through. So, from all of us here in the ⓔpost-pandemic future, thank you. Stay strong, and you're going to get through this thing. And please keep up those safe practices.`,
      questions: [
        {
          id: 14,
          type: 'mc',
          question:
            '밑줄 친 ⓐ~ⓔ 중 세 번째 단락의 (A)spread와 같은 뜻으로 쓰인 말은?',
          options: ['① ⓐ', '② ⓑ', '③ ⓒ', '④ ⓓ', '⑤ ⓔ'],
          answer: 2,
        },
        {
          id: 15,
          type: 'mc',
          question: 'COVID-19 극복에 유용한 방안으로 언급되지 않은 것은?',
          options: [
            '① 비누로 손 씻기',
            '② 마스크 착용하기',
            '③ 사회적 거리 두기',
            '④ 손 소독제 사용하기',
            '⑤ 모임 참석 자제하기',
          ],
          answer: 4,
        },
      ],
    },
    // Section 9: Shopping effects passage (Questions 16-18)
    {
      passage: `(A) Jeff goes to the shopping center and sees a pair of soccer shoes on display. He recognizes the shoes at a glance because more than half of the boys on his soccer team ⓐwears them. Although he already has many pairs of soccer shoes, he ends up buying another new pair.

We can use the "bandwagon effect" to explain Jeff's behavior. A bandwagon is a wagon in a parade that ⓑencourage people to jump aboard and enjoy the music. As more and more people get on the bandwagon, others are more likely to get on or follow it. In this way, people tend to buy something just because other people have bought it.

(B) Lisa buys a coat that she really loves. Immediately, she realizes that her pants do not match her new coat. So, she buys new pants that go perfectly with her new coat. But she sees that none of her bags ⓒmatch her new clothes. So, she buys a new bag. Most of her money ⓓare spent on buying the new items to complete her new look.

What made Lisa search for new items immediately after buying a new coat? The "Diderot effect" may explain it. Denis Diderot, a French writer, received a new gown as a gift. Soon after receiving the gift, he noticed that all of his furniture did not go well with his new gown. So, he ended up replacing most of it. The Diderot effect, therefore, is the concept that purchasing a new item often ⓔlead to more unplanned purchases.

(C) Nathan goes window shopping and sees a pair of headphones. He checks the price and finds out that they are $200. He thinks that the headphones are too expensive. The sales person approaches him and says, "You can get a 20 percent discount on those headphones." (a)__________ the discounted price is still not very low, Nathan decides to buy the headphones.

The situation described above is an example of the "anchoring effect." The price mentioned first affects our opinion of prices mentioned afterwards. For example, if we start with $200, then $160 will seem cheap (b)__________. (c)__________, as the difference of the two prices becomes bigger, the effect will be more powerful. (d)__________, the price mentioned first acts as an "anchor" that fixes our thoughts about the price of an item.`,
      questions: [
        {
          id: 16,
          type: 'mc',
          question: '(A)~(B)의 밑줄 친 동사 ⓐ~ⓔ 중 어법상 옳은 것은?',
          options: ['① ⓐ', '② ⓑ', '③ ⓒ', '④ ⓓ', '⑤ ⓔ'],
          answer: 3,
        },
        {
          id: 17,
          type: 'mc',
          question:
            '(C)의 빈칸 (a)~(d)에 쓸 수 있는 표현이 아닌 것은?',
          options: [
            '① Since',
            '② Even if',
            '③ Like this',
            '④ Furthermore',
            '⑤ In comparison',
          ],
          answer: 1,
        },
        {
          id: 18,
          type: 'mc',
          question: '위의 글을 읽고 답할 수 없는 질문은?',
          options: [
            '① How is the sale price set?',
            '② Why do we want to buy what our friends have?',
            '③ What influences us when it comes to buying things?',
            '④ Why do we buy things that we don\'t even want or need?',
            '⑤ What acts as an anchor that fixes our thoughts about the price of an item?',
          ],
          answer: 1,
        },
      ],
    },
    // Section 10: Space / ISS Q&A passage (Question 19)
    {
      passage: `Q1: Why do astronauts have to wear spacesuits when they go outside?
A1: Because there is no oxygen in space, they can't breathe. Spacesuits have oxygen tanks that allow astronauts to breathe. They protect astronauts from space dust, as well. Space dust may not sound very dangerous, but even a tiny little bit of space dust can hurt astronauts.

Q2: How do astronauts have meals in space?
A2: Astronauts eat three meals a day and the meals are very similar to the ones we eat on Earth. There are many types of food and drink for astronauts to eat such as fruit, chicken, orange juice, and so on. Space food must be light, well packaged, and fast to serve.

Q3: Do astronauts need exercise in space?
A3: On Earth, the muscles and bones work hard to support the body because of gravity. But in space, the body does not have to work as hard as on Earth, since there is very little gravity. So, the muscles and bones get weak in space. In order to keep their bones and muscles strong, astronauts need to exercise. Astronauts work out for two hours every day using exercise machines.

Q4: How do astronauts spend their free time?
A4: They spend their free time in the same way that they would on Earth by reading books, listening to music, playing cards, or talking to their families, etc. But one thing that people on Earth can't do is seeing some incredible sights. Astronauts can see Earth and the stars through the windows of the ISS. So they spend their time enjoying the view and taking pictures.`,
      questions: [
        {
          id: 19,
          type: 'mc',
          question: '글의 내용과 일치하는 것은? (정답 2개)',
          options: [
            '① Life in the ISS is quite busy, so astronauts cannot enjoy enough free time.',
            '② The meals that astronauts have are totally different from what we have on Earth.',
            '③ Spacesuits protect astronauts from space dust and allow them to breathe with oxygen tanks.',
            '④ Astronauts do not have to work out every day because their bodies spend less energy in space.',
            '⑤ The reason astronauts\' muscles and bones are weaker in space is because of the reduced gravity.',
          ],
          answer: [3, 5],
        },
      ],
    },
    // Section 11: Dialogue - 3D printer in space (Question 20)
    {
      passage: `A: Have you heard that NASA is going to send a 3D printer into space?
B: They're going to send a 3D printer into space? Why?
A: I've heard that the 3D printer will be used to print out food for astronauts.
B: __________
A: Yes, it's possible. It can print out a fresh pizza in less than five minutes.
B: Really? I wonder what it would taste like.`,
      questions: [
        {
          id: 20,
          type: 'mc',
          question: '내용상 대화의 빈칸에 알맞은 말은?',
          options: [
            '① Is it possible to send food into space?',
            '② Is it possible to print paper in a spaceship?',
            '③ Is it possible to repair a 3D printer in space?',
            '④ Is it possible to print out food using a 3D printer?',
            '⑤ Is it possible to eat a hamburger or pizza in space?',
          ],
          answer: 4,
        },
      ],
    },
    // Section 12: Wormhole / space travel dialogue (Questions 21-23)
    {
      passage: `Sci Teen: Hi, science fans. Today, we're going to talk about space travel. As we all know, there is nothing faster than light in the universe. So, ⓐif we travel at the speed of light, we should be able to get to another planet in the blink of an eye, right?

Dr. Sci: That would be nice, but space is so vast that it is not possible. In the movie, Passengers, a spaceship headed to a different planet travels at one-half the speed of light. So it should get to another planet very quickly, right? But, the passengers sleep for 120 years because it is expected to take that much time to get to a different planet.

Sci Teen: 120 years? Wow, that's a long time! Is there a faster way to travel through space?

Dr. Sci: Well, in order to answer that question, I'd like you to think about this apple for a second. Imagine a worm is on this apple. It detects something sweet at the bottom and wants to move from the top to the bottom. For the worm, the apple's surface is as vast as our universe. Now the worm can either move around the outer layer or down a wormhole. ⓑIf you are the worm, which will you choose? Maybe the wormhole, because it is a shortcut.

Sci Teen: Is there such a shortcut in the universe?

Dr. Sci: According to some researchers, yes. Einstein figured out that space and time are (A) connecting / connected and he called it space-time. He thought that space-time could actually be bent. When it is bent, parts that are far away from each other are suddenly closer. To understand this, take a sheet of paper and make a small dot at the top of the paper and another at the bottom of the paper. On a flat sheet of paper, the dots are far away from one another. Now, take the paper and fold it with the dots matched up. Punch a hole in the paper and the dots will be instantly (B) connecting / connected. Like this, wormholes in space may contain two mouths, with a throat (C) connecting / connected the two.

Sci Teen: Just like a wormhole in the apple, right? ⓒIf such wormholes existed in space, we could get to places billions of light-years away quickly!

Dr. Sci: Yes, but it's too early to celebrate. Wormholes exist in theory only.

Sci Teen: So all we need to do is find one, right?

Dr. Sci: Even if we find one, there are many things to consider before actually going through one. A wormhole would be very unstable. ⓓIf a spaceship flew into one, it might be crushed or broken into pieces.`,
      questions: [
        {
          id: 21,
          type: 'mc',
          question: '(A), (B), (C)에 들어갈 말로 옳은 것끼리 짝지어진 것은?',
          options: [
            '① connecting, connecting, connecting',
            '② connecting, connected, connecting',
            '③ connecting, connecting, connected',
            '④ connected, connected, connecting',
            '⑤ connected, connecting, connected',
          ],
          answer: 4,
        },
        {
          id: 22,
          type: 'mc',
          question: '대화 내용을 잘못 이해한 사람은?',
          options: [
            '① Jin: Wormholes have been found to have two mouths.',
            '② J-hope: Traveling through a wormhole might be dangerous.',
            '③ RM: It was Einstein who thought of the concept of \'space-time\' that could be bent.',
            '④ Jeongguk: There can be a shortcut to travel through space, like a wormhole in an apple.',
            '⑤ Jimin: Even if we travel at the speed of light, it will take a very long time to get to another planet.',
          ],
          answer: 1,
        },
        {
          id: 23,
          type: 'subjective',
          question:
            '위 대화의 밑줄 친 ⓐ~ⓓ 중 어법상 오류가 있는 문장 1개를 찾아 괄호 안에 번호를 쓰고, 오류를 수정하여 문장 전체를 다시 쓰시오.',
          answer:
            'ⓑ, If you were the worm, which would you choose?',
        },
      ],
    },
  ],
};
