import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/api/rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import { parseAiJsonArray } from '@/lib/ai-json';

export const maxDuration = 300;

const anthropic = new Anthropic();

const EXTRACT_PROMPT = `이 이미지들은 중학교 영어 시험 문제지입니다. 여러 페이지일 수 있습니다.
모든 이미지에서 문제, 보기, 정답, 해설을 추출해주세요.

규칙:
- 각 문제의 번호, 문제 내용, 보기(있는 경우), 정답, 해설을 추출
- 객관식은 options 배열에 보기를 넣고, answer에 정답 번호를 넣기
- **객관식 보기는 한 칸에 하나씩** 넣으세요. 여러 보기를 한 options 항목에 묶지 마세요 (예: ["ⓐ ⓑ", "ⓒ ⓓ", "ⓔ"] 금지 → ["ⓐ", "ⓑ", "ⓒ", "ⓓ", "ⓔ"]로 분리)
- **복수정답("2개 고르시오" 등)은 answer를 쉼표로 구분**하세요 (예: "4, 5"). 붙여쓰지 마세요 (예: "45" 금지 — 채점·복수선택 UI가 깨짐)
- 주관식은 options를 빈 배열로, answer에 정답 텍스트를 넣기
- **서술형 정답이 완전한 문장(주어+동사 포함, 마침표/물음표로 끝남)인 경우, 문제 지시문에 출력 형식을 반드시 명시하세요.** 지시문에 "전체 문장", "문장을 다시 쓰", "완전한 문장으로", "영작", "배열하여 완성" 같은 안내가 이미 있으면 그대로 두고, 없으면 question 끝에 " ※ 완전한 문장으로 쓰시오."를 추가하세요. (학생이 빈칸 부분만 써서 오답 처리되는 것을 방지)
- 해설이 없으면 explanation은 빈 문자열
- 문제 번호(number)는 원본에 적힌 원래 번호를 그대로 사용
- **중요: 긴 지문(passage) 아래에 여러 문제가 있는 경우, 각 문제의 question 앞에 해당 지문을 반드시 포함하세요.**
  예: "[지문]\\nThe boy went to the store...\\n\\n위 글의 주제로 가장 적절한 것은?"
  지문이 여러 문제에 공유되더라도 모든 문제에 각각 지문을 넣어주세요.
- 반드시 JSON 배열로만 응답하세요. 앞뒤에 설명이나 마크다운 코드펜스 없이 순수 JSON만 출력

JSON 배열 형식:
[
  {
    "number": 1,
    "question": "문제 내용 (지문이 있으면 [지문] 태그와 함께 포함)",
    "options": ["1번 보기", "2번 보기", "3번 보기", "4번 보기", "5번 보기"],
    "answer": "3",
    "explanation": "해설"
  }
]`;

const EXTRACT_PROMPT_ENG_ENG_DEF = `이 이미지들은 중학교 영어 영영풀이(English-English definition) 문제지입니다.
문제를 추출하되, 아래 3가지 유형을 정확히 구분해서 추출하세요.

## 유형별 추출 규칙

### 1. 객관식 (MCQ)
- options: 4~5개 영어 단어 배열, answer: 정답 번호 ("1"~"5")

### 2. 서술형 (Writing)
- options: null, answer: 정답 단어 (소문자), acceptedAnswers: 변형 배열

### 3. 문맥 빈칸 (Context)
- options: null, answer: 정답 단어 (소문자), acceptedAnswers: 변형 배열

## 공통 규칙
- 문제 번호는 원본 그대로
- explanation: 한국어 해설 (없으면 빈 문자열)
- 반드시 JSON 배열로만 응답

JSON 배열 형식:
[
  { "number": 1, "question": "문제 내용", "options": ["a","b","c","d"], "answer": "1", "explanation": "해설" },
  { "number": 2, "question": "서술형 문제", "options": null, "answer": "teacher", "explanation": "", "acceptedAnswers": ["Teacher"] }
]`;

function getPrompt(extractType: string | null): string {
  return extractType === 'eng_eng_def' ? EXTRACT_PROMPT_ENG_ENG_DEF : EXTRACT_PROMPT;
}

type MediaType = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !['teacher', 'admin', 'boss'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  try { await requireContentPermission(user, supabase); } catch {
    return NextResponse.json({ error: '콘텐츠 관리 권한이 없습니다.' }, { status: 403 });
  }

  const limited = await checkRateLimit(user.id, 'naesin/problems/extract-images', 50);
  if (limited) return limited;

  try {
    const { imageUrls, extractType } = await request.json() as {
      imageUrls: { url: string; mediaType: string }[];
      extractType?: string;
    };

    if (!imageUrls?.length) {
      return NextResponse.json({ error: '이미지 URL이 필요합니다.' }, { status: 400 });
    }
    if (imageUrls.length > 10) {
      return NextResponse.json({ error: '이미지는 최대 10장까지 가능합니다.' }, { status: 400 });
    }

    const prompt = getPrompt(extractType || null);

    logger.info('ai.extract_images.start', {
      userId: user.id,
      imageCount: imageUrls.length,
    });

    const content: Anthropic.MessageCreateParams['messages'][0]['content'] = [
      ...imageUrls.map((img) => ({
        type: 'image' as const,
        source: { type: 'url' as const, url: img.url } as { type: 'url'; url: string },
      })),
      { type: 'text' as const, text: prompt },
    ];

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 16384,
      messages: [{ role: 'user', content }],
    });

    const allQuestions = parseAiJsonArray(message) as Record<string, unknown>[];

    // 정답 원문자(①→1) 정규화 + 중첩 배열 옵션 평탄화
    const circledToDigit: Record<string, string> = { '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5', '⑥': '6' };
    for (const q of allQuestions) {
      if (typeof q.answer === 'string' && circledToDigit[q.answer]) {
        q.answer = circledToDigit[q.answer];
      }
      if (Array.isArray(q.options)) {
        q.options = (q.options as unknown[]).map((opt) =>
          Array.isArray(opt) ? opt.map((item: unknown, i: number) => `(${String.fromCharCode(65 + i)}) ${item}`).join(' — ') : String(opt),
        );
      }
    }

    // 문제 번호순 정렬 + 중복 제거
    const seen = new Set<number>();
    const questions = allQuestions
      .sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0))
      .filter((q) => {
        const num = Number(q.number);
        if (seen.has(num)) return false;
        seen.add(num);
        return true;
      });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: '이미지에서 문제를 찾을 수 없습니다. 이미지를 확인해주세요.' },
        { status: 422 },
      );
    }

    logger.info('ai.extract_images.done', { count: questions.length });
    return NextResponse.json({ questions });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const apiStatus = (error as { status?: number })?.status;

    console.log(JSON.stringify({
      level: 'error',
      msg: 'ai.extract_images.error',
      ts: new Date().toISOString(),
      error: msg,
      status: apiStatus,
    }));

    if (msg.includes('too large') || msg.includes('token') || msg.includes('size')) {
      return NextResponse.json(
        { error: '이미지가 너무 크거나 많습니다. 이미지를 줄여서 다시 시도해주세요.' },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: `AI 서버 연결에 실패했습니다. (${apiStatus ?? '?'}: ${msg.slice(0, 120)})` },
      { status: 502 },
    );
  }
}
