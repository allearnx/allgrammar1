// 중1 동아윤 5과 — 잘못 붙은 지시문 제거(5건) + 한 줄로 뭉친 지문·보기 줄바꿈 복원(22건)
// 2026-08-28 사장님 제보(객관식 시트 4번·20번대) 후속. 사용: node ... [--apply]
import fs from 'fs';

const APPLY = process.argv.includes('--apply');
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const URL = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const UNIT = '13010cda-e59a-49df-bd89-d9d41017b94d';

let fails = 0;
const must = (c, m) => { if (!c) { console.error('  ✗', m); fails++; } };

const sheets = await (await fetch(`${URL}/rest/v1/naesin_problem_sheets?select=id,title,questions&unit_id=eq.${UNIT}&order=created_at`, { headers: H })).json();
must(sheets.length === 23, `시트 23개여야 함 (${sheets.length})`);
fs.mkdirSync('scripts/backups', { recursive: true });
const bak = 'scripts/backups/donga1-l5-jumble-backup-20260828.json';
if (!fs.existsSync(bak)) fs.writeFileSync(bak, JSON.stringify(sheets, null, 1));
const Q = (si, n) => sheets[si - 1].questions[n - 1];
const changedSheets = new Set();

// ── 1) 잘못 붙은 "빈칸에 들어갈 알맞은 말을 고르시오." 제거 (자체 지시문이 이미 있는 문항) ──
const WRONG = '빈칸에 들어갈 알맞은 말을 고르시오.\n\n';
for (const [si, n] of [[13, 8], [13, 14], [14, 8], [15, 15]]) {
  const q = Q(si, n);
  must(q.question.startsWith(WRONG), `[${si}]Q${n} 잘못된 지시문 확인`);
  q.question = q.question.slice(WRONG.length);
  changedSheets.add(si);
}

// ── 2) [14] 객관식(2/5) Q4: 지시문 교체 + 지문/질문 구조화 (중복 질문 제거) ──
{
  const q = Q(14, 4);
  const oldQ = '빈칸에 들어갈 알맞은 말을 고르시오.\n\nAccording to the text, how many books does Suji have? I have sixteen books. Minho has eight books. Suji has more books than Minho. But Jaeho has more books than Suji and fewer books than I. I have two more books than Jaeho. How many books does Suji have?';
  must(q.question === oldQ, '[14]Q4 원문 확인');
  q.question = '다음 글을 읽고 물음에 답하시오.\n\nI have sixteen books. Minho has eight books. Suji has more books than Minho. But Jaeho has more books than Suji and fewer books than I. I have two more books than Jaeho.\n\nAccording to the text, how many books does Suji have?';
  changedSheets.add(14);
}

// ── 3) 한 줄로 뭉친 문항: 스템(첫 '?')과 본문 분리 + ⓐ~ⓔ/• 앞 줄바꿈 ──
const JUMBLED = [
  [13, 24], [13, 25], [13, 26], [13, 27], [13, 29],
  [14, 8], [14, 20], [14, 21], [14, 22],
  [15, 6], [15, 10], [15, 27], [15, 28], [15, 29], [15, 30],
  [16, 1], [16, 2], [16, 3], [16, 6], [16, 7], [16, 15], [16, 21], [16, 24],
];
/** 항목 시작 마커 앞에만 줄바꿈 (지문 속 인라인 (A)[...]·ⓐ___ 는 보존) */
function breakItems(rest) {
  return rest
    .replace(/ +• ?/g, '\n• ')
    .replace(/ +(ⓐ|ⓑ|ⓒ|ⓓ|ⓔ)(?= )/g, '\n$1')
    .replace(/ +(\((?:A|B|C|D|E|F|G)\))(?= )/g, '\n$1')
    .replace(/ +(\((?:가|나|다|라)\))/g, '\n$1')
    .replace(/ +(?=[A-Z][A-Za-z]{0,5}: )/g, '\n');
}
for (const [si, n] of JUMBLED) {
  const q = Q(si, n);
  const t = q.question;
  const trimmed = t.trim();
  if (trimmed.endsWith('?') && t.indexOf('?') === trimmed.length - 1) {
    // B형: 내용이 앞, 스템이 뒤 → 스템을 앞으로
    const sIdx = t.lastIndexOf('다음 ');
    must(sIdx > 0, `[${si}]Q${n} B형 스템('다음 ') 탐지 실패`);
    if (sIdx <= 0) continue;
    const stem = t.slice(sIdx).trim();
    const content = t.slice(0, sIdx).trim();
    q.question = `${stem}\n\n${breakItems(content)}`;
  } else {
    // A형: 스템(첫 '?')과 본문 분리
    const idx = t.indexOf('?');
    must(idx > 0 && idx < t.length - 1, `[${si}]Q${n} 스템 '?' 분리 가능해야 함`);
    if (idx <= 0 || idx >= t.length - 1) continue;
    const stem = t.slice(0, idx + 1);
    const rest = t.slice(idx + 1).trim();
    q.question = `${stem}\n\n${breakItems(rest)}`;
  }
  changedSheets.add(si);
}

console.log(fails ? `✗ assert 실패 ${fails}건 — 중단` : '✓ 모든 assert 통과');
if (fails) process.exit(1);

// 미리보기
for (const [si, n] of [[14, 4], [14, 20], [14, 21], [14, 22], [13, 24], [13, 25], [13, 27], [14, 8], [15, 10], [15, 27], [15, 30], [16, 2], [16, 6], [16, 7], [16, 21], [16, 24]]) {
  console.log(`\n───── [${si}]Q${n}\n${Q(si, n).question.slice(0, 420)}`);
}

if (!APPLY) { console.log('\n(dry-run)'); process.exit(0); }
for (const si of [...changedSheets].sort((a, b) => a - b)) {
  const s = sheets[si - 1];
  const r = await fetch(`${URL}/rest/v1/naesin_problem_sheets?id=eq.${s.id}`, {
    method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' },
    body: JSON.stringify({ questions: s.questions }),
  });
  console.log(s.title, r.status === 204 ? '✓' : `✗ ${r.status} ${await r.text()}`);
}
