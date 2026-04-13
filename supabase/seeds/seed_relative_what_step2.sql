-- ═══════════════════════════════════════════════════════
-- 관계대명사 what Step2 — 63문항
-- 난이도: 중상~상급  |  category='problem', mode='interactive'
-- 답 분포: ①13 ②13 ③12 ④13 ⑤12
-- ═══════════════════════════════════════════════════════

DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN

  q := jsonb_build_array(

    -- ═══════════════════════════════════════════
    -- Part A: 공통 빈칸 (Q1~Q10)
    -- ═══════════════════════════════════════════

    -- Q1  공통빈칸  answer=what (⑤)
    -- Orig: Do you remember ___ she said before? / ___ he had for lunch was pizza.
    jsonb_build_object('number',1,
      'question',E'다음 두 문장의 빈칸에 공통으로 들어갈 말로 알맞은 것은?\n\n• Can you recall ___ he mentioned earlier?\n• ___ she prepared for breakfast was a salad.',
      'options',jsonb_build_array('that','who','which','this','what'),
      'answer','5'),

    -- Q2  공통빈칸  answer=what (③)
    -- Orig: Tell me ___ you had for dinner. / ___ makes me sad is losing a friend.
    jsonb_build_object('number',2,
      'question',E'다음 두 문장의 빈칸에 공통으로 들어갈 말로 알맞은 것은?\n\n• Show me ___ you ate for breakfast.\n• ___ makes me upset is losing a close companion.',
      'options',jsonb_build_array('when','that','what','who','which'),
      'answer','3'),

    -- Q3  공통빈칸  answer=What (①)
    -- Orig: ___ is your favorite subject? / ___ I want is your answer.
    jsonb_build_object('number',3,
      'question',E'다음 두 문장의 빈칸에 공통으로 들어갈 말로 알맞은 것은?\n\n• ___ is your favorite color?\n• ___ I need is your honest reply.',
      'options',jsonb_build_array('What','Where','How','When','Why'),
      'answer','1'),

    -- Q4  공통빈칸  answer=what (④)
    -- Orig: I don't agree with ___ you just said. / My little sister showed me ___ she painted.
    jsonb_build_object('number',4,
      'question',E'다음 두 문장의 빈칸에 공통으로 들어갈 말로 알맞은 것은?\n\n• I can''t accept ___ you just claimed.\n• My younger brother presented me ___ he had drawn.',
      'options',jsonb_build_array('where','which','how','what','when'),
      'answer','4'),

    -- Q5  공통빈칸  answer=what (⑤)
    -- Orig: This is not ___ I want to see. / You can enjoy ___ you want to do.
    jsonb_build_object('number',5,
      'question',E'다음 두 문장의 빈칸에 공통으로 들어갈 말로 알맞은 것은?\n\n• That is not ___ I wish to hear.\n• You can try ___ you are eager to do.',
      'options',jsonb_build_array('who','where','when','that','what'),
      'answer','5'),

    -- Q6  알맞지 않은 것  answer=the thing which (③)
    -- Orig: Thank you for _______ you did for my daughter.
    jsonb_build_object('number',6,
      'question',E'다음 빈칸에 들어갈 수 <u>없는</u> 것은?\n\nI appreciate _______ you have done for my son.',
      'options',jsonb_build_array('what','all that','the thing which','the thing that','that'),
      'answer','3'),

    -- Q7  공통빈칸 (3문장)  answer=what (④)
    -- Orig: That is ___ you will like. / ___ is interesting is that they are twins. / I don't understand ___ she said.
    jsonb_build_object('number',7,
      'question',E'다음 세 문장의 빈칸에 공통으로 들어갈 말로 알맞은 것은?\n\n• This is ___ you will enjoy.\n• ___ is remarkable is that they are identical.\n• I can''t grasp ___ he explained.',
      'options',jsonb_build_array('who','that','when','what','which'),
      'answer','4'),

    -- Q8  공통빈칸 (3문장: 관계대명사+의문형용사)  answer=what (④)
    -- Orig: This wasn't ___ she expected. / ___ book are you reading? / ___ he did was wrong.
    jsonb_build_object('number',8,
      'question',E'다음 세 문장의 빈칸에 공통으로 들어갈 말로 알맞은 것은?\n\n• That wasn''t ___ he anticipated.\n• ___ movie are you watching?\n• ___ she did was unfair.',
      'options',jsonb_build_array('how','why','where','what','when'),
      'answer','4'),

    -- Q9  공통빈칸 (대·소문자 무관)  answer=what (②)
    -- Orig: _________ color do you like best? / Don't tell her _________ you heard.
    jsonb_build_object('number',9,
      'question',E'다음 두 문장의 빈칸에 공통으로 들어갈 말로 알맞은 것은? (대·소문자 관계없음)\n\n• _________ subject do you enjoy most?\n• Don''t reveal to him _________ you overheard.',
      'options',jsonb_build_array('which','what','that','who','whose'),
      'answer','2'),

    -- Q10  공통빈칸  answer=what (④)
    -- Orig: That's __________ I want to do with you. / You don't have to care about __________ he said.
    jsonb_build_object('number',10,
      'question',E'다음 두 문장의 빈칸에 공통으로 들어갈 말로 알맞은 것은?\n\n• This is __________ I wish to share with you.\n• You don''t need to worry about __________ she remarked.',
      'options',jsonb_build_array('who','which','whom','what','that'),
      'answer','4'),

    -- ═══════════════════════════════════════════
    -- Part B: 전환 / 대화 (Q11~Q12)
    -- ═══════════════════════════════════════════

    -- Q11  동의문 전환  answer=What (⑤)
    -- Orig: The thing that scared me was the big dog. = ___ scared me was the big dog.
    jsonb_build_object('number',11,
      'question',E'다음 두 문장이 같은 뜻이 되도록 빈칸에 알맞은 말을 고르시오.\n\nThe thing that frightened her was the loud thunder.\n= ___ frightened her was the loud thunder.',
      'options',jsonb_build_array('That','Which','Who','Whom','What'),
      'answer','5'),

    -- Q12  대화 빈칸  answer=what (②)
    -- Orig: A: What did you buy yesterday? B: This is ______ I bought yesterday.
    jsonb_build_object('number',12,
      'question',E'다음 대화의 빈칸에 알맞은 말을 고르시오.\n\nA: What did you make in art class? Can I see it?\nB: Of course. Look at this. This is ______ I made in art class.',
      'options',jsonb_build_array('who','what','that','whose','which'),
      'answer','2'),

    -- ═══════════════════════════════════════════
    -- Part C: (A)(B)(C) 짝짓기 (Q13~Q18)
    -- ═══════════════════════════════════════════

    -- Q13  (A)(B) 짝짓기  answer=① (what-that)
    -- Orig: This painting is (A) Joe drew / Sue thinks (B) she can finish homework
    jsonb_build_object('number',13,
      'question',E'다음 문장의 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?\n\n• This sculpture is (A)______ Emily created last month.\n• Tom believes (B)______ he can pass the exam tomorrow.\n\n     (A)     (B)',
      'options',jsonb_build_array('what — that','that — what','which — that','what — what','that — that'),
      'answer','1'),

    -- Q14  ⓐⓑ 짝짓기  answer=③ (who-what)
    -- Orig: The woman ⓐ[who] lives next door / Show me ⓑ[what] you bought
    jsonb_build_object('number',14,
      'question',E'다음 문장의 빈칸 ⓐ, ⓑ에 들어갈 말로 가장 적절한 것은?\n\n• The man ⓐ[which / who / that] works at the bakery is my uncle.\n• Tell me ⓑ[that / which / what] you discovered in the attic.\n\n     ⓐ     ⓑ',
      'options',jsonb_build_array('which — that','which — what','who — what','who — that','that — which'),
      'answer','3'),

    -- Q15  (A)(B)(C) 짝짓기  answer=③ (that-what-that)
    -- Orig: Everyone knows (A) he loves you / Please show me (B) you bought / He is talking about the car (C) he bought
    jsonb_build_object('number',15,
      'question',E'다음 문장의 빈칸 (A), (B), (C)에 들어갈 말로 가장 적절한 것은?\n\n• Everybody believes (A)______ she is honest.\n• Please hand me (B)______ you picked up outside.\n• He was describing the bicycle (C)______ he repaired.\n\n     (A)     (B)     (C)',
      'options',jsonb_build_array('that — which — which','that — that — which','that — what — that','who — what — which','who — which — which'),
      'answer','3'),

    -- Q16  ⓐ~ⓒ 짝짓기  answer=⑤ (what-that-which)
    -- Orig: I can give you ⓐ[what] / She realized ⓑ[that] he told a lie / a room ⓒ[which] overlooks the ocean
    jsonb_build_object('number',16,
      'question',E'다음 문장의 빈칸 ⓐ, ⓑ, ⓒ에 들어갈 말로 가장 적절한 것은?\n\n• I can offer you ⓐ_______ you desire.\n• He finally understood ⓑ_______ she had been lying to him.\n• We booked a cabin ⓒ________ faces the lake.\n\n     ⓐ     ⓑ     ⓒ',
      'options',jsonb_build_array('what — what — what','what — that — what','that — what — which','that — that — what','what — that — which'),
      'answer','5'),

    -- Q17  ⓐ~ⓒ 짝짓기  answer=⑤ (what-that-what)
    -- Orig: I gave her just ⓐ[what] she needed / the money ⓑ[that] she needed / not ⓒ[what] I gave her
    jsonb_build_object('number',17,
      'question',E'다음 문장의 빈칸 ⓐ, ⓑ, ⓒ에 들어갈 말로 가장 적절한 것은?\n\n• He handed her exactly ⓐ_______ she requested.\n• He handed her the exact amount ⓑ_______ she requested.\n• That was not ⓒ_______ he had given her the day before.\n\n     ⓐ     ⓑ     ⓒ',
      'options',jsonb_build_array('what — that — which','that — which — that','which — what — what','what — what — that','what — that — what'),
      'answer','5'),

    -- Q18  ⓐ~ⓒ 짝짓기  answer=⑤ (what-which-what)
    -- Orig: She is satisfied with ⓐ[what] she has / He likes the gift ⓑ[which] was given / I asked him ⓒ[what] kind of sport
    jsonb_build_object('number',18,
      'question',E'다음 문장의 빈칸 ⓐ, ⓑ, ⓒ에 들어갈 말로 가장 적절한 것은?\n\n• He is content with ⓐ________ he owns.\n• She treasures the necklace ⓑ________ was presented by him.\n• I asked her ⓒ_____ type of book she preferred.\n\n     ⓐ     ⓑ     ⓒ',
      'options',jsonb_build_array('what — that — that','what — what — what','that — which — that','that — that — what','what — which — what'),
      'answer','5'),

    -- ═══════════════════════════════════════════
    -- Part D: 영어 빈칸 / 바꿔쓰기 (Q19~Q20)
    -- ═══════════════════════════════════════════

    -- Q19  4개 빈칸  answer=① (it-what-which-was)
    -- Orig: I think ⓐ[it] is important / I know ⓑ[what] you did / the thing ⓒ[which] I wanted / What he bought ⓓ[was]
    jsonb_build_object('number',19,
      'question',E'다음 빈칸 ⓐ~ⓓ에 들어갈 말로 가장 적절한 것은?\n\n• I believe ⓐ_______ is necessary to exercise daily.\n• I recall ⓑ_______ you did last Friday.\n• That was the answer ⓒ_______ I hoped to receive.\n• What she bought ⓓ_______ a diamond bracelet.\n\n     ⓐ     ⓑ     ⓒ     ⓓ',
      'options',jsonb_build_array('it — what — which — was','that — which — that — were','it — that — which — was','which — that — that — was','that — what — which — was'),
      'answer','1'),

    -- Q20  <보기> 바꿔쓰기  answer=①
    -- Orig: Kevin gave me what he had in his pocket.
    jsonb_build_object('number',20,
      'question',E'다음 <보기>와 같은 의미의 문장을 고르시오.\n\n<보기> Sarah lent me what she kept in her drawer.',
      'options',jsonb_build_array(
        'Sarah lent me the things which she kept in her drawer.',
        'Sarah lent me that she kept in her drawer.',
        'Sarah lent me the things what she kept in her drawer.',
        'Sarah lent me the things that she kept them in her drawer.',
        'Sarah lent me that she kept them in her drawer.'),
      'answer','1'),

    -- ═══════════════════════════════════════════
    -- Part E: 빈칸에 들어갈 말이 다른 것 (Q21~Q27)
    -- ═══════════════════════════════════════════

    -- Q21  다른 것 고르기  answer=④ (that, 나머지 what)
    -- Orig: ① hear what ② do what ③ didn't have what ④ writings that ⑤ What I saw
    jsonb_build_object('number',21,
      'question',E'다음 중 빈칸에 들어갈 말이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'Did you notice ___ they announced?',
        'You should follow ___ you trust.',
        'The store didn''t carry ___ he needed.',
        'Read the messages ___ she posted online.',
        '___ I witnessed on the mountain was a deer.'),
      'answer','4'),

    -- Q22  다른 것 고르기  answer=②  (What, 나머지 It 가주어)
    -- Orig: ① It is wrong ② It is good ③ It is important ④ What is more interesting ⑤ It is necessary
    jsonb_build_object('number',22,
      'question',E'다음 중 빈칸에 들어갈 말이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        '______ is rude to interrupt your classmates.',
        '______ is even more fascinating is the legend behind it.',
        '______ is wise to listen to your elders.',
        '______ is essential to practice every day.',
        '______ is dangerous to swim in that river.'),
      'answer','2'),

    -- Q23  다른 것 고르기  answer=③ (what, 나머지 that/which)
    -- Orig: ① found bike that ② only person that ③ shocked by what ④ the thing that ⑤ the bird that
    jsonb_build_object('number',23,
      'question',E'다음 중 빈칸에 들어갈 말이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'I recovered the wallet ______ I had misplaced.',
        'She is the sole friend ______ I can rely on.',
        'I was startled by ______ he revealed yesterday.',
        'He purchased the item ______ I had been wanting.',
        'Look at the cat ______ is sleeping on the bench.'),
      'answer','3'),

    -- Q24  다른 것 고르기  answer=③ (that, 나머지 what)
    -- Orig: ① not what she ate ② believe what ③ the bag that ④ hear what ⑤ what I want
    jsonb_build_object('number',24,
      'question',E'다음 중 빈칸에 들어갈 말이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'That is not ______ she ordered.',
        'I trust ______ you explained to me.',
        'Hand me the jacket ______ you purchased.',
        'Did you catch ______ he whispered?',
        'This is ______ I plan to cook for supper.'),
      'answer','3'),

    -- Q25  다른 것 고르기  answer=② (that/which, 나머지 what)
    -- Orig: ① Give me what ② What interests me ③ That's what ④ The books that ⑤ thankful for what
    jsonb_build_object('number',25,
      'question',E'다음 중 빈칸에 들어갈 말이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'Bring me ______ you collected yesterday.',
        'The novels ______ are on the shelf are hers.',
        '______ fascinates me most is taking photos.',
        'That''s ______ I fret about.',
        'He was grateful for ______ she arranged for him.'),
      'answer','2'),

    -- Q26  다른 것 고르기  answer=④ (that, 나머지 what)
    -- Orig: ① shop what ② know what ③ What he wants ④ Everything that ⑤ What kind
    jsonb_build_object('number',26,
      'question',E'다음 중 빈칸에 들어갈 말이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'The store didn''t stock ______ I was seeking.',
        'I know ______ her phone number is.',
        '______ he hopes to become is an architect.',
        'Everything ______ they claimed turned out to be false.',
        '______ sort of food do you prefer?'),
      'answer','4'),

    -- Q27  다른 것 고르기  answer=② (that, 나머지 what)
    -- Orig: ① Ask them what ② What Anne did ③ nothing that ④ What Judy needs ⑤ what will happen
    jsonb_build_object('number',27,
      'question',E'다음 중 빈칸에 들어갈 말이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'Ask them ______ they prefer for lunch.',
        'There''s nothing ______ you can change now.',
        '______ Brian did this afternoon was to clean.',
        '______ Lily needs is a proper long vacation.',
        'Nobody predicts ______ will occur next.'),
      'answer','2'),

    -- ═══════════════════════════════════════════
    -- Part F: 짝짓기 / 대화 (Q28~Q30)
    -- ═══════════════════════════════════════════

    -- Q28  같은 것끼리 짝짓기  answer=① (ⓐⓑⓒ = what, ⓓ = that/which)
    -- Orig: ⓐ tell me what ⓑ thank you for what ⓒ not what ⓓ the gift that
    jsonb_build_object('number',28,
      'question',E'다음 ⓐ~ⓓ 중 빈칸에 들어갈 관계대명사가 같은 것끼리 바르게 짝지어진 것은?\n\nⓐ Simply explain to me ______ you require.\nⓑ I''m grateful for ______ you''ve arranged for me.\nⓒ The exam score was not ______ I had predicted.\nⓓ The souvenir ______ I purchased for you is good for your health.',
      'options',jsonb_build_array(
        'ⓐ, ⓑ, ⓒ',
        'ⓒ, ⓓ',
        'ⓐ, ⓑ',
        'ⓑ, ⓒ, ⓓ',
        'ⓐ, ⓑ, ⓒ, ⓓ'),
      'answer','1'),

    -- Q29  같은 것끼리 짝짓기 (7문장)  answer=② (ⓑ,ⓔ = what)
    -- Orig: ⓐ person who ⓑ know what ⓒ singer who ⓓ letter that ⓔ What I bought ⓕ cat whose ⓖ books that
    jsonb_build_object('number',29,
      'question',E'다음 ⓐ~ⓖ 중 빈칸에 들어갈 말이 같은 것끼리 바르게 짝지어진 것은?\n\nⓐ A nurse is someone ______ we visit when we feel ill.\nⓑ I recall ______ you did last winter.\nⓒ Mary greeted the actor ______ she had always admired.\nⓓ Here is the postcard ______ I got from my cousin.\nⓔ ______ I prepared for you is good for your skin.\nⓕ I adopted a rabbit ______ ears are long and floppy.\nⓖ I ordered three shirts ______ were designed by Ms. Park.',
      'options',jsonb_build_array(
        'ⓐ, ⓒ, ⓕ',
        'ⓑ, ⓔ',
        'ⓐ, ⓓ, ⓔ',
        'ⓒ, ⓓ, ⓖ',
        'ⓐ, ⓒ, ⓓ, ⓖ'),
      'answer','2'),

    -- Q30  대화 빈칸 ⓐ~ⓔ 중 다른 것  answer=① (ⓐ = which, 나머지 what)
    -- Orig: ⓐ market which ⓑ What I bought ⓒ what I lent ⓓ what he used to be ⓔ what to buy
    jsonb_build_object('number',30,
      'question',E'다음 대화의 빈칸 ⓐ~ⓔ에 들어갈 말이 나머지 넷과 다른 하나는?\n\nA: Have you ever visited the Namdaemun market, ⓐ_______ is the largest and most historic market in Seoul?\nB: Yes! ⓑ_______ I purchased there were handmade crafts and some dried seaweed.\nA: Nice. By the way, Jake still hasn''t returned ⓒ_______ I lent him last month.\nB: Really? Jake is not ⓓ_______ he once was. He used to be very responsible.\nA: I agree. Also, his birthday is coming up, and I have no clue ⓔ_______ to get him.',
      'options',jsonb_build_array('ⓐ','ⓑ','ⓒ','ⓓ','ⓔ'),
      'answer','1'),

    -- ═══════════════════════════════════════════
    -- Part G: 밑줄 친 what의 쓰임 구별 (Q31~Q40)
    -- ═══════════════════════════════════════════

    -- Q31  what 쓰임 구별  answer=② (②만 의문대명사, 나머지 관계대명사)
    -- Orig Q33: ① eat what you order ② What's your favorite subject ③ what she drew ④ What I want to know ⑤ create what he wanted
    jsonb_build_object('number',31,
      'question',E'다음 중 밑줄 친 <u>what</u>의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'I will try <u>what</u> you recommend on the menu.',
        '<u>What</u> is your most treasured possession?',
        'This is <u>what</u> he designed for the school festival.',
        '<u>What</u> I wish to find out is her address.',
        'Monet could capture <u>what</u> he observed in nature.'),
      'answer','2'),

    -- Q32  what 쓰임 구별  answer=① (①만 의문대명사, 나머지 관계대명사)
    -- Orig Q34: ① What can I do instead ② what she thought ③ What you are saying ④ what she is trying to tell us ⑤ what you heard
    jsonb_build_object('number',32,
      'question',E'다음 중 밑줄 친 <u>what</u>의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        '<u>What</u> should I bring to the potluck?',
        'That is <u>what</u> he believed all along.',
        '<u>What</u> you are describing sounds unbelievable.',
        'I appreciate <u>what</u> he is attempting to show us.',
        'Let''s review <u>what</u> you noticed during the experiment.'),
      'answer','1'),

    -- Q33  what 쓰임 구별  answer=⑤ (⑤만 의문형용사 what+명사, 나머지 관계대명사)
    -- Orig Q35: ① what he said ② what I want ③ What I need ④ what I saw ⑤ what movie you saw yesterday
    jsonb_build_object('number',33,
      'question',E'다음 중 밑줄 친 <u>what</u>의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'This is <u>what</u> she promised last week.',
        'He remembers <u>what</u> I like about autumn.',
        '<u>What</u> I require is your full attention.',
        'I still can''t accept <u>what</u> I heard just now.',
        'Show me <u>what</u> song you downloaded yesterday.'),
      'answer','5'),

    -- Q34  what 쓰임 구별  answer=③ (③만 의문형용사 what+명사, 나머지 관계대명사)
    -- Orig Q36: ① What you say is true ② what I expected ③ what you have in your bag → 의문형용사 위치로 이동 ④ What June wants ⑤ what subject I like
    -- Reordered: ①②④ 관계대명사, ③ 의문형용사, ⑤ 관계대명사 (원래 ⑤의문형용사를 ③으로 이동)
    jsonb_build_object('number',34,
      'question',E'다음 중 밑줄 친 <u>what</u>의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        '<u>What</u> you claim is entirely correct.',
        'It is <u>what</u> I hoped to receive as a reward.',
        'My classmates don''t know <u>what</u> instrument I practice the most.',
        '<u>What</u> Olivia dreams of is to travel around the world.',
        'Hand them <u>what</u> you carry in your backpack.'),
      'answer','3'),

