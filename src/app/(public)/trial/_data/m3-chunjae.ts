import type { ExamSet } from './types';

export const m3Chunjae: ExamSet = {
  id: 'm3-chunjae',
  label: '중3 천재(정)',
  grade: 3,
  sections: [
    // ── Q1: standalone dialogue ──
    {
      passage:
        'A: Why are you disappointed?\n' +
        "B: I didn't give a good presentation.\n" +
        'A: __________________. Your speech was a little fast, but I liked your presentation.\n' +
        'B: Do you think I should speak more slowly?\n' +
        'A: Yes. It will help your classmates understand better.',
      questions: [
        {
          id: 1,
          type: 'mc',
          question: '빈칸에 들어갈 말로 어색한 것은?',
          options: [
            '① Cheer up.',
            '② Take it easy.',
            '③ Take it so hard.',
            '④ Keep your chin up.',
            "⑤ Don't be discouraged.",
          ],
          answer: 3,
        },
      ],
    },

    // ── Q2: standalone ──
    {
      questions: [
        {
          id: 2,
          type: 'mc',
          question: '다음 중 가장 어색한 대화는?',
          options: [
            '① A: Let me help you fix the chair.\nB: Please hold this tightly. Thank you for your help.',
            '② A: How about hanging some pictures?\nB: I\'m sorry to hear that. Thank you for taking pictures of me.',
            "③ A: We need something on the wall, too. Don't you think so?\nB: You're right. Let's talk about it together.",
            "④ A: Let's talk about the corner this time. Any ideas?\nB: How about making a library in the corner of the club room?",
            "⑤ A: Let's talk about what we can do for our town.\nB: How about drawing pictures on the dirty walls?\nA: Sounds good. Anything else?",
          ],
          answer: 2,
        },
      ],
    },

    // ── Q3: standalone fill-in-the-blank (subjective) ──
    {
      passage:
        '(A) - My neighbor has a(n) ___ⓐ___ thumb. I should ask her about my plants.\n' +
        '- The bank has given us the money. Now we have the ___ⓐ___ light to start the project!\n' +
        '- He was ___ⓐ___ with envy when he saw their expensive new car.\n\n' +
        "(B) - It's a bad line. ___ⓑ___ up and I'll call you back later.\n" +
        '- I am going to ___ⓑ___ out with my friends at the amusement park.\n' +
        '- ___ⓑ___ in there! Things will be better soon.',
      questions: [
        {
          id: 3,
          type: 'subjective',
          question: '빈칸 ⓐ, ⓑ에 들어갈 단어를 각각 한 단어로 쓰시오.',
          answer: 'ⓐ green ⓑ hang',
          acceptableAnswers: ['green, hang', 'green / hang'],
        },
      ],
    },

    // ── Q4–Q11: Tom's diary passage (shared across pages 1–3) ──
    {
      passage:
        "<Tom's diary>\nApril 27\n\n" +
        'I complained the whole day. ⓐMy parents were making me work on the neighborhood project, but I had even better things to do. ⓑI didn\'t understand why we were working on this place. It was just the ugly, old, empty lot ⓒ(~의 맞은편에) Johnny\'s Shop. It ⓓ(~로 가득찼다) wild plants, fast food wraps, old newspapers, broken glass, and every other kind of dirty trash you can imagine. ⓔAs I looked at it that first morning, I thought, "I bet there are snakes in there, too."\n\n' +
        'There were twenty of us - all ages and sizes - ready to work that day. ⓕI was confident that we could clean up this awful mess and turn it into a garden without any help. We were all wondering where to begin. Then Mr. Hernandez said, "The only way to do it is just to start." Then, he divided the lot into four parts with string and assigned five people to each part.\n\n' +
        'By lunchtime, I was hot, sweaty, and glad my dad had made me wear gloves. We filled fifty trash bags with waste and were ready to pull wild plants. As we pulled and pulled, dust filled the air and made us sneeze. ⓖAt the end of the day, I had to admit the lot looked much better.\n\n' +
        '*Tom: a boy\n\n' +
        '---\n\n' +
        "<Tom's diary>\n\n" +
        'At first, the lot was so ugly and dirty that we had to clean it up. That first day was the toughest. Ⓐ On the weekends that ⓐfollowed, we made rows, planted flower and vegetable seeds, and watered them. After about two weeks, I ⓑkept complaining when I found the plants ⓒhad started popping up! Ⓑ First, the lettuce and then the beans and the tomatoes. They grew so fast. I couldn\'t believe it! The bean plants grew an inch, and the tomatoes doubled in size in just a few days. Ⓒ\n\n' +
        'Now, two months later, I like to go there every day to see what new flowers are ready to pop up. Lots of people in the neighborhood meet there to enjoy the sights and ⓓto talk together. Ⓓ\n\n' +
        'Tonight, it suddenly hit me - ⓔwhat a good thing we did! I ⓕ(proud) having been a part of it. I\'m ⓖ(charge) picking flowers for the nursing home on Fourth Street. The vegetables will go to every kitchen in our town. Ⓔ',
      questions: [
        {
          id: 4,
          type: 'mc',
          question: '윗글의 밑줄 친 ⓐ~ⓔ 중 글의 흐름상 어색한 것은?',
          options: ['① ⓐ', '② ⓑ', '③ ⓒ', '④ ⓓ', '⑤ ⓔ'],
          answer: 4,
        },
        {
          id: 5,
          type: 'subjective',
          question:
            '윗글 ⓒ, ⓓ의 우리말을 글의 흐름과 어법에 맞도록 영어로 완성하시오.\nⓕ _______________ _______________ (2단어)\nⓖ _______________ _______________ _______________ (3단어)',
          answer: 'ⓕ across from ⓖ was full of',
          acceptableAnswers: [
            'across from, was full of',
            'across from / was full of',
          ],
        },
        {
          id: 6,
          type: 'mc',
          question: '윗글의 내용과 일치하지 않는 것은?',
          options: [
            '① Trash bags and gloves were used to clean up the lot.',
            '② The workers took away the waste before pulling wild plants.',
            '③ Mr. Hernandez helped the workers change the mess into a garden in certain ways.',
            '④ Tom left annoyed when his parents made him work on the project against his own wish.',
            '⑤ The project was made up of twenty people who were in the late teens and the same sizes.',
          ],
          answer: 5,
        },
        {
          id: 8,
          type: 'mc',
          question:
            '윗글의 밑줄 친 ⓐ~ⓔ 중 글의 흐름상 어색한 것은?',
          options: ['① ⓐ', '② ⓑ', '③ ⓒ', '④ ⓓ', '⑤ ⓔ'],
          answer: 2,
        },
        {
          id: 9,
          type: 'mc',
          question:
            '윗글의 흐름상 아래의 문장이 들어갈 가장 적절한 곳은?\n\nBut even better, an ugly and dirty lot that people didn\'t like has become a pretty garden for everyone.',
          options: ['① Ⓐ', '② Ⓑ', '③ Ⓒ', '④ Ⓓ', '⑤ Ⓔ'],
          answer: 5,
        },
        {
          id: 10,
          type: 'subjective',
          question:
            '윗글 ⓕ, ⓖ의 주어진 단어를 반드시 사용하여, 글의 흐름에 어울리도록 빈칸을 완성하시오.\nⓕ _______________ _______________ _______________ (3단어)\nⓖ _______________ _______________ _______________ (3단어)',
          answer: 'ⓕ am proud of ⓖ in charge of',
          acceptableAnswers: [
            'am proud of, in charge of',
            'am proud of / in charge of',
          ],
        },
        {
          id: 11,
          type: 'mc',
          question: '윗글의 내용과 일치하지 않는 것은?',
          options: [
            '① Lots of neighbors come together to enjoy the garden.',
            '② Tom was amazed to find the fast growth of the plants.',
            '③ All the plants started popping up in no particular order.',
            '④ Tom takes the responsibility of picking flowers for the nursing home.',
            '⑤ On the following weekends after the toughest day, they made rows and planted flower seeds.',
          ],
          answer: 3,
        },
      ],
    },

    // ── Q7: standalone dialogue ──
    {
      passage:
        "A: Let's talk about how we can make our town better.\n" +
        "B: Let me tell you first. There's too much trash at the bus stop.\n" +
        "C: I agree. Why don't we clean the place together?\n" +
        'B: Good. We can put a bench there, too.\n' +
        "A: Great idea. It'll be helpful for the elderly.\n" +
        "C: How about putting some flower pots around the bench? They'll make the bus stop more beautiful.\n" +
        'A: Thank you for suggesting great ideas, everyone. Then, shall we start tomorrow?\n' +
        'B, C: No problem.',
      questions: [
        {
          id: 7,
          type: 'mc',
          question: '다음 대화의 내용과 일치하지 않는 것은?',
          options: [
            '① They all agree about putting the ideas into practice.',
            '② Putting a bench there will be of help for the elderly.',
            '③ They are talking about how to make the town better.',
            '④ They are trying to cooperate with each other for the better.',
            '⑤ They get so frustrated with too much trash that they almost give up.',
          ],
          answer: 5,
        },
      ],
    },

    // ── Q12: standalone grammar ──
    {
      questions: [
        {
          id: 12,
          type: 'mc',
          question: '다음 중 어법상 어색한 것은? (정답2개)',
          options: [
            '① He had lived in this town until last month.',
            '② Writing in a hurry, the book has many faults.',
            '③ The boy made the bed before he went to bed.',
            "④ Not feeling well, I didn't go to school yesterday.",
            "⑤ Don't put off till tomorrow that you can do today.",
          ],
          answer: [2, 4],
        },
      ],
    },

    // ── Q13: standalone dialogue ──
    {
      passage:
        'Jisu: Why are you so disappointed, Ryan?\n' +
        "Ryan: My parents won't let me enter Superstar 101, a singing competition.\n" +
        "Jisu: I'm sorry to hear that. Why are they against it?\n" +
        "Ryan: They want me to study hard and be a doctor. They're always worried about my grades.\n" +
        'Jisu: Did you tell your parents you really want to be a singer?\n' +
        'Ryan: Not yet. Do you think I should talk with them about it?\n' +
        'Jisu: Yes. Just show them how much you love singing. Why don\'t you sing the songs you made in front of them?\n' +
        "Ryan: Okay. I'll try. Thank you for your advice, Jisu.\n\n" +
        '*Jisu: a girl / Ryan: a boy',
      questions: [
        {
          id: 13,
          type: 'mc',
          question: '다음 글의 내용과 일치하지 않는 것은?',
          options: [
            '① Ryan is really grateful to Jisu for giving advice.',
            "② Ryan's parents object to his entering Superstar 101.",
            '③ Jisu and Ryan seem to have a close relationship with each other.',
            '④ Ryan volunteers to show the songs of his own in front of his parents from the start.',
            "⑤ Jisu feels sorry for Ryan because his parents are against his attending a singing competition.",
          ],
          answer: 4,
        },
      ],
    },

    // ── Q14–Q19: Hidden Figures passage (shared) ──
    {
      passage:
        'I watched the movie Hidden Figures last weekend. It was a movie about three African-American women who worked at NASA. They began their career in the 1960s as "human computers." ____ⓐ____, they dreamed of becoming space experts at NASA and tried hard to ____ⓑ____ difficulties.\n\n' +
        'Katherine Johnson was one of the three "hidden ⓒfigures" in this movie. She worked hard and showed a talent in math, and her manager Al Harrison recognized her ability. One day, he got upset when Katherine was missing from her desk for too long. Al asked where Katherine had been, and she answered.\n\n' +
        '"The bathroom. There are no COLORED bathrooms in this building. I have to run half a mile away just to use the bathroom."\n\n' +
        'Hearing this, I felt really sorry for her. However, I was glad that __________ⓓ__________. This made Al Harrison break down the "Colored Ladies Room" sign.\n\n' +
        '---\n\n' +
        'Mary Jackson was the character I liked the most of the three. She wanted to learn more about rocket science, but she ⓐ(allow) go to a white school. So, she asked a judge to give her ⓑ(permit).\n\n' +
        '"I can\'t change the color of my skin. So ... ⓒ(나는 \'최초\'가 되지 않을 수 없다). Your Honor, of all the cases you\'ll hear today, which one will matter in a hundred years? Which one will make you the \'first\'?"\n\n' +
        'The judge was impressed by what she said and finally accepted the offer. Mary stood up for herself and for other African-Americans. That was what impressed me most in the movie. Finally, she became the first African-American woman engineer at NASA.\n\n' +
        '---\n\n' +
        'Dorothy Vaughan was the last "hidden figure." When IBM computers were installed at NASA in 1961, ____ⓐ____. She studied a new programming language, FORTRAN. She also taught it to her team members. Later, when she was asked to be the leader of a new IBM team, she made a suggestion.\n\n' +
        '"I\'m not accepting the offer if I can\'t bring my ladies with me. We need a lot of people to program that machine. I can\'t do it alone. My girls are ready."\n\n' +
        '__ⓑ__ to Dorothy, her team members could become programmers. She wasn\'t afraid of __ⓒ__ and used it as a __ⓓ__. That\'s what I need to learn from her.\n\n' +
        'Watching this movie, I could learn how to __ⓔ__ challenges in life. I won\'t forget the tears and laughter of Katherine, Mary, and Dorothy.',
      questions: [
        {
          id: 14,
          type: 'mc',
          question: '윗글의 빈칸 ⓐ, ⓑ에 들어갈 말로 바르게 짝지어진 것은?',
          options: [
            '① In other words / solve',
            '② However / overcome',
            '③ As a result / suffer from',
            '④ For example / get over',
            '⑤ In fact / get away from',
          ],
          answer: 2,
        },
        {
          id: 15,
          type: 'mc',
          question: '윗글의 밑줄 친 ⓒ와 같은 의미로 쓰인 것은?',
          options: [
            "① There's a lot I need to figure out.",
            '② She goes to gym to keep her figure.',
            '③ Have you ever seen a figure of Cupid?',
            '④ They are asking a high figure for their house.',
            '⑤ He is the leading political figure of this century.',
          ],
          answer: 5,
        },
        {
          id: 16,
          type: 'mc',
          question: '윗글의 빈칸 ⓓ에 들어갈 말로 가장 적절한 것은?',
          options: [
            '① she had the opportunity to be promoted to a higher position',
            '② she had courage to talk to the manager about the problem',
            '③ her manager, Harrison, helped her to realize her dream earlier than expected',
            '④ her manage, Harrison, helped her break down the "Colored Ladies Room" sign',
            '⑤ she had the patience to deal with difficulties without complaining about the problem',
          ],
          answer: 2,
        },
        {
          id: 17,
          type: 'mc',
          question: '윗글에서 답을 얻을 수 없는 질문은?',
          options: [
            '① Why did Harrison get upset?',
            '② Where did three women work?',
            '③ What did the writer do on the previous weekend?',
            '④ How long had Katherine and Harrison worked together?',
            "⑤ How did the writer feel after hearing Katherine's answer?",
          ],
          answer: 3,
        },
        {
          id: 18,
          type: 'mc',
          question: '윗글의 교훈으로 가장 적절한 것은?',
          options: [
            '① No news is good news.',
            "② It's the tip of the iceberg.",
            '③ Blood is thicker than water.',
            '④ When in Rome, do as the Romans do.',
            '⑤ Heaven helps those who help themselves.',
          ],
          answer: 5,
        },
        {
          id: 19,
          type: 'subjective',
          question:
            '(1) 윗글 ⓐ, ⓑ의 주어진 단어를 글의 흐름과 어법에 맞도록 고쳐 쓰시오.\nⓐ ___________ ___________ ___________ (3단어)\nⓑ ___________ (1단어)\n\n(2) 윗글 ⓒ의 우리말을 바르게 영어로 고쳐 쓰시오.\n(반드시 \'choice\'를 포함하여 5단어로 완성할 것.)\nI have _______ _______ _______ _______ _______ the first.',
          answer:
            "(1) ⓐ wasn't allowed to ⓑ permission\n(2) no choice but to be",
          acceptableAnswers: [
            "wasn't allowed to, permission, no choice but to be",
          ],
        },
        {
          id: 21,
          type: 'mc',
          question: '윗글의 빈칸 ⓐ에 들어갈 가장 적절한 말은?',
          options: [
            '① she was glad she was well prepared for the new change',
            '② she was so glad it would be easier for her to do the work',
            '③ she was worried the "human computers" would lose their jobs',
            '④ she was expected to get the benefits from IBM computers at NASA',
            '⑤ she felt upset because the "human computers" would make three characters lose their careers',
          ],
          answer: 3,
        },
        {
          id: 22,
          type: 'subjective',
          question:
            '<보기>의 단어들을 활용하여, <조건>에 맞게 윗글의 ⓑ~ⓔ를 각각 한 단어로 채우시오.\n\n<조건>\n- 글의 흐름에 어울리도록 할 것.\n- <보기>의 단어는 한 번씩만 사용하며, 필요한 경우 단어의 형태를 바꿀 것.\n\n<보기>\ncharacter - face - change - thank - fix - chance\n\nⓑ ___________________ ⓒ ___________________\nⓓ ___________________ ⓔ ___________________',
          answer: 'ⓑ Thanks to ⓒ change ⓓ chance ⓔ face',
          acceptableAnswers: [
            'Thanks to, change, chance, face',
          ],
        },
      ],
    },

    // ── Q20: standalone grammar ──
    {
      questions: [
        {
          id: 20,
          type: 'subjective',
          question:
            '다음의 밑줄 친 부분을 분사구문으로 바꾸시오.\n\n- As it was fine, I went on an outing.\n___________________________, I went on an outing.',
          answer: 'It being fine',
        },
      ],
    },

    // ── Q23: standalone grammar ──
    {
      questions: [
        {
          id: 23,
          type: 'subjective',
          question:
            '다음 두 문장을 합쳐서 빈 칸을 완성하시오.\n\n- Do you think?\n- How many books do you have?\n\n→ (______)(______)(______)(______)(______)(______)\n(______)(______)(______)?',
          answer: 'How many books do you think you have?',
        },
      ],
    },

    // ── Q24: standalone grammar ──
    {
      questions: [
        {
          id: 24,
          type: 'mc',
          question: '다음 중 어법상 옳은 것은?',
          options: [
            "① I'm not sure what can I do.",
            '② I wonder if she know the answer.',
            '③ She asked me where was the bank.',
            '④ Do you know whether she is angry?',
            '⑤ There was a noise upstairs all night, that really made me angry.',
          ],
          answer: 4,
        },
      ],
    },

    // ── Q25: SKIPPED — requires crossword puzzle image ──

    // ── Q26–Q30: Laughter passage (shared) ──
    {
      passage:
        '(A) Laughter is human. We laugh out loud when we hear a joke, see something funny or feel happy. We laugh even in our writings, such as emails or texts, ⓐas we are in our conversations. How do we do that?\n\n' +
        '(B) Like ha-ha and LOL, XD also represents laughter in text. It shows a laughing face with a mouth open and ⓑeyes closed tightly. XD is not a word. It\'s an emoticon, which is a group of letters or symbols used to represent a facial expression. The emoticon XD ⓒexpresses our happy feelings more visually than ha-ha and LOL do.\n\n' +
        '(C) "Ha-ha" is a form of written laughter. Everyone knows what it means. As a matter of fact, it ⓓhas been used since long ago. Even Shakespeare used "ha-ha" in his works.\n\n' +
        '(D) Another form of written laughter is LOL. It stands for "Laughing Out Loud." People also use ROFL quite often, which means "Rolling On the Floor Laughing." These expressions have become popular because they ⓔcan be typed quite quickly.\n\n' +
        '(E) ⓘSome emojis have grown bigger and some even move or make laughing sounds.\n\n' +
        '(F) Nowadays, people use &&사진&& - a "face with tears of joy." This is a small picture called an "emoji." ⓕA lot of laughing emojis are available to use online, ⓖso people can express their laughter in various ways.\n\n' +
        '(G) Laughing marks can represent our facial expressions and deliver our voice tones. By using various laughing marks, we can show our friends how much we care for them or how happy we are with them. ⓗLaugh, even in written forms, ⓙand your friends will laugh at you.',
      questions: [
        {
          id: 26,
          type: 'mc',
          question: '윗글의 내용과 일치하는 대화는? (정답 2개)',
          options: [
            '① A: What does LOL mean?\nB: It means "Lots Of Laughter."',
            '② A: What are the examples of writing?\nB: They are texts or emails.',
            '③ A: What can laughing marks deliver?\nB: They can deliver our voice tones.',
            '④ A: What is an emoticon?\nB: It is a group of symbols or words which are used to represent a facial expression.',
            '⑤ A: How can you express your feelings?\nB: We can express our feelings by speaking or writing, first impression, picture, gesture, or silence.',
          ],
          answer: [4, 5],
        },
        {
          id: 27,
          type: 'mc',
          question: '윗글 (B)-(F)를 글의 흐름상 바르게 배열한 것은?',
          options: [
            '① (B)-(C)-(D)-(E)-(F)',
            '② (B)-(D)-(C)-(E)-(F)',
            '③ (C)-(D)-(B)-(E)-(F)',
            '④ (C)-(D)-(B)-(F)-(E)',
            '⑤ (D)-(C)-(B)-(F)-(E)',
          ],
          answer: 4,
        },
        {
          id: 28,
          type: 'mc',
          question: '윗글의 밑줄친 ⓐ~ⓔ 중 어법상 어색한 부분은?',
          options: ['① ⓐ', '② ⓑ', '③ ⓒ', '④ ⓓ', '⑤ ⓔ'],
          answer: 1,
        },
        {
          id: 29,
          type: 'mc',
          question: '윗글의 밑줄 친 ⓘ~ⓙ 중 글의 흐름상 어색한 부분은?',
          options: ['① ⓘ', '② ⓖ', '③ ⓗ', '④ ⓙ', '⑤ ⓕ'],
          answer: 4,
        },
        {
          id: 30,
          type: 'mc',
          question: '윗글을 읽고, 그 답을 알 수 없는 질문은?',
          options: [
            '① When do we laugh out loud?',
            '② Who used "ha-ha" in his or her works?',
            '③ What features do emojis have these days?',
            '④ What can you show by using laughing marks?',
            '⑤ How are emojis made and do they make moving sounds?',
          ],
          answer: 2,
        },
      ],
    },

    // ── Q31: standalone dialogue ──
    {
      passage:
        'Seho: Yena, how are you feeling?\n' +
        "Yena: I'm feeling very sad, Seho. My best friend Jihun is moving away.\n" +
        "Seho: Really? I'm sorry. But don't be so sad. You two can have video chats online.\n" +
        "Yena: You're right.\n" +
        "Seho: Why don't we make him a photo book as a goodbye gift?\n" +
        "Yena: Great idea. I'm glad to give him something meaningful.\n\n" +
        '*Yena: a girl / Seho & Jihun: boys',
      questions: [
        {
          id: 31,
          type: 'mc',
          question: '다음 글의 내용과 일치하는 대화는? (정답 2개)',
          options: [
            '① A: How is Jihun feeling now?\nB: He is sadder than ever.',
            '② A: Why is Yena so sad?\nB: Her best friend is moving away.',
            "③ A: What does 'a photo book' mean to Seho?\nB: It's a goodbye gift to his friend.",
            '④ A: How can Seho and Jihun communicate online?\nB: They can have video chats online.',
            '⑤ A: What will Seho and Yena do for Jihun?\nB: They will order a photo album to the photographer for him.',
          ],
          answer: [2, 4],
        },
      ],
    },

    // ── Q32: standalone dialogue ordering ──
    {
      passage:
        'Hi, Jiho. How are you feeling?\n\n' +
        '㉠ Good job. Did you tell Minsu and Yujin about that?\n' +
        '㉡ Yes. I finally reserved four tickets for the VTS concert!\n' +
        '㉢ I know why. You did it, didn\'t you?\n' +
        '㉣ How cute! I like their emojis. They will bring light sticks and a nice camera.\n' +
        "㉤ I'm happier than ever, Nari.\n" +
        '㉥ Sure. Oh, I just got messages from them. They said they are really happy. Look.\n\n' +
        "I'm glad to hear that. We're going to have lots of fun!",
      questions: [
        {
          id: 32,
          type: 'subjective',
          question: '다음 대화를 순서대로 바르게 배열하시오.',
          answer: '㉤-㉢-㉡-㉠-㉥-㉣',
          acceptableAnswers: ['마-다-나-가-바-라'],
        },
      ],
    },
  ],
};
