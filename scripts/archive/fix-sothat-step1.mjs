/**
 * so that Step1 — 서술형 모범답안/해설 품질 수정 (채점 영향 0: acceptedAnswers 불변).
 * 내가 직접 풀어 확정. 템플릿 82f980ac + source_template_id 복사 시트.
 *   node scripts/fix-sothat-step1.mjs [--apply]
 *
 * Q34: 모범답안 "...wouldn't fail" → "...won't fail" (must=현재 → won't 호응. accepted엔 둘 다 유지)
 * Q48: 해설 "시제가 현재로 바뀜"(오류) → "주절 과거(made) → 목적절 could"
 * (Q35는 접속사 전환이라 can 유지가 정답 — 수정 안 함. Q2 Step2는 보고만.)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const TMPL = '82f980ac';

async function run() {
  const { data: tmpls } = await sb.from('naesin_templates').select('id').eq('template_topic', 'so that');
  const tmplId = tmpls.find((t) => t.id.startsWith(TMPL)).id;
  const { data: copies } = await sb.from('naesin_problem_sheets').select('id').eq('source_template_id', tmplId);
  const targets = [['naesin_templates', tmplId], ...copies.map((c) => ['naesin_problem_sheets', c.id])];
  const backup = {};
  for (const [table, id] of targets) {
    const { data: row } = await sb.from(table).select('questions').eq('id', id).single();
    backup[`${table}_${id}`] = JSON.parse(JSON.stringify(row.questions));
    const w = [];
    const q34 = row.questions.find((x) => x.number === 34);
    if (q34 && q34.answer.includes("wouldn't fail")) { q34.answer = q34.answer.replace("wouldn't fail", "won't fail"); w.push('Q34 모범답안 wouldn’t→won’t'); }
    const q48 = row.questions.find((x) => x.number === 48);
    if (q48) { q48.explanation = 'to부정사 목적을 so that 절로 전환한다. 주절이 과거(made)이므로 목적절도 could를 쓴다.'; w.push('Q48 해설 교정'); }
    console.log(`[${table.includes('templates') ? 'TMPL' : 'SHEET'} ${id.slice(0, 8)}] ${w.join(', ') || '변경 없음'}`);
    if (APPLY) await sb.from(table).update({ questions: row.questions }).eq('id', id);
  }
  writeFileSync(new URL('../scripts/sothat-step1-backup.json', import.meta.url), JSON.stringify(backup, null, 2));
  console.log(APPLY ? '\n✓ 적용 (백업: scripts/sothat-step1-backup.json) — 채점 영향 없어 재채점 불필요' : '\n[dry-run]');
}
await run();
