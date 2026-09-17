// 중3 능률김 5~6과 학교 기출 1~4회 — OMR 모드 스텁 (PDF 그대로, 정답표만)
import fs from 'fs';
const C = ['①','②','③','④','⑤'];
const sets = {};
let cur;
function set(k){ cur = sets[k] = []; }
function m(question, answer){ cur.push({ number: cur.length+1, question, options: C, answer: String(answer) }); }
function s(question, answer, extra={}){ cur.push({ number: cur.length+1, question, options: [], answer, ...extra }); }
// subParts + 라벨 포함 전체 답안("(A) x (B) y", "(A) x, (B) y")도 인정 — 구분자(/) 없이 라벨만 쓴 학생 대비
const sp = (...parts) => ({
  subParts: parts.map(([label, answer, acc]) => ({ label, answer, ...(acc ? { acceptedAnswers: acc } : {}) })),
  acceptedAnswers: [parts.map(([l, a]) => l + ' ' + a).join(' '), parts.map(([l, a]) => l + ' ' + a).join(', ')],
});

// ───────── 1회 (30문항: 선택 20 / 서술 10)
set('R1');
m('[대화] 빈칸에 들어갈 말로 가장 적절한 것은? (plastic bags / reusable bags)', 3);
m('[대화] (A)~(C)를 흐름에 맞게 배열한 것은? (photo contest)', 4);
m('[대화] 읽고 답할 수 없는 질문은? (a new bag made of corn)', 2);
m('[대화] ⓐ~ⓔ 중 어법상 어색한 것은? (sheep park)', 2);
m('우리말을 영어로 옮긴 것으로 가장 적절한 것은? (롤러코스터를 타는 것은 Tom에게 무섭다.)', 3);
m('ⓐ~ⓕ 중 어법상 옳은 것만을 있는 대로 고른 것은? (It is ~ of/for + to부정사)', 3);
m('빈칸 (A)~(D)에 들어갈 말로 가장 적절한 것은? (which / where)', 4);
m('우리말을 영어로 바꿔 쓴 것이 옳은 것은? (관계부사)', 4);
m('[대화] 빈칸에 들어갈 말로 가장 적절한 것은? (refund / receipt)', 1);
m('[10~11 Ask Your Neighbors] 밑줄 친 ⓐ~ⓔ 중 어법상 어색한 것은?', 3);
m('[10~11 Ask Your Neighbors] 윗글의 내용과 일치하는 것을 <보기>에서 고른 것은?', 1);
m('[대화] 내용과 일치하지 않는 것은? (elevator / stairs)', 3);
m('[13~14 Via Verde] 윗글의 주제로 가장 적절한 것은?', 4);
m('[13~14 Via Verde] 주어진 문장이 들어가기에 가장 적절한 곳은? (Moreover, the watering system ~)', 5);
m('[15~18 Cancun] 윗글의 ⓐ~ⓓ 중 어법상 옳은 것을 고른 것은?', 4);
m('[15~18 Cancun] 윗글의 내용과 일치하는 것을 <보기>에서 고른 것은?', 1);
s('[15~18 Cancun] Q: Why did the artists make an underwater museum near Cancun? — 우리말로 쓰시오.',
  '관광 활동들이 Cancun 인근의 바다 일부를 심각하게 훼손하고 있기 때문에',
  { acceptedAnswers: ['관광 활동이 Cancun 근처의 바다 일부를 심각하게 훼손하고 있기 때문에','관광객들의 활동이 바다를 심각하게 훼손하고 있기 때문에','죽어가는 해양 영역이 회복할 시간을 갖도록 관광객들을 다른 곳으로 유인하기 위해','관광객들을 바다의 다른 곳으로 유인해서 죽어가는 지역이 회복할 시간을 갖게 하려고','관광 활동이 칸쿤 근처 바다를 심각하게 훼손하고 있기 때문에'] });
s('[15~18 Cancun] Q: What do the artists want people to realize when they see sea life growing on the statues? — 우리말로 쓰시오.',
  '해양 생물이 얼마나 풍부한지 깨닫고 바다를 구하는 것이 얼마나 중요한지 이해하기를 원한다.',
  { acceptedAnswers: ['예술가들은 사람들이 조각상에서 다양한 해양 생물을 보고 해양 생태계가 얼마나 풍부한지 깨닫기를 원한다.','바다를 구하는 것이 얼마나 중요한지 깨닫기를 원한다.','해양 생물이 얼마나 풍부한지','바다를 구하는 것이 얼마나 중요한지','해양 생물이 얼마나 풍부한지 깨닫기를 원한다.','바다를 지키는 것이 얼마나 중요한지 이해하기를 원한다.'] });
