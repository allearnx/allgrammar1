import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: book } = await admin.from('voca_books').select('id').eq('title', '워드마스터 중등 고난도').single();
const { data: days } = await admin.from('voca_days').select('id').eq('book_id', book.id);
let total = 0, withAudio = 0, sample = null;
for (let i = 0; i < days.length; i += 40) {
  let from = 0;
  while (true) {
    const { data } = await admin.from('voca_vocabulary').select('id, front_text, audio_url')
      .in('day_id', days.slice(i, i + 40).map((d) => d.id)).order('id').range(from, from + 999);
    for (const w of data ?? []) { total++; if (w.audio_url) { withAudio++; sample ??= w; } }
    if (!data || data.length < 1000) break;
    from += 1000;
  }
}
console.log(`워드마스터 음원: ${withAudio}/${total}`);
if (sample) {
  const res = await fetch(sample.audio_url);
  console.log(`샘플 (${sample.front_text}): HTTP ${res.status}, ${res.headers.get('content-type')}, ${res.headers.get('content-length')}bytes`);
}
