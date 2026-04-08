DO $$
DECLARE
  q jsonb;
  q2 jsonb;
  a jsonb;
  a2 jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = '5형식 make Step1';

  -- Part 1~3 (Q1~Q68, 68문항)
  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- Part 1: 목적격 보어를 찾고 명사/형용사 구분 (Q1~Q16)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1,
      'question',E'[목적격 보어를 찾고 명사인지 형용사인지 구분하시오]\nMy answer made my mother upset.',
      'answer','upset (형용사)',
      'acceptedAnswers',jsonb_build_array('upset (형용사)','upset(형용사)','upset / 형용사','upset, 형용사')),

    jsonb_build_object('number',2,
      'question',E'[목적격 보어를 찾고 명사인지 형용사인지 구분하시오]\nKeep your desk neat.',
      'answer','neat (형용사)',
      'acceptedAnswers',jsonb_build_array('neat (형용사)','neat(형용사)','neat / 형용사','neat, 형용사')),

    jsonb_build_object('number',3,
      'question',E'[목적격 보어를 찾고 명사인지 형용사인지 구분하시오]\nThey made their son a captain.',
      'answer','a captain (명사)',
      'acceptedAnswers',jsonb_build_array('a captain (명사)','a captain(명사)','a captain / 명사','a captain, 명사')),

    jsonb_build_object('number',4,
      'question',E'[목적격 보어를 찾고 명사인지 형용사인지 구분하시오]\nEveryone always found him charming.',
      'answer','charming (형용사)',
      'acceptedAnswers',jsonb_build_array('charming (형용사)','charming(형용사)','charming / 형용사','charming, 형용사')),

    jsonb_build_object('number',5,
      'question',E'[목적격 보어를 찾고 명사인지 형용사인지 구분하시오]\nThe director kept the staff always occupied.',
      'answer','occupied (형용사)',
      'acceptedAnswers',jsonb_build_array('occupied (형용사)','occupied(형용사)','occupied / 형용사','occupied, 형용사')),

    jsonb_build_object('number',6,
      'question',E'[목적격 보어를 찾고 명사인지 형용사인지 구분하시오]\nThe queen named her eldest daughter her heir.',
      'answer','her heir (명사)',
      'acceptedAnswers',jsonb_build_array('her heir (명사)','her heir(명사)','her heir / 명사','her heir, 명사')),

    jsonb_build_object('number',7,
      'question',E'[목적격 보어를 찾고 명사인지 형용사인지 구분하시오]\nHe named his black kitten Shadow.',
      'answer','Shadow (명사)',
      'acceptedAnswers',jsonb_build_array('Shadow (명사)','Shadow(명사)','Shadow / 명사','Shadow, 명사')),

    jsonb_build_object('number',8,
      'question',E'[목적격 보어를 찾고 명사인지 형용사인지 구분하시오]\nThe students elected him chairman for the semester.',
      'answer','chairman (명사)',
      'acceptedAnswers',jsonb_build_array('chairman (명사)','chairman(명사)','chairman / 명사','chairman, 명사')),

    jsonb_build_object('number',9,
      'question',E'[목적격 보어를 찾고 명사인지 형용사인지 구분하시오]\nShe painted the walls of her bedroom pink.',
      'answer','pink (형용사)',
      'acceptedAnswers',jsonb_build_array('pink (형용사)','pink(형용사)','pink / 형용사','pink, 형용사')),

    jsonb_build_object('number',10,
      'question',E'[목적격 보어를 찾고 명사인지 형용사인지 구분하시오]\nThe coach made her a great athlete.',
      'answer','a great athlete (명사)',
      'acceptedAnswers',jsonb_build_array('a great athlete (명사)','a great athlete(명사)','a great athlete / 명사','a great athlete, 명사')),

    jsonb_build_object('number',11,
      'question',E'[목적격 보어를 찾고 명사인지 형용사인지 구분하시오]\nThe spoiled milk made the entire family ill.',
      'answer','ill (형용사)',
      'acceptedAnswers',jsonb_build_array('ill (형용사)','ill(형용사)','ill / 형용사','ill, 형용사')),

    jsonb_build_object('number',12,
      'question',E'[목적격 보어를 찾고 명사인지 형용사인지 구분하시오]\nCritics found the movie about history dull.',
      'answer','dull (형용사)',
      'acceptedAnswers',jsonb_build_array('dull (형용사)','dull(형용사)','dull / 형용사','dull, 형용사')),

    jsonb_build_object('number',13,
      'question',E'[목적격 보어를 찾고 명사인지 형용사인지 구분하시오]\nI promise I will keep your plan a secret.',
      'answer','a secret (명사)',
      'acceptedAnswers',jsonb_build_array('a secret (명사)','a secret(명사)','a secret / 명사','a secret, 명사')),

    jsonb_build_object('number',14,
      'question',E'[목적격 보어를 찾고 명사인지 형용사인지 구분하시오]\nShe tried to keep the dogs calm during the storm.',
      'answer','calm (형용사)',
      'acceptedAnswers',jsonb_build_array('calm (형용사)','calm(형용사)','calm / 형용사','calm, 형용사')),

    jsonb_build_object('number',15,
      'question',E'[목적격 보어를 찾고 명사인지 형용사인지 구분하시오]\nBoard games keep the children entertained.',
      'answer','entertained (형용사)',
      'acceptedAnswers',jsonb_build_array('entertained (형용사)','entertained(형용사)','entertained / 형용사','entertained, 형용사')),

    jsonb_build_object('number',16,
      'question',E'[목적격 보어를 찾고 명사인지 형용사인지 구분하시오]\nI got home and found her awake in the kitchen.',
      'answer','awake (형용사)',
      'acceptedAnswers',jsonb_build_array('awake (형용사)','awake(형용사)','awake / 형용사','awake, 형용사')),

    -- ═══════════════════════════════════════════
    -- Part 2: 목적어와 목적격보어 찾기 (Q17~Q33)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',17,
      'question',E'[목적어와 목적격보어를 찾으시오]\nKeep your posture upright.',
      'answer','your posture / upright',
      'acceptedAnswers',jsonb_build_array('your posture / upright','your posture, upright','your posture upright')),

    jsonb_build_object('number',18,
      'question',E'[목적어와 목적격보어를 찾으시오]\nRainy days make me a bit gloomy.',
      'answer','me / a bit gloomy',
      'acceptedAnswers',jsonb_build_array('me / a bit gloomy','me, a bit gloomy','me a bit gloomy')),

    jsonb_build_object('number',19,
      'question',E'[목적어와 목적격보어를 찾으시오]\nThe mother bird keeps her chicks warm.',
      'answer','her chicks / warm',
      'acceptedAnswers',jsonb_build_array('her chicks / warm','her chicks, warm','her chicks warm')),

    jsonb_build_object('number',20,
      'question',E'[목적어와 목적격보어를 찾으시오]\nLeave me alone.',
      'answer','me / alone',
      'acceptedAnswers',jsonb_build_array('me / alone','me, alone','me alone')),

    jsonb_build_object('number',21,
      'question',E'[목적어와 목적격보어를 찾으시오]\nShe named her hamster Fluffy.',
      'answer','her hamster / Fluffy',
      'acceptedAnswers',jsonb_build_array('her hamster / Fluffy','her hamster, Fluffy','her hamster Fluffy')),

    jsonb_build_object('number',22,
      'question',E'[목적어와 목적격보어를 찾으시오]\nThat performance made her famous.',
      'answer','her / famous',
      'acceptedAnswers',jsonb_build_array('her / famous','her, famous','her famous')),

    jsonb_build_object('number',23,
      'question',E'[목적어와 목적격보어를 찾으시오]\nI found the mattress comfortable.',
      'answer','the mattress / comfortable',
      'acceptedAnswers',jsonb_build_array('the mattress / comfortable','the mattress, comfortable','the mattress comfortable')),

    jsonb_build_object('number',24,
      'question',E'[목적어와 목적격보어를 찾으시오]\nHe calls his sister "Princess."',
      'answer','his sister / "Princess"',
      'acceptedAnswers',jsonb_build_array('his sister / "Princess"','his sister, "Princess"','his sister "Princess"','his sister / Princess','his sister, Princess','his sister Princess')),

    jsonb_build_object('number',25,
      'question',E'[목적어와 목적격보어를 찾으시오]\nDid you call that woman your teacher?',
      'answer','that woman / your teacher',
      'acceptedAnswers',jsonb_build_array('that woman / your teacher','that woman, your teacher','that woman your teacher')),

    jsonb_build_object('number',26,
      'question',E'[목적어와 목적격보어를 찾으시오]\nShe left the window open.',
      'answer','the window / open',
      'acceptedAnswers',jsonb_build_array('the window / open','the window, open','the window open')),

    jsonb_build_object('number',27,
      'question',E'[목적어와 목적격보어를 찾으시오]\nExercising daily may make your body strong.',
      'answer','your body / strong',
      'acceptedAnswers',jsonb_build_array('your body / strong','your body, strong','your body strong')),

    jsonb_build_object('number',28,
      'question',E'[목적어와 목적격보어를 찾으시오]\nThe award made her proud of herself.',
      'answer','her / proud of herself',
      'acceptedAnswers',jsonb_build_array('her / proud of herself','her, proud of herself','her proud of herself')),

    jsonb_build_object('number',29,
      'question',E'[목적어와 목적격보어를 찾으시오]\nPatience and effort made him wise and strong.',
      'answer','him / wise and strong',
      'acceptedAnswers',jsonb_build_array('him / wise and strong','him, wise and strong','him wise and strong')),

    jsonb_build_object('number',30,
      'question',E'[목적어와 목적격보어를 찾으시오]\nYour advice will make her much braver.',
      'answer','her / much braver',
      'acceptedAnswers',jsonb_build_array('her / much braver','her, much braver','her much braver')),

    jsonb_build_object('number',31,
      'question',E'[목적어와 목적격보어를 찾으시오]\nWe are looking for ways to keep our bodies healthy.',
      'answer','our bodies / healthy',
      'acceptedAnswers',jsonb_build_array('our bodies / healthy','our bodies, healthy','our bodies healthy')),

    jsonb_build_object('number',32,
      'question',E'[목적어와 목적격보어를 찾으시오]\nHis plan made the task simple to follow.',
      'answer','the task / simple to follow',
      'acceptedAnswers',jsonb_build_array('the task / simple to follow','the task, simple to follow','the task simple to follow')),

    jsonb_build_object('number',33,
      'question',E'[목적어와 목적격보어를 찾으시오]\nThe doctors found the patients stable and alert.',
      'answer','the patients / stable and alert',
      'acceptedAnswers',jsonb_build_array('the patients / stable and alert','the patients, stable and alert','the patients stable and alert')),

    -- ═══════════════════════════════════════════
    -- Part 3: 알맞은 것을 고르시오 (Q34~Q68)
    -- ═══════════════════════════════════════════

    -- 형용사 vs 부사
    jsonb_build_object('number',34,
      'question',E'[알맞은 것을 고르시오]\nHis words made his mother (furious / furiously).',
      'answer','furious',
      'acceptedAnswers',jsonb_build_array('furious')),

    jsonb_build_object('number',35,
      'question',E'[알맞은 것을 고르시오]\nThis heater will keep the room (warm / warmly).',
      'answer','warm',
      'acceptedAnswers',jsonb_build_array('warm')),

    jsonb_build_object('number',36,
      'question',E'[알맞은 것을 고르시오]\nShe found the suitcase (heavy / heavily).',
      'answer','heavy',
      'acceptedAnswers',jsonb_build_array('heavy')),

    jsonb_build_object('number',37,
      'question',E'[알맞은 것을 고르시오]\nHe always makes her (cheerful / cheerfully).',
      'answer','cheerful',
      'acceptedAnswers',jsonb_build_array('cheerful')),

    jsonb_build_object('number',38,
      'question',E'[알맞은 것을 고르시오]\nPlease leave the gate (open / openly).',
      'answer','open',
      'acceptedAnswers',jsonb_build_array('open')),

    jsonb_build_object('number',39,
      'question',E'[알맞은 것을 고르시오]\nThe storm made the ground (wet / wetly).',
      'answer','wet',
      'acceptedAnswers',jsonb_build_array('wet')),

    jsonb_build_object('number',40,
      'question',E'[알맞은 것을 고르시오]\nThe melody makes me (peaceful / peacefully).',
      'answer','peaceful',
      'acceptedAnswers',jsonb_build_array('peaceful')),

    jsonb_build_object('number',41,
      'question',E'[알맞은 것을 고르시오]\nThe gardener keeps the park (clean / cleanly).',
      'answer','clean',
      'acceptedAnswers',jsonb_build_array('clean')),

    jsonb_build_object('number',42,
      'question',E'[알맞은 것을 고르시오]\nCan you keep the baby (calm / calmly)?',
      'answer','calm',
      'acceptedAnswers',jsonb_build_array('calm')),

    jsonb_build_object('number',43,
      'question',E'[알맞은 것을 고르시오]\nThe long wait drove us (crazy / crazily).',
      'answer','crazy',
      'acceptedAnswers',jsonb_build_array('crazy')),

    jsonb_build_object('number',44,
      'question',E'[알맞은 것을 고르시오]\nShe left her bag (open / openly).',
      'answer','open',
      'acceptedAnswers',jsonb_build_array('open')),

    jsonb_build_object('number',45,
      'question',E'[알맞은 것을 고르시오]\nHer first novel made her (successful / successfully).',
      'answer','successful',
      'acceptedAnswers',jsonb_build_array('successful')),

    jsonb_build_object('number',46,
      'question',E'[알맞은 것을 고르시오]\nKeeping your room (tidy / tidily) is a good habit.',
      'answer','tidy',
      'acceptedAnswers',jsonb_build_array('tidy')),

    jsonb_build_object('number',47,
      'question',E'[알맞은 것을 고르시오]\nWe found the hotel (luxurious / luxuriously).',
      'answer','luxurious',
      'acceptedAnswers',jsonb_build_array('luxurious')),

    -- 주격 vs 목적격
    jsonb_build_object('number',48,
      'question',E'[알맞은 것을 고르시오]\nThe fireplace keeps (we / us) cozy.',
      'answer','us',
      'acceptedAnswers',jsonb_build_array('us')),

    jsonb_build_object('number',49,
      'question',E'[알맞은 것을 고르시오]\nThe news made (I / me) worried.',
      'answer','me',
      'acceptedAnswers',jsonb_build_array('me')),

    jsonb_build_object('number',50,
      'question',E'[알맞은 것을 고르시오]\nLeave (her / she) alone.',
      'answer','her',
      'acceptedAnswers',jsonb_build_array('her')),

    jsonb_build_object('number',51,
      'question',E'[알맞은 것을 고르시오]\nThat movie made (she / her) popular.',
      'answer','her',
      'acceptedAnswers',jsonb_build_array('her')),

    jsonb_build_object('number',52,
      'question',E'[알맞은 것을 고르시오]\nExercise can keep (you / your) fit all year.',
      'answer','you',
      'acceptedAnswers',jsonb_build_array('you')),

    jsonb_build_object('number',53,
      'question',E'[알맞은 것을 고르시오]\nOur help will make (they / them) much stronger.',
      'answer','them',
      'acceptedAnswers',jsonb_build_array('them')),

    -- 분사 선택
    jsonb_build_object('number',54,
      'question',E'[알맞은 것을 고르시오]\nIt was the noise that made me (irritating / irritated).',
      'answer','irritated',
      'acceptedAnswers',jsonb_build_array('irritated')),

    jsonb_build_object('number',55,
      'question',E'[알맞은 것을 고르시오]\nHe kept the engine (run / running).',
      'answer','running',
      'acceptedAnswers',jsonb_build_array('running')),

    jsonb_build_object('number',56,
      'question',E'[알맞은 것을 고르시오]\nThe lecture made the students (bored / boring).',
      'answer','bored',
      'acceptedAnswers',jsonb_build_array('bored')),

    -- 동사 형태 / 수일치
    jsonb_build_object('number',57,
      'question',E'[알맞은 것을 고르시오]\nReading novels (make / makes) her calm.',
      'answer','makes',
      'acceptedAnswers',jsonb_build_array('makes')),

    jsonb_build_object('number',58,
      'question',E'[알맞은 것을 고르시오]\nDon''t keep the customers (wait / waiting).',
      'answer','waiting',
      'acceptedAnswers',jsonb_build_array('waiting')),

    jsonb_build_object('number',59,
      'question',E'[알맞은 것을 고르시오]\nA good leader makes teamwork (effect / effective).',
      'answer','effective',
      'acceptedAnswers',jsonb_build_array('effective')),

    -- 기타
    jsonb_build_object('number',60,
      'question',E'[알맞은 것을 고르시오]\nYou should keep the milk (fresh / freshest).',
      'answer','fresh',
      'acceptedAnswers',jsonb_build_array('fresh')),

    jsonb_build_object('number',61,
      'question',E'[알맞은 것을 고르시오]\nSkipping meals made her (weak / weakly).',
      'answer','weak',
      'acceptedAnswers',jsonb_build_array('weak')),

    jsonb_build_object('number',62,
      'question',E'[알맞은 것을 고르시오]\nI will make (this boy my best friend / my best friend this boy).',
      'answer','this boy my best friend',
      'acceptedAnswers',jsonb_build_array('this boy my best friend')),

    jsonb_build_object('number',63,
      'question',E'[알맞은 것을 고르시오]\nWe called (him Jake / him for Jake).',
      'answer','him Jake',
      'acceptedAnswers',jsonb_build_array('him Jake')),

    jsonb_build_object('number',64,
      'question',E'[알맞은 것을 고르시오]\nGive honest feedback, and you will (produce / make) them better.',
      'answer','make',
      'acceptedAnswers',jsonb_build_array('make')),

    jsonb_build_object('number',65,
      'question',E'[알맞은 것을 고르시오]\nRegular exercise keeps your mind (peace / peaceful).',
      'answer','peaceful',
      'acceptedAnswers',jsonb_build_array('peaceful')),

    jsonb_build_object('number',66,
      'question',E'[알맞은 것을 고르시오]\nTom calls (his bird "Sky" / "Sky" his bird).',
      'answer','his bird "Sky"',
      'acceptedAnswers',jsonb_build_array('his bird "Sky"')),

    jsonb_build_object('number',67,
      'question',E'[알맞은 것을 고르시오]\nThe club chose (Anna / Anna''s) the team leader.',
      'answer','Anna',
      'acceptedAnswers',jsonb_build_array('Anna')),

    jsonb_build_object('number',68,
      'question',E'[알맞은 것을 고르시오]\nThey want to make the system (simpler / more simply) to understand.',
      'answer','simpler',
      'acceptedAnswers',jsonb_build_array('simpler'))

  );

  -- Part 4~6 (Q69~Q110, 42문항)
  q2 := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- Part 4: 문법적 오류를 찾아 고쳐 쓰시오 (Q69~Q81)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',69,
      'question',E'[문법적 오류를 찾아 고쳐 쓰시오]\nThe result made her angrily.',
      'answer','angrily → angry',
      'acceptedAnswers',jsonb_build_array('angrily → angry','angry','angrily->angry','angrily to angry','angrily→angry')),

    jsonb_build_object('number',70,
      'question',E'[문법적 오류를 찾아 고쳐 쓰시오]\nThe documentary made I curious.',
      'answer','I → me',
      'acceptedAnswers',jsonb_build_array('I → me','me','I->me','I to me','I→me')),

    jsonb_build_object('number',71,
      'question',E'[문법적 오류를 찾아 고쳐 쓰시오]\nSleeping well will keep you health.',
      'answer','health → healthy',
      'acceptedAnswers',jsonb_build_array('health → healthy','healthy','health->healthy','health to healthy','health→healthy')),

    jsonb_build_object('number',72,
      'question',E'[문법적 오류를 찾아 고쳐 쓰시오]\nShe found delicious the cake.',
      'answer','delicious the cake → the cake delicious',
      'acceptedAnswers',jsonb_build_array('delicious the cake → the cake delicious','the cake delicious','delicious the cake->the cake delicious','delicious the cake to the cake delicious','delicious the cake→the cake delicious')),

    jsonb_build_object('number',73,
      'question',E'[문법적 오류를 찾아 고쳐 쓰시오]\nScary movies make I nervous.',
      'answer','I → me',
      'acceptedAnswers',jsonb_build_array('I → me','me','I->me','I to me','I→me')),

    jsonb_build_object('number',74,
      'question',E'[문법적 오류를 찾아 고쳐 쓰시오]\nThis music makes me felt relaxed.',
      'answer','felt → feel',
      'acceptedAnswers',jsonb_build_array('felt → feel','feel','felt->feel','felt to feel','felt→feel')),

    jsonb_build_object('number',75,
      'question',E'[문법적 오류를 찾아 고쳐 쓰시오]\nShe now finds swimming very difficultly.',
      'answer','difficultly → difficult',
      'acceptedAnswers',jsonb_build_array('difficultly → difficult','difficult','difficultly->difficult','difficultly to difficult','difficultly→difficult')),

    jsonb_build_object('number',76,
      'question',E'[문법적 오류를 찾아 고쳐 쓰시오]\nThe job interview made her nervously.',
      'answer','nervously → nervous',
      'acceptedAnswers',jsonb_build_array('nervously → nervous','nervous','nervously->nervous','nervously to nervous','nervously→nervous')),

    jsonb_build_object('number',77,
      'question',E'[문법적 오류를 찾아 고쳐 쓰시오]\nHer message made him is calm.',
      'answer','is calm → calm',
      'acceptedAnswers',jsonb_build_array('is calm → calm','calm','is calm->calm','is calm to calm','is calm→calm')),

    jsonb_build_object('number',78,
      'question',E'[문법적 오류를 찾아 고쳐 쓰시오]\nThis jacket makes warm me.',
      'answer','warm me → me warm',
      'acceptedAnswers',jsonb_build_array('warm me → me warm','me warm','warm me->me warm','warm me to me warm','warm me→me warm')),

    jsonb_build_object('number',79,
      'question',E'[문법적 오류를 찾아 고쳐 쓰시오]\nThe long speech made the audience boring.',
      'answer','boring → bored',
      'acceptedAnswers',jsonb_build_array('boring → bored','bored','boring->bored','boring to bored','boring→bored')),

    jsonb_build_object('number',80,
      'question',E'[문법적 오류를 찾아 고쳐 쓰시오]\nRiding roller coasters makes me scare.',
      'answer','scare → scared',
      'acceptedAnswers',jsonb_build_array('scare → scared','scared','scare->scared','scare to scared','scare→scared')),

    jsonb_build_object('number',81,
      'question',E'[문법적 오류를 찾아 고쳐 쓰시오]\nHe drank two cups of tea to keep himself awoke.',
      'answer','awoke → awake',
      'acceptedAnswers',jsonb_build_array('awoke → awake','awake','awoke->awake','awoke to awake','awoke→awake')),

    -- ═══════════════════════════════════════════
    -- Part 5: 주어진 단어들을 알맞게 나열하시오 (Q82~Q99)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',82,
      'question',E'[배열하시오] 나의 남동생은 나를 짜증나게 만들었다.\n(annoyed, made, me, my brother)',
      'answer','My brother made me annoyed.',
      'acceptedAnswers',jsonb_build_array('My brother made me annoyed.','My brother made me annoyed')),

    jsonb_build_object('number',83,
      'question',E'[배열하시오] 나의 고양이는 나를 편안하게 한다.\n(makes, my, relaxed, cat, me)',
      'answer','My cat makes me relaxed.',
      'acceptedAnswers',jsonb_build_array('My cat makes me relaxed.','My cat makes me relaxed')),

    jsonb_build_object('number',84,
      'question',E'[배열하시오] 무엇이 너의 뼈를 튼튼하게 만들 수 있는가?\n(your, can, strong, bones, make, what)',
      'answer','What can make your bones strong?',
      'acceptedAnswers',jsonb_build_array('What can make your bones strong?','What can make your bones strong')),

    jsonb_build_object('number',85,
      'question',E'[배열하시오] 만화 영화는 아이들을 즐겁게 만든다.\n(children, animated, make, movies, cheerful)',
      'answer','Animated movies make children cheerful.',
      'acceptedAnswers',jsonb_build_array('Animated movies make children cheerful.','Animated movies make children cheerful')),

    jsonb_build_object('number',86,
      'question',E'[배열하시오] 매일 산책하는 것은 당신을 활기차게 만든다.\n(you, daily, energetic, walking, makes)',
      'answer','Walking daily makes you energetic.',
      'acceptedAnswers',jsonb_build_array('Walking daily makes you energetic.','Walking daily makes you energetic')),

    jsonb_build_object('number',87,
      'question',E'[배열하시오] 이 드레스가 너를 우아하게 보이게 만든다.\n(this, dress, elegant, you, makes)',
      'answer','This dress makes you elegant.',
      'acceptedAnswers',jsonb_build_array('This dress makes you elegant.','This dress makes you elegant')),

    jsonb_build_object('number',88,
      'question',E'[배열하시오] 나는 이 커피가 쓰다는 것을 알게 됐다.\n(bitter, found, coffee, I, this)',
      'answer','I found this coffee bitter.',
      'acceptedAnswers',jsonb_build_array('I found this coffee bitter.','I found this coffee bitter')),

    jsonb_build_object('number',89,
      'question',E'[배열하시오] 극심한 스트레스는 너를 아프게 만들 수 있어.\n(stress, you, sick, make, can, severe)',
      'answer','Severe stress can make you sick.',
      'acceptedAnswers',jsonb_build_array('Severe stress can make you sick.','Severe stress can make you sick')),

    jsonb_build_object('number',90,
      'question',E'[배열하시오] 우리는 그 시험이 풀기에 어렵다는 것을 발견했다.\n(difficult, we, the, found, exam, solve, to)',
      'answer','We found the exam difficult to solve.',
      'acceptedAnswers',jsonb_build_array('We found the exam difficult to solve.','We found the exam difficult to solve')),

    jsonb_build_object('number',91,
      'question',E'[배열하시오] 따뜻한 조명은 방을 더 아늑하게 만들어 준다.\n(lighting, makes, the room, warm, more, cozy)',
      'answer','Warm lighting makes the room more cozy.',
      'acceptedAnswers',jsonb_build_array('Warm lighting makes the room more cozy.','Warm lighting makes the room more cozy')),

    jsonb_build_object('number',92,
      'question',E'[배열하시오] 발표는 나를 매우 긴장하게 만든다.\n(nervous, presentations, me, very, make)',
      'answer','Presentations make me very nervous.',
      'acceptedAnswers',jsonb_build_array('Presentations make me very nervous.','Presentations make me very nervous')),

    jsonb_build_object('number',93,
      'question',E'[배열하시오] 충분한 수면은 너를 건강하게 만든다.\n(sleeping, you, enough, makes, healthy)',
      'answer','Sleeping enough makes you healthy.',
      'acceptedAnswers',jsonb_build_array('Sleeping enough makes you healthy.','Sleeping enough makes you healthy')),

    jsonb_build_object('number',94,
      'question',E'[배열하시오] 방을 깨끗하게 하는 게 어때?\n(don''t, clean, ?, you, keep, your room, why)',
      'answer','Why don''t you keep your room clean?',
      'acceptedAnswers',jsonb_build_array('Why don''t you keep your room clean?','Why don''t you keep your room clean')),

    jsonb_build_object('number',95,
      'question',E'[배열하시오] 오래 달리는 것은 나를 지치게 만든다.\n(me, for, exhausted, a, makes, long, time, running)',
      'answer','Running for a long time makes me exhausted.',
      'acceptedAnswers',jsonb_build_array('Running for a long time makes me exhausted.','Running for a long time makes me exhausted')),

    jsonb_build_object('number',96,
      'question',E'[배열하시오] 헬멧을 쓰는 것은 여러분을 안전하게 해 줄 것이다.\n(wearing, will, you, keep, safe, helmets)',
      'answer','Wearing helmets will keep you safe.',
      'acceptedAnswers',jsonb_build_array('Wearing helmets will keep you safe.','Wearing helmets will keep you safe')),

    jsonb_build_object('number',97,
      'question',E'[배열하시오] 이 보온병은 물을 오랫동안 차갑게 유지시킨다.\n(a, this, water, cold, long, keeps, for, bottle, time)',
      'answer','This bottle keeps water cold for a long time.',
      'acceptedAnswers',jsonb_build_array('This bottle keeps water cold for a long time.','This bottle keeps water cold for a long time')),

    jsonb_build_object('number',98,
      'question',E'[배열하시오] 이웃을 도운 것은 나를 뿌듯하게 했다.\n(neighbor, me, the, proud, made, helping)',
      'answer','Helping the neighbor made me proud.',
      'acceptedAnswers',jsonb_build_array('Helping the neighbor made me proud.','Helping the neighbor made me proud')),

    jsonb_build_object('number',99,
      'question',E'[배열하시오] 이 앱의 기능들은 학습을 효과적으로 만든다.\n(the, learning, in, make, this, effective, features, app)',
      'answer','The features in this app make learning effective.',
      'acceptedAnswers',jsonb_build_array('The features in this app make learning effective.','The features in this app make learning effective')),

    -- ═══════════════════════════════════════════
    -- Part 6: 영작하시오 (Q100~Q110)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',100,
      'question',E'[영작하시오] 나무는 공기를 신선하게 만든다.\n(trees, the air)',
      'answer','Trees make the air fresh.',
      'acceptedAnswers',jsonb_build_array('Trees make the air fresh.','Trees make the air fresh')),

    jsonb_build_object('number',101,
      'question',E'[영작하시오] 그 인터뷰는 그녀를 유명하게 만들었다.\n(the interview)',
      'answer','The interview made her famous.',
      'acceptedAnswers',jsonb_build_array('The interview made her famous.','The interview made her famous')),

    jsonb_build_object('number',102,
      'question',E'[영작하시오] 그녀는 그 정원을 깔끔하게 유지할 것이다.\n(keep, the garden)',
      'answer','She will keep the garden neat.',
      'acceptedAnswers',jsonb_build_array('She will keep the garden neat.','She will keep the garden neat','She''ll keep the garden neat.','She''ll keep the garden neat')),

    jsonb_build_object('number',103,
      'question',E'[영작하시오] 그 소설은 나를 우울하게 만들었다.\n(that novel, depress)',
      'answer','That novel made me depressed.',
      'acceptedAnswers',jsonb_build_array('That novel made me depressed.','That novel made me depressed')),

    jsonb_build_object('number',104,
      'question',E'[영작하시오] 커피는 당신을 밤새 깨어있게 할 수도 있습니다.\n(coffee, can, keep, all night)',
      'answer','Coffee can keep you awake all night.',
      'acceptedAnswers',jsonb_build_array('Coffee can keep you awake all night.','Coffee can keep you awake all night')),

    jsonb_build_object('number',105,
      'question',E'[영작하시오] 생일 선물은 아이들을 기쁘게 만든다.\n(gifts, children)',
      'answer','Birthday gifts make children happy.',
      'acceptedAnswers',jsonb_build_array('Birthday gifts make children happy.','Birthday gifts make children happy')),

    jsonb_build_object('number',106,
      'question',E'[영작하시오] 추운 날씨는 어떤 사람들을 우울하게 만든다.\n(make, some people)',
      'answer','Cold weather makes some people sad.',
      'acceptedAnswers',jsonb_build_array('Cold weather makes some people sad.','Cold weather makes some people sad')),

    jsonb_build_object('number',107,
      'question',E'[영작하시오] 그 프로젝트는 우리를 지치게 했다.\n(make, tire)',
      'answer','The project made us tired.',
      'acceptedAnswers',jsonb_build_array('The project made us tired.','The project made us tired')),

    jsonb_build_object('number',108,
      'question',E'[영작하시오] 그녀와의 대화가 나를 행복하게 만들었다.\n(talk, happy)',
      'answer','Talking with her made me happy.',
      'acceptedAnswers',jsonb_build_array('Talking with her made me happy.','Talking with her made me happy')),

    jsonb_build_object('number',109,
      'question',E'[영작하시오] 아이들을 조용하게 해 주세요.\n(keep)',
      'answer','Please keep the children quiet.',
      'acceptedAnswers',jsonb_build_array('Please keep the children quiet.','Please keep the children quiet')),

    jsonb_build_object('number',110,
      'question',E'[영작하시오] 소방관들은 그 건물이 비어 있다는 것을 알게 되었다.\n(find, building, empty)',
      'answer','The firefighters found the building empty.',
      'acceptedAnswers',jsonb_build_array('The firefighters found the building empty.','The firefighters found the building empty'))
  );

  q := q || q2;

  a := jsonb_build_array(
    -- Part 1: 목적격보어 + 명사/형용사 구분 (Q1~Q16)
    'upset (형용사)','neat (형용사)','a captain (명사)','charming (형용사)',
    'occupied (형용사)','her heir (명사)','Shadow (명사)','chairman (명사)',
    'pink (형용사)','a great athlete (명사)','ill (형용사)','dull (형용사)',
    'a secret (명사)','calm (형용사)','entertained (형용사)','awake (형용사)',
    -- Part 2: 목적어 + 목적격보어 찾기 (Q17~Q33)
    'your posture / upright','me / a bit gloomy','her chicks / warm',
    'me / alone','her hamster / Fluffy','her / famous',
    'the mattress / comfortable','his sister / "Princess"',
    'that woman / your teacher','the window / open',
    'your body / strong','her / proud of herself',
    'him / wise and strong','her / much braver',
    'our bodies / healthy','the task / simple to follow',
    'the patients / stable and alert',
    -- Part 3: 2지선다 고르기 (Q34~Q68)
    'furious','warm','heavy','cheerful','open',
    'wet','peaceful','clean','calm','crazy',
    'open','successful','tidy','luxurious',
    'us','me','her','her','you','them',
    'irritated','running','bored',
    'makes','waiting','effective',
    'fresh','weak','this boy my best friend','him Jake',
    'make','peaceful','his bird "Sky"','Anna','simpler'
  );

  a2 := jsonb_build_array(
    -- Part 4: 오류 고치기 (Q69~Q81)
    'angrily → angry','I → me','health → healthy',
    'delicious the cake → the cake delicious','I → me',
    'felt → feel','difficultly → difficult','nervously → nervous',
    'is calm → calm','warm me → me warm',
    'boring → bored','scare → scared','awoke → awake',
    -- Part 5: 배열 (Q82~Q99)
    'My brother made me annoyed.',
    'My cat makes me relaxed.',
    'What can make your bones strong?',
    'Animated movies make children cheerful.',
    'Walking daily makes you energetic.',
    'This dress makes you elegant.',
    'I found this coffee bitter.',
    'Severe stress can make you sick.',
    'We found the exam difficult to solve.',
    'Warm lighting makes the room more cozy.',
    'Presentations make me very nervous.',
    'Sleeping enough makes you healthy.',
    'Why don''t you keep your room clean?',
    'Running for a long time makes me exhausted.',
    'Wearing helmets will keep you safe.',
    'This bottle keeps water cold for a long time.',
    'Helping the neighbor made me proud.',
    'The features in this app make learning effective.',
    -- Part 6: 영작 (Q100~Q110)
    'Trees make the air fresh.',
    'The interview made her famous.',
    'She will keep the garden neat.',
    'That novel made me depressed.',
    'Coffee can keep you awake all night.',
    'Birthday gifts make children happy.',
    'Cold weather makes some people sad.',
    'The project made us tired.',
    'Talking with her made me happy.',
    'Please keep the children quiet.',
    'The firefighters found the building empty.'
  );

  a := a || a2;

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('5형식 make Step1', '5형식 make', q, a, 'problem', 'interactive');

  RAISE NOTICE '5형식 make Step1 템플릿 생성 완료 (110문제, 전체 paraphrase)';
END;
$$;
