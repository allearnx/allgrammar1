/**
 * 중2 동아윤 4과 예상문제 1·2회 — 공통 지문 누락으로 풀 수 없는 후속 문항 삭제.
 * "위 대화/윗글"을 가리키는데 지문이 question에 없는 문항(요약·T/F·개수·빈칸완성 포함).
 * 지문은 형제 문항(다음 글/다음 대화)에 있으나 후속 문항엔 복제 안 됨 → 사용자 지시로 삭제.
 * 두 시트 시도 0 → 재채점 불필요.  node scripts/fix-dongah-l4-passage-delete.mjs [--apply]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const TARGETS = [
  { pfx: '3f5bec17', label: '1회', del: [7, 10, 12, 16, 17, 19, 20, 25, 26] },
  // Q8(요약 ㉠~㉤)·Q27(주장 ㉠~㉤)은 텍스트가 있어 보존(경계 케이스). 명확히 stem만 남은 것만 삭제.
  { pfx: 'c02a4ad1', label: '2회', del: [12, 15, 17, 18, 20, 26] },
];

async function run() {
  const { data: units } = await sb.from('naesin_units').select('id,textbook_id,unit_number');
  const { data: tbs } = await sb.from('naesin_textbooks').select('id').ilike('display_name', '중2 동아윤');
  const u4 = units.find((x) => x.textbook_id === tbs[0].id && x.unit_number === 4);
  const { data: shs } = await sb.from('naesin_problem_sheets').select('id, source_template_id, questions, answer_key').eq('unit_id', u4.id).eq('category', 'mock_exam');
  const backup = {};
  for (const t of TARGETS) {
    const sheet = shs.find((s) => s.id.startsWith(t.pfx));
    if (!sheet) { console.log(`⚠ ${t.label} 미발견`); continue; }
    if (sheet.source_template_id) { console.log(`⚠ ${t.label} 복사본 — 건너뜀`); continue; }
    backup[t.pfx] = JSON.parse(JSON.stringify({ questions: sheet.questions, answer_key: sheet.answer_key }));
    const del = new Set(t.del);
    // 안전: 삭제 대상이 정말 지문 없는 문항인지(영어 40단어 미만) 확인
    for (const n of t.del) {
      const q = sheet.questions.find((x) => x.number === n);
      if (!q) { console.log(`  ⚠ ${t.label} Q${n} 없음`); continue; }
      const wc = (String(q.question || '').match(/[A-Za-z]{2,}/g) || []).length;
      if (wc >= 40) { console.log(`  ⚠ ${t.label} Q${n} 영어 ${wc}단어(지문 보유 의심) — 중단`); return; }
    }
    const keep = sheet.questions.map((q, i) => ({ q, i })).filter(({ q }) => !del.has(q.number));
    const newQs = keep.map(({ q }) => q);
    const newAk = keep.map(({ i }) => sheet.answer_key[i]);
    newQs.forEach((q, i) => { q.number = i + 1; });
    console.log(`${t.label} [${t.pfx}]: ${sheet.questions.length}→${newQs.length}문항 (삭제 ${t.del.length}: ${t.del.join(',')}), 번호연속=${newQs.every((q, i) => q.number === i + 1)}, answer_key=${newAk.length}`);
    if (APPLY) {
      const { error } = await sb.from('naesin_problem_sheets').update({ questions: newQs, answer_key: newAk }).eq('id', sheet.id);
      if (error) { console.error(error); process.exit(1); }
    }
  }
  writeFileSync(new URL('../scripts/dongah-l4-passage-delete-backup.json', import.meta.url), JSON.stringify(backup, null, 2));
  console.log(APPLY ? '\n✓ 저장됨 (백업: scripts/dongah-l4-passage-delete-backup.json) — 시도 0, 재채점 불필요' : '\n[dry-run]');
}
await run();