m('[19~21 Singapore] 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?', 3);
m('[19~21 Singapore] 윗글을 읽고 대답할 수 있는 질문만을 <보기>에서 고른 것은?', 3);
s('[19~21 Singapore] ⓐ의 우리말(외부 공기가 건물 전체를 통해 움직일 수 있게 해 준다)을 <조건>에 맞게 영어로 쓰시오. (throughout, possible, a, outside, building)',
  'makes it possible for outside air to move throughout a building',
  { acceptedAnswers: ['This structure makes it possible for outside air to move throughout a building.','makes it possible for outside air to move throughout the building'] });
m('[22~25 dog sitter] 윗글의 목적으로 가장 적절한 것은?', 2);
m('[22~25 dog sitter] 윗글의 내용과 일치하는 것은?', 5);
s('[22~25 dog sitter] Q: What experience has the dog sitter gained after her dog died? — 한 문장의 영어로 쓰시오.',
  'She has provided dog sitting services since her dog died.',
  { acceptedAnswers: ['She has provided dog sitting services since then.','She has provided dog sitting services.','The dog sitter has provided dog sitting services since her dog died.','She has provided dog sitting services since her dog died two years ago.'] });
s('[22~25 dog sitter] Q: Why is this dog sitter\'s home good for dogs? — 한 문장의 영어로 쓰시오.',
  'Her home is good for dogs because it is close to a dog park where they can run around.',
  { acceptedAnswers: ['Because it is close to a dog park where dogs can run around.','Because she lives in a large house located close to a dog park where dogs can run around.','It is located close to a dog park where dogs can run around.','Because it is a large house located close to a dog park where the dogs can run around.'] });
s('분사구문을 사용하여 영작하시오. (1) 길을 걸으면서, 나는 유명한 영화배우를 봤다. (street, see, movie star) (2) 매우 바빴기 때문에, 그녀는 모임에 참석할 수 없었다. (busy, join, meeting)',
  'Walking down the street, I saw a famous movie star. / Being very busy, she couldn\'t join the meeting.',
  sp(['(1)','Walking down the street, I saw a famous movie star.',['Walking along the street, I saw a famous movie star.','Walking on the street, I saw a famous movie star.']],
     ['(2)','Being very busy, she couldn\'t join the meeting.',['Being very busy, she could not join the meeting.']]));
s('두 문장을 관계부사를 사용하여 한 문장으로 바꿔 쓰시오. (The town is beautiful. The famous pianist lives there.)',
  'The town where the famous pianist lives is beautiful.');
s('두 문장을 관계부사를 사용하여 한 문장으로 바꿔 쓰시오. (I\'ll never forget the day. I left my hometown on the day.)',
  'I\'ll never forget the day when I left my hometown.',
  { acceptedAnswers: ['I will never forget the day when I left my hometown.'] });
s('그림 설명 문장을 <조건>에 맞게 서술하시오. (the earth, warm, the ice, melt, fast — ~하면 할수록, 더 ~하다)',
  'The warmer the earth gets, the faster the ice melts.',
  { acceptedAnswers: ['The warmer the earth is, the faster the ice melts.','The warmer the earth becomes, the faster the ice melts.'] });
s('그림 설명 문장을 <조건>에 맞게 서술하시오. (you, read, book, smart — ~하면 할수록, 더 ~하다)',
  'The more books you read, the smarter you are.',
  { acceptedAnswers: ['The more books you read, the smarter you become.','The more books you read, the smarter you get.','The more books you read, the smarter you will be.'] });

// (구 2회는 7과 문항 8개 포함으로 사장님 지시에 따라 삭제 — 2026-09-17)

