import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: books } = await admin.from('voca_books').select('id, title, is_active').order('title');

const grand = { noEx: 0, noKo: 0, weakDays: 0 };
for (const book of books) {
  const { data: days } = await admin.from('voca_days').select('id, day_number').eq('book_id', book.id).order('day_number');
  if (!days?.length) continue;
  let words = [];
  for (let i = 0; i < days.length; i += 40) {
    const ids = days.slice(i, i + 40).map((d) => d.id);
    let from = 0;
    while (true) {
      const { data } = await admin.from('voca_vocabulary')
        .select('day_id, front_text, example_sentence, example_sentence_ko')
        .in('day_id', ids).range(from, from + 999);
      words.push(...(data ?? []));
      if (!data || data.length < 1000) break;
      from += 1000;
    }
  }
  const problems = [];
  let bookNoEx = 0, bookNoKo = 0;
  for (const d of days) {
    const dw = words.filter((w) => w.day_id === d.id);
    const noEx = dw.filter((w) => !w.example_sentence?.trim()).length;
    const noKo = dw.filter((w) => w.example_sentence?.trim() && !w.example_sentence_ko?.trim()).length;
    const valid = dw.filter((w) => {
      if (!w.example_sentence) return false;
      const esc = w.front_text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${esc}\\b`, 'i').test(w.example_sentence);
    }).length;
    bookNoEx += noEx; bookNoKo += noKo;
    if (noEx || noKo || valid < 2) {
      problems.push(`  Day ${d.day_number}: 예문없음 ${noEx}, 해석없음 ${noKo}, 유효pair ${valid}/${dw.length}`);
      if (valid < 2) grand.weakDays++;
    }
  }
  grand.noEx += bookNoEx; grand.noKo += bookNoKo;
  if (problems.length) {
    console.log(`\n📕 ${book.title}${book.is_active ? '' : ' (비활성)'} — 문제 Day ${problems.length}/${days.length}개 (예문없음 ${bookNoEx}, 해석없음 ${bookNoKo})`);
    for (const p of problems.slice(0, 8)) console.log(p);
    if (problems.length > 8) console.log(`  … 외 ${problems.length - 8}개 Day`);
  } else {
    console.log(`✅ ${book.title} — 이상 없음 (Day ${days.length})`);
  }
}
console.log(`\n=== 전체 합계: 예문없음 ${grand.noEx}개, 해석없음 ${grand.noKo}개, 매칭 위험 Day(유효pair<2) ${grand.weakDays}개 ===`);