-- ═══════════════════════════════════════════
    -- Part G 추가: 밑줄 친 what의 쓰임 구별 (Q35~Q38)
    -- 난이도: 중상~상급
    -- ═══════════════════════════════════════════

    -- Q35  what 쓰임 구별  answer=④ (④만 관계대명사, 나머지 의문대명사)
    -- Orig Q37: ①What do you mean by that? ②What is learned about the man?
    --           ③What do you want for Christmas? ④What is the difference between A and B?
    --           ⑤What I really want is sleeping.
    -- 재배치: 관계대명사를 ④번으로 이동
    jsonb_build_object('number',35,
      'question',E'다음 중 밑줄 친 <u>what</u>의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        '<u>What</u> do you intend by saying that?',
        '<u>What</u> is known about that woman?',
        '<u>What</u> do you wish for on your birthday?',
        '<u>What</u> I truly desire is a long rest.',
        '<u>What</u> is the gap between theory and practice?'),
      'answer','4'),

    -- Q36  what 쓰임 구별  answer=③ (③만 의문대명사, 나머지 관계대명사)
    -- Orig Q39: ①That's exactly what I wanted. ②Is this what you had in mind?
    --           ③What didn't you like about the movie? ④What I need is just something to drink.
    --           ⑤What I didn't like was the special effects.
    jsonb_build_object('number',36,
      'question',E'다음 중 밑줄 친 <u>what</u>의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'That''s precisely <u>what</u> I had hoped for.',
        'Is this <u>what</u> you were thinking of?',
        '<u>What</u> didn''t you enjoy about the performance?',
        '<u>What</u> I require is merely a glass of water.',
        '<u>What</u> I disliked was the ending of the story.'),
      'answer','3'),

    -- Q37  what 쓰임 구별  answer=① (①만 간접의문/의문대명사, 나머지 관계대명사)
    -- Orig Q40: ①I asked him what he was there for. ②Why didn't you eat what I cooked for you?
    --           ③They took away what the girl was carrying. ④Junk food is what fat people should not have.
    --           ⑤The present was totally different from what he thought.
    jsonb_build_object('number',37,
      'question',E'다음 중 밑줄 친 <u>what</u>의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'I questioned her <u>what</u> she was searching for.',
        'Why didn''t you try <u>what</u> I prepared for you?',
        'They confiscated <u>what</u> the boy was hiding.',
        'Fast food is <u>what</u> health-conscious people should avoid.',
        'The outcome was completely different from <u>what</u> she had expected.'),
      'answer','1'),

    -- Q38  what 쓰임 구별  answer=⑤ (⑤만 의문대명사, 나머지 관계대명사)
    -- Orig Q42: ①What we saw there amazed me. ②What made you laugh?
    --           ③What is most important to me is my health. ④He liked to eat what his mother cooked.
    --           ⑤This is what I like.
    -- 재배치: 의문대명사를 ⑤번으로 이동
    jsonb_build_object('number',38,
      'question',E'다음 중 밑줄 친 <u>what</u>의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        '<u>What</u> we witnessed there astonished everyone.',
        '<u>What</u> matters most to me is my well-being.',
        'She enjoyed eating <u>what</u> her grandmother prepared.',
        'This is exactly <u>what</u> I admire about him.',
        '<u>What</u> caused you to smile just now?'),
      'answer','5'),

