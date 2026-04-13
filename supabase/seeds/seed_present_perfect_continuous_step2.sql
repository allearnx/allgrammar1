DO $$
DECLARE
  v_questions jsonb;
  v_answer_key jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = '현재완료진행 Step2';

  v_questions := jsonb_build_array(
    jsonb_build_object('number', 1, 'question', E'다음 빈칸에 들어갈 말로 가장 적절한 것은? (정답 2개)\n\nA: How long has it been snowing?\nB: It has been snowing ___.', 'options', jsonb_build_array(E'last Monday', E'this afternoon', E'three days ago', E'for five hours', E'since this morning'), 'answer', '4,5'),
    jsonb_build_object('number', 2, 'question', E'다음 대화의 빈칸에 들어갈 말로 알맞은 것은?\n\nA: I''m exhausted. We ___ for more than two hours.\nB: Let''s take a break then.', 'options', jsonb_build_array(E'hike', E'hiked', E'are hiking', E'had hiked', E'have been hiking'), 'answer', '5'),
    jsonb_build_object('number', 3, 'question', E'다음 빈칸에 들어갈 말로 알맞지 않은 것은?\n\nA: How long have you been learning the guitar?\nB: I have been learning the guitar ___.', 'options', jsonb_build_array(E'for eight months', E'for more than 3 years', E'since I was twelve', E'since last summer', E'two years ago'), 'answer', '5'),
    jsonb_build_object('number', 4, 'question', E'다음 우리말과 일치하도록 괄호 안의 단어를 배열할 때, 4번째로 오는 것은?\n\n그녀는 3시간째 피아노를 연습하고 있어.\n(she, been, for, three, practicing, has, piano, the, hours)', 'options', jsonb_build_array(E'been', E'for', E'has', E'the', E'practicing'), 'answer', '5'),
    jsonb_build_object('number', 5, 'question', E'다음 대화의 밑줄 친 우리말을 영작할 때, 4번째로 오는 단어는?\n\nA: Minho speaks Korean very well.\nB: 맞아, 그는 10년 동안 한국어를 배워 오고 있어.\n→ Yes, ___ (learn) ten years.', 'options', jsonb_build_array(E'learning', E'been', E'Korean', E'has', E'he'), 'answer', '1'),
    jsonb_build_object('number', 6, 'question', E'다음 두 문장을 한 문장으로 표현할 때, 빈칸에 들어갈 가장 알맞은 것은?\n\n• People began to use smartphones around 2007.\n• People are still using smartphones now.\n→ People ___ smartphones for almost 20 years.', 'options', jsonb_build_array(E'are used', E'have been using', E'have been used', E'are using', E'had used'), 'answer', '2'),
    jsonb_build_object('number', 7, 'question', E'다음 두 문장을 한 문장으로 표현할 때, 빈칸에 들어갈 가장 알맞은 것은?\n\n• I began to use this backpack 5 years ago.\n• I''m still using it now.\n→ I ___ this backpack for 5 years.', 'options', jsonb_build_array(E'used', E'have been using', E'am using', E'have been used', E'was using'), 'answer', '2'),
    jsonb_build_object('number', 8, 'question', E'다음 두 문장을 한 문장으로 표현할 때, 빈칸에 들어갈 가장 알맞은 것은?\n\n• She began to work at the bakery 3 years ago.\n• She is still working there now.\n→ She ___ at the bakery for 3 years.', 'options', jsonb_build_array(E'worked', E'has been worked', E'is working', E'was working', E'has been working'), 'answer', '5'),
    jsonb_build_object('number', 9, 'question', E'다음 두 문장을 한 문장으로 만들 때 빈칸 ⓐ, ⓑ에 들어갈 말로 바르게 짝지어진 것은?\n\nJisu started playing the violin 4 years ago. She is still playing the violin.\n= Jisu ⓐ___ the violin ⓑ___ 4 years.', 'options', jsonb_build_array(E'is playing — since', E'has played — for', E'has been playing — for', E'had played — since', E'had been playing — for'), 'answer', '3'),
    jsonb_build_object('number', 10, 'question', E'다음 두 문장을 한 문장으로 알맞게 연결한 것은?\n\n• The baby began to cry an hour ago.\n• He is still crying.', 'options', jsonb_build_array(E'The baby has been crying for an hour.', E'The baby has been crying an hour ago.', E'The baby has been crying from an hour.', E'The baby have been crying for an hour.', E'The baby has been crying since an hour.'), 'answer', '1'),
    jsonb_build_object('number', 11, 'question', E'다음 두 문장을 한 문장으로 알맞게 연결한 것은?\n\n• It has been windy all day long.\n• It is still windy now.', 'options', jsonb_build_array(E'It is windy all day long.', E'It is been windy all day long.', E'It is being windy all day long.', E'It has been windy all day long.', E'It has being windy all day long.'), 'answer', '4'),
    jsonb_build_object('number', 12, 'question', E'다음 주어진 내용을 한 문장으로 요약할 때, 가장 바르게 나타낸 것은?\n\nHe lost his phone two weeks ago. He still doesn''t have a phone now.', 'options', jsonb_build_array(E'He isn''t having a phone since two weeks.', E'He isn''t having a phone for two weeks.', E'He hasn''t having a phone for two weeks.', E'He hasn''t been having a phone for two weeks.', E'He hasn''t had a phone for two weeks.'), 'answer', '5'),
    jsonb_build_object('number', 13, 'question', E'다음 우리말을 바르게 영작한 것은?\n\n우리는 지금 7년째 태권도를 배워 오고 있다.', 'options', jsonb_build_array(E'We are learning taekwondo for 7 years now.', E'We have been learning taekwondo for 7 years now.', E'We should have learned taekwondo for 7 years now.', E'We would learn taekwondo for 7 years now.', E'We had been learning taekwondo for years now.'), 'answer', '2'),
    jsonb_build_object('number', 14, 'question', E'다음 우리말과 바르게 일치하는 문장을 고르시오.\n\nSora는 10살 때부터 이 중학교에서 공부하고 있다.', 'options', jsonb_build_array(E'Sora had been studying at this middle school since she was 10.', E'Sora has been studying at this middle school until she had been 10.', E'Sora has been studied at this middle school for she was 10.', E'Sora has been studying at this middle school since she was 10.', E'Sora has been studying at this middle school until she was 10.'), 'answer', '4'),
    jsonb_build_object('number', 15, 'question', E'다음 중 어법상 옳은 문장은?\n\n① I have been believing this theory for years.\n② They have been appreciating your work a lot.\n③ She has been considering moving abroad for months.\n④ He has been acknowledging your kindness every day.\n⑤ I have been respecting your advice until now.', 'options', jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer', '3'),
    jsonb_build_object('number', 16, 'question', E'다음 중 어법상 옳은 문장은?\n\n① It has been rained for 5 days.\n② Have you ever been hit by a ball?\n③ She has been worked for the company since then.\n④ The bridge has been repairing for a month.\n⑤ Which of these two apps have you been using the most?', 'options', jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer', '5'),
    jsonb_build_object('number', 17, 'question', E'다음 중 어법상 옳은 문장은?\n\n① I have been liking jazz music since I was little.\n② They have just being finished their project.\n③ Minho doesn''t have been sleeping well lately because of stress.\n④ Jisu has been taking care of her little brother since last month.\n⑤ Where have you been travel for the past two weeks?', 'options', jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer', '4'),
    jsonb_build_object('number', 18, 'question', E'다음 중 어법상 옳은 문장은?\n\n① I have been working here since 20 years.\n② They have been building the new stadium for six months.\n③ We have been knowing each other for years.\n④ I have been studying English since 10 years old.\n⑤ I have been watching that series last night.', 'options', jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer', '2'),
    jsonb_build_object('number', 19, 'question', E'다음 중 어법상 옳은 문장은?\n\n① Sora has been going hiking for a month.\n② She was playing the cello since 11 o''clock.\n③ He has been talking about that since hours.\n④ He has been teaching here for last week.\n⑤ Mr. Kim has been working at the bakery since 10 years.', 'options', jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer', '1'),
    jsonb_build_object('number', 20, 'question', E'다음 중 어법상 옳은 문장은?\n\n① How long have you been lived in this city?\n② I have been looking for my keys since an hour.\n③ I''ve been enjoyed cooking Italian food recently.\n④ They have been celebrating this festival since 1945.\n⑤ She has been learning ballet since nine years.', 'options', jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer', '4'),
    jsonb_build_object('number', 21, 'question', E'다음 중 어법상 옳은 문장은?\n\n① I have been walked to school for two years.\n② They have been talking on the phone at hours.\n③ Sora and Jisu has been dancing since then.\n④ I have been waiting for the results for so long.\n⑤ I have been preparing for the trip since a month.', 'options', jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer', '4'),
    jsonb_build_object('number', 22, 'question', E'다음 중 어법상 옳은 문장은?\n\n① Have you waiting for her for two hours?\n② Mr. Lee have been teaching here since 2015.\n③ I''ve been doing my homework since 30 minutes.\n④ I have been not eating junk food for five weeks.\n⑤ Her mother has been working at this hospital for 10 years.', 'options', jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer', '5'),
    jsonb_build_object('number', 23, 'question', E'다음 밑줄 친 부분 중 어법상 옳은 것은? (정답 2개)\n\n① It <u>is been</u> raining all day.\n② It <u>has raining</u> since 9 o''clock.\n③ I <u>have been teaching</u> math for five years.\n④ She <u>has been read</u> books all day long.\n⑤ How long <u>have you been standing</u> here?', 'options', jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer', '3,5'),
    jsonb_build_object('number', 24, 'question', E'다음 밑줄 친 부분 중 어법상 옳은 것은? (정답 2개)\n\n① Junho <u>was built</u> the house for 20 years.\n② It <u>has been raining</u> since yesterday.\n③ Sora <u>was waiting</u> for Jimin this morning.\n④ She <u>has been learning</u> English 5 years ago.\n⑤ I <u>have been reading</u> this book since Monday.', 'options', jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer', '2,5'),
    jsonb_build_object('number', 25, 'question', E'다음 중 어법상 어색한 문장은?\n\n① It has been raining since one hour.\n② He has been sleeping for ten hours.\n③ The students have been playing volleyball since 9 o''clock.\n④ Minho has been wearing glasses since he was twelve.\n⑤ They have been standing there for thirty minutes.', 'options', jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer', '1'),
    jsonb_build_object('number', 26, 'question', E'다음 중 어법상 어색한 문장은?\n\n① We have been jogging for more than an hour.\n② He has been planting trees since he was ten.\n③ She has been watching it for over two hours.\n④ We have been using this recipe for over 300 years.\n⑤ Kyle has been visiting his grandmother many times.', 'options', jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer', '5'),
    jsonb_build_object('number', 27, 'question', E'다음 중 어법상 어색한 문장은? (정답 2개)\n\n① I''ve been taking science classes for years.\n② Jimin has been living in Busan for six years.\n③ I have been waiting for her since an hour.\n④ I''ve been taken history classes for two months.\n⑤ I have been raising pine trees since 2016.', 'options', jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer', '3,4'),
    jsonb_build_object('number', 28, 'question', E'다음 밑줄 친 부분 중 어법상 적절하지 않은 것은?\n\n① Jisu <u>has known</u> Minji since she was a child.\n② He <u>has been talking</u> to her on the phone many times.\n③ Sora <u>has been wearing</u> glasses since she was sixteen.\n④ It''s been raining all day. It''s still raining right now.\n⑤ My neck hurts, so I <u>have been sleeping</u> on a special pillow lately.', 'options', jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer', '2'),
    jsonb_build_object('number', 29, 'question', E'다음 중 어법상 옳은 문장끼리 알맞게 짝지어진 것은?\n\n(a) It was snowing since last night.\n(b) I have been playing computer games all afternoon.\n(c) Jisu has been waiting for Minho this morning.', 'options', jsonb_build_array(E'(a)', E'(b)', E'(c)', E'(b), (c)', E'(a), (b), (c)'), 'answer', '2'),
    jsonb_build_object('number', 30, 'question', E'다음 중 어법상 옳은 문장끼리 알맞게 짝지어진 것은?\n\n(A) Prices have been increasing steadily for months.\n(B) I have been talking to your teacher yesterday.\n(C) I''ve been looking for a job since almost a year.\n(D) Jisu has been playing tennis for five months.\n(E) We have been studying English for 7 years.', 'options', jsonb_build_array(E'(A), (B), (C), (D), (E)', E'(A), (B), (D), (E)', E'(A), (C), (D), (E)', E'(A), (D), (E)', E'(A), (B), (D)'), 'answer', '4'),
    jsonb_build_object('number', 31, 'question', E'다음 중 어법상 옳은 문장끼리 알맞게 짝지어진 것은?\n\nⓐ It has been raining since last Tuesday.\nⓑ She has been knitting two hours ago.\nⓒ Everything has been going wrong recently.\nⓓ I have been using my tablet since 7 years.\nⓔ He has been learning yoga since he was 12.\nⓕ I''ve been making this dish since two months.\nⓖ He has been writing a book for two months.', 'options', jsonb_build_array(E'ⓒ, ⓔ', E'ⓒ, ⓔ, ⓖ', E'ⓐ, ⓒ, ⓔ, ⓖ', E'ⓑ, ⓒ, ⓔ, ⓖ', E'ⓐ, ⓑ, ⓓ, ⓔ, ⓖ'), 'answer', '3'),
    jsonb_build_object('number', 32, 'question', E'다음 중 어법상 어색한 문장의 총 개수는?\n\nⓐ She has been sleeping for 12 hours.\nⓑ How long have you learning English?\nⓒ How long have he been watching TV?\nⓓ The baby has been crying for an hour.\nⓔ They have been talking on the phone for 2 hours.', 'options', jsonb_build_array(E'1개', E'2개', E'3개', E'4개', E'5개'), 'answer', '2'),
    jsonb_build_object('number', 33, 'question', E'다음 중 어법상 옳은 문장의 총 개수는?\n\nⓐ I''ve been taking history classes for four months.\nⓑ Jisu has been lived in Daegu for six years.\nⓒ Tom has been learning French since 15 years.\nⓓ We have been marrying for ten years.\nⓔ I have been knowing Alex since he was a child.\nⓕ Minho and Jisu have been playing chess three hours ago.\nⓖ He has been working at this company since 2007.', 'options', jsonb_build_array(E'1개', E'2개', E'3개', E'4개', E'5개'), 'answer', '2'),
    jsonb_build_object('number', 34, 'question', E'다음 중 어법상 어색한 문장의 총 개수는?\n\n• Sora has been eating her lunch for two hours.\n• He began playing golf since he was ten years old.\n• Dokdo has belonged to Korea for a long time.\n• I have been visiting my aunt who lives in Jeju yesterday.\n• My friend Max has been taught math for five years.\n• These days young people have been using their own tablets.', 'options', jsonb_build_array(E'1개', E'2개', E'3개', E'4개', E'5개'), 'answer', '3')
  );

  v_answer_key := jsonb_build_array(
    jsonb_build_object('number',1, 'answer','4,5'),
    jsonb_build_object('number',2, 'answer','5'),
    jsonb_build_object('number',3, 'answer','5'),
    jsonb_build_object('number',4, 'answer','5'),
    jsonb_build_object('number',5, 'answer','1'),
    jsonb_build_object('number',6, 'answer','2'),
    jsonb_build_object('number',7, 'answer','2'),
    jsonb_build_object('number',8, 'answer','5'),
    jsonb_build_object('number',9, 'answer','3'),
    jsonb_build_object('number',10, 'answer','1'),
    jsonb_build_object('number',11, 'answer','4'),
    jsonb_build_object('number',12, 'answer','5'),
    jsonb_build_object('number',13, 'answer','2'),
    jsonb_build_object('number',14, 'answer','4'),
    jsonb_build_object('number',15, 'answer','3'),
    jsonb_build_object('number',16, 'answer','5'),
    jsonb_build_object('number',17, 'answer','4'),
    jsonb_build_object('number',18, 'answer','2'),
    jsonb_build_object('number',19, 'answer','1'),
    jsonb_build_object('number',20, 'answer','4'),
    jsonb_build_object('number',21, 'answer','4'),
    jsonb_build_object('number',22, 'answer','5'),
    jsonb_build_object('number',23, 'answer','3,5'),
    jsonb_build_object('number',24, 'answer','2,5'),
    jsonb_build_object('number',25, 'answer','1'),
    jsonb_build_object('number',26, 'answer','5'),
    jsonb_build_object('number',27, 'answer','3,4'),
    jsonb_build_object('number',28, 'answer','2'),
    jsonb_build_object('number',29, 'answer','2'),
    jsonb_build_object('number',30, 'answer','4'),
    jsonb_build_object('number',31, 'answer','3'),
    jsonb_build_object('number',32, 'answer','2'),
    jsonb_build_object('number',33, 'answer','2'),
    jsonb_build_object('number',34, 'answer','3')
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('현재완료진행 Step2', '현재완료진행', v_questions, v_answer_key, 'problem', 'interactive');
END;
$$;
