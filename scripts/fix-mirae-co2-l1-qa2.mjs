// 미래엔 공통영어2 1과 문법 시트 QA 2차(적대적 검토) 수정 — 2026-08-26
// 사용: node scripts/fix-mirae-co2-l1-qa2.mjs [--apply]
import fs from 'fs';

const APPLY = process.argv.includes('--apply');
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const URL = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const UNIT = 'cd9a66ab-ad59-473b-958d-4c2c0b2502a9';
const B = (n) => Array.from({ length: n }, () => '_____________').join(' ');
let fails = 0;
const must = (c, m) => { if (!c) { console.error('  ✗', m); fails++; } };
function sub(q, o, n, tag) {
  const p = q.question.split(o);
  must(p.length === 2, `${tag}: 대상 1회 존재해야 함 (${p.length - 1}회)`);
  if (p.length === 2) q.question = p.join(n);
}
const addAcc = (q, arr) => { q.acceptedAnswers = [...new Set([...(q.acceptedAnswers || []), ...arr])]; };

const sheets = await (await fetch(`${URL}/rest/v1/naesin_problem_sheets?select=id,title,questions,answer_key&unit_id=eq.${UNIT}&order=created_at`, { headers: H })).json();
const s6 = sheets[5];
must(s6.title === '1과 문법 (6/6)', 's6 제목 확인: ' + s6.title);
const Q = (n) => s6.questions[n - 1];

// Q5/7/8: 배열 세트 교차 배정도 자연스러워 상호 인정 (채점은 문항별 독립)
addAcc(Q(5), ['She had been studying for two hours']);
addAcc(Q(7), ['She had been feeling tired all day']);
addAcc(Q(8), ['She had been studying for two hours']);

// Q10: 'Three lion cubs have been saved' = 6단어 — 보기에 lion 추가 + 앞 빈칸 5→6
sub(Q(10), '[보기] three, cub, save, have, keep, illegally', '[보기] three, lion, cub, save, have, keep, illegally', 'Q10 보기');
sub(Q(10), `${B(5)} after`, `${B(6)} after`, 'Q10 빈칸');

// Q11: 'I had passed my teenage years' = 6단어 — 빈칸 5→6 (3+2 레이아웃을 3+3으로)
sub(Q(11), `where ${B(3)} \n${B(1)}  ${B(1)}.`, `where ${B(3)}\n${B(3)}.`, 'Q11 빈칸');

// Q14: 'I noticed that the cut had closed up' = 8단어 — 빈칸 7→8
sub(Q(14), `A short while later, ${B(7)}.`, `A short while later, ${B(8)}.`, 'Q14 빈칸');

// Q15: 'I was glad to learn that he had made it' = 10단어 — 빈칸 9→10 (7+2→7+3)
sub(Q(15), `${B(7)}\n${B(2)}.`, `${B(7)}\n${B(3)}.`, 'Q15 빈칸');

console.log(fails ? `✗ assert 실패 ${fails}건 — 중단` : '✓ 모든 assert 통과');
if (fails) process.exit(1);
if (!APPLY) { console.log('(dry-run)'); process.exit(0); }
const r = await fetch(`${URL}/rest/v1/naesin_problem_sheets?id=eq.${s6.id}`, {
  method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' },
  body: JSON.stringify({ questions: s6.questions, answer_key: s6.answer_key }),
});
console.log(s6.title, r.status === 204 ? '✓ 반영' : `✗ ${r.status} ${await r.text()}`);
