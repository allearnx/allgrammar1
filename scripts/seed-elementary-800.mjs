/**
 * 초등 필수 영어단어 800 교재 시딩 (2026-08-04, 사장님 확정 사양)
 *
 * - 소스: scripts/elementary-800-words.json (parse-elementary-800.mjs 산출물)
 * - Day 분할: PDF 등장 순서 그대로 앞에서부터 20개씩 — "아이들이 끊어서 외우니까
 *   갯수를 딱 정하자" (주제 경계 무시, 균일 절단). 693 = 20×34 + 13 → 35 Day.
 * - 심화 89개 포함, 기초 기능어 107개 제외.
 * - quiz_type='multi' (복수 선택 퀴즈 — 유의어가 한 Day에 모이는 주제별 교재 전용)
 * - is_active=false 로 생성 — 예문 생성·검수 끝나면 관리자에서 활성화.
 * - Day description = "첫단어 ~ 끝단어 · 주제" — 인쇄 단어장에 번호가 없어
 *   학생·학부모가 Day 위치를 찾는 이정표.
 *
 * 사용: node scripts/seed-elementary-800.mjs
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const BOOK_TITLE = '초등 필수 영어단어 800';
const CHUNK = 20;

const { learnable } = JSON.parse(fs.readFileSync('scripts/elementary-800-words.json', 'utf8'));
if (learnable.length !== 693) { console.error('❌ 소스 693개 아님:', learnable.length); process.exit(1); }

// 이중 실행 가드
const { data: existing } = await sb.from('voca_books').select('id').eq('title', BOOK_TITLE).maybeSingle();
if (existing) { console.error(`❌ "${BOOK_TITLE}" 교재가 이미 있습니다 (${existing.id}) — 중단`); process.exit(1); }

const { data: maxRow } = await sb.from('voca_books').select('sort_order').order('sort_order', { ascending: false }).limit(1).single();

const { data: book, error: bookErr } = await sb.from('voca_books').insert({
  title: BOOK_TITLE,
  description: '교육부 지정 초등 800단어를 주제별로 재배치한 인쇄 단어장과 동일 순서. 핵심 403·확장 201·심화 89 = 693단어 (기초 기능어 107개는 문장 속에서 익히는 단어라 제외). Day당 20개.',
  definition_lang: 'ko',
  quiz_type: 'multi',
  sort_order: (maxRow?.sort_order ?? 0) + 1,
  is_active: false,
}).select('id').single();
if (bookErr) { console.error('❌ 교재 생성 실패:', bookErr.message); process.exit(1); }
console.log('교재 생성:', book.id);

const boundaries = [];
for (let d = 0; d * CHUNK < learnable.length; d++) {
  const words = learnable.slice(d * CHUNK, (d + 1) * CHUNK);
  const topics = [...new Set(words.map((w) => w.section))].join(', ');
  const desc = `${words[0].word} ~ ${words[words.length - 1].word} · ${topics}`;
  const { data: day, error: dayErr } = await sb.from('voca_days').insert({
    book_id: book.id,
    day_number: d + 1,
    title: `Day ${d + 1}`,
    description: desc,
    sort_order: d + 1,
  }).select('id').single();
  if (dayErr) { console.error(`❌ Day ${d + 1} 생성 실패:`, dayErr.message); process.exit(1); }

  const { error: vocabErr } = await sb.from('voca_vocabulary').insert(
    words.map((w, i) => ({
      day_id: day.id,
      front_text: w.word,
      back_text: w.meaning,
      sort_order: i,
    })),
  );
  if (vocabErr) { console.error(`❌ Day ${d + 1} 단어 삽입 실패:`, vocabErr.message); process.exit(1); }
  boundaries.push({ day: d + 1, n: words.length, desc });
}

console.log(`\n✅ ${boundaries.length} Day / ${learnable.length}단어 시딩 완료 (is_active=false)`);
for (const b of boundaries) console.log(`  Day ${String(b.day).padStart(2)} (${String(b.n).padStart(2)}개)  ${b.desc}`);
