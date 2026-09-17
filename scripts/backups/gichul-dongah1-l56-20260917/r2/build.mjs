import fs from 'fs';
const meta = JSON.parse(fs.readFileSync(new URL('./meta.json', import.meta.url), 'utf8'));
const C = ['①','②','③','④','⑤'];
const mcq = [
  ['다음 글을 읽고 이어질 내용으로 가장 알맞은 것은? (Mona Lisa 목격자)', 1],
  ['[2 미술관 대화] 위 대화를 읽고 답할 수 없는 질문은?', 4],
  ['빈칸에 들어갈 단어에 해당되지 않는 것은? (matter / gift / examined / century)', 5],
  ['단어와 의미가 옳게 연결된 것만을 <보기>에서 있는 대로 고른 것은?', 3],
  ['우리말로 된 문장을 영어로 옮겼을 때, 옳지 않은 것은?', 2],
  ['<보기>의 단어와 관련이 없는 영영 풀이는? (recycle / produce / leftover / container / in return)', 5],
  ['다음 표에 대한 설명으로 옳은 문장은? (Robot A·B·C 비교)', 1],
  ['어법상 옳지 않은 문장은? (There is/are)', 3],
  ['원급, 비교급, 최상급 형태가 옳지 않은 것은?', 1],
  ['[10~14 Mona Lisa 목격자] 밑줄 친 ⓐ~ⓔ 중 어법상 옳은 것은?', 4],
  ['[10~14 Mona Lisa 목격자] 밑줄 친 ①~⑤ 중 가리키는 대상이 나머지 넷과 다른 것은?', 2],
  ['[10~14 Mona Lisa 목격자] 빈칸 (A)에 들어갈 단어에 대한 영영 풀이로 가장 옳은 것은?', 2],
  ['[10~14 Mona Lisa 목격자] 문장을 True(T), False(F)로 옳게 표시한 것은?', 2],
  ['[10~14 Mona Lisa 목격자] 빈칸 ㉠~㉢에 들어갈 말이 순서대로 옳게 짝지어진 것은?', 3],
  ['수민이의 일기 내용 중 밑줄 친 단어의 형태가 옳은 것만을 고른 것은? (과거형)', 4],
  ['[16~17 plogging 대화] (A)~(E) 중 주어진 문장이 들어갈 알맞은 곳은? (So you\'re a member of a plogging club.)', 3],
  ['[16~17 plogging 대화] 위 대화의 내용과 일치하는 것은?', 4],
  ['<보기>(She needs to buy new clothes.)의 밑줄 친 부분의 역할과 같은 것을 고른 것은?', 5],
  ['명령문의 빈칸에 들어갈 말이 나머지 넷과 다른 하나는?', 1],
  ['어법상 옳은 것은? (과거시제)', 1],
  ['다음 문장의 밑줄 친 that과 쓰임이 같은 것은? (I think that he is honest.)', 5],
];
const subj = [
  ['[서답형 1] 위 대화의 밑줄 친 (A)(그것의 사진을 찍어도 될까요?)를 <조건>에 맞게 영작하시오. (7단어, of·it 포함, 허가 표현) → ______?', 'May I take a picture of it?', { acceptedAnswers: ['Can I take a picture of it?', 'Could I take a picture of it?'] }],
  ['[서답형 2] 주어진 단어를 활용하여 금지하는 문장을 <조건>에 맞게 쓰시오. 2-1. 당신은 여기서 통화하면 안 됩니다. (must, talk / 8단어) 2-2. 당신은 어떤 음식도 실내에 가지고 들어갈 수 없습니다. (must, bring / 7단어)', 'You must not talk on the phone here. / You must not bring any food inside.', { subParts: [{ label: '2-1', answer: 'You must not talk on the phone here.', acceptedAnswers: ["You mustn't talk on the phone here."] }, { label: '2-2', answer: 'You must not bring any food inside.', acceptedAnswers: ["You mustn't bring any food inside."] }] }],
  ['[서답형 3] 윗글을 읽고 다음 질문에 알맞은 답을 영어로 쓰시오. (9단어의 완전한 문장) Q: What did Diego find next to the wheelchair?', 'He found a cake box next to the wheelchair.', { acceptedAnswers: ['Diego found a cake box next to the wheelchair.'] }],
  ['[서답형 4] 주어진 문장을 명령문으로 바꿔 쓰시오. 4-1. You are kind to your friends. 4-2. You do not worry about that.', "Be kind to your friends. / Don't worry about that.", { subParts: [{ label: '4-1', answer: 'Be kind to your friends.' }, { label: '4-2', answer: "Don't worry about that.", acceptedAnswers: ['Do not worry about that.'] }] }],
  ['[서답형 5] 우리말과 의미가 같도록 괄호 안의 단어를 사용하여 영어로 쓰시오. 5-1. 나는 세상에서 제일 행복한 사람입니다. (person) 5-2. 수학이 모든 과목 중에서 제일 어렵다. (math)', 'I am the happiest person in the world. / Math is the most difficult of all subjects.', { subParts: [{ label: '5-1', answer: 'I am the happiest person in the world.', acceptedAnswers: ["I'm the happiest person in the world."] }, { label: '5-2', answer: 'Math is the most difficult of all subjects.', acceptedAnswers: ['Math is the most difficult subject of all.', 'Math is the most difficult of all the subjects.'] }] }],
  ['[서답형 6] 우리말과 의미가 같도록 영어로 쓰시오. 6-1. 지난 수요일 그들은 그들의 숙제를 하지 않았다. 6-2. 그녀는 어제 그녀의 방을 청소했나요?', "They didn't do their homework last Wednesday. / Did she clean her room yesterday?", { subParts: [{ label: '6-1', answer: "They didn't do their homework last Wednesday.", acceptedAnswers: ["Last Wednesday, they didn't do their homework.", "They did not do their homework last Wednesday."] }, { label: '6-2', answer: 'Did she clean her room yesterday?', acceptedAnswers: ['Yesterday, did she clean her room?'] }] }],
  ['[서답형 7] <보기>의 단어들(she / that / know / you / English / speak / well)을 바르게 배열하여 문장을 완성하시오. (일부 단어는 형태 변형)', 'She knows that you speak English well.', {}],
  ["[서답형 8] 그림을 보고 '~(들)이 있다'의 의미를 가진 문장을 완성하시오. (그림: 벽에 시계 하나, 침대 위에 책 세 권) 8-1. (clock) There ______ 8-2. (book) There ______", 'There is a clock on the wall. / There are three books on the bed.', { subParts: [{ label: '8-1', answer: 'There is a clock on the wall.', acceptedAnswers: ['is a clock on the wall', 'is a clock on the wall.'] }, { label: '8-2', answer: 'There are three books on the bed.', acceptedAnswers: ['are three books on the bed', 'are three books on the bed.'] }] }],
];
const questions = [
  ...mcq.map(([q, a], i) => ({ number: i + 1, question: q, options: C, answer: String(a) })),
  ...subj.map(([q, a, extra], i) => ({ number: mcq.length + i + 1, question: q, options: [], answer: a, ...extra })),
];
fs.writeFileSync(new URL('./omr.json', import.meta.url), JSON.stringify({ R2: { pdf_url: meta.pdf, questions } }, null, 1));
console.log(questions.length, '문항 / MCQ', mcq.length, '/ 서답형', subj.length);
