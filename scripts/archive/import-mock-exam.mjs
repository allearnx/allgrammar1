/**
 * PDF 배치 → 추출 → 정답키 병합 → 공통지문 백필 → sanitize-lite → mock_exam 시트 삽입.
 * 라우트(extract-pdf)와 동일한 프롬프트/모델 사용. DB에 직접 삽입(서비스롤).
 *
 *   node scripts/import-mock-exam.mjs <pdfPath> <unitId> "<title>" [--apply]
 *
 * 기본 dry-run(삽입 안 함, 검수 리포트만). --apply 시 삽입.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const [pdfPath, unitId, title] = process.argv.slice(2);
const APPLY = process.argv.includes('--apply');
const KEY = process.env.ANTHROPIC_API_KEY;
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const QPROMPT = readFileSync('/tmp/extract_prompt.txt', 'utf8');
const AKPROMPT = readFileSync('/tmp/ak_prompt.txt', 'utf8');

async function anthropic(prompt, maxTokens, pdfB64) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: maxTokens, messages: [{ role: 'user', content: [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfB64 } },
      { type: 'text', text: prompt }] }] }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 300));
  return j;
}
const stripFence = (t) => t.trim().replace(/^```(json)?/, '').replace(/```$/, '').trim();

// ── sanitize-lite (problem-validator.ts 핵심 로직 미러) ──
const CIRC = { '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5', '⑥': '6', '⑦': '7', '⑧': '8', '⑨': '9', '⑩': '10' };
const uncircle = (s) => String(s).replace(/[①-⑩]/g, (m) => CIRC[m] ?? m);
const wc = (s) => (String(s || '').match(/[A-Za-z]{2,}/g) || []).length;
const hasp = (s) => wc(s) >= 40, ref = (s) => /위\s*글|위\s*대화|윗글/.test(s || '');
const block = (s) => { const L = String(s || '').split('\n'); const i = L.findIndex((l) => wc(l) >= 6); return i < 0 ? null : (L.slice(i).join('\n').trim() || null); };
const IMG = /다음 그림|그림을 보고|그림을 참고|그림에 대한|그림과 일치|그림의 내용|그림이 의미|그림의 상황|그림을 설명|그림에 맞|그림을 묘사|사진을 보고|사진 속|표지판을 보고|지도를 보고|그래프를 보고|차트를 보고/;
const HASDESC = /\(그림[:\s]|\[그림[:\s]|\[이미지[:\s]/;
const isImgQ = (t) => IMG.test(t) && !HASDESC.test(t) && !/그림을 그리|그린 그림|사진을 찍/.test(t);
function backfill(qs) {
  return qs.map((q, i) => { const t = q.question; if (typeof t !== 'string' || !ref(t) || hasp(t)) return q;
    for (let j = i - 1; j >= 0 && j >= i - 8; j--) { const sc = qs[j].question; if (typeof sc === 'string' && hasp(sc)) { const p = block(sc); if (p) return { ...q, question: `${p}\n\n${t}` }; break; } } return q; });
}
function sanitize(questions, answerKey) {
  let qs = questions.map((q) => {
    const out = { ...q };
    if (typeof out.answer === 'string') out.answer = uncircle(out.answer).trim();
    if (Array.isArray(out.answer)) out.answer = out.answer.map((x) => uncircle(String(x)).trim()).join(', ');
    if (Array.isArray(out.options)) out.options = out.options.map((o) => Array.isArray(o) ? o.map((it, i) => `(${String.fromCharCode(65 + i)}) ${it}`).join(' — ') : String(o));
    return out;
  });
  // 빈 정답을 answer_key에서 채움
  qs.forEach((q, i) => { if ((q.answer == null || String(q.answer).trim() === '') && answerKey && answerKey[i] != null) q.answer = String(answerKey[i]); });
  qs = backfill(qs);
  qs = qs.filter((q) => !isImgQ(q.question || ''));
  qs = qs.map((q, i) => ({ ...q, number: i + 1 }));
  const ak = qs.map((q) => q.answer ?? null);
  return { questions: qs, answerKey: ak };
}

async function run() {
  const pdfB64 = Buffer.from(readFileSync(pdfPath)).toString('base64');
  const [qres, akres] = await Promise.all([anthropic(QPROMPT, 32000, pdfB64), anthropic(AKPROMPT, 8192, pdfB64)]);
  if (qres.stop_reason !== 'end_turn') { console.log(`  ⚠ 출력 잘림(stop=${qres.stop_reason}, ${qres.usage.output_tokens}토큰) — 배치를 더 작게 쪼개세요. 삽입 중단.`); return; }
  let rawQs;
  try { rawQs = JSON.parse(stripFence(qres.content[0].text)); }
  catch (e) { console.log(`  ⚠ JSON 파싱 실패(${e.message}) — 출력 손상. 삽입 중단.`); return; }
  const akMap = JSON.parse(stripFence(akres.content[0].text));
  // 정답키 병합 (정답표가 source of truth)
  let merged = 0;
  for (const q of rawQs) { const k = String(q.number); if (k in akMap && akMap[k] !== '') { q.answer = akMap[k]; merged++; } }
  const { questions, answerKey } = sanitize(rawQs, null);
  // 리포트
  const pmiss = questions.filter((q) => ref(q.question) && !hasp(q.question)).map((q) => q.number);
  const empty = questions.filter((q) => q.answer == null || String(q.answer).trim() === '').map((q) => q.number);
  const onums = rawQs.map((q) => Number(q.number)).filter((n) => !isNaN(n)).sort((a, b) => a - b);
  console.log(`추출 ${rawQs.length} → 정리 ${questions.length}문항 | 원본번호 ${onums[0]}~${onums[onums.length - 1]} | Q출력토큰=${qres.usage.output_tokens} stop=${qres.stop_reason} | 정답키병합=${merged}/${Object.keys(akMap).length}`);
  console.log(`  지문누락=${pmiss.length ? pmiss.join(',') : '없음'} | 빈정답=${empty.length ? empty.join(',') : '없음'}`);
  if (qres.stop_reason !== 'end_turn') console.log('  ⚠ 출력 잘림 — 배치를 더 작게 쪼개야 함');
  if (APPLY) {
    const { data: maxs } = await sb.from('naesin_problem_sheets').select('sort_order').eq('unit_id', unitId).eq('category', 'mock_exam').order('sort_order', { ascending: false }).limit(1);
    const sort_order = (maxs?.[0]?.sort_order ?? -1) + 1;
    const { data, error } = await sb.from('naesin_problem_sheets').insert({ unit_id: unitId, title, mode: 'interactive', category: 'mock_exam', is_template: false, sort_order, questions, answer_key: answerKey }).select('id').single();
    if (error) { console.error(error); process.exit(1); }
    console.log(`  ✓ 삽입됨: ${data.id} "${title}"`);
  } else console.log('  [dry-run] 삽입 안 함');
}
await run();
