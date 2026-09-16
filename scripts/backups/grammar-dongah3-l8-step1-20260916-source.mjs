// 중3 동아(이병민) 8과 Grammar Build Up 워크북 — 1단계(연습) 원문 추출(변형 없음), 파트별 약 40% 씨닝
// P1 분사구문 (189 → 84) / P2 과거완료 (157 → 73). 해설 없음(워크북에 해설 없음).
import { writeFileSync } from 'fs';

const FULL = ' ※ 완전한 문장으로 쓰시오.';
const FIX = '※ 틀린 부분을 고쳐서 올바른 문장으로 전부 쓰세요.';
const sp = (parts) => parts.map((a, i) => ({ label: `(${i + 1})`, answer: a }));
const P1 = [];
const P2 = [];
let n = 0;
const add = (arr, question, answer, options, extra = {}) => { arr.push({ number: ++n, question, options: options ?? [], answer, ...extra }); };
// 2택형: "(A / B)" 괄호 → 클릭형 객관식
const pick = (arr, sentence, choices, answerIdx) => add(arr, `알맞은 것을 고르시오.\n\n${sentence}`, String(answerIdx), choices);

// ═══════════════ P1 분사구문 ═══════════════
n = 0;
// Warm-up: match (2), box (2), find (3)
const WM = ["I couldn't stop crying.", 'I met an old friend of mine.', 'I had some questions to ask.'];
add(P1, `다음 분사구문에 이어질 알맞은 절을 고르시오.\n\nWalking on the street, ______________________`, '2', WM);
add(P1, `다음 분사구문에 이어질 알맞은 절을 고르시오.\n\nWatching the movie, ______________________`, '1', WM);
const BOX = '[보기] listen to music loudly / carry a lot of baggage / be surprised by the barking dog';
add(P1, `${BOX}\n<보기>의 표현을 사용하여 우리말에 맞게 분사구문으로 빈칸을 완성하시오.\n\n음악을 크게 들었기 때문에, Mike는 Ann이 그를 부르고 있는 것을 들을 수 없었다.\n→ ______________________, Mike couldn't hear Ann calling him.`, 'Listening to music loudly', null);
add(P1, `${BOX}\n<보기>의 표현을 사용하여 우리말에 맞게 분사구문으로 빈칸을 완성하시오.\n\n짖는 개에 놀라서, Kate는 갑자기 비명을 질렀다.\n→ ______________________, Kate suddenly cried out.`, 'Surprised by the barking dog', null, { acceptedAnswers: ['Being surprised by the barking dog'] });
add(P1, `${BOX}\n<보기>의 표현을 사용하여 우리말에 맞게 분사구문으로 빈칸을 완성하시오.\n\n많은 짐을 가지고 있었기 때문에, Jane은 역까지 택시를 탔다.\n→ ______________________, Jane took a taxi to the station.`, 'Carrying a lot of baggage', null);
add(P1, `다음 문장에서 분사구문에 해당하는 부분을 찾아 그대로 쓰시오.\n\nWalking along the street, he hummed a song.`, 'Walking along the street', null);
add(P1, `다음 문장에서 분사구문에 해당하는 부분을 찾아 그대로 쓰시오.\n\nMark climbed the rock, holding the rope tightly and pulling himself up.`, 'holding the rope tightly and pulling himself up', null);
add(P1, `다음 문장에서 분사구문에 해당하는 부분을 찾아 그대로 쓰시오.\n\nI injured my ankle, practicing a dance for the school festival.`, 'practicing a dance for the school festival', null);
// Part 1: 2택 (7)
pick(P1, '(Watched / Watching) TV, Kevin fell asleep.', ['Watched', 'Watching'], 2);
pick(P1, '(Written / Writing) in easy English, this book is easy to read.', ['Written', 'Writing'], 1);
pick(P1, 'Emma said goodbye to her friend, (got / getting) off the bus.', ['got', 'getting'], 2);
pick(P1, '(Interested / Interesting) in the movie, I asked my brother some questions.', ['Interested', 'Interesting'], 1);
pick(P1, '(Been / Being) curious about the boat, they climbed onto it.', ['Been', 'Being'], 2);
pick(P1, '(Arrived / Arriving) at the office, he called his son.', ['Arrived', 'Arriving'], 2);
pick(P1, '(Tired / Tiring) of touring, The Beatles spent more time in writing and recording songs.', ['Tired', 'Tiring'], 1);
// Part 2: 분사/동명사 (7)
const PG = ['분사', '동명사'];
const kind = (s, a) => add(P1, `밑줄 친 부분이 분사인지 동명사인지 고르시오.\n\n${s}`, String(a), PG);
kind('<u>Smiling</u> brightly, she waves her hand.', 1);
kind('The rain prevented us from <u>doing</u> anything outdoors.', 2);
kind("<u>Having</u> no money with me, I can't buy a car.", 1);
kind('I am sure of his <u>passing</u> the exam.', 2);
kind('<u>Waiting</u> for Jane, I saw Bob and Mary.', 1);
kind('<u>Yawning</u> is a sign of sleepiness.', 2);
kind('He went away, <u>waving</u> his hand.', 1);
// Part 3: 두 문장 뜻 같도록 빈칸 (9)
const same = (a, b, ans, extra) => add(P1, `두 문장의 뜻이 같도록 빈칸을 채우시오.\n\n${a}\n→ ${b}`, ans, null, extra);
same('I entered my room, and turned on the TV.', 'I entered my room, __________ on the TV.', 'turning');
same('As he studied hard, he passed the exam.', '__________ hard, he passed the exam.', 'Studying');
same('As I felt tired, I got some rest.', '__________ __________, I got some rest.', 'Feeling tired');
same("Because I have no money with me, I can't help you.", "__________ no money with me, I can't help you.", 'Having');
same("As I didn't know what to do, I just read a book.", '__________ __________ what to do, I just read a book.', 'Not knowing');
same('Although he was very rich, he lived a simple life.', '__________ __________ __________, he lived a simple life.', 'Being very rich');
same("Since I have a bad cold, I can't study more.", "__________ a bad cold, I can't study more.", 'Having');
same('Because I had nothing to eat, I went to the market.', '__________ nothing to eat, I went to the market.', 'Having');
same('As I walked along the street, I got a phone call from Jack.', '__________ along the street, I got a phone call from Jack.', 'Walking');
// Part 4: 접속사 고르기 (8) — 보기 4개 → 4지선다
const conj = (a, b, opts, ansIdx) => add(P1, `두 문장의 뜻이 같도록 빈칸에 알맞은 접속사를 고르시오.\n\n${a}\n→ ${b}`, String(ansIdx), opts);
const C1 = ['if', 'while', 'because', 'when'];
const C2 = ['while', 'after', 'because', 'although'];
const C3 = ['while', 'since', 'after', 'though'];
const C4 = ['since', 'if', 'after', 'although'];
conj("Turning to the left, you'll see a beautiful mountain.", "__________ you turn to the left, you'll see a beautiful mountain.", C1, 1);
conj('Feeling ill, she decided not to go to the party.', '__________ she felt ill, she decided not to go to the party.', C1, 3);
conj('Finishing his homework, he went to see the movie.', '__________ he finished his homework, he went to see the movie.', C2, 2);
conj("Studying hard, he couldn't pass the exam.", "__________ he studied hard, he couldn't pass the exam.", C2, 4);
conj("Born in the city, Linda didn't know much about country life.", "__________ Linda was born in the city, she didn't know much about country life.", C3, 2);
conj('Trying her best, she failed her driving test.', '__________ she tried her best, she failed her driving test.', C3, 4);
conj("Being sick, I couldn't study for the test.", "__________ I was sick, I couldn't study for the test.", C4, 1);
conj('Wanting to go out, he must remain here.', '__________ he wants to go out, he must remain here.', C4, 4);
// Part 5: 분사구문으로 완성 (8)
const toPart = (a, b, ans, extra) => add(P1, `분사구문을 사용하여 문장을 완성하시오.\n\n${a}\n→ ${b}`, ans, null, extra);
toPart("Although I know it's her mistake, I won't blame her.", "______________________, I won't blame her.", "Knowing it's her mistake", { acceptedAnswers: ['Knowing it is her mistake'] });
toPart('As Kelly cooked in the kitchen, she sang some pop songs.', '______________________, Kelly sang some pop songs.', 'Cooking in the kitchen');
toPart('If you open the box, you will find something surprising.', '______________________, you will find something surprising.', 'Opening the box');
toPart("Since he lost his wallet, he doesn't have any money.", "______________________, he doesn't have any money.", 'Having lost his wallet');
toPart('After his car had been repaired by Greg, it worked as he had expected.', '______________________, his car worked as he had expected.', 'Repaired by Greg', { acceptedAnswers: ['Having been repaired by Greg'] });
toPart('Because he was exhausted, he lay down on the grass.', '______________________, he lay down on the grass.', 'Exhausted', { acceptedAnswers: ['Being exhausted'] });
toPart('Although he is not old enough, he is very wise and thoughtful.', '______________________, he is very wise and thoughtful.', 'Not being old enough');
toPart('As he had bought a brand-new car, he gave his old car to me.', '______________________, he gave his old car to me.', 'Having bought a brand-new car');
// Part 6: 부사절로 다시 쓰기 (7)
const toClause = (a, b, ans, acc) => add(P1, `다음 문장의 분사구문을 부사절로 바꾸어 빈칸을 완성하시오.\n\n${a}\n→ ${b}`, ans, null, { acceptedAnswers: acc });
toClause('Feeling sick, I stayed home.', '______________________, I stayed home.', 'Because I felt sick', ['Since I felt sick', 'As I felt sick']);
toClause('Having a test tomorrow, I have to study all day.', '______________________, I have to study all day.', 'Because I have a test tomorrow', ['Since I have a test tomorrow', 'As I have a test tomorrow']);
toClause("Not having enough money, he couldn't buy a bike.", "______________________, he couldn't buy a bike.", "Because he didn't have enough money", ["Since he didn't have enough money", "As he didn't have enough money", 'Because he did not have enough money']);
toClause("Having lost my bag, I couldn't hand in the report.", "______________________, I couldn't hand in the report.", 'Because I had lost my bag', ['As I had lost my bag', 'Since I had lost my bag']);
toClause('Listening to music, she cleaned her room.', '______________________, she cleaned her room.', 'While she was listening to music', ['As she was listening to music']);
toClause('Being sick with a high fever, Mary stayed home all day.', '______________________, she stayed home all day.', 'Because Mary was sick with a high fever', ['As Mary was sick with a high fever', 'Since Mary was sick with a high fever']);
toClause("Not living with my family, I miss them a lot.", '______________________, I miss them a lot.', "Because I don't live with my family", ["As I don't live with my family", "Since I don't live with my family", 'Because I do not live with my family']);
// Part 7: 단어 배열 (8)
const order = (ko, words, ans) => add(P1, `다음 단어들을 알맞은 순서로 배열하여 우리말에 맞는 문장을 쓰시오.${FULL}\n\n${ko}\n${words}`, ans, null);
order('Kate는 음악을 들으면서 수학을 공부하고 있는 중이다.', '(math, is, Kate, studying), (to, listening, music)', 'Kate is studying math, listening to music.');
order('TV를 끄고 나서, 나는 숙제를 하기 시작했다.', '(off, TV, the, turning), (started, homework, I, doing, my)', 'Turning off the TV, I started doing my homework.');
order('나는 문제에 대한 답을 알았기 때문에 손을 들었다.', '(answer, question, to, knowing, the, the), (my, raised, hand, I)', 'Knowing the answer to the question, I raised my hand.');
order('작별 인사를 하면서, Kelly는 버스에 탔다.', '(goodbye, saying), (the, on, bus, got, Kelly)', 'Saying goodbye, Kelly got on the bus.');
order('Sally는 굽이 높은 신발을 신었기 때문에 빨리 달릴 수 없었다.', "(high-heeled, wearing, shoes), (run, couldn't, fast, Sally)", "Wearing high-heeled shoes, Sally couldn't run fast.");
order('나의 아버지가 차를 운전하고 계셨기 때문에 내가 대신 전화를 받았다.', '(car, driving, my, the, father), (phone, instead, answered, I, the)', 'My father driving the car, I answered the phone instead.');
order('많은 나무들이 베어지는 것을 보았기 때문에, 나는 재활용 종이를 사용하기로 결심했다.', '(down, cut, trees, seeing, many), (recycled, decided, use, to, I, paper)', 'Seeing many trees cut down, I decided to use recycled paper.');
order('그녀의 방을 청소하면서, 지수는 돈을 발견했다.', '(room, cleaning, her), (money, found, Jisu, some)', 'Cleaning her room, Jisu found some money.');
// Part 8: 오류 수정 (8) — 전체 문장 다시쓰기
const fix = (arr, wrong, right) => add(arr, `다음 문장에서 문법적 오류를 찾아 고치시오. ${FIX}\n\n${wrong}`, right, null);
fix(P1, 'Walked on the street, he saw a dog.', 'Walking on the street, he saw a dog.');
fix(P1, 'Crossed the street, you should be very careful.', 'Crossing the street, you should be very careful.');
fix(P1, 'Knowing not what to do, I called my sister.', 'Not knowing what to do, I called my sister.');
fix(P1, 'While watching TV last night, my phone rang.', 'While I was watching TV last night, my phone rang.');
fix(P1, 'Being had broken her arm, Lisa had to learn to write with her left hand.', 'Having broken her arm, Lisa had to learn to write with her left hand.');
fix(P1, 'Being played soccer, Minsu hurt his leg.', 'Playing soccer, Minsu hurt his leg.');
fix(P1, 'Puzzling, the little girl began to look around the area.', 'Puzzled, the little girl began to look around the area.');
fix(P1, "Watching not TV at all, she doesn't know the celebrities that her friends are talking about.", "Not watching TV at all, she doesn't know the celebrities that her friends are talking about.");
// Part 9: 분사구문으로 다시 쓰기 (8)
const rewrite = (s, ans, acc) => add(P1, `분사구문을 사용하여 문장을 다시 쓰시오.${FULL}\n\n${s}`, ans, null, acc ? { acceptedAnswers: acc } : {});
rewrite("As it was very hot yesterday, we couldn't go out.", "It being very hot yesterday, we couldn't go out.");
rewrite('As she was sick, she had to stay home.', 'Being sick, she had to stay home.');
rewrite('Because I had nothing to eat, I went to the market.', 'Having nothing to eat, I went to the market.');
rewrite("Because it rained cats and dogs, we couldn't go outside.", "It raining cats and dogs, we couldn't go outside.");
rewrite('Because she felt tired, she went to bed early.', 'Feeling tired, she went to bed early.');
rewrite('When Jane received a call from Jack, she went outside to meet him.', 'Receiving a call from Jack, Jane went outside to meet him.');
rewrite('If you turn to the left, you will find the post office.', 'Turning to the left, you will find the post office.');
rewrite('As I had no money, I walked home.', 'Having no money, I walked home.');
// Part 10: 영작 (7) — subParts
const trans = (ko, hint, frame, parts) => add(P1, `다음 문장을 주어진 단어를 활용하여 영작하시오. (분사구문 사용, 필요시 어형 변화)\n\n${ko}\n[단어: ${hint}]\n${frame}`, parts.join(' / '), null, { subParts: sp(parts) });
trans('서울에 갔을 때 나는 Sarah를 만났다.', 'visit, meet', '(1)__________ __________, I (2)__________ __________.', ['Visiting Seoul', 'met Sarah']);
trans('아팠기 때문에 나는 집에 있었다.', 'feel, sick, stay', '(1)__________ __________, I (2)__________ __________.', ['Feeling sick', 'stayed home']);
trans('그 뉴스를 들었을 때, 그녀는 대단히 놀랐다.', 'hear, the news, totally, amaze', '(1)__________ __________ __________, she (2)__________ __________ __________.', ['Hearing the news', 'was totally amazed']);
trans('왼쪽으로 돌면, 너는 우체국을 볼 것이다.', 'turn, see', '(1)__________ __________, you (2)__________ __________ __________ __________ __________.', ['Turning left', 'will see the post office']);
trans('인터넷을 검색하다가 그녀는 이메일을 받았다.', 'search, get', '(1)__________ __________ __________, she (2)__________ __________ __________.', ['Searching the Internet', 'got an e-mail']);
trans('내 여동생은 크게 노래 부르면서 잔디에 물을 주고 있었다.', 'sing, loudly, water, the grass', '(1)__________ __________, my little sister (2)__________ __________ __________ __________.', ['Singing loudly', 'was watering the grass']);
trans('차를 가지고 있지 않아서, 그는 대중교통을 사용하기로 했다.', 'car, decide, use, transportation', '(1)__________ __________ __________ __________, he (2)__________ __________ __________ __________ __________.', ['Not having a car', 'decided to use public transportation']);