-- Q39  what 쓰임 구별  answer=④ (④만 간접의문문/의문대명사, 나머지 관계대명사)
    -- Orig Q43: ① What I need is a lawyer (관계) ② Tell me what happened (간접의문) ③ What he said was true (관계) ④ They didn't like what he wrote (관계) ⑤ That is just what I want to say (관계)
    -- Reordered: 간접의문을 ④로 배치
    jsonb_build_object('number',39,
      'question',E'다음 중 밑줄 친 <u>what</u>의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        '<u>What</u> she requires is a good mentor.',
        '<u>What</u> he mentioned was completely accurate.',
        'They were not satisfied with <u>what</u> she composed.',
        'Please explain <u>what</u> occurred at the assembly last Friday.',
        'That is precisely <u>what</u> I intended to express.'),
      'answer','4'),

    -- Q40  what 쓰임 구별  answer=① (①만 의문대명사/간접의문, 나머지 관계대명사)
    -- Orig Q45: ① What he said is true (관계) ② I don't know what this is (간접의문) ③ Is this what you're looking for (관계) ④ What I want to buy are some fresh fruits (관계) ⑤ Maybe we can talk more about what we've seen during our trips (관계)
    -- Reordered: 의문대명사를 ①로 배치
    jsonb_build_object('number',40,
      'question',E'다음 중 밑줄 친 <u>what</u>의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'I have no idea <u>what</u> that object is.',
        '<u>What</u> he claimed turned out to be correct.',
        'Is this <u>what</u> you have been searching for?',
        '<u>What</u> I hope to purchase are some new novels.',
        'Perhaps we can discuss <u>what</u> we experienced during our vacations.'),
      'answer','1'),

    -- Q41  what 쓰임 구별 (장문)  answer=② (②만 간접의문문/의문대명사, 나머지 관계대명사)
    -- Orig Q48: ① best party + got what I wanted (관계) ② What you should do is check everything (관계) ③ check what you have + Show me what you have (관계) ④ I want to know what her name is (간접의문) ⑤ Robert said what everyone expected (관계)
    -- Reordered: 간접의문을 ②로 배치
    jsonb_build_object('number',41,
      'question',E'다음 중 밑줄 친 <u>what</u>의 쓰임이 나머지 넷과 다른 것은?',
      'options',jsonb_build_array(
        'We held the best celebration ever, thanks to our neighbors. And I received <u>what</u> I had wished for on my anniversary.',
        'Do you recognize that boy? He is the student Clara tutors. I''d like to find out <u>what</u> his grade is.',
        'Excuse me, but I need to inspect <u>what</u> you are carrying. Show me <u>what</u> you have in your bag.',
        '<u>What</u> you ought to do is review every detail before you submit your assignment.',
        'Last month when the fire broke out, Daniel said <u>what</u> everybody anticipated he would say.'),
      'answer','2'),

