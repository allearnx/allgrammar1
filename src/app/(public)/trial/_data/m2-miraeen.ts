import type { ExamSet } from './types';

export const m2Miraeen: ExamSet = {
  id: 'm2-miraeen',
  label: '중2 미래엔',
  grade: 2,
  sections: [
    {
      questions: [
        {
          id: 1,
          type: 'mc',
          question: '두 사람의 대화가 가장 자연스러운 것은?',
          options: [
            '① B: What are you doing? G: Thanks.',
            '② B: Is something wrong? G: I have to give a speech in English. I\'m so nervous.',
            '③ M: Excuse me, where is women\'s shoes? W: Thank you.',
            '④ M: Can I help you? W: They\'re on the third floor, next to the restroom.',
            '⑤ G: Tomorrow is my mom\'s birthday. What should I do for her? B: Thanks! I\'m sure your mom will love your birthday.',
          ],
          answer: 2,
        },
        {
          id: 2,
          type: 'mc',
          question: '어법상 올바른 문장은?',
          options: [
            '① Each students play the guitar.',
            '② I\'ll call you after I\'ll get home.',
            '③ He hasn\'t smoked since last week.',
            '④ I don\'t like the movies which has sad endings.',
            '⑤ Look at the boy and his dog which are walking in the park.',
          ],
          answer: 3,
        },
      ],
    },
    {
      passage: 'Sejong National Library is in Sejong, Korea. It is a four-story building that looks like an open book. It has about 400 thousand books on the first and second floors and a large cafeteria on the top floor. It opened in 2013. Since then, many people have visited this unique building.',
      questions: [
        {
          id: 3,
          type: 'mc',
          question: '건물에 대한 설명과 일치하지 않는 것은?',
          options: [
            '① 국립 도서관이다.',
            '② 2013년에 개관했다.',
            '③ 지하에 식당이 있다.',
            '④ 약 40만 권의 책이 있다.',
            '⑤ 책이 있는 곳은 1, 2층이다.',
          ],
          answer: 3,
        },
      ],
    },
    {
      passage: 'From the sky in a part of southern China, you can see round roofs that look like big doughnuts. They are the roofs of the big round houses of the Hakka people. They have lived in houses like these for about a thousand years and they built the houses to protect themselves from enemies. The houses have only one gate without any windows on the first floor. Each house is big enough for a whole village. It usually has four stories. It has kitchens on the first floor, storage rooms on the second floor, and living rooms and bedrooms on the third and fourth floors.',
      questions: [
        {
          id: 4,
          type: 'mc',
          question: '글을 읽고 한 질문과 답이 올바르지 않은 것은?',
          options: [
            '① Who built the big round houses? → The Hakka people built them.',
            '② Where can we see the roofs? → We can see them from the sky in a part of southern China.',
            '③ What do the roofs look like? → They look like big doughnuts.',
            '④ Why did the Hakka people build these houses? → They built these houses to protect themselves from cold weather.',
            '⑤ How long have the Hakka people lived in the big round houses? → They have lived there for about a thousand years.',
          ],
          answer: 4,
        },
      ],
    },
    {
      passage: 'In Norway, we can see animals on roofs. Norway has large forests. In harmony with nature, people have built wooden houses for a long time. To build strong and warm houses, they cover their roofs with grass. The grass roofs protect them from the long cold winters and strong winds. Sometimes, trees or plants grow out of the grass roofs, and some animals enjoy their meals there.',
      questions: [
        {
          id: 5,
          type: 'mc',
          question: '글을 읽고 답할 수 있는 질문은?',
          options: [
            '① Which month is the coldest in Norway?',
            '② How do people in Norway cover their roofs with grass?',
            '③ How many trees can we find on the grass roofs?',
            '④ Why do people in Norway cover their roofs with grass?',
            '⑤ What kinds of animals can we see on the grass roofs?',
          ],
          answer: 4,
        },
      ],
    },
    {
      passage: '(A)A roof is a essential part of a house. (B)but long ago some people has built roofs only to take them down easily. (C)Centuries ago in southern Italy, (D)people which had a house without a roof paid lower taxes. (E)To avoid high taxes on their houses, (가) 몇몇 사람들은 돌들을 쌓아 올려 원뿔 모양의 지붕들을 지었다. (F)When tax collectors came to the town, people took their roofs down quickly.',
      questions: [
        {
          id: 6,
          type: 'mc',
          question: '(A)~(F)중 어법상 올바른 것으로만 모두 고른 것은?',
          options: [
            '① (A), (C), (E)',
            '② (C), (E), (F)',
            '③ (A), (B), (D), (F)',
            '④ (A), (C), (E), (F)',
            '⑤ (B), (C), (D), (E)',
          ],
          answer: 2,
        },
        {
          id: 7,
          type: 'subjective',
          question: '(가)의 우리말을 주어진 단어를 모두 활용하여 영작하시오. (10단어 이내, cone-shaped는 두 단어)\n\n몇몇 사람들은 돌들을 쌓아 올려 원뿔 모양의 지붕들을 지었다.\n(build, cone-shaped, some, up)',
          answer: 'Some people built cone-shaped roofs by piling up stones.',
        },
      ],
    },
    {
      passage: 'Do you have a real friend? Last week, I (A)(was/wasn\'t) very busy and didn\'t have time to do my math homework. So, before class, I asked one of my friends to show me his homework. Then (B)(other/another) friend of mine, Sujin, said, "You shouldn\'t do that. If you copy, you will not learn anything!" At first, I was a little (C)(happy/upset) because Sujin\'s words hurt my feelings. But later, I realized that she was trying (D)(helping/to help) me. She was right. I should do my homework myself. (E)오직 진짜 친구만이 너의 얼굴이 더러울 때 너에게 말해준다.',
      questions: [
        {
          id: 8,
          type: 'mc',
          question: '글의 내용과 어법상 알맞은 것을 고른 것은?\n\n(A) was/wasn\'t | (B) other/another | (C) happy/upset | (D) helping/to help',
          options: [
            '① was / other / happy / to help',
            '② wasn\'t / another / upset / helping',
            '③ wasn\'t / other / upset / helping',
            '④ was / another / happy / helping',
            '⑤ was / another / upset / to help',
          ],
          answer: 5,
        },
        {
          id: 9,
          type: 'subjective',
          question: '(E)의 우리말에 맞게 주어진 단어를 모두 활용하여 재배열하시오.\n\n오직 진짜 친구만이 너의 얼굴이 더러울 때 너에게 말해준다.\n(a, dirty, face, is, friend, only, real, tell, when, you, your)',
          answer: 'Only a real friend tells you when your face is dirty.',
        },
      ],
    },
    {
      questions: [
        {
          id: 10,
          type: 'mc',
          question: 'Which of the following is an opinion?\n\nA. Spiders have about 6-8 eyes.\nB. 80 students have red back packs.\nC. Sea spiders have more than 8 legs.\nD. Birds have different colored feathers.\nE. Spiders are the most interesting animal to study.',
          options: ['① (A)', '② (B)', '③ (C)', '④ (D)', '⑤ (E)'],
          answer: 5,
        },
      ],
    },
    {
      passage: '(A)After I got home, I began writing a new graphic novel, Lunch Lady Begins. (B)In it, Lunch Lady is a superhero. (C)She rides a super scooter which it can fly. (D)She saves people from danger around the world. (E)She also makes 100 cookies per second and gives them away to hungry children. (F)A little days later, I showed my friends my graphic novel. "Awesome! I love this superhero. She\'s so cool," said all my friends. (G)"Guess what? I modeled her at Ms. Lee, one of our cafeteria workers," I told them.',
      questions: [
        {
          id: 11,
          type: 'mc',
          question: '(A)~(G)중 글의 내용과 어법상 올바른 것으로만 모두 고른 것은?',
          options: [
            '① (A), (B), (F)',
            '② (A), (B), (C), (E)',
            '③ (A), (B), (D), (E)',
            '④ (A), (B), (C), (F), (G)',
            '⑤ (B), (C), (D), (E), (G)',
          ],
          answer: 4,
        },
      ],
    },
    {
      passage: 'I showed my book (A)of Ms. Lee. She loved it, too. She also told me about her coworkers (B)that had special talents. Ms. Park, a (C)coworkers of Ms. Lee, won a dancing contest. Mr. Kim, the janitor at our school, was once an adventurous park ranger.\n\n"I\'d like (D)writing superhero stories about them. Do you think they\'ll like that?" I asked Ms. Lee.\n\n"Of course they will," she said (E)cheerful.\n\n[F]"가서 우리의 새로운 슈퍼히어로 친구들에게 인사하자."',
      questions: [
        {
          id: 12,
          type: 'mc',
          question: '(A)~(E)중 어법상 올바른 것은?',
          options: ['① (A)', '② (B)', '③ (C)', '④ (D)', '⑤ (E)'],
          answer: 2,
        },
        {
          id: 13,
          type: 'mc',
          question: '윗글의 내용과 일치하지 않는 것은?',
          options: [
            '① Mr. Kim is a park ranger.',
            '② Ms. Park works with Ms. Lee.',
            '③ Ms. Lee loved the writer\'s book.',
            '④ Ms. Park won a dancing contest.',
            '⑤ The writer wants to write superhero stories.',
          ],
          answer: 1,
        },
        {
          id: 14,
          type: 'subjective',
          question: '[F]의 우리말을 주어진 단어를 모두 활용하여 영작하시오. (10단어 이내)\n\n"가서 우리의 새로운 슈퍼히어로 친구들에게 인사하자."\n(Let\'s, hello, to)',
          answer: "Let's go and say hello to our new superhero friends.",
          acceptableAnswers: ["Let's go and say hello to our new superhero friends"],
        },
      ],
    },
    {
      passage: 'My aunt is my role model. I want to be like her. She is smart, strong, and adventurous. In her 30s, she traveled __(A)__ 70 different countries. While she was traveling the countries, she made friends from all over the world. (B)나는 꼭 그녀처럼 새로운 것을 시도하는 것을 두려워하지 않는 사람이 되고 싶다.',
      questions: [
        {
          id: 15,
          type: 'mc',
          question: '글의 흐름상 (A)에 들어갈 단어로 알맞은 것은?',
          options: ['① by', '② up', '③ to', '④ from', '⑤ without'],
          answer: 3,
        },
        {
          id: 16,
          type: 'mc',
          question: '윗글에서 사용된 단어의 뜻은?',
          options: [
            '① a room where you eat meals',
            '② willing to try new or difficult things',
            '③ in or from the south part of an area',
            '④ the head of the government in some countries',
            '⑤ to make something new from something that has been used before',
          ],
          answer: 2,
        },
        {
          id: 17,
          type: 'subjective',
          question: '(B)의 우리말에 맞게 주어진 단어를 모두 활용하여 재배열하시오.\n\n나는 꼭 그녀처럼 새로운 것을 시도하는 것을 두려워하지 않는 사람이 되고 싶다.\n(afraid, be, is, new, not, of, someone, that, to, things, try, want)',
          answer: 'I want to be someone that is not afraid of trying new things.',
        },
      ],
    },
    {
      passage: 'G: What are you doing, Jaden?\nB: I\'m drawing cartoons, Yuri.\nG: Really? Can I take a look at them?\nB: No, not yet.\nG: Why not? You can show me a few, (A)(can/can\'t) you?\nB: Well, I guess so.\nG: Awesome! I like your cartoons. You\'re really good (B)(at/for) drawing.\nB: I want to be a cartoonist, but I don\'t think my drawing skills are good enough.\nG: Your cartoons are really funny, and you have unique characters. I\'m sure you\'ll be a great cartoonist.\nB: Thank you. You just made (C)(my/your) day.',
      questions: [
        {
          id: 18,
          type: 'mc',
          question: '대화의 흐름상 알맞은 단어를 고른 것은?\n\n(A) can/can\'t | (B) at/for | (C) my/your',
          options: [
            '① can\'t / for / my',
            '② can\'t / at / your',
            '③ can / for / my',
            '④ can\'t / at / my',
            '⑤ can / at / your',
          ],
          answer: 4,
        },
      ],
    },
    {
      passage: 'Have you ever watched the TV cartoon The Simpsons? Maybe you are familiar (A) these characters. The Simpsons are an example of an American family. Some people think that the characters are bad role models. The father, Homer, has an important job at a company, but he is lazy. He also eats a lot of junk food. His son, Bart, is rude. Marge, the mother, is a very caring person. And their daughter, Lisa, is hardworking and helpful. The Simpsons argue (B) one another and have problems, but in the (C) they always make up and stay together. Real families aren\'t perfect. So, maybe the Simpsons aren\'t such bad role models after (D).',
      questions: [
        {
          id: 19,
          type: 'mc',
          question: '글의 흐름상 (A)~(D)에 들어갈 단어로 알맞은 것은?\n\n(A) | (B) | (C) | (D)',
          options: [
            '① with / of / end / all',
            '② to / with / air / up',
            '③ for / of / end / all',
            '④ to / with / end / all',
            '⑤ with / with / end / all',
          ],
          answer: 5,
        },
      ],
    },
    {
      passage: 'Some people think (A)that \'A good sport\' can mean a game, like baseball or soccer. But it can also mean a type of person. What kind of person is \'a good sport\'? \'A good sport\' is the person (B)that accepts both winning and losing well. If your team wins the baseball game, what do you say to the losing team? If you lose a board game with your brother, what do you do? Do you think (C)that you are a good sport? Being a good sport is not easy. Some people believe (D)that winning is the most important thing. They say, "Winner takes all," or "Nobody remembers second place." But losing happens to everyone. A good sport learns from the loser\'s mistakes when he/she wins. So how can you be a good sport? When you lose, don\'t get angry or upset. Congratulate the winner. Learn from the winner. When you win, don\'t be too confident. Encourage the loser. Learn from the loser\'s mistakes. Remember (E)that everyone loves a good sport!',
      questions: [
        {
          id: 20,
          type: 'mc',
          question: '글의 제목으로 알맞은 것은?',
          options: [
            '① Be a good sport',
            '② How to win a sport',
            '③ The two kinds of a sport',
            '④ How to play a good sport',
            '⑤ What you learn from a sport',
          ],
          answer: 1,
        },
        {
          id: 21,
          type: 'mc',
          question: '(A)~(E)중 쓰임이 다른 하나는?',
          options: ['① (A)', '② (B)', '③ (C)', '④ (D)', '⑤ (E)'],
          answer: 2,
        },
      ],
    },
    {
      questions: [
        {
          id: 22,
          type: 'mc',
          question: '단어와 단어의 뜻이 바르게 연결된 것은?',
          options: [
            '① nature: made by people',
            '② avoid: to accept something bad from happening',
            '③ without: having, using, or doing something, with someone',
            '④ dust: a powder of dirt or soil that you see on a surface or in the air',
            '⑤ harmony: a situation in which people are not that peaceful and disagree with each other',
          ],
          answer: 4,
        },
      ],
    },
    {
      passage: 'On May 25th, 2001, Erik Weihenmayer climbed to the top of Mt. Everest, the highest mountain in the world. It is also one of the hardest mountains to climb. Getting to the top of Mt. Everest was (A) harder for Erik. That is because Erik is blind. Monthly Mountain talked with Erik about (B) Mt. Everest.\n\nI: What was it like to get to the top of Mt. Everest?\nE: At first, I could not believe I was standing (C). I thought about my family and friends there.\nI: Why did you want to climb Mt. Everest?\nE: Because I\'m a mountain climber, and I love mountains. (가)에베레스트 산은 나에게 가장 도전적인 산이었다.\nI: What else do you like to do?\nE: I ski, and I also run marathons. People usually think blind people can\'t do those things, but that\'s not (D). I think they can do those things.\nI: And because of that, we admire you. Thank you for being with us today.',
      questions: [
        {
          id: 23,
          type: 'mc',
          question: '글을 읽고 알 수 없는 것은?',
          options: [
            '① Erik은 눈이 보이지 않는다.',
            '② 에베레스트산은 전 세계에서 가장 높은 산이다.',
            '③ 에베레스트산은 등반하기 힘든 산 중 하나이다.',
            '④ Erik은 정상으로 오르는 중에도 계속 그의 가족과 친구들을 생각했다.',
            '⑤ Erik은 눈이 보이지 않는 사람도 마라톤과 스키를 할 수 있다고 생각한다.',
          ],
          answer: 4,
        },
        {
          id: 24,
          type: 'mc',
          question: '(A)~(D)에 들어갈 것으로 올바른 것은?\n\n(A) | (B) | (C) | (D)',
          options: [
            '① even / climbing / there / so',
            '② very / to climb / here / too',
            '③ even / to climb / there / so',
            '④ very / climbing / here / too',
            '⑤ even / to climb / there / too',
          ],
          answer: 1,
        },
        {
          id: 25,
          type: 'mc',
          question: '밑줄 친 부분이 올바른 것은?',
          options: [
            '① She has broke her leg.',
            '② Time has flown so fast.',
            '③ I have never written a diary.',
            '④ Have you ever drew a picture?',
            '⑤ Someone has eaten my cookies.',
          ],
          answer: 5,
        },
        {
          id: 26,
          type: 'subjective',
          question: '(가)의 우리말을 주어진 단어를 모두 사용하여 영작하시오. (9단어 이내)\n\n에베레스트산은 나에게 가장 도전적인 산이었다.\n(challenging, for)',
          answer: 'Mt. Everest was the most challenging mountain for me.',
          acceptableAnswers: ['Mt. Everest was the most challenging mountain for me'],
        },
      ],
    },
    {
      questions: [
        {
          id: 27,
          type: 'subjective',
          question: '우리말에 맞게 주어진 단어를 모두 활용하여 영작하시오. (10단어 이내)\n\n그와 놀고 있는 그 아이들은 나의 사촌들이다.\n(children, play, the, who)',
          answer: 'The children who are playing with him are my cousins.',
        },
        {
          id: 28,
          type: 'subjective',
          question: '우리말에 맞게 주어진 단어를 모두 활용하여 질문을 영작하고, 그에 맞는 대답을 완전한 문장으로 적으시오. (숫자는 아라비아 숫자가 아닌 영어로 적을 것)\n\nQ: 당신은 당신의 제일 친한 친구를 얼마나 길게 알아왔나요? (best, have, know)\nA: ____',
          answer: 'Q: How long have you known your best friend? A: I have known her for ten years.',
          acceptableAnswers: [
            'How long have you known your best friend? I have known her for ten years.',
            'How long have you known your best friend? I have known him for ten years.',
          ],
        },
      ],
    },
  ],
};