// ═══════════════ P2 과거완료 ═══════════════
n = 0;
// Warm-up (4)
const WM2 = ['Yes. I returned the book that I had borrowed from her.', 'No. She had already left when I arrived at the party.', "No. I'd spent too much on books."];
add(P2, `다음 질문에 알맞은 대답을 고르시오.\n\nDid you meet Jenny last weekend?`, '1', WM2);
add(P2, `다음 질문에 알맞은 대답을 고르시오.\n\nDid you have enough money to buy the shoes?`, '3', WM2);
add(P2, `두 문장의 내용에 맞게 과거완료를 사용하여 빈칸을 채우시오.\n\n• Judy arrived at the theater.\n• The movie already started.\n→ When Judy arrived at the theater, the movie __________ __________ __________.`, 'had already started', null);
add(P2, `두 문장의 내용에 맞게 과거완료를 사용하여 빈칸을 채우시오.\n\n• Sarah couldn't work.\n• She had a surgery last week.\n→ Sarah couldn't work because she __________ __________ a surgery last week.`, 'had had', null);
// Part 1: 과거완료 완성 (11)
const pp = (s, ans, acc) => add(P2, `괄호 안의 말을 이용하여 '과거완료 시제'로 문장을 완성하시오.\n\n${s}`, ans, null, acc ? { acceptedAnswers: acc } : {});
pp('I knew who he was. I __________ (see) him before.', 'had seen');
pp('The bus __________ (already, leave) when I arrived at the bus stop.', 'had already left');
pp('I realized that I __________ (not, complete) my homework.', 'had not completed', ["hadn't completed"]);
pp('When I entered the classroom, my English teacher __________ (already, start) her class.', 'had already started');
pp('I __________ (just, finish) my homework when the teacher came in.', 'had just finished');
pp('Yesterday at a meeting, I saw Susan, an old friend of mine. I __________ (not, see) her in years.', 'had not seen', ["hadn't seen"]);
pp('Liam quit his job after he __________ (win) some money in the lottery.', 'had won');
pp('Elsa __________ (never, taste) an octopus until she visited Korea.', 'had never tasted');
pp('Simon called the travel agency, but the flight __________ (already, be cancel).', 'had already been canceled', ['had already been cancelled']);
pp('When I arrived at the airport, the check-in counters __________ (be, close).', 'had been closed');
pp('Before I lost my bag, I __________ (lose) my umbrella.', 'had lost');
// Part 2: 사건 순서 (5) — 먼저 일어난 일 고르기
const first = (s, a, b, ans) => add(P2, `다음 문장을 읽고, 두 사건 중 먼저 일어난 일을 고르시오.\n\n${s}`, String(ans), [a, b]);
first('Her mother asked her to peel the carrots that had become soft.', 'Her mother asked her to peel the carrots.', 'The carrots became soft.', 2);
first("I remembered I had left my textbooks in Grandma's car.", "I left my textbooks in Grandma's car.", 'I remembered what I did.', 1);
first('Everyone was surprised at what Gansong had done.', 'Everyone was surprised.', 'Gansong did something.', 2);
first('The rabbits had less to eat because the deer had eaten their food.', "The deer ate the rabbit's food.", 'The rabbits had less to eat.', 1);
first('When our food came out, it was not what we had expected.', 'Our food came out.', 'We expected our food.', 2);
// Part 3: 시제 고르기 (8)
const tense = (s, choices, ansIdx) => add(P2, `알맞은 시제를 고르시오.\n\n${s}`, String(ansIdx), choices);
tense('He (has read / had read) that book before he arrived there.', ['has read', 'had read'], 2);
tense('He often (came / had come) to see me when he was in Seoul.', ['came', 'had come'], 1);
tense('I (had finished / have finished) my homework when she visited me.', ['had finished', 'have finished'], 1);
tense('Amy told me that she (had paid / will pay) the bill.', ['had paid', 'will pay'], 1);
tense('(Did / Had) you met her before I visited you?', ['Did', 'Had'], 2);
tense('She sent me a digital camera that she (has / had) bought in Hong Kong.', ['has', 'had'], 2);
tense('I had to take a taxi because the last bus (left / had left).', ['left', 'had left'], 2);
tense('When I got there, the bus (has been leaving / had left) already.', ['has been leaving', 'had left'], 2);
// Part 4: 괄호 동사 알맞은 형태 (5) — subParts
const verbs = (ko, s, parts) => add(P2, `괄호 안의 동사를 알맞은 형태로 써서 우리말에 맞는 문장을 완성하시오.\n\n${ko}\n→ ${s}`, parts.join(' / '), null, { subParts: sp(parts) });
verbs('Sarah가 파티에 도착했을 때, Paul은 이미 집에 가고 없었다.', 'When Sarah (1)(arrive) at the party, Paul (2)(go, already) home.', ['arrived', 'had already gone']);
verbs('우리가 집에 도착했을 때, 아이들은 먼저 잠들어 있었다.', 'When we (1)(get) home, the children (2)(fall) asleep.', ['got', 'had fallen']);
verbs('우리가 극장에 도착했을 때, 모든 표가 이미 다 팔렸다.', 'When we (1)(arrive) at the theater, all the tickets (2)(be, sell).', ['arrived', 'had been sold']);
verbs('내가 공항에 도착했을 때 비행기는 이미 이륙해 있었다.', 'The plane (1)(already, take off) when I (2)(get) to the airport.', ['had already taken off', 'got']);
verbs('내가 선생님이 되기 전에 그는 학생들을 가르쳤다.', 'He (1)(teach) the students before I (2)(become) a teacher.', ['had taught', 'became']);
// Part 5: 과거 또는 과거완료 (10)
const pop = (s, ans, acc) => add(P2, `괄호 안의 동사를 과거시제 또는 과거완료 시제로 알맞게 바꾸어 쓰시오.\n\n${s}`, ans, null, acc ? { acceptedAnswers: acc } : {});
pop('I found my wallet that I (lose) a month ago.', 'had lost');
pop('When we got home, the children (fall) asleep.', 'had fallen');
pop('They (already, leave) the restaurant before I got there.', 'had already left', ['already left']);
pop('John had an upset stomach after he (eat) too much.', 'ate', ['had eaten']);
pop('I couldn\'t buy a gift for my sister because I (spend) all my money.', 'had spent');
pop("I didn't know who she was. I (never, see) her before.", 'had never seen');
pop('When Sarah arrived at the party, Paul (already, go) home.', 'had already gone');
pop('It had begun to rain when I (step) out of the house.', 'stepped');
pop('When I reached the bus stop, the bus (already, leave) the bus stop.', 'had already left');
pop('I was very excited since I (never, be) to Dokdo before.', 'had never been');
// Part 6: 박스 단어 (6) — 5지선다
const B6a = ['after', 'already', 'before', 'for', 'just'];
const B6b = ['after', 'before', 'already', 'just', 'since'];
const box = (s, opts, ansIdx, acc) => add(P2, `빈칸에 알맞은 말을 고르시오.\n\n${s}`, String(ansIdx), opts, acc ? { acceptedAnswers: acc } : {});
box('This evening, I had __________ finished my homework by 6 p.m.', B6a, 2);
box('I watched TV __________ we had finished dinner.', B6a, 1);
box('I had __________ switched the light off when I bumped into the wall.', B6a, 5);
box('Helen went to bed __________ she had watched her favorite TV program.', B6b, 1);
box('The patient had died __________ the doctor arrived.', B6b, 2);
box('You should have come ten minutes earlier, we had __________ finished breakfast.', B6b, 4);
// Part 7: 용법 (6) — 경험/계속/완료/결과
const USE = ['경험', '계속', '완료', '결과'];
const usage = (s, a) => add(P2, `밑줄 친 과거완료의 용법을 고르시오.\n\n${s}`, String(a), USE);
usage('I <u>had studied</u> English for three years before I entered school.', 2);
usage('When I arrived at the theater, the movie <u>had already started</u>.', 3);
usage('I <u>had never seen</u> a beautiful beach before I went to Hawaii.', 1);
usage("He <u>had lost</u> his key, so he couldn't open the locker.", 4);
usage('When the bears got home, they found somebody <u>had turned</u> on the TV.', 3);
usage('My sister was very excited since she <u>had never been</u> to Jeju Island before.', 1);
// Part 8: 오류 수정 (8)
fix(P2, "Mike didn't want to see the movie because he already sees it.", "Mike didn't want to see the movie because he had already seen it.");
fix(P2, 'I have already finished my homework when he came in.', 'I had already finished my homework when he came in.');
fix(P2, 'She lost the doll yesterday that my mom has made for her.', 'She lost the doll yesterday that my mom had made for her.');
fix(P2, 'He had a stomachache because he has eaten much pizza.', 'He had a stomachache because he had eaten much pizza.');
fix(P2, 'He has to take a long journey and worried about the gold coins he had saved for years.', 'He had to take a long journey and worried about the gold coins he had saved for years.');
fix(P2, 'My dog has died two weeks ago. I was very sad.', 'My dog had died two weeks ago. I was very sad.');
fix(P2, 'When the police arrived, the thieves had already ran away.', 'When the police arrived, the thieves had already run away.');
fix(P2, 'By the time he gets to the party, everyone had already begun dancing.', 'By the time he got to the party, everyone had already begun dancing.');
// Part 9: 단어 배열 (5)
const order2 = (ko, words, ans) => add(P2, `다음 단어들을 알맞은 순서로 배열하여 우리말에 맞는 문장을 쓰시오.${FULL}\n\n${ko}\n${words}`, ans, null);
order2('내가 거기에 도착했을 때, 버스는 이미 떠나버렸다.', '(got, I, when, there), (had, left, bus, the, already)', 'When I got there, the bus had already left.');
order2('내가 외출하기 전에 비가 이미 그쳤다.', '(rain, already, had, stopped, the) (out, before, I, went)', 'The rain had already stopped before I went out.');
order2('남동생과 나는 아버지가 사 주신 케이크를 먹었다.', '(bought, Dad, and, cake, my brother, for, I, the, ate, had, us)', 'My brother and I ate the cake Dad had bought for us.');
order2('집에 도착했을 때 나는 누군가가 우유를 마신 것을 알았다.', '(home, I, got, when), (drunk, somebody, found, milk, had, the, I)', 'When I got home, I found somebody had drunk the milk.');
order2('우리는 그 모든 돈이 어디로 갔는지 알아낼 수가 없었다.', "(money, out, all, find, gone, we, the, couldn't, had, where)", "We couldn't find out where all the money had gone.");
// Part 10: 영작 (5)
const trans2 = (ko, hint, ans, acc) => add(P2, `다음 문장을 주어진 단어를 활용하여 영작하시오. (과거시제와 과거완료가 모두 가능할 경우 과거완료를 사용할 것)${FULL}\n\n${ko}\n[단어: ${hint}]`, ans, null, acc ? { acceptedAnswers: acc } : {});
trans2('나는 그녀가 그 영화를 보았다는 것을 알았다.', 'know, that, see, the movie', 'I knew that she had seen the movie.');
trans2('그 토크 쇼는 내가 TV를 틀기 전에 이미 시작했다.', 'talk show, turn on', 'The talk show had already started before I turned on the TV.');
trans2('나는 우산을 지하철에 두고 왔다는 것을 깨달았다.', 'find, that, leave', 'I found that I had left my umbrella in the subway.');
trans2('남동생이 내 MP3 플레이어를 망가뜨려서 나는 남동생에게 소리를 질렀다.', 'shout, break', 'I shouted at my brother because he had broken my MP3 player.');
trans2('내가 학교에 갔을 때, 나는 숙제를 집에 두고 왔었다는 것이 생각났다.', 'get, remember, leave', 'When I got to school, I remembered I had left my homework at home.', ['When I got to school, I remembered that I had left my homework at home.']);

const out = process.argv[2];
writeFileSync(out, JSON.stringify({ P1, P2 }, null, 2));
console.log('P1', P1.length, 'P2', P2.length);