-- Q42  <보기>와 같은 것  answer=④ (보기: 관계대명사 what, ④만 관계대명사)
    -- Orig Q49: 보기 "This is what I have dreamed of." (관계대명사)
    -- ① 의문대명사 ② 관계대명사(→④로 이동) ③ 의문대명사 ④ 의문대명사 ⑤ 의문형용사
    -- Reordered: ①③④ 의문대명사, ⑤ 의문형용사, ② 관계대명사→④번으로 이동 → answer=④
    jsonb_build_object('number',42,
      'question',E'다음 <보기>의 밑줄 친 <u>what</u>과 쓰임이 같은 것은?\n\n<보기> She finally received <u>what</u> she had wished for.',
      'options',jsonb_build_array(
        '<u>What</u> is your biggest fear?',
        '<u>What</u> are you searching for online?',
        '<u>What</u> did the doctor say about your condition?',
        'I carefully read <u>what</u> my pen pal had written to me.',
        '<u>What</u> flavor of cake do you want for your birthday?'),
      'answer','4'),

    -- Q43  <보기>와 같은 것  answer=③ (보기: 관계대명사 what, ③만 관계대명사)
    -- Orig Q50: 보기 "What I want to have is a boyfriend." (관계대명사)
    -- ① 의문대명사 ② 의문대명사 ③ 의문사+to부정사(간접의문) ④ 의문형용사 ⑤ 관계대명사
    -- Reordered: 관계대명사를 ③으로 이동 → answer=③
    jsonb_build_object('number',43,
      'question',E'다음 <보기>의 밑줄 친 <u>what</u>과 쓰임이 같은 것은?\n\n<보기> <u>What</u> I hope to achieve is a scholarship abroad.',
      'options',jsonb_build_array(
        '<u>What</u> is your hometown famous for?',
        '<u>What</u> does this sign mean?',
        'He never forgot <u>what</u> his coach told him before the final match.',
        '<u>What</u> type of music does she listen to while studying?',
        'We couldn''t decide <u>what</u> to order from the new restaurant.'),
      'answer','3'),

    -- Q44  <보기>와 다른 것  answer=① (보기: 관계대명사 what, ①만 의문대명사)
    -- Orig Q51: 보기 "This is what I like." (관계대명사)
    -- ① 관계대명사 ② 관계대명사 ③ 의문대명사(다른 것) ④ 관계대명사 ⑤ 관계대명사
    -- Reordered: 의문대명사를 ①로 이동 → answer=①
    jsonb_build_object('number',44,
      'question',E'다음 <보기>의 밑줄 친 <u>what</u>과 쓰임이 다른 것은?\n\n<보기> This is <u>what</u> I enjoy the most.',
      'options',jsonb_build_array(
        '<u>What</u> is the matter with your laptop?',
        '<u>What</u> I plan to do this summer is to learn how to swim.',
        'She showed us <u>what</u> she had collected during the field trip.',
        'He thought carefully about <u>what</u> his teacher had advised him.',
        '<u>What</u> is obvious is that this project will take more time than expected.'),
      'answer','1'),

