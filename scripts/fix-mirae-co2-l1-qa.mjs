// 미래엔 공통영어2 1과 문법 시트(1/6~6/6) QA 수정 스크립트 — 2026-08-26 검수
// 사용: node scripts/fix-mirae-co2-l1-qa.mjs         (dry-run)
//       node scripts/fix-mirae-co2-l1-qa.mjs --apply (실제 반영)
// 백업: scripts/backups/mirae-co2-l1-backup-20260826.json
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
let assertFails = 0;
function must(cond, msg) { if (!cond) { console.error('  ✗ ASSERT FAIL:', msg); assertFails++; } }

/** question 안의 old를 정확히 1회 치환 (0회/2회면 assert 실패) */
function sub(q, oldStr, newStr, tag) {
  const parts = q.question.split(oldStr);
  must(parts.length === 2, `${tag}: "${oldStr.slice(0, 50)}" 1회 존재해야 함 (${parts.length - 1}회)`);
  if (parts.length === 2) q.question = parts.join(newStr);
}
function underline(q, pairs, tag) {
  for (const [marker, phrase] of pairs) sub(q, marker + phrase, `${marker}<u>${phrase}</u>`, `${tag} ${marker}`);
}
function setAnswer(sheet, idx, oldA, newA, tag) {
  const q = sheet.questions[idx];
  must(String(q.answer) === oldA, `${tag}: answer가 "${oldA}"여야 함 (실제 "${q.answer}")`);
  q.answer = newA;
  const ak = sheet.answer_key[idx];
  if (ak && typeof ak === 'object') ak.answer = newA; else sheet.answer_key[idx] = newA;
}
function addAccepted(q, arr) {
  q.acceptedAnswers = [...new Set([...(q.acceptedAnswers || []), ...arr])];
}

const sheets = await (await fetch(`${URL}/rest/v1/naesin_problem_sheets?select=id,title,questions,answer_key&unit_id=eq.${UNIT}&order=created_at`, { headers: H })).json();
must(sheets.length === 6, `시트 6개여야 함 (${sheets.length})`);
fs.mkdirSync('scripts/backups', { recursive: true });
const bak = 'scripts/backups/mirae-co2-l1-backup-20260826.json';
if (!fs.existsSync(bak)) fs.writeFileSync(bak, JSON.stringify(sheets, null, 1));

const [s1, s2, s3, s4, s5, s6] = sheets;
const Q = (s, n) => s.questions[n - 1];

// ── 시트1 (⚪ 지시문·표현 정리) ──
for (const n of [1, 2, 3, 4]) sub(Q(s1, n), '[보기] not to leave / organize / to complete / to practice\n\n', '', `s1 Q${n} 보기제거`);
for (const n of [5, 6, 7]) sub(Q(s1, n), '다음 각 인물이 하는 말을 사용하여 인물에 대한 내용의 문장을 작성해 보시오.', '주어진 단서를 사용하여 인물에 대한 문장을 완성하시오.', `s1 Q${n} 지시문`);
sub(Q(s1, 10), 'to hurry not ______', 'to hurry so as not ______', 's1 Q10');
for (const n of [28, 29, 30]) sub(Q(s1, n), '어법상 어색한 곳을 찾아 고쳐서 올바른 문장으로 전부 쓰세요. ※', '어법상 어색한 곳을 찾아 고치시오. ※', `s1 Q${n} 지시문`);

// ── 시트2 ──
addAccepted(Q(s2, 15), ['She persuaded her sister to sign up for the yoga class together']);
addAccepted(Q(s2, 16), ['The coach told us not to run in the hallway']);
addAccepted(Q(s2, 17), ['He told me not to be nervous during the presentation']);
addAccepted(Q(s2, 18), ['The nurse warned him to drink water regularly during the hike']);
addAccepted(Q(s2, 19), ['The app enabled us to connect with people around the world']);
sub(Q(s2, 24), '[보기] expected, him, to, to, join, I, our study group', '[보기] expected, him, to, join, I, our study group', 's2 Q24 to중복');
underline(Q(s2, 29), [['①', 'to spread'], ['②', 'turn'], ['③', 'himself'], ['④', 'actualizing'], ['⑤', 'whose']], 's2 Q29');
underline(Q(s2, 30), [['①', 'which'], ['②', 'to pass'], ['③', 'known'], ['④', 'searching'], ['⑤', 'tends']], 's2 Q30');

// ── 시트3 ──
underline(Q(s3, 1), [['①', 'consisting'], ['②', 'to survive'], ['③', 'that'], ['④', 'it'], ['⑤', 'has']], 's3 Q1');
setAnswer(s3, 5, 'had not left', 'had left', 's3 Q6');
Q(s3, 6).explanation = "알아차린(noticed) 과거 시점보다 이전에 우산을 두고 온 것이므로 과거완료 'had left'를 쓴다.";

// ── 시트4 ──
must(String(Q(s4, 15).answer) === 'had had', 's4 Q15 answer 확인');
Q(s4, 15).explanation = "소유를 나타내는 have는 수동태(had been had)로 쓸 수 없으므로 능동 과거완료 'had had'가 알맞다.";
addAccepted(Q(s4, 23), ['All the tickets had sold out when we reached the box office']);
sub(Q(s4, 26), '그 편지를 이미 읽었었다', '그 편지를 읽었었다', 's4 Q26');

