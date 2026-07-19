/**
 * 교재 단어 음원 일괄 생성 — ElevenLabs TTS + Supabase Storage 업로드.
 * 앱의 tts/batch 라우트와 동일 로직(예문 우선, 타임스탬프 포함)을 로컬에서 대량 실행.
 * audio_url 없는 단어만 처리하므로 중단 후 재실행해도 이어서 돈다.
 *
 *   node scripts/generate-book-audio.mjs "워드마스터 중등 고난도"          # dry-run (대상 수만)
 *   node scripts/generate-book-audio.mjs "워드마스터 중등 고난도" --apply  # 생성 실행
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const BOOK_TITLE = process.argv[2];
const APPLY = process.argv.includes('--apply');
if (!BOOK_TITLE) { console.log('사용법: node scripts/generate-book-audio.mjs "교재명" [--apply]'); process.exit(1); }

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const XI_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
if (!XI_KEY || !VOICE_ID) { console.log('ELEVENLABS 키 미설정'); process.exit(1); }

/** 문자 타임스탬프 → 단어 타임스탬프 (src/lib/voca/elevenlabs.ts와 동일 로직) */
function computeWordTimestamps(alignment) {
  const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } = alignment;
  const words = [];
  let cur = '', s = 0, e = 0;
  for (let i = 0; i < characters.length; i++) {
    const ch = characters[i];
    if (ch === ' ' || ch === '\n') {
      if (cur) { words.push({ word: cur, start: s, end: e }); cur = ''; }
      continue;
    }
    if (!cur) s = starts[i];
    cur += ch;
    e = ends[i];
  }
  if (cur) words.push({ word: cur, start: s, end: e });
  return words;
}

async function generate(text) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': XI_KEY },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', output_format: 'mp3_44100_128' }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 120)}`);
  const data = await res.json();
  return { buffer: Buffer.from(data.audio_base64, 'base64'), timestamps: computeWordTimestamps(data.alignment) };
}

// ── 대상 수집 ──
const { data: book } = await admin.from('voca_books').select('id').eq('title', BOOK_TITLE).single();
if (!book) { console.log('교재 없음:', BOOK_TITLE); process.exit(1); }
const { data: days } = await admin.from('voca_days').select('id').eq('book_id', book.id);
let targets = [];
for (let i = 0; i < days.length; i += 40) {
  let from = 0;
  while (true) {
    const { data } = await admin.from('voca_vocabulary')
      .select('id, front_text, example_sentence, audio_url')
      .in('day_id', days.slice(i, i + 40).map((d) => d.id)).order('id').range(from, from + 999);
    targets.push(...(data ?? []).filter((w) => !w.audio_url));
    if (!data || data.length < 1000) break;
    from += 1000;
  }
}
const totalChars = targets.reduce((s, w) => s + (w.example_sentence || w.front_text).length, 0);
console.log(`${BOOK_TITLE}: 음원 생성 대상 ${targets.length}개 (약 ${totalChars.toLocaleString()}자)`);
if (!APPLY) { console.log('--apply로 실행하세요'); process.exit(0); }

let ok = 0, fail = 0;
for (const w of targets) {
  const text = w.example_sentence || w.front_text;
  try {
    const { buffer, timestamps } = await generate(text);
    const path = `voca/${w.id}.mp3`;
    const { error: upErr } = await admin.storage.from('public-audio')
      .upload(path, buffer, { contentType: 'audio/mpeg', upsert: true });
    if (upErr) throw new Error(`storage: ${upErr.message}`);
    const { data: urlData } = admin.storage.from('public-audio').getPublicUrl(path);
    const { error: dbErr } = await admin.from('voca_vocabulary')
      .update({ audio_url: urlData.publicUrl, word_timestamps: timestamps })
      .eq('id', w.id);
    if (dbErr) throw new Error(`db: ${dbErr.message}`);
    ok++;
  } catch (err) {
    fail++;
    console.log(`\n✗ ${w.front_text}: ${err.message}`);
    if (fail >= 20) { console.log('실패 20회 — 중단 (재실행하면 이어서 처리)'); break; }
  }
  if ((ok + fail) % 25 === 0) console.log(`진행 ${ok + fail}/${targets.length} (성공 ${ok}, 실패 ${fail})`);
  await new Promise((r) => setTimeout(r, 250)); // ElevenLabs 레이트리밋 여유
}
console.log(`\n완료 — 성공 ${ok} / 실패 ${fail} / 대상 ${targets.length}`);