-- ═══════════════════════════════════════════
    -- Part L 추가: 특수 형식 (Q45~Q47)
    -- 보기와 같은 것 모두 고르기 / 대화문 / 같은 것끼리 짝짓기
    -- ═══════════════════════════════════════════

    -- Q45  보기와 같은 것 모두 고르기 (정답 2개 → 조합 선택지)  answer=②
    -- Orig Q52: 보기 "Show me what you have in your bag." (관계대명사)
    --   ① Please give me what I asked for. (관계대명사) ✓
    --   ② What do you want for your birthday? (의문대명사)
    --   ③ I want to know what time he will come. (의문형용사/간접의문)
    --   ④ That is exactly what she wanted to say. (관계대명사) ✓
    --   ⑤ What an interesting movie it is! (감탄문)
    -- 정답: ①④ → 조합 ② (①, ④)
    jsonb_build_object('number',45,
      'question',E'다음 <보기>의 밑줄 친 <u>what</u>과 쓰임이 같은 것을 모두 고른 것은?\n\n<보기> Tell me <u>what</u> you keep in your locker.\n\n① Just hand me <u>what</u> I requested earlier.\n② <u>What</u> would you like to receive on your graduation?\n③ I need to check <u>what</u> date the concert is scheduled for.\n④ That is precisely <u>what</u> he intended to express.\n⑤ <u>What</u> a spectacular sunset it was!',
      'options',jsonb_build_array(
        '①, ③',
        '①, ④',
        '②, ④',
        '③, ⑤',
        '④, ⑤'),
      'answer','2'),

    -- Q46  대화문 + 보기와 같은 것  answer=④
    -- Orig Q53: A: How about this one? / B: Sorry, that's not what I want. (관계대명사)
    --   ① What a wonderful dress it is! (감탄문)
    --   ② What do you think he wants? (의문대명사)
    --   ③ What kind of movie are you going to see tonight? (의문형용사)
    --   ④ What he hates doing is waking up early in the morning. (관계대명사) ← 같은 것
    --   ⑤ When you walk into the sports center, what music do you hear? (의문형용사)
    -- Answer: ④ (관계대명사)
    jsonb_build_object('number',46,
      'question',E'다음 대화의 밑줄 친 부분과 <u>what</u>의 쓰임이 같은 것은?\n\nA: Would you like to try this dish?\nB: No, thanks. That isn''t <u>what</u> I was hoping for.',
      'options',jsonb_build_array(
        '<u>What</u> a magnificent painting it is!',
        '<u>What</u> do you believe she meant by that?',
        '<u>What</u> type of book are you planning to read this weekend?',
        '<u>What</u> she dislikes the most is arriving late to class.',
        'When you enter the art gallery, <u>what</u> color catches your eye first?'),
      'answer','4'),

    -- Q47  같은 것끼리 바르게 짝지어진 것 (ⓐ~ⓔ)  answer=⑤
    -- Orig Q54:
    --   ⓐ Let me know what time it is. (의문형용사/간접의문)
    --   ⓑ She likes what she is making. (관계대명사)
    --   ⓒ That's not what I was trying to say. (관계대명사)
    --   ⓓ What are your opinions about the topic? (의문대명사)
    --   ⓔ You can bring what you like to eat there. (관계대명사)
    -- 같은 것: ⓑ,ⓒ,ⓔ (관계대명사) → option ⑤
    jsonb_build_object('number',47,
      'question',E'다음 ⓐ~ⓔ의 밑줄 친 <u>what</u> 중 쓰임이 같은 것끼리 바르게 짝지어진 것은?\n\nⓐ Please tell me <u>what</u> day the meeting is scheduled for.\nⓑ He treasures <u>what</u> he learned from his grandfather.\nⓒ The result was not <u>what</u> I had anticipated.\nⓓ <u>What</u> is your stance on this issue?\nⓔ You may choose <u>what</u> you prefer from the menu.',
      'options',jsonb_build_array(
        'ⓐ, ⓑ, ⓒ',
        'ⓒ, ⓓ, ⓔ',
        'ⓐ, ⓓ',
        'ⓐ, ⓑ, ⓒ, ⓔ',
        'ⓑ, ⓒ, ⓔ'),
      'answer','5'),

