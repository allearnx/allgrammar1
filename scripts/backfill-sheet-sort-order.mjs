/**
 * 문제 시트 sort_order 백필 — 단원 안에서 sort_order가 겹치는(대부분 전부 0) 시트가 358장이라
 * 학생·선생님 화면의 시트 순서가 뒤죽박죽 (정재원 9/14 신고: 5과 문법 1단계 (7/8)가 맨 앞 등).
 * 단원별로 category(problem → mock_exam → last_review → 기타) → 제목 자연 정렬(N단계, (k/n) 숫자) → created_at 순으로 0부터 재부여.
 *   node scripts/backfill-sheet-sort-order.mjs [--apply]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) { const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, ''); }
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const CAT = { problem: 0, mock_exam: 1, last_review: 2 };
const parse = (t) => {
  const stage = t.match(/(\d+)\s*단계/); const step = t.match(/^(.*?)\s*Step\s*(\d+)/i); const kn = t.match(/\((\d+)\s*\/\s*(\d+)\)/); const round = t.match(/(\d+)\s*회/);
  // 새 스타일 "N과 문법 N단계 (k/n)": topic '' / 구 스타일 "<주제> StepN": topic=주제 (주제 묶음은 첫 생성 시각 순)
  return { topic: stage ? '' : step ? step[1].trim() : t.replace(/\s*\(.*$/, ''), num: stage ? +stage[1] : step ? +step[2] : 0, k: kn ? +kn[1] : round ? +round[1] : 0 };
};
const makeCmp = (list) => {
  const topicFirst = {};
  for (const s of list) { const { topic } = parse(s.title); topicFirst[topic] = topicFirst[topic] == null || s.created_at < topicFirst[topic] ? s.created_at : topicFirst[topic]; }
  return (a, b) => {
    const pa = parse(a.title), pb = parse(b.title);
    return (CAT[a.category] ?? 9) - (CAT[b.category] ?? 9) || topicFirst[pa.topic].localeCompare(topicFirst[pb.topic]) || pa.topic.localeCompare(pb.topic)
      || pa.num - pb.num || pa.k - pb.k || a.title.localeCompare(b.title, 'ko', { numeric: true }) || a.created_at.localeCompare(b.created_at);
  };
};

const { data: sheets } = await sb.from('naesin_problem_sheets').select('id, unit_id, title, category, sort_order, created_at').eq('is_template', false).range(0, 9999);
const byUnit = {}; for (const s of sheets) if (s.unit_id) (byUnit[s.unit_id] ??= []).push(s);
const updates = []; const backup = {};
for (const [u, list] of Object.entries(byUnit)) {
  const counts = {}; for (const s of list) counts[s.sort_order] = (counts[s.sort_order] ?? 0) + 1;
  if (!Object.values(counts).some((n) => n > 1)) continue; // 겹침 없는 단원은 손대지 않음
  const sorted = [...list].sort(makeCmp(list));
  sorted.forEach((s, i) => { backup[s.id] = s.sort_order; if (s.sort_order !== i) updates.push({ id: s.id, sort_order: i }); });
  if (/^(92570286|2ae9a928|13010cda|02718371)/.test(u) || sorted.some((x) => /Step/i.test(x.title)) && Math.random() < 0.15) console.log(u.slice(0,8), '→', sorted.map((s, i) => `${i}:${s.title}`).join(' | '));
}
console.log(`대상 단원 ${Object.keys(byUnit).length}중 변경 ${updates.length}장`);
writeFileSync(new URL('../scripts/backups/sheet-sort-order-backup.json', import.meta.url), JSON.stringify(backup, null, 1));
if (!APPLY) { console.log('[dry-run]'); process.exit(0); }
for (const u of updates) { const { error } = await sb.from('naesin_problem_sheets').update({ sort_order: u.sort_order }).eq('id', u.id); if (error) throw error; }
console.log('✓ 적용 (백업: scripts/backups/sheet-sort-order-backup.json)');
