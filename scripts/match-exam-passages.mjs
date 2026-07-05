// 기출 지문 일괄 매칭 — 폴더의 시험 지문 PDF들로 교재 단어에 실제 기출 문장 + 출처를 채운다.
//
// 폴더 구조:
//   <폴더>/<교재 키워드>/<시험명>.pdf
//   예) exam-passages/고1 3월/2024년 3월 고1 모의고사.pdf
//       exam-passages/고1 3월/2023년 3월 고1 모의고사.pdf
//   - "교재 키워드"는 voca_books 제목의 일부 (예: "고1 3월" → "최근 5개년 고1 3월 모고 단어")
//   - 파일명(확장자 제외)이 그대로 exam_source 라벨 + 학생 화면 "📄 기출" 뱃지가 됨
//
// 사용:
//   node scripts/match-exam-passages.mjs <폴더> [--dry]
//   --dry: DB에 쓰지 않고 매칭 결과만 출력
//
// 동작:
//   - exam_source가 이미 있는 단어는 건드리지 않음 (덮어쓰기 방지)
//   - 한 실행 안에서도 먼저 매칭된 단어는 이후 PDF에서 제외
//   - 자격증명은 .env.local에서 읽음 (스크립트에 비밀값 없음)

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const CHUNK = 150; // API 호출당 단어 수
const DELAY_MS = 2000;

const folder = process.argv[2];
const dryRun = process.argv.includes('--dry');
if (!folder) {
  console.error('사용법: node scripts/match-exam-passages.mjs <폴더> [--dry]');
  process.exit(1);
}

// .env.local 로드
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nfc = (s) => s.normalize('NFC');

function buildPrompt(words) {
  const wordList = words.map((w) => `- ${w.front_text} (id: ${w.id})`).join('\n');
  return `아래 단어 목록의 각 단어가 이 PDF 지문에 포함되어 있는지 찾아주세요.

## 단어 목록
${wordList}

## 규칙
1. PDF 지문에서 해당 단어(또는 변형: 시제, 복수형 등)가 포함된 문장을 원문 그대로 추출
2. 해당 문장의 자연스러운 한국어 해석도 함께 제공
3. 찾지 못한 단어는 matched: false로 표시
4. 한 단어가 여러 문장에 있으면 가장 좋은 예시 1개만 선택

JSON 배열로만 응답 (다른 텍스트 없이):
[{"id":"단어id","matched":true,"example_sentence":"원문 문장","example_sentence_ko":"한국어 해석"}]

matched가 false인 경우 example_sentence와 example_sentence_ko는 null로 설정.`;
}

function parseJsonArray(text) {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('JSON 배열을 찾지 못함');
  return JSON.parse(text.slice(start, end + 1));
}

async function matchChunk(pdfBase64, words) {
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 16384,
    messages: [{
      role: 'user',
      content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
        { type: 'text', text: buildPrompt(words) },
      ],
    }],
  });
  const text = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  return parseJsonArray(text);
}

// ── 메인 ──
const { data: books } = await sb.from('voca_books').select('id, title');
if (!books?.length) { console.error('교재 조회 실패'); process.exit(1); }

const bookDirs = readdirSync(folder).filter((d) => {
  try { return statSync(path.join(folder, d)).isDirectory(); } catch { return false; }
});
if (bookDirs.length === 0) {
  console.error(`폴더가 비어 있습니다. <폴더>/<교재 키워드>/<시험명>.pdf 구조로 넣어주세요.`);
  process.exit(1);
}

let grandMatched = 0;

for (const dir of bookDirs) {
  const keyword = nfc(dir);
  const book = books.find((b) => nfc(b.title).includes(keyword));
  if (!book) {
    console.warn(`⚠️  "${dir}" — 제목에 이 키워드가 포함된 교재를 못 찾음, 건너뜀`);
    continue;
  }
  console.log(`\n📚 교재: ${book.title} (폴더: ${dir})`);

  // 교재 단어 중 exam_source 없는 것만 대상
  const { data: days } = await sb.from('voca_days').select('id').eq('book_id', book.id);
  const dayIds = (days ?? []).map((d) => d.id);
  const { data: vocab } = await sb
    .from('voca_vocabulary')
    .select('id, front_text, exam_source')
    .in('day_id', dayIds);
  let pending = (vocab ?? []).filter((v) => !v.exam_source);
  console.log(`   단어 ${vocab?.length ?? 0}개 중 미매칭 ${pending.length}개 대상`);

  const pdfs = readdirSync(path.join(folder, dir)).filter((f) => f.toLowerCase().endsWith('.pdf'));
  for (const pdf of pdfs) {
    if (pending.length === 0) { console.log('   ✅ 남은 단어 없음 — 다음 교재로'); break; }
    const label = nfc(pdf.replace(/\.pdf$/i, ''));
    const base64 = readFileSync(path.join(folder, dir, pdf)).toString('base64');
    console.log(`   📄 ${label} — 남은 ${pending.length}개 단어 매칭 시도`);

    const matchedIds = new Set();
    for (let i = 0; i < pending.length; i += CHUNK) {
      const chunk = pending.slice(i, i + CHUNK);
      try {
        const results = await matchChunk(base64, chunk);
        const updates = results.filter((r) => r.matched && r.example_sentence);
        for (const r of updates) {
          matchedIds.add(r.id);
          if (!dryRun) {
            await sb.from('voca_vocabulary').update({
              example_sentence: r.example_sentence,
              example_sentence_ko: r.example_sentence_ko ?? null,
              exam_source: label,
            }).eq('id', r.id);
          }
        }
        console.log(`      청크 ${Math.floor(i / CHUNK) + 1}: ${updates.length}/${chunk.length}개 매칭${dryRun ? ' (dry)' : ''}`);
      } catch (e) {
        console.error(`      ❌ 청크 실패: ${e.message} — 계속 진행`);
      }
      await sleep(DELAY_MS);
    }
    grandMatched += matchedIds.size;
    pending = pending.filter((v) => !matchedIds.has(v.id));
  }
}

console.log(`\n🎉 완료 — 총 ${grandMatched}개 단어에 기출 문장 + 출처 저장${dryRun ? ' 예정 (dry run)' : ''}`);
