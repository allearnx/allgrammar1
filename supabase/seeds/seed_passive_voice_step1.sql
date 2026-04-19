-- 수동태 Step 1 시드 템플릿 (서술형 76문항)
-- 8 Parts: 수동태 형태 쓰기 / 능동태→수동태 / 수동태→능동태 / 오류 고치기 / by 생략 판단 / 조동사·부정·의문문 수동태 / be+전치사 관용 / 영작

DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  -- 기존 동일 토픽·제목 삭제
  DELETE FROM naesin_templates
  WHERE template_topic = '수동태'
    AND title = '수동태 Step 1';

  q := jsonb_build_array(
jsonb_build_object('number',1,'question',E'[Part 1] 다음 괄호 안의 동사를 알맞은 수동태 형태로 빈칸에 쓰시오.

This book __________ (write) by J.K. Rowling.','answer',E'was written','similar_answers',jsonb_build_array(),'explanation',E'write(wrote-written) → was written (과거 수동태)'),
jsonb_build_object('number',2,'question',E'다음 괄호 안의 동사를 알맞은 수동태 형태로 빈칸에 쓰시오.

The windows __________ (clean) every day.','answer',E'are cleaned','similar_answers',jsonb_build_array(),'explanation',E'every day(반복) → 현재 수동태 are cleaned'),
jsonb_build_object('number',3,'question',E'다음 괄호 안의 동사를 알맞은 수동태 형태로 빈칸에 쓰시오.

The Eiffel Tower __________ (design) by Gustave Eiffel.','answer',E'was designed','similar_answers',jsonb_build_array(),'explanation',E'과거 수동태 was designed'),
jsonb_build_object('number',4,'question',E'다음 괄호 안의 동사를 알맞은 수동태 형태로 빈칸에 쓰시오.

Many houses __________ (destroy) by the earthquake.','answer',E'were destroyed','similar_answers',jsonb_build_array(),'explanation',E'복수 주어 + 과거 수동태 were destroyed'),
jsonb_build_object('number',5,'question',E'다음 괄호 안의 동사를 알맞은 수동태 형태로 빈칸에 쓰시오.

English __________ (speak) in many countries.','answer',E'is spoken','similar_answers',jsonb_build_array(),'explanation',E'speak(spoke-spoken) → 현재 수동태 is spoken'),
jsonb_build_object('number',6,'question',E'다음 괄호 안의 동사를 알맞은 수동태 형태로 빈칸에 쓰시오.

The letter __________ (send) to the wrong address yesterday.','answer',E'was sent','similar_answers',jsonb_build_array(),'explanation',E'yesterday → 과거 수동태 was sent'),
jsonb_build_object('number',7,'question',E'다음 괄호 안의 동사를 알맞은 수동태 형태로 빈칸에 쓰시오.

A new building __________ (build) next year.','answer',E'will be built','similar_answers',jsonb_build_array(),'explanation',E'next year → 미래 수동태 will be built'),
jsonb_build_object('number',8,'question',E'다음 괄호 안의 동사를 알맞은 수동태 형태로 빈칸에 쓰시오.

The light bulb __________ (invent) by Edison.','answer',E'was invented','similar_answers',jsonb_build_array(),'explanation',E'과거 수동태 was invented'),
jsonb_build_object('number',9,'question',E'다음 괄호 안의 동사를 알맞은 수동태 형태로 빈칸에 쓰시오.

My wallet __________ (steal) on the subway last night.','answer',E'was stolen','similar_answers',jsonb_build_array(),'explanation',E'steal(stole-stolen) → 과거 수동태 was stolen'),
jsonb_build_object('number',10,'question',E'다음 괄호 안의 동사를 알맞은 수동태 형태로 빈칸에 쓰시오.

The rules __________ (must, follow) by everyone.','answer',E'must be followed','similar_answers',jsonb_build_array(),'explanation',E'조동사 수동태 must + be + p.p.'),
jsonb_build_object('number',11,'question',E'[Part 2] 다음 문장을 수동태로 바꿔 쓰시오.

Fred made a wooden box.','answer',E'A wooden box was made by Fred.','similar_answers',jsonb_build_array(),'explanation',E'능동태 → 수동태: 목적어를 주어로, 동사를 was + p.p.로'),
jsonb_build_object('number',12,'question',E'다음 문장을 수동태로 바꿔 쓰시오.

People speak Korean in Korea.','answer',E'Korean is spoken in Korea.','similar_answers',jsonb_build_array(E'Korean is spoken in Korea by people.',E'Korean is spoken in Korea (by people).'),'explanation',E'by people 생략 가능 (일반인)'),
jsonb_build_object('number',13,'question',E'다음 문장을 수동태로 바꿔 쓰시오.

My mother painted the wall.','answer',E'The wall was painted by my mother.','similar_answers',jsonb_build_array(),'explanation',E'능동태 → 수동태 전환'),
jsonb_build_object('number',14,'question',E'다음 문장을 수동태로 바꿔 쓰시오.

A police officer stopped the car.','answer',E'The car was stopped by a police officer.','similar_answers',jsonb_build_array(),'explanation',E'능동태 → 수동태 전환'),
jsonb_build_object('number',15,'question',E'다음 문장을 수동태로 바꿔 쓰시오.

He can repair the car.','answer',E'The car can be repaired by him.','similar_answers',jsonb_build_array(),'explanation',E'조동사 수동태 can be + p.p.'),
jsonb_build_object('number',16,'question',E'다음 문장을 수동태로 바꿔 쓰시오.

Jimin will break the promise.','answer',E'The promise will be broken by Jimin.','similar_answers',jsonb_build_array(),'explanation',E'미래 수동태 will be + p.p.'),
jsonb_build_object('number',17,'question',E'다음 문장을 수동태로 바꿔 쓰시오.

Did Cathy clean the room?','answer',E'Was the room cleaned by Cathy?','similar_answers',jsonb_build_array(),'explanation',E'의문문 수동태: Was + 주어 + p.p. + by 행위자?'),
jsonb_build_object('number',18,'question',E'다음 문장을 수동태로 바꿔 쓰시오.

My dad didn''t fix my bike.','answer',E'My bike wasn''t fixed by my dad.','similar_answers',jsonb_build_array(E'My bike was not fixed by my dad.'),'explanation',E'부정문 수동태: was not(wasn''t) + p.p.'),
jsonb_build_object('number',19,'question',E'다음 문장을 수동태로 바꿔 쓰시오.

King Sejong made Hangeul.','answer',E'Hangeul was made by King Sejong.','similar_answers',jsonb_build_array(),'explanation',E'능동태 → 수동태 전환'),
jsonb_build_object('number',20,'question',E'다음 문장을 수동태로 바꿔 쓰시오.

The police caught the thief.','answer',E'The thief was caught by the police.','similar_answers',jsonb_build_array(),'explanation',E'catch(caught-caught) → was caught'),
jsonb_build_object('number',21,'question',E'다음 문장을 수동태로 바꿔 쓰시오.

She gave me today''s newspaper.','answer',E'Today''s newspaper was given to me by her.','similar_answers',jsonb_build_array(E'I was given today''s newspaper by her.'),'explanation',E'4형식 수동태 — 직접목적어를 주어로'),
jsonb_build_object('number',22,'question',E'다음 문장을 수동태로 바꿔 쓰시오.

The news made her happy.','answer',E'She was made happy by the news.','similar_answers',jsonb_build_array(),'explanation',E'5형식(make+목적어+형용사) 수동태'),
jsonb_build_object('number',23,'question',E'다음 문장을 수동태로 바꿔 쓰시오.

Careless driving causes many accidents.','answer',E'Many accidents are caused by careless driving.','similar_answers',jsonb_build_array(),'explanation',E'현재 수동태 are caused'),
jsonb_build_object('number',24,'question',E'다음 문장을 수동태로 바꿔 쓰시오.

My sister looked after my cat while I was out.','answer',E'My cat was looked after by my sister while I was out.','similar_answers',jsonb_build_array(),'explanation',E'구동사(look after) 수동태 — 전치사 유지'),
jsonb_build_object('number',25,'question',E'[Part 3] 다음 문장을 능동태로 바꿔 쓰시오.

Star Wars was directed by George Lucas.','answer',E'George Lucas directed Star Wars.','similar_answers',jsonb_build_array(),'explanation',E'수동태 → 능동태: by 뒤 행위자를 주어로'),
jsonb_build_object('number',26,'question',E'다음 문장을 능동태로 바꿔 쓰시오.

The treasure was discovered by the explorer.','answer',E'The explorer discovered the treasure.','similar_answers',jsonb_build_array(),'explanation',E'수동태 → 능동태 전환'),
jsonb_build_object('number',27,'question',E'다음 문장을 능동태로 바꿔 쓰시오.

Was the window opened by him?','answer',E'Did he open the window?','similar_answers',jsonb_build_array(),'explanation',E'수동태 의문문 → 능동태 의문문: Did + 주어 + 동사원형?'),
jsonb_build_object('number',28,'question',E'다음 문장을 능동태로 바꿔 쓰시오.

The grand piano is played by Brian.','answer',E'Brian plays the grand piano.','similar_answers',jsonb_build_array(),'explanation',E'현재 수동태 → 현재 능동태: 3인칭 단수 plays'),
jsonb_build_object('number',29,'question',E'다음 문장을 능동태로 바꿔 쓰시오.

Wine is not sold by them at that store.','answer',E'They don''t sell wine at that store.','similar_answers',jsonb_build_array(E'They do not sell wine at that store.'),'explanation',E'수동태 부정문 → 능동태 부정문'),
jsonb_build_object('number',30,'question',E'다음 문장을 능동태로 바꿔 쓰시오.

The bathroom was cleaned by Jane.','answer',E'Jane cleaned the bathroom.','similar_answers',jsonb_build_array(),'explanation',E'수동태 → 능동태 전환'),
jsonb_build_object('number',31,'question',E'다음 문장을 능동태로 바꿔 쓰시오.

A new school will be built by them.','answer',E'They will build a new school.','similar_answers',jsonb_build_array(),'explanation',E'미래 수동태 → 미래 능동태'),
jsonb_build_object('number',32,'question',E'다음 문장을 능동태로 바꿔 쓰시오.

The lake is visited by seals in the summer.','answer',E'Seals visit the lake in the summer.','similar_answers',jsonb_build_array(),'explanation',E'수동태 → 능동태 전환'),
jsonb_build_object('number',33,'question',E'다음 문장을 능동태로 바꿔 쓰시오.

Was a meeting held by them last week?','answer',E'Did they hold a meeting last week?','similar_answers',jsonb_build_array(),'explanation',E'수동태 의문문 → 능동태 의문문'),
jsonb_build_object('number',34,'question',E'다음 문장을 능동태로 바꿔 쓰시오.

My cat was looked after by my sister while I was out.','answer',E'My sister looked after my cat while I was out.','similar_answers',jsonb_build_array(),'explanation',E'구동사(look after) 수동태 → 능동태'),
jsonb_build_object('number',35,'question',E'[Part 4] 다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 전체 문장을 다시 쓰시오.

Soccer plays in most countries of the world.','answer',E'Soccer is played in most countries of the world.','similar_answers',jsonb_build_array(),'explanation',E'주어 Soccer가 행위의 대상 → 수동태 is played'),
jsonb_build_object('number',36,'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 전체 문장을 다시 쓰시오.

The picture was painted to Picasso.','answer',E'The picture was painted by Picasso.','similar_answers',jsonb_build_array(),'explanation',E'수동태 행위자 전치사는 to가 아니라 by'),
jsonb_build_object('number',37,'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 전체 문장을 다시 쓰시오.

This house built 100 years ago.','answer',E'This house was built 100 years ago.','similar_answers',jsonb_build_array(),'explanation',E'be동사(was) 누락'),
jsonb_build_object('number',38,'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 전체 문장을 다시 쓰시오.

A bus was appeared around the corner.','answer',E'A bus appeared around the corner.','similar_answers',jsonb_build_array(),'explanation',E'appear는 자동사이므로 수동태 불가 → 능동태로'),
jsonb_build_object('number',39,'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 전체 문장을 다시 쓰시오.

The letter was written J.K. Rowling.','answer',E'The letter was written by J.K. Rowling.','similar_answers',jsonb_build_array(),'explanation',E'행위자 앞에 by 누락'),
jsonb_build_object('number',40,'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 전체 문장을 다시 쓰시오.

Did the room cleaned by her?','answer',E'Was the room cleaned by her?','similar_answers',jsonb_build_array(),'explanation',E'수동태 의문문은 Did가 아닌 Was/Were + 주어 + p.p.'),
jsonb_build_object('number',41,'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 전체 문장을 다시 쓰시오.

The singer loves by all Koreans.','answer',E'The singer is loved by all Koreans.','similar_answers',jsonb_build_array(),'explanation',E'be동사(is) 누락 → is loved'),
jsonb_build_object('number',42,'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 전체 문장을 다시 쓰시오.

When was invented the bicycle?','answer',E'When was the bicycle invented?','similar_answers',jsonb_build_array(),'explanation',E'의문사 수동태 어순: 의문사 + was + 주어 + p.p.'),
jsonb_build_object('number',43,'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 전체 문장을 다시 쓰시오.

This bag is made by leather.','answer',E'This bag is made of leather.','similar_answers',jsonb_build_array(),'explanation',E'재료를 나타낼 때 by가 아닌 of (be made of)'),
jsonb_build_object('number',44,'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고쳐 전체 문장을 다시 쓰시오.

Something was happened to him.','answer',E'Something happened to him.','similar_answers',jsonb_build_array(),'explanation',E'happen은 자동사이므로 수동태 불가'),
jsonb_build_object('number', 45,
  'question', E'[Part 5] 다음 문장에서 밑줄 친 부분을 생략할 수 있으면 ○, 없으면 ✕를 쓰고 그 이유를 간단히 쓰시오.

The novel "1984" was written <u>by George Orwell</u>.',
  'answer', E'✕ / 특정 인물(행위자)이 중요한 정보이므로 생략 불가',
  'similar_answers', jsonb_build_array(E'✕', E'X'),
  'explanation', E'George Orwell은 특정 작가 — 중요한 정보'),
jsonb_build_object('number', 46,
  'question', E'다음 문장에서 밑줄 친 부분을 생략할 수 있으면 ○, 없으면 ✕를 쓰고 그 이유를 간단히 쓰시오.

The festival is usually held <u>by people</u> every year.',
  'answer', E'○ / 행위자가 일반인(people)이므로 생략 가능',
  'similar_answers', jsonb_build_array(E'○', E'O'),
  'explanation', E'by people — 일반인이므로 생략 가능'),
jsonb_build_object('number', 47,
  'question', E'다음 문장에서 밑줄 친 부분을 생략할 수 있으면 ○, 없으면 ✕를 쓰고 그 이유를 간단히 쓰시오.

My bag was stolen <u>by someone</u> on the subway.',
  'answer', E'○ / 행위자가 불특정인(someone)이므로 생략 가능',
  'similar_answers', jsonb_build_array(E'○', E'O'),
  'explanation', E'by someone — 불특정인이므로 생략 가능'),
jsonb_build_object('number', 48,
  'question', E'다음 문장에서 밑줄 친 부분을 생략할 수 있으면 ○, 없으면 ✕를 쓰고 그 이유를 간단히 쓰시오.

President Kennedy was killed <u>by Lee Harvey Oswald</u>.',
  'answer', E'✕ / 특정 인물(행위자)이 중요한 정보이므로 생략 불가',
  'similar_answers', jsonb_build_array(E'✕', E'X'),
  'explanation', E'Lee Harvey Oswald는 역사적으로 중요한 특정 인물'),
jsonb_build_object('number', 49,
  'question', E'다음 문장에서 밑줄 친 부분을 생략할 수 있으면 ○, 없으면 ✕를 쓰고 그 이유를 간단히 쓰시오.

He is called Beethoven <u>by people</u>.',
  'answer', E'○ / 행위자가 일반인(people)이므로 생략 가능',
  'similar_answers', jsonb_build_array(E'○', E'O'),
  'explanation', E'by people — 일반인이므로 생략 가능'),
jsonb_build_object('number', 50,
  'question', E'다음 문장에서 밑줄 친 부분을 생략할 수 있으면 ○, 없으면 ✕를 쓰고 그 이유를 간단히 쓰시오.

I was told <u>by someone</u> that my sister was here.',
  'answer', E'○ / 행위자가 불특정인(someone)이므로 생략 가능',
  'similar_answers', jsonb_build_array(E'○', E'O'),
  'explanation', E'by someone — 불특정인이므로 생략 가능'),
jsonb_build_object('number', 51,
  'question', E'다음 문장에서 밑줄 친 부분을 생략할 수 있으면 ○, 없으면 ✕를 쓰고 그 이유를 간단히 쓰시오.

The portrait was painted <u>by a little-known artist</u>.',
  'answer', E'✕ / 행위자에 대한 구체적 정보를 제공하므로 생략 불가',
  'similar_answers', jsonb_build_array(E'✕', E'X'),
  'explanation', E'a little-known artist — 구체적 정보 제공'),
jsonb_build_object('number', 52,
  'question', E'다음 문장에서 밑줄 친 부분을 생략할 수 있으면 ○, 없으면 ✕를 쓰고 그 이유를 간단히 쓰시오.

Chinese is spoken in China <u>by people</u>.',
  'answer', E'○ / 행위자가 일반인(people)이므로 생략 가능',
  'similar_answers', jsonb_build_array(E'○', E'O'),
  'explanation', E'by people — 일반인이므로 생략 가능'),
jsonb_build_object('number', 53,
  'question', E'[Part 6] 다음 빈칸에 알맞은 수동태 형태를 쓰시오.

Children __________ (should, teach) to respect their elders.',
  'answer', E'should be taught',
  'similar_answers', jsonb_build_array(),
  'explanation', E'조동사 수동태 should + be + p.p.'),
jsonb_build_object('number', 54,
  'question', E'다음 빈칸에 알맞은 수동태 형태를 쓰시오.

The window __________ (cannot, open).',
  'answer', E'cannot be opened',
  'similar_answers', jsonb_build_array(E'can''t be opened', E'can not be opened'),
  'explanation', E'조동사 수동태 cannot + be + p.p.'),
jsonb_build_object('number', 55,
  'question', E'다음 빈칸에 알맞은 수동태 형태를 쓰시오.

Even hamburgers __________ (can, deliver) in Korea.',
  'answer', E'can be delivered',
  'similar_answers', jsonb_build_array(),
  'explanation', E'조동사 수동태 can + be + p.p.'),
jsonb_build_object('number', 56,
  'question', E'다음 빈칸에 알맞은 수동태 형태를 쓰시오.

The project __________ (must, finish) by tomorrow.',
  'answer', E'must be finished',
  'similar_answers', jsonb_build_array(),
  'explanation', E'조동사 수동태 must + be + p.p.'),
jsonb_build_object('number', 57,
  'question', E'다음 빈칸에 알맞은 수동태 형태를 쓰시오.

The gift __________ (not, make) by Sam.',
  'answer', E'wasn''t made',
  'similar_answers', jsonb_build_array(E'was not made'),
  'explanation', E'과거 부정 수동태 was not + p.p.'),
jsonb_build_object('number', 58,
  'question', E'다음 빈칸에 알맞은 수동태 형태를 쓰시오.

__________ all the people __________ (invite) to dinner? No, they weren''t.',
  'subParts', jsonb_build_array(
    jsonb_build_object('label', E'첫 번째 빈칸', 'answer', E'Were', 'acceptedAnswers', jsonb_build_array()),
    jsonb_build_object('label', E'두 번째 빈칸', 'answer', E'invited', 'acceptedAnswers', jsonb_build_array())
  ),
  'answer', E'Were / invited',
  'similar_answers', jsonb_build_array(E'Were, invited'),
  'explanation', E'과거 의문문 수동태 — Were + 주어 + p.p.'),
jsonb_build_object('number', 59,
  'question', E'다음 빈칸에 알맞은 수동태 형태를 쓰시오.

When __________ the first telephone __________ (invent) by Bell?',
  'subParts', jsonb_build_array(
    jsonb_build_object('label', E'첫 번째 빈칸', 'answer', E'was', 'acceptedAnswers', jsonb_build_array()),
    jsonb_build_object('label', E'두 번째 빈칸', 'answer', E'invented', 'acceptedAnswers', jsonb_build_array())
  ),
  'answer', E'was / invented',
  'similar_answers', jsonb_build_array(E'was, invented'),
  'explanation', E'과거 의문문 수동태 — 의문사 + was + 주어 + p.p.'),
jsonb_build_object('number', 60,
  'question', E'다음 빈칸에 알맞은 수동태 형태를 쓰시오.

The door __________ (must not, leave) open.',
  'answer', E'must not be left',
  'similar_answers', jsonb_build_array(E'mustn''t be left'),
  'explanation', E'조동사 부정 수동태 must not + be + p.p.'),
jsonb_build_object('number', 61,
  'question', E'다음 빈칸에 알맞은 수동태 형태를 쓰시오.

By whom __________ the car __________ (drive)?',
  'subParts', jsonb_build_array(
    jsonb_build_object('label', E'첫 번째 빈칸', 'answer', E'was', 'acceptedAnswers', jsonb_build_array()),
    jsonb_build_object('label', E'두 번째 빈칸', 'answer', E'driven', 'acceptedAnswers', jsonb_build_array())
  ),
  'answer', E'was / driven',
  'similar_answers', jsonb_build_array(E'was, driven'),
  'explanation', E'by whom 의문문 수동태 — By whom + was + 주어 + p.p.'),
jsonb_build_object('number', 62,
  'question', E'[Part 7] 다음 빈칸에 알맞은 전치사를 쓰시오.

[참고] be surprised at | be interested in | be filled with | be covered with | be known to | be satisfied with | be worried about

She was surprised __________ the news.',
  'answer', E'at',
  'similar_answers', jsonb_build_array(),
  'explanation', E'be surprised at ~에 놀라다'),
jsonb_build_object('number', 63,
  'question', E'다음 빈칸에 알맞은 전치사를 쓰시오.

I am interested __________ making robots.',
  'answer', E'in',
  'similar_answers', jsonb_build_array(),
  'explanation', E'be interested in ~에 관심이 있다'),
jsonb_build_object('number', 64,
  'question', E'다음 빈칸에 알맞은 전치사를 쓰시오.

The cake is covered __________ fresh cream.',
  'answer', E'with',
  'similar_answers', jsonb_build_array(),
  'explanation', E'be covered with ~으로 덮여 있다'),
jsonb_build_object('number', 65,
  'question', E'다음 빈칸에 알맞은 전치사를 쓰시오.

This box is filled __________ books.',
  'answer', E'with',
  'similar_answers', jsonb_build_array(),
  'explanation', E'be filled with ~으로 가득 차다'),
jsonb_build_object('number', 66,
  'question', E'다음 빈칸에 알맞은 전치사를 쓰시오.

Psy was known __________ people around the world.',
  'answer', E'to',
  'similar_answers', jsonb_build_array(),
  'explanation', E'be known to ~에게 알려지다'),
jsonb_build_object('number', 67,
  'question', E'다음 빈칸에 알맞은 전치사를 쓰시오.

He is very satisfied __________ his new phone.',
  'answer', E'with',
  'similar_answers', jsonb_build_array(),
  'explanation', E'be satisfied with ~에 만족하다'),
jsonb_build_object('number', 68,
  'question', E'다음 빈칸에 알맞은 전치사를 쓰시오.

She was worried __________ her final exam.',
  'answer', E'about',
  'similar_answers', jsonb_build_array(),
  'explanation', E'be worried about ~에 대해 걱정하다'),
jsonb_build_object('number', 69,
  'question', E'[Part 8] 다음 우리말과 일치하도록 수동태를 사용하여 영작하시오.

그 그림은 파블로 피카소에 의해 그려졌다.',
  'answer', E'The picture was painted by Pablo Picasso.',
  'similar_answers', jsonb_build_array(E'The painting was painted by Pablo Picasso.'),
  'explanation', E'과거 수동태 was + p.p. + by 행위자'),
jsonb_build_object('number', 70,
  'question', E'다음 우리말과 일치하도록 수동태를 사용하여 영작하시오.

한글은 세종대왕에 의해 만들어졌다.',
  'answer', E'Hangeul was made by King Sejong.',
  'similar_answers', jsonb_build_array(E'Hangeul was created by King Sejong.'),
  'explanation', E'과거 수동태 was + p.p. + by 행위자'),
jsonb_build_object('number', 71,
  'question', E'다음 우리말과 일치하도록 수동태를 사용하여 영작하시오.

그 편지는 어제 잘못된 주소로 보내졌다.',
  'answer', E'The letter was sent to the wrong address yesterday.',
  'similar_answers', jsonb_build_array(),
  'explanation', E'과거 수동태 was + p.p. + 부사구'),
jsonb_build_object('number', 72,
  'question', E'다음 우리말과 일치하도록 수동태를 사용하여 영작하시오.

영어는 전 세계 많은 나라에서 사용된다.',
  'answer', E'English is used in many countries around the world.',
  'similar_answers', jsonb_build_array(E'English is spoken in many countries around the world.'),
  'explanation', E'현재 수동태 is + p.p. + 장소 부사구'),
jsonb_build_object('number', 73,
  'question', E'다음 우리말과 일치하도록 수동태를 사용하여 영작하시오.

그 건물은 내년에 지어질 것이다.',
  'answer', E'The building will be built next year.',
  'similar_answers', jsonb_build_array(),
  'explanation', E'미래 수동태 will + be + p.p.'),
jsonb_build_object('number', 74,
  'question', E'다음 우리말과 일치하도록 수동태를 사용하여 영작하시오.

그 도둑은 경찰에 의해 잡혔니?',
  'answer', E'Was the thief caught by the police?',
  'similar_answers', jsonb_build_array(),
  'explanation', E'과거 의문문 수동태 Was + 주어 + p.p. + by 행위자'),
jsonb_build_object('number', 75,
  'question', E'다음 우리말과 일치하도록 수동태를 사용하여 영작하시오.

아이들은 어른을 존경하도록 가르침을 받아야 한다.',
  'answer', E'Children should be taught to respect their elders.',
  'similar_answers', jsonb_build_array(),
  'explanation', E'조동사 수동태 should + be + p.p.'),
jsonb_build_object('number', 76,
  'question', E'다음 우리말과 일치하도록 수동태를 사용하여 영작하시오.

많은 나무들이 종이를 만들기 위해 베어진다.',
  'answer', E'Many trees are cut down to make paper.',
  'similar_answers', jsonb_build_array(),
  'explanation', E'현재 수동태 are + p.p. + to부정사 목적')
  );

  a := jsonb_build_array(E'was written', E'are cleaned', E'was designed', E'were destroyed', E'is spoken', E'was sent', E'will be built', E'was invented', E'was stolen', E'must be followed', E'A wooden box was made by Fred.', E'Korean is spoken in Korea.', E'The wall was painted by my mother.', E'The car was stopped by a police officer.', E'The car can be repaired by him.', E'The promise will be broken by Jimin.', E'Was the room cleaned by Cathy?', E'My bike wasn''t fixed by my dad.', E'Hangeul was made by King Sejong.', E'The thief was caught by the police.', E'Today''s newspaper was given to me by her.', E'She was made happy by the news.', E'Many accidents are caused by careless driving.', E'My cat was looked after by my sister while I was out.', E'George Lucas directed Star Wars.', E'The explorer discovered the treasure.', E'Did he open the window?', E'Brian plays the grand piano.', E'They don''t sell wine at that store.', E'Jane cleaned the bathroom.', E'They will build a new school.', E'Seals visit the lake in the summer.', E'Did they hold a meeting last week?', E'My sister looked after my cat while I was out.', E'Soccer is played in most countries of the world.', E'The picture was painted by Picasso.', E'This house was built 100 years ago.', E'A bus appeared around the corner.', E'The letter was written by J.K. Rowling.', E'Was the room cleaned by her?', E'The singer is loved by all Koreans.', E'When was the bicycle invented?', E'This bag is made of leather.', E'Something happened to him.', E'✕ / 특정 인물(행위자)이 중요한 정보이므로 생략 불가', E'○ / 행위자가 일반인(people)이므로 생략 가능', E'○ / 행위자가 불특정인(someone)이므로 생략 가능', E'✕ / 특정 인물(행위자)이 중요한 정보이므로 생략 불가', E'○ / 행위자가 일반인(people)이므로 생략 가능', E'○ / 행위자가 불특정인(someone)이므로 생략 가능', E'✕ / 행위자에 대한 구체적 정보를 제공하므로 생략 불가', E'○ / 행위자가 일반인(people)이므로 생략 가능', E'should be taught', E'cannot be opened', E'can be delivered', E'must be finished', E'wasn''t made', E'Were', E'was', E'must not be left', E'was', E'at', E'in', E'with', E'with', E'to', E'with', E'about', E'The picture was painted by Pablo Picasso.', E'Hangeul was made by King Sejong.', E'The letter was sent to the wrong address yesterday.', E'English is used in many countries around the world.', E'The building will be built next year.', E'Was the thief caught by the police?', E'Children should be taught to respect their elders.', E'Many trees are cut down to make paper.');

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('수동태 Step 1', '수동태', q, a, 'problem', 'interactive');
END
$$;
