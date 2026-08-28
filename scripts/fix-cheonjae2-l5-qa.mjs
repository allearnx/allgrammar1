// 중2 천재소 5과 문법 19시트 QA 수정 — 2026-08-28 검수 (🔴 0건, 🟡/⚪ 보강)
// 사용: node scripts/fix-cheonjae2-l5-qa.mjs [--apply]
// 백업: scripts/backups/cheonjae2-l5-backup-20260828.json
import fs from 'fs';

const APPLY = process.argv.includes('--apply');
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const URL = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const UNIT = '7b92d837-65eb-4e76-874b-79ca91b908bb';

let fails = 0;
const must = (c, m) => { if (!c) { console.error('  ✗', m); fails++; } };
function sub(q, o, n, tag) {
  const p = q.question.split(o);
  must(p.length === 2, `${tag}: 대상 1회 존재해야 함 (${p.length - 1}회): ${o.slice(0, 40)}`);
  if (p.length === 2) q.question = p.join(n);
}
function wrapU(q, phrase, tag) { sub(q, phrase, `<u>${phrase}</u>`, tag); }
function subOpt(q, idx, o, n, tag) {
  must(q.options?.[idx] === o, `${tag}: options[${idx}] 불일치 (실제: ${String(q.options?.[idx]).slice(0, 50)})`);
  if (q.options?.[idx] === o) q.options[idx] = n;
}
function endQ2Dot(q, tag) {
  must(q.question.endsWith('?'), `${tag}: '?'로 끝나야 함`);
  if (q.question.endsWith('?')) q.question = q.question.slice(0, -1) + '.';
}
const addAcc = (q, arr) => { q.acceptedAnswers = [...new Set([...(q.acceptedAnswers || []), ...arr])]; };

const sheets = await (await fetch(`${URL}/rest/v1/naesin_problem_sheets?select=id,title,questions,answer_key&unit_id=eq.${UNIT}&order=created_at`, { headers: H })).json();
must(sheets.length === 19, `시트 19개여야 함 (${sheets.length})`);
fs.mkdirSync('scripts/backups', { recursive: true });
const bak = 'scripts/backups/cheonjae2-l5-backup-20260828.json';
if (!fs.existsSync(bak)) fs.writeFileSync(bak, JSON.stringify(sheets, null, 1));
const Q = (si, n) => sheets[si - 1].questions[n - 1];
// 시트 순서(생성순): 1~5=2단계 1~5, 6~9=주관식 1~4, 10~19=1단계 1~10
must(sheets[6].title === '5과 문법 주관식 (2/4)', '시트 순서 확인: ' + sheets[6].title);

// [1] 2단계(1/5) Q22: 정답 선지에만 있는 <u>가 정답 노출 힌트 — 제거
subOpt(Q(1, 22), 2, 'The exam made me <u>nervous</u>.', 'The exam made me nervous.', 's1 Q22');
// [2] 2단계(2/5) Q29: 밑줄 친 우리말에 <u> 부착
wrapU(Q(2, 29), '무엇이 좋은 지도자를 만드는지', 's2 Q29');
// [3] 2단계(3/5) Q17: ④ 결합 결과가 의문문인데 마침표
subOpt(Q(3, 17), 3, 'Can I ask you? + How old is she? → Can I ask you how old she is.', 'Can I ask you? + How old is she? → Can I ask you how old she is?', 's3 Q17');
// [6] 주관식(1/4) Q30: 밑줄 친 우리말에 <u>
wrapU(Q(6, 30), '그것이 저를 정말 슬프게 만들었어요.', 's6 Q30');
// [7] 주관식(2/4) Q4: 분류 순서 기준 명시
sub(Q(7, 4), '다음 문장의 밑줄 친 부분의 쓰임이 같은 것 끼리 두 가지로 분류하시오.',
  "다음 문장의 밑줄 친 부분의 쓰임이 같은 것끼리 두 가지로 분류하시오. ※ (1)에는 '~을 …하게 만들다'(make+목적어+보어), (2)에는 '~에게 …을 만들어 주다'(make+사람+사물) 문장의 기호를 쓰시오.", 's7 Q4');
