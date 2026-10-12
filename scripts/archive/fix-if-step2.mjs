/**
 * 접속사 if Step2 — 직접 검증한 품질 2건 수정 (정답키 변경 없음, 채점 영향 0).
 * 템플릿 889bf578 + source_template_id 복사 시트.
 *   node scripts/fix-if-step2.mjs [--apply]
 *
 * Q24: 해설 자기모순("②도 조건절") → ②는 명사절(Tell me if=whether)임을 바로잡음. 정답 ④ 불변.
 * Q43: 단어세트 "doesn't / unless / leave"로는 정답 "Unless she leaves..." 불가(이중부정)
 *      → 세트를 "unless / leaves"(doesn't 제거, leave→leaves)로 수정. 정답 불변.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const TMPL = '889bf578';
const Q24_EXPL = "<보기>의 if는 조건의 부사절('만약 ~라면')을 이끈다. ④ 'If you listen carefully, you'll understand.'도 같은 조건 부사절이다. ①②③⑤의 if는 모두 '~인지'를 뜻하는 명사절(asked/tell me/not sure/wondered)이라 보기와 쓰임이 다르다.";

async function run() {
  const { data: tr } = await sb.from('naesin_templates').select('id').eq('template_topic', '접속사 if');
  const tmplId = tr.find((r) => r.id.startsWith(TMPL)).id;
  const { data: copies } = await sb.from('naesin_problem_sheets').select('id').eq('source_template_id', tmplId);
  const targets = [['naesin_templates', tmplId], ...copies.map((c) => ['naesin_problem_sheets', c.id])];
  const backup = {};
  for (const [table, id] of targets) {
    const { data: row } = await sb.from(table).select('questions').eq('id', id).single();
    backup[`${table}_${id}`] = JSON.parse(JSON.stringify(row.questions));
    const w = [];
    const q24 = row.questions.find((x) => x.number === 24);
    if (q24 && /실제로 ②도 조건절/.test(q24.explanation || '')) { q24.explanation = Q24_EXPL; w.push('Q24 해설 교정'); }
    const q43 = row.questions.find((x) => x.number === 43);
    if (q43 && /doesn't \/ unless/.test(q43.question)) {
      q43.question = q43.question.replace('( she / will / doesn\'t / unless / now / she / leave / late / be )', '( she / will / unless / now / she / leaves / late / be )');
      w.push('Q43 단어세트 교정');
    }
    console.log(`[${table.includes('templates') ? 'TMPL' : 'SHEET'} ${id.slice(0, 8)}] ${w.join(', ') || '변경 없음'}`);
    if (APPLY) await sb.from(table).update({ questions: row.questions }).eq('id', id);
  }
  writeFileSync(new URL('../scripts/if-step2-backup.json', import.meta.url), JSON.stringify(backup, null, 2));
  console.log(APPLY ? '\n✓ 적용 (백업: scripts/if-step2-backup.json) — 정답 불변, 재채점 불필요' : '\n[dry-run]');
}
await run();
