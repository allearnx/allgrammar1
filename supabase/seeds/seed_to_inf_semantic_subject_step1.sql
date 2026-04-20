DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = 'to부정사의 의미상의 주어 Step1';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- Part 1. 괄호 선택 MCQ (Q1~Q12)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nIt is dangerous _______ children to swim in this lake alone.', 'options',jsonb_build_array(E'of', E'for', E'to', E'with', E'at'), 'answer',E'2'),
    jsonb_build_object('number',2, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nIt was very thoughtful _______ to remember my birthday.', 'options',jsonb_build_array(E'for she', E'for her', E'of she', E'of her', E'to her'), 'answer',E'4'),
    jsonb_build_object('number',3, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nIt is not easy _______ me to concentrate in a noisy place.', 'options',jsonb_build_array(E'of', E'to', E'for', E'with', E'at'), 'answer',E'3'),
    jsonb_build_object('number',4, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nIt was careless _______ to leave his phone on the bus.', 'options',jsonb_build_array(E'for he', E'of he', E'for him', E'to him', E'of him'), 'answer',E'5'),
    jsonb_build_object('number',5, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nIt is very important _______ young people to develop good habits early.', 'options',jsonb_build_array(E'for', E'of', E'to', E'with', E'at'), 'answer',E'1'),
    jsonb_build_object('number',6, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nIt was very brave _______ to speak up in front of the crowd.', 'options',jsonb_build_array(E'for she', E'of she', E'of her', E'for her', E'to her'), 'answer',E'3'),
    jsonb_build_object('number',7, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nIt is quite challenging _______ beginners to master a new language in six months.', 'options',jsonb_build_array(E'of', E'to', E'at', E'for', E'with'), 'answer',E'4'),
    jsonb_build_object('number',8, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nIt was so foolish _______ to trust a stranger online.', 'options',jsonb_build_array(E'to him', E'of him', E'for he', E'of he', E'for him'), 'answer',E'2'),
    jsonb_build_object('number',9, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nIt is necessary _______ all passengers to fasten their seatbelts during takeoff.', 'options',jsonb_build_array(E'of', E'to', E'with', E'at', E'for'), 'answer',E'5'),
    jsonb_build_object('number',10, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nIt was so kind _______ to lend me her notes before the exam.', 'options',jsonb_build_array(E'of her', E'for she', E'for her', E'of she', E'to her'), 'answer',E'1'),
    jsonb_build_object('number',11, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nIt is very unusual _______ him to arrive late — he is always on time.', 'options',jsonb_build_array(E'of', E'to', E'for', E'with', E'at'), 'answer',E'3'),
    jsonb_build_object('number',12, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nIt is very generous _______ to donate his prize money to the school library.', 'options',jsonb_build_array(E'for he', E'for him', E'of he', E'of him', E'to him'), 'answer',E'4'),

    -- ═══════════════════════════════════════════
    -- Part 2. 두 문장 → 한 문장으로 (Q13~Q22)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',13, 'type','subjective', 'question',E'다음 두 문장을 <보기>와 같이 한 문장으로 만드시오.\n\n<보기> I watched a baseball game. It was boring.\n→ It was boring for me to watch a baseball game.\n\nShe read the whole novel in one day. It was impressive.', 'answer',E'It was impressive for her to read the whole novel in one day.', 'acceptedAnswers',jsonb_build_array(E'It was impressive for her to read the whole novel in one day.', E'It was impressive for her to read the whole novel in one day')),
    jsonb_build_object('number',14, 'type','subjective', 'question',E'다음 두 문장을 <보기>와 같이 한 문장으로 만드시오.\n\n<보기> I watched a baseball game. It was boring.\n→ It was boring for me to watch a baseball game.\n\nHe gave up his seat for an elderly person. It was very kind.', 'answer',E'It was very kind of him to give up his seat for an elderly person.', 'acceptedAnswers',jsonb_build_array(E'It was very kind of him to give up his seat for an elderly person.', E'It was very kind of him to give up his seat for an elderly person')),
    jsonb_build_object('number',15, 'type','subjective', 'question',E'다음 두 문장을 <보기>와 같이 한 문장으로 만드시오.\n\n<보기> I watched a baseball game. It was boring.\n→ It was boring for me to watch a baseball game.\n\nThey should recycle waste every day. It is important.', 'answer',E'It is important for them to recycle waste every day.', 'acceptedAnswers',jsonb_build_array(E'It is important for them to recycle waste every day.', E'It is important for them to recycle waste every day')),
    jsonb_build_object('number',16, 'type','subjective', 'question',E'다음 두 문장을 <보기>와 같이 한 문장으로 만드시오.\n\n<보기> I watched a baseball game. It was boring.\n→ It was boring for me to watch a baseball game.\n\nShe forgot to lock the front door. It was careless.', 'answer',E'It was careless of her to forget to lock the front door.', 'acceptedAnswers',jsonb_build_array(E'It was careless of her to forget to lock the front door.', E'It was careless of her to forget to lock the front door')),
    jsonb_build_object('number',17, 'type','subjective', 'question',E'다음 두 문장을 <보기>와 같이 한 문장으로 만드시오.\n\n<보기> I watched a baseball game. It was boring.\n→ It was boring for me to watch a baseball game.\n\nWe need to finish three assignments by tomorrow. It is very difficult.', 'answer',E'It is very difficult for us to finish three assignments by tomorrow.', 'acceptedAnswers',jsonb_build_array(E'It is very difficult for us to finish three assignments by tomorrow.', E'It is very difficult for us to finish three assignments by tomorrow')),
    jsonb_build_object('number',18, 'type','subjective', 'question',E'다음 두 문장을 <보기>와 같이 한 문장으로 만드시오.\n\n<보기> I watched a baseball game. It was boring.\n→ It was boring for me to watch a baseball game.\n\nHe shared his lunch with a classmate who had nothing. It was generous.', 'answer',E'It was generous of him to share his lunch with a classmate who had nothing.', 'acceptedAnswers',jsonb_build_array(E'It was generous of him to share his lunch with a classmate who had nothing.', E'It was generous of him to share his lunch with a classmate who had nothing')),
    jsonb_build_object('number',19, 'type','subjective', 'question',E'다음 두 문장을 <보기>와 같이 한 문장으로 만드시오.\n\n<보기> I watched a baseball game. It was boring.\n→ It was boring for me to watch a baseball game.\n\nShe should get enough sleep before the big competition. It is necessary.', 'answer',E'It is necessary for her to get enough sleep before the big competition.', 'acceptedAnswers',jsonb_build_array(E'It is necessary for her to get enough sleep before the big competition.', E'It is necessary for her to get enough sleep before the big competition')),
    jsonb_build_object('number',20, 'type','subjective', 'question',E'다음 두 문장을 <보기>와 같이 한 문장으로 만드시오.\n\n<보기> I watched a baseball game. It was boring.\n→ It was boring for me to watch a baseball game.\n\nHe spent all his savings on one concert ticket. It was foolish.', 'answer',E'It was foolish of him to spend all his savings on one concert ticket.', 'acceptedAnswers',jsonb_build_array(E'It was foolish of him to spend all his savings on one concert ticket.', E'It was foolish of him to spend all his savings on one concert ticket')),
    jsonb_build_object('number',21, 'type','subjective', 'question',E'다음 두 문장을 <보기>와 같이 한 문장으로 만드시오.\n\n<보기> I watched a baseball game. It was boring.\n→ It was boring for me to watch a baseball game.\n\nChildren play on the road at night. It is dangerous.', 'answer',E'It is dangerous for children to play on the road at night.', 'acceptedAnswers',jsonb_build_array(E'It is dangerous for children to play on the road at night.', E'It is dangerous for children to play on the road at night')),
    jsonb_build_object('number',22, 'type','subjective', 'question',E'다음 두 문장을 <보기>와 같이 한 문장으로 만드시오.\n\n<보기> I watched a baseball game. It was boring.\n→ It was boring for me to watch a baseball game.\n\nShe had to carry five heavy boxes up the stairs alone. It was very hard.', 'answer',E'It was very hard for her to carry five heavy boxes up the stairs alone.', 'acceptedAnswers',jsonb_build_array(E'It was very hard for her to carry five heavy boxes up the stairs alone.', E'It was very hard for her to carry five heavy boxes up the stairs alone')),

    -- ═══════════════════════════════════════════
    -- Part 3. 단어 배열 (Q23~Q32)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',23, 'type','subjective', 'question',E'다음 괄호 안의 단어를 알맞은 순서로 배열하여 문장을 완성하시오.\n\n(important, it, for, is, students, to, review, their, notes, daily)', 'answer',E'It is important for students to review their notes daily.', 'acceptedAnswers',jsonb_build_array(E'It is important for students to review their notes daily.', E'It is important for students to review their notes daily')),
    jsonb_build_object('number',24, 'type','subjective', 'question',E'다음 괄호 안의 단어를 알맞은 순서로 배열하여 문장을 완성하시오.\n\n(was, it, of, very, wise, her, to, turn, down, the, offer)', 'answer',E'It was very wise of her to turn down the offer.', 'acceptedAnswers',jsonb_build_array(E'It was very wise of her to turn down the offer.', E'It was very wise of her to turn down the offer')),
    jsonb_build_object('number',25, 'type','subjective', 'question',E'다음 괄호 안의 단어를 알맞은 순서로 배열하여 문장을 완성하시오.\n\n(dangerous, it, is, for, drivers, to, use, their, phones, while, driving)', 'answer',E'It is dangerous for drivers to use their phones while driving.', 'acceptedAnswers',jsonb_build_array(E'It is dangerous for drivers to use their phones while driving.', E'It is dangerous for drivers to use their phones while driving')),
    jsonb_build_object('number',26, 'type','subjective', 'question',E'다음 괄호 안의 단어를 알맞은 순서로 배열하여 문장을 완성하시오.\n\n(was, it, foolish, of, him, to, believe, everything, he, read, online)', 'answer',E'It was foolish of him to believe everything he read online.', 'acceptedAnswers',jsonb_build_array(E'It was foolish of him to believe everything he read online.', E'It was foolish of him to believe everything he read online')),
    jsonb_build_object('number',27, 'type','subjective', 'question',E'다음 괄호 안의 단어를 알맞은 순서로 배열하여 문장을 완성하시오.\n\n(not, it, is, easy, for, me, to, wake, up, early, every, morning)', 'answer',E'It is not easy for me to wake up early every morning.', 'acceptedAnswers',jsonb_build_array(E'It is not easy for me to wake up early every morning.', E'It is not easy for me to wake up early every morning')),
    jsonb_build_object('number',28, 'type','subjective', 'question',E'다음 괄호 안의 단어를 알맞은 순서로 배열하여 문장을 완성하시오.\n\n(it, was, very, kind, of, them, to, wait, for, us, at, the, station)', 'answer',E'It was very kind of them to wait for us at the station.', 'acceptedAnswers',jsonb_build_array(E'It was very kind of them to wait for us at the station.', E'It was very kind of them to wait for us at the station')),
    jsonb_build_object('number',29, 'type','subjective', 'question',E'다음 괄호 안의 단어를 알맞은 순서로 배열하여 문장을 완성하시오.\n\n(necessary, it, is, for, athletes, to, warm, up, before, training)', 'answer',E'It is necessary for athletes to warm up before training.', 'acceptedAnswers',jsonb_build_array(E'It is necessary for athletes to warm up before training.', E'It is necessary for athletes to warm up before training')),
    jsonb_build_object('number',30, 'type','subjective', 'question',E'다음 괄호 안의 단어를 알맞은 순서로 배열하여 문장을 완성하시오.\n\n(was, it, very, careless, of, you, to, leave, your, bag, on, the, train)', 'answer',E'It was very careless of you to leave your bag on the train.', 'acceptedAnswers',jsonb_build_array(E'It was very careless of you to leave your bag on the train.', E'It was very careless of you to leave your bag on the train')),
    jsonb_build_object('number',31, 'type','subjective', 'question',E'다음 괄호 안의 단어를 알맞은 순서로 배열하여 문장을 완성하시오.\n\n(impossible, it, is, for, him, to, finish, the, report, by, tonight)', 'answer',E'It is impossible for him to finish the report by tonight.', 'acceptedAnswers',jsonb_build_array(E'It is impossible for him to finish the report by tonight.', E'It is impossible for him to finish the report by tonight')),
    jsonb_build_object('number',32, 'type','subjective', 'question',E'다음 괄호 안의 단어를 알맞은 순서로 배열하여 문장을 완성하시오.\n\n(was, it, very, honest, of, her, to, admit, her, mistake, in, public)', 'answer',E'It was very honest of her to admit her mistake in public.', 'acceptedAnswers',jsonb_build_array(E'It was very honest of her to admit her mistake in public.', E'It was very honest of her to admit her mistake in public')),

    -- ═══════════════════════════════════════════
    -- Part 4. 같은 의미 빈칸 채우기 (Q33~Q44)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',33, 'type','subjective', 'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nShe is very nice to help the lost child find his parents.\n→ It is very _______ to help the lost child find his parents.', 'answer',E'nice of her', 'acceptedAnswers',jsonb_build_array(E'nice of her')),
    jsonb_build_object('number',34, 'type','subjective', 'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nHe was silly to spend all his pocket money on games.\n→ It was _______ to spend all his pocket money on games.', 'answer',E'silly of him', 'acceptedAnswers',jsonb_build_array(E'silly of him')),
    jsonb_build_object('number',35, 'type','subjective', 'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nI cannot go hiking alone in this weather.\n→ It is impossible _______ to go hiking alone in this weather.', 'answer',E'for me', 'acceptedAnswers',jsonb_build_array(E'for me')),
    jsonb_build_object('number',36, 'type','subjective', 'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nIt is necessary that students hand in their homework on time.\n→ It is necessary _______ on time.', 'answer',E'for students to hand in their homework', 'acceptedAnswers',jsonb_build_array(E'for students to hand in their homework')),
    jsonb_build_object('number',37, 'type','subjective', 'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nThey could reach the summit before sunset.\n→ It was possible _______ before sunset.', 'answer',E'for them to reach the summit', 'acceptedAnswers',jsonb_build_array(E'for them to reach the summit')),
    jsonb_build_object('number',38, 'type','subjective', 'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nIt is not hard for him to solve these math problems.\n→ _______ are not hard for him to solve.', 'answer',E'These math problems', 'acceptedAnswers',jsonb_build_array(E'These math problems')),
    jsonb_build_object('number',39, 'type','subjective', 'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nIt is easy that we communicate with people around the world now.\n→ It is easy _______ around the world now.', 'answer',E'for us to communicate with people', 'acceptedAnswers',jsonb_build_array(E'for us to communicate with people')),
    jsonb_build_object('number',40, 'type','subjective', 'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nI need three hours to complete this painting.\n→ It takes _______ hours _______.', 'answer',E'three / for me to complete this painting', 'acceptedAnswers',jsonb_build_array(E'three / for me to complete this painting', E'three, for me to complete this painting')),
    jsonb_build_object('number',41, 'type','subjective', 'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nWe cannot win the championship without working together.\n→ It is _______ to win the championship without working together.', 'answer',E'impossible for us', 'acceptedAnswers',jsonb_build_array(E'impossible for us')),
    jsonb_build_object('number',42, 'type','subjective', 'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nThis book is difficult for middle school students to understand.\n→ It is _______ to understand this book.', 'answer',E'difficult for middle school students', 'acceptedAnswers',jsonb_build_array(E'difficult for middle school students')),
    jsonb_build_object('number',43, 'type','subjective', 'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nIt is necessary that you drink plenty of water every day.\n→ _______ necessary _______ every day.', 'answer',E'It is / for you to drink plenty of water', 'acceptedAnswers',jsonb_build_array(E'It is / for you to drink plenty of water', E'It is, for you to drink plenty of water')),
    jsonb_build_object('number',44, 'type','subjective', 'question',E'다음 두 문장이 같은 의미가 되도록 빈칸에 알맞은 말을 쓰시오.\n\nShe was wise to invest her time in learning new skills.\n→ It was _______ to invest her time in learning new skills.', 'answer',E'wise of her', 'acceptedAnswers',jsonb_build_array(E'wise of her')),

    -- ═══════════════════════════════════════════
    -- Part 5. 우리말 → 단어 배열 영작 (Q45~Q58)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',45, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n내가 매일 영어 일기를 쓰는 것은 중요하다.\n(important, it, for, is, me, to, write, an, English, diary, every, day)', 'answer',E'It is important for me to write an English diary every day.', 'acceptedAnswers',jsonb_build_array(E'It is important for me to write an English diary every day.', E'It is important for me to write an English diary every day')),
    jsonb_build_object('number',46, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n그가 이것을 선택한 것은 매우 현명했다.\n(was, him, very, of, it, wise, to, choose, this)', 'answer',E'It was very wise of him to choose this.', 'acceptedAnswers',jsonb_build_array(E'It was very wise of him to choose this.', E'It was very wise of him to choose this')),
    jsonb_build_object('number',47, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n네가 이 강에서 수영하는 것은 위험하다.\n(is, for, dangerous, it, you, to, swim, in, this, river)', 'answer',E'It is dangerous for you to swim in this river.', 'acceptedAnswers',jsonb_build_array(E'It is dangerous for you to swim in this river.', E'It is dangerous for you to swim in this river')),
    jsonb_build_object('number',48, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\nAlice가 우리를 파티에 초대한 것은 매우 친절했다.\n(was, invite, very, to, kind, of, it, Alice, us, to, the, party)', 'answer',E'It was very kind of Alice to invite us to the party.', 'acceptedAnswers',jsonb_build_array(E'It was very kind of Alice to invite us to the party.', E'It was very kind of Alice to invite us to the party')),
    jsonb_build_object('number',49, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n어린 학생들이 휴대폰 사용을 조절하는 건 쉽지 않아.\n(is, not, control, their, it, young, easy, to, for, students, cell, phone, usage)', 'answer',E'It is not easy for young students to control their cell phone usage.', 'acceptedAnswers',jsonb_build_array(E'It is not easy for young students to control their cell phone usage.', E'It is not easy for young students to control their cell phone usage')),
    jsonb_build_object('number',50, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n당신이 그 돈을 다 쓴 것은 어리석었다.\n(was, all, you, to, money, it, stupid, of, spend, the)', 'answer',E'It was stupid of you to spend all the money.', 'acceptedAnswers',jsonb_build_array(E'It was stupid of you to spend all the money.', E'It was stupid of you to spend all the money')),
    jsonb_build_object('number',51, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n우리는 반드시 서두를 필요가 없다.\n(for, necessary, is, not, it, hurry, to, us)', 'answer',E'It is not necessary for us to hurry.', 'acceptedAnswers',jsonb_build_array(E'It is not necessary for us to hurry.', E'It is not necessary for us to hurry')),
    jsonb_build_object('number',52, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n거짓말을 하지 않다니 그는 정말 정직하다.\n(not, of, to, tell, is, him, honest, a, lie, very, it)', 'answer',E'It is very honest of him not to tell a lie.', 'acceptedAnswers',jsonb_build_array(E'It is very honest of him not to tell a lie.', E'It is very honest of him not to tell a lie')),
    jsonb_build_object('number',53, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n어린 아이들이 오랫동안 가만히 앉아 있는 것은 어렵다.\n(time, difficult, it, young, is, still, for, long, sit, for, children, a, to)', 'answer',E'It is difficult for young children to sit still for a long time.', 'acceptedAnswers',jsonb_build_array(E'It is difficult for young children to sit still for a long time.', E'It is difficult for young children to sit still for a long time')),
    jsonb_build_object('number',54, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n운전자들이 교통 신호를 위반하는 것은 위험하다.\n(to, is, lights, for, traffic, it, the, violate, drivers, dangerous)', 'answer',E'It is dangerous for drivers to violate the traffic lights.', 'acceptedAnswers',jsonb_build_array(E'It is dangerous for drivers to violate the traffic lights.', E'It is dangerous for drivers to violate the traffic lights')),
    jsonb_build_object('number',55, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n수학을 공부하는 것은 그에게 어렵다.\n(him, to, difficult, it, for, study, is, math)', 'answer',E'It is difficult for him to study math.', 'acceptedAnswers',jsonb_build_array(E'It is difficult for him to study math.', E'It is difficult for him to study math')),
    jsonb_build_object('number',56, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n그녀가 체중을 줄이는 것은 불가능한 일이었다.\n(was, for, impossible, to, weight, it, her, lose)', 'answer',E'It was impossible for her to lose weight.', 'acceptedAnswers',jsonb_build_array(E'It was impossible for her to lose weight.', E'It was impossible for her to lose weight')),
    jsonb_build_object('number',57, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n나는 매일 아침 일찍 일어나는 것이 힘들다.\n(difficult, up, it, early, morning, is, get, me, every, for, to)', 'answer',E'It is difficult for me to get up early every morning.', 'acceptedAnswers',jsonb_build_array(E'It is difficult for me to get up early every morning.', E'It is difficult for me to get up early every morning')),
    jsonb_build_object('number',58, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n그녀가 혼자 그 상자를 옮기는 것은 어렵다.\n(difficult, is, it, the, to, by, her, box, herself, for, move)', 'answer',E'It is difficult for her to move the box by herself.', 'acceptedAnswers',jsonb_build_array(E'It is difficult for her to move the box by herself.', E'It is difficult for her to move the box by herself')),

    -- ═══════════════════════════════════════════
    -- Part 6. 오류 수정 (Q59~Q68)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',59, 'type','subjective', 'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nIt is rude of passengers to talk loudly on the subway.', 'answer',E'of → for', 'acceptedAnswers',jsonb_build_array(E'of → for', E'of를 for로')),
    jsonb_build_object('number',60, 'type','subjective', 'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nIt is wise for her to apologize first after the argument.', 'answer',E'for → of', 'acceptedAnswers',jsonb_build_array(E'for → of', E'for를 of로')),
    jsonb_build_object('number',61, 'type','subjective', 'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nIt is impossible of us to submit the project before the deadline.', 'answer',E'of → for', 'acceptedAnswers',jsonb_build_array(E'of → for', E'of를 for로')),
    jsonb_build_object('number',62, 'type','subjective', 'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nIt is clever for him to figure out the answer without any hints.', 'answer',E'for → of', 'acceptedAnswers',jsonb_build_array(E'for → of', E'for를 of로')),
    jsonb_build_object('number',63, 'type','subjective', 'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nIt is so nice for he to cook dinner for the whole family.', 'answer',E'for he → of him', 'acceptedAnswers',jsonb_build_array(E'for he → of him', E'for he를 of him으로')),
    jsonb_build_object('number',64, 'type','subjective', 'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nIt is difficulty for me to explain this concept in simple words.', 'answer',E'difficulty → difficult', 'acceptedAnswers',jsonb_build_array(E'difficulty → difficult', E'difficulty를 difficult로')),
    jsonb_build_object('number',65, 'type','subjective', 'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nIt is hard to children to focus during online classes.', 'answer',E'to children → for children', 'acceptedAnswers',jsonb_build_array(E'to children → for children', E'to를 for로')),
    jsonb_build_object('number',66, 'type','subjective', 'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nIt is important for students to writing a summary after each chapter.', 'answer',E'to writing → to write', 'acceptedAnswers',jsonb_build_array(E'to writing → to write', E'writing → write', E'writing을 write로')),
    jsonb_build_object('number',67, 'type','subjective', 'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nIt was so stupid of they to ignore the teacher''s warning.', 'answer',E'of they → of them', 'acceptedAnswers',jsonb_build_array(E'of they → of them', E'they → them', E'they를 them으로')),
    jsonb_build_object('number',68, 'type','subjective', 'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nIt is impossible for our to please everyone all the time.', 'answer',E'for our → for us', 'acceptedAnswers',jsonb_build_array(E'for our → for us', E'our → us', E'our를 us로')),

    -- ═══════════════════════════════════════════
    -- Part 7. 우리말 → 영작 (Q69~Q80)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',69, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n내가 영어를 공부하는 것은 중요하다.\n(study)\nIt is', 'answer',E'It is important for me to study English.', 'acceptedAnswers',jsonb_build_array(E'It is important for me to study English.', E'It is important for me to study English')),
    jsonb_build_object('number',70, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n우리가 이 의자를 옮기는 것은 어렵지 않다.\n(difficult, move)\n→ _______ this chair.', 'answer',E'It is not difficult for us to move this chair.', 'acceptedAnswers',jsonb_build_array(E'It is not difficult for us to move this chair.', E'It is not difficult for us to move this chair')),
    jsonb_build_object('number',71, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n내가 그를 이해하는 것은 어렵다.\n(hard, understand)', 'answer',E'It is hard for me to understand him.', 'acceptedAnswers',jsonb_build_array(E'It is hard for me to understand him.', E'It is hard for me to understand him')),
    jsonb_build_object('number',72, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n다른 사람들과 많은 것을 나누다니 너는 참 친절하구나.\n(nice, share, many)\n→ _______ with other people.', 'answer',E'It is very nice of you to share many things with other people.', 'acceptedAnswers',jsonb_build_array(E'It is very nice of you to share many things with other people.', E'It is very nice of you to share many things with other people')),
    jsonb_build_object('number',73, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n당신이 그 경기를 이기는 것이 쉬웠나요?\n(win, the game)', 'answer',E'Was it easy for you to win the game?', 'acceptedAnswers',jsonb_build_array(E'Was it easy for you to win the game?', E'Was it easy for you to win the game')),
    jsonb_build_object('number',74, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\nTed가 대회에서 우승하는 것은 가능할 것이다.\n(possible, win, contest)', 'answer',E'It will be possible for Ted to win the contest.', 'acceptedAnswers',jsonb_build_array(E'It will be possible for Ted to win the contest.', E'It will be possible for Ted to win the contest')),
    jsonb_build_object('number',75, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n어린아이들이 혼자서 길을 건너는 것은 위험하다.\n(children, cross)\n→ _______ alone.', 'answer',E'It is dangerous for children to cross the road alone.', 'acceptedAnswers',jsonb_build_array(E'It is dangerous for children to cross the road alone.', E'It is dangerous for children to cross the road alone')),
    jsonb_build_object('number',76, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\nAlice가 그 제안을 거절하는 것은 현명한 일이다.\n(wise, the offer)', 'answer',E'It is wise of Alice to refuse the offer.', 'acceptedAnswers',jsonb_build_array(E'It is wise of Alice to refuse the offer.', E'It is wise of Alice to refuse the offer')),
    jsonb_build_object('number',77, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n나의 엄마가 새로운 치마를 사는 것은 드문 일이다.\n(unusual, mother)', 'answer',E'It is unusual for my mother to buy a new skirt.', 'acceptedAnswers',jsonb_build_array(E'It is unusual for my mother to buy a new skirt.', E'It is unusual for my mother to buy a new skirt')),
    jsonb_build_object('number',78, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n그녀가 마라톤을 하는 것은 놀랍다.\n(surprising, run, a marathon)', 'answer',E'It is surprising for her to run a marathon.', 'acceptedAnswers',jsonb_build_array(E'It is surprising for her to run a marathon.', E'It is surprising for her to run a marathon')),
    jsonb_build_object('number',79, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n네가 길 잃은 애완동물들을 돌보는 것은 참으로 친절하다.\n(very, take care of, lost pets)', 'answer',E'It is very kind of you to take care of lost pets.', 'acceptedAnswers',jsonb_build_array(E'It is very kind of you to take care of lost pets.', E'It is very kind of you to take care of lost pets')),
    jsonb_build_object('number',80, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n이 미술관에는 내가 즐길 만한 많은 그림들이 있다.\n(there, lots of, enjoy)\nIn this art museum,', 'answer',E'there are lots of paintings for me to enjoy.', 'acceptedAnswers',jsonb_build_array(E'there are lots of paintings for me to enjoy.', E'there are lots of paintings for me to enjoy', E'In this art museum, there are lots of paintings for me to enjoy.'))
  );

  a := jsonb_build_array(
    '2','4','3','5','1','3','4','2','5','1','3','4',
    E'It was impressive for her to read the whole novel in one day.',
    E'It was very kind of him to give up his seat for an elderly person.',
    E'It is important for them to recycle waste every day.',
    E'It was careless of her to forget to lock the front door.',
    E'It is very difficult for us to finish three assignments by tomorrow.',
    E'It was generous of him to share his lunch with a classmate who had nothing.',
    E'It is necessary for her to get enough sleep before the big competition.',
    E'It was foolish of him to spend all his savings on one concert ticket.',
    E'It is dangerous for children to play on the road at night.',
    E'It was very hard for her to carry five heavy boxes up the stairs alone.',
    E'It is important for students to review their notes daily.',
    E'It was very wise of her to turn down the offer.',
    E'It is dangerous for drivers to use their phones while driving.',
    E'It was foolish of him to believe everything he read online.',
    E'It is not easy for me to wake up early every morning.',
    E'It was very kind of them to wait for us at the station.',
    E'It is necessary for athletes to warm up before training.',
    E'It was very careless of you to leave your bag on the train.',
    E'It is impossible for him to finish the report by tonight.',
    E'It was very honest of her to admit her mistake in public.',
    E'nice of her', E'silly of him', E'for me',
    E'for students to hand in their homework',
    E'for them to reach the summit',
    E'These math problems',
    E'for us to communicate with people',
    E'three / for me to complete this painting',
    E'impossible for us',
    E'difficult for middle school students',
    E'It is / for you to drink plenty of water',
    E'wise of her',
    E'It is important for me to write an English diary every day.',
    E'It was very wise of him to choose this.',
    E'It is dangerous for you to swim in this river.',
    E'It was very kind of Alice to invite us to the party.',
    E'It is not easy for young students to control their cell phone usage.',
    E'It was stupid of you to spend all the money.',
    E'It is not necessary for us to hurry.',
    E'It is very honest of him not to tell a lie.',
    E'It is difficult for young children to sit still for a long time.',
    E'It is dangerous for drivers to violate the traffic lights.',
    E'It is difficult for him to study math.',
    E'It was impossible for her to lose weight.',
    E'It is difficult for me to get up early every morning.',
    E'It is difficult for her to move the box by herself.',
    E'of → for', E'for → of', E'of → for', E'for → of',
    E'for he → of him', E'difficulty → difficult',
    E'to children → for children', E'to writing → to write',
    E'of they → of them', E'for our → for us',
    E'It is important for me to study English.',
    E'It is not difficult for us to move this chair.',
    E'It is hard for me to understand him.',
    E'It is very nice of you to share many things with other people.',
    E'Was it easy for you to win the game?',
    E'It will be possible for Ted to win the contest.',
    E'It is dangerous for children to cross the road alone.',
    E'It is wise of Alice to refuse the offer.',
    E'It is unusual for my mother to buy a new skirt.',
    E'It is surprising for her to run a marathon.',
    E'It is very kind of you to take care of lost pets.',
    E'there are lots of paintings for me to enjoy.'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('to부정사의 의미상의 주어 Step1', 'to부정사의 의미상의 주어', q, a, 'problem', 'interactive');

  RAISE NOTICE 'to부정사의 의미상의 주어 Step1 템플릿 생성 완료 (80문제: MCQ 12 + 서술형 68)';
END;
$$;