// ───────── 2회 (구 3회, 26문항 전 선택형)
set('R2');
m('빈칸에 공통으로 들어갈 단어로 가장 적절한 것은? (단어 프린트)', 4);
m('[대화] ⓐ~ⓔ 중 대화의 흐름상 어색한 것은? (economical / on sale)', 5);
m('다음 글의 내용과 일치하는 것은? (community car sharing program)', 2);
m('[대화] 내용과 일치하는 것을 <보기>에서 있는 대로 고른 것은? (Styles Studio / Hair Castle)', 1);
m('[5~7 smart shopping] (A)에 들어갈 표현으로 적절한 것을 <보기>에서 있는 대로 고른 것은?', 3);
m('[5~7 smart shopping] 윗글의 마지막에 이어질 문장으로 적절하지 않은 것은?', 5);
m('[5~7 smart shopping] 윗글의 내용과 일치하는 것은?', 2);
m('[8~10 Ask Your Neighbors] 윗글의 (A)와 어법상 그 쓰임이 같은 것은? (Seeing)', 1);
m('[8~10 Ask Your Neighbors] ⓐ~ⓔ 중 어법상 맞는 것을 있는 대로 고른 것은?', 2);
m('[8~10 Ask Your Neighbors] 윗글의 내용과 일치하는 것은?', 1);
m('[대화] 다음 대화의 주제로 적절하지 않은 것은? (elevator / stairs)', 3);
m('[12~13 Pet Sitter Finder] 윗글의 (A)와 (B)에 들어갈 말로 가장 적절한 것은?', 1);
m('[12~13 Pet Sitter Finder] 요약문의 ⓐ~ⓔ 중 어색한 것은?', 2);
m('주어진 문장을 같은 의미의 문장으로 바꾸었을 때 어법상 맞게 쓰인 것은? (분사구문)', 4);
m('<보기>에서 어법에 맞는 문장을 있는 대로 고른 것은? (It is ~ of/for + to부정사)', 2);
m('[16~18 Via Verde] ⓐ~ⓔ에 들어갈 표현으로 적절하지 않은 것은?', 4);
m('[16~18 Via Verde] 윗글의 (A)에 들어갈 말로 가장 적절한 것은?', 2);
m('[16~18 Via Verde] 윗글을 읽고 답할 수 있는 질문을 <보기>에서 있는 대로 고른 것은?', 1);
m('밑줄 친 단어의 쓰임이 문맥상 가장 적절한 것은? (단어 프린트)', 2);
m('[20~21 Cancun] 윗글의 내용과 일치하는 것을 <보기>에서 있는 대로 고른 것은?', 2);
m('[20~21 Cancun] 윗글의 ⓐ~ⓔ가 가리키는 말로 가장 적절한 것은?', 5);
m('다음 글의 (A)와 (B)에 들어갈 말로 가장 적절한 것은? (reusable cloth bags / online learning)', 1);
m('다음 ⓐ~ⓔ에 들어갈 단어로 가장 적절한 것은? (Singapore eco-friendly buildings)', 4);
m('다음 ⓐ~ⓔ에 들어갈 단어로 가장 적절한 것은? (Antoni Gaudi)', 5);
m('[대화] ⓐ~ⓔ 중 대화의 흐름으로 보아 어색한 것은? (sheep park)', 5);
m('다음 중 어법상 맞는 문장의 개수는? (관계부사)', 4);

// ───────── 3회 (구 4회, 30문항: 선택 25 / 서술 5, 6·17 복수정답)
set('R3');
m('다음 각 단어들의 관계가 나머지와 다른 것은?', 2);
m('다음 중 영영 풀이로 옳지 않은 것은?', 3);
m('[대화] 자연스럽게 이어지도록 가장 바르게 연결한 것은? (sheep park)', 4);
m('[대화] 내용과 일치하도록 요약문의 빈칸 (A)와 (B)에 알맞은 말을 바르게 연결한 것은? (Styles Studio / Hair Castle)', 1);
m('[대화] 답을 찾을 수 없는 질문은? (a new bag made of corn)', 3);
m('[6~7 Spring Chips 대화] Sera가 만들 비디오에 들어갈 내용을 고르면? (정답 2개)', '2, 4');
s('[6~7 Spring Chips 대화] 밑줄 친 (A)의 우리말(너의 비디오는 사람들이 더 좋은 상품을 고르는 것을 더 쉽게 만들어 줄 거야)을 \'가목적어 it\'을 사용하여 영어로 완성하시오. Your video ______',
  'will make it easier for people to choose better products',
  { acceptedAnswers: ['makes it easier for people to choose better products','will make it easy for people to choose better products','makes it easy for people to choose better products','Your video will make it easier for people to choose better products.','Your video will make it easy for people to choose better products.'] });
