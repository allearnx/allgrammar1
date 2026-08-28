// 중1 동아윤 5과 문법 시트 — 지시문 누락 263문항에 유형별 표준 지시문 부착 (2026-08-28)
// 사용: node scripts/fix-donga1-l5-directions.mjs [--apply]
// 백업: scripts/backups/donga1-l5-backup-20260828.json
import fs from 'fs';

const APPLY = process.argv.includes('--apply');
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const URL = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const UNIT = '13010cda-e59a-49df-bd89-d9d41017b94d'; // 중1 동아윤 Lesson 5

const hasInstr = (t) =>
  /[가-힣][^\n]*(시오|하세요|쓰세요|고르|쓰시오|완성하|배열하|채우|바꾸어|고쳐|고치|넣으|답하|찾아)/.test(t) ||
  /(것은|문장은|개수는|하나는|것을|말은|말로)[^가-힣]{0,3}\?/.test(t) ||
  /complete the (passage|sentence|dialogue)/i.test(t);

function classify(q) {
  const t = String(q.question ?? '');
  const hasOpts = Array.isArray(q.options) && q.options.length > 0;
  const paren = /\([^)]*\/[^)]*\)/.test(t);
  if (hasOpts) return paren ? 'MCQ_괄호선택' : 'MCQ_빈칸';
  if (t.trimStart().startsWith('[보기]')) return /[가-힣]{2,}/.test(t.split('\n').slice(1).join('\n')) ? 'SUBJ_보기우리말' : 'SUBJ_보기빈칸';
  if (t.trimStart().startsWith('(그림')) return 'SUBJ_그림대답';
  if (/^\|.*\|/m.test(t)) return 'SUBJ_표빈칸';
  if (/<Information>/.test(t)) return 'SUBJ_정보지문';
  if (/^(_{4,}|[A-Za-z/]+)\s*[–-]\s*(_{4,}|[A-Za-z/ ]+)\s*[–-]/.test(t.trim()) && /_{4,}/.test(t)) return 'SUBJ_변화표';
  if (/very/.test(t) && t.split('\n').length >= 2 && /_{4,}/.test(t)) return 'SUBJ_문장전환';
  if (/\([+\-]\)/.test(t)) return 'SUBJ_긍부정대답';
  if (paren && !/_{4,}/.test(t)) return 'SUBJ_괄호선택';
  if (/_{4,}/.test(t) && /\([a-zA-Z][a-zA-Z ,']*\)/.test(t)) return 'SUBJ_빈칸힌트';
  if (/_{4,}/.test(t)) return 'SUBJ_빈칸';
  return '기타';
}

const INSTR = {
  'MCQ_괄호선택': '괄호 안에서 알맞은 것을 고르시오.',
  'MCQ_빈칸': '빈칸에 들어갈 알맞은 말을 고르시오.',
  'SUBJ_보기빈칸': '[보기]에서 알맞은 것을 골라 빈칸에 쓰시오.',
  'SUBJ_보기우리말': '우리말과 같은 뜻이 되도록 [보기]에서 알맞은 것을 골라 빈칸을 채우시오.',
  'SUBJ_그림대답': '그림을 보고 질문에 대한 대답을 완성하시오.',
  'SUBJ_표빈칸': '표의 내용에 맞게 괄호 안의 단어를 알맞은 형태로 바꾸어 빈칸을 채우시오.',
  'SUBJ_정보지문': '다음 정보를 읽고 빈칸에 알맞은 비교 표현을 쓰시오.',
  'SUBJ_변화표': '원급 – 비교급 – 최상급 변화표의 빈칸을 채우시오.',
  'SUBJ_문장전환': '두 문장이 같은 뜻이 되도록 최상급을 사용하여 빈칸에 알맞은 말을 쓰시오.',
  'SUBJ_긍부정대답': '괄호의 기호에 맞게(+: 긍정, -: 부정) 질문에 대한 대답을 쓰시오.',
  'SUBJ_괄호선택': '괄호 안에서 알맞은 것을 골라 쓰시오.',
  'SUBJ_빈칸힌트': '괄호 안의 단어를 알맞은 형태로 바꾸어 빈칸에 쓰시오.',
  'SUBJ_빈칸': '빈칸에 알맞은 말을 쓰시오.',
};

const sheets = await (await fetch(`${URL}/rest/v1/naesin_problem_sheets?select=id,title,questions,answer_key&unit_id=eq.${UNIT}&order=created_at`, { headers: H })).json();
if (sheets.length !== 23) { console.error('시트 23개여야 함:', sheets.length); process.exit(1); }
fs.mkdirSync('scripts/backups', { recursive: true });
const bak = 'scripts/backups/donga1-l5-backup-20260828.json';
if (!fs.existsSync(bak)) fs.writeFileSync(bak, JSON.stringify(sheets, null, 1));

// ※ 형식 안내만 있고 본 지시문이 없는 영작·배열·전환 문항 분류
function classifyStarOnly(t) {
  const firstLine = t.replace(/※[^\n]*/g, '').split('\n')[0];
  if (/→/.test(t)) return 'SUBJ_문장전환기호';
  if (/[가-힣]/.test(firstLine)) return /\([^)]*\/[^)]*\)/.test(t) ? 'SUBJ_배열우리말' : 'SUBJ_영작';
  return 'SUBJ_배열';
}
const STAR_INSTR = {
  'SUBJ_문장전환기호': '괄호의 기호에 맞게 문장을 바꾸어 쓰시오. (+: 긍정문, -: 부정문, ?: 의문문)',
  'SUBJ_배열우리말': '다음 우리말과 같은 뜻이 되도록 괄호 안의 말을 바르게 배열하여 문장을 완성하시오. (필요시 형태를 바꿀 것)',
  'SUBJ_영작': '다음 우리말을 주어진 단어를 사용하여 영작하시오.',
  'SUBJ_배열': '주어진 말을 바르게 배열하여 문장을 완성하시오.',
};

