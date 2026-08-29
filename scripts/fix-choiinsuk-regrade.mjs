// 최인숙 학생 문법 응시 검수 후속 (2026-08-28) — 동아윤 5과 1단계
// ① (5/12)·(4/12) acceptedAnswers 보강 ② 6개 attempt 재채점 (구제만, 하향 없음)
// 사용: node scripts/fix-choiinsuk-regrade.mjs [--apply]
import fs from 'fs';

const APPLY = process.argv.includes('--apply');
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const URL = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const UNIT = '13010cda-e59a-49df-bd89-d9d41017b94d';
const STUDENT = 'e17943ff-db82-46b3-aee8-00bf11c6473e';

let fails = 0;
const must = (c, m) => { if (!c) { console.error('  ✗', m); fails++; } };

// ── normalize (src/lib/naesin/normalize-answer.ts 미러, 구두점 앞 공백 수정 포함) ──
function normalize(s) {
  return String(s ?? '')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[‘’`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—−]/g, '-')
    .trim().toLowerCase()
    .replace(/\bcan't\b/g, 'cannot').replace(/\bcan not\b/g, 'cannot')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/([a-z])n't\b/g, '$1 not')
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\b(you|we|they)'re\b/g, '$1 are')
    .replace(/\b(i|you|we|they|he|she|it|there|who|what)'ll\b/g, '$1 will')
    .replace(/\b(i|you|we|they)'ve\b/g, '$1 have')
    .replace(/\b(it|that|there|he|she|what|who|where|when|how|here)'s\b/g, '$1 is')
    .replace(/\s+([?!.,;:])/g, '$1')
    .replace(/\.+\s*$/, '')
    .replace(/\((\d+)\)\s*/g, '($1) ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+/g, ' ').trim();
}
const normSep = (s) => normalize(s).replace(/\s*[,/]\s*/g, ' ').replace(/\s+/g, ' ');

const sheets = await (await fetch(`${URL}/rest/v1/naesin_problem_sheets?select=id,title,questions&unit_id=eq.${UNIT}&order=created_at`, { headers: H })).json();
fs.mkdirSync('scripts/backups', { recursive: true });
const bak = 'scripts/backups/choiinsuk-regrade-backup-20260828.json';

const byTitle = (t) => sheets.find((s) => s.title === t);
const s5 = byTitle('5과 문법 1단계 (5/12)'), s4 = byTitle('5과 문법 1단계 (4/12)');
must(s5 && s4, '시트 (5/12)·(4/12) 존재');
const addAcc = (q, arr) => { q.acceptedAnswers = [...new Set([...(q.acceptedAnswers || []), ...arr])]; };

// ── ① acceptedAnswers 보강 (문법적으로 동등한 변형) ──
addAcc(s5.questions[8], ['That is the tallest building in the world']);            // Q9 그것은=That
addAcc(s5.questions[11], ['The Sahara is the driest place on the Earth']);         // Q12 on the Earth
addAcc(s5.questions[12], ['The Tyrannosaurus was the biggest and the fiercest dinosaur']); // Q13 and the
addAcc(s5.questions[13], ['The smallest bird was a hummingbird. It was lighter than a coin']); // Q14 a
addAcc(s5.questions[17], ['Death Valley is the hottest place on the Earth']);      // Q18 on the Earth
addAcc(s5.questions[18], ['The longest river in the world is the Nile', 'In the world, the longest river is the Nile']); // Q19 어순
must(String(s4.questions[17].subParts?.[1]?.answer) === 'ugliest', 's4 Q18 subParts 확인');
s4.questions[17].subParts[1].acceptedAnswers = [...new Set([...(s4.questions[17].subParts[1].acceptedAnswers || []), 'the ugliest'])]; // 병렬 the

// ── ② 재채점 (구제만): wrong_answers의 비-retryCorrect 항목을 새 규칙으로 재평가 ──
const attempts = await (await fetch(`${URL}/rest/v1/naesin_problem_attempts?select=id,sheet_id,score,total_questions,answers,wrong_answers,created_at&student_id=eq.${STUDENT}&order=created_at`, { headers: H })).json();
if (!fs.existsSync(bak)) fs.writeFileSync(bak, JSON.stringify({ sheets: [s5, s4], attempts }, null, 1));

function judge(q, userAnswer) {
  const ua = String(userAnswer ?? '');
  if (q.subParts) {
    const parts = ua.split(' / ');
    return q.subParts.every((sp, j) => {
      const sn = normalize(parts[j]?.trim() ?? '');
      return [sp.answer, ...(sp.acceptedAnswers || [])].some((c) => normalize(c) === sn);
    });
  }
  const candidates = [String(q.answer ?? ''), ...(q.acceptedAnswers || [])];
  return candidates.some((c) => normalize(c) === normalize(ua))
    || candidates.some((c) => normSep(ua) === normSep(c));
}

const updates = [];
for (const a of attempts) {
  const sheet = sheets.find((s) => s.id === a.sheet_id);
  const wrongs = (a.wrong_answers || []).filter((w) => !w.retryCorrect);
  const retained = [], flipped = [];
  for (const w of wrongs) {
    const q = sheet.questions[w.number - 1];
    (q && judge(q, w.userAnswer) ? flipped : retained).push(w);
  }
  if (!flipped.length) { console.log(sheet.title, a.created_at.slice(5, 16), '변동 없음 (score ' + a.score + ')'); continue; }
  const correct = a.total_questions - retained.length;
  const newScore = Math.round((correct / a.total_questions) * 100);
  console.log(`${sheet.title} ${a.created_at.slice(5, 16)}: ${a.score} → ${newScore} (구제 ${flipped.length}건: Q${flipped.map((f) => f.number).join(', Q')})`);
  updates.push({ attempt: a, newScore, newWrongs: [...retained, ...(a.wrong_answers || []).filter((w) => w.retryCorrect)], flipped });
}

console.log(fails ? `✗ assert 실패 ${fails}` : '✓ assert 통과');
if (fails) process.exit(1);
if (!APPLY) { console.log('(dry-run)'); process.exit(0); }

// 시트 반영
for (const s of [s5, s4]) {
  const r = await fetch(`${URL}/rest/v1/naesin_problem_sheets?id=eq.${s.id}`, {
    method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ questions: s.questions }),
  });
  console.log(s.title, r.status === 204 ? '✓ 시트' : `✗ ${r.status}`);
}
// attempt 반영 + 오답노트 정리
// ⚠️ naesin_wrong_answers는 시트별 "최신 attempt"의 스냅샷 — 옛 attempt의 구제로 테이블을
// 지우면 최신 attempt의 정당한 오답까지 삭제됨 (2026-08-29 c2aa5867 Q9/13/14 실사고, 복원 완료).
// 같은 시트에 attempt가 여러 개면 최신 attempt의 flipped만 테이블 삭제 대상.
const latestPerSheet = new Map();
for (const a of attempts) latestPerSheet.set(a.sheet_id, a.id); // created_at 오름차순 → 마지막=최신
for (const u of updates) {
  const r = await fetch(`${URL}/rest/v1/naesin_problem_attempts?id=eq.${u.attempt.id}`, {
    method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' },
    body: JSON.stringify({ score: u.newScore, wrong_answers: u.newWrongs }),
  });
  console.log('attempt', u.attempt.id.slice(0, 8), r.status === 204 ? '✓' : `✗ ${r.status}`);
  // naesin_wrong_answers에서 구제 문항 행 삭제 (question_data->>number 매칭)
  if (latestPerSheet.get(u.attempt.sheet_id) !== u.attempt.id) continue;
  for (const f of u.flipped) {
    const del = await fetch(`${URL}/rest/v1/naesin_wrong_answers?student_id=eq.${STUDENT}&sheet_id=eq.${u.attempt.sheet_id}&question_data->>number=eq.${f.number}`, {
      method: 'DELETE', headers: { ...H, Prefer: 'return=minimal' },
    });
    if (del.status !== 204) console.log('  오답노트 삭제 실패 Q' + f.number, del.status);
  }
}
console.log('완료');
