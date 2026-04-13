DO $$
DECLARE
  v_questions jsonb;
  v_answer_key jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = 'something+형용사 Step2';

  v_questions := jsonb_build_array(
    jsonb_build_object('number',1, 'question',E'다음 빈칸에 들어갈 말로 적절하지 않은 것은?\n\nHe went to the bookstore because he wanted to find ___ to read.', 'options',jsonb_build_array(E'something interesting', E'anything new', E'interesting something', E'something fun', E'nothing boring'), 'answer','3'),
    jsonb_build_object('number',2, 'question',E'다음 대화의 빈칸에 들어갈 말로 가장 적절한 것은?\n\nA: Is there anything unusual about the new student?\nB: No, not really. There is ___ about him.', 'options',jsonb_build_array(E'anything special', E'nothing special', E'something special', E'special nothing', E'any special'), 'answer','2'),
    jsonb_build_object('number',3, 'question',E'다음 대화의 빈칸에 들어갈 말로 가장 적절한 것은?\n\nA: Do you have any plans for the long weekend?\nB: Not yet. I want to do ___, but I can''t think of anything.', 'options',jsonb_build_array(E'nothing exciting', E'anything boring', E'something fun', E'exciting nothing', E'fun anything'), 'answer','3'),
    jsonb_build_object('number',4, 'question',E'다음 대화의 빈칸에 들어갈 말로 가장 적절한 것은?\n\nA: Why did you call the teacher?\nB: I didn''t. ___. Why do you ask?', 'options',jsonb_build_array(E'I did something wrong', E'I didn''t do anything wrong', E'I don''t see wrong things here', E'Wrong anything didn''t happen', E'I can''t find nothing right'), 'answer','2'),
    jsonb_build_object('number',5, 'question',E'다음 빈칸에 들어갈 말로 적절하지 않은 것은?\n\nA: What are you going to do after school today?\nB: ___\nA: That sounds great!', 'options',jsonb_build_array(E'I want to try something new.', E'I have nothing special to do.', E'I will do interesting things with my friends.', E'I plan to find somewhere quiet to study.', E'I will meet someone important who you might know.'), 'answer','2'),
    jsonb_build_object('number',6, 'question',E'다음 문장에서 \'delicious\'가 들어갈 위치로 가장 적절한 것은?\n\nShe ⓐ always ⓑ wants ⓒ something ⓓ to ⓔ eat.', 'options',jsonb_build_array(E'① ⓐ', E'② ⓑ', E'③ ⓒ', E'④ ⓓ', E'⑤ ⓔ'), 'answer','4'),
    jsonb_build_object('number',7, 'question',E'다음 우리말을 바르게 영작한 것은?\n\n나는 친구들과 함께 신나는 무언가를 하고 싶다.', 'options',jsonb_build_array(E'I want to do exciting something with my friends.', E'I want exciting something to do with my friends.', E'I want to do something exciting with my friends.', E'I want something to do exciting with my friends.', E'I want something do exciting with my friends.'), 'answer','3'),
    jsonb_build_object('number',8, 'question',E'다음 우리말을 바르게 영작한 것은?\n\n냉장고 안에 먹을 특별한 것이 없다.', 'options',jsonb_build_array(E'There is no special in the fridge to eat.', E'The fridge has something special inside.', E'Special something is not in the fridge.', E'There is nothing special to eat in the fridge.', E'Something special has not the fridge.'), 'answer','4'),
    jsonb_build_object('number',9, 'question',E'다음 우리말을 바르게 영작한 것은?\n\n공원에는 볼 만한 흥미로운 것이 아무것도 없었다.', 'options',jsonb_build_array(E'There was interesting nothing to see in the park.', E'There was nothing interesting to see in the park.', E'There was something not interesting in the park.', E'Nothing was interesting to see in the park at all.', E'There was not something interesting to see in park.'), 'answer','2'),
    jsonb_build_object('number',10, 'question',E'다음 중 어법상 옳은 문장은?\n\n① She found excited something in the box.\n② Do you want to drink warm something?\n③ I have nothing new to tell you about the trip.\n④ He doesn''t need important anything right now.\n⑤ There is special nothing left in the storage room.', 'options',jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer','3'),
    jsonb_build_object('number',11, 'question',E'다음 중 어법상 어색한 문장은?\n\n① Has anything unusual happened at school today?\n② I want to try on something larger at the shop.\n③ There is nothing to worry about in this situation.\n④ Tell me special everything you know about this case.\n⑤ Did you find anything helpful in the library?', 'options',jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer','4'),
    jsonb_build_object('number',12, 'question',E'다음 중 어법상 어색한 문장은? (정답 2개)\n\n① Students love to eat something sweet after lunch.\n② I decided to look for things new to wear.\n③ She found something useful at the garage sale.\n④ Did you see interesting anything at the gallery?\n⑤ Do you have anything good to recommend?', 'options',jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer','2,4'),
    jsonb_build_object('number',13, 'question',E'다음 중 어법상 어색한 문장은?\n\n① Would you like something warm to drink?\n② There is nothing strange about the situation.\n③ Did you find a thing useful at the market?\n④ I don''t want to have anything spicy today.\n⑤ I should find something helpful for my project.', 'options',jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer','3'),
    jsonb_build_object('number',14, 'question',E'다음 밑줄 친 부분 중 어법상 옳은 것은?\n\n① Is there <u>wrong anything</u> with the printer?\n② I have <u>else nothing</u> to add to the report.\n③ There was <u>kind nobody</u> to help us move.\n④ People want to eat <u>something healthy</u> these days.\n⑤ <u>Everything important decisions</u> are made by the team.', 'options',jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer','4'),
    jsonb_build_object('number',15, 'question',E'다음 중 어법상 옳은 문장은?\n\n① I need exciting something to watch tonight.\n② I don''t have special anything to report.\n③ Let me know something interesting about the event.\n④ He doesn''t want to have hot anything to drink.\n⑤ Would you like to drink cold something?', 'options',jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer','3'),
    jsonb_build_object('number',16, 'question',E'다음 중 어법상 어색한 문장은? (정답 2개)\n\n① I''m looking for interesting something to read on the train.\n② Junho felt somebody touching his shoulder gently.\n③ How about doing something creative this afternoon?\n④ I couldn''t find wrong anything with the new software.\n⑤ There wasn''t anything physically wrong with the patient.', 'options',jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer','1,4'),
    jsonb_build_object('number',17, 'question',E'다음 중 어법상 옳은 문장은? (정답 2개)\n\n① There are nothing special in the display window.\n② I want to go somewhere unknown and adventurous.\n③ She decided entering the cooking contest next month.\n④ He looked surprising when I told him the news.\n⑤ I didn''t notice anything unusual about her behavior.', 'options',jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer','2,5'),
    jsonb_build_object('number',18, 'question',E'다음 중 어법상 옳은 문장은?\n\n① Good everything will come to those who wait.\n② I heard that Minji said a bad thing about Sumi.\n③ Before you graduate, find out special something for your future.\n④ Did you find interesting anything at the science exhibition?\n⑤ She wanted to wear something colorfully to the party.', 'options',jsonb_build_array(E'①', E'②', E'③', E'④', E'⑤'), 'answer','2'),
    jsonb_build_object('number',19, 'question',E'다음 중 어법상 옳은 문장의 총 개수는?\n\na. We need somebody braver than us for this mission.\nb. The soup does not contain anything bad for your health.\nc. She wants to travel somewhere peaceful and quiet.\nd. Tell me about somebody or something important in your life.\ne. I couldn''t find wrong anything with the old bicycle.', 'options',jsonb_build_array(E'1개', E'2개', E'3개', E'4개', E'5개'), 'answer','4'),
    jsonb_build_object('number',20, 'question',E'다음 중 어법상 옳은 문장끼리 바르게 짝지어진 것은?\n\n(a) I like that special thing.\n(b) Let''s do something exciting together this evening.\n(c) There was nothing unusual at the abandoned house.\n(d) I have hidden good something in the garden for you.\n(e) Did you find interesting anything at the flea market?\n(f) If you don''t have anything kind to say, please stay quiet.', 'options',jsonb_build_array(E'(a), (c), (f)', E'(a), (d), (f)', E'(a), (b), (e)', E'(b), (d), (e)', E'(b), (c), (f)'), 'answer','5')
  );

  v_answer_key := jsonb_build_array(
    jsonb_build_object('number',1, 'answer','3'),
    jsonb_build_object('number',2, 'answer','2'),
    jsonb_build_object('number',3, 'answer','3'),
    jsonb_build_object('number',4, 'answer','2'),
    jsonb_build_object('number',5, 'answer','2'),
    jsonb_build_object('number',6, 'answer','4'),
    jsonb_build_object('number',7, 'answer','3'),
    jsonb_build_object('number',8, 'answer','4'),
    jsonb_build_object('number',9, 'answer','2'),
    jsonb_build_object('number',10, 'answer','3'),
    jsonb_build_object('number',11, 'answer','4'),
    jsonb_build_object('number',12, 'answer','2,4'),
    jsonb_build_object('number',13, 'answer','3'),
    jsonb_build_object('number',14, 'answer','4'),
    jsonb_build_object('number',15, 'answer','3'),
    jsonb_build_object('number',16, 'answer','1,4'),
    jsonb_build_object('number',17, 'answer','2,5'),
    jsonb_build_object('number',18, 'answer','2'),
    jsonb_build_object('number',19, 'answer','4'),
    jsonb_build_object('number',20, 'answer','5')
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('something+형용사 Step2', 'something+형용사', v_questions, v_answer_key, 'problem', 'interactive');
END;
$$;
