import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { logger } from '@/lib/logger';
import Anthropic from '@anthropic-ai/sdk';
import { requireAiJsonArray } from '@/lib/ai-json';

export const maxDuration = 120;

const anthropic = new Anthropic();

function buildPrompt(words: { id: string; front_text: string }[]) {
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

interface MatchResult {
  id: string;
  matched: boolean;
  example_sentence: string | null;
  example_sentence_ko: string | null;
}

export const POST = createApiHandler(
  // ⚠️ windowMs 기본값은 1시간 — 일괄 매칭(Day 수만큼 순회 호출)이 시간당 한도에
  // 걸렸던 사고. 분당 기준으로 명시. max 20이던 시절, 이미 대부분 매칭된 교재는
  // Day당 남은 단어가 적어 호출이 빨라져 분당 20을 넘겨 "실패" 무더기가 떴다(2026-07-19)
  // → 순차 호출이라 분당 60은 물리적으로 못 넘음, 여유 있게 상향.
  { roles: ['teacher', 'admin', 'boss'], hasBody: false, rateLimit: { max: 60, windowMs: 60_000 } },
  async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const wordsJson = formData.get('words') as string | null;

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'PDF 파일을 업로드해주세요.' }, { status: 400 });
    }
    if (!wordsJson) {
      return NextResponse.json({ error: '단어 목록이 필요합니다.' }, { status: 400 });
    }

    const words: { id: string; front_text: string }[] = JSON.parse(wordsJson);
    if (!Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ error: '단어 목록이 비어있습니다.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    logger.info('ai.match_exam_sentences', { fileSize: arrayBuffer.byteLength, wordCount: words.length });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5', // 단어/문장 추출은 구조화 작업 — Opus 대비 ~1/5 비용, 품질 검증 완료 (2026-07-17),
      max_tokens: 16384,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64Data,
              },
            },
            { type: 'text', text: buildPrompt(words) },
          ],
        },
      ],
    });

    const results = requireAiJsonArray<MatchResult>(message, 'ai.match_exam_sentences');

    // id 기준으로 매칭 결과를 맵핑 — AI가 누락한 단어는 미발견 처리
    const resultMap = new Map(results.map((r) => [r.id, r]));
    const matches = words.map((w) => {
      const r = resultMap.get(w.id);
      return {
        id: w.id,
        front_text: w.front_text,
        matched: r?.matched ?? false,
        example_sentence: r?.matched ? (r.example_sentence ?? null) : null,
        example_sentence_ko: r?.matched ? (r.example_sentence_ko ?? null) : null,
      };
    });

    return NextResponse.json({ matches });
  } catch (error) {
    logger.error('ai.match_exam_sentences', { error: error instanceof Error ? error.message : String(error) });
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `기출 예문 매칭 중 오류: ${msg}` }, { status: 500 });
  }
  }
);
