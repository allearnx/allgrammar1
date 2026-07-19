/**
 * 워드마스터 중등 고난도 — 누락 예문/해석 백필 (2026-07-19, 사장님 신고: Day 2·3 예문 없음).
 * - 예문 없음(Day 2·3 전체 60 + Day 6 1개): Sonnet 5로 생성 (중학생 수준, 15단어 이내,
 *   front_text 원형 그대로 포함 — blankOut \b 매칭용) + 한글 해석
 * - 해석 없음(Day 6·23~30 약 180개): Haiku로 한글 해석만 생성
 * 생성 후 원형 포함 검증 통과분만 저장, 실패분은 재시도.
 *
 *   node scripts/backfill-wordmaster-examples.mjs          # dry-run (대상만 출력)
 *   node scripts/backfill-wordmaster-examples.mjs --apply  # 생성 + 저장
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

const containsWord = (sentence, word) => {
  const esc = word.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${esc}\\b`, 'i').test(sentence);
};

/** 응답에서 JSON 배열 파싱 — text 블록 탐색(content[0] 고정 접근 금지) */
function parseJson(msg) {
  const text = msg.content.find((b) => b.type === 'text')?.text ?? '';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('JSON 배열을 찾지 못함: ' + text.slice(0, 120));
  return JSON.parse(match[0]);
}

async function generateExamples(words) {
  const list = words.map((w) => `- ${w.front_text} (${w.back_text})`).join('\n');
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `중학생 영어 단어장의 예문을 만들어줘. 각 단어에 대해:
- 예문은 15단어 이내, 중학생 수준의 자연스러운 문장
- 예문에 표제어가 반드시 "원형 그대로" 포함될 것 (복수형·과거형·3인칭 변형 금지 — 빈칸 생성에 원형 매칭이 필요)
- ko는 예문의 자연스러운 한국어 해석 (직역보다 의역)

단어 목록:
${list}

JSON 배열로만 답해: [{"word":"표제어","en":"예문","ko":"해석"}, ...]`,
    }],
  });
  return parseJson(msg);
}

async function generateTranslations(words) {
  const list = words.map((w) => `- ${w.front_text}: ${w.example_sentence}`).join('\n');
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `영어 예문의 자연스러운 한국어 해석을 만들어줘 (직역보다 의역, 중학생 눈높이).

${list}

JSON 배열로만 답해: [{"word":"표제어","ko":"해석"}, ...]`,
    }],
  });
  return parseJson(msg);
}

// ── 대상 수집 ──
const { data: book } = await admin.from('voca_books').select('id').eq('title', '워드마스터 중등 고난도').single();
const { data: days } = await admin.from('voca_days').select('id, day_number').eq('book_id', book.id).order('day_number');
const dayNum = new Map(days.map((d) => [d.id, d.day_number]));
const { data: words } = await admin
  .from('voca_vocabulary')
  .select('id, day_id, front_text, back_text, example_sentence, example_sentence_ko')
  .in('day_id', days.map((d) => d.id));

const needExample = words.filter((w) => !w.example_sentence?.trim());
const needKo = words.filter((w) => w.example_sentence?.trim() && !w.example_sentence_ko?.trim());
console.log(`예문 생성 대상: ${needExample.length}개 / 해석만 생성 대상: ${needKo.length}개`);
if (!APPLY) {
  for (const w of needExample.slice(0, 5)) console.log(`  예) Day ${dayNum.get(w.day_id)} ${w.front_text}`);
  console.log('--apply로 실행하세요');
  process.exit(0);
}

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, (i + 1) * n));
let exOk = 0, exFail = [], koOk = 0, koFail = [];

// ── 1. 예문 생성 (검증 + 1회 재시도) ──
let pending = needExample;
for (let attempt = 1; attempt <= 2 && pending.length; attempt++) {
  const failed = [];
  for (const batch of chunk(pending, 15)) {
    const results = await generateExamples(batch);
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
      else exOk++;
    }
    process.stdout.write(`\r예문 저장 ${exOk}/${needExample.length} (시도 ${attempt})`);
  }
  pending = failed;
}
exFail = pending;
console.log();

// ── 2. 해석만 생성 ──
let pendingKo = needKo;
for (let attempt = 1; attempt <= 2 && pendingKo.length; attempt++) {
  const failed = [];
  for (const batch of chunk(pendingKo, 25)) {
    const results = await generateTranslations(batch);
    const byWord = new Map(results.map((r) => [r.word.toLowerCase().trim(), r]));
    for (const w of batch) {
      const r = byWord.get(w.front_text.toLowerCase().trim());
      if (!r?.ko?.trim()) {
        failed.push(w);
        continue;
      }
      const { error } = await admin
        .from('voca_vocabulary')
        .update({ example_sentence_ko: r.ko.trim() })
        .eq('id', w.id);
      if (error) failed.push(w);
      else koOk++;
    }
    process.stdout.write(`\r해석 저장 ${koOk}/${needKo.length} (시도 ${attempt})`);
  }
  pendingKo = failed;
}
koFail = pendingKo;
console.log();

console.log(`\n완료 — 예문 ${exOk}/${needExample.length}, 해석 ${koOk}/${needKo.length}`);
if (exFail.length) console.log('예문 실패:', exFail.map((w) => w.front_text).join(', '));
if (koFail.length) console.log('해석 실패:', koFail.map((w) => w.front_text).join(', '));
