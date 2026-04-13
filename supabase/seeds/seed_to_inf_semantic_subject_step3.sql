DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = 'to부정사의 의미상의 주어 Step3';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- Part 1: 괄호 선택 for vs of (Q1~Q4)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1,
      'question',E'다음 문장의 괄호 안에서 알맞은 것을 고르시오.\n\nIt is generous _______ him to donate all his prize money to charity.',
      'options',jsonb_build_array('at','of','for','with','to'),
      'answer','2'),

    jsonb_build_object('number',2,
      'question',E'다음 문장의 괄호 안에서 알맞은 것을 고르시오.\n\nIt is essential _______ students to review their notes before the exam.',
      'options',jsonb_build_array('of','at','with','for','on'),
      'answer','4'),

    jsonb_build_object('number',3,
      'question',E'다음 문장의 괄호 안에서 알맞은 것을 고르시오.\n\nIt was careless _______ the driver to ignore the red light at the intersection.',
      'options',jsonb_build_array('for','to','of','at','with'),
      'answer','3'),

    jsonb_build_object('number',4,
      'question',E'다음 문장의 괄호 안에서 알맞은 것을 고르시오.\n\nIt is quite challenging _______ beginners to pronounce English words correctly.',
      'options',jsonb_build_array('of','with','at','to','for'),
      'answer','5'),

    -- ═══════════════════════════════════════════
    -- Part 2: 우리말 → 빈칸 채우기 서술형 (Q5~Q14)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',5,'type','subjective',
      'question',E'다음 우리말과 같은 뜻이 되도록 빈칸에 알맞은 말을 쓰시오.\n\n그녀가 그 짧은 시간 안에 시험을 통과하는 것은 놀라웠다.\n→ It was surprising _______ to pass the exam in such a short time.',
      'answer',E'for her',
      'similar_answers',jsonb_build_array('for her')),

    jsonb_build_object('number',6,'type','subjective',
      'question',E'다음 우리말과 같은 뜻이 되도록 빈칸에 알맞은 말을 쓰시오.\n\n네가 모르는 사람을 도와주다니 친절하구나.\n→ It is kind _______ to help a stranger.',
      'answer',E'of you',
      'similar_answers',jsonb_build_array('of you')),

    jsonb_build_object('number',7,'type','subjective',
      'question',E'다음 우리말과 같은 뜻이 되도록 빈칸에 알맞은 말을 쓰시오.\n\n그들이 매일 아침 30분씩 운동하는 것은 건강에 좋다.\n→ It is healthy _______ to exercise for 30 minutes every morning.',
      'answer',E'for them',
      'similar_answers',jsonb_build_array('for them')),

    jsonb_build_object('number',8,'type','subjective',
      'question',E'다음 우리말과 같은 뜻이 되도록 빈칸에 알맞은 말을 쓰시오.\n\n그가 약속을 어기다니 무책임했다.\n→ It was irresponsible _______ to break his promise.',
      'answer',E'of him',
      'similar_answers',jsonb_build_array('of him')),

    jsonb_build_object('number',9,'type','subjective',
      'question',E'다음 우리말과 같은 뜻이 되도록 빈칸에 알맞은 말을 쓰시오.\n\n우리가 경기 전에 충분히 자는 것은 중요하다.\n→ It is important _______ to sleep enough before the game.',
      'answer',E'for us',
      'similar_answers',jsonb_build_array('for us')),

    jsonb_build_object('number',10,'type','subjective',
      'question',E'다음 우리말과 같은 뜻이 되도록 빈칸에 알맞은 말을 쓰시오.\n\n그녀가 그 어려운 결정을 혼자 내리다니 용감했다.\n→ It was brave _______ to make such a difficult decision alone.',
      'answer',E'of her',
      'similar_answers',jsonb_build_array('of her')),

    jsonb_build_object('number',11,'type','subjective',
      'question',E'다음 우리말과 같은 뜻이 되도록 빈칸에 알맞은 말을 쓰시오.\n\n아이들이 저녁에 혼자 공원에서 노는 것은 안전하지 않다.\n→ It is not safe _______ to play in the park alone at night.',
      'answer',E'for children',
      'similar_answers',jsonb_build_array('for children','for the children','for kids')),

    jsonb_build_object('number',12,'type','subjective',
      'question',E'다음 우리말과 같은 뜻이 되도록 빈칸에 알맞은 말을 쓰시오.\n\n네가 선생님 말씀을 끝까지 듣지 않다니 무례했다.\n→ It was rude _______ not to listen to the teacher until the end.',
      'answer',E'of you',
      'similar_answers',jsonb_build_array('of you')),

    jsonb_build_object('number',13,'type','subjective',
      'question',E'다음 우리말과 같은 뜻이 되도록 빈칸에 알맞은 말을 쓰시오.\n\n그가 일주일 만에 그 두꺼운 책을 다 읽는 것은 쉽지 않다.\n→ It is not easy _______ to finish reading that thick book in a week.',
      'answer',E'for him',
      'similar_answers',jsonb_build_array('for him')),

    jsonb_build_object('number',14,'type','subjective',
      'question',E'다음 우리말과 같은 뜻이 되도록 빈칸에 알맞은 말을 쓰시오.\n\n그녀가 다친 새를 구해주다니 마음씨가 따뜻하구나.\n→ It is warm-hearted _______ to rescue an injured bird.',
      'answer',E'of her',
      'similar_answers',jsonb_build_array('of her')),

    -- ═══════════════════════════════════════════
    -- Part 3: 보기 단어 활용 → 빈칸 채우기 (Q15~Q24)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',15,'type','subjective',
      'question',E'다음 <보기>와 같이 주어진 단어를 이용하여 빈칸에 알맞은 말을 쓰시오.\n\n<보기> This is a perfect place for visitors to take photos. (visitors / take)\n\nIt is impossible _______ the final exam in one day. (him / pass)',
      'answer',E'for him to pass',
      'similar_answers',jsonb_build_array('for him to pass')),

    jsonb_build_object('number',16,'type','subjective',
      'question',E'다음 <보기>와 같이 주어진 단어를 이용하여 빈칸에 알맞은 말을 쓰시오.\n\n<보기> This is a perfect place for visitors to take photos. (visitors / take)\n\nIt is very thoughtful _______ us flowers when we were sick. (her / bring)',
      'answer',E'of her to bring',
      'similar_answers',jsonb_build_array('of her to bring')),

    jsonb_build_object('number',17,'type','subjective',
      'question',E'다음 <보기>와 같이 주어진 단어를 이용하여 빈칸에 알맞은 말을 쓰시오.\n\n<보기> This is a perfect place for visitors to take photos. (visitors / take)\n\nIt is necessary _______ at least 8 glasses of water a day. (us / drink)',
      'answer',E'for us to drink',
      'similar_answers',jsonb_build_array('for us to drink')),

    jsonb_build_object('number',18,'type','subjective',
      'question',E'다음 <보기>와 같이 주어진 단어를 이용하여 빈칸에 알맞은 말을 쓰시오.\n\n<보기> This is a perfect place for visitors to take photos. (visitors / take)\n\nIt was foolish _______ money on lottery tickets every week. (him / spend)',
      'answer',E'of him to spend',
      'similar_answers',jsonb_build_array('of him to spend')),

    jsonb_build_object('number',19,'type','subjective',
      'question',E'다음 <보기>와 같이 주어진 단어를 이용하여 빈칸에 알맞은 말을 쓰시오.\n\n<보기> This is a perfect place for visitors to take photos. (visitors / take)\n\nIt is exciting _______ a new language from scratch. (them / learn)',
      'answer',E'for them to learn',
      'similar_answers',jsonb_build_array('for them to learn')),

    jsonb_build_object('number',20,'type','subjective',
      'question',E'다음 <보기>와 같이 주어진 단어를 이용하여 빈칸에 알맞은 말을 쓰시오.\n\n<보기> This is a perfect place for visitors to take photos. (visitors / take)\n\nIt was wise _______ the offer without hesitation. (her / accept)',
      'answer',E'of her to accept',
      'similar_answers',jsonb_build_array('of her to accept')),

    jsonb_build_object('number',21,'type','subjective',
      'question',E'다음 <보기>와 같이 주어진 단어를 이용하여 빈칸에 알맞은 말을 쓰시오.\n\n<보기> This is a perfect place for visitors to take photos. (visitors / take)\n\nIt is dangerous _______ on a busy road without a helmet. (children / cycle)',
      'answer',E'for children to cycle',
      'similar_answers',jsonb_build_array('for children to cycle')),

    jsonb_build_object('number',22,'type','subjective',
      'question',E'다음 <보기>와 같이 주어진 단어를 이용하여 빈칸에 알맞은 말을 쓰시오.\n\n<보기> This is a perfect place for visitors to take photos. (visitors / take)\n\nIt is quite challenging _______ this project by Friday. (us / complete)',
      'answer',E'for us to complete',
      'similar_answers',jsonb_build_array('for us to complete')),

    jsonb_build_object('number',23,'type','subjective',
      'question',E'다음 <보기>와 같이 주어진 단어를 이용하여 빈칸에 알맞은 말을 쓰시오.\n\n<보기> This is a perfect place for visitors to take photos. (visitors / take)\n\nIt was stupid _______ the truth in front of everyone. (him / hide)',
      'answer',E'of him to hide',
      'similar_answers',jsonb_build_array('of him to hide')),

    jsonb_build_object('number',24,'type','subjective',
      'question',E'다음 <보기>와 같이 주어진 단어를 이용하여 빈칸에 알맞은 말을 쓰시오.\n\n<보기> This is a perfect place for visitors to take photos. (visitors / take)\n\nIt is helpful _______ notes during class. (students / take)',
      'answer',E'for students to take',
      'similar_answers',jsonb_build_array('for students to take')),

    -- ═══════════════════════════════════════════
    -- Part 4: 단어 배열 서술형 (Q25~Q30)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',25,'type','subjective',
      'question',E'다음 주어진 단어를 바르게 배열하여 문장을 완성하시오.\n\n그들이 매일 운동을 계속하는 것은 어렵다.\n(hard / for / to / keep / exercising / them / is / It)',
      'answer',E'It is hard for them to keep exercising every day.',
      'similar_answers',jsonb_build_array('It is hard for them to keep exercising every day.','It is hard for them to keep exercising every day')),

    jsonb_build_object('number',26,'type','subjective',
      'question',E'다음 주어진 단어를 바르게 배열하여 문장을 완성하시오.\n\n네가 그러한 흥미로운 소문을 믿다니 어리석었다.\n(was / of / to / silly / you / such / believe / it / an / interesting / rumor)',
      'answer',E'It was silly of you to believe such an interesting rumor.',
      'similar_answers',jsonb_build_array('It was silly of you to believe such an interesting rumor.','It was silly of you to believe such an interesting rumor')),

    jsonb_build_object('number',27,'type','subjective',
      'question',E'다음 주어진 단어를 바르게 배열하여 문장을 완성하시오.\n\n내가 그 책을 이해하는 것은 어렵다.\n(for / hard / me / is / understand / It / to / the / book)',
      'answer',E'It is hard for me to understand the book.',
      'similar_answers',jsonb_build_array('It is hard for me to understand the book.','It is hard for me to understand the book')),

    jsonb_build_object('number',28,'type','subjective',
      'question',E'다음 주어진 단어를 바르게 배열하여 문장을 완성하시오.\n\n그녀가 내일까지 이 일을 끝내는 것은 도전 정신을 북돋우는 일이다.\n(to / this / for / finish / is / work / It / challenging / her / by / tomorrow)',
      'answer',E'It is challenging for her to finish this work by tomorrow.',
      'similar_answers',jsonb_build_array('It is challenging for her to finish this work by tomorrow.','It is challenging for her to finish this work by tomorrow')),

    jsonb_build_object('number',29,'type','subjective',
      'question',E'다음 주어진 단어를 바르게 배열하여 문장을 완성하시오.\n\n자전거 이용자들이 주변의 소리를 들을 수 있는 것이 중요하다.\n(for / to / important / is / It / cyclists / hear / the / sound / around / them)',
      'answer',E'It is important for cyclists to hear the sound around them.',
      'similar_answers',jsonb_build_array('It is important for cyclists to hear the sound around them.','It is important for cyclists to hear the sound around them')),

    jsonb_build_object('number',30,'type','subjective',
      'question',E'다음 주어진 단어를 바르게 배열하여 문장을 완성하시오.\n\n학생들이 새로운 학교 규칙을 따르는 것은 필요하다.\n(necessary / for / to / follow / the / new / students / is / school / rules / It)',
      'answer',E'It is necessary for students to follow the new school rules.',
      'similar_answers',jsonb_build_array('It is necessary for students to follow the new school rules.','It is necessary for students to follow the new school rules')),

    -- ═══════════════════════════════════════════
    -- Part 5: 문장 전환 MCQ (Q31~Q42)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',31,
      'question',E'다음 문장을 It ~ to부정사 구문으로 바꿀 때, 가장 알맞은 것을 고르시오.\n\nHe can solve the math problem without any help. (amazing)',
      'options',jsonb_build_array(
        E'It is amazing for him to solve the math problem without any help.',
        E'It is amazing of him to solving the math problem without any help.',
        E'It amazing for him to solve the math problem without any help.',
        E'It is amazed for him to solve the math problem without any help.',
        E'It is amazing of him that he solve the math problem without any help.'),
      'answer','1'),

    jsonb_build_object('number',32,
      'question',E'다음 문장을 It ~ to부정사 구문으로 바꿀 때, 가장 알맞은 것을 고르시오.\n\nShe donated all her savings to the school library. (generous)',
      'options',jsonb_build_array(
        E'It is generous for her to donate all her savings to the school library.',
        E'It is generous of her to donate all her savings to the school library.',
        E'It was generous of her donating all her savings to the school library.',
        E'It is generous of her donating all her savings to the school library.',
        E'It is generous for her that she donated all her savings to the school library.'),
      'answer','2'),

    jsonb_build_object('number',33,
      'question',E'다음 문장을 It ~ to부정사 구문으로 바꿀 때, 가장 알맞은 것을 고르시오.\n\nWe can climb to the top of the mountain in two hours. (possible)',
      'options',jsonb_build_array(
        E'It is possible of us to climb to the top of the mountain in two hours.',
        E'It is possible for us climbing to the top of the mountain in two hours.',
        E'It is possible for us to climb to the top of the mountain in two hours.',
        E'It possible for us to climb to the top of the mountain in two hours.',
        E'It is possible for we to climb to the top of the mountain in two hours.'),
      'answer','3'),

    jsonb_build_object('number',34,
      'question',E'다음 문장을 It ~ to부정사 구문으로 바꿀 때, 가장 알맞은 것을 고르시오.\n\nThey kept their promise even in difficult times. (admirable)',
      'options',jsonb_build_array(
        E'It is admirable for them to keep their promise even in difficult times.',
        E'It is admirable of them to keeping their promise even in difficult times.',
        E'It is admirable of them to kept their promise even in difficult times.',
        E'It is admirable of them to keep their promise even in difficult times.',
        E'It is admirable of their to keep their promise even in difficult times.'),
      'answer','4'),

    jsonb_build_object('number',35,
      'question',E'다음 문장을 It ~ to부정사 구문으로 바꿀 때, 가장 알맞은 것을 고르시오.\n\nChildren shouldn''t cross the road without looking both ways. (dangerous)',
      'options',jsonb_build_array(
        E'It is dangerous for children crossing the road without looking both ways.',
        E'It is dangerous of children to cross the road without looking both ways.',
        E'It is dangerous for children to cross the road without looking both ways.',
        E'It is dangerous for children to crossing the road without looking both ways.',
        E'It is dangerous of children crossing the road without looking both ways.'),
      'answer','3'),

    jsonb_build_object('number',36,
      'question',E'다음 문장을 It ~ to부정사 구문으로 바꿀 때, 가장 알맞은 것을 고르시오.\n\nHe stayed up all night to finish the science project. (diligent)',
      'options',jsonb_build_array(
        E'It is diligent for him to stay up all night to finish the science project.',
        E'It is diligent of him to staying up all night to finish the science project.',
        E'It is diligent of him to stay up all night to finish the science project.',
        E'It is diligent for him stayed up all night to finish the science project.',
        E'It was diligent for him to stay up all night to finish the science project.'),
      'answer','3'),

    jsonb_build_object('number',37,
      'question',E'다음 문장을 It ~ to부정사 구문으로 바꿀 때, 가장 알맞은 것을 고르시오.\n\nWe have to memorize 50 new words every week. (difficult)',
      'options',jsonb_build_array(
        E'It is difficult for we to memorize 50 new words every week.',
        E'It is difficult of us to memorize 50 new words every week.',
        E'It is difficult for us memorizing 50 new words every week.',
        E'It is difficult for us to memorize 50 new words every week.',
        E'It difficult for us to memorize 50 new words every week.'),
      'answer','4'),

    jsonb_build_object('number',38,
      'question',E'다음 문장을 It ~ to부정사 구문으로 바꿀 때, 가장 알맞은 것을 고르시오.\n\nShe helped a lost tourist find the subway station. (kind)',
      'options',jsonb_build_array(
        E'It is kind for her to help a lost tourist find the subway station.',
        E'It is kind of her to help a lost tourist find the subway station.',
        E'It is kind of her helping a lost tourist find the subway station.',
        E'It is kind of her to helped a lost tourist find the subway station.',
        E'It is kind of she to help a lost tourist find the subway station.'),
      'answer','2'),

    jsonb_build_object('number',39,
      'question',E'다음 문장을 주어진 단어를 사용하여 It ~ to부정사 구문으로 전환하시오.\n\nYou can learn Japanese in six months with daily practice. / possible',
      'options',jsonb_build_array(
        E'It is possible of you to learn Japanese in six months with daily practice.',
        E'It is possible for you learn Japanese in six months with daily practice.',
        E'It is possible for you to learn Japanese in six months with daily practice.',
        E'It is possible for your to learn Japanese in six months with daily practice.',
        E'It is possible for you to learning Japanese in six months with daily practice.'),
      'answer','3'),

    jsonb_build_object('number',40,
      'question',E'다음 문장을 주어진 단어를 사용하여 It ~ to부정사 구문으로 전환하시오.\n\nHe shared his lunch with a classmate who forgot theirs. / considerate',
      'options',jsonb_build_array(
        E'It is considerate for him to share his lunch with a classmate who forgot theirs.',
        E'It is considerate of him to share his lunch with a classmate who forgot theirs.',
        E'It is considerate of him to sharing his lunch with a classmate who forgot theirs.',
        E'It is considerate of his to share his lunch with a classmate who forgot theirs.',
        E'It is considerable of him to share his lunch with a classmate who forgot theirs.'),
      'answer','2'),

    jsonb_build_object('number',41,
      'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n그들이 시험 전날 밤을 새워 공부하는 것은 필요하지 않다.',
      'options',jsonb_build_array(
        E'It is not necessary for them to study all night before the exam.',
        E'It is not necessary of them to study all night before the exam.',
        E'It is not necessary for them studying all night before the exam.',
        E'It is not necessary for they to study all night before the exam.',
        E'It not necessary for them to study all night before the exam.'),
      'answer','1'),

    jsonb_build_object('number',42,
      'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n그가 그 어려운 수학 문제를 혼자 풀다니 놀라웠다.',
      'options',jsonb_build_array(
        E'It was surprising for him to solve the difficult math problem alone.',
        E'It was surprising of him to solve the difficult math problem alone.',
        E'It was surprising of him to solving the difficult math problem alone.',
        E'It was surprised of him to solve the difficult math problem alone.',
        E'It was surprising of his to solve the difficult math problem alone.'),
      'answer','1'),

    -- ═══════════════════════════════════════════
    -- Part 6: 조건 영작 서술형 (Q43~Q54)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',43,'type','subjective',
      'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n그가 매일 일기를 쓰는 것은 도움이 된다. (helpful, keep, diary)\n<조건> It ~ to부정사 구문, 8단어',
      'answer',E'It is helpful for him to keep a diary every day.',
      'similar_answers',jsonb_build_array(E'It is helpful for him to keep a diary every day.',E'It is helpful for him to keep a diary every day')),

    jsonb_build_object('number',44,'type','subjective',
      'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n우리가 점심 시간에 운동장에서 노는 것은 즐겁다. (fun, play, playground)\n<조건> It ~ to부정사 구문, 9단어',
      'answer',E'It is fun for us to play on the playground at lunchtime.',
      'similar_answers',jsonb_build_array(E'It is fun for us to play on the playground at lunchtime.',E'It is fun for us to play on the playground at lunchtime')),

    jsonb_build_object('number',45,'type','subjective',
      'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n그녀가 그 제안을 즉시 거절한 것은 현명했다. (refuse, offer, immediately)\n<조건> It ~ to부정사 구문, wise 사용, 9단어',
      'answer',E'It was wise of her to refuse the offer immediately.',
      'similar_answers',jsonb_build_array(E'It was wise of her to refuse the offer immediately.',E'It was wise of her to refuse the offer immediately')),

    jsonb_build_object('number',46,'type','subjective',
      'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n네가 중요한 수업 중에 스마트폰을 사용하다니 부주의했다. (use, smartphone, important)\n<조건> It ~ to부정사 구문, careless 사용, 11단어',
      'answer',E'It was careless of you to use your smartphone during an important class.',
      'similar_answers',jsonb_build_array(E'It was careless of you to use your smartphone during an important class.',E'It was careless of you to use your smartphone during an important class')),

    jsonb_build_object('number',47,'type','subjective',
      'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n그가 하루 만에 그 많은 양의 과제를 끝내는 것은 불가능하다. (finish, amount, homework)\n<조건> It ~ to부정사 구문, impossible 사용, 10단어',
      'answer',E'It is impossible for him to finish that amount of homework in a day.',
      'similar_answers',jsonb_build_array(E'It is impossible for him to finish that amount of homework in a day.',E'It is impossible for him to finish that amount of homework in a day')),

    jsonb_build_object('number',48,'type','subjective',
      'question',E'다음 두 문장을 주어진 조건에 맞게 한 문장으로 영작하시오.\n\n• Students wear school uniforms.\n• That is the school rule.\n<조건> It ~ to부정사 구문, necessary 사용, 두 문장을 한 문장으로',
      'answer',E'It is necessary for students to wear school uniforms.',
      'similar_answers',jsonb_build_array(E'It is necessary for students to wear school uniforms.',E'It is necessary for students to wear school uniforms')),

    jsonb_build_object('number',49,'type','subjective',
      'question',E'다음 두 문장을 주어진 조건에 맞게 한 문장으로 영작하시오.\n\n• A stranger was in danger.\n• Mina saved the stranger.\n<조건> It ~ to부정사 구문, brave 사용, 두 문장을 한 문장으로',
      'answer',E'It was brave of Mina to save the stranger who was in danger.',
      'similar_answers',jsonb_build_array(E'It was brave of Mina to save the stranger who was in danger.',E'It was brave of Mina to save the stranger who was in danger',E'It was brave of Mina to save the stranger in danger.')),

    jsonb_build_object('number',50,'type','subjective',
      'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n그가 인터넷에서 찾은 정보를 무조건 믿는 것은 위험하다. (dangerous, believe, information, find)\n<조건> It ~ to부정사 구문, 12단어',
      'answer',E'It is dangerous for him to blindly believe information he finds on the internet.',
      'similar_answers',jsonb_build_array(E'It is dangerous for him to blindly believe information he finds on the internet.',E'It is dangerous for him to blindly believe information he finds on the internet')),

    jsonb_build_object('number',51,'type','subjective',
      'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n그들이 길을 잃은 노인을 집까지 데려다주다니 친절했다. (elderly, lost, escort)\n<조건> It ~ to부정사 구문, kind 사용, 완전한 문장',
      'answer',E'It was kind of them to escort the lost elderly person home.',
      'similar_answers',jsonb_build_array(E'It was kind of them to escort the lost elderly person home.',E'It was kind of them to escort the lost elderly person home')),

    jsonb_build_object('number',52,'type','subjective',
      'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n그가 실수를 솔직하게 인정하다니 정직했다. (admit, mistake, openly)\n<조건> It ~ to부정사 구문, honest 사용, 10단어',
      'answer',E'It was honest of him to admit his mistake openly.',
      'similar_answers',jsonb_build_array(E'It was honest of him to admit his mistake openly.',E'It was honest of him to admit his mistake openly')),

    jsonb_build_object('number',53,'type','subjective',
      'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n그들이 다양한 나라의 음식을 시도해보는 것은 흥미롭다. (try, food, various)\n<조건> It ~ to부정사 구문, interesting 사용, 9단어',
      'answer',E'It is interesting for them to try food from various countries.',
      'similar_answers',jsonb_build_array(E'It is interesting for them to try food from various countries.',E'It is interesting for them to try food from various countries')),

    jsonb_build_object('number',54,'type','subjective',
      'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n그가 팀 프로젝트에서 모든 공을 혼자 차지하려 하다니 이기적이었다. (take, credit, project)\n<조건> It ~ to부정사 구문, selfish 사용, 완전한 문장',
      'answer',E'It was selfish of him to take all the credit in the team project.',
      'similar_answers',jsonb_build_array(E'It was selfish of him to take all the credit in the team project.',E'It was selfish of him to take all the credit in the team project')),

    -- ═══════════════════════════════════════════
    -- Part 7: 오류 수정 서술형 (Q55~Q60)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',55,'type','subjective',
      'question',E'다음 중 어법상 어색한 문장의 기호와 틀린 표현을 찾아 바르게 고치시오.\n\nⓐ It was wise for her to turn down the job offer overseas.\nⓑ It is impossible for me to memorize all the irregular verbs in one day.\nⓒ It was careless of him to leave his passport on the train.\nⓓ It is important for teenagers to develop good study habits early.',
      'answer',E'ⓐ, for → of',
      'similar_answers',jsonb_build_array(E'ⓐ, for → of',E'ⓐ / for → of',E'ⓐ for → of',E'ⓐ, for를 of로',E'ⓐ for를 of로')),

    jsonb_build_object('number',56,'type','subjective',
      'question',E'다음 중 어법상 어색한 문장의 기호와 틀린 표현을 찾아 바르게 고치시오.\n\nⓐ It is generous of them to volunteer at the community center every weekend.\nⓑ It was foolish for him to trust someone he had just met online.\nⓒ It is necessary for us to submit the report by noon tomorrow.\nⓓ It is exciting for the students to participate in the science fair.',
      'answer',E'ⓑ, for → of',
      'similar_answers',jsonb_build_array(E'ⓑ, for → of',E'ⓑ / for → of',E'ⓑ for → of',E'ⓑ, for를 of로',E'ⓑ for를 of로')),

    jsonb_build_object('number',57,'type','subjective',
      'question',E'다음 중 어법상 어색한 문장의 기호와 틀린 표현을 찾아 바르게 고치시오.\n\nⓐ It is difficult for young children to sit still for a long time.\nⓑ It was thoughtful for her to remember everyone''s birthday.\nⓒ It is useful for students to use flashcards when studying vocabulary.\nⓓ It is impossible for us to finish the project without more time.',
      'answer',E'ⓑ, for → of',
      'similar_answers',jsonb_build_array(E'ⓑ, for → of',E'ⓑ / for → of',E'ⓑ for → of',E'ⓑ, for를 of로',E'ⓑ for를 of로')),

    jsonb_build_object('number',58,'type','subjective',
      'question',E'다음 중 어법상 어색한 문장의 기호와 틀린 표현을 찾아 바르게 고치시오.\n\nⓐ It is brave of the firefighter to enter the burning building alone.\nⓑ It is challenging for him to balance studying and part-time work.\nⓒ It was rude of the student to interrupt the teacher during the lesson.\nⓓ It is healthy of children to eat a variety of vegetables every day.',
      'answer',E'ⓓ, of → for',
      'similar_answers',jsonb_build_array(E'ⓓ, of → for',E'ⓓ / of → for',E'ⓓ of → for',E'ⓓ, of를 for로',E'ⓓ of를 for로')),

    jsonb_build_object('number',59,'type','subjective',
      'question',E'다음 중 어법상 어색한 문장의 기호와 틀린 표현을 찾아 바르게 고치시오.\n\nⓐ It is kind of you to share your notes with absent classmates.\nⓑ It is dangerous for kids to play near the deep river without adults.\nⓒ It was stupid of him to post his personal information online.\nⓓ It is necessary of athletes to warm up properly before training.',
      'answer',E'ⓓ, of → for',
      'similar_answers',jsonb_build_array(E'ⓓ, of → for',E'ⓓ / of → for',E'ⓓ of → for',E'ⓓ, of를 for로',E'ⓓ of를 for로')),

    jsonb_build_object('number',60,'type','subjective',
      'question',E'다음 중 어법상 어색한 문장의 기호와 틀린 표현을 찾아 바르게 고치시오.\n\nⓐ It was wise of the doctor to recommend a second opinion.\nⓑ It is possible for anyone to learn coding with enough practice.\nⓒ It was selfish of him to keep all the prize money for himself.\nⓓ It is important of us to respect each other''s differences at school.',
      'answer',E'ⓓ, of → for',
      'similar_answers',jsonb_build_array(E'ⓓ, of → for',E'ⓓ / of → for',E'ⓓ of → for',E'ⓓ, of를 for로',E'ⓓ of를 for로'))
  );

  -- answer_key: MCQ는 번호 문자열, 서술형은 정답 텍스트
  a := jsonb_build_array(
    '2','4','3','5',
    'for her','of you','for them','of him',
    'for us','of her','for children','of you','for him','of her',
    'for him to pass','of her to bring','for us to drink','of him to spend',
    'for them to learn','of her to accept','for children to cycle','for us to complete',
    'of him to hide','for students to take',
    'It is hard for them to keep exercising every day.',
    'It was silly of you to believe such an interesting rumor.',
    'It is hard for me to understand the book.',
    'It is challenging for her to finish this work by tomorrow.',
    'It is important for cyclists to hear the sound around them.',
    'It is necessary for students to follow the new school rules.',
    '1','2','3','4','3','3','4','2','3','2','1','1',
    'It is helpful for him to keep a diary every day.',
    'It is fun for us to play on the playground at lunchtime.',
    'It was wise of her to refuse the offer immediately.',
    'It was careless of you to use your smartphone during an important class.',
    'It is impossible for him to finish that amount of homework in a day.',
    'It is necessary for students to wear school uniforms.',
    'It was brave of Mina to save the stranger who was in danger.',
    'It is dangerous for him to blindly believe information he finds on the internet.',
    'It was kind of them to escort the lost elderly person home.',
    'It was honest of him to admit his mistake openly.',
    'It is interesting for them to try food from various countries.',
    'It was selfish of him to take all the credit in the team project.',
    E'ⓐ, for → of',E'ⓑ, for → of',E'ⓑ, for → of',
    E'ⓓ, of → for',E'ⓓ, of → for',E'ⓓ, of → for'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('to부정사의 의미상의 주어 Step3', 'to부정사의 의미상의 주어', q, a, 'problem', 'interactive');

  RAISE NOTICE 'to부정사의 의미상의 주어 Step3 템플릿 생성 완료 (60문제: MCQ 16 + 서술형 44)';
END;
$$;
