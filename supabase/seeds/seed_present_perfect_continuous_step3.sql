-- 현재완료진행형 Step3 60문제 (MCQ 4문항 + 서술형 56문항)
-- 난이도: 하(Part1-2) → 중(Part3-4) → 중상(Part5-6) → 상(Part7-9)
DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = '현재완료진행형 Step3';

  -- ═══════════════════════════════════════
  -- Part 1 (Q1-Q5): 보기 단어 시제 변형 빈칸
  -- ═══════════════════════════════════════
  q := jsonb_build_array(
    jsonb_build_object('number',1,'question',E'다음 <보기>에서 알맞은 단어를 골라 현재완료진행형으로 바꾸어 빈칸을 채우시오.\n\n<보기> not attend / coach / sit / travel / repair\n\nThey _______ there since after the sunrise.','options',jsonb_build_array(),'answer','have been sitting','acceptedAnswers',jsonb_build_array('have been sitting')),

    jsonb_build_object('number',2,'question',E'다음 <보기>에서 알맞은 단어를 골라 현재완료진행형으로 바꾸어 빈칸을 채우시오.\n\n<보기> not attend / coach / sit / travel / repair\n\nI _______ a volleyball team for the past two months.','options',jsonb_build_array(),'answer','have been coaching','acceptedAnswers',jsonb_build_array('have been coaching')),

    jsonb_build_object('number',3,'question',E'다음 <보기>에서 알맞은 단어를 골라 현재완료진행형으로 바꾸어 빈칸을 채우시오.\n\n<보기> not attend / coach / sit / travel / repair\n\nI _______ any parties since I moved to this town.','options',jsonb_build_array(),'answer','have not been attending','acceptedAnswers',jsonb_build_array('have not been attending','haven''t been attending')),

    jsonb_build_object('number',4,'question',E'다음 <보기>에서 알맞은 단어를 골라 현재완료진행형으로 바꾸어 빈칸을 채우시오.\n\n<보기> not attend / coach / sit / travel / repair\n\nShe _______ around South America for the past two months.','options',jsonb_build_array(),'answer','has been traveling','acceptedAnswers',jsonb_build_array('has been traveling','has been travelling')),

    jsonb_build_object('number',5,'question',E'다음 <보기>에서 알맞은 단어를 골라 현재완료진행형으로 바꾸어 빈칸을 채우시오.\n\n<보기> not attend / coach / sit / travel / repair\n\nMy uncle _______ his old car since last weekend.','options',jsonb_build_array(),'answer','has been repairing','acceptedAnswers',jsonb_build_array('has been repairing'))
  )

  -- ═══════════════════════════════════════
  -- Part 2 (Q6-Q10): 괄호 선택
  -- ═══════════════════════════════════════
  ||
  jsonb_build_array(
    jsonb_build_object('number',6,'question',E'다음 괄호 안에서 알맞은 것을 고르시오. (단, 모두 가능할 경우 현재완료진행 시제를 쓸 것)\n\nHow long have you been _______ in this neighborhood?','options',jsonb_build_array('lived','living'),'answer','living','acceptedAnswers',jsonb_build_array('living')),

    jsonb_build_object('number',7,'question',E'다음 괄호 안에서 알맞은 것을 고르시오. (단, 모두 가능할 경우 현재완료진행 시제를 쓸 것)\n\nI _______ my homework already. Let''s go out!','options',jsonb_build_array('have finished','have been finishing'),'answer','have finished','acceptedAnswers',jsonb_build_array('have finished')),

    jsonb_build_object('number',8,'question',E'다음 괄호 안에서 알맞은 것을 고르시오. (단, 모두 가능할 경우 현재완료진행 시제를 쓸 것)\n\nI _______ here only a short time ago.','options',jsonb_build_array('arrived','have arrived','have been arriving'),'answer','arrived','acceptedAnswers',jsonb_build_array('arrived')),

    jsonb_build_object('number',9,'question',E'다음 괄호 안에서 알맞은 것을 각각 고르시오. (단, 모두 가능할 경우 현재완료진행 시제를 쓸 것)\n\nKyle and my sister [sit / are sitting / have been sitting] on a park bench right now. They [sit / are sitting / have been sitting] there since after dinner.','options',jsonb_build_array(),'answer','are sitting / have been sitting','acceptedAnswers',jsonb_build_array('are sitting / have been sitting','are sitting, have been sitting')),

    jsonb_build_object('number',10,'question',E'다음 괄호 안에서 알맞은 것을 고르시오. (단, 모두 가능할 경우 현재완료진행 시제를 쓸 것)\n\nMary is standing at the bus stop. She _______ for the bus for twenty minutes.','options',jsonb_build_array('waited','has been waiting'),'answer','has been waiting','acceptedAnswers',jsonb_build_array('has been waiting'))
  )

  -- ═══════════════════════════════════════
  -- Part 3 (Q11-Q14): 질문에 답하기
  -- ═══════════════════════════════════════
  ||
  jsonb_build_array(
    jsonb_build_object('number',11,'question',E'다음 질문에 대한 알맞은 답을 현재완료진행형을 이용하여 완전한 문장으로 쓰시오.\n\nQ: What has she been doing since 6 o''clock?\n힌트: watch TV','options',jsonb_build_array(),'answer','She has been watching TV since 6 o''clock.','acceptedAnswers',jsonb_build_array('She has been watching TV since 6 o''clock.','She has been watching TV since 6 o''clock')),

    jsonb_build_object('number',12,'question',E'다음 질문에 대한 알맞은 답을 현재완료진행형을 이용하여 완전한 문장으로 쓰시오.\n\nQ: What has he been doing since this morning?\n힌트: cook','options',jsonb_build_array(),'answer','He has been cooking since this morning.','acceptedAnswers',jsonb_build_array('He has been cooking since this morning.','He has been cooking since this morning')),

    jsonb_build_object('number',13,'question',E'다음 질문에 대한 알맞은 답을 현재완료진행형을 이용하여 완전한 문장으로 쓰시오.\n\nQ: Since when has it been snowing?\n힌트: last night','options',jsonb_build_array(),'answer','It has been snowing since last night.','acceptedAnswers',jsonb_build_array('It has been snowing since last night.','It has been snowing since last night')),

    jsonb_build_object('number',14,'question',E'다음 질문에 대한 알맞은 답을 현재완료진행형을 이용하여 완전한 문장으로 쓰시오.\n\nQ: How long have they been playing games?\n힌트: started at 2 o''clock, it is now 4 o''clock','options',jsonb_build_array(),'answer','They have been playing games for two hours.','acceptedAnswers',jsonb_build_array('They have been playing games for two hours.','They have been playing games for two hours','They have been playing games for 2 hours.','They have been playing games for 2 hours'))
  )

  -- ═══════════════════════════════════════
  -- Part 4 (Q15-Q22): 두 문장 합치기
  -- ═══════════════════════════════════════
  ||
  jsonb_build_array(
    jsonb_build_object('number',15,'question',E'다음 두 문장을 현재완료진행형을 이용하여 한 문장으로 바꾸어 쓰시오.\n\n<보기> Willy and Sam began playing chess three hours ago. They are still playing now.\n→ Willy and Sam have been playing chess for three hours.\n\nIt started to rain yesterday. It is still raining now.\n→','options',jsonb_build_array(),'answer','It has been raining since yesterday.','acceptedAnswers',jsonb_build_array('It has been raining since yesterday.','It has been raining since yesterday')),

    jsonb_build_object('number',16,'question',E'다음 두 문장을 현재완료진행형을 이용하여 한 문장으로 바꾸어 쓰시오.\n\nMr. Kim started to work at this company ten years ago. He is still working at this company.\n→','options',jsonb_build_array(),'answer','Mr. Kim has been working at this company for ten years.','acceptedAnswers',jsonb_build_array('Mr. Kim has been working at this company for ten years.','Mr. Kim has been working at this company for ten years','Mr. Kim has been working at this company for 10 years.','Mr. Kim has been working at this company for 10 years')),

    jsonb_build_object('number',17,'question',E'다음 두 문장을 현재완료진행형을 이용하여 한 문장으로 바꾸어 쓰시오.\n\nI started to wear glasses when I was nine. Now I''m still wearing them.\n→','options',jsonb_build_array(),'answer','I have been wearing glasses since I was nine.','acceptedAnswers',jsonb_build_array('I have been wearing glasses since I was nine.','I have been wearing glasses since I was nine','I have been wearing glasses since I was 9.')),

    jsonb_build_object('number',18,'question',E'다음 두 문장을 현재완료진행형을 이용하여 한 문장으로 바꾸어 쓰시오.\n\nHe began watching TV five hours ago. He is still watching it now.\n→ He _______ for five hours.','options',jsonb_build_array(),'answer','has been watching TV','acceptedAnswers',jsonb_build_array('has been watching TV')),

    jsonb_build_object('number',19,'question',E'다음 두 문장을 현재완료진행형을 이용하여 한 문장으로 바꾸어 쓰시오.\n\nHe began to play baseball two hours ago. He is still playing baseball.\n→ He _______ baseball _______ two hours.','options',jsonb_build_array(),'answer','has been playing / for','acceptedAnswers',jsonb_build_array('has been playing / for','has been playing, for','has been playing/for')),

    jsonb_build_object('number',20,'question',E'다음 두 문장을 현재완료진행형을 이용하여 한 문장으로 바꾸어 쓰시오.\n\nJames started teaching English 20 years ago. He is still teaching at Hana Middle School.\n조건: 숫자는 한 단어로, 총 12단어로 쓸 것\n→','options',jsonb_build_array(),'answer','James has been teaching English at Hana Middle School for twenty years.','acceptedAnswers',jsonb_build_array('James has been teaching English at Hana Middle School for twenty years.','James has been teaching English at Hana Middle School for twenty years','James has been teaching English at Hana Middle School for 20 years.')),

    jsonb_build_object('number',21,'question',E'다음 두 문장을 현재완료진행형을 이용하여 한 문장으로 바꾸어 쓰시오.\n\nI started reading this book two hours ago. I am still reading it.\n→ I _______ this book _______ two _______.','options',jsonb_build_array(),'answer','have been reading / for / hours','acceptedAnswers',jsonb_build_array('have been reading / for / hours','have been reading, for, hours')),

    jsonb_build_object('number',22,'question',E'다음 두 문장을 현재완료진행형을 이용하여 한 문장으로 바꾸어 쓰시오.\n\nThe machine was out of order three hours ago. It''s still not working.\n조건: ''working''을 반드시 사용, 9단어 이내\n→ The machine','options',jsonb_build_array(),'answer','has not been working for three hours.','acceptedAnswers',jsonb_build_array('has not been working for three hours.','has not been working for three hours','hasn''t been working for three hours.','hasn''t been working for three hours','has not been working for 3 hours.'))
  )

  -- ═══════════════════════════════════════
  -- Part 5 (Q23-Q30): 상황 읽고 문장 완성
  -- ═══════════════════════════════════════
  ||
  jsonb_build_array(
    jsonb_build_object('number',23,'question',E'다음 상황을 읽고 현재완료 혹은 현재완료진행을 사용하여 문장을 완성하시오. (단, 모두 가능할 경우 현재완료진행 시제를 쓸 것)\n\nMy dad is an architect. He started to build a community center two months ago, and is still building it.\n→ My dad _______.\n힌트: build, a community center, for two months','options',jsonb_build_array(),'answer','has been building a community center for two months.','acceptedAnswers',jsonb_build_array('has been building a community center for two months.','has been building a community center for two months','has been building a community center for 2 months.')),

    jsonb_build_object('number',24,'question',E'다음 상황을 읽고 현재완료 혹은 현재완료진행을 사용하여 문장을 완성하시오. (단, 모두 가능할 경우 현재완료진행 시제를 쓸 것)\n\nYuna is a Korean teacher. She started to teach Korean in Canada in 2002. She is still teaching it there.\n→ Yuna _______.\n힌트: teach, Korean, in Canada, since 2002','options',jsonb_build_array(),'answer','has been teaching Korean in Canada since 2002.','acceptedAnswers',jsonb_build_array('has been teaching Korean in Canada since 2002.','has been teaching Korean in Canada since 2002')),

    jsonb_build_object('number',25,'question',E'다음 상황을 읽고 현재완료 혹은 현재완료진행을 사용하여 문장을 완성하시오. (단, 모두 가능할 경우 현재완료진행 시제를 쓸 것)\n\nJunho went to Paris twice to meet his friend, Amy. Amy was born in Paris, and she still lives in Paris.\n→ Junho _______ to Paris twice. Amy _______ in Paris.','options',jsonb_build_array(),'answer','has been / has lived','acceptedAnswers',jsonb_build_array('has been / has lived','has been / has been living','has been, has lived','has been, has been living')),

    jsonb_build_object('number',26,'question',E'다음 상황을 읽고 현재완료 혹은 현재완료진행을 사용하여 문장을 완성하시오. (단, 모두 가능할 경우 현재완료진행 시제를 쓸 것)\n\nSarah had a job interview at a company at 9 o''clock. But it is already over 10 o''clock, and she is still interviewing in the office now.\n→ Sarah _______ in the office since 9 o''clock.','options',jsonb_build_array(),'answer','has been interviewing','acceptedAnswers',jsonb_build_array('has been interviewing')),

    jsonb_build_object('number',27,'question',E'다음 상황을 읽고 현재완료 혹은 현재완료진행을 사용하여 문장을 완성하시오. (단, 모두 가능할 경우 현재완료진행 시제를 쓸 것)\n\nAnne composes songs. She started composing songs when she was 16 years old. She released fifteen albums in total.\n→ Anne _______ songs since she was 16 years old. She _______ fifteen albums in her life.','options',jsonb_build_array(),'answer','has been composing / has released','acceptedAnswers',jsonb_build_array('has been composing / has released','has been composing, has released')),

    jsonb_build_object('number',28,'question',E'다음 상황을 읽고 현재완료 혹은 현재완료진행을 사용하여 문장을 완성하시오. (단, 모두 가능할 경우 현재완료진행 시제를 쓸 것)\n\nSamuel has called Mina seven times in the last hour, but her line is busy. He will keep trying until he reaches her.\n→ Samuel _______ (try) to reach Mina _______ an hour.','options',jsonb_build_array(),'answer','has been trying / for','acceptedAnswers',jsonb_build_array('has been trying / for','has been trying, for','has been trying/for')),

    jsonb_build_object('number',29,'question',E'다음 상황을 읽고 현재완료 혹은 현재완료진행을 사용하여 문장을 완성하시오. (단, 모두 가능할 경우 현재완료진행 시제를 쓸 것)\n\nMom writes novels. She started writing novels when she was 30 years old.\n→ Mom _______.\n힌트: write, novels, since she was 30 years old','options',jsonb_build_array(),'answer','has been writing novels since she was 30 years old.','acceptedAnswers',jsonb_build_array('has been writing novels since she was 30 years old.','has been writing novels since she was 30 years old','has been writing novels since she was 30.')),

    jsonb_build_object('number',30,'question',E'다음 상황을 읽고 현재완료 혹은 현재완료진행을 사용하여 문장을 완성하시오. (단, 모두 가능할 경우 현재완료진행 시제를 쓸 것)\n\nThe boys started to do gardening an hour ago. They are planting trees and flowers.\n→ The boys _______.\n힌트: do gardening, for an hour','options',jsonb_build_array(),'answer','have been doing gardening for an hour.','acceptedAnswers',jsonb_build_array('have been doing gardening for an hour.','have been doing gardening for an hour'))
  )

  -- ═══════════════════════════════════════
  -- Part 6 (Q31-Q35): 글 읽고 요약
  -- ═══════════════════════════════════════
  ||
  jsonb_build_array(
    jsonb_build_object('number',31,'question',E'다음 글을 읽고 주어진 단어를 사용하여 한 문장으로 알맞게 요약하시오.\n\nAlex moved to this country last month. He bought a motorcycle right away and uses it to get around town.\n→ Alex _______ (own) his motorcycle _______ last month.','options',jsonb_build_array(),'answer','has owned / since','acceptedAnswers',jsonb_build_array('has owned / since','has owned, since','has owned/since')),

    jsonb_build_object('number',32,'question',E'다음 글을 읽고 주어진 단어를 사용하여 한 문장으로 알맞게 요약하시오.\n\nSarah and Junho are in the middle of a chess match. They''re getting tired now. Their chess match started three hours ago.\n→ Sarah and Junho _______ (play) chess for _______.','options',jsonb_build_array(),'answer','have been playing / three hours','acceptedAnswers',jsonb_build_array('have been playing / three hours','have been playing, three hours','have been playing / 3 hours')),

    jsonb_build_object('number',33,'question',E'다음 글을 읽고 어법상 어색한 문장을 찾아 바르게 고쳐 쓰시오.\n\nMy family came to this city last month. We went to many places. We have met many interesting people. My friend who lives in Seoul came to visit us. We have been knowing each other since I was ten.','options',jsonb_build_array(),'answer','We have known each other since I was ten.','acceptedAnswers',jsonb_build_array('We have known each other since I was ten.','We have known each other since I was ten')),

    jsonb_build_object('number',34,'question',E'다음 글을 읽고 <보기>에서 알맞은 단어를 골라 현재완료진행형으로 빈칸을 채우시오.\n\nOur classes are very interesting. I have been studying Chinese for 2 years. My best friend Ken is a good soccer player. He (A) _______ soccer since he was a little boy. Julie wants to be a cook, so she (B) _______ a baking class since last month. My teacher teaches history. He (C) _______ Korean history at school for 20 years.\n\n<보기> play / take / teach / spend\n\n(A) _______ (B) _______ (C) _______','options',jsonb_build_array(),'answer','has been playing / has been taking / has been teaching','acceptedAnswers',jsonb_build_array('has been playing / has been taking / has been teaching','has been playing, has been taking, has been teaching')),

    jsonb_build_object('number',35,'question',E'다음 글을 읽고 주어진 조건에 맞게 문장을 완성하시오.\n\nAs soon as I got home, I washed and took a rest for a while. Then I began to do my English homework at 7. Now it''s 10, but I am still doing it.\n→ So I _______\n조건: have와 for 두 단어를 꼭 사용할 것','options',jsonb_build_array(),'answer','have been doing my English homework for three hours.','acceptedAnswers',jsonb_build_array('have been doing my English homework for three hours.','have been doing my English homework for three hours','have been doing my English homework for 3 hours.','have been doing my English homework for 3 hours'))
  )

  -- ═══════════════════════════════════════
  -- Part 7 (Q36-Q45): 우리말 → 영작
  -- ═══════════════════════════════════════
  ||
  jsonb_build_array(
    jsonb_build_object('number',36,'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n그녀는 5년 동안 한 소설을 쓰고 있는 중이다.\n조건: 진행형 사용, for, write, five, a novel — 9단어','options',jsonb_build_array(),'answer','She has been writing a novel for five years.','acceptedAnswers',jsonb_build_array('She has been writing a novel for five years.','She has been writing a novel for five years','She has been writing a novel for 5 years.')),

    jsonb_build_object('number',37,'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n나는 10년 동안 광주에서 살고 있다.\n조건: 현재완료진행형, 완전한 문장','options',jsonb_build_array(),'answer','I have been living in Gwangju for 10 years.','acceptedAnswers',jsonb_build_array('I have been living in Gwangju for 10 years.','I have been living in Gwangju for 10 years','I have been living in Gwangju for ten years.','I have been living in Gwangju for ten years')),

    jsonb_build_object('number',38,'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n그녀는 오늘 아침 이후로 책을 읽고 있는 중이다.\n조건: 현재완료진행형, 완전한 문장','options',jsonb_build_array(),'answer','She has been reading a book since this morning.','acceptedAnswers',jsonb_build_array('She has been reading a book since this morning.','She has been reading a book since this morning')),

    jsonb_build_object('number',39,'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n그녀와 그녀의 댄서들은 아홉 시간째 연습하고 있는 중입니다.\n조건: 10단어','options',jsonb_build_array(),'answer','She and her dancers have been practicing for nine hours.','acceptedAnswers',jsonb_build_array('She and her dancers have been practicing for nine hours.','She and her dancers have been practicing for nine hours','She and her dancers have been practicing for 9 hours.')),

    jsonb_build_object('number',40,'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n그들은 오늘 아침부터 기다리고 있다.\n조건: 7단어','options',jsonb_build_array(),'answer','They have been waiting since this morning.','acceptedAnswers',jsonb_build_array('They have been waiting since this morning.','They have been waiting since this morning')),

    jsonb_build_object('number',41,'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n나는 5년 동안 다른 나라 동전들을 모으고 있습니다.\n힌트: I, collect, from, coins, other countries, five years','options',jsonb_build_array(),'answer','I have been collecting coins from other countries for five years.','acceptedAnswers',jsonb_build_array('I have been collecting coins from other countries for five years.','I have been collecting coins from other countries for five years','I have been collecting coins from other countries for 5 years.')),

    jsonb_build_object('number',42,'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n그 소년은 약 한 시간 동안 컴퓨터를 이용하고 있는 중이다.\n힌트: computer, about, using, an, has, been, the, for\n→ The boy _______ hour.','options',jsonb_build_array(),'answer','has been using the computer for about an','acceptedAnswers',jsonb_build_array('has been using the computer for about an')),

    jsonb_build_object('number',43,'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\nMr. Kim은 2001년부터 수학을 가르쳐 오고 있다.\n조건: 현재완료진행형, 완전한 문장','options',jsonb_build_array(),'answer','Mr. Kim has been teaching math since 2001.','acceptedAnswers',jsonb_build_array('Mr. Kim has been teaching math since 2001.','Mr. Kim has been teaching math since 2001')),

    jsonb_build_object('number',44,'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\nMike는 열 살 때부터 축구를 해 왔다. (현재 16세)\n조건: 대소문자, 철자 주의. 모든 단어는 영어로 쓸 것\n→ Mike _______ years.','options',jsonb_build_array(),'answer','has been playing soccer for six','acceptedAnswers',jsonb_build_array('has been playing soccer for six','has been playing soccer for 6')),

    jsonb_build_object('number',45,'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n하루 종일 비가 오고 있다.\n조건: 현재완료진행 시제, 6단어','options',jsonb_build_array(),'answer','It has been raining all day long.','acceptedAnswers',jsonb_build_array('It has been raining all day long.','It has been raining all day long','It has been raining all day.','It has been raining all day'))
  )

  -- ═══════════════════════════════════════
  -- Part 8 (Q46-Q53): 조건 영작
  -- ═══════════════════════════════════════
  ||
  jsonb_build_array(
    jsonb_build_object('number',46,'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n<조건>\n1. 과거부터 현재까지 비가 오는 중임을 나타내는 문장으로 만들 것 (현재완료진행 시제를 사용할 것)\n2. 총 6단어로 쓸 것\n\n하루 종일 비가 오고 있다.','options',jsonb_build_array(),'answer','It has been raining all day.','acceptedAnswers',jsonb_build_array('It has been raining all day.','It has been raining all day')),

    jsonb_build_object('number',47,'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n<조건>\n1. 주어와 동사를 갖춘 문장으로 쓸 것\n2. 동사의 형태를 꼭 현재완료진행형으로 변형시킬 것\n\n(1) 나는 10년 동안 광주에서 살고 있다.\n→\n(2) 그녀는 오늘 아침 이후로 책을 읽고 있는 중이다.\n→','options',jsonb_build_array(),'answer','(1) I have been living in Gwangju for 10 years. / (2) She has been reading a book since this morning.','acceptedAnswers',jsonb_build_array('(1) I have been living in Gwangju for 10 years. / (2) She has been reading a book since this morning.','I have been living in Gwangju for 10 years. / She has been reading a book since this morning.','(1) I have been living in Gwangju for ten years. / (2) She has been reading a book since this morning.')),

    jsonb_build_object('number',48,'question',E'다음을 주어진 조건에 맞게 영작하시오.\n\n<조건>\n1. ''working''을 반드시 사용할 것\n2. 9단어 이내의 완전한 문장으로 다시 쓸 것\n\n• The machine was out of order three hours ago.\n• It''s still not working.\n→ The machine','options',jsonb_build_array(),'answer','has not been working for three hours.','acceptedAnswers',jsonb_build_array('has not been working for three hours.','has not been working for three hours','hasn''t been working for three hours.','hasn''t been working for three hours','has not been working for 3 hours.')),

    jsonb_build_object('number',49,'question',E'다음을 주어진 조건에 맞게 영작하시오.\n\n<조건>\n1. 접속사나 연결어는 사용하지 말 것\n2. 완전한 영어 문장으로 쓸 것\n\n• He started doing his homework three hours ago.\n• He is still doing his homework.','options',jsonb_build_array(),'answer','He has been doing his homework for three hours.','acceptedAnswers',jsonb_build_array('He has been doing his homework for three hours.','He has been doing his homework for three hours','He has been doing his homework for 3 hours.')),

    jsonb_build_object('number',50,'question',E'다음을 주어진 조건에 맞게 영작하시오.\n\n<조건>\n1. 숫자는 한 단어로 취급하며, 총 12단어로 쓸 것\n2. 현재완료진행 시제를 이용할 것\n\n• James started teaching English 20 years ago.\n• He is still teaching at Hana Middle School.','options',jsonb_build_array(),'answer','James has been teaching English at Hana Middle School for twenty years.','acceptedAnswers',jsonb_build_array('James has been teaching English at Hana Middle School for twenty years.','James has been teaching English at Hana Middle School for twenty years','James has been teaching English at Hana Middle School for 20 years.')),

    jsonb_build_object('number',51,'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n<조건>\n1. 과거에 시작한 일을 현재까지 계속하고 있다는 것을 강조하는 시제를 사용할 것\n2. ''last Friday''를 포함하는 문장으로 만들 것\n\n우리는 지난 금요일부터 그 여행을 계획해 오고 있다.\n→ We','options',jsonb_build_array(),'answer','have been planning the trip since last Friday.','acceptedAnswers',jsonb_build_array('have been planning the trip since last Friday.','have been planning the trip since last Friday')),

    jsonb_build_object('number',52,'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n<조건>\n1. <보기>의 단어를 모두 사용할 것\n2. 필요시 형태 변형 가능, 추가 단어 없음\n\n<보기> the boy / watch / have / be / TV / this morning / since\n\n그 소년은 오늘 아침부터 TV를 보고 있다.','options',jsonb_build_array(),'answer','The boy has been watching TV since this morning.','acceptedAnswers',jsonb_build_array('The boy has been watching TV since this morning.','The boy has been watching TV since this morning')),

    jsonb_build_object('number',53,'question',E'다음을 주어진 조건에 맞게 영작하시오.\n\n<조건>\n1. 주어진 단어를 각각 모두 사용할 것\n2. 주어진 단어 외에 새로운 단어를 추가할 수 없음\n3. 필요시 단어의 형태를 바꿀 것\n\n<보기> have / be / math / it / she / learn / teach / since 2012 / how long\n\n(A) 그녀는 얼마나 오랫동안 수학을 배우고 있나요?\n(B) 나는 2012년부터 수학을 가르쳐 오고 있다.\n\n(A) →\n(B) →','options',jsonb_build_array(),'answer','(A) How long has she been learning math? / (B) I have been teaching math since 2012.','acceptedAnswers',jsonb_build_array('(A) How long has she been learning math? / (B) I have been teaching math since 2012.','How long has she been learning math? / I have been teaching math since 2012.'))
  )

  -- ═══════════════════════════════════════
  -- Part 9 (Q54-Q60): 대화 완성
  -- ═══════════════════════════════════════
  ||
  jsonb_build_array(
    jsonb_build_object('number',54,'question',E'다음 대화의 빈칸에 알맞은 말을 현재완료진행형을 이용하여 완성하시오.\n\nA: How long has Mr. Kim been living in Suwon?\nB: He _______ in this city _______ five years.\n조건: 현재완료진행형으로 쓸 것','options',jsonb_build_array(),'answer','has been living / for','acceptedAnswers',jsonb_build_array('has been living / for','has been living, for','has been living/for')),

    jsonb_build_object('number',55,'question',E'다음 대화의 빈칸에 알맞은 말을 현재완료진행형을 이용하여 완성하시오.\n\nA: What are Sam and Billy doing now?\nB: They are playing basketball.\nA: How long have they been playing it?\nB: Well, they _______.\n조건: 현재완료진행 시제, 3시간 동안','options',jsonb_build_array(),'answer','have been playing basketball for three hours.','acceptedAnswers',jsonb_build_array('have been playing basketball for three hours.','have been playing basketball for three hours','have been playing basketball for 3 hours.','have been playing basketball for 3 hours')),

    jsonb_build_object('number',56,'question',E'다음 대화의 빈칸에 알맞은 말을 현재완료진행형을 이용하여 완성하시오.\n\nA: Oh, no! Today is picnic day. But the weather is not good!\nB: Yes, it _______ since this morning! We should cancel it.\n조건: rain을 이용할 것, 현재완료진행형을 이용할 것','options',jsonb_build_array(),'answer','has been raining','acceptedAnswers',jsonb_build_array('has been raining')),

    jsonb_build_object('number',57,'question',E'다음 대화의 빈칸에 알맞은 말을 현재완료진행형을 이용하여 완성하시오.\n\nA: The weather is terrible, isn''t it?\nB: Yes, it _______ all day long. (rain)','options',jsonb_build_array(),'answer','has been raining','acceptedAnswers',jsonb_build_array('has been raining')),

    jsonb_build_object('number',58,'question',E'다음 대화의 빈칸에 알맞은 말을 현재완료진행형을 이용하여 완성하시오.\n\nA: Tom speaks French very well. Don''t you think so?\nB: Yes, he _______ French for seven years. (learn)','options',jsonb_build_array(),'answer','has been learning','acceptedAnswers',jsonb_build_array('has been learning')),

    jsonb_build_object('number',59,'question',E'다음 대화의 빈칸에 알맞은 말을 현재완료진행형을 이용하여 완성하시오.\n\nA: My brother started to learn to play the guitar last year.\nB: Is he still learning?\nA: Yes, he is. He _______ last year.\n조건: 8단어, 현재완료진행 시제를 사용할 것','options',jsonb_build_array(),'answer','has been learning to play the guitar since','acceptedAnswers',jsonb_build_array('has been learning to play the guitar since','has been learning to play the guitar since last year','has been learning to play the guitar since last year.')),

    jsonb_build_object('number',60,'question',E'다음 대화의 빈칸에 알맞은 말을 현재완료진행형을 이용하여 완성하시오.\n\nA: I have so much Chinese homework. Do you know anyone who can help me?\nB: Oh, Mina can speak Chinese pretty well.\nA: Really? (A) _______?\nB: I guess for more than 5 years.\nB: Okay. I started to teach math in 2012, and I''m still doing it.\nA: Pardon me?\nB: I mean that I (B) _______.\n\n(A): How long + 현재완료진행\n(B): math, since 2012 포함','options',jsonb_build_array(),'answer','(A) How long has she been learning Chinese / (B) have been teaching math since 2012','acceptedAnswers',jsonb_build_array('(A) How long has she been learning Chinese / (B) have been teaching math since 2012','How long has she been learning Chinese / have been teaching math since 2012','(A) How long has she been learning Chinese? / (B) have been teaching math since 2012.','(A) How long has Mina been learning Chinese / (B) have been teaching math since 2012'))
  );

  -- answer_key
  a := jsonb_build_array(
    'have been sitting',
    'have been coaching',
    'have not been attending',
    'has been traveling',
    'has been repairing',
    'living',
    'have finished',
    'arrived',
    'are sitting / have been sitting',
    'has been waiting',
    'She has been watching TV since 6 o''clock.',
    'He has been cooking since this morning.',
    'It has been snowing since last night.',
    'They have been playing games for two hours.',
    'It has been raining since yesterday.',
    'Mr. Kim has been working at this company for ten years.',
    'I have been wearing glasses since I was nine.',
    'has been watching TV',
    'has been playing / for',
    'James has been teaching English at Hana Middle School for twenty years.',
    'have been reading / for / hours',
    'has not been working for three hours.',
    'has been building a community center for two months.',
    'has been teaching Korean in Canada since 2002.',
    'has been / has lived',
    'has been interviewing',
    'has been composing / has released',
    'has been trying / for',
    'has been writing novels since she was 30 years old.',
    'have been doing gardening for an hour.',
    'has owned / since',
    'have been playing / three hours',
    'We have known each other since I was ten.',
    'has been playing / has been taking / has been teaching',
    'have been doing my English homework for three hours.',
    'She has been writing a novel for five years.',
    'I have been living in Gwangju for 10 years.',
    'She has been reading a book since this morning.',
    'She and her dancers have been practicing for nine hours.',
    'They have been waiting since this morning.',
    'I have been collecting coins from other countries for five years.',
    'has been using the computer for about an',
    'Mr. Kim has been teaching math since 2001.',
    'has been playing soccer for six',
    'It has been raining all day long.',
    'It has been raining all day.',
    '(1) I have been living in Gwangju for 10 years. / (2) She has been reading a book since this morning.',
    'has not been working for three hours.',
    'He has been doing his homework for three hours.',
    'James has been teaching English at Hana Middle School for twenty years.',
    'have been planning the trip since last Friday.',
    'The boy has been watching TV since this morning.',
    '(A) How long has she been learning math? / (B) I have been teaching math since 2012.',
    'has been living / for',
    'have been playing basketball for three hours.',
    'has been raining',
    'has been raining',
    'has been learning',
    'has been learning to play the guitar since',
    '(A) How long has she been learning Chinese / (B) have been teaching math since 2012'
  );

  INSERT INTO naesin_templates (
    title, template_topic, questions, answer_key, category, mode
  ) VALUES (
    '현재완료진행형 Step3', '현재완료진행형', q, a, 'problem', 'interactive'
  );

  RAISE NOTICE '현재완료진행형 Step3 (60문제) 시드 완료';
END $$;
