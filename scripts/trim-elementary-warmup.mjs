/**
 * 초등 필수 영어단어 800 — 워밍업 단어 삭제 + Day 재분할 (2026-08-04 사장님 확정 B안)
 *
 * Day 1~2가 너무 쉽다는 검수 의견 → Day 경계(40개)가 아니라 "주제 경계"로 삭제:
 *   숫자·순서 24 + 색깔 12 = 36개 (세트로 익히는 묶음 지식 — 단어카드 암기 대상 아님.
 *   twenty-second 같은 하이픈 13자 스펠링 시험 문제도 함께 해소)
 * 가족 앞 4개(mother·father·parent·baby)는 쉬워도 유지 — 가족·사람 주제(31개)를
 * 반 토막 내지 않아야 인쇄물 마킹이 깔끔하다 (숫자·색깔 페이지 = 워밍업, Day 1 = 가족·사람부터).
 *
 * 남은 657개를 순서 그대로 20개씩 재분할 → 33 Day (20×32 + 17).
 * 생성된 예문은 day_id만 옮기므로 전부 보존된다. 교재는 is_active=false 상태라
 * 학생 진도·재채점 이슈 없음.
 *
 *   node scripts/trim-elementary-warmup.mjs          # dry-run
 *   node scripts/trim-elementary-warmup.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CHUNK = 20;
const CUT_SECTIONS = new Set(['숫자·순서', '색깔']);
const { learnable } = JSON.parse(readFileSync('scripts/elementary-800-words.json', 'utf8'));
const sectionOf = new Map(learnable.map((w) => [w.word.toLowerCase(), w.section]));
const cutWords = learnable.filter((w) => CUT_SECTIONS.has(w.section));
if (cutWords.length !== 36) { console.error('❌ 삭제 대상 36개 아님:', cutWords.length); process.exit(1); }
// 삭제 대상은 PDF 순서상 정확히 맨 앞 36개여야 한다 (아니면 재분할 전제가 깨짐)
if (!learnable.slice(0, 36).every((w) => CUT_SECTIONS.has(w.section))) {
  console.error('❌ 숫자·색깔이 맨 앞 36개가 아님 — 전제 확인 필요'); process.exit(1);
}

const { data: book } = await sb.from('voca_books').select('id, is_active').eq('title', '초등 필수 영어단어 800').single();
if (book.is_active) { console.error('❌ 교재가 이미 활성 상태 — 학생 진도 영향 검토 전 중단'); process.exit(1); }
const { data: days } = await sb.from('voca_days').select('id, day_number').eq('book_id', book.id).order('day_number');

// 전역 순서로 단어 수집
const all = [];
for (const d of days) {
  const { data: v } = await sb.from('voca_vocabulary').select('id, front_text').eq('day_id', d.id).order('sort_order');
  all.push(...v);
}
console.log(`현재: ${days.length} Day / ${all.length}단어`);

const cutSet = new Set(cutWords.map((w) => w.word.toLowerCase()));
const toDelete = all.filter((w) => cutSet.has(w.front_text.toLowerCase()));
const remain = all.filter((w) => !cutSet.has(w.front_text.toLowerCase()));
console.log(`삭제 ${toDelete.length}개 (${toDelete.slice(0, 5).map((w) => w.front_text).join(', ')}…) → 남는 단어 ${remain.length}개`);
const newDayCount = Math.ceil(remain.length / CHUNK);
console.log(`재분할: ${newDayCount} Day (20×${newDayCount - 1} + ${remain.length - CHUNK * (newDayCount - 1)})`);
if (toDelete.length !== 36 || remain.length !== 657) { console.error('❌ 개수 불일치'); process.exit(1); }
if (!APPLY) { console.log('--apply로 실행하세요'); process.exit(0); }

// 1) 워밍업 단어 삭제
const { error: delErr } = await sb.from('voca_vocabulary').delete().in('id', toDelete.map((w) => w.id));
if (delErr) { console.error('❌ 삭제 실패:', delErr.message); process.exit(1); }

// 2) 남은 단어를 Day 1..33에 재배치 (day_id + sort_order 갱신 — 예문 등 나머지 필드 보존)
const boundaries = [];
for (let d = 0; d < newDayCount; d++) {
  const chunkWords = remain.slice(d * CHUNK, (d + 1) * CHUNK);
  const dayRow = days[d];
  for (let i = 0; i < chunkWords.length; i++) {
    const { error } = await sb.from('voca_vocabulary')
      .update({ day_id: dayRow.id, sort_order: i })
      .eq('id', chunkWords[i].id);
    if (error) { console.error(`❌ Day ${d + 1} 배치 실패:`, error.message); process.exit(1); }
  }
  const topics = [...new Set(chunkWords.map((w) => sectionOf.get(w.front_text.toLowerCase()) ?? '?'))].join(', ');
  const desc = `${chunkWords[0].front_text} ~ ${chunkWords[chunkWords.length - 1].front_text} · ${topics}`;
  const { error: dayErr } = await sb.from('voca_days')
    .update({ description: desc })
    .eq('id', dayRow.id);
  if (dayErr) { console.error(`❌ Day ${d + 1} 설명 갱신 실패:`, dayErr.message); process.exit(1); }
  boundaries.push({ day: d + 1, n: chunkWords.length, desc });
  process.stdout.write(`\rDay ${d + 1}/${newDayCount} 재배치`);
}
console.log();

// 3) 빈 Day(34·35) 삭제
const surplus = days.slice(newDayCount);
if (surplus.length) {
  const { error } = await sb.from('voca_days').delete().in('id', surplus.map((d) => d.id));
  if (error) { console.error('❌ 잉여 Day 삭제 실패:', error.message); process.exit(1); }
}

console.log(`\n✅ 완료 — ${newDayCount} Day / ${remain.length}단어 (잉여 Day ${surplus.length}개 삭제)`);
for (const b of boundaries) console.log(`  Day ${String(b.day).padStart(2)} (${String(b.n).padStart(2)}개)  ${b.desc}`);
