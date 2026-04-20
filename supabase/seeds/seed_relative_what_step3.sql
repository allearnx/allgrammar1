DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = '관계대명사 what Step3';

  q := jsonb_build_array(
    -- ═══════════════════════════════════════════
    -- 유형 1: 단어 배열 (Q1~Q5)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',1, 'type','subjective', 'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\nA: What did you get for your birthday?\nB: (got, I, what, a, is, drone).', 'answer',E'A drone is what I got.', 'acceptedAnswers',jsonb_build_array(E'A drone is what I got.', E'A drone is what I got')),
    jsonb_build_object('number',2, 'type','subjective', 'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\nA: Did you understand the teacher''s explanation?\nB: Not really. (said, she, I, understand, what, couldn''t).', 'answer',E'I couldn''t understand what she said.', 'acceptedAnswers',jsonb_build_array(E'I couldn''t understand what she said.', E'I couldn''t understand what she said')),
    jsonb_build_object('number',3, 'type','subjective', 'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\nA: Why are you upset?\nB: (made, angry, what, was, me, his, attitude).', 'answer',E'What made me angry was his attitude.', 'acceptedAnswers',jsonb_build_array(E'What made me angry was his attitude.', E'What made me angry was his attitude')),
    jsonb_build_object('number',4, 'type','subjective', 'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\nA: Is this the jacket you were looking for?\nB: Yes! (exactly, this, wanted, what, is, I).', 'answer',E'This is exactly what I wanted.', 'acceptedAnswers',jsonb_build_array(E'This is exactly what I wanted.', E'This is exactly what I wanted')),
    jsonb_build_object('number',5, 'type','subjective', 'question',E'다음 괄호 안의 단어를 바르게 배열하여 문장을 완성하시오.\n\n(what, about, is, special, that, him, he, never, gives, up).', 'answer',E'What is special about him is that he never gives up.', 'acceptedAnswers',jsonb_build_array(E'What is special about him is that he never gives up.', E'What is special about him is that he never gives up')),

    -- ═══════════════════════════════════════════
    -- 유형 2: 문장 전환 — what으로 바꾸기 (Q6~Q15)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',6, 'type','subjective', 'question',E'다음 문장을 관계대명사 what을 이용하여 같은 의미의 문장으로 바꾸시오.\n\n<보기> I love the thing that you gave me. → I love what you gave me.\n\nThe thing that he told me was shocking.\n→ _______ was shocking.', 'answer',E'What he told me', 'acceptedAnswers',jsonb_build_array(E'What he told me')),
    jsonb_build_object('number',7, 'type','subjective', 'question',E'다음 문장을 관계대명사 what을 이용하여 같은 의미의 문장으로 바꾸시오.\n\n<보기> I love the thing that you gave me. → I love what you gave me.\n\nTell me the thing that you want to have for lunch.\n→ Tell me _______ for lunch.', 'answer',E'what you want to have', 'acceptedAnswers',jsonb_build_array(E'what you want to have')),
    jsonb_build_object('number',8, 'type','subjective', 'question',E'다음 문장을 관계대명사 what을 이용하여 같은 의미의 문장으로 바꾸시오.\n\n<보기> I love the thing that you gave me. → I love what you gave me.\n\nShe doesn''t have the thing that we are looking for.\n→ She doesn''t have _______.', 'answer',E'what we are looking for', 'acceptedAnswers',jsonb_build_array(E'what we are looking for')),
    jsonb_build_object('number',9, 'type','subjective', 'question',E'다음 문장을 관계대명사 what을 이용하여 같은 의미의 문장으로 바꾸시오.\n\n<보기> I love the thing that you gave me. → I love what you gave me.\n\nThe thing that surprised me most was his answer.\n→ _______ was his answer.', 'answer',E'What surprised me most', 'acceptedAnswers',jsonb_build_array(E'What surprised me most')),
    jsonb_build_object('number',10, 'type','subjective', 'question',E'다음 문장을 관계대명사 what을 이용하여 같은 의미의 문장으로 바꾸시오.\n\n<보기> I love the thing that you gave me. → I love what you gave me.\n\nI will show you the thing that I made for the science fair.\n→ I will show you _______ for the science fair.', 'answer',E'what I made', 'acceptedAnswers',jsonb_build_array(E'what I made')),
    jsonb_build_object('number',11, 'type','subjective', 'question',E'다음 문장을 관계대명사 what을 이용하여 같은 의미의 문장으로 바꾸시오.\n\n<보기> I love the thing that you gave me. → I love what you gave me.\n\nThe things that the victims received were not enough.\n→ _______ were not enough.', 'answer',E'What the victims received', 'acceptedAnswers',jsonb_build_array(E'What the victims received')),
    jsonb_build_object('number',12, 'type','subjective', 'question',E'다음 문장을 관계대명사 what을 이용하여 같은 의미의 문장으로 바꾸시오.\n\n<보기> I love the thing that you gave me. → I love what you gave me.\n\nDo you know the thing that the coach expects from you?\n→ Do you know _______?', 'answer',E'what the coach expects from you', 'acceptedAnswers',jsonb_build_array(E'what the coach expects from you')),
    jsonb_build_object('number',13, 'type','subjective', 'question',E'다음 문장을 관계대명사 what을 이용하여 같은 의미의 문장으로 바꾸시오.\n\n<보기> I love the thing that you gave me. → I love what you gave me.\n\nThe thing that she is most proud of is her patience.\n→ _______ is her patience.', 'answer',E'What she is most proud of', 'acceptedAnswers',jsonb_build_array(E'What she is most proud of')),
    jsonb_build_object('number',14, 'type','subjective', 'question',E'다음 문장을 관계대명사 what을 이용하여 같은 의미의 문장으로 바꾸시오.\n\n<보기> I love the thing that you gave me. → I love what you gave me.\n\nI couldn''t believe the thing that he did during the presentation.\n→ I couldn''t believe _______ during the presentation.', 'answer',E'what he did', 'acceptedAnswers',jsonb_build_array(E'what he did')),
    jsonb_build_object('number',15, 'type','subjective', 'question',E'다음 문장을 관계대명사 what을 이용하여 같은 의미의 문장으로 바꾸시오.\n\n<보기> I love the thing that you gave me. → I love what you gave me.\n\nThe thing that makes this restaurant special is the homemade sauce.\n→ _______ is the homemade sauce.', 'answer',E'What makes this restaurant special', 'acceptedAnswers',jsonb_build_array(E'What makes this restaurant special')),

    -- ═══════════════════════════════════════════
    -- 유형 3: 보기 활용 빈칸 채우기 (Q16~Q25)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',16, 'type','subjective', 'question',E'다음 <보기>에서 알맞은 표현을 골라 빈칸을 채우시오. (한 번씩만 사용)\n\n<보기>\n• what I needed most    • what she ordered    • what he said\n• what really matters    • what I''ve been looking for\n• what upset her    • what they prepared    • what you promised\n• what I want to try    • what surprised everyone\n\nI don''t think he is telling the truth. I can''t believe _______.', 'answer',E'what he said', 'acceptedAnswers',jsonb_build_array(E'what he said')),
    jsonb_build_object('number',17, 'type','subjective', 'question',E'다음 <보기>에서 알맞은 표현을 골라 빈칸을 채우시오. (한 번씩만 사용)\n\n<보기>\n• what I needed most    • what she ordered    • what he said\n• what really matters    • what I''ve been looking for\n• what upset her    • what they prepared    • what you promised\n• what I want to try    • what surprised everyone\n\nThis is the bookstore! This is exactly _______.', 'answer',E'what I''ve been looking for', 'acceptedAnswers',jsonb_build_array(E'what I''ve been looking for', E'what I have been looking for')),
    jsonb_build_object('number',18, 'type','subjective', 'question',E'다음 <보기>에서 알맞은 표현을 골라 빈칸을 채우시오. (한 번씩만 사용)\n\n<보기>\n• what I needed most    • what she ordered    • what he said\n• what really matters    • what I''ve been looking for\n• what upset her    • what they prepared    • what you promised\n• what I want to try    • what surprised everyone\n\nThe waiter brought the wrong dish. It was not _______.', 'answer',E'what she ordered', 'acceptedAnswers',jsonb_build_array(E'what she ordered')),
    jsonb_build_object('number',19, 'type','subjective', 'question',E'다음 <보기>에서 알맞은 표현을 골라 빈칸을 채우시오. (한 번씩만 사용)\n\n<보기>\n• what I needed most    • what she ordered    • what he said\n• what really matters    • what I''ve been looking for\n• what upset her    • what they prepared    • what you promised\n• what I want to try    • what surprised everyone\n\nHis sudden resignation was _______ at the meeting.', 'answer',E'what surprised everyone', 'acceptedAnswers',jsonb_build_array(E'what surprised everyone')),
    jsonb_build_object('number',20, 'type','subjective', 'question',E'다음 <보기>에서 알맞은 표현을 골라 빈칸을 채우시오. (한 번씩만 사용)\n\n<보기>\n• what I needed most    • what she ordered    • what he said\n• what really matters    • what I''ve been looking for\n• what upset her    • what they prepared    • what you promised\n• what I want to try    • what surprised everyone\n\nA good night''s sleep was _______ after the long trip.', 'answer',E'what I needed most', 'acceptedAnswers',jsonb_build_array(E'what I needed most')),
    jsonb_build_object('number',21, 'type','subjective', 'question',E'다음 <보기>에서 알맞은 표현을 골라 빈칸을 채우시오. (한 번씩만 사용)\n\n<보기>\n• what I needed most    • what she ordered    • what he said\n• what really matters    • what I''ve been looking for\n• what upset her    • what they prepared    • what you promised\n• what I want to try    • what surprised everyone\n\nNot grades but kindness — that is _______ in life.', 'answer',E'what really matters', 'acceptedAnswers',jsonb_build_array(E'what really matters')),
    jsonb_build_object('number',22, 'type','subjective', 'question',E'다음 <보기>에서 알맞은 표현을 골라 빈칸을 채우시오. (한 번씩만 사용)\n\n<보기>\n• what I needed most    • what she ordered    • what he said\n• what really matters    • what I''ve been looking for\n• what upset her    • what they prepared    • what you promised\n• what I want to try    • what surprised everyone\n\nHis rude comment was _______ so much.', 'answer',E'what upset her', 'acceptedAnswers',jsonb_build_array(E'what upset her')),
    jsonb_build_object('number',23, 'type','subjective', 'question',E'다음 <보기>에서 알맞은 표현을 골라 빈칸을 채우시오. (한 번씩만 사용)\n\n<보기>\n• what I needed most    • what she ordered    • what he said\n• what really matters    • what I''ve been looking for\n• what upset her    • what they prepared    • what you promised\n• what I want to try    • what surprised everyone\n\nYou should keep _______ to your teammates.', 'answer',E'what you promised', 'acceptedAnswers',jsonb_build_array(E'what you promised')),
    jsonb_build_object('number',24, 'type','subjective', 'question',E'다음 <보기>에서 알맞은 표현을 골라 빈칸을 채우시오. (한 번씩만 사용)\n\n<보기>\n• what I needed most    • what she ordered    • what he said\n• what really matters    • what I''ve been looking for\n• what upset her    • what they prepared    • what you promised\n• what I want to try    • what surprised everyone\n\nThe food at the festival was amazing — it was beyond _______.', 'answer',E'what they prepared', 'acceptedAnswers',jsonb_build_array(E'what they prepared')),
    jsonb_build_object('number',25, 'type','subjective', 'question',E'다음 <보기>에서 알맞은 표현을 골라 빈칸을 채우시오. (한 번씩만 사용)\n\n<보기>\n• what I needed most    • what she ordered    • what he said\n• what really matters    • what I''ve been looking for\n• what upset her    • what they prepared    • what you promised\n• what I want to try    • what surprised everyone\n\nSkydiving is _______ someday.', 'answer',E'what I want to try', 'acceptedAnswers',jsonb_build_array(E'what I want to try')),

    -- ═══════════════════════════════════════════
    -- 유형 4: 대화 완성 (Q26~Q33)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',26, 'type','subjective', 'question',E'다음 대화의 빈칸에 알맞은 말을 쓰시오.\n\n<보기> A: What did you buy? B: What I bought was a new laptop.\n\nA: What did your sister cook for dinner?\nB: _______ was spaghetti.', 'answer',E'What my sister cooked for dinner', 'acceptedAnswers',jsonb_build_array(E'What my sister cooked for dinner', E'What she cooked for dinner')),
    jsonb_build_object('number',27, 'type','subjective', 'question',E'다음 대화의 빈칸에 알맞은 말을 쓰시오.\n\n<보기> A: What did you buy? B: What I bought was a new laptop.\n\nA: Are you happy with your exam result?\nB: Not really. The result was not _______.', 'answer',E'what I expected', 'acceptedAnswers',jsonb_build_array(E'what I expected', E'what I had expected', E'what I had hoped for')),
    jsonb_build_object('number',28, 'type','subjective', 'question',E'다음 대화의 빈칸에 알맞은 말을 쓰시오.\n\n<보기> A: What did you buy? B: What I bought was a new laptop.\n\nA: Did the package arrive safely?\nB: Yes, but it wasn''t _______.', 'answer',E'what I ordered', 'acceptedAnswers',jsonb_build_array(E'what I ordered', E'what I had ordered')),
    jsonb_build_object('number',29, 'type','subjective', 'question',E'다음 대화의 빈칸에 알맞은 말을 쓰시오.\n\n<보기> A: What did you buy? B: What I bought was a new laptop.\n\nA: I want to thank you so much.\nB: Oh, don''t mention it. I just did _______.', 'answer',E'what I could', 'acceptedAnswers',jsonb_build_array(E'what I could', E'what I could do', E'what I wanted to do for you')),
    jsonb_build_object('number',30, 'type','subjective', 'question',E'다음 대화의 빈칸에 알맞은 말을 쓰시오.\n\n<보기> A: What did you buy? B: What I bought was a new laptop.\n\nA: You look confused. What happened?\nB: I can''t understand _______ in class today.', 'answer',E'what the teacher explained', 'acceptedAnswers',jsonb_build_array(E'what the teacher explained', E'what we learned')),
    jsonb_build_object('number',31, 'type','subjective', 'question',E'다음 대화의 빈칸에 알맞은 말을 쓰시오.\n\n<보기> A: What did you buy? B: What I bought was a new laptop.\n\nA: Is this the bag that Emma wanted for her birthday?\nB: Yes! This bag is exactly _______.', 'answer',E'what she wanted', 'acceptedAnswers',jsonb_build_array(E'what she wanted', E'what Emma wanted')),
    jsonb_build_object('number',32, 'type','subjective', 'question',E'다음 대화의 빈칸에 알맞은 말을 쓰시오.\n\n<보기> A: What did you buy? B: What I bought was a new laptop.\n\nA: Did the movie meet your expectations?\nB: Totally. It was _______ — even better!', 'answer',E'what I expected', 'acceptedAnswers',jsonb_build_array(E'what I expected', E'beyond what I expected', E'more than what I expected')),
    jsonb_build_object('number',33, 'type','subjective', 'question',E'다음 대화의 빈칸에 알맞은 말을 쓰시오.\n\n<보기> A: What did you buy? B: What I bought was a new laptop.\n\nA: 너 지금 당장 필요한 게 뭐야?\nB: _______ right now is your advice.', 'answer',E'What I need', 'acceptedAnswers',jsonb_build_array(E'What I need', E'What I need most')),

    -- ═══════════════════════════════════════════
    -- 유형 5: what vs that / which 구분 MCQ (Q34~Q43)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',34, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nI still remember (what / that) she told me on the last day of school.', 'options',jsonb_build_array(E'what', E'that', E'which', E'who', E'whose'), 'answer',E'1'),
    jsonb_build_object('number',35, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nThe movie (what / that) we watched last Friday was really touching.', 'options',jsonb_build_array(E'what', E'that', E'which', E'who', E'whose'), 'answer',E'2'),
    jsonb_build_object('number',36, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\n(What / That) the chef prepared for us was a five-course meal.', 'options',jsonb_build_array(E'That', E'Which', E'What', E'Who', E'Whose'), 'answer',E'3'),
    jsonb_build_object('number',37, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nShe gave me everything (what / that) I had asked for.', 'options',jsonb_build_array(E'what', E'that', E'which', E'who', E'whom'), 'answer',E'2'),
    jsonb_build_object('number',38, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\n(What / That) surprised me most was how quickly he learned Korean.', 'options',jsonb_build_array(E'That', E'Which', E'Who', E'What', E'Whose'), 'answer',E'4'),
    jsonb_build_object('number',39, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nHe is the only student (what / that) passed the audition.', 'options',jsonb_build_array(E'what', E'that', E'which', E'who', E'whose'), 'answer',E'2'),
    jsonb_build_object('number',40, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nI can''t give you (what / that) you want because I don''t have it.', 'options',jsonb_build_array(E'that', E'which', E'what', E'who', E'whose'), 'answer',E'3'),
    jsonb_build_object('number',41, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\nThe advice (what / that) my grandfather gave me changed my life.', 'options',jsonb_build_array(E'what', E'that', E'which', E'who', E'whose'), 'answer',E'2'),
    jsonb_build_object('number',42, 'question',E'다음 괄호 안에서 알맞은 것을 고르시오.\n\n(What / That) I really want to say is that I''m truly sorry.', 'options',jsonb_build_array(E'That', E'Which', E'Who', E'Whose', E'What'), 'answer',E'5'),
    jsonb_build_object('number',43, 'question',E'다음 중 빈칸에 what이 들어갈 수 없는 문장을 고르시오.', 'options',jsonb_build_array(E'I believe _______ he says is always honest.', E'This is _______ I want to read this weekend.', E'She is the person _______ helped me the most.', E'_______ bothers me is his constant excuses.', E'Tell me _______ you think about this plan.'), 'answer',E'3'),

    -- ═══════════════════════════════════════════
    -- 유형 6: 오류 수정 서술형 (Q44~Q50)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',44, 'type','subjective', 'question',E'다음 밑줄 친 부분에서 어법상 어색한 것을 찾아 기호를 쓰고 바르게 고치시오.\n\nⓐ I know what she is looking for.\nⓑ He doesn''t have that we need right now.\nⓒ What she said to me was very encouraging.\nⓓ This is the bag that I bought at the market.', 'answer',E'ⓑ / that → what', 'acceptedAnswers',jsonb_build_array(E'ⓑ / that → what', E'ⓑ, that → what', E'ⓑ that → what')),
    jsonb_build_object('number',45, 'type','subjective', 'question',E'다음 밑줄 친 부분에서 어법상 어색한 것을 찾아 기호를 쓰고 바르게 고치시오.\n\nⓐ What is special about her is her warm smile.\nⓑ I believe what the world needs more kindness.\nⓒ She always does what she thinks is right.\nⓓ This is not what I expected at all.', 'answer',E'ⓑ / what → that', 'acceptedAnswers',jsonb_build_array(E'ⓑ / what → that', E'ⓑ, what → that', E'ⓑ what → that')),
    jsonb_build_object('number',46, 'type','subjective', 'question',E'다음 밑줄 친 부분에서 어법상 어색한 것을 찾아 기호를 쓰고 바르게 고치시오.\n\nⓐ Write down what you know about the topic.\nⓑ Which he told me turned out to be false.\nⓒ That building is what they call a landmark.\nⓓ I''ll give you what you need for the project.', 'answer',E'ⓑ / Which → What', 'acceptedAnswers',jsonb_build_array(E'ⓑ / Which → What', E'ⓑ, Which → What', E'ⓑ Which → What')),
    jsonb_build_object('number',47, 'type','subjective', 'question',E'다음 밑줄 친 부분에서 어법상 어색한 것을 찾아 기호를 쓰고 바르게 고치시오.\n\nⓐ What he is honest is well known to everyone.\nⓑ I couldn''t understand what the instructor explained.\nⓒ She shared what she had learned at the workshop.\nⓓ Show me what you drew for the art class.', 'answer',E'ⓐ / What → That', 'acceptedAnswers',jsonb_build_array(E'ⓐ / What → That', E'ⓐ, What → That', E'ⓐ What → That')),
    jsonb_build_object('number',48, 'type','subjective', 'question',E'다음 밑줄 친 부분에서 어법상 어색한 것을 찾아 기호를 쓰고 바르게 고치시오.\n\nⓐ The only thing what I regret is not studying harder.\nⓑ What my teacher told me is to never give up.\nⓒ I''ll do what I can to help you pass the exam.\nⓓ This is what I''ve always dreamed of.', 'answer',E'ⓐ / what → that', 'acceptedAnswers',jsonb_build_array(E'ⓐ / what → that', E'ⓐ, what → that', E'ⓐ what → that')),
    jsonb_build_object('number',49, 'type','subjective', 'question',E'다음 밑줄 친 부분에서 어법상 어색한 것을 찾아 기호를 쓰고 바르게 고치시오.\n\nⓐ I found what he wanted and gave it to him.\nⓑ What she needs right now is someone to listen.\nⓒ He thinks what the rumor about him is unfair.\nⓓ Please tell me what happened at the party last night.', 'answer',E'ⓒ / what → that', 'acceptedAnswers',jsonb_build_array(E'ⓒ / what → that', E'ⓒ, what → that', E'ⓒ what → that')),
    jsonb_build_object('number',50, 'type','subjective', 'question',E'다음 밑줄 친 부분에서 어법상 어색한 것을 찾아 기호를 쓰고 바르게 고치시오.\n\nⓐ What matters most in friendship is trust.\nⓑ She showed us what she had made for the festival.\nⓒ I''m going to tell you what is the secret to success.\nⓓ He finally got what he had been working toward for years.', 'answer',E'ⓒ — what is the secret → what the secret is', 'acceptedAnswers',jsonb_build_array(E'ⓒ / what is the secret → what the secret is', E'ⓒ, what is the secret → what the secret is', E'ⓒ what is the secret to success → what the secret to success is')),

    -- ═══════════════════════════════════════════
    -- 유형 7: 조건 영작 서술형 (Q51~Q60)
    -- ═══════════════════════════════════════════

    jsonb_build_object('number',51, 'type','subjective', 'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n<조건> 1. 관계대명사 what을 반드시 사용할 것 2. 7단어로 쓸 것\n\n그가 말한 것은 사실이 아니었다. (true, said)', 'answer',E'What he said was not true.', 'acceptedAnswers',jsonb_build_array(E'What he said was not true.', E'What he said was not true')),
    jsonb_build_object('number',52, 'type','subjective', 'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n<조건> 1. 관계대명사 what을 반드시 사용할 것 2. 8단어로 쓸 것\n\n내가 지금 필요한 것은 충분한 휴식이다. (rest, need, enough)', 'answer',E'What I need now is enough rest.', 'acceptedAnswers',jsonb_build_array(E'What I need now is enough rest.', E'What I need now is enough rest')),
    jsonb_build_object('number',53, 'type','subjective', 'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n<조건> 1. 관계대명사 what을 반드시 사용할 것 2. ''exactly''를 포함할 것 3. 6단어로 쓸 것\n\n이것이 바로 내가 원했던 것이다. (want)', 'answer',E'This is exactly what I wanted.', 'acceptedAnswers',jsonb_build_array(E'This is exactly what I wanted.', E'This is exactly what I wanted')),
    jsonb_build_object('number',54, 'type','subjective', 'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n<조건> 1. 관계대명사 what을 반드시 사용할 것 2. 9단어로 쓸 것\n\n그녀가 나를 위해 해준 것에 감사하고 싶다. (thank, done)', 'answer',E'I want to thank her for what she has done for me.', 'acceptedAnswers',jsonb_build_array(E'I want to thank her for what she has done for me.', E'I want to thank her for what she has done for me')),
    jsonb_build_object('number',55, 'type','subjective', 'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n<조건> 1. 관계대명사 what을 반드시 사용할 것 2. 주어진 두 문장을 한 문장으로 쓸 것 3. ''special''을 포함할 것\n\n• He always listens carefully.\n• That is his special quality.', 'answer',E'What is special about him is that he always listens carefully.', 'acceptedAnswers',jsonb_build_array(E'What is special about him is that he always listens carefully.', E'What is special about him is that he always listens carefully')),
    jsonb_build_object('number',56, 'type','subjective', 'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n<조건> 1. 관계대명사 what을 반드시 사용할 것 2. ''always''와 ''need''를 반드시 사용할 것 3. 9단어로 쓸 것\n\n내가 항상 필요로 하는 것이 항상 내가 원하는 것은 아니다. (want)', 'answer',E'What I always need is not always what I want.', 'acceptedAnswers',jsonb_build_array(E'What I always need is not always what I want.', E'What I always need is not always what I want')),
    jsonb_build_object('number',57, 'type','subjective', 'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n<조건> 1. 관계대명사 what을 반드시 사용할 것 2. ''should''와 ''check''를 반드시 사용할 것 3. 10단어로 쓸 것\n\n당신이 해야 할 것은 그것들 모두를 확인하는 것이다. (all, them)', 'answer',E'What you should do is check all of them carefully.', 'acceptedAnswers',jsonb_build_array(E'What you should do is check all of them carefully.', E'What you should do is check all of them carefully')),
    jsonb_build_object('number',58, 'type','subjective', 'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n<조건> 1. 관계대명사 what을 반드시 사용할 것 2. ''upset''와 ''neighbor''를 반드시 사용할 것 3. 완전한 문장으로 쓸 것\n\n어젯밤에 나를 화나게 만들었던 것은 이웃집의 소음이었다. (noise, last night, made)', 'answer',E'What made me upset last night was the noise from the neighbor.', 'acceptedAnswers',jsonb_build_array(E'What made me upset last night was the noise from the neighbor.', E'What made me upset last night was the noise from the neighbor', E'What made me upset last night was the neighbor''s noise.')),
    jsonb_build_object('number',59, 'type','subjective', 'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n<조건> 1. 관계대명사 what을 반드시 사용할 것 2. ''might''와 ''easy''를 반드시 사용할 것 3. 9단어로 쓸 것\n\n네가 일본어를 배우는 것이 쉬울 거야. (learn, Japanese)', 'answer',E'What might be easy for you is learning Japanese.', 'acceptedAnswers',jsonb_build_array(E'What might be easy for you is learning Japanese.', E'What might be easy for you is learning Japanese')),
    jsonb_build_object('number',60, 'type','subjective', 'question',E'다음 우리말을 주어진 조건에 맞게 영작하시오.\n\n<조건> 1. 관계대명사 what을 반드시 사용할 것 2. ''wise''와 ''refuse''를 반드시 사용할 것 3. 완전한 문장, 주어진 두 문장을 한 문장으로 쓸 것\n\n• She refused the unfair offer.\n• That was a wise decision.', 'answer',E'What she wisely did was refuse the unfair offer.', 'acceptedAnswers',jsonb_build_array(E'What she wisely did was refuse the unfair offer.', E'What she wisely did was refuse the unfair offer', E'What she did was wise — she refused the unfair offer.', E'Refusing the unfair offer was what she wisely chose to do.'))
  );

  -- answer_key: MCQ는 번호 문자열, 서술형은 정답 텍스트
  a := jsonb_build_array(
    E'A drone is what I got.',
    E'I couldn''t understand what she said.',
    E'What made me angry was his attitude.',
    E'This is exactly what I wanted.',
    E'What is special about him is that he never gives up.',
    E'What he told me',
    E'what you want to have',
    E'what we are looking for',
    E'What surprised me most',
    E'what I made',
    E'What the victims received',
    E'what the coach expects from you',
    E'What she is most proud of',
    E'what he did',
    E'What makes this restaurant special',
    E'what he said',
    E'what I''ve been looking for',
    E'what she ordered',
    E'what surprised everyone',
    E'what I needed most',
    E'what really matters',
    E'what upset her',
    E'what you promised',
    E'what they prepared',
    E'what I want to try',
    E'What my sister cooked for dinner',
    E'what I expected',
    E'what I ordered',
    E'what I could',
    E'what the teacher explained',
    E'what she wanted',
    E'what I expected',
    E'What I need',
    '1','2','3','2','4','2','3','2','5','3',
    E'ⓑ / that → what',
    E'ⓑ / what → that',
    E'ⓑ / Which → What',
    E'ⓐ / What → That',
    E'ⓐ / what → that',
    E'ⓒ / what → that',
    E'ⓒ — what is the secret → what the secret is',
    E'What he said was not true.',
    E'What I need now is enough rest.',
    E'This is exactly what I wanted.',
    E'I want to thank her for what she has done for me.',
    E'What is special about him is that he always listens carefully.',
    E'What I always need is not always what I want.',
    E'What you should do is check all of them carefully.',
    E'What made me upset last night was the noise from the neighbor.',
    E'What might be easy for you is learning Japanese.',
    E'What she wisely did was refuse the unfair offer.'
  );

  INSERT INTO naesin_templates (title, template_topic, questions, answer_key, category, mode)
  VALUES ('관계대명사 what Step3', '관계대명사 what', q, a, 'problem', 'interactive');

  RAISE NOTICE '관계대명사 what Step3 템플릿 생성 완료 (60문제: MCQ 10 + 서술형 50)';
END;
$$;