m('주어진 문장이 들어가기에 가장 알맞은 곳은? (Why don\'t we place four different colored recycling bins ~)', 4);
m('다음 글의 내용과 일치하지 않는 것은? (environmental awareness stickers)', 4);
m('[10~12 Cancun] 윗글의 제목으로 가장 적절한 것은?', 5);
m('[10~12 Cancun] 괄호 (A), (B), (C) 안에 들어갈 적절한 말을 바르게 연결한 것은?', 1);
s('[10~12 Cancun] 밑줄 친 (가)의 우리말을 영작하시오. If people realize ⓐ ______, they will understand ⓑ ______. (ⓑ에는 가주어 it 사용)',
  'how rich sea life is / how important it is to save the sea',
  sp(['ⓐ','how rich sea life is'], ['ⓑ','how important it is to save the sea']));
m('[13~14 Singapore] 밑줄 친 부분 중 어법상 옳은 것만을 있는 대로 고른 것은?', 2);
m('[13~14 Singapore] 윗글의 주제로 가장 알맞은 것은?', 2);
m('빈칸 (A)에 공통으로 들어갈 말과 (B)에 들어갈 말로 가장 적절한 것을 바르게 연결한 것은? (works of art)', 2);
m('Hyemi의 소비 성향에 대해 그녀에게 해 줄 가장 적절한 조언은?', 5);
m('[17~18 Pet Sitter Finder] Pet Sitter Finder에 대한 내용으로 옳지 않은 것을 고르면? (정답 2개)', '3, 5');
m('[17~18 Pet Sitter Finder] 밑줄 친 부분 중 문맥상 자연스럽지 않은 것은?', 2);
m('[19~20 Ask Your Neighbors] 윗글의 내용으로 알 수 있는 것은?', 5);
m('[19~20 Ask Your Neighbors] 빈칸 (A)에 들어갈 말로 가장 적절한 것은?', 3);
m('빈칸 (A)~(C)에 들어갈 가장 적절한 단어를 바르게 연결한 것은? (Sharing economies)', 1);
m('제품을 홍보하는 글을 읽고 알 수 없는 정보는? (Upcycled Bag)', 1);
m('[23~24 Jiho·Dad 대화] 밑줄 친 ⓐ~ⓓ 중 흐름상 어색한 문장은?', 4);
s('[23~24 Jiho·Dad 대화] 밑줄 친 (A)의 문장(If people use the services more, they will improve more.)을 \'The + 비교급\'으로 시작하는 문장으로 다시 쓰시오.',
  'The more people use the services, the more they will improve.',
  { acceptedAnswers: ['The more services people use, the more they will improve.'] });
m('다음 중 밑줄 친 부분이 어법상 옳은 것은? (분사구문)', 4);
m('다음 중 어법상 옳은 것은? (It is ~ of/for + to부정사)', 5);
m('다음 중 어법상 어색한 것만을 있는 대로 고른 것은? (the 비교급, the 비교급)', 2);
m('다음 중 어법상 옳은 것만을 있는 대로 고른 것은? (관계부사)', 1);
s('밑줄 친 (A)와 (B)의 우리말을 \'분사 구문\'을 사용하여 영작하시오. (A) 우리 팀을 위해 응원하면서 (B) 승리한 것에 대해 행복해서',
  'Cheering for our team / Being happy about the win',
  sp(['(A)','Cheering for our team',['Cheering for our team,']], ['(B)','Being happy about the win',['Being happy about the win,','Being happy about the victory']]));
s('우화 \'The City Mouse and the Country Mouse\'의 내용과 일치하도록 (A), (B) 모두에 \'관계부사\'와 주어진 단어를 사용하여 문장을 완성하시오. (A) ______ (safe) (B) ______ (city)',
  'where they can be safe / why he doesn\'t like living in the city',
  sp(['(A)','where they can be safe',['where they could be safe']], ['(B)','why he doesn\'t like living in the city',['why he does not like living in the city','why he didn\'t like living in the city']]));

// ───────── 4회 (구 5회, 29문항: 선택 24 / 서술 5)
set('R4');
m('[대화] 밑줄 친 (A)에 대한 설명으로 알맞은 것은? (a new bag)', 4);
m('[2~3 trash problem] 윗글의 (A)에 들어갈 말로 가장 알맞은 것은?', 1);
m('[2~3 trash problem] 윗글의 흐름상 ⓐ~ⓔ 중 쓰임이 어색한 것은?', 5);
m('[4~5 hair salon 대화] ⓐ~ⓔ에 대한 설명으로 알맞지 않은 것은?', 4);
s('[4~5 hair salon 대화] 우리말 (A)와 같은 뜻이 되도록 <보기>의 단어로 문장을 완성하시오. It\'s important ______ ______ ______ ______ hair treatment regularly.',
  'for me to get',
  { acceptedAnswers: ['It\'s important for me to get hair treatment regularly.','It is important for me to get hair treatment regularly.'] });
