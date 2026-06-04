import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const BATCH_SIZE = 50; // 한 번에 번역할 문장 수
const CONCURRENCY = 3; // 동시 API 호출 수

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  return res.json();
}

async function supabasePatch(id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/voca_vocabulary?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH failed for ${id}: ${res.status} ${text}`);
  }
}

async function translateBatch(sentences) {
  // sentences: [{ idx, id, front_text, example_sentence }]
  const lines = sentences.map(
    (s, i) => `${i + 1}. [${s.front_text}] ${s.example_sentence}`
  );

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `다음 영어 예문들을 자연스러운 한국어로 번역해주세요.
각 문장 앞의 [단어]는 학습 중인 단어입니다. 번역에 참고하되 출력에는 포함하지 마세요.

규칙:
- 번호만 붙여서 번역만 출력 (설명 없이)
- 자연스럽고 간결한 한국어
- 의역 OK, 직역보다 자연스러움 우선

${lines.join('\n')}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  const text = data.content[0].text;

  // 번호별로 파싱
  const translations = new Map();
  const regex = /^(\d+)\.\s*(.+)$/gm;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const idx = parseInt(match[1]) - 1;
    translations.set(idx, match[2].trim());
  }

  return translations;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('📥 번역할 예문 조회 중...');

  // 실제 문장만 (길이 10자 이상)
  let allRows = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const rows = await supabaseGet(
      `voca_vocabulary?example_sentence_ko=is.null&example_sentence=not.is.null&select=id,front_text,example_sentence&order=id&limit=${pageSize}&offset=${offset}`
    );
    allRows = allRows.concat(rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  // 실제 문장만 필터 (품사 약어 등 제외)
  allRows = allRows.filter((r) => r.example_sentence.length > 10);

  console.log(`📝 번역 대상: ${allRows.length}개 문장`);

  let translated = 0;
  let failed = 0;

  // 배치 단위로 처리
  const batches = [];
  for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
    batches.push(allRows.slice(i, i + BATCH_SIZE));
  }

  console.log(`🔄 총 ${batches.length}개 배치 (배치당 ${BATCH_SIZE}문장, 동시 ${CONCURRENCY}개)\n`);

  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const chunk = batches.slice(i, i + CONCURRENCY);

    const results = await Promise.allSettled(
      chunk.map(async (batch, ci) => {
        const batchIdx = i + ci;
        try {
          const translations = await translateBatch(batch);

          // DB 업데이트
          for (let j = 0; j < batch.length; j++) {
            const ko = translations.get(j);
            if (ko) {
              await supabasePatch(batch[j].id, { example_sentence_ko: ko });
              translated++;
            } else {
              failed++;
            }
          }

          console.log(
            `  ✅ 배치 ${batchIdx + 1}/${batches.length} 완료 (누적: ${translated}개 번역)`
          );
        } catch (err) {
          console.error(`  ❌ 배치 ${batchIdx + 1} 실패:`, err.message);
          failed += batch.length;
        }
      })
    );

    // Rate limit 방지
    if (i + CONCURRENCY < batches.length) {
      await sleep(500);
    }
  }

  console.log(`\n🏁 완료! 번역: ${translated}개, 실패: ${failed}개`);
}

main().catch(console.error);
