import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Paginate to get ALL words
let allWords = [];
let offset = 0;
const pageSize = 1000;
while (true) {
  const r = await fetch(`${url}/rest/v1/voca_vocabulary?select=id,front_text,back_text,day_id,sort_order,created_at&order=id&limit=${pageSize}&offset=${offset}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const page = await r.json();
  allWords = allWords.concat(page);
  if (page.length < pageSize) break;
  offset += pageSize;
}

console.log(`총 ${allWords.length}개 단어 로드`);

// Group by day_id + lowercase front_text
const groups = {};
for (const w of allWords) {
  const k = `${w.day_id}::${(w.front_text || '').toLowerCase()}`;
  if (!groups[k]) groups[k] = [];
  groups[k].push(w);
}

const dupes = Object.entries(groups).filter(([, v]) => v.length > 1);
console.log(`중복 그룹: ${dupes.length}건\n`);

let deleted = 0;
for (const [, items] of dupes) {
  // Keep the first one (lowest sort_order), delete the rest
  items.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const keep = items[0];
  const remove = items.slice(1);

  for (const r of remove) {
    console.log(`  삭제: "${r.front_text}" (id: ${r.id.slice(0, 8)}…) — 유지: id ${keep.id.slice(0, 8)}…`);
    const res = await fetch(`${url}/rest/v1/voca_vocabulary?id=eq.${r.id}`, {
      method: 'DELETE',
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (res.ok) deleted++;
    else console.log(`    ⚠️ 삭제 실패: ${res.status}`);
  }
}

console.log(`\n총 ${deleted}건 중복 삭제 완료`);
