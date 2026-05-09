import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function query(path) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' },
  });
  const count = res.headers.get('content-range')?.split('/')[1];
  const data = await res.json();
  return { data, count: parseInt(count || data.length) };
}

// 1. 빈 front_text
const empty = await query('voca_vocabulary?or=(front_text.is.null,front_text.eq.)&select=id,front_text,back_text,day_id&limit=20');
console.log(`\n❌ 빈 front_text: ${empty.count}건`);
if (empty.data.length) console.table(empty.data);

// 2. 빈 back_text
const emptyBack = await query('voca_vocabulary?or=(back_text.is.null,back_text.eq.)&select=id,front_text,back_text,day_id&limit=20');
console.log(`\n❌ 빈 back_text: ${emptyBack.count}건`);
if (emptyBack.data.length) console.table(emptyBack.data);

// 3. 특수문자/숫자로만 된 front_text
// Paginate to get ALL words
let allWords = [];
let offset = 0;
const pageSize = 1000;
while (true) {
  const r = await fetch(`${url}/rest/v1/voca_vocabulary?select=id,front_text,back_text,day_id&order=id&limit=${pageSize}&offset=${offset}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const page = await r.json();
  allWords = allWords.concat(page);
  if (page.length < pageSize) break;
  offset += pageSize;
}

const suspicious = allWords.filter(w => {
  const f = w.front_text || '';
  return /^\d+$/.test(f) || /^[^a-zA-Z가-힣]+$/.test(f);
});
console.log(`\n⚠️  특수문자/숫자만 있는 front_text: ${suspicious.length}건`);
if (suspicious.length) console.table(suspicious.slice(0, 20));

// 4. 중복 단어 (같은 day_id 내)
const dayGroups = {};
for (const w of allWords) {
  const key = `${w.day_id}::${(w.front_text || '').toLowerCase()}`;
  if (!dayGroups[key]) dayGroups[key] = [];
  dayGroups[key].push(w);
}
const dupes = Object.entries(dayGroups).filter(([, v]) => v.length > 1);
console.log(`\n⚠️  같은 Day 내 중복 단어: ${dupes.length}건`);
for (const [key, items] of dupes.slice(0, 15)) {
  const [dayId, word] = key.split('::');
  console.log(`  "${word}" x${items.length} (day: ${dayId.slice(0, 8)}…)`);
}

// 5. 매우 긴 front_text (오입력 가능성)
const tooLong = allWords.filter(w => (w.front_text || '').length > 50);
console.log(`\n⚠️  front_text 50자 초과: ${tooLong.length}건`);
if (tooLong.length) tooLong.slice(0, 10).forEach(w => console.log(`  "${w.front_text.slice(0, 80)}…"`));

// 6. 탭/개행 포함
const hasControl = allWords.filter(w => /[\t\n\r]/.test(w.front_text || '') || /[\t\n\r]/.test(w.back_text || ''));
console.log(`\n❌ 탭/개행 포함: ${hasControl.length}건`);
if (hasControl.length) hasControl.slice(0, 10).forEach(w => console.log(`  front="${w.front_text}" back="${w.back_text}"`));

console.log(`\n총 검사 단어: ${allWords.length}건`);
