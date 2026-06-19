/**
 * 수동태 step2 — 🟡 품질 수정(지시문 중복/빈칸 누락/한글 오타). 정답 변경 없음 → 재채점 불필요.
 * 템플릿 cac534f0 + 복사 시트 4개. (과거 subParts 변환 보존 — subParts 미수정)
 *   node scripts/fix-sudongtae-step2.mjs [--apply]
 *
 * Q4·Q5 지시문 중복 제거, Q14 별명 빈칸 추가, Q47 번지→편지, Q48 반센트→빈센트
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const TEMPLATE_ID = 'cac534f0-5d4e-475f-87f3-30fdc65d645d';
const SHEET_IDS = ['765105d0-6c5f-44c7-ad60-53053d234187', '7e00c2fa-d5ea-43ea-affa-e41397a5ff13', 'abf2d199-2be5-4008-b2e9-4958649dd965', 'eceb5976-827b-4054-affc-4c4efecf620f'];

function applyEdits(questions, warns) {
  const log = []; const byNum = (n) => questions.find((q) => q.number === n);
  const rep = (q, from, to, lab) => { if (!q) { warns.push(`⚠ ${lab}: 문항없음`); return; } const b = q.question; q.question = b.split(from).join(to); if (b === q.question) warns.push(`⚠ ${lab}: "${from.slice(0,20)}" 미발견`); else log.push(lab); };
  rep(byNum(4), '<보기>에서 알맞은 표현을 골라 <보기>에서 알맞은 표현을 골라', '<보기>에서 알맞은 표현을 골라', 'Q4 지시문중복');
  rep(byNum(5), '<보기>에서 알맞은 표현을 골라 <보기>에서 알맞은 표현을 골라', '<보기>에서 알맞은 표현을 골라', 'Q5 지시문중복');
  rep(byNum(14), 'He ________(call) .', 'He ________(call) ________.', 'Q14 별명빈칸');
  rep(byNum(47), '번지가', '편지가', 'Q47 번지→편지');
  rep(byNum(48), '반센트', '빈센트', 'Q48 반센트→빈센트');
  return log;
}

async function run() {
  const backup = {};
  for (const [label, id, table] of [['template', TEMPLATE_ID, 'naesin_templates'], ...SHEET_IDS.map((s) => ['sheet', s, 'naesin_problem_sheets'])]) {
    const { data, error } = await sb.from(table).select('questions').eq('id', id).single();
    if (error) { console.error(label, id, error); process.exit(1); }
    backup[`${label}_${id}`] = JSON.parse(JSON.stringify(data));
    const warns = []; const log = applyEdits(data.questions, warns);
    console.log(`[${label} ${id.slice(0,8)}] 수정 ${log.length}: ${log.join(', ')}`); warns.forEach((w) => console.log('  ', w));
    if (APPLY) { const { error: e } = await sb.from(table).update({ questions: data.questions }).eq('id', id); if (e) { console.error(e); process.exit(1); } }
  }
  writeFileSync(new URL('../scripts/sudongtae-step2-backup.json', import.meta.url), JSON.stringify(backup, null, 2));
  console.log(APPLY ? '\n✓ 적용 완료 (백업: scripts/sudongtae-step2-backup.json)' : '\n[dry-run] --apply 로 적용');
}
await run();