const counts = {}; let total = 0; let etc = 0;
const samples = [];
for (const s of sheets) {
  for (const q of s.questions) {
    const t = String(q.question ?? '');
    if (hasInstr(t)) {
      // ※ 안내만으로 지시문 판정된 문항 → 본 지시문 추가
      if (!hasInstr(t.replace(/※[^\n]*/g, ''))) {
        const c = classifyStarOnly(t);
        q.question = `${STAR_INSTR[c]}\n\n${t}`;
        counts[c] = (counts[c] || 0) + 1; total++;
        if (!samples.some((x) => x.c === c)) samples.push({ c, t: q.question.slice(0, 140) });
      }
      continue;
    }
    const c = classify(q);
    if (c === '기타') { console.log('  ⚠️ 미분류:', s.title, JSON.stringify(t.slice(0, 80))); etc++; continue; }
    const instr = INSTR[c];
    if (t.trimStart().startsWith('[보기]')) {
      // [보기] 줄 유지 + 그 아래에 지시문 삽입
      const lines = t.split('\n');
      const rest = lines.slice(1).join('\n').replace(/^\n+/, '');
      q.question = `${lines[0]}\n\n${instr}\n\n${rest}`;
    } else {
      q.question = `${instr}\n\n${t}`;
    }
    counts[c] = (counts[c] || 0) + 1; total++;
    if (samples.length < 13 && !samples.some((x) => x.c === c)) samples.push({ c, t: q.question.slice(0, 140) });
  }
}
console.log('부착:', total, '건', JSON.stringify(counts));
if (etc) { console.error('미분류', etc, '건 — 중단'); process.exit(1); }
for (const s of samples) console.log('\n───', s.c, '\n' + s.t);

// 자가 검증: 수정 후 누락 0이어야 함
let remain = 0;
sheets.forEach((s) => s.questions.forEach((q) => { if (!hasInstr(String(q.question))) remain++; }));
console.log('\n수정 후 잔여 누락:', remain);
if (remain) process.exit(1);

if (!APPLY) { console.log('(dry-run — --apply로 반영)'); process.exit(0); }
for (const s of sheets) {
  const r = await fetch(`${URL}/rest/v1/naesin_problem_sheets?id=eq.${s.id}`, {
    method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' },
    body: JSON.stringify({ questions: s.questions }),
  });
  if (r.status !== 204) console.log(s.title, `✗ ${r.status} ${await r.text()}`);
}
console.log('전 시트 반영 완료');