-- Q48  어법상 어색한 것  answer=③
    -- Orig Q55: "밑줄 친 부분 중 어법상 어색한 것은?"
    -- ① 관계대명사 what 정상 ② what 주어 정상 ③ what → that (간접화법 that절에 what 오용) ④ what 주어 정상 ⑤ 관계대명사 what 정상
    -- Error: "I told X what..." → should be "I told X that..." (reported speech requires "that", not "what")
    -- Original wrong sentence was ⑤, reordered to ③
    jsonb_build_object('number',48,
      'question',E'다음 밑줄 친 부분 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        '① She received <u>what</u> she had always dreamed of.',
        '② <u>What</u> I want to become is a marine biologist.',
        '③ I promised Kevin <u>what</u> I would finish the report by Friday.',
        '④ <u>What</u> you need to do is practice speaking every day.',
        '⑤ This painting is <u>what</u> my grandmother created long ago.'),
      'answer','3'),

    -- Q49  어법상 어색한 것 (밑줄)  answer=②
    -- Orig Q56: "밑줄 친 부분 중 어법상 어색한 것은?"
    -- ① 간접의문 what 정상 ② that → what 오류 (express what we have in mind) ③ what 정상 ④ that절 정상 ⑤ that 관계대명사 정상
    -- Error: "express that we have in mind" → should be "express what we have in mind" (that → what)
    -- Underline the tested parts with <u> tags
    jsonb_build_object('number',49,
      'question',E'다음 밑줄 친 부분 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        '① Explain to me <u>what</u> you experienced during the field trip.',
        '② Everyone deserves the chance to share <u>that</u> they truly feel inside.',
        '③ This documentary teaches us <u>what</u> we ought to remember about history.',
        '④ The article proves <u>that</u> we have wasted countless natural resources over the past decade.',
        '⑤ Consider all the inventions <u>that</u> have allowed people to explore the depths of the ocean.'),
      'answer','2'),

    -- Q50  어법상 옳은 문장  answer=④
    -- Orig Q57: "어법상 옳은 문장은?"
    -- ① the only person who → should use "that" (Korean grammar convention) ✗
    -- ② woman what → woman that/who ✗
    -- ③ understand that → understand what ✗
    -- ④ tell you what you have to do ✓ (correct)
    -- ⑤ best article which → should use "that" (superlative → that) ✗
    jsonb_build_object('number',50,
      'question',E'다음 중 어법상 옳은 문장은?',
      'options',jsonb_build_array(
        'Marco is the only friend who I can depend on.',
        'She was the first student what answered the question correctly.',
        'I cannot figure out that you are trying to explain.',
        'Nobody will show you what you need to learn on your own.',
        'This is the greatest performance which I have ever witnessed.'),
      'answer','4'),

    -- Q51  어법상 어색한 문장  answer=③
    -- Orig Q58: "어법상 어색한 문장은?"
    -- ① what to do 정상 ✓
    -- ② house that has... 정상 ✓
    -- ③ robot what → robot that/which ✗ (관계대명사 what은 선행사 불가)
    -- ④ man who gave... 정상 ✓
    -- ⑤ windows which you have broken 정상 ✓
    -- Error: "a robot what can..." → what cannot follow a noun antecedent; should be "that/which"
    jsonb_build_object('number',51,
      'question',E'다음 중 어법상 어색한 문장은?',
      'options',jsonb_build_array(
        'I have no clue what to say at the ceremony.',
        'She lives in an apartment that has a rooftop garden.',
        'This is a machine what can translate any language instantly.',
        'He is the teacher who inspired me to study science.',
        'Look at the paintings which you have damaged!'),
      'answer','3'),

