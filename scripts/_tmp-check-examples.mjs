import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: book } = await admin.from('voca_books').select('id, title').eq('title', '워드마스터 중등 고난도').single();
if (!book) { console.log('교재 없음'); process.exit(1); }
const { data: days } = await admin.from('voca_days').select('id, day_number, title').eq('book_id', book.id).order('day_number');
console.log(`교재: ${book.title} — Day ${days.length}개`);

for (const d of days) {
  const { data: words } = await admin
    .from('voca_vocabulary')
    .select('id, front_text, example_sentence, example_sentence_ko')
    .eq('day_id', d.id);
  const total = words.length;
  const noEx = words.filter((w) => !w.example_sentence?.trim());
  const noKo = words.filter((w) => w.example_sentence?.trim() && !w.example_sentence_ko?.trim());
  // 매칭 유효 pair: 예문에 front_text 원형 포함
  const validPair = words.filter((w) => {
    if (!w.example_sentence) return false;
    const esc = w.front_text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${esc}\\b`, 'i').test(w.example_sentence);
  }).length;
  if (noEx.length > 0 || noKo.length > 0) {
    console.log(`Day ${d.day_number} (${d.title}): ${total}단어 | 예문없음 ${noEx.length} | 해석없음 ${noKo.length} | 유효pair ${validPair}`);
  }
}
console.log('--- 이상 없는 Day는 생략 ---');