// [7] Q15·Q16: 평서문/명령문인데 물음표로 끝남
endQ2Dot(Q(7, 15), 's7 Q15'); endQ2Dot(Q(7, 16), 's7 Q16');
// [8] 주관식(3/4) Q8: 예시를 따라 이름을 쓴 답 인정
addAcc(Q(8, 8), ['if Sam finished his homework yesterday', 'whether Sam finished his homework yesterday']);
// [9] 주관식(4/4) — 밑줄 (1)(2)(3) 구간 <u> 부착
wrapU(Q(9, 1), 'when happened it', 's9 Q1-1');
wrapU(Q(9, 1), 'what the man wearing was', 's9 Q1-2');
wrapU(Q(9, 1), 'what was the man doing', 's9 Q1-3');
wrapU(Q(9, 12), '네가 이곳에서 무엇을 먹는지', 's9 Q12-1');
wrapU(Q(9, 12), '이해할 수 없을 것이다', 's9 Q12-2');
wrapU(Q(9, 18), 'I don\'t mind what are they going to think.', 's9 Q18-1');
wrapU(Q(9, 18), 'Now I want to find what can I be.', 's9 Q18-2');
wrapU(Q(9, 23), '당신은 그가 누구라고 생각했었나요?', 's9 Q23-1');
wrapU(Q(9, 23), '당신은 무슨 일이 일어났었는지 알아요?', 's9 Q23-2');
wrapU(Q(9, 24), '그 남자가 무엇을 들고 있었는지 기억나요?', 's9 Q24-1');
wrapU(Q(9, 24), '그 남자가 무엇을 하고 있었는지 제게 말씀해주시겠어요?', 's9 Q24-2');
// [9] Q26: 대명사/명사 교차 조합 인정
addAcc(Q(9, 26), [
  '(1) who he is (2) what subject he teaches',
  '(1) who he is (2) what subject Mr. Kim teaches',
  '(1) who that man is (2) what subject Mr. Kim teaches',
  '(1) who that man is (2) what subject he teaches',
  '(1) who the man is (2) what subject he teaches',
]);
// [10] 1단계(1/10) Q20~23: 입력형인데 '밑줄 치시오' 지시
for (const n of [20, 21, 22, 23]) sub(Q(10, n), '목적어와 목적격 보어를 찾아 밑줄 치시오.', '목적어와 목적격 보어를 찾아 쓰시오.', `s10 Q${n}`);
// [11] 1단계(2/10) Q15: 지시문 누락
must(!Q(11, 15).question.includes('괄호 안에서'), 's11 Q15 지시문 없음 확인');
Q(11, 15).question = '괄호 안에서 알맞은 것을 골라 쓰시오.\n\n' + Q(11, 15).question;
// [12] 1단계(3/10) Q19: 보어 구 전체를 쓴 답 인정
addAcc(Q(12, 19), ['captain of the season, 명사']);
// [13] 1단계(4/10) Q21: '기쁘게' = glad도 인정
addAcc(Q(13, 21), ['Birthday gifts make us glad']);
// [14] 1단계(5/10): 동등 표현 인정 + 문장부호
addAcc(Q(14, 8), ['where you come from']);
sub(Q(14, 10), 'Do you know ________________________________.', 'Do you know ________________________________?', 's14 Q10');
addAcc(Q(14, 12), ['what food he likes', 'what he likes']);
addAcc(Q(14, 14), ['where she comes from']);
// [16] 1단계(7/10) Q18: 의문문 마침표
sub(Q(16, 18), '• Can you tell me.', '• Can you tell me?', 's16 Q18');
// [17] 1단계(8/10) Q25: 명사구 유지 답 인정
addAcc(Q(17, 25), ['where my brother is']);
// [19] 1단계(10/10) Q16: 관사 변형 인정
addAcc(Q(19, 16), ['Do you know why the researchers sent me to the Moon?']);

console.log(fails ? `✗ assert 실패 ${fails}건 — 중단` : '✓ 모든 assert 통과');
if (fails) process.exit(1);
if (!APPLY) { console.log('(dry-run)'); process.exit(0); }
const changed = [1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19];
for (const si of changed) {
  const s = sheets[si - 1];
  const r = await fetch(`${URL}/rest/v1/naesin_problem_sheets?id=eq.${s.id}`, {
    method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' },
    body: JSON.stringify({ questions: s.questions, answer_key: s.answer_key }),
  });
  console.log(s.title, r.status === 204 ? '✓' : `✗ ${r.status} ${await r.text()}`);
}