-- ═══════════════════════════════════════════
    -- Part N 추가: 어법상 옳은/어색한 문장 (Q52~Q57)
    -- 관계대명사 what vs 관계대명사 that/which 혼동 어법 판별
    -- ═══════════════════════════════════════════

    -- Q52  어법상 옳은 문장  answer=①
    -- Orig Q59: "어법상 옳은 문장은?"
    --   ① That she told him was a lie. (✗ — That→What)
    --   ② I bought what I wanted to buy. (✓) ← 원래 정답
    --   ③ The boy eats only that he likes. (✗ — that→what)
    --   ④ There is some truth in that he says. (✗ — that→what)
    --   ⑤ This is the song what I want to listen to. (✗ — song what→song that)
    -- Reordered: correct sentence → ①
    jsonb_build_object('number',52,
      'question',E'다음 중 어법상 옳은 문장은?',
      'options',jsonb_build_array(
        'She finally received what she had ordered online.',
        'That he explained to us was hard to understand.',
        'The child drinks only that he enjoys.',
        'There is no meaning in that she writes.',
        'This is the movie what I want to watch tonight.'),
      'answer','1'),

    -- Q53  어법상 어색한 문장  answer=⑤
    -- Orig Q60: "어법상 어색한 문장은?"
    --   ① This is what I always listen to. (✓)
    --   ② I couldn't hear what the teacher said. (✓)
    --   ③ I don't believe what I read in ads. (✓)
    --   ④ You can choose what you like to wear it. (✗ — "it" redundant after what...wear)
    --   ⑤ You can enjoy what you want once a month. (✓)
    -- Reordered: wrong sentence → ⑤
    jsonb_build_object('number',53,
      'question',E'다음 중 어법상 어색한 문장은?',
      'options',jsonb_build_array(
        'That is what I always look forward to.',
        'He could not recall what the speaker mentioned.',
        'I never trust what I see in commercials.',
        'We can order what we prefer at the buffet.',
        'She can wear what she likes to put it on.'),
      'answer','5'),

    -- Q54  어법상 옳은 문장  answer=②
    -- Orig Q62: "어법상 옳은 문장은?"
    --   ① This is the house in which they live. (✓) ← 원래 정답
    --   ② This is the watch what I lost yesterday. (✗ — watch what→watch that)
    --   ③ I have two dogs which is very cute. (✗ — which is→which are, SVA)
    --   ④ I believe which you told me last Sunday. (✗ — which→what)
    --   ⑤ Can you find anything what tricks your eyes? (✗ — anything what→anything that)
    -- Reordered: correct sentence → ②
    jsonb_build_object('number',54,
      'question',E'다음 중 어법상 옳은 문장은?',
      'options',jsonb_build_array(
        'That is the diary what I kept during the summer.',
        'This is the park in which we used to play.',
        'She has three cats which loves sleeping all day.',
        'I accept which you promised me last Friday.',
        'Did you notice anything what caught your attention?'),
      'answer','2'),

    -- Q55  어법상 어색한 문장  answer=④
    -- Orig Q64: "어법상 어색한 문장은?" (significantly changed from original)
    -- Original used "noun what" error; this version uses "Everything what..." (indefinite + what → should be that)
    -- ALL sentences are completely new to avoid overlap with Q58
    jsonb_build_object('number',55,
      'question',E'다음 중 어법상 어색한 문장은?',
      'options',jsonb_build_array(
        'What the audience expected was a dramatic finale.',
        'She kept the necklace that her grandmother had given her.',
        'I was impressed by what the young pianist performed on stage.',
        'Everything what he promised turned out to be false.',
        'The message that arrived this morning contained surprising news.'),
      'answer','4'),

    -- Q56  어법상 옳은 문장 조합 (정답 2개 → 조합 선택지)  answer=①
    -- Orig Q65: "어법상 옳은 문장은? (정답 2개)"
    --   ① You can do what you want. (✓)
    --   ② I know that you did last summer. (✗ — that→what)
    --   ③ Ramyeon is the only food what I can make. (✗ — food what→food that)
    --   ④ This is what she gave me for Christmas. (✓)
    --   ⑤ Ann's parents like that Ann made for them. (✗ — that→what)
    -- 정답: ①④ → 조합 ① (ⓐ, ⓓ)
    jsonb_build_object('number',56,
      'question',E'다음 중 어법상 옳은 문장을 모두 고른 것은?\n\nⓐ You may choose what you wish to study.\nⓑ I remember that you said at the meeting last week.\nⓒ Pizza is the only dish what I can cook by myself.\nⓓ This is what he brought me from his trip abroad.\nⓔ Her classmates admire that she drew on the board.',
      'options',jsonb_build_array(
        'ⓐ, ⓓ',
        'ⓐ, ⓒ',
        'ⓑ, ⓓ',
        'ⓒ, ⓔ',
        'ⓓ, ⓔ'),
      'answer','1'),

    -- Q57  어법상 어색한 문장 조합 (정답 2개 → 조합 선택지)  answer=⑤
    -- Orig Q66: "어법상 어색한 문장은? (정답 2개)"
    --   ① We like the thing which he made. (✓)
    --   ② That's not what I was trying to say. (✓)
    --   ③ I love the book that you gave me yesterday. (✓)
    --   ④ This is not the movie what I want to see. (✗ — movie what→movie that)
    --   ⑤ Which she said on the phone made me upset. (✗ — Which→What)
    -- 어색: ④⑤ → 조합 ⑤ (ⓓ, ⓔ)
    jsonb_build_object('number',57,
      'question',E'다음 중 어법상 어색한 문장을 모두 고른 것은?\n\nⓐ We enjoy the dessert which she baked for us.\nⓑ That is not what I was attempting to explain.\nⓒ I treasure the scarf that you knitted for me last winter.\nⓓ This is not the jacket what I want to purchase.\nⓔ Which he whispered on the phone made her worried.',
      'options',jsonb_build_array(
        'ⓐ, ⓒ',
        'ⓑ, ⓔ',
        'ⓐ, ⓓ',
        'ⓒ, ⓓ',
        'ⓓ, ⓔ'),
      'answer','5'),

