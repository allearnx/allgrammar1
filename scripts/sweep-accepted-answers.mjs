// 인정답안(acceptedAnswers) 전수 등재 스윕 — 중1 동아윤 5과 + 중2 천재소 5과 (2026-08-28)
// 13에이전트 제안(326건) → 적대적 심사(39건 거부) → 승인분 반영 + 기존 응시 재채점(구제만)
// 사용: node scripts/sweep-accepted-answers.mjs [--apply]
import fs from 'fs';

const APPLY = process.argv.includes('--apply');
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const URL = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const SWEEP = '/private/tmp/claude-501/-Users-mckenna-Documents-project26-allgrammar/51d59256-934f-4d70-aeb9-3e12a3a4b25d/scratchpad/sweep';
const UNITS = { donga: '13010cda-e59a-49df-bd89-d9d41017b94d', cheonjae: '7b92d837-65eb-4e76-874b-79ca91b908bb' };

// normalize 미러 (구두점 앞 공백 수정 포함)
function normalize(s) {
  return String(s ?? '')
    .replace(/[\r\n\t]/g, ' ').replace(/[‘’`´]/g, "'").replace(/[“”]/g, '"').replace(/[–—−]/g, '-')
    .trim().toLowerCase()
    .replace(/\bcan't\b/g, 'cannot').replace(/\bcan not\b/g, 'cannot').replace(/\bwon't\b/g, 'will not')
    .replace(/([a-z])n't\b/g, '$1 not').replace(/\bi'm\b/g, 'i am')
    .replace(/\b(you|we|they)'re\b/g, '$1 are')
    .replace(/\b(i|you|we|they|he|she|it|there|who|what)'ll\b/g, '$1 will')
    .replace(/\b(i|you|we|they)'ve\b/g, '$1 have')
    .replace(/\b(it|that|there|he|she|what|who|where|when|how|here)'s\b/g, '$1 is')
    .replace(/\s+([?!.,;:])/g, '$1').replace(/\.+\s*$/, '')
    .replace(/\((\d+)\)\s*/g, '($1) ').replace(/\s*\/\s*/g, ' / ').replace(/\s+/g, ' ').trim();
}
const normSep = (s) => normalize(s).replace(/\s*[,/]\s*/g, ' ').replace(/\s+/g, ' ');

// ── 제안·거부 로드 ──
const props = JSON.parse(fs.readFileSync(SWEEP + '/proposals.json', 'utf8'));
const rejected = new Set();
for (let i = 1; i <= 4; i++) {
  JSON.parse(fs.readFileSync(SWEEP + `/rej-${i}.json`, 'utf8')).forEach((r) => {
    (r.reject || []).forEach((s) => rejected.add(`${r.u}|${r.si}|${r.n}|-|${s}`));
    (r.subRejects || []).forEach((sr) => (sr.reject || []).forEach((s) => rejected.add(`${r.u}|${r.si}|${r.n}|${sr.idx}|${s}`)));
  });
}

// ── 시트 로드 + 반영 ──
const sheetsByUnit = {};
for (const [uk, uid] of Object.entries(UNITS)) {
  sheetsByUnit[uk] = await (await fetch(`${URL}/rest/v1/naesin_problem_sheets?select=id,title,questions&unit_id=eq.${uid}&order=created_at`, { headers: H })).json();
}
fs.mkdirSync('scripts/backups', { recursive: true });
const bak = 'scripts/backups/sweep-accepted-backup-20260828.json';
if (!fs.existsSync(bak)) fs.writeFileSync(bak, JSON.stringify(sheetsByUnit, null, 1));

let added = 0, skippedRejected = 0, skippedDup = 0, fails = 0;
const changed = new Set();
for (const p of props) {
  const sheet = sheetsByUnit[p.u]?.[p.si - 1];
  const q = sheet?.questions?.[p.n - 1];
  if (!q) { console.error('✗ 대상 없음', p.u, p.si, p.n); fails++; continue; }
  if (normalize(q.answer) !== normalize(p.answer)) { console.error('✗ answer 불일치', p.u, p.si, p.n); fails++; continue; }
  const existing = () => [q.answer, ...(q.acceptedAnswers || [])].map(normalize);
  for (const s of p.add || []) {
    if (rejected.has(`${p.u}|${p.si}|${p.n}|-|${s}`)) { skippedRejected++; continue; }
    if (existing().includes(normalize(s))) { skippedDup++; continue; }
    q.acceptedAnswers = [...(q.acceptedAnswers || []), s];
    added++; changed.add(p.u + '|' + sheet.id);
  }
  for (const sa of p.subAdds || []) {
    const sp = q.subParts?.[sa.idx];
    if (!sp) { console.error('✗ subPart 없음', p.u, p.si, p.n, sa.idx); fails++; continue; }
    for (const s of sa.add || []) {
      if (rejected.has(`${p.u}|${p.si}|${p.n}|${sa.idx}|${s}`)) { skippedRejected++; continue; }
      const ex = [sp.answer, ...(sp.acceptedAnswers || [])].map(normalize);
      if (ex.includes(normalize(s))) { skippedDup++; continue; }
      sp.acceptedAnswers = [...(sp.acceptedAnswers || []), s];
      added++; changed.add(p.u + '|' + sheet.id);
    }
  }
}
console.log(`등재 ${added}건 / 거부 제외 ${skippedRejected}건 / 중복 제외 ${skippedDup}건 / 시트 ${changed.size}개`);
if (fails) { console.error('✗ 실패', fails, '건 — 중단'); process.exit(1); }
if (!APPLY) { console.log('(dry-run)'); process.exit(0); }

for (const key of changed) {
  const [uk, sid] = key.split('|');
  const s = sheetsByUnit[uk].find((x) => x.id === sid);
  const r = await fetch(`${URL}/rest/v1/naesin_problem_sheets?id=eq.${sid}`, {
    method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ questions: s.questions }),
  });
  if (r.status !== 204) console.log('✗ 시트', s.title, r.status);
}
console.log('시트 반영 완료');

// ── 기존 응시 재채점 (구제만) ──
function judge(q, userAnswer) {
  const ua = String(userAnswer ?? '');
  if (q.subParts) {
    const parts = ua.split(' / ');
    return q.subParts.every((sp, j) => {
      const sn = normalize(parts[j]?.trim() ?? '');
      return [sp.answer, ...(sp.acceptedAnswers || [])].some((c) => normalize(c) === sn);
    });
  }
  if (Array.isArray(q.options) && q.options.length) return false; // 객관식 구제 없음
  const candidates = [String(q.answer ?? ''), ...(q.acceptedAnswers || [])];
  return candidates.some((c) => normalize(c) === normalize(ua))
    || candidates.some((c) => normSep(ua) === normSep(c));
}
for (const [uk, uid] of Object.entries(UNITS)) {
  const ids = sheetsByUnit[uk].map((s) => s.id);
  const attempts = await (await fetch(`${URL}/rest/v1/naesin_problem_attempts?select=id,student_id,sheet_id,score,total_questions,wrong_answers,created_at&sheet_id=in.(${ids.join(',')})`, { headers: H })).json();
  for (const a of attempts) {
    const sheet = sheetsByUnit[uk].find((s) => s.id === a.sheet_id);
    const wrongs = (a.wrong_answers || []).filter((w) => !w.retryCorrect);
    const retained = [], flipped = [];
    for (const w of wrongs) {
      const q = sheet.questions[w.number - 1];
      (q && judge(q, w.userAnswer) ? flipped : retained).push(w);
    }
    if (!flipped.length) continue;
    const newScore = Math.round(((a.total_questions - retained.length) / a.total_questions) * 100);
    console.log(`재채점 ${sheet.title} ${a.created_at.slice(5, 16)} (student ${a.student_id.slice(0, 8)}): ${a.score} → ${newScore} (구제 Q${flipped.map((f) => f.number).join(', Q')})`);
    const nw = [...retained, ...(a.wrong_answers || []).filter((w) => w.retryCorrect)];
    const r = await fetch(`${URL}/rest/v1/naesin_problem_attempts?id=eq.${a.id}`, {
      method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ score: newScore, wrong_answers: nw }),
    });
    if (r.status !== 204) console.log('✗ attempt', a.id.slice(0, 8), r.status);
    for (const f of flipped) {
      await fetch(`${URL}/rest/v1/naesin_wrong_answers?student_id=eq.${a.student_id}&sheet_id=eq.${a.sheet_id}&question_data->>number=eq.${f.number}`, {
        method: 'DELETE', headers: { ...H, Prefer: 'return=minimal' },
      });
    }
  }
}
console.log('재채점 완료');
