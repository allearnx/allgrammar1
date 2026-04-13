DO $$
DECLARE
  q jsonb;
  a jsonb;
BEGIN
  DELETE FROM naesin_templates WHERE title = 'want+목적어+to부정사 Step 2';

  q := jsonb_build_array(
-- Part 1. 빈칸에 알맞은 것 / 어색한 것 고르기 (Q1~Q15)
jsonb_build_object('number',1,
  'question',E'[Part 1] 다음 빈칸에 들어갈 말로 알맞은 것은?\nMy teacher told me __________ harder for the test.',
  'options',jsonb_build_array('study','studies','studied','to study','studying'),
  'answer','4',
  'explanation',E'tell+목적어+to부정사: told me to study'),
jsonb_build_object('number',2,
  'question',E'다음 빈칸에 들어갈 말로 알맞은 것은?\nShe asked him __________ the window.',
  'options',jsonb_build_array('open','opens','to open','opened','opening'),
  'answer','3',
  'explanation',E'ask+목적어+to부정사: asked him to open'),
jsonb_build_object('number',3,
  'question',E'다음 빈칸에 들어갈 말로 알맞은 것은?\nHe __________ me to carry his luggage.',
  'options',jsonb_build_array('asked','said','talked','spoke','cried'),
  'answer','1',
  'explanation',E'ask+목적어+to부정사 구문이 가능한 동사는 asked이다. said/talked/spoke/cried는 to부정사 목적격 보어를 취하지 않는다.'),
jsonb_build_object('number',4,
  'question',E'다음 빈칸에 들어갈 말로 알맞은 것은?\nMy coach __________ me to get more sleep before the game.',
  'options',jsonb_build_array('let','made','advised','had','felt'),
  'answer','3',
  'explanation',E'advise+목적어+to부정사: advised me to get. let/make/have는 원형부정사를 취하고, felt는 의미상 부적절하다.'),
jsonb_build_object('number',5,
  'question',E'다음 빈칸에 들어갈 말로 적절하지 않은 것은?\nMom __________ me to set the table before dinner.',
  'options',jsonb_build_array('asked','wanted','told','made','allowed'),
  'answer','4',
  'explanation',E'make는 사역동사로 원형부정사를 취한다(make+목적어+동사원형). to부정사와 함께 쓸 수 없다.'),
jsonb_build_object('number',6,
  'question',E'다음 빈칸에 들어갈 말로 적절하지 않은 것은?\nHe __________ her to write the report.',
  'options',jsonb_build_array('asked','helped','made','wanted','expected'),
  'answer','3',
  'explanation',E'make는 사역동사로 원형부정사를 취한다(make+목적어+동사원형). to부정사와 함께 쓸 수 없다.'),
jsonb_build_object('number',7,
  'question',E'다음 빈칸에 들어갈 말로 적절하지 않은 것은?\nDad __________ me to learn how to cook.',
  'options',jsonb_build_array('wanted','allowed','advised','asked','made'),
  'answer','5',
  'explanation',E'make는 사역동사로 원형부정사를 취한다(make+목적어+동사원형). to부정사와 함께 쓸 수 없다.'),
jsonb_build_object('number',8,
  'question',E'다음 빈칸에 들어갈 말로 적절하지 않은 것은?\nShe __________ me to take her advice seriously.',
  'options',jsonb_build_array('wanted','ordered','told','made','advised'),
  'answer','4',
  'explanation',E'make는 사역동사로 원형부정사를 취한다(make+목적어+동사원형). to부정사와 함께 쓸 수 없다.'),
jsonb_build_object('number',9,
  'question',E'다음 빈칸에 들어갈 말로 가장 적절한 것은?\nI want Jake __________ me with my science project.',
  'options',jsonb_build_array('help','to help','will help','helping','helps'),
  'answer','2',
  'explanation',E'want+목적어+to부정사: want Jake to help'),
jsonb_build_object('number',10,
  'question',E'다음 빈칸에 들어갈 말로 적절하지 않은 것은?\nMy father __________ me to clean the garage.',
  'options',jsonb_build_array('told','asked','watched','ordered','wanted'),
  'answer','3',
  'explanation',E'watch는 지각동사로 원형부정사 또는 현재분사를 취한다(watch+목적어+동사원형/-ing). to부정사와 함께 쓸 수 없다.'),
jsonb_build_object('number',11,
  'question',E'다음 빈칸에 들어갈 말로 알맞은 것을 모두 고르면?\nShe __________ them to stay quiet during the exam.',
  'options',jsonb_build_array('told','made','let','had','wanted'),
  'answer','1,5',
  'explanation',E'tell+목적어+to부정사, want+목적어+to부정사가 가능하다. make/let/have는 원형부정사를 취하므로 to부정사와 쓸 수 없다.'),
jsonb_build_object('number',12,
  'question',E'다음 빈칸에 들어갈 말로 알맞지 않은 것은?\nHe __________ me to write a diary in English every day.',
  'options',jsonb_build_array('wanted','ordered','told','made','advised'),
  'answer','4',
  'explanation',E'make는 사역동사로 원형부정사를 취한다(make+목적어+동사원형). to부정사와 함께 쓸 수 없다.'),
jsonb_build_object('number',13,
  'question',E'다음 빈칸에 들어갈 말로 적절하지 않은 것은?\nHe __________ his son wash the family car.',
  'options',jsonb_build_array('had','saw','ordered','helped','let'),
  'answer','3',
  'explanation',E'order+목적어+to부정사 구문을 취하므로 원형부정사(wash)와 함께 쓸 수 없다. had/saw/let은 원형부정사를 취하고, helped는 원형부정사와 to부정사 모두 가능하다.'),
jsonb_build_object('number',14,
  'question',E'다음 빈칸에 들어갈 말로 알맞지 않은 것은?\nMy brother __________ me to do the laundry.',
  'options',jsonb_build_array('asked','allowed','expected','watched','wanted'),
  'answer','4',
  'explanation',E'watch는 지각동사로 원형부정사 또는 현재분사를 취한다. to부정사와 함께 쓸 수 없다.'),
jsonb_build_object('number',15,
  'question',E'다음 빈칸에 들어갈 말로 가장 적절한 것은?\nThe coach told him __________ during the match.',
  'options',jsonb_build_array('to cheat not','not cheat','not cheating','not to cheat','to not cheat'),
  'answer','4',
  'explanation',E'to부정사의 부정은 not to+동사원형 형태이다: told him not to cheat'),

-- Part 2. 영작 / 배열 (Q16~Q25)
jsonb_build_object('number',16,
  'question',E'[Part 2] 다음 빈칸에 들어갈 말로 알맞은 것은?\nI want you __________.',
  'options',jsonb_build_array('happy','to be happy','will be happy','be happy','for being happy'),
  'answer','2',
  'explanation',E'want+목적어+to부정사: want you to be happy'),
jsonb_build_object('number',17,
  'question',E'다음 우리말을 바르게 영작한 것은?\n나의 엄마는 내가 아침 운동을 하기를 원하신다.',
  'options',jsonb_build_array('My mom wants to do morning exercise.','My mom wants I do morning exercise.','My mom wants I to do morning exercise.','My mom wants me do morning exercise.','My mom wants me to do morning exercise.'),
  'answer','5',
  'explanation',E'want+목적어+to부정사: wants me to do. 목적어는 목적격(me)을 쓴다.'),
jsonb_build_object('number',18,
  'question',E'다음 우리말을 바르게 영작한 것은?\n너는 그들이 너를 도와주기를 원하니?',
  'options',jsonb_build_array('Do you want to help them you?','Do you want them to help you?','Do you help them to want you?','Do you want them helping you?','Do you help them to wanting me?'),
  'answer','2',
  'explanation',E'want+목적어+to부정사: want them to help you'),
jsonb_build_object('number',19,
  'question',E'다음 우리말을 바르게 영작한 것은?\n나는 당신에게 혼자서 그곳에 가지 말라고 충고했다.',
  'options',jsonb_build_array('I advised you to go there by yourself.','I advised you to not go there by yourself.','I advised you not to go there by yourself.','I didn''t advise you to go there by yourself.','I didn''t advise you not to go there by yourself.'),
  'answer','3',
  'explanation',E'to부정사의 부정은 not to+동사원형: advised you not to go. "가지 말라고"이므로 to부정사를 부정해야 한다.'),
jsonb_build_object('number',20,
  'question',E'다음 괄호 안에 주어진 단어를 순서대로 바르게 배열한 것은?\nMs. Kim (not / arrive / them / told / to / late).',
  'options',jsonb_build_array('arrive late to not told them','arrive late them not to told','told them not to arrive late','told them to not arrive late','told not them to arrive late'),
  'answer','3',
  'explanation',E'tell+목적어+not to+동사원형: told them not to arrive late'),
jsonb_build_object('number',21,
  'question',E'다음 괄호 안에 주어진 단어를 문법에 맞게 배열한 것은?\nShe (carry / the bag / her friend / to / asked).',
  'options',jsonb_build_array('carry the bag to asked her friend','carry her friend ask to the bag','asked her friend the bag to carry','asked her friend to carry the bag','asked to her friend carry the bag'),
  'answer','4',
  'explanation',E'ask+목적어+to부정사: asked her friend to carry the bag'),
jsonb_build_object('number',22,
  'question',E'다음 주어진 문장을 아래와 같이 바꿔 쓸 때 빈칸에 알맞은 말로 짝지어진 것은?\nMom allowed me __________ a new phone. → Mom let me __________ a new phone.',
  'options',jsonb_build_array('buy - buy','to buy - buying','buy - to buy','to buy - buy','buying - to buy'),
  'answer','4',
  'explanation',E'allow+목적어+to부정사(to buy), let+목적어+동사원형(buy)'),
jsonb_build_object('number',23,
  'question',E'다음 빈칸 ⓐ, ⓑ에 들어갈 알맞은 말이 차례대로 짝지어진 것은?\n· He wants his shirt ⓐ__________.\n· He wants her ⓑ__________ her shirt.',
  'options',jsonb_build_array('wash - to wash','washed - wash','washed - to wash','to wash - wash','to wash - to wash'),
  'answer','3',
  'explanation',E'ⓐ want+목적어(사물)+과거분사: wants his shirt washed (셔츠가 세탁되기를). ⓑ want+목적어(사람)+to부정사: wants her to wash'),
jsonb_build_object('number',24,
  'question',E'다음 빈칸에 들어갈 말로 알맞은 것은?\nMr. Brown wanted __________.',
  'options',jsonb_build_array('them work for him','them worked for him','them to work for him','them working for him','for them to work for him'),
  'answer','3',
  'explanation',E'want+목적어+to부정사: wanted them to work for him'),
jsonb_build_object('number',25,
  'question',E'다음 옳은 영작을 고르시오.',
  'options',jsonb_build_array(E'그녀는 나에게 늦지 말라고 말했다. → She told me not to late.',E'그는 나에게 창문을 열라고 요청했다. → He asked me open the window.',E'엄마는 나에게 제시간에 오라고 말했다. → Mom told me be on time.',E'그녀는 그에게 모자를 쓰라고 요청했다. → She asked him to wore a hat.',E'나는 그에게 내일 도서관에 가라고 말할 것이다. → I''ll tell him to go to the library tomorrow.'),
  'answer','5',
  'explanation',E'⑤ tell+목적어+to부정사: tell him to go. ① not to 뒤에 동사원형 필요(not to be late). ② ask+목적어+to부정사(to open). ③ tell+목적어+to부정사(to be on time). ④ to 뒤에 동사원형(to wear).'),

-- Part 3. 대화문 / 상황 빈칸 채우기 (Q26~Q30)
jsonb_build_object('number',26,
  'question',E'[Part 3] 다음 빈칸 ⓐ, ⓑ, ⓒ에 들어갈 알맞은 말로 바르게 짝지어진 것은?\n· I will let them ⓐ(tell) the truth.\n· She wanted me ⓑ(go) there alone.\n· Mr. Kim told us ⓒ(study) harder.',
  'options',jsonb_build_array(E'tell — go — to study',E'to tell — to go — study',E'telling — go — study',E'to tell — going — studying',E'tell — to go — to study'),
  'answer','5',
  'explanation',E'let+목적어+동사원형(tell), want+목적어+to부정사(to go), tell+목적어+to부정사(to study)'),
jsonb_build_object('number',27,
  'question',E'다음 빈칸에 들어갈 알맞은 말로 짝지어진 것은?\nThe doctor __________ me to rest and avoid stress.\ntold / heard / made / taught / felt / advised / let / wanted / watched',
  'options',jsonb_build_array(E'made, let, wanted',E'heard, felt, watched',E'told, advised, wanted',E'advised, let, wanted',E'told, made, advised'),
  'answer','3',
  'explanation',E'to부정사를 목적격 보어로 취하는 동사: told, advised, wanted. heard/felt/watched는 지각동사(원형부정사), made/let은 사역동사(원형부정사).'),
jsonb_build_object('number',28,
  'question',E'다음 빈칸에 들어갈 수 있는 동사 조합을 고르시오.\nEmily __________ me not to go out alone after dark.\nlet / wanted / noticed / made / watched / encouraged / felt / advised / told / ordered',
  'options',jsonb_build_array(E'let, wanted, made',E'told, made, advised',E'noticed, watched, felt',E'told, advised, ordered',E'let, encouraged, ordered'),
  'answer','4',
  'explanation',E'not to+동사원형(to부정사의 부정)을 목적격 보어로 취하는 동사: told, advised, ordered. let/make는 원형부정사, noticed/watched/felt은 지각동사.'),
jsonb_build_object('number',29,
  'question',E'다음 상황을 바르게 영작한 것은?\n(남자가 여자에게 함께 춤추자고 요청하는 상황)',
  'options',jsonb_build_array('He asks her dancing with him.','He asks her to dance with him.','He asks her dance with him.','He asks her danced with him.','He asks her dance to with him.'),
  'answer','2',
  'explanation',E'ask+목적어+to부정사: asks her to dance with him'),
jsonb_build_object('number',30,
  'question',E'다음 문장 중 밑줄 친 부분의 문장 요소가 다른 것은?\n① He gave <u>me</u> a present.\n② We call <u>him</u> Ace.\n③ What makes <u>you</u> so excited?\n④ I want <u>you</u> to do your best.\n⑤ Do you find <u>the movie</u> boring?',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','1',
  'explanation',E'①의 me는 간접목적어(4형식)이고, ②③④⑤의 밑줄 친 부분은 모두 목적어+목적격 보어(5형식)에서의 목적어이다.')
,
-- Part 4. 밑줄 친 부분 중 어색한/옳은 것 고르기 (Q31~Q45)
jsonb_build_object('number',31,
  'question',E'[Part 4] 다음 중 어법상 올바른 문장은?\n① I want you are happy.\n② I ordered them to be quiet.\n③ My father let me going camping.\n④ Sad movies always make me to cry.\n⑤ I helped the old man crossed the street.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','2',
  'explanation',E'order+목적어+to부정사: ordered them to be quiet. ① want+목적어+to부정사 (are → to be), ③ let+목적어+동사원형 (going → go), ④ make+목적어+동사원형 (to cry → cry), ⑤ help+목적어+동사원형/to부정사 (crossed → cross/to cross)'),
jsonb_build_object('number',32,
  'question',E'다음 중 어법상 올바른 문장을 모두 고르면?\n① Jane allowed her children leave the room.\n② The teacher advised me to study harder.\n③ Do you want me to bring it to the party?\n④ I would like you going with me.\n⑤ He helped her to carry the boxes.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','2,3,5',
  'explanation',E'② advise+목적어+to부정사, ③ want+목적어+to부정사, ⑤ help+목적어+to부정사. ① allow+목적어+to부정사 (leave → to leave), ④ would like+목적어+to부정사 (going → to go)'),
jsonb_build_object('number',33,
  'question',E'다음 중 어법상 올바른 문장은?\n① I expect her to succeeded.\n② I told Jane cleaning the room.\n③ He advised her go to Jeju.\n④ She asked me doing my homework.\n⑤ My mom wants me to eat breakfast.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','5',
  'explanation',E'want+목적어+to부정사: wants me to eat. ① to+동사원형 (succeeded → succeed), ② tell+목적어+to부정사 (cleaning → to clean), ③ advise+목적어+to부정사 (go → to go), ④ ask+목적어+to부정사 (doing → to do)'),
jsonb_build_object('number',34,
  'question',E'다음 중 어법상 어색한 문장은?\n① I want you to weed this garden.\n② Did he ask you to do more work?\n③ Jane stopped eating junk food.\n④ I heard you sing in a beautiful voice.\n⑤ She told me finish the essay today.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','5',
  'explanation',E'tell+목적어+to부정사: told me to finish. finish 앞에 to가 빠져 어색하다.'),
jsonb_build_object('number',35,
  'question',E'다음 중 어법상 옳은 문장은?\n① I made myself calm.\n② Many things made him sadly.\n③ I expected him buy me flowers.\n④ Mom wants me read a lot of books.\n⑤ My mom told me cleaning my room.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','1',
  'explanation',E'make+목적어+형용사(목적격보어): made myself calm. ② 형용사 보어 필요 (sadly → sad), ③ expect+목적어+to부정사 (buy → to buy), ④ want+목적어+to부정사 (read → to read), ⑤ tell+목적어+to부정사 (cleaning → to clean)'),
jsonb_build_object('number',36,
  'question',E'다음 중 어법상 옳은 문장은?\n① My teacher advised me to do my homework.\n② I advised her playing with them.\n③ They encouraged me study English.\n④ She wants that I go with her.\n⑤ He allowed me entered the building.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','1',
  'explanation',E'advise+목적어+to부정사: advised me to do. ② playing → to play, ③ study → to study, ④ want+목적어+to부정사 (that절 불가), ⑤ allow+목적어+to부정사 (entered → to enter)'),
jsonb_build_object('number',37,
  'question',E'다음 중 어법상 어색한 문장은?\n① Eric told you to be on time.\n② He wants me not to tell a lie.\n③ My mom asked me bring some water.\n④ I help my dad wash his car.\n⑤ Sumi tells me to call her very soon.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','3',
  'explanation',E'ask+목적어+to부정사: asked me to bring. bring 앞에 to가 빠져 어색하다.'),
jsonb_build_object('number',38,
  'question',E'다음 중 어법상 어색한 문장은?\n① I asked them not to play at night.\n② She asked the students their names.\n③ Would you like her to order food?\n④ Let me introduce you to our team.\n⑤ She forced herself be polite to them.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','5',
  'explanation',E'force+목적어+to부정사: forced herself to be. be 앞에 to가 빠져 어색하다.'),
jsonb_build_object('number',39,
  'question',E'다음 중 어법상 어색한 문장은?\n① The book made me want to travel more.\n② My parents let me join the art club.\n③ My teacher asked me to work harder.\n④ Mom told me to tidy my room.\n⑤ I advise him not tell a lie.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','5',
  'explanation',E'advise+목적어+not to부정사: advise him not to tell. to가 빠져 어색하다.'),
jsonb_build_object('number',40,
  'question',E'다음 중 어법상 옳은 문장은?\n① Are we allowed staying here?\n② I didn''t expect him go with us.\n③ I don''t want you will hurt yourself.\n④ I was warned never to sit on the wet bench.\n⑤ I made him promise that he would kept a secret.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','4',
  'explanation',E'warn+목적어+to부정사: was warned never to sit. ① allow+목적어+to부정사 (staying → to stay), ② expect+목적어+to부정사 (go → to go), ③ want+목적어+to부정사 (will hurt → to hurt 불가), ⑤ would+동사원형 (kept → keep)'),
jsonb_build_object('number',41,
  'question',E'다음 중 어법상 어색한 문장은?\n① My mother wanted me to help her.\n② They had me to buy expensive things.\n③ I asked my sister to clean my room.\n④ Ms. Jones told the students to stand up.\n⑤ She advised them to play outside.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','2',
  'explanation',E'have+목적어+동사원형(사역동사): had me buy. to가 불필요하다.'),
jsonb_build_object('number',42,
  'question',E'다음 중 어법상 옳은 문장은?\n① Ms. Jones told the students sit down.\n② Brad felt somebody to touch his shoulder.\n③ Sori saw an old man to get off the bus.\n④ The woman asked the man carry her box.\n⑤ She advised her son to stop playing games.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','5',
  'explanation',E'advise+목적어+to부정사: advised her son to stop. ① tell+목적어+to부정사 (sit → to sit), ② 지각동사 feel+목적어+동사원형 (to touch → touch), ③ 지각동사 see+목적어+동사원형 (to get → get), ④ ask+목적어+to부정사 (carry → to carry)'),
jsonb_build_object('number',43,
  'question',E'다음 중 어법상 어색한 문장은?\n① She told her son to clean his room.\n② The girl made the dog to stop barking.\n③ My mother forced me to do my homework.\n④ The girl wanted the boy to join the club.\n⑤ She advised her sister to stop eating late.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','2',
  'explanation',E'make(사역동사)+목적어+동사원형: made the dog stop. to가 불필요하다.'),
jsonb_build_object('number',44,
  'question',E'다음 중 어법상 옳은 문장은?\n① His shoes enable him move very fast.\n② The program enables students to learn online.\n③ This system enables the company to successful.\n④ Someday, there will be shoes that enable our to fly.\n⑤ Language enables people to communication.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','2',
  'explanation',E'enable+목적어+to부정사: enables students to learn. ① move → to move, ③ to+동사원형 필요 (successful은 형용사), ④ our → us, ⑤ to+동사원형 필요 (communication → communicate)'),
jsonb_build_object('number',45,
  'question',E'다음 중 어법상 어색한 문장은?\n① I got him to apologize and promise to behave.\n② Please allow me to introduce my friends.\n③ I didn''t expect her to be so quiet.\n④ Can I ask you to read the first paragraph?\n⑤ What would you like him do first when he comes back?',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','5',
  'explanation',E'would like+목적어+to부정사: like him to do. do 앞에 to가 빠져 어색하다.'),
-- Part 5. 어색한/옳은 문장 고르기 — 1개 (Q46~Q60)
jsonb_build_object('number',46,
  'question',E'[Part 5] 다음 중 어법상 어색한 문장은?\n① She had her hair cut at the salon.\n② Do you wish me leave now?\n③ He expects you to help him.\n④ He forced her to obey the rules.\n⑤ Robin asked me to join the meeting.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','2',
  'explanation',E'wish+목적어+to부정사: wish me to leave. leave 앞에 to가 빠져 어색하다.'),
jsonb_build_object('number',47,
  'question',E'다음 중 어법상 어색한 문장은?\n① I helped her cook dinner.\n② He wanted me to water the plant.\n③ She told me clean the blackboard.\n④ He expects his son to be a pilot.\n⑤ He told me not to go there.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','3',
  'explanation',E'tell+목적어+to부정사: told me to clean. clean 앞에 to가 빠져 어색하다.'),
jsonb_build_object('number',48,
  'question',E'다음 중 어법상 옳은 문장은?\n① Ben wanted me to helping him.\n② He allowed his son driving his car.\n③ Sue asked Kate to not make noise.\n④ My dad told me to turn off the TV.\n⑤ My teacher advised me not looking back.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','4',
  'explanation',E'tell+목적어+to부정사: told me to turn off. ① to+동사원형 (helping → help), ② allow+목적어+to부정사 (driving → to drive), ③ ask+목적어+not to부정사 (to not → not to), ⑤ advise+목적어+not to부정사 (not looking → not to look)'),
jsonb_build_object('number',49,
  'question',E'다음 중 어법상 어색한 문장은?\n① I told him to tell the truth.\n② I hope that you enjoy your trip.\n③ When students see teachers, they bow to them.\n④ Sue doesn''t want me going out with Jim.\n⑤ He was also very proud of himself.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','4',
  'explanation',E'want+목적어+to부정사: doesn''t want me to go out. going → to go.'),
jsonb_build_object('number',50,
  'question',E'다음 중 어법상 어색한 문장은?\n① Kate told him go home early.\n② Tom had Mina borrow his bike.\n③ I heard someone knock on the door.\n④ My dad wanted me to become a doctor.\n⑤ My mom made me clean my room quickly.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','1',
  'explanation',E'tell+목적어+to부정사: told him to go. go 앞에 to가 빠져 어색하다.'),
jsonb_build_object('number',51,
  'question',E'다음 중 어법상 어색한 문장은?\n① I asked them not to run in the hall.\n② She asked the students their names.\n③ Would you like him to order first?\n④ Let me show you to your seat.\n⑤ She forced herself be honest with them.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','5',
  'explanation',E'force+목적어+to부정사: forced herself to be. be 앞에 to가 빠져 어색하다.'),
jsonb_build_object('number',52,
  'question',E'다음 중 어법상 어색한 문장은?\n① The book made me apply for the internship.\n② My parents let me join the science camp.\n③ My teacher asked me to revise my essay.\n④ Mom told me to tidy up the kitchen.\n⑤ I advise him not tell the secret.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','5',
  'explanation',E'advise+목적어+not to부정사: advise him not to tell. to가 빠져 어색하다.'),
jsonb_build_object('number',53,
  'question',E'다음 중 어법상 옳은 문장은?\n① Are we allowed staying in this room?\n② I didn''t expect him go with us.\n③ I don''t want you will get hurt.\n④ I was warned never to touch the equipment.\n⑤ I made him promise that he would kept it.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','4',
  'explanation',E'warn+목적어+to부정사: was warned never to touch. ① staying → to stay, ② go → to go, ③ will get → to get 불가, ⑤ would+동사원형 (kept → keep)'),
jsonb_build_object('number',54,
  'question',E'다음 중 어법상 어색한 문장은?\n① My mother wanted me to help her cook.\n② They had me to bring expensive things.\n③ I asked my cousin to water the plants.\n④ Ms. Park told the students to be quiet.\n⑤ She advised them to get more exercise.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','2',
  'explanation',E'have(사역동사)+목적어+동사원형: had me bring. to가 불필요하다.'),
jsonb_build_object('number',55,
  'question',E'다음 중 어법상 옳은 문장은?\n① Ms. Brown told the students sit up straight.\n② He felt somebody to tap his shoulder.\n③ She saw the cat to jump over the fence.\n④ The man asked her carry his suitcase.\n⑤ He advised his son to stop skipping breakfast.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','5',
  'explanation',E'advise+목적어+to부정사: advised his son to stop. ① tell+목적어+to부정사 (sit → to sit), ② 지각동사 feel+목적어+동사원형 (to tap → tap), ③ 지각동사 see+목적어+동사원형 (to jump → jump), ④ ask+목적어+to부정사 (carry → to carry)'),
jsonb_build_object('number',56,
  'question',E'다음 중 어법상 어색한 문장은?\n① She told her daughter to clean her room.\n② The boy made the cat to stop meowing.\n③ My father forced me to finish my homework.\n④ The coach wanted the player to join the team.\n⑤ She advised her friend to stop watching TV late.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','2',
  'explanation',E'make(사역동사)+목적어+동사원형: made the cat stop. to가 불필요하다.'),
jsonb_build_object('number',57,
  'question',E'다음 중 어법상 옳은 문장은?\n① His bag enables him move faster.\n② This app enables users to learn anywhere.\n③ This tool enables the team to successful.\n④ Someday, tech will enable our to fly.\n⑤ Music enables people to communication emotions.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','2',
  'explanation',E'enable+목적어+to부정사: enables users to learn. ① move → to move, ③ to+동사원형 필요 (successful은 형용사), ④ our → us, ⑤ to+동사원형 필요 (communication → communicate)'),
jsonb_build_object('number',58,
  'question',E'다음 중 어법상 어색한 문장은?\n① I got her to apologize to the teacher.\n② Please allow me to explain my situation.\n③ I didn''t expect him to be so nervous.\n④ Can I ask you to check this document?\n⑤ What would you like her do first?',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','5',
  'explanation',E'would like+목적어+to부정사: like her to do. do 앞에 to가 빠져 어색하다.'),
jsonb_build_object('number',59,
  'question',E'다음 중 어법상 어색한 문장은? (정답 2개)\n① She had her nails done at the salon.\n② Do you wish me come with you?\n③ He expects her to arrive on time.\n④ He forced him to follow the rules.\n⑤ Robin asked me join the club.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','2,5',
  'explanation',E'② wish+목적어+to부정사: wish me to come (to 누락). ⑤ ask+목적어+to부정사: asked me to join (to 누락).'),
jsonb_build_object('number',60,
  'question',E'다음 중 어법상 어색한 문장은?\n① I helped him cook the meal.\n② He wanted her to water the flowers.\n③ She told me clean the whiteboard.\n④ He expects his daughter to be a vet.\n⑤ He told her not to go there.',
  'options',jsonb_build_array('①','②','③','④','⑤'),
  'answer','3',
  'explanation',E'tell+목적어+to부정사: told me to clean. clean 앞에 to가 빠져 어색하다.'),
-- Part 6. 어색한/옳은 문장 고르기 — 2개 이상 / 개수 (Q61~Q70)
jsonb_build_object(
  'number', 61,

  'question', E'[Part 6] 다음 중 어법상 어색한 문장은? (정답 2개)\n① She had her hair done at the salon.\n② Do you wish me leave now?\n③ He expects you to help him finish.\n④ He forced her to follow the instructions.\n⑤ Robin asked me join the team.',
  'options', jsonb_build_array('①', '②', '③', '④', '⑤'),
  'answer', '2,5',
  'explanation', E'② wish + 목적어 + to부정사: Do you wish me to leave now?\n⑤ ask + 목적어 + to부정사: Robin asked me to join the team.'
),
jsonb_build_object(
  'number', 62,

  'question', E'다음 중 어법상 옳은 문장은? (정답 2개)\n① I helped him cook dinner.\n② He wanted me to water the plants.\n③ She told me clean the board.\n④ He expects his son to be a doctor.\n⑤ He told me not going there.',
  'options', jsonb_build_array('①', '②', '③', '④', '⑤'),
  'answer', '2,4',
  'explanation', E'② want + 목적어 + to부정사: 올바른 문장.\n④ expect + 목적어 + to부정사: 올바른 문장.\n③ tell + 목적어 + to부정사: She told me to clean the board.\n⑤ tell + 목적어 + not to부정사: He told me not to go there.'
),
jsonb_build_object(
  'number', 63,

  'question', E'다음 중 어법상 어색한 문장은? (정답 2개)\n① Ben wanted me to helping him.\n② He allowed his son to drive his car.\n③ Sue asked Kate to not make noise.\n④ My dad told me to turn off the lights.\n⑤ My teacher advised me not to look back.',
  'options', jsonb_build_array('①', '②', '③', '④', '⑤'),
  'answer', '1,3',
  'explanation', E'① want + 목적어 + to부정사(원형): Ben wanted me to help him. (helping → help)\n③ ask + 목적어 + not to부정사: Sue asked Kate not to make noise. (to not → not to)'
),
jsonb_build_object(
  'number', 64,

  'question', E'다음 중 어법상 옳은 문장은? (정답 2개)\n① I told him to not tell the truth.\n② I hope that you enjoy Korean culture.\n③ Sue doesn''t want me going out with Jake.\n④ He was also very proud of himself.\n⑤ She forced herself be kind to them.',
  'options', jsonb_build_array('①', '②', '③', '④', '⑤'),
  'answer', '2,4',
  'explanation', E'② hope + that절: 올바른 문장.\n④ be proud of oneself: 올바른 문장.\n① tell + 목적어 + not to부정사: I told him not to tell the truth.\n③ want + 목적어 + to부정사: Sue doesn''t want me to go out with Jake.\n⑤ force + 목적어 + to부정사: She forced herself to be kind to them.'
),
jsonb_build_object(
  'number', 65,

  'question', E'다음 중 어법상 어색한 문장의 총 개수는?\nⓐ She had her car repaired at the shop.\nⓑ Do you wish me to come with you?\nⓒ He expects her to arrive on time.\nⓓ He forced him to following the rules.\nⓔ Robin asked me to join the club.\nⓕ I want her not to go alone.',
  'options', jsonb_build_array('1개', '2개', '3개', '4개', '5개'),
  'answer', '1',
  'explanation', E'어색한 문장은 ⓓ 1개뿐이다.\nⓓ force + 목적어 + to부정사(원형): He forced him to follow the rules. (to following → to follow)\n나머지는 모두 올바른 문장이다.'
),
jsonb_build_object(
  'number', 66,

  'question', E'다음 중 어법상 어색한 문장의 총 개수는?\nⓐ My mom often gets me to wash my pet.\nⓑ My mom wants me to take care of my brother.\nⓒ Her mom advised her to make a study plan.\nⓓ We watched him to play soccer with friends.\nⓔ My aunt wants me to visit the museum.',
  'options', jsonb_build_array('0개', '2개', '3개', '4개', '5개'),
  'answer', '2',
  'explanation', E'어색한 문장은 2개이다.\nⓓ 지각동사 watch + 목적어 + 원형부정사: We watched him play soccer with friends. (to play → play)\n나머지 어색한 문장 1개를 포함하여 총 2개.'
),
jsonb_build_object(
  'number', 67,

  'question', E'다음 중 어법상 어색한 문장의 총 개수는?\nⓐ He wants her to not leave now.\nⓑ Who told you to come to the party?\nⓒ My teacher asked me to take the exam.\nⓓ They didn''t want me to be an actor.\nⓔ My mother wants that I get up early.',
  'options', jsonb_build_array('1개', '2개', '3개', '4개', '5개'),
  'answer', '2',
  'explanation', E'어색한 문장은 2개이다.\nⓐ want + 목적어 + not to부정사: He wants her not to leave now. (to not leave → not to leave)\nⓔ want + 목적어 + to부정사: My mother wants me to get up early. (wants that I → wants me to)'
),
jsonb_build_object(
  'number', 68,

  'question', E'다음 중 어법상 어색한 문장을 모두 고르면?\nⓐ I want to know where you study.\nⓑ Do you know what song she want to sing?\nⓒ My dad told me not to stay up late.\nⓓ She wanted them to finish by Friday.\nⓔ He let me use his laptop.\nⓕ My teacher expects me working harder.\nⓖ The officer ordered him to stop.',
  'options', jsonb_build_array('ⓐ, ⓓ, ⓖ', 'ⓑ, ⓕ', 'ⓒ, ⓓ, ⓔ', 'ⓑ, ⓔ, ⓖ', 'ⓐ, ⓒ, ⓔ'),
  'answer', '2',
  'explanation', E'ⓑ 주어 she에 맞게 동사 변화: Do you know what song she wants to sing? (want → wants)\nⓕ expect + 목적어 + to부정사: My teacher expects me to work harder. (working → to work)'
),
jsonb_build_object(
  'number', 69,

  'question', E'다음 중 어법상 어색한 문장을 모두 고르면?\nⓐ She had her room cleaned.\nⓑ I want her to come to the party.\nⓒ He made me to clean the kitchen.\nⓓ The teacher told us not to talk during the test.\nⓔ My coach let me to rest today.\nⓕ She allowed him to leave early.',
  'options', jsonb_build_array('ⓐ, ⓑ', 'ⓑ, ⓓ', 'ⓒ, ⓔ', 'ⓐ, ⓓ, ⓔ', 'ⓒ, ⓓ, ⓔ, ⓕ'),
  'answer', '3',
  'explanation', E'ⓒ 사역동사 make + 목적어 + 원형부정사: He made me clean the kitchen. (to clean → clean)\nⓔ 사역동사 let + 목적어 + 원형부정사: My coach let me rest today. (to rest → rest)'
),
jsonb_build_object(
  'number', 70,

  'question', E'다음 중 어법상 옳은 문장끼리 바르게 짝지어진 것은?\nⓐ He wants her to not leave now.\nⓑ Who told you to come to the concert?\nⓒ My teacher asked me to take the quiz.\nⓓ They didn''t want me to be late.\nⓔ My mother wants that I wake up early.',
  'options', jsonb_build_array('ⓐ, ⓑ, ⓒ, ⓓ', 'ⓑ, ⓒ, ⓓ, ⓔ', 'ⓑ, ⓒ, ⓓ', 'ⓑ, ⓒ', 'ⓒ, ⓓ, ⓔ'),
  'answer', '3',
  'explanation', E'ⓑ tell + 목적어 + to부정사: 올바른 문장.\nⓒ ask + 목적어 + to부정사: 올바른 문장.\nⓓ want + 목적어 + to부정사(부정): 올바른 문장.\nⓐ want + 목적어 + not to부정사: He wants her not to leave now. (to not → not to)\nⓔ want + 목적어 + to부정사: My mother wants me to wake up early. (wants that I → wants me to)'
),
-- Part 7. 옳은 문장 짝짓기 / 복합 판단 (Q71~Q80)
jsonb_build_object(
  'number', 71,

  'question', E'[Part 7] 다음 중 어법상 옳은 문장끼리 바르게 짝지어진 것은?\nⓐ He made his son to water the plants.\nⓑ He allowed me to go to the movies.\nⓒ He ordered the soldiers not to go out.\nⓓ I asked her to sing a song for us.\nⓔ Mike wanted me playing soccer after school.',
  'options', jsonb_build_array('ⓐ, ⓑ', 'ⓐ, ⓒ, ⓓ', 'ⓑ, ⓒ, ⓓ', 'ⓒ, ⓓ, ⓔ', 'ⓐ, ⓓ, ⓔ'),
  'answer', '3',
  'explanation', E'ⓑ allow + 목적어 + to부정사: 올바른 문장.\nⓒ order + 목적어 + not to부정사: 올바른 문장.\nⓓ ask + 목적어 + to부정사: 올바른 문장.\nⓐ 사역동사 make + 목적어 + 원형부정사: He made his son water the plants. (to water → water)\nⓔ want + 목적어 + to부정사: Mike wanted me to play soccer after school. (playing → to play)'
),
jsonb_build_object(
  'number', 72,

  'question', E'다음 중 어법상 어색한 문장끼리 바르게 짝지어진 것은?\nⓐ Dad allowed me went to a movie.\nⓑ They expect her to come to the party.\nⓒ My father advised me not to listen to music through earphones.\nⓓ I told you go outside after dinner.\nⓔ My mom allowed me playing the computer.',
  'options', jsonb_build_array('ⓐ, ⓑ, ⓒ', 'ⓑ, ⓒ, ⓓ', 'ⓐ, ⓓ, ⓔ', 'ⓒ, ⓓ, ⓔ', 'ⓐ, ⓑ, ⓔ'),
  'answer', '3',
  'explanation', E'ⓐ allow + 목적어 + to부정사: Dad allowed me to go to a movie. (went → to go)\nⓓ tell + 목적어 + to부정사: I told you to go outside after dinner. (go → to go)\nⓔ allow + 목적어 + to부정사: My mom allowed me to play the computer. (playing → to play)'
),
jsonb_build_object(
  'number', 73,

  'question', E'다음 중 어법상 옳은 문장끼리 바르게 짝지어진 것은?\nⓐ He made me to clean my room.\nⓑ My father asked me to clean my room immediately.\nⓒ The doctor advised me to exercise regularly.\nⓓ My father allowed me playing computer games.\nⓔ He didn''t allow his daughter to go abroad.',
  'options', jsonb_build_array('ⓐ, ⓑ, ⓒ', 'ⓐ, ⓒ, ⓔ', 'ⓑ, ⓒ, ⓔ', 'ⓒ, ⓓ, ⓔ', 'ⓐ, ⓑ, ⓓ'),
  'answer', '3',
  'explanation', E'ⓑ ask + 목적어 + to부정사: 올바른 문장.\nⓒ advise + 목적어 + to부정사: 올바른 문장.\nⓔ allow + 목적어 + to부정사: 올바른 문장.\nⓐ 사역동사 make + 목적어 + 원형부정사: He made me clean my room. (to clean → clean)\nⓓ allow + 목적어 + to부정사: My father allowed me to play computer games. (playing → to play)'
),
jsonb_build_object(
  'number', 74,

  'question', E'다음 문장의 <u>밑줄 친 부분</u> 중 생략할 수 있는 것은?\n① She asked me <u>to</u> stop talking.\n② He told them <u>to</u> read the article.\n③ My mother forced me <u>to</u> exercise every morning.\n④ He wanted foreigners <u>to</u> know Korean customs.\n⑤ We helped the boys <u>to</u> finish their project in time.',
  'options', jsonb_build_array('①', '②', '③', '④', '⑤'),
  'answer', '5',
  'explanation', E'help는 목적격 보어로 to부정사와 원형부정사를 모두 취할 수 있으므로 to를 생략할 수 있다.\nWe helped the boys finish their project in time. (O)\n나머지 동사(ask, tell, force, want)는 반드시 to부정사를 사용해야 한다.'
),
jsonb_build_object(
  'number', 75,

  'question', E'다음 중 어법상 어색한 문장끼리 바르게 짝지어진 것은?\nⓐ She had her car washed.\nⓑ I want her to not come late.\nⓒ He made his son wash the dishes.\nⓓ The teacher told us not to talk during the quiz.\nⓔ My coach let me to rest for an hour.\nⓕ She allowed him to leave early.',
  'options', jsonb_build_array('ⓐ, ⓑ', 'ⓑ, ⓓ', 'ⓑ, ⓔ', 'ⓐ, ⓓ, ⓔ', 'ⓒ, ⓓ, ⓔ, ⓕ'),
  'answer', '3',
  'explanation', E'ⓑ want + 목적어 + not to부정사: I want her not to come late. (to not → not to)\nⓔ 사역동사 let + 목적어 + 원형부정사: My coach let me rest for an hour. (to rest → rest)'
),
jsonb_build_object(
  'number', 76,

  'question', E'다음 중 어법상 옳은 문장을 모두 고르면?\nⓐ My mom often gets me wash the dishes.\nⓑ My mom wants me to take care of the baby.\nⓒ Her mom advised her to make a study plan.\nⓓ We watched him to play basketball.\nⓔ My aunt wants me to visit her this weekend.',
  'options', jsonb_build_array('ⓐ, ⓑ, ⓒ', 'ⓑ, ⓒ, ⓓ', 'ⓑ, ⓒ, ⓔ', 'ⓐ, ⓒ, ⓔ', 'ⓒ, ⓓ, ⓔ'),
  'answer', '3',
  'explanation', E'ⓑ want + 목적어 + to부정사: 올바른 문장.\nⓒ advise + 목적어 + to부정사: 올바른 문장.\nⓔ want + 목적어 + to부정사: 올바른 문장.\nⓐ get + 목적어 + to부정사: My mom often gets me to wash the dishes. (wash → to wash)\nⓓ 지각동사 watch + 목적어 + 원형부정사: We watched him play basketball. (to play → play)'
),
jsonb_build_object(
  'number', 77,

  'question', E'다음 중 어법상 옳은 문장끼리 바르게 짝지어진 것은?\nⓐ I want to know where she is going.\nⓑ He made me to clean the classroom.\nⓒ My coach asked me to practice every day.\nⓓ The doctor advised me not to skip meals.\nⓔ She let me to use her umbrella.',
  'options', jsonb_build_array('ⓐ, ⓑ, ⓒ', 'ⓑ, ⓒ, ⓓ', 'ⓐ, ⓑ, ⓓ', 'ⓐ, ⓑ, ⓒ, ⓓ', 'ⓐ, ⓒ, ⓓ'),
  'answer', '5',
  'explanation', E'ⓐ want to know + 간접의문문: 올바른 문장.\nⓒ ask + 목적어 + to부정사: 올바른 문장.\nⓓ advise + 목적어 + not to부정사: 올바른 문장.\nⓑ 사역동사 make + 목적어 + 원형부정사: He made me clean the classroom. (to clean → clean)\nⓔ 사역동사 let + 목적어 + 원형부정사: She let me use her umbrella. (to use → use)'
),
jsonb_build_object(
  'number', 78,

  'question', E'다음 중 어법상 어색한 문장끼리 바르게 짝지어진 것은?\nⓐ She told her son to clean his room.\nⓑ The girl made the dog to stop barking.\nⓒ My father forced me to finish my report.\nⓓ The coach wanted the player to run faster.\nⓔ She advised her sister to stop eating late.\nⓕ His boots enable him to move quietly.',
  'options', jsonb_build_array('ⓐ, ⓒ, ⓔ', 'ⓑ only', 'ⓑ, ⓒ, ⓓ', 'ⓑ, ⓓ, ⓔ', 'ⓐ, ⓑ, ⓔ'),
  'answer', '2',
  'explanation', E'어색한 문장은 ⓑ 하나뿐이다.\nⓑ 사역동사 make + 목적어 + 원형부정사: The girl made the dog stop barking. (to stop → stop)\n나머지 문장은 모두 어법상 올바르다.'
),
jsonb_build_object(
  'number', 79,

  'question', E'다음 중 어법상 옳은 문장을 모두 고르면?\nⓐ He wants her to not leave now. (= He wants her not to leave now.)\nⓑ Who told you to come to the recital?\nⓒ My teacher asked me to retake the test.\nⓓ They didn''t want me to be nervous.\nⓔ My mother wants that I get up at 7.',
  'options', jsonb_build_array('ⓐ, ⓑ, ⓒ, ⓓ', 'ⓑ, ⓒ, ⓓ, ⓔ', 'ⓑ, ⓒ, ⓓ', 'ⓑ, ⓒ', 'ⓒ, ⓓ, ⓔ'),
  'answer', '3',
  'explanation', E'ⓑ tell + 목적어 + to부정사: 올바른 문장.\nⓒ ask + 목적어 + to부정사: 올바른 문장.\nⓓ want + 목적어 + to부정사(부정): 올바른 문장.\nⓐ want + 목적어 + not to부정사: He wants her not to leave now. (to not은 비표준)\nⓔ want + 목적어 + to부정사: My mother wants me to get up at 7. (wants that I → wants me to)'
),
jsonb_build_object(
  'number', 80,

  'question', E'다음 중 어법상 옳은 문장끼리 바르게 짝지어진 것은?\nⓐ They wanted me to pass the test.\nⓑ He told me not to worry about that.\nⓒ Mom always tells me studying hard.\nⓓ Mom allowed me to buy a new bag.\nⓔ Mike persuaded me to join his art club.',
  'options', jsonb_build_array('ⓐ, ⓑ, ⓒ', 'ⓑ, ⓒ, ⓓ', 'ⓐ, ⓑ, ⓓ', 'ⓐ, ⓒ, ⓔ', 'ⓐ, ⓑ, ⓓ, ⓔ'),
  'answer', '5',
  'explanation', E'ⓐ want + 목적어 + to부정사: 올바른 문장.\nⓑ tell + 목적어 + not to부정사: 올바른 문장.\nⓓ allow + 목적어 + to부정사: 올바른 문장.\nⓔ persuade + 목적어 + to부정사: 올바른 문장.\nⓒ tell + 목적어 + to부정사: Mom always tells me to study hard. (studying → to study)'
),
-- Part 8. 고난도 복합 판단 (Q81~Q90)
jsonb_build_object(
  'number', 81,

  'question', E'[Part 8] 다음 우리말을 바르게 영작한 것은?\n나는 그가 선생님이 되기를 원하셨다.',
  'options', jsonb_build_array('He wanted to be a teacher.', 'He wanted I be a teacher.', 'He wanted I to be a teacher.', 'He wanted me to be a teacher.', 'He wanted me be a teacher.'),
  'answer', '4',
  'explanation', E'want + 목적어(목적격) + to부정사 구문을 사용한다.\n주어가 원하는 대상이 "나"이므로 목적격 me를 사용: He wanted me to be a teacher.\n② I be → 목적격 me 필요 + to 필요\n③ I to be → 목적격 me 필요\n⑤ me be → to 필요'
),
jsonb_build_object(
  'number', 82,

  'question', E'다음 중 어법상 옳은 문장끼리 바르게 짝지어진 것은?\nⓐ I want to know who broke the vase.\nⓑ Do you think who will be her new partner?\nⓒ I''m wondering whether he is at home.\nⓓ What do you believe happened to her?\nⓔ I''m curious about what did she do last summer.',
  'options', jsonb_build_array('ⓐ, ⓑ, ⓒ', 'ⓑ, ⓒ, ⓓ', 'ⓐ, ⓒ, ⓔ', 'ⓐ, ⓒ, ⓓ', 'ⓑ, ⓓ, ⓔ'),
  'answer', '4',
  'explanation', E'ⓐ 간접의문문 어순(주어+동사): 올바른 문장.\nⓒ whether + 주어 + 동사: 올바른 문장.\nⓓ think/believe류 동사는 의문사를 문두로 이동: What do you believe happened to her? 올바른 문장.\nⓑ think류 동사 + 의문사 → 의문사를 문두로: Who do you think will be her new partner?\nⓔ 간접의문문은 평서문 어순: what she did last summer (did she do → she did)'
),
jsonb_build_object(
  'number', 83,

  'question', E'다음 중 어법상 어색한 문장을 모두 고르면?\nⓐ She doesn''t know where he is from.\nⓑ I don''t understand why they are angry.\nⓒ I don''t know if John and Tom are coming.\nⓓ When do you think they will finish?\nⓔ Nobody knows when the accident did happened.',
  'options', jsonb_build_array('ⓐ only', 'ⓑ, ⓒ', 'ⓐ, ⓒ', 'ⓐ, ⓓ', 'ⓐ, ⓔ'),
  'answer', '5',
  'explanation', E'ⓔ 조동사 did + 과거형 happened는 이중 과거로 어색하다: Nobody knows when the accident happened. (did happened → happened)\nⓐ 전치사로 끝나는 간접의문문: 엄격한 문법에서는 어색할 수 있다.'
),
jsonb_build_object(
  'number', 84,

  'question', E'다음 중 어법상 옳은 문장은? (정답 2개)\n① What movie do you know she wants to see?\n② The student knows how it is hard to be a nurse.\n③ I wonder whether you''d like to come to the party.\n④ I''d like to know how many stars we can see at night.\n⑤ Do you think which one is smarter, a cat or a dog?',
  'options', jsonb_build_array('①', '②', '③', '④', '⑤'),
  'answer', '3,4',
  'explanation', E'③ wonder + whether절(간접의문문): 올바른 문장.\n④ how many + 명사 + 주어 + 동사(간접의문문 어순): 올바른 문장.\n① know는 think류가 아니므로 의문사 문두 이동 불가: Do you know what movie she wants to see?\n② how + 형용사 + it is: The student knows how hard it is to be a nurse.\n⑤ think류 동사 + which → 문두 이동: Which one do you think is smarter?'
),
jsonb_build_object(
  'number', 85,

  'question', E'다음 중 어법상 어색한 문장끼리 바르게 짝지어진 것은?\nⓐ I don''t know that she will attend the event or not.\nⓑ Can you tell me when your birthday is?\nⓒ She asks me when we will meet.\nⓓ Do you know who did drew this picture?\nⓔ I don''t know who is telling the truth.\nⓕ Do you think why she smiled?',
  'options', jsonb_build_array('ⓐ, ⓓ, ⓕ', 'ⓐ, ⓒ, ⓔ', 'ⓑ, ⓓ, ⓔ', 'ⓒ, ⓔ, ⓕ', 'ⓑ, ⓔ, ⓕ'),
  'answer', '1',
  'explanation', E'ⓐ "~인지 아닌지"는 whether/if 사용: I don''t know whether she will attend the event or not. (that → whether/if)\nⓓ 조동사 did + 과거형 drew는 이중 과거: Do you know who drew this picture? (did drew → drew)\nⓕ think류 동사 + why → 의문사 문두 이동: Why do you think she smiled? (Do you think why → Why do you think)'
),
jsonb_build_object(
  'number', 86,

  'question', E'다음 중 어법상 옳은 문장을 모두 고르면?\nⓐ I want to know where she studies.\nⓑ Do you know what song she wants to sing?\nⓒ What kind of job do I want to have?\nⓓ Do you think I should take a break?\nⓔ Do you think what I can do for you?\nⓕ What do you think you want to eat?\nⓖ The woman wants to know how much it is.',
  'options', jsonb_build_array('ⓐ, ⓑ, ⓓ, ⓕ, ⓖ', 'ⓑ, ⓔ, ⓖ', 'ⓒ, ⓓ, ⓕ', 'ⓐ, ⓒ, ⓓ, ⓕ', 'ⓑ, ⓒ, ⓓ, ⓕ'),
  'answer', '1',
  'explanation', E'ⓐ 간접의문문 어순: 올바른 문장.\nⓑ 간접의문문 어순: 올바른 문장.\nⓓ think + yes/no 의문문(if/whether 없이 직접): 올바른 문장.\nⓕ think류 동사 + what → 문두 이동: 올바른 문장.\nⓖ 간접의문문 어순: 올바른 문장.\nⓒ 직접의문문이라면 맞지만 문맥상 간접의문문 의도.\nⓔ think류 동사 + what → 문두 이동 필요: What do you think I can do for you?'
),
jsonb_build_object(
  'number', 87,

  'question', E'다음 중 어법상 어색한 문장을 모두 고르면?\nⓐ Can you guess why they do this?\nⓑ Do you suppose what made her come here?\nⓒ I don''t really know when is the class over.\nⓓ He asked me how often she helped him.\nⓔ Let''s ask her who the man in the picture is.\nⓕ I''m not sure when he arrived at the station.\nⓖ I didn''t know how I dealt with it.\nⓗ Do you think why he''s so surprised?',
  'options', jsonb_build_array('ⓐ, ⓓ, ⓖ, ⓕ', 'ⓑ, ⓒ, ⓗ', 'ⓒ, ⓓ, ⓔ, ⓖ', 'ⓑ, ⓔ, ⓖ, ⓗ', 'ⓐ, ⓒ, ⓔ, ⓕ'),
  'answer', '2',
  'explanation', E'ⓑ suppose류(think류) 동사 + what → 의문사 문두 이동: What do you suppose made her come here?\nⓒ 간접의문문은 평서문 어순: I don''t really know when the class is over. (when is the class → when the class is)\nⓗ think류 동사 + why → 의문사 문두 이동: Why do you think he''s so surprised?'
),
jsonb_build_object(
  'number', 88,

  'question', E'다음 중 어법상 옳은 문장의 총 개수는?\n(A) I told them to be quiet during the ceremony.\n(B) She made him to clean the kitchen.\n(C) My coach let me rest before the match.\n(D) The teacher encouraged us to try again.\n(E) He allowed her entered the building.\n(F) They wanted me to pass the exam.',
  'options', jsonb_build_array('2개', '3개', '4개', '5개', '6개'),
  'answer', '3',
  'explanation', E'옳은 문장 4개: (A), (C), (D), (F)\n(A) tell + 목적어 + to부정사: 올바른 문장.\n(C) 사역동사 let + 목적어 + 원형부정사: 올바른 문장.\n(D) encourage + 목적어 + to부정사: 올바른 문장.\n(F) want + 목적어 + to부정사: 올바른 문장.\n(B) 사역동사 make + 목적어 + 원형부정사: She made him clean the kitchen. (to clean → clean)\n(E) allow + 목적어 + to부정사: He allowed her to enter the building. (entered → to enter)'
),
jsonb_build_object(
  'number', 89,

  'question', E'다음 중 어법상 어색한 문장을 모두 고르면?\nⓐ How can you believe she painted this herself?\nⓑ Why do you think he will arrive late?\nⓒ I don''t know when she can help me.\nⓓ Do you imagine what the view looks like?\nⓔ Can you tell me where he went yesterday?\nⓕ Why do you think she would rather stay?\nⓖ Do you suppose what time she will arrive?\nⓗ Where do you know the bus stop is?',
  'options', jsonb_build_array('ⓐ, ⓓ, ⓖ, ⓕ', 'ⓑ, ⓒ, ⓓ, ⓗ', 'ⓐ, ⓒ, ⓔ, ⓗ', 'ⓓ, ⓖ, ⓗ', 'ⓑ, ⓒ, ⓔ, ⓕ'),
  'answer', '4',
  'explanation', E'ⓓ imagine류(think류) + what → 의문사 문두 이동: What do you imagine the view looks like?\nⓖ suppose류(think류) + what time → 의문사 문두 이동: What time do you suppose she will arrive?\nⓗ know는 think류가 아니므로 의문사 문두 이동 불가하지만, "Where do you know the bus stop is?"는 어색하다: Do you know where the bus stop is?'
),
jsonb_build_object(
  'number', 90,

  'question', E'다음 중 어법상 옳은 문장끼리 바르게 짝지어진 것은?\nⓐ They wanted me to pass the exam.\nⓑ He told me not to worry about it.\nⓒ Mom always tells me studying hard.\nⓓ Mom allowed me to buy a new jacket.\nⓔ Mike persuaded me joining his club.\nⓕ The doctor advised her not to smoke.',
  'options', jsonb_build_array('ⓐ, ⓑ, ⓒ, ⓓ', 'ⓑ, ⓒ, ⓓ, ⓔ', 'ⓐ, ⓑ, ⓓ, ⓔ', 'ⓐ, ⓒ, ⓓ, ⓕ', 'ⓐ, ⓑ, ⓓ, ⓕ'),
  'answer', '5',
  'explanation', E'ⓐ want + 목적어 + to부정사: 올바른 문장.\nⓑ tell + 목적어 + not to부정사: 올바른 문장.\nⓓ allow + 목적어 + to부정사: 올바른 문장.\nⓕ advise + 목적어 + not to부정사: 올바른 문장.\nⓒ tell + 목적어 + to부정사: Mom always tells me to study hard. (studying → to study)\nⓔ persuade + 목적어 + to부정사: Mike persuaded me to join his club. (joining → to join)'
)
  );

  a := jsonb_build_array();

  INSERT INTO naesin_templates (title, template_topic, category, mode, questions, answer_key)
  VALUES ('want+목적어+to부정사 Step 2', 'want+목적어+to부정사', 'problem', 'interactive', q, a);
END;
$$;