-- ═══════════════════════════════════════════
    -- Part N: 상급 어법 판별 (Q58~Q63)
    -- 어색한 것 / 옳은 개수 / 어색한 개수 / 모두 고르기 / 짝짓기
    -- ═══════════════════════════════════════════

    -- Q58  어법상 어색한 것  answer=②
    -- Orig Q67: "어법상 어색한 것은?"
    -- ① what 주어절 정상 ✓  ② what-clause 뒤 목적어 "it" 잉여 ✗  ③ what 목적어절 정상 ✓  ④ the thing that 정상 ✓  ⑤ what 주어절 정상 ✓
    -- Error: "This is not what she wants to have it." → "it" is redundant; what already serves as the object of "have"
    -- Original wrong sentence was ④, reordered to ②
    jsonb_build_object('number',58,
      'question',E'다음 중 어법상 어색한 것은?',
      'options',jsonb_build_array(
        '① What matters most is your effort.',
        '② That is not what he planned to achieve it.',
        '③ I tasted what my grandmother cooked for dinner.',
        '④ The thing that she planted in the garden grew fast.',
        '⑤ Volunteering is doing what comes from your heart.'),
      'answer','2'),

    -- Q59  어법상 옳은 문장의 총 개수  answer=②
    -- Orig Q68: "어법상 옳은 문장의 총 개수는?"
    -- 4 sentences, only 1 correct:
    --  • chocolate what → that/which ✗ (what은 선행사 뒤 불가)
    --  • give you which → give you what ✗ (which는 선행사 없이 불가)
    --  • Reading is that → Reading is what ✗ (that→what, 보어 관계대명사)
    --  • different from what we expected ✓
    -- Answer: 1개 = ②
    jsonb_build_object('number',59,
      'question',E'다음 중 어법상 옳은 문장의 총 개수는?\n\n• It is the final cookie what I saved for you.\n• She will lend you which you need for the project.\n• Painting pictures is that he enjoys on weekends.\n• The outcome of the experiment was different from what we had predicted.',
      'options',jsonb_build_array(
        '① 0개',
        '② 1개',
        '③ 2개',
        '④ 3개',
        '⑤ 4개'),
      'answer','2'),

    -- Q60  어법상 어색한 문장의 총 개수  answer=④
    -- Orig Q69: "어법상 어색한 문장의 총 개수는?"
    -- 7 sentences, 4 wrong:
    --  • what you just mentioned it → "it" redundant ✗
    --  • tell me what you have planned → 정상 ✓
    --  • This is not what you promised us → 정상 ✓
    --  • Everything what → Everything that ✗ (Everything은 선행사, what 불가)
    --  • The store didn't carry that I wanted → that→what ✗ (선행사 없이 that 불가)
    --  • This necklace is the item that she picked → 정상 ✓
    --  • This is the book what I borrowed → book what→book that ✗ (선행사 뒤 what 불가)
    -- 어색한 문장: 4개 = ④
    jsonb_build_object('number',60,
      'question',E'다음 중 어법상 어색한 문장의 총 개수는?\n\n• I cannot agree with what you just mentioned it.\n• Could you tell me what you have planned for tomorrow?\n• This is not what you promised us.\n• Everything what they reported turned out to be false.\n• The bakery didn''t carry that I was looking for.\n• This necklace is the item that she picked out.\n• This is the book what I borrowed from the library.',
      'options',jsonb_build_array(
        '① 1개',
        '② 2개',
        '③ 3개',
        '④ 4개',
        '⑤ 5개'),
      'answer','4'),

    -- Q61  어법상 어색한 것을 모두 고르면  answer=⑤
    -- Orig Q70: "어법상 어색한 것을 모두 고르면?"
    -- (a) which→what 오류 ✗ (선행사 없이 which 불가, what 써야 함)
    -- (b) What makes me happy 정상 ✓
    -- (c) describe what he was wearing 정상 ✓
    -- (d) who→what 오류 ✗ (말한 내용은 what, 사람이 아님)
    -- (e) girl what→girl that/who ✗ (선행사 뒤 what 불가)
    -- 어색한 것: (a), (d), (e) = ⑤
    jsonb_build_object('number',61,
      'question',E'다음 중 어법상 어색한 것을 모두 고르면?\n\n(a) I don''t trust which I read on that website.\n(b) What surprises me most is her determination.\n(c) Can you recall what he was carrying in his bag?\n(d) Don''t repeat to anyone who I told you yesterday.\n(e) She forgot the address of the hotel what she stayed at.',
      'options',jsonb_build_array(
        '(a), (b), (c)',
        '(b), (c), (e)',
        '(a), (c), (e)',
        '(b), (d), (e)',
        '(a), (d), (e)'),
      'answer','5'),

    -- Q62  어법상 옳은 문장끼리 바르게 짝지어진 것  answer=①
    -- Orig Q71: "어법상 옳은 문장끼리 바르게 짝지어진 것은?"
    -- a. He is not what he used to be. ✓ (what = "예전의 그" 관용 표현)
    -- b. That's not that I'm looking for. ✗ (that→what, 선행사 없이 that 불가)
    -- c. You can buy what you want to have. ✓ (what 목적어절 정상)
    -- d. Jazz music is that my dad enjoys listening to. ✗ (that→what, 보어 관계대명사)
    -- e. That's not what I want for my birthday. ✓ (what 보어절 정상)
    -- f. Show me the thing which is in your pocket. ✓ (the thing which 정상)
    -- g. A person who puts out fires are a firefighter. ✗ (are→is, 주어-동사 수 불일치)
    -- 옳은 것: a, c, e, f = ①
    jsonb_build_object('number',62,
      'question',E'다음 중 어법상 옳은 문장끼리 바르게 짝지어진 것은?\n\na. She is not what she used to be.\nb. That''s not that I''m searching for.\nc. You can order what you wish to eat.\nd. Classical music is that my mom loves listening to.\ne. That''s not what I expected for our anniversary.\nf. Hand me the tool which is on the shelf.\ng. A student who finishes early are allowed to leave.',
      'options',jsonb_build_array(
        'a, c, e, f',
        'a, b, d, f',
        'b, c, d, e',
        'a, c, f, g',
        'c, e, f, g'),
      'answer','1'),

    -- Q63  어법상 어색한 문장끼리 바르게 짝지어진 것  answer=③
    -- Orig Q72: "어법상 어색한 문장끼리 바르게 짝지어진 것은?"
    -- ⓐ I need to understand what you are feeling. ✓ (what 목적어절 정상)
    -- ⓑ This is the cozy village that we grew up in. ✓ (the village that 정상)
    -- ⓒ This is the essay in that I invested effort. ✗ ("in that"→"in which", 전치사+that 불가)
    -- ⓓ I wonder what he is building in the garage. ✓ (what 간접의문 정상)
    -- ⓔ They own a lovely cottage which faces the sea. ✓ (cottage which 정상)
    -- ⓕ The bicycle what is chained here belongs to my brother. ✗ (bicycle what→bicycle that, 선행사 뒤 what 불가)
    -- ⓖ She remained cheerful although she was exhausted. ✓ (although 양보절 정상)
    -- ⓗ Notice those stars what are shining above the mountain. ✗ (stars what→stars that, 선행사 뒤 what 불가)
    -- ⓘ Kevin entered the classroom which door was locked. ✗ (which→whose, 소유격 관계대명사)
    -- 어색한 것: ⓒ, ⓕ, ⓗ, ⓘ = ③
    jsonb_build_object('number',63,
      'question',E'다음 중 어법상 어색한 문장끼리 바르게 짝지어진 것은?\n\nⓐ I need to understand what you are feeling.\nⓑ This is the cozy village that we grew up in.\nⓒ This is the essay in that I invested a lot of effort.\nⓓ I wonder what he is building in the garage.\nⓔ They own a lovely cottage which faces the sea.\nⓕ The bicycle what is chained here belongs to my brother.\nⓖ She remained cheerful although she was exhausted.\nⓗ Notice those stars what are shining above the mountain.\nⓘ Kevin entered the classroom which door was locked.',
      'options',jsonb_build_array(
        'ⓐ, ⓑ, ⓓ, ⓗ',
        'ⓐ, ⓒ, ⓔ, ⓖ',
        'ⓒ, ⓕ, ⓗ, ⓘ',
        'ⓒ, ⓓ, ⓕ, ⓖ',
        'ⓓ, ⓔ, ⓖ, ⓘ'),
      'answer','3')

  );

  -- ═══════════════════════════════════════════
  -- Answer key (Q1~Q63)
  -- ═══════════════════════════════════════════
  a := jsonb_build_array(
    '5','3','1','4','5','3','4','4','2','4',
    '5','2','1','3','3','5','5','5','1','1',
    '4','2','3','3','2','4','2','1','2','1',
    '2','1','5','3','4','3','1','5','4','1',
    '2','4','3','1','2','4','5','3','2','4',
    '3','1','5','2','4','1','5','2','2','4',
    '5','1','3'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES (
    '관계대명사 what Step2',
    '관계대명사 what',
    q, a,
    'problem',
    'interactive'
  );

  RAISE NOTICE '관계대명사 what Step2 — 63문항 생성 완료 (답 분포: ①13 ②13 ③12 ④13 ⑤12)';
END;
$$;
