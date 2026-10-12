/**
 * 중2 YBM박 Lesson 3 예상문제 검수 수정 (직접 검증). 두 시트 모두 시도 0 → 재채점 불필요.
 *
 * Step2(36d9497b) Q18: "어법상 알맞은 것을 모두 고르면" — 지문 ⓐ~ⓔ, 해설이 ⓒ·ⓔ 둘 다
 *   옳다고 명시. 개별 단일 마커(조합형 아님). answer "3"→"3, 5" + multi_choice.
 * Step3(a3e5c36f) Q4/Q5/Q6/Q8: "위 대화"·ⓐ~ⓕ·㉠~㉤ 참조 지문/대화가 시트에 전혀 없음
 *   (복원 불가, 원본 PDF 필요) → 삭제 + 번호 재정리 + answer_key 동기화.
 *   node scripts/fix-ybm-l3-mock.mjs [--apply]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function run() {
  const { data: units } = await sb.from('naesin_units').select('id,textbook_id,unit_number');
  const u3 = units.find((x) => x.textbook_id.startsWith('9005f510') && x.unit_number === 3);
  const { data: shs } = await sb.from('naesin_problem_sheets').select('id, source_template_id, questions, answer_key').eq('unit_id', u3.id).eq('category', 'mock_exam');
  const backup = {};

  // ---- Step2 Q18 ----
  const s2 = shs.find((s) => s.id.startsWith('36d9497b'));
  backup['step2_' + s2.id] = JSON.parse(JSON.stringify({ questions: s2.questions, answer_key: s2.answer_key }));
  const i18 = s2.questions.findIndex((q) => q.number === 18);
  const q18 = s2.questions[i18];
  if (!q18 || !/모두 고르면/.test(q18.question)) { console.log('⚠ Step2 Q18 미매칭 — 중단'); return; }
  // 안전: 단일 마커 보기 확인(조합형 아님)
  const combo18 = (q18.options || []).filter((o) => (o.match(/[①-⑩ⓐ-ⓩ]/g) || []).length >= 2).length;
  if (combo18 > 0) { console.log('⚠ Step2 Q18 조합형 보기 감지 — 중단'); return; }
  console.log(`Step2 Q18: "${q18.answer}"→"3, 5" + multi_choice`);
  q18.answer = '3, 5'; q18.type = 'multi_choice'; s2.answer_key[i18] = '3, 5';

  // ---- Step3 Q4/Q5/Q6/Q8 삭제 ----
  const s3 = shs.find((s) => s.id.startsWith('a3e5c36f'));
  backup['step3_' + s3.id] = JSON.parse(JSON.stringify({ questions: s3.questions, answer_key: s3.answer_key }));
  const DEL = new Set([4, 5, 6, 8]);
  // 안전: 삭제 대상이 정말 지문 없는 짧은 stem인지 확인
  for (const n of DEL) {
    const q = s3.questions.find((x) => x.number === n);
    if (!q) { console.log(`⚠ Step3 Q${n} 없음 — 중단`); return; }
    if ((q.question || '').length > 120) { console.log(`⚠ Step3 Q${n} 본문 길이 ${q.question.length} — 지문 있을 수 있음, 중단`); return; }
  }
  const keptIdx = s3.questions.map((q, i) => ({ q, i })).filter(({ q }) => !DEL.has(q.number));
  const newQs = keptIdx.map(({ q }) => q);
  const newAk = keptIdx.map(({ i }) => s3.answer_key[i]);
  newQs.forEach((q, i) => { q.number = i + 1; });
  console.log(`Step3: ${s3.questions.length}→${newQs.length}문항 (Q4/5/6/8 삭제), answer_key ${newAk.length}, 번호연속=${newQs.every((q, i) => q.number === i + 1)}`);

  writeFileSync(new URL('../scripts/ybm-l3-mock-backup.json', import.meta.url), JSON.stringify(backup, null, 2));
  if (APPLY) {
    let e1 = (await sb.from('naesin_problem_sheets').update({ questions: s2.questions, answer_key: s2.answer_key }).eq('id', s2.id)).error;
    let e2 = (await sb.from('naesin_problem_sheets').update({ questions: newQs, answer_key: newAk }).eq('id', s3.id)).error;
    if (e1 || e2) { console.error(e1 || e2); process.exit(1); }
    console.log('✓ 저장됨 (백업: scripts/ybm-l3-mock-backup.json) — 시도 0, 재채점 불필요');
  } else console.log('[dry-run]');
}
await run();