m('<보기>에서 어법상 올바른 문장을 모두 고른 것은? (관계부사)', 3);
m('[7~11 Cancun] 흐름상 <보기>의 문장이 들어가기에 가장 적절한 곳은?', 1);
m('[7~11 Cancun] 윗글의 ㉠이 가리키는 것은?', 5);
m('[7~11 Cancun] 흐름상 ⓐ~ⓒ에 들어갈 말로 알맞게 짝지어진 것은?', 3);
m('[7~11 Cancun] 윗글의 내용과 일치하지 않는 것은?', 5);
s('[7~11 Cancun] 윗글의 내용과 일치하도록 <보기>의 (A)~(C)를 완성하시오. Tourist activities are seriously (A) ______ parts of the sea. So the artists want to give the dying area (B) ______ to get better by (C) ______ tourists to a different part of the sea.',
  'damaging / time / attracting',
  sp(['(A)','damaging'], ['(B)','time'], ['(C)','attracting']));
m('[12~14 Singapore] 윗글 ⓐ~ⓔ 중 우리말 뜻이 바르지 않은 것은?', 3);
m('[12~14 Singapore] 윗글을 읽고 답을 알 수 없는 것은?', 4);
s('[12~14 Singapore] 우리말 (A)와 같은 뜻이 되도록 <보기>의 단어로 문장을 완성하시오. Eco-friendly buildings like these ______ ______ help protect the environment, ______ ______ provide people with a good quality of life.',
  'not only / but also',
  sp(['(1)','not only'], ['(2)','but also']));
m('영어 단어 카드 (A)와 우리말 의미 카드 (B)를 짝 지을 때 짝을 찾을 수 없는 것은?', 5);
m('다음 중 어법상 올바른 문장은? (the 비교급, the 비교급)', 3);
m('[대화] 내용과 일치하는 것은? (elevator / stairs)', 1);
m('<보기>의 빈칸에 공통으로 들어갈 것으로 가장 적절한 것은? (sun\'s ___ / ___ of the water)', 2);
m('[19~21 Ask Your Neighbors] 윗글을 읽고 답할 수 없는 질문은?', 1);
m('[19~21 Ask Your Neighbors] 윗글 (A)에 들어갈 내용으로 어법상 가장 알맞은 것은?', 2);
m('[19~21 Ask Your Neighbors] 물건을 빌려주는 사람들에게 정기적으로 사진을 업데이트해 줄 것을 요구하는 이유로 가장 적절한 것은?', 4);
m('우리말을 영작한 것 중 어법상 가장 옳은 것은? (It is ~ of/for + to부정사)', 3);
s('<보기>의 밑줄 친 부분을 어법상 알맞은 형태로 고쳐 쓰시오. (1) bad → ______ (2) beautiful → ______ ______ ______',
  'worse / the more beautiful',
  sp(['(1)','worse'], ['(2)','the more beautiful']));
m('[24~26 Pet Sitter Finder] 흐름상 <보기>의 문장이 들어가기에 가장 적절한 곳은?', 4);
m('[24~26 Pet Sitter Finder] 윗글의 내용과 일치하는 것은?', 5);
m('[24~26 Pet Sitter Finder] 윗글의 ⓐ~ⓔ 중 어법상 어색한 것은?', 2);
m('[27~28 Son·Dad 대화] 위 대화의 주제로 가장 알맞은 것은?', 2);
m('[27~28 Son·Dad 대화] 흐름상 (A)~(C)에 들어갈 말로 알맞게 짝지어진 것은?', 1);
s('<보기>의 문장을 분사구문을 사용하여 같은 의미로 영작하시오. (1) ______ ______, I hurt my leg. (2) ______ ______ ______, I felt relieved.',
  'Playing baseball / Finding my wallet',
  sp(['(1)','Playing baseball'], ['(2)','Finding my wallet']));

for (const [k, arr] of Object.entries(sets)) console.log(k, arr.length, 'MCQ', arr.filter(q=>q.options.length).length, '서술', arr.filter(q=>!q.options.length).length);
fs.writeFileSync(new URL('./ne3-l56-gichul.json', import.meta.url), JSON.stringify(sets, null, 1));
