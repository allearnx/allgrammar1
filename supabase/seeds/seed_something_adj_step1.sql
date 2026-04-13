DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = 'something+형용사 Step1';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- Part 1. 단어 배열 (Q1~Q12)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1, 'type','subjective', 'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\nI''d like to (spicy, something, eat) for dinner tonight.\n→ I''d like to _______ for dinner tonight.', 'answer',E'eat something spicy', 'similar_answers',jsonb_build_array('eat something spicy')),
    jsonb_build_object('number',2, 'type','subjective', 'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\nWould you like (hot, drink, something, to) on this cold morning?\n→ Would you like _______ on this cold morning?', 'answer',E'something hot to drink', 'similar_answers',jsonb_build_array('something hot to drink')),
    jsonb_build_object('number',3, 'type','subjective', 'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\nI have (new, nothing, tell, to) you about the project.\n→ I have _______ you about the project.', 'answer',E'nothing new to tell', 'similar_answers',jsonb_build_array('nothing new to tell')),
    jsonb_build_object('number',4, 'type','subjective', 'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\nDo you (anything, need, else) from the grocery store?\n→ Do you _______ from the grocery store?', 'answer',E'need anything else', 'similar_answers',jsonb_build_array('need anything else')),
    jsonb_build_object('number',5, 'type','subjective', 'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\nThere was (see, to, important, nothing) at the museum exhibit.\n→ There was _______ at the museum exhibit.', 'answer',E'nothing important to see', 'similar_answers',jsonb_build_array('nothing important to see')),
    jsonb_build_object('number',6, 'type','subjective', 'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\nDo you (exciting, want, see, something, to) this weekend?\n→ Do you _______ this weekend?', 'answer',E'want to see something exciting', 'similar_answers',jsonb_build_array('want to see something exciting')),
    jsonb_build_object('number',7, 'type','subjective', 'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\nI couldn''t find (buy, expensive, anything, to) at the flea market.\n→ I couldn''t find _______ at the flea market.', 'answer',E'anything expensive to buy', 'similar_answers',jsonb_build_array('anything expensive to buy')),
    jsonb_build_object('number',8, 'type','subjective', 'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\nShe always has (interesting, something, say, to) at meetings.\n→ She always has _______ at meetings.', 'answer',E'something interesting to say', 'similar_answers',jsonb_build_array('something interesting to say')),
    jsonb_build_object('number',9, 'type','subjective', 'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\nLook! There is (strange, sky, in, the, something).\n→ Look! There is _______.', 'answer',E'something strange in the sky', 'similar_answers',jsonb_build_array('something strange in the sky')),
    jsonb_build_object('number',10, 'type','subjective', 'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\nWe don''t want to (unpleasant, think, anything, about).\n→ We don''t want to _______.', 'answer',E'think about anything unpleasant', 'similar_answers',jsonb_build_array('think about anything unpleasant')),
    jsonb_build_object('number',11, 'type','subjective', 'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\nIf you can''t sleep, try (boring, do, something, to).\n→ If you can''t sleep, try _______.', 'answer',E'doing something boring', 'similar_answers',jsonb_build_array('doing something boring')),
    jsonb_build_object('number',12, 'type','subjective', 'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\nYour sister will never (wrong, do, anything, to) hurt you.\n→ Your sister will never _______ to hurt you.', 'answer',E'do anything wrong', 'similar_answers',jsonb_build_array('do anything wrong')),

    -- ═══════════════════════════════════════════
    -- Part 2. 대화 완성 (Q13~Q18)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',13, 'type','subjective', 'question',E'다음 <보기>의 단어 중 하나와 something / somebody / anything / nobody를 함께 사용하여 대화를 완성하시오.\n\n<보기> warm, cold, healthy, faster, smarter, exciting, funny, creative, stronger\n\nA: You look tired. Did you sleep well?\nB: Not really. I need _______ to help me relax before bed.', 'answer',E'something warm', 'similar_answers',jsonb_build_array('something warm')),
    jsonb_build_object('number',14, 'type','subjective', 'question',E'다음 <보기>의 단어 중 하나와 something / somebody / anything / nobody를 함께 사용하여 대화를 완성하시오.\n\n<보기> warm, cold, healthy, faster, smarter, exciting, funny, creative, stronger\n\nA: I want to eat out tonight. Any ideas?\nB: I don''t want junk food. I''d prefer _______.', 'answer',E'something healthy', 'similar_answers',jsonb_build_array('something healthy')),
    jsonb_build_object('number',15, 'type','subjective', 'question',E'다음 <보기>의 단어 중 하나와 something / somebody / anything / nobody를 함께 사용하여 대화를 완성하시오.\n\n<보기> warm, cold, healthy, faster, smarter, exciting, funny, creative, stronger\n\nA: Our team keeps losing. What should we do?\nB: We need _______ than us to join and lead the team.', 'answer',E'somebody smarter', 'similar_answers',jsonb_build_array('somebody smarter', 'someone smarter')),
    jsonb_build_object('number',16, 'type','subjective', 'question',E'다음 <보기>의 단어 중 하나와 something / somebody / anything / nobody를 함께 사용하여 대화를 완성하시오.\n\n<보기> warm, cold, healthy, faster, smarter, exciting, funny, creative, stronger\n\nA: It''s too hot outside. What do you want?\nB: I''d like to drink _______ right now.', 'answer',E'something cold', 'similar_answers',jsonb_build_array('something cold')),
    jsonb_build_object('number',17, 'type','subjective', 'question',E'다음 <보기>의 단어 중 하나와 something / somebody / anything / nobody를 함께 사용하여 대화를 완성하시오.\n\n<보기> warm, cold, healthy, faster, smarter, exciting, funny, creative, stronger\n\nA: I''m so bored at home. Let''s go out!\nB: Sure! Let''s do _______ together.', 'answer',E'something exciting', 'similar_answers',jsonb_build_array('something exciting', 'something fun')),
    jsonb_build_object('number',18, 'type','subjective', 'question',E'다음 <보기>의 단어 중 하나와 something / somebody / anything / nobody를 함께 사용하여 대화를 완성하시오.\n\n<보기> warm, cold, healthy, faster, smarter, exciting, funny, creative, stronger\n\nA: The poster design looks plain and boring.\nB: I agree. We need _______ to redesign it.', 'answer',E'somebody creative', 'similar_answers',jsonb_build_array('somebody creative', 'someone creative')),

    -- ═══════════════════════════════════════════
    -- Part 3. 오류 수정 (Q19~Q28)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',19, 'type','subjective', 'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nPlease tell me exciting something. I am really bored.', 'answer',E'exciting something → something exciting', 'similar_answers',jsonb_build_array(E'exciting something → something exciting')),
    jsonb_build_object('number',20, 'type','subjective', 'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nTell me if there is wrong anything with the new schedule.', 'answer',E'wrong anything → anything wrong', 'similar_answers',jsonb_build_array(E'wrong anything → anything wrong')),
    jsonb_build_object('number',21, 'type','subjective', 'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nI want to drink cold something after my workout.', 'answer',E'cold something → something cold', 'similar_answers',jsonb_build_array(E'cold something → something cold')),
    jsonb_build_object('number',22, 'type','subjective', 'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nThere is special nothing in this old treasure chest.', 'answer',E'special nothing → nothing special', 'similar_answers',jsonb_build_array(E'special nothing → nothing special')),
    jsonb_build_object('number',23, 'type','subjective', 'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nPlease let me know interesting something to watch on TV tonight.', 'answer',E'interesting something → something interesting', 'similar_answers',jsonb_build_array(E'interesting something → something interesting')),
    jsonb_build_object('number',24, 'type','subjective', 'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nDid you meet talented anybody at the audition yesterday?', 'answer',E'talented anybody → anybody talented', 'similar_answers',jsonb_build_array(E'talented anybody → anybody talented')),
    jsonb_build_object('number',25, 'type','subjective', 'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nIf you don''t have nice anything to say, please stay quiet.', 'answer',E'nice anything → anything nice', 'similar_answers',jsonb_build_array(E'nice anything → anything nice')),
    jsonb_build_object('number',26, 'type','subjective', 'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nI''ll do possible everything to help you pass the exam.', 'answer',E'possible everything → everything possible', 'similar_answers',jsonb_build_array(E'possible everything → everything possible')),
    jsonb_build_object('number',27, 'type','subjective', 'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nShe wants something to eat sweet after dinner every night.', 'answer',E'something to eat sweet → something sweet to eat', 'similar_answers',jsonb_build_array(E'something to eat sweet → something sweet to eat')),
    jsonb_build_object('number',28, 'type','subjective', 'question',E'다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nHe hasn''t heard of things new about the case for a long time.', 'answer',E'things new → anything new', 'similar_answers',jsonb_build_array(E'things new → anything new')),

    -- ═══════════════════════════════════════════
    -- Part 4. 우리말 → 단어 배열 (Q29~Q44)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',29, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n제게 따뜻한 것을 주세요.\n(warm, give, please, something, me)', 'answer',E'Please give me something warm.', 'similar_answers',jsonb_build_array(E'Please give me something warm.', E'Please give me something warm')),
    jsonb_build_object('number',30, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n나는 오늘 특별히 할 일이 없다.\n(I, nothing, today, do, to, have, special)', 'answer',E'I have nothing special to do today.', 'similar_answers',jsonb_build_array(E'I have nothing special to do today.', E'I have nothing special to do today')),
    jsonb_build_object('number',31, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n그 집 지붕 위에 이상한 것이 있다.\n(strange, there, on, is, roof, the, of, something, the, house)', 'answer',E'There is something strange on the roof of the house.', 'similar_answers',jsonb_build_array(E'There is something strange on the roof of the house.', E'There is something strange on the roof of the house')),
    jsonb_build_object('number',32, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n그녀에게는 잘못된 것이 전혀 없었다.\n(her, nothing, with, was, wrong, there)', 'answer',E'There was nothing wrong with her.', 'similar_answers',jsonb_build_array(E'There was nothing wrong with her.', E'There was nothing wrong with her')),
    jsonb_build_object('number',33, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n너는 그에 대해 특별한 어떤 것을 들었니?\n(you, did, him, special, anything, about, hear)', 'answer',E'Did you hear anything special about him?', 'similar_answers',jsonb_build_array(E'Did you hear anything special about him?', E'Did you hear anything special about him')),
    jsonb_build_object('number',34, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n한국에는 무언가 특별한 것이 있다.\n(Korea, something, is, special, there, about)', 'answer',E'There is something special about Korea.', 'similar_answers',jsonb_build_array(E'There is something special about Korea.', E'There is something special about Korea')),
    jsonb_build_object('number',35, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n나는 친구들과 무언가 재미있는 것을 하고 싶었다.\n(wanted, I, to, with, exciting, something, do, my, friends)', 'answer',E'I wanted to do something exciting with my friends.', 'similar_answers',jsonb_build_array(E'I wanted to do something exciting with my friends.', E'I wanted to do something exciting with my friends')),
    jsonb_build_object('number',36, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n내 가방엔 매우 유용한 것이 들어있어.\n(useful, have, I, my, bag, something, in, very)', 'answer',E'I have something very useful in my bag.', 'similar_answers',jsonb_build_array(E'I have something very useful in my bag.', E'I have something very useful in my bag')),
    jsonb_build_object('number',37, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n그의 이야기에는 특별한 것이 있니?\n(is, in, story, anything, there, his, special)', 'answer',E'Is there anything special in his story?', 'similar_answers',jsonb_build_array(E'Is there anything special in his story?', E'Is there anything special in his story')),
    jsonb_build_object('number',38, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n나는 가지고 놀 재미있는 무엇인가를 원한다.\n(fun, with, play, to, want, something, I)', 'answer',E'I want something fun to play with.', 'similar_answers',jsonb_build_array(E'I want something fun to play with.', E'I want something fun to play with')),
    jsonb_build_object('number',39, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n배워야 할 새로운 무언가가 있다는 것은 항상 흥미롭다.\n(interesting, always, something, new, that, it, is, learn, there, to, is)', 'answer',E'It is always interesting that there is something new to learn.', 'similar_answers',jsonb_build_array(E'It is always interesting that there is something new to learn.', E'It is always interesting that there is something new to learn')),
    jsonb_build_object('number',40, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n날카로운 것을 찾게 되면, 절대 손대서는 안 된다.\n(sharp, you, if, find, something, you, should, not, touch, it)', 'answer',E'If you find something sharp, you should not touch it.', 'similar_answers',jsonb_build_array(E'If you find something sharp, you should not touch it.', E'If you find something sharp, you should not touch it')),
    jsonb_build_object('number',41, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n그녀는 내게 특별한 무언가를 보러 나가야 한다고 말씀하셨다.\n(that, go, told, she, needed, something, out, we, to, special, to, me, see)', 'answer',E'She told me that we needed to go out to see something special.', 'similar_answers',jsonb_build_array(E'She told me that we needed to go out to see something special.', E'She told me that we needed to go out to see something special')),
    jsonb_build_object('number',42, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n그는 내가 더 중요한 사람이 될 수 있다고 말했다.\n(somebody, important, told, I, me, be, he, could, more, that)', 'answer',E'He told me that I could be somebody more important.', 'similar_answers',jsonb_build_array(E'He told me that I could be somebody more important.', E'He told me that I could be somebody more important')),
    jsonb_build_object('number',43, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n선생님은 다른 무언가에 대해 말씀하셨다.\n(talked, different, something, teacher, about, the)', 'answer',E'The teacher talked about something different.', 'similar_answers',jsonb_build_array(E'The teacher talked about something different.', E'The teacher talked about something different')),
    jsonb_build_object('number',44, 'type','subjective', 'question',E'다음 우리말과 같은 뜻이 되도록 주어진 단어를 바르게 배열하시오.\n\n의사는 내게 아무 이상이 없다고 말했다.\n(there, doctor, with, was, me, said, wrong, the, nothing)', 'answer',E'The doctor said there was nothing wrong with me.', 'similar_answers',jsonb_build_array(E'The doctor said there was nothing wrong with me.', E'The doctor said there was nothing wrong with me')),

    -- ═══════════════════════════════════════════
    -- Part 5. 우리말 → 영작 (Q45~Q60)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',45, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n너는 멋진 무언가를 했어.\n(wonderful)', 'answer',E'You did something wonderful.', 'similar_answers',jsonb_build_array(E'You did something wonderful.', E'You did something wonderful')),
    jsonb_build_object('number',46, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n그녀는 무언가 시원한 마실 것을 원했다.\n(want, drink)', 'answer',E'She wanted something cold to drink.', 'similar_answers',jsonb_build_array(E'She wanted something cold to drink.', E'She wanted something cold to drink')),
    jsonb_build_object('number',47, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n나는 새로운 것을 배우려고 노력했다.\n(try, new)', 'answer',E'I tried to learn something new.', 'similar_answers',jsonb_build_array(E'I tried to learn something new.', E'I tried to learn something new')),
    jsonb_build_object('number',48, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n그는 재미있는 무언가를 만들려고 노력했다.\n(make, interesting)', 'answer',E'He tried to make something interesting.', 'similar_answers',jsonb_build_array(E'He tried to make something interesting.', E'He tried to make something interesting')),
    jsonb_build_object('number',49, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n나는 함께 이야기할 재미있는 어떤 사람을 만났다.\n(someone, funny, talk)', 'answer',E'I met someone funny to talk with.', 'similar_answers',jsonb_build_array(E'I met someone funny to talk with.', E'I met someone funny to talk with')),
    jsonb_build_object('number',50, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n오늘, 나는 모든 사람들에게 중요한 무엇인가를 말해야 한다.\n(tell, everyone)\n→ Today,', 'answer',E'Today, I have to tell everyone something important.', 'similar_answers',jsonb_build_array(E'Today, I have to tell everyone something important.', E'Today, I have to tell everyone something important')),
    jsonb_build_object('number',51, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n사람들은 새로운 무언가를 발명해왔다.\n(invent, new)', 'answer',E'People have invented something new.', 'similar_answers',jsonb_build_array(E'People have invented something new.', E'People have invented something new')),
    jsonb_build_object('number',52, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n이번 주말에 특별한 무언가를 할 예정이니?\n(plan, anything, weekend)', 'answer',E'Do you plan to do anything special this weekend?', 'similar_answers',jsonb_build_array(E'Do you plan to do anything special this weekend?', E'Do you plan to do anything special this weekend')),
    jsonb_build_object('number',53, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n우리는 자라면서, 흥미로운 무언가를 발견할 수 있다.\n(grow up, find)\n→ As', 'answer',E'As we grow up, we can find something interesting.', 'similar_answers',jsonb_build_array(E'As we grow up, we can find something interesting.', E'As we grow up, we can find something interesting')),
    jsonb_build_object('number',54, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n일요일에 특별히 뭔가 할 일이 있습니까?\n(have, anything, particular)\n→ _______ on Sunday?', 'answer',E'Do you have anything particular to do on Sunday?', 'similar_answers',jsonb_build_array(E'Do you have anything particular to do on Sunday?', E'Do you have anything particular to do on Sunday')),
    jsonb_build_object('number',55, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n다른 사람들을 위해 좋은 일을 하자.\n(good, for others)', 'answer',E'Let''s do something good for others.', 'similar_answers',jsonb_build_array(E'Let''s do something good for others.', E'Let''s do something good for others')),
    jsonb_build_object('number',56, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n너는 무엇인가 흥미로운 것을 읽고 있니?\n(read, anything)', 'answer',E'Are you reading anything interesting?', 'similar_answers',jsonb_build_array(E'Are you reading anything interesting?', E'Are you reading anything interesting')),
    jsonb_build_object('number',57, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n신문에 재미있는 것이 있나요?\n(anything, the newspaper)', 'answer',E'Is there anything interesting in the newspaper?', 'similar_answers',jsonb_build_array(E'Is there anything interesting in the newspaper?', E'Is there anything interesting in the newspaper')),
    jsonb_build_object('number',58, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n몇 발자국 뒤로 물러서면, 재미있는 일이 일어난다.\n(happen)\n→ If you take a few steps back,', 'answer',E'something interesting happens.', 'similar_answers',jsonb_build_array(E'something interesting happens.', E'something interesting happens')),
    jsonb_build_object('number',59, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n우리 팀에는 더 빠른 누군가가 필요하다.\n(need, somebody, fast)', 'answer',E'We need somebody faster on our team.', 'similar_answers',jsonb_build_array(E'We need somebody faster on our team.', E'We need somebody faster on our team')),
    jsonb_build_object('number',60, 'type','subjective', 'question',E'다음 우리말을 주어진 힌트 단어를 활용하여 영작하시오.\n\n그녀에게는 들어줄 따뜻한 누군가가 필요하다.\n(need, someone, warm, listen)', 'answer',E'She needs someone warm to listen to her.', 'similar_answers',jsonb_build_array(E'She needs someone warm to listen to her.', E'She needs someone warm to listen to her'))
  );

  a := jsonb_build_array(
    E'eat something spicy',
    E'something hot to drink',
    E'nothing new to tell',
    E'need anything else',
    E'nothing important to see',
    E'want to see something exciting',
    E'anything expensive to buy',
    E'something interesting to say',
    E'something strange in the sky',
    E'think about anything unpleasant',
    E'doing something boring',
    E'do anything wrong',
    E'something warm',
    E'something healthy',
    E'somebody smarter',
    E'something cold',
    E'something exciting',
    E'somebody creative',
    E'exciting something → something exciting',
    E'wrong anything → anything wrong',
    E'cold something → something cold',
    E'special nothing → nothing special',
    E'interesting something → something interesting',
    E'talented anybody → anybody talented',
    E'nice anything → anything nice',
    E'possible everything → everything possible',
    E'something to eat sweet → something sweet to eat',
    E'things new → anything new',
    E'Please give me something warm.',
    E'I have nothing special to do today.',
    E'There is something strange on the roof of the house.',
    E'There was nothing wrong with her.',
    E'Did you hear anything special about him?',
    E'There is something special about Korea.',
    E'I wanted to do something exciting with my friends.',
    E'I have something very useful in my bag.',
    E'Is there anything special in his story?',
    E'I want something fun to play with.',
    E'It is always interesting that there is something new to learn.',
    E'If you find something sharp, you should not touch it.',
    E'She told me that we needed to go out to see something special.',
    E'He told me that I could be somebody more important.',
    E'The teacher talked about something different.',
    E'The doctor said there was nothing wrong with me.',
    E'You did something wonderful.',
    E'She wanted something cold to drink.',
    E'I tried to learn something new.',
    E'He tried to make something interesting.',
    E'I met someone funny to talk with.',
    E'Today, I have to tell everyone something important.',
    E'People have invented something new.',
    E'Do you plan to do anything special this weekend?',
    E'As we grow up, we can find something interesting.',
    E'Do you have anything particular to do on Sunday?',
    E'Let''s do something good for others.',
    E'Are you reading anything interesting?',
    E'Is there anything interesting in the newspaper?',
    E'something interesting happens.',
    E'We need somebody faster on our team.',
    E'She needs someone warm to listen to her.'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('something+형용사 Step1', 'something+형용사', q, a, 'problem', 'interactive');

  RAISE NOTICE 'something+형용사 Step1 템플릿 생성 완료 (60문제, 전체 서술형)';
END;
$$;
