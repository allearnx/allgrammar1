import type { ExamSet } from './types';

export const m3Dongayun: ExamSet = {
  id: 'm3-dongayun',
  label: '중3 동아(윤)',
  grade: 3,
  sections: [
    // Q1 — 대화 순서 배열
    {
      questions: [
        {
          id: 1,
          type: 'mc',
          question:
            '다음 두 사람의 대화를 바르게 나열한 것은?[4과]\n\n(A) Thank you.\n(B) Here you are.\n(C) Large, please.\n(D) Hello. Are you looking for anything special?\n(E) Sure. What size would you like?\n(F) No, I\'m not. I\'d like to exchange this T-shirt. It\'s too small.',
          options: [
            '① (B) - (A) - (E) - (C) - (D) - (F)',
            '② (B) - (E) - (C) - (F) - (D) - (A)',
            '③ (D) - (B) - (C) - (F) - (A) - (E)',
            '④ (D) - (C) - (E) - (B) - (F) - (A)',
            '⑤ (D) - (F) - (E) - (C) - (B) - (A)',
          ],
          answer: 5,
        },
      ],
    },
    // Q2 — 어법상 올바른 것
    {
      questions: [
        {
          id: 2,
          type: 'mc',
          question:
            '다음 (A)~(E) 중 어법상 올바른 것을 있는 대로 고른 것은?[3과]\n\n(A)The word sandwich comes from John Montagu, who was the 4th Earl of Sandwich. (B)He enjoyed eat meat between two slices of bread (C)because of he could play a card game while he was eating. (D)People thought that it was a great idea. (E)So they began to call such food a sandwich after him.',
          options: [
            '① (A), (E)',
            '② (A), (B), (C)',
            '③ (A), (D), (E)',
            '④ (B), (C), (D)',
            '⑤ (C), (D), (E)',
          ],
          answer: 3,
        },
      ],
    },
    // Q3 — 대화 흐름과 어법
    {
      questions: [
        {
          id: 3,
          type: 'mc',
          question:
            '다음 대화의 흐름과 어법상 올바른 것은?[4과]\n\n① A: Hello. Do you need some help?\nB: OK. Was there anything wrong with it?\nA: Here it is. I buy it three days ago.\nB: Oh, then it\'s possible.\n\n② A: Hello. May I help you?\nB: Yes, please. I\'d like to get a refund for this watch.\nA: Ok, I\'ll help you with that. Was there anything wrong with it?\nB: No, I just changed my mind. Can I get my money back?\n\n③ A: Hello. What can I do for you?\nB: Can I change this black umbrella for different color?\nA: Sure. What color would you like?\nB: I\'d like to a yellow one, please.\n\n④ A: Excuse me. I\'d like to refund for this alarm clock.\nB: OK. Is there anything wrong with it?\nA: It doesn\'t works.\nB: I see.\n\n⑤ A: Hello. What can I do for you?\nB: Can I have my money back? These shoes are too small for me.\nA: Yes, I do.',
          options: [
            '① ①',
            '② ②',
            '③ ③',
            '④ ④',
            '⑤ ⑤',
          ],
          answer: 2,
        },
      ],
    },
    // Q4 — 어법상 올바르지 않은 문장
    {
      passage:
        'ⓐThe word hamburger originally comes from Hamburg, Germany\'s second-largest city. ⓑHamburger means "people or things from Hamburg" in German. ⓒThe origin of the first hamburger is not clear. ⓓHowever, it is believe that the hamburger was invented in a small town in Texas. ⓔA cook placed a Hamburg-style steak between two slices of bread, and people started to call such food a hamburger.',
      questions: [
        {
          id: 4,
          type: 'mc',
          question: '다음 중 어법상 올바르지 않은 문장은?[3과]',
          options: ['① ⓐ', '② ⓑ', '③ ⓒ', '④ ⓓ', '⑤ ⓔ'],
          answer: 4,
        },
      ],
    },
    // Q5~Q6 — shampoo 지문 공유
    {
      passage:
        'The word shampoo comes from the Hindi word champo, which means "to press." In India, the word was used (A)____________ a head massage. British traders in India experienced a head massage and introduced it to Britain in the 18th century. The meaning (B)____________ the word shampoo changed a few times after it first entered English around 1762. In the 19th century, shampoo got its present meaning of "washing the hair." Shortly after that, the word began to be also used (A)____________ a special soap (C)____________ the hair.',
      questions: [
        {
          id: 5,
          type: 'mc',
          question: '윗글을 읽고 알 수 없는 것은?',
          options: [
            '① champo의 뜻은 \'누르다\'이다.',
            '② Shampoo라는 단어는 Hindi 단어에서 왔다.',
            '③ 영국 무역상들은 머리 마사지를 곁들인 목욕을 영국에서도 경험했다.',
            '④ Shampoo라는 단어의 현재의 뜻은 \'머리카락을 씻다.\'라는 뜻이다.',
            '⑤ Shampoo라는 단어는 영어에 들어온 후 그 의미가 여러 번 바뀌었다.',
          ],
          answer: 3,
        },
        {
          id: 6,
          type: 'mc',
          question:
            '윗글의 흐름에 맞게 (A)~(C)에 들어갈 가장 알맞은 단어는?',
          options: [
            '① in / to / for',
            '② in / of / by',
            '③ by / to / for',
            '④ for / of / for',
            '⑤ for / to / by',
          ],
          answer: 4,
        },
      ],
    },
    // Q7 — 단어와 뜻 연결
    {
      questions: [
        {
          id: 7,
          type: 'mc',
          question:
            '다음 중 단어와 단어의 뜻이 바르게 연결된 것은?[3과]',
          options: [
            '① tight: unlimited or restricted',
            '② remaining: situation of having a problem',
            '③ donate: to give money to a group that needs help',
            '④ charity: the money you have in your bank account',
            '⑤ effort: work that you do when you are not trying to achieve something',
          ],
          answer: 3,
        },
      ],
    },
    // Q8 — France 지문
    {
      passage:
        'France is a country is Western Europe. England once was ruled (A)__________ a king who spoke only French. Naturally, many French words were borrowed into English. (B)__________ this period. In particular, many French words related to (C)__________ were borrowed such as judge and justice.',
      questions: [
        {
          id: 8,
          type: 'mc',
          question:
            '다음 글의 흐름과 어법에 맞게 (A)~(C)에 들어갈 가장 알맞은 단어는?[추가 독해프린트]',
          options: [
            '① by / during / law',
            '② by / while / law',
            '③ to / during / music',
            '④ to / while / music',
            '⑤ to / while / law',
          ],
          answer: 1,
        },
      ],
    },
    // Q9~Q11 — hurricane 지문 공유
    {
      passage:
        'ⓐThe word hurricane come from the Spanish word huracán, and it originates from the name of a Mayan god. ⓑIn the Mayan creation myth, Huracán is the weather god of wind, storm, and fire, and he is one of the three gods who created humans. However, ⓒthe first humans angered the gods, so Huracán caused a great flood. The first Spanish contact (A)__________ the Mayan civilization was in 1517. ⓓSpanish explorers who were pass through the Caribbean experienced a hurricane and picked up the word for the people in the area. ⓔIn English, one of the early uses of hurricane were in a play in Shakespeare in 1608.',
      questions: [
        {
          id: 9,
          type: 'mc',
          question:
            '윗글의 ⓐ~ⓔ 중 글의 흐름과 어법상 올바른 것은?',
          options: ['① ⓐ', '② ⓑ', '③ ⓒ', '④ ⓓ', '⑤ ⓔ'],
          answer: 1,
        },
        {
          id: 10,
          type: 'mc',
          question:
            '윗글의 흐름에 맞게 (A)에 들어갈 가장 알맞은 단어는?',
          options: ['① by', '② in', '③ up', '④ from', '⑤ with'],
          answer: 5,
        },
        {
          id: 11,
          type: 'mc',
          question: '윗글에서 찾을 수 있는 단어의 뜻은?',
          options: [
            '① a lot of water that covers land',
            '② a storm with very strong fast winds',
            '③ communication between people, countries',
            '④ the action of pressing and rubbing someone\'s body to help him or her relax',
            '⑤ someone who is owned by another person and is forced to work for no money',
          ],
          answer: 2,
        },
      ],
    },
    // Q12~Q16 — robot 지문 + zombie 지문 공유 (pages 3-4)
    // robot 지문
    {
      passage:
        'ⓐThe word robot comes from the play R.U.R., which was written in 1920. ⓑIn the play, robots are machines that look like humans. ⓒThey are designed to work for humans and are produced in a factory. ⓓIt is interesting that the idea of using the word robot didn\'t come from Karel Čapek himself. ⓔHe originally called the machines in his play labori from the Latin word for "work." ⓕHowever, his brother suggested roboti, which mean "slave workers" in Czech. ⓖKarel Čapek liked the idea and decided to use the word roboti. ⓗIn 1938, the play was made into a science fiction show on television in Britain.',
      questions: [
        {
          id: 12,
          type: 'mc',
          question:
            '윗글의 ⓐ~ⓗ 중 글의 흐름과 어법상 올바른 것을 있는 대로 고른 것은?',
          options: [
            '① ⓒ, ⓓ, ⓖ',
            '② ⓐ, ⓑ, ⓔ, ⓕ',
            '③ ⓐ, ⓒ, ⓓ, ⓖ',
            '④ ⓑ, ⓔ, ⓕ, ⓗ',
            '⑤ ⓐ, ⓒ, ⓓ, ⓖ, ⓗ',
          ],
          answer: 4,
        },
      ],
    },
    // Q13 — Italy 지문
    {
      passage:
        'ⓐItaly is a country in Europe. ⓑItalian people love music. ⓒMany famous musicians such as Giuseppe Verdi and Giacomo Puccini are Italian. ⓓMany vegetables like the tomato and the potato are originally from South America. ⓔThe piano and violin were invented in Italy a long time ago.',
      questions: [
        {
          id: 13,
          type: 'mc',
          question: '다음 글의 흐름상 어색한 문장은?[4과]',
          options: ['① ⓐ', '② ⓑ', '③ ⓒ', '④ ⓓ', '⑤ ⓔ'],
          answer: 1,
        },
      ],
    },
    // zombie 지문 — Q14, Q15, Q16
    {
      passage:
        'According to the Oxford English Dictionary, the word zombie comes from West Africa. The word zombie originally refers to the "snake god" in the Voodoo religion in West Africa. When people from West Africa were brought to Haiti and parts of the Caribbean during the 18th and early 19th centuries, they maintained their religion and the idea of the zombie gradually spread and the idea of the zombie gradually spread in the United States and Europe. In the 20th century, it became a popular theme of fictions and films. (A)어떻게 단어 \'zombie\'가 현재의 의미를 가지게 되었는지는 분명하지 않다, but (B)it is generally thought that it is related to a Voodoo witchcraft of reviving dead people.\n\n*religion 종교 **Voodoo 부두교 ***witchcraft 마술, 요술 ****revive 부활시키다',
      questions: [
        {
          id: 14,
          type: 'mc',
          question:
            '윗글의 밑줄 친 (A)의 우리말을 바르게 영작한 것은?',
          options: [
            '① How the word zombie came to have the present meaning not is clear.',
            '② It is not clear how the word zombie came to have the present meaning.',
            '③ It is not clear the word zombie how came to have the present meaning.',
            '④ It is not clear how zombie came the word to have the present meaning.',
            '⑤ How the word zombie came to is not clear have the present meaning.',
          ],
          answer: 3,
        },
        {
          id: 15,
          type: 'mc',
          question: '윗글에서 찾을 수 있는 단어의 뜻은?',
          options: [
            '① in the beginning',
            '② to learn a new skill without intending to',
            '③ a sum of money which is returned to you',
            '④ a society that is well organized and developed',
            '⑤ a substance that you use with water to wash yourself',
          ],
          answer: 5,
        },
        {
          id: 16,
          type: 'mc',
          question:
            '윗글의 밑줄 친 (B)와 같은 쓰임으로 사용된 것은?',
          options: [
            '① It is cloudy outside.',
            '② It is not that far from here.',
            '③ It is quite dark in my room.',
            '④ It makes me happy to listen to music.',
            '⑤ She lost her bag and she couldn\'t find it.',
          ],
          answer: 5,
        },
      ],
    },
    // Q17~Q19 — Dr. Money 대화 지문
    {
      passage:
        'Q: _______________ I\'m Jason. (A)_______________\nA: Hi, I\'m Dr. Money. Let\'s look at your spending diary. ⓐYou used up most of your money at the beginning of the week. Here\'s my tip. ⓑDon\'t carry around all of your weekly allowance. Divide the money into days. ⓒThen carry only the money you need for each days.\n\nQ: Hello. Dr. Money. I\'m Steve. I (B)_______________.\nA: Let\'s see. ⓓIn the last few week, you spent 80% of your allowance and only saved 20%. ⓔI think you\'ve been spent too much. To save money, you need to have a tighter budget. For example, you can follow the 50%-40%-10% rule. Save 50%, spend 40%, and donate the remaining 10% to charity. ⓕBy follow the rule, you can manage your money better. Then you can save money faster to buy the ticket.\n\nQ: I\'m Minji. (C)_______________.\nA: ⓖBuying things on sale are good if you buy things you need. ⓗIn your case, the problem is that you buy things you don\'t even need. Here\'s some advice. Before you buy something, ask ⓘyourself, "Do I really need this?" Also, before you go shopping, make a shopping list. Don\'t buy items that aren\'t on the list even if they\'re on sale. Then you won\'t buy things on the spot.',
      questions: [
        {
          id: 17,
          type: 'mc',
          question:
            '위 대화의 흐름에 맞게 (A)~(C)에 들어갈 알맞은 고민을 <보기>에서 바르게 고른 것은?\n\n<보기>\nⓐ I get a weekly allowance, but I never have enough. By Thursday, all of my money is gone. I don\'t know how to solve this problem.\nⓒ I like to buy things on sale. If something\'s on sale, I buy it although I don\'t need it. Last week, I bought two T-shirts on sale, but I already have many.\nⓔ For me, it is hard to save money. For example, I\'ve been saving to go to my favorite singer\'s concert for the last two months. However, I still don\'t have enough money. I don\'t know what to do.',
          options: [
            '① ⓐ / ⓒ / ⓔ',
            '② ⓐ / ⓔ / ⓒ',
            '③ ⓒ / ⓐ / ⓔ',
            '④ ⓒ / ⓔ / ⓐ',
            '⑤ ⓔ / ⓒ / ⓐ',
          ],
          answer: 4,
        },
        {
          id: 18,
          type: 'mc',
          question:
            '위 대화의 ⓘ와 다음 밑줄 친 부분 중 같은 쓰임으로 사용된 것은?',
          options: [
            '① He himself made it.',
            '② I will take care of it myself.',
            '③ I went to the museum myself.',
            '④ The man told me about himself.',
            '⑤ They prepared the party themselves.',
          ],
          answer: 2,
        },
        {
          id: 19,
          type: 'mc',
          question:
            '위 대화의 ⓐ~ⓗ 중 어법상 올바른 것을 있는 대로 고른 것은?',
          options: [
            '① ⓐ, ⓑ, ⓗ',
            '② ⓐ, ⓑ, ⓖ, ⓗ',
            '③ ⓑ, ⓒ, ⓓ, ⓕ',
            '④ ⓐ, ⓑ, ⓒ, ⓖ, ⓗ',
            '⑤ ⓒ, ⓓ, ⓔ, ⓕ, ⓖ',
          ],
          answer: 1,
        },
      ],
    },
    // Q20 — money survey 지문
    {
      passage:
        'How smart are you (A)__________ your money? These are the results of a survey of 100 students. We first asked students "Are you smart (A)__________ your money?" As Graph 1 shows, 70% answered "No" while 30% answered "Yes." We then asked the students who answered "No" what their biggest money worry is. As Graph 2 shows, 60% think they don\'t have enough allowance while 28% think they have difficulty (B)__________ money. Lastly, 12% said they spent money (C)__________ things they didn\'t need.',
      questions: [
        {
          id: 20,
          type: 'mc',
          question:
            '다음 글의 흐름에 맞게 (A)~(C)에 들어갈 가장 알맞은 것은?[추가 독해프린트]',
          options: [
            '① by / saving / in',
            '② by / to save / on',
            '③ with / saving / on',
            '④ with / save / on',
            '⑤ with / to save / to',
          ],
          answer: 4,
        },
      ],
    },
    // Q21~Q23 — emotional health 지문
    {
      passage:
        'Have you been feeling sad? ⓐ당신은 스트레스를 너무 많이 받아서 잠이 들기까지 많은 시간이 걸리나요? (A)Then you may be emotional unhealthy. (B)There are many way to improve your emotional health. (C)Notice what make you sad and let your friends know how you feel. (D)Keep negative feelings inside can cause problems in your relationships. (E)Also, think before you act. (F)Try to be calm before you say or do something you might regret. Take care of your physical health, too, because it can affect your emotional health. (G)Exercise regularly, eat healthy meals. In addition, (H)We are socially animals and need positive connections with others. Spend time with healthy, positive people. Make new friends, and join a club.',
      questions: [
        {
          id: 21,
          type: 'mc',
          question:
            '윗글에서 언급된 정서적 건강을 향상시키기 위한 방법이 아닌 것은?',
          options: [
            '① 충분히 잠자기',
            '② 새로운 친구들 만들기',
            '③ 신체적인 건강 챙기기',
            '④ 행동하기 전에 생각하기',
            '⑤ 기분이 어떤지 친구들에게 알리기',
          ],
          answer: 1,
        },
        {
          id: 22,
          type: 'mc',
          question: '윗글의 ⓐ의 우리말을 바르게 영작한 것은?',
          options: [
            '① Are you so stress that it takes hours to fall asleep?',
            '② Are you too stressed that it take hours to fall asleep?',
            '③ Are you so stress out that takes hours to fall asleep?',
            '④ Are you so stressed out that it takes hours to fall along?',
            '⑤ Are you so stressed out that it takes hours to fall asleep?',
          ],
          answer: 5,
        },
        {
          id: 23,
          type: 'mc',
          question:
            '윗글의 (A)~(H) 중 글의 흐름과 어법상 올바르지 않은 문장을 있는 대로 고른 것은?',
          options: [
            '① (A), (C), (H)',
            '② (A), (B), (C), (G)',
            '③ (B), (E), (F), (G)',
            '④ (A), (B), (C), (D), (H)',
            '⑤ (C), (D), (E), (F), (H)',
          ],
          answer: 4,
        },
      ],
    },
    // Q24~Q25 — 대화 지문 (Jiho and Lucy)
    {
      passage:
        'G: ⓐThank you everything, Jiho. I had a great time in Korea.\nB: My pleasure. Please come visit me again, Lucy.\nG: I\'d love to, but before I do, ⓑI\'d like to invite you visit me in London.\nB: Thanks. Anyway ⓒit\'s too bad that you can\'t come to my soccer game tomorrow.\nG: ⓓI\'m sorry that I can stay longer. I\'ll keep my fingers crossed for you.\nB: Excuse me, but can you please say that again?\nG: I said, "I\'ll keep my fingers crossed for you." It means "(A)_______________"\nB: Oh. Thanks. Have a nice trip.\nG: Thanks. ⓔI\'ll keep to touch.',
      questions: [
        {
          id: 24,
          type: 'mc',
          question: '위 대화의 빈칸 (A)에 들어갈 알맞은 것은?',
          options: [
            '① I feel happy.',
            '② Let\'s hang out.',
            '③ I like something.',
            '④ I\'ll play it by ear.',
            '⑤ I wish you good luck.',
          ],
          answer: 5,
        },
        {
          id: 25,
          type: 'mc',
          question:
            '위 대화의 ⓐ~ⓔ 중 대화의 흐름과 어법상 가장 올바른 것은?',
          options: ['① ⓐ', '② ⓑ', '③ ⓒ', '④ ⓓ', '⑤ ⓔ'],
          answer: 3,
        },
      ],
    },
    // Q26 — 대화 지문 (refund for cap)
    {
      passage:
        'M: Hello. May I help you?\nG: Yes, please. I\'d like to get a refund for this cap.\nM: Do you have the receipt?\nG: No, I don\'t. I received it as a gift.\nM: If you don\'t have the receipt, then, it\'s not possible to get a refund.\nG: I see. Then, can I exchange it for something else?\nM: Yes, you can. What would you like to get?\nG: I want to get this blue bag.\nM: Let me see... The price is the same, so you can just take it.\nG: Thank you.\n\nM: Man G: Girl',
      questions: [
        {
          id: 26,
          type: 'mc',
          question: '다음 대화를 읽고 알 수 없는 것은?[4과]',
          options: [
            '① 소녀는 모자를 환불받고 싶어 했다.',
            '② 모자는 소녀가 선물로 받은 것이다.',
            '③ 소녀는 선물과 함께 영수증도 받았다.',
            '④ 환불받기 위해서는 영수증이 필요하다.',
            '⑤ 소녀는 모자를 가방으로 교환할 수 있었다.',
          ],
          answer: 3,
        },
      ],
    },
    // Q27~Q28 — Minho online shopping 지문
    {
      passage:
        'Minho: I like to buy things online. I think we can buy things more cheaply online than in a store. Am I a smart shopper?\n\nAdviser: Your spending diary shows that you\'ve been shopping online a lot. You may think online shopping is smart since things are generally cheaper there than at a regular store. Online shopping, however, has some dangers, too. For example, when you shop online, you have to consider shipping costs. Last week you bought two toothbrushes online. Although one toothbrush cost 2,000 won, 500 won cheaper than in a store, the shipping cost for them was half the price of the two toothbrushes. So although the price of the toothbrushes was cheaper online, the total price you paid was more than the one you may pay in a store. (A)그래서 당신을 위한 나의 충고는 당신이 온라인에서 쇼핑할 때 배송비를 고려하라는 것이다.',
      questions: [
        {
          id: 27,
          type: 'mc',
          question:
            '윗글의 (A)의 우리말에 맞게 바르게 영작한 것은?',
          options: [
            '① So my advise for you is considering the shipping costs when shop.',
            '② So my advice you is consider the shipping costs when you shop online.',
            '③ So my advice you is to consider the shipping costs when you shop online.',
            '④ So my advice for you is to consider the shipping costs when you shop online.',
            '⑤ Therefore my advices for you are consider the shipping costs when you shop online.',
          ],
          answer: 4,
        },
        {
          id: 28,
          type: 'mc',
          question: '윗글의 내용과 일치하지 않는 것은?',
          options: [
            '① Minho enjoys shopping online.',
            '② The price of a toothbrush online was 500 won cheaper than in a store.',
            '③ Minho was able to save 1,000 won by buying two toothbrushes online.',
            '④ The adviser tells Minho that online shopping has some dangers, like shipping costs.',
            '⑤ Minho thinks that buying things online is generally cheaper than buying them in regular stores.',
          ],
          answer: 5,
        },
      ],
    },
  ],
};
