DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = '5형식 make Step3';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- Part 1: 보기 선택 빈칸 채우기 (Q1~Q8)
    -- ═══════════════════════════════════════════

    -- Q1 (보기 형용사: keep + O + OC)
    jsonb_build_object('number',1,'question',E'다음 <보기>에서 알맞은 것을 골라 빈칸을 채우시오.\n\n<보기> calm   nervous   sleepy   proud\n\nSoft music will keep your mind ___.','answer','calm'),

    -- Q2 (보기 형용사: make + O + OC)
    jsonb_build_object('number',2,'question',E'다음 <보기>에서 알맞은 것을 골라 빈칸을 채우시오.\n\n<보기> calm   nervous   sleepy   proud\n\nReading in the dark will make you ___.','answer','sleepy'),

    -- Q3 (보기 형용사: make + O + OC)
    jsonb_build_object('number',3,'question',E'다음 <보기>에서 알맞은 것을 골라 빈칸을 채우시오.\n\n<보기> calm   nervous   sleepy   proud\n\nWinning the contest will make your parents ___.','answer','proud'),

    -- Q4 (보기 형용사: make + O + OC)
    jsonb_build_object('number',4,'question',E'다음 <보기>에서 알맞은 것을 골라 빈칸을 채우시오.\n\n<보기> calm   nervous   sleepy   proud\n\nSpeaking in front of many people may make you ___.','answer','nervous'),

    -- Q5 (보기 동사: name + O + OC(명사))
    jsonb_build_object('number',5,'question',E'다음 우리말과 같도록 <보기>에서 알맞은 동사를 골라 문장을 완성하시오. (단, 한 번씩만 사용할 것)\n\n<보기> name   leave   consider   keep\n\n우리 아버지는 항상 나를 챔피언이라고 부른다.\n→ My father always ___ me a champion.','answer','names'),

    -- Q6 (보기 동사: leave + O + OC(형용사), 과거)
    jsonb_build_object('number',6,'question',E'다음 우리말과 같도록 <보기>에서 알맞은 동사를 골라 문장을 완성하시오. (단, 한 번씩만 사용할 것)\n\n<보기> name   leave   consider   keep\n\n그녀는 어젯밤 문을 열어 둔 채로 놔두었다.\n→ She ___ the door open last night.','answer','left'),

    -- Q7 (보기 동사: consider + O + OC(형용사))
    jsonb_build_object('number',7,'question',E'다음 우리말과 같도록 <보기>에서 알맞은 동사를 골라 문장을 완성하시오. (단, 한 번씩만 사용할 것)\n\n<보기> name   leave   consider   keep\n\n나는 그 문제가 어렵다고 생각했다.\n→ I ___ the problem difficult.','answer','considered'),

    -- Q8 (보기 동사: keep + O + OC(형용사))
    jsonb_build_object('number',8,'question',E'다음 우리말과 같도록 <보기>에서 알맞은 동사를 골라 문장을 완성하시오. (단, 한 번씩만 사용할 것)\n\n<보기> name   leave   consider   keep\n\n이 코트가 너를 따뜻하게 유지해 줄 것이다.\n→ This coat will ___ you warm.','answer','keep'),

    -- ═══════════════════════════════════════════
    -- Part 2: 단어 조합/배열 영작 (Q9~Q15)
    -- ═══════════════════════════════════════════

    -- Q9 (단어표 영작 1)
    jsonb_build_object('number',9,'question',E'다음 단어들을 이용하여 우리말로 제시한 문장을 영어로 쓰시오. (단, 한 번도 쓰이지 않거나 중복으로 쓰이는 단어가 있을 수 있음)\n\n| exercise | to | him |\n| strong | rain | lonely |\n| cheerful | music | walking |\n| makes | make | us |\n\n운동은 그를 강하게 만든다.','answer','Exercise makes him strong.'),

    -- Q10 (단어표 영작 2)
    jsonb_build_object('number',10,'question',E'위 단어표를 이용하여 우리말로 제시한 문장을 영어로 쓰시오.\n\n음악은 우리를 즐겁게 만든다.','answer','Music makes us cheerful.'),

    -- Q11 (단어표 영작 3)
    jsonb_build_object('number',11,'question',E'위 단어표를 이용하여 우리말로 제시한 문장을 영어로 쓰시오.\n\n비는 그를 외롭게 만든다.','answer','Rain makes him lonely.'),

    -- Q12 ((A)(B) 조합 영작 1)
    jsonb_build_object('number',12,'question',E'다음 (A)와 (B)에서 관련이 있는 단어를 각각 하나씩 골라 make를 이용하여 <예시>와 같은 문장을 완성하시오.\n\n<예시> Stretching makes your muscles firm.\n\n(A): your skin / the room / our teeth / your muscles\n(B): bright / smooth / firm / healthy\n\nSunlight ___.','answer','Sunlight makes the room bright.'),

    -- Q13 ((A)(B) 조합 영작 2)
    jsonb_build_object('number',13,'question',E'(A): your skin / the room / our teeth / your muscles\n(B): bright / smooth / firm / healthy\n\nLotion ___.','answer','Lotion makes your skin smooth.'),

    -- Q14 ((A)(B) 조합 영작 3)
    jsonb_build_object('number',14,'question',E'(A): your skin / the room / our teeth / your muscles\n(B): bright / smooth / firm / healthy\n\nBrushing ___.','answer','Brushing makes our teeth healthy.'),

    -- Q15 (배열)
    jsonb_build_object('number',15,'question',E'다음 주어진 우리말과 같은 뜻이 되도록 괄호 안의 단어를 배열하여 한 문장으로 쓰시오.\n\n따뜻한 차는 나를 편안하게 만든다.\n(comfortable / warm tea / me / makes)','answer','Warm tea makes me comfortable.'),

    -- ═══════════════════════════════════════════
    -- Part 3: 우리말→영작 (Q16~Q23)
    -- ═══════════════════════════════════════════

    -- Q16 (빈칸 완성: make + O + OC 과거)
    jsonb_build_object('number',16,'question',E'다음 우리말을 영어로 옮길 때 빈칸을 완성하시오.\n\n그 소식은 모든 사람들을 슬프게 만들었다.\n→ The news ___.','answer','made everyone sad'),

    -- Q17 (빈칸 완성: keep + O + OC)
    jsonb_build_object('number',17,'question',E'다음 우리말을 영어로 옮길 때 빈칸을 완성하시오.\n\n그녀는 음식을 신선하게 보관하려고 노력했다.\n→ She tried to ___.','answer','keep the food fresh'),

    -- Q18 (빈칸 완성: keep + O + OC)
    jsonb_build_object('number',18,'question',E'다음 우리말을 영어로 옮길 때 빈칸을 완성하시오.\n\n너는 영원히 그 계획을 비공개로 유지할 수 없어.\n→ You ___.','answer',E'can''t keep the plan private forever'),

    -- Q19 (빈칸 완성: 동명사 주어 + make)
    jsonb_build_object('number',19,'question',E'다음 우리말을 영어로 옮길 때 빈칸을 완성하시오.\n\n산책하는 것은 나를 편안하게 만든다.\n→ Taking a walk ___.','answer','makes me relaxed'),

    -- Q20 (보기 단어 변형: keep 현재진행형)
    jsonb_build_object('number',20,'question',E'다음 <보기>의 단어를 알맞게 변형하여 우리말에 맞는 영어 문장을 완성하시오. (단, 모든 단어를 변형하는 것은 아님)\n\n<보기> keep, make, child, safe, us, proud\n\n그 어머니는 아이들을 안전하게 지키고 있다.','answer','The mother is keeping the children safe.'),

    -- Q21 (보기 단어 변형: make + O + OC)
    jsonb_build_object('number',21,'question',E'<보기> keep, make, child, safe, us, proud\n\n그녀의 성공은 우리를 자랑스럽게 만든다.','answer','Her success makes us proud.'),

    -- Q22 (활동+감정 영작 1)
    jsonb_build_object('number',22,'question',E'다음 활동을 할 때 기분이 어떤지 <조건>에 맞게 쓰시오.\n\n| 음악 발표회 | proud / nervous |\n| 과학 실험 | curious / confused |\n\n<조건>\n• 각 활동과 제시된 단어를 선택 사용할 것\n• make를 활용하여 완전한 문장으로 쓸 것\n\n(1) 음악 발표회','answer','The music concert makes me proud.'),

    -- Q23 (활동+감정 영작 2)
    jsonb_build_object('number',23,'question',E'| 음악 발표회 | proud / nervous |\n| 과학 실험 | curious / confused |\n\n<조건>\n• 각 활동과 제시된 단어를 선택 사용할 것\n• make를 활용하여 완전한 문장으로 쓸 것\n\n(2) 과학 실험','answer','Science experiments make me curious.'),

    -- ═══════════════════════════════════════════
    -- Part 4: 문장 변환 + 분류 (Q24~Q28)
    -- ═══════════════════════════════════════════

    -- Q24 (문장 변환: 현재)
    jsonb_build_object('number',24,'question',E'다음 주어진 문장과 의미가 통하도록 make를 사용하여 빈칸을 완성하시오.\n\nI feel calm when I listen to classical music.\n→ Classical music ___.','answer','makes me calm'),

    -- Q25 (문장 변환: 과거)
    jsonb_build_object('number',25,'question',E'다음 주어진 문장과 의미가 통하도록 make를 사용하여 빈칸을 완성하시오.\n\nI was confused because of the instructions.\n→ The instructions ___.','answer','made me confused'),

    -- Q26 (문장 변환: will/미래)
    jsonb_build_object('number',26,'question',E'다음 주어진 문장과 의미가 통하도록 make를 사용하여 빈칸을 완성하시오.\n\nIf you skip breakfast, you will be hungry.\n→ Skipping breakfast ___.','answer','will make you hungry'),

    -- Q27 (문장 변환: 과거 감정)
    jsonb_build_object('number',27,'question',E'다음 주어진 문장과 의미가 통하도록 make를 사용하여 빈칸을 완성하시오.\n\nI was disappointed because of my friend''s broken promise.\n→ My friend''s broken promise ___.','answer','made me disappointed'),

    -- Q28 (make 쓰임 분류)
    jsonb_build_object('number',28,'question',E'다음 문장의 밑줄 친 부분의 쓰임이 같은 것끼리 두 가지로 분류하시오.\n\nⓐ The coach tried to make his team confident.\nⓑ My grandmother made us warm soup last winter.\nⓒ Loud noises always make the baby uncomfortable.\nⓓ She promised to make me a birthday cake.\nⓔ Regular exercise will make your body strong.\nⓕ He used to make his friends handmade cards.','answer',E'5형식: ⓐ, ⓒ, ⓔ / 수여동사: ⓑ, ⓓ, ⓕ'),

    -- ═══════════════════════════════════════════
    -- Part 5: 조건부/응용 영작 (Q29~Q31)
    -- ═══════════════════════════════════════════

    -- Q29 (조건부 영작: 대화문)
    jsonb_build_object('number',29,'question',E'다음 대화의 밑줄 친 우리말을 <조건>에 맞게 영작하시오.\n\nA: Why are you crying?\nB: My best friend forgot my birthday. 그것이 나를 정말 속상하게 만들었어.\n\n<조건>\n• make, disappointed를 사용할 것\n• 알맞은 시제로 변형할 것','answer','It made me disappointed.'),

    -- Q30 ((A)(B) 단어 활용 영작 1: tire→tired)
    jsonb_build_object('number',30,'question',E'다음 (A), (B)에 주어진 단어를 이용하여 다음 문장을 영어로 쓰시오. (단, 필요시 형태를 바꿀 것)\n\n(A) horror movies, long lectures, sunny weather, surprise parties, final exams\n(B) frighten, tire, relax, excite, stress\n\n긴 강의는 나를 피곤하게 만든다.','answer','Long lectures make me tired.'),

    -- Q31 ((A)(B) 단어 활용 영작 2: excite→excited)
    jsonb_build_object('number',31,'question',E'(A) horror movies, long lectures, sunny weather, surprise parties, final exams\n(B) frighten, tire, relax, excite, stress\n\n깜짝 파티는 나를 신나게 만든다.','answer','Surprise parties make me excited.')
  );

  a := jsonb_build_array(
    'calm','sleepy','proud','nervous',
    'names','left','considered','keep',
    'Exercise makes him strong.','Music makes us cheerful.','Rain makes him lonely.',
    'Sunlight makes the room bright.','Lotion makes your skin smooth.','Brushing makes our teeth healthy.',
    'Warm tea makes me comfortable.',
    'made everyone sad','keep the food fresh',E'can''t keep the plan private forever','makes me relaxed',
    'The mother is keeping the children safe.','Her success makes us proud.',
    'The music concert makes me proud.','Science experiments make me curious.',
    'makes me calm','made me confused','will make you hungry','made me disappointed',
    E'5형식: ⓐ, ⓒ, ⓔ / 수여동사: ⓑ, ⓓ, ⓕ',
    'It made me disappointed.',
    'Long lectures make me tired.','Surprise parties make me excited.'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('5형식 make Step3', '5형식 make', q, a, 'problem', 'interactive');

  RAISE NOTICE '5형식 make Step3 템플릿 생성 완료 (31문제)';
END;
$$;
