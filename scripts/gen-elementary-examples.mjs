/**
 * 초등 필수 영어단어 800 — 예문 + 한글 해석 전량 생성 (2026-08-04).
 * backfill-wordmaster-examples.mjs 재사용 (교재명 + 초등 눈높이 프롬프트로 조정).
 *
 * - Sonnet 5, 예문 10단어 이내·초등 수준, 표제어 원형 포함(blankOut \b 매칭용)
 * - 스펠링 모호 7쌍(뜻·글자수가 모두 같아 예문만이 단서): 쌍별 구분 힌트를 프롬프트에 주입
 *   hat/cap · tree/wood · hour/time · ship/boat · city/town · put/set · good/nice
 * - 생성 후 원형 포함 검증 통과분만 저장, 실패분 1회 재시도
 *
 *   node scripts/gen-elementary-examples.mjs          # dry-run
 *   node scripts/gen-elementary-examples.mjs --apply  # 생성 + 저장
 */
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** 뜻+글자수가 겹치는 쌍 — 예문이 유일한 단서라 서로 확실히 다른 맥락을 강제 */
const DISAMBIG = {
  hat: '챙 있는 모자·외출 모자 맥락 (야구모자 아님 — cap과 구분)',
  cap: '야구 모자(baseball cap) 맥락 (hat과 구분)',
  tree: '심고 자라는 살아있는 나무 (재료 아님 — wood와 구분)',
  wood: '목재·나무 재료 맥락 (made of wood 등 — tree와 구분)',
  hour: '지속 시간(an hour 동안) 맥락 (time과 구분)',
  time: '시각·때(What time ~?) 맥락 (hour와 구분)',
  ship: '바다를 건너는 큰 배 (boat와 구분)',
  boat: '호수·강의 작은 배 (ship과 구분)',
  city: '큰 도시(서울 같은) 맥락 (town과 구분)',
  town: '작은 도시·마을 맥락 (city와 구분)',
  put: '물건을 ~에 놓다(put ~ on the desk) 맥락 (set과 구분)',
  set: '상을 차리다·알람을 맞추다(set the table/alarm) 맥락 (put과 구분)',
  good: '좋은 것·잘한 것(a good idea) 맥락 (nice와 구분)',
  nice: '친절한·멋진(nice to me, a nice day) 맥락 (good과 구분)',
};

const containsWord = (sentence, word) => {
  const esc = word.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${esc}\\b`, 'i').test(sentence);
};

function parseJson(msg) {
  const text = msg.content.find((b) => b.type === 'text')?.text ?? '';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('JSON 배열을 찾지 못함: ' + text.slice(0, 120));
  return JSON.parse(match[0]);
}

async function generateExamples(words) {
  const list = words
    .map((w) => `- ${w.front_text} (${w.back_text})${DISAMBIG[w.front_text] ? ` ← 맥락 필수: ${DISAMBIG[w.front_text]}` : ''}`)
    .join('\n');
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `초등학생 영어 단어장의 예문을 만들어줘. 각 단어에 대해:
- 예문은 10단어 이내, 초등학생이 아는 쉬운 단어로만 (학교·가족·친구·동물·음식 같은 일상 맥락)
- 예문에 표제어가 반드시 "원형 그대로" 포함될 것 (복수형·과거형·3인칭 변형 금지 — 빈칸 생성에 원형 매칭이 필요)
- "맥락 필수"가 붙은 단어는 그 맥락이 예문에 분명히 드러나야 함 (뜻이 같은 짝꿍 단어와 예문만으로 구분되도록)
- ko는 예문의 자연스러운 한국어 해석 (직역보다 의역, 초등 눈높이)

단어 목록:
${list}

JSON 배열로만 답해: [{"word":"표제어","en":"예문","ko":"해석"}, ...]`,
    }],
  });
  return parseJson(msg);
}

// ── 대상 수집 ──
const { data: book } = await admin.from('voca_books').select('id').eq('title', '초등 필수 영어단어 800').single();
const { data: days } = await admin.from('voca_days').select('id, day_number').eq('book_id', book.id).order('day_number');
const dayNum = new Map(days.map((d) => [d.id, d.day_number]));
const { data: words } = await admin
  .from('voca_vocabulary')
  .select('id, day_id, front_text, back_text, example_sentence')
  .in('day_id', days.map((d) => d.id))
  .order('day_id, sort_order');

const target = words.filter((w) => !w.example_sentence?.trim());
console.log(`예문 생성 대상: ${target.length}/${words.length}개`);
if (!APPLY) {
  for (const w of target.slice(0, 5)) console.log(`  예) Day ${dayNum.get(w.day_id)} ${w.front_text} (${w.back_text})`);
  console.log('--apply로 실행하세요');
  process.exit(0);
}

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, (i + 1) * n));
let ok = 0;
let pending = target;
for (let attempt = 1; attempt <= 2 && pending.length; attempt++) {
  const failed = [];
  for (const batch of chunk(pending, 15)) {
    let results;
    try {
      results = await generateExamples(batch);
    } catch (e) {
      console.error(`\n배치 실패(재시도 대상): ${e.message}`);
      failed.push(...batch);
      continue;
    }
    const byWord = new Map(results.map((r) => [r.word.toLowerCase().trim(), r]));
    for (const w of batch) {
      const r = byWord.get(w.front_text.toLowerCase().trim());
      if (!r?.en || !r?.ko || !containsWord(r.en, w.front_text)) {
        failed.push(w);
        continue;
      }
      const { error } = await admin
        .from('voca_vocabulary')
        .update({ example_sentence: r.en.trim(), example_sentence_ko: r.ko.trim() })
        .eq('id', w.id);
      if (error) failed.push(w);
      else ok++;
    }
    process.stdout.write(`\r예문 저장 ${ok}/${target.length} (시도 ${attempt})`);
  }
  pending = failed;
}
console.log(`\n\n완료 — ${ok}/${target.length}`);
if (pending.length) console.log('실패:', pending.map((w) => `Day${dayNum.get(w.day_id)} ${w.front_text}`).join(', '));