// ── 시트5 ──
addAccepted(Q(s5, 6), ['Before she started the meeting, she had drunk some coffee']);
addAccepted(Q(s5, 7), ['By the time we arrived at the theater, the movie had begun']);
addAccepted(Q(s5, 8), ['Before they left the office, they had completed the report']);
addAccepted(Q(s5, 9), ['He watched TV after he had finished his homework']);
addAccepted(Q(s5, 11), ['The printer had been repaired by her before the meeting started']);
addAccepted(Q(s5, 13), ['All the problems of the exam had been solved by her before the bell rang']);
addAccepted(Q(s5, 14), ['The chairs had been arranged neatly by the volunteers before the concert']);
sub(Q(s5, 28), '다음 중 밑줄 친 부분이 어법상 어색한 것은?', '다음 중 어법상 어색한 문장은?', 's5 Q28 지시문');
addAccepted(Q(s5, 29), ['Before she started the hike, she had checked the map']);
setAnswer(s5, 29, '4', '5', 's5 Q30');
Q(s5, 30).explanation = "어젯밤 콘서트(과거 시점) 이전까지 라이브 공연을 본 적이 없었다는 뜻이므로 과거완료 'had never seen'이 적절하다.";

// ── 시트6 ──
for (const n of [3, 4, 5, 6, 7, 8]) sub(Q(s6, n), 'I had already finished homework', 'I had already finished my homework', `s6 Q${n} 보기 my`);
setAnswer(s6, 2, 'I had already finished homework', 'I had already finished my homework', 's6 Q3');
// Q10: '이' 제거 + 빈칸 수 정합 (5 + after + 4)
sub(Q(s6, 10), '이 세 마리 새끼 사자는', '세 마리 새끼 사자는', 's6 Q10 우리말');
sub(Q(s6, 10), `${B(6)} after ${B(2)}\n${B(3)} in a small cage`, `${B(5)} after ${B(4)}\nin a small cage`, 's6 Q10 빈칸');
// Q13: '다리 중 하나' 반영 (12단어) + 빈칸 8+4
setAnswer(s6, 12, 'The wolf had torn a chunk out of his leg', 'The wolf had torn a chunk out of one of his legs', 's6 Q13');
sub(Q(s6, 13), `${B(8)}\n${B(3)} and was watching him.`, `${B(8)}\n${B(4)} and was watching him.`, 's6 Q13 빈칸');
// Q16: 3항 병렬 — 정답을 콤마 병렬형으로, and형은 accepted로
setAnswer(s6, 15, 'it had picked up a piece of shell and held it against itself', 'it had picked up a piece of shell, held it against itself', 's6 Q16');
addAccepted(Q(s6, 16), ['it had picked up a piece of shell and held it against itself', 'it had picked up a piece of shell held it against itself']);
sub(Q(s6, 16), `In fact, ${B(7)},`, `In fact, ${B(8)},`, 's6 Q16 빈칸');
// Q17: ready→prepare 복원
sub(Q(s6, 17), '[보기] earlier, training, ready', '[보기] earlier, training, prepare', 's6 Q17 보기');
setAnswer(s6, 16, 'earlier training had not made her ready', 'earlier training had not prepared her', 's6 Q17');
Q(s6, 17).explanation = "'준비시키다'의 과거완료 부정이므로 'had not prepared'를 쓴다. (Maria's earlier training had not prepared her well for life on her new team.)";
// Q18: how to ride 반영 + 빈칸 5+5
setAnswer(s6, 17, 'her mother had taught her to ride a bike', 'her mother had taught her how to ride a bike', 's6 Q18');
addAccepted(Q(s6, 18), ['her mother had taught her to ride a bike']);
sub(Q(s6, 18), `that ${B(4)}\n${B(4)} on the hill`, `that ${B(5)}\n${B(5)} on the hill`, 's6 Q18 빈칸');
// Q22: 보기 ever→never
sub(Q(s6, 22), '[보기] admit, that, ever, visit, Paris', '[보기] admit, that, never, visit, Paris', 's6 Q22 보기');
// Q23: 의도된 오류 복원 (Citing→Cited) + 밑줄
sub(Q(s6, 23), '④Citing', '④Cited', 's6 Q23 오류복원');
underline(Q(s6, 23), [['①', 'that'], ['②', 'completed'], ['③', 'had not been consulted'], ['④', 'Cited'], ['⑤', 'search']], 's6 Q23');
Q(s6, 23).explanation = "분사구문의 의미상 주어 Jobs가 '언급하는' 능동의 주체이므로 과거분사 Cited가 아니라 현재분사 Citing이 되어야 한다. 따라서 ④가 어법상 틀렸다.";
// Q24: 밑줄
underline(Q(s6, 24), [['①', 'they'], ['②', 'had crossed'], ['③', 'what'], ['④', 'famous'], ['⑤', 'becoming']], 's6 Q24');

// Q22 explanation 모순 확인 후 정리
if (/ever/.test(String(Q(s6, 22).explanation || ''))) {
  Q(s6, 22).explanation = "'한 번도 ~한 적이 없다'는 경험의 부정이므로 과거완료 'had never visited'를 쓴다.";
}

console.log(assertFails ? `\n✗ assert 실패 ${assertFails}건 — 반영 중단` : '\n✓ 모든 assert 통과');
if (assertFails) process.exit(1);

if (!APPLY) {
  console.log('(dry-run — --apply로 실제 반영)');
  process.exit(0);
}
for (const s of sheets) {
  const r = await fetch(`${URL}/rest/v1/naesin_problem_sheets?id=eq.${s.id}`, {
    method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' },
    body: JSON.stringify({ questions: s.questions, answer_key: s.answer_key }),
  });
  console.log(s.title, r.status === 204 ? '✓ 반영' : `✗ ${r.status} ${await r.text()}`);
}
