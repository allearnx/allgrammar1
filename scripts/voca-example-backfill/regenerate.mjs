// 올킬보카 예문-표제어 활용형 불일치 백필 (A안)
// 사용: node scripts/voca-example-backfill/regenerate.mjs [배치크기] [스킵개수]
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs';

const BATCH_SIZE = Number(process.argv[2] || 200);
const SKIP = Number(process.argv[3] || 0);
const BACKUP_PATH = `scripts/voca-example-backfill/backup-${Date.now()}.json`;

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic();

function isPhrasal(w) {
  return /[AB]\b|~|\.\.\./.test(w) || /\s/.test(w.trim());
}

function wholeWordMatch(text, word) {
  const escaped = word.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
}

async function fetchAllVocab() {
  let all = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('voca_vocabulary')
      .select('id, front_text, back_text, example_sentence, example_sentence_ko, day_id')
      .not('example_sentence', 'is', null)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function regenerateBatch(items) {
  const prompt = `아래 영어 단어 목록에 대해 예문을 새로 생성해주세요.

규칙:
- 각 단어의 id를 그대로 유지
- 예문(e): 반드시 모든 단어에 새 예문을 생성 (null 불가)
  - 고등학생이 쉽게 이해할 수 있는 짧고 간단한 문장 (10단어 이내)
  - 해당 단어의 뜻이 문맥에서 자연스럽게 드러나야 함
  - ⭐ 예문에는 표제어를 원형(기본형) 그대로 넣을 것 — 과거형·복수형·3인칭 단수 등
    활용형 절대 금지. 반드시 표제어 스펠링 그대로 문장에 포함
- 예문 한글 해석(ek): 영어 예문에 대응하는 자연스러운 한국어 해석 (null 불가)

단어 목록 (id, 단어, 뜻):
${items.map((v) => `${v.id}|${v.front_text}|${v.back_text}`).join('\n')}

JSON 배열로만 응답 (다른 텍스트 없이):
[{"id":"원본id","e":"Example sentence.","ek":"예문 해석."}]`;

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = msg.content[0].text.trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('JSON 파싱 실패: ' + text.slice(0, 200));
  return JSON.parse(jsonMatch[0]);
}

async function main() {
  console.log('전체 단어 조회 중...');
  const all = await fetchAllVocab();
  const mismatched = all.filter((w) => !isPhrasal(w.front_text) && !wholeWordMatch(w.example_sentence, w.front_text));
  console.log(`활용형 불일치 총 ${mismatched.length}개 중 ${SKIP}개 스킵, 이번 배치 ${BATCH_SIZE}개 처리`);

  const batch = mismatched.slice(SKIP, SKIP + BATCH_SIZE);
  if (batch.length === 0) {
    console.log('처리할 항목 없음 (완료됨)');
    return;
  }

  // 백업 저장
  fs.writeFileSync(BACKUP_PATH, JSON.stringify(batch, null, 1));
  console.log('백업 저장:', BACKUP_PATH);

  // AI 생성 (20개씩 나눠서 호출 — 컨텍스트/파싱 안정성)
  const CHUNK = 20;
  const results = [];
  for (let i = 0; i < batch.length; i += CHUNK) {
    const chunk = batch.slice(i, i + CHUNK);
    console.log(`생성 중... ${i + chunk.length}/${batch.length}`);
    try {
      const r = await regenerateBatch(chunk);
      results.push(...r);
    } catch (e) {
      console.log('청크 실패, 스킵:', e.message);
    }
  }

  // 검증: 표제어가 whole-word로 새 예문에 있는지 확인 후 통과분만 반영
  const byId = new Map(batch.map((w) => [w.id, w]));
  let applied = 0;
  let rejected = 0;
  const rejectedList = [];
  for (const r of results) {
    const orig = byId.get(r.id);
    if (!orig || !r.e || !r.ek) { rejected++; continue; }
    if (!wholeWordMatch(r.e, orig.front_text)) {
      rejected++;
      rejectedList.push({ front_text: orig.front_text, generated: r.e });
      continue;
    }
    const { error } = await supabase
      .from('voca_vocabulary')
      .update({ example_sentence: r.e, example_sentence_ko: r.ek })
      .eq('id', r.id);
    if (error) { console.log('DB 업데이트 실패:', orig.front_text, error.message); rejected++; continue; }
    applied++;
  }

  console.log(`\n=== 결과 ===`);
  console.log('적용:', applied, '/ 거부(재시도 필요):', rejected);
  if (rejectedList.length > 0) {
    console.log('거부 샘플:', rejectedList.slice(0, 5));
  }
  console.log(`\n다음 배치: node scripts/voca-example-backfill/regenerate.mjs ${BATCH_SIZE} ${SKIP + BATCH_SIZE}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
