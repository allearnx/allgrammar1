import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/api/rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import { parseAiJsonArray } from '@/lib/ai-json';
import { isUnanswerableImageQuestion } from '@/lib/validation/problem-validator';

export const maxDuration = 300;

const anthropic = new Anthropic();

const EXTRACT_PROMPT = `이 이미지들은 중학교 영어 시험 문제지입니다. 여러 페이지일 수 있습니다.
모든 이미지에서 문제, 보기, 정답, 해설을 추출해주세요.

규칙:
- 각 문제의 번호, 문제 내용, 보기(있는 경우), 정답, 해설을 추출
- 객관식은 options 배열에 보기를 넣고, answer에 정답 번호를 넣기
- **객관식 보기는 한 칸에 하나씩** 넣으세요. 여러 보기를 한 options 항목에 묶지 마세요 (예: ["ⓐ ⓑ", "ⓒ ⓓ", "ⓔ"] 금지 → ["ⓐ", "ⓑ", "ⓒ", "ⓓ", "ⓔ"]로 분리)
- **복수정답("2개 고르시오" 등)은 answer를 쉼표로 구분**하세요 (예: "4, 5"). 붙여쓰지 마세요 (예: "45" 금지 — 채점·복수선택 UI가 깨짐)
- **"모두 고르면 / 모두 골라 / 정답 N개 / N개 고르시오 / all that apply" 문항은 정답을 절대 1개만 넣지 마세요.** 지문·해설 근거로 **맞는 선택지를 전부** 찾아 쉼표로 넣고(예: "3, 5") type을 "multi_choice"로 하세요. 해설이 두 개 이상의 선택지(③과 ⑤ 등)를 정답으로 지목하면 answer 개수도 반드시 일치해야 합니다. (정답을 1개만 저장하면 단일선택 UI로 렌더되어 학생이 무조건 오답 처리됨 — 가장 흔한 추출 오류)
- **밑줄·강조 보존**: 원본에서 밑줄/강조된 부분은 <u>...</u> 태그로 감싸세요. 특히 "밑줄 친 부분/단어"를 묻는 문항은 그 대상(단어·구·문장)을 반드시 <u>로 표시해야 합니다 — 안 하면 학생이 어디가 밑줄인지 몰라 못 풉니다.
  - **★"밑줄 친 단어의 의미/쓰임이 다른(같은) 것" 유형(보기가 각각 문장이고 그 안의 한 단어를 비교): 각 보기 문장에서 비교 대상 단어를 빠짐없이 <u>로 감싸세요.** 이 유형은 ⓐ~ⓔ 같은 마커가 없으므로 <u>가 유일한 표시 수단 — 빠뜨리면 학생이 어느 단어를 비교하는지 모릅니다.
    예: "options": ["He broke the school <u>record</u>.", "They <u>record</u> the results.", "This app <u>records</u> my distance."]
  - 지문 속 특정 단어를 묻는 경우(어휘 동의어 등)도 동일하게 <u>로 표시. (단, 지문에 ⓐ~ⓔ / (A)~(E) / ㉠~㉤ 기호 마커로 위치가 이미 표시된 경우는 그 마커로 충분 — 추가 <u> 불필요.)
- 주관식은 options를 빈 배열로, answer에 정답 텍스트를 넣기
- **결합/연결 문항([A]와 [B]를 연결하여 ~ 한 문장으로 쓰시오 등)에서 [B]를 "자유롭게 작성"하라고 하지 마세요.** 자유 작문은 정답이 무한이라 자동채점이 불가능합니다(학생이 맞게 써도 오답 처리됨). [B]는 항상 구체적인 문장(영어 또는 한국어)으로 제시해 정답이 하나로 결정되게 하세요.
- **어법 오류 수정("틀린 부분을 찾아 고치시오") 문항의 answer는 "고친 형태"만 넣으세요.** "틀린단어 / 고친단어" 쌍(예: "be / is", "that / who")으로 만들지 마세요 — 슬래시가 빈칸 분할로 오인되고 학생이 형식을 몰라 오답 처리됩니다. 고친 단어/구만(예: "is"), 또는 전체 고친 문장을 answer로 넣고 question 끝에 " ※ 고친 부분만 쓰시오." 안내를 추가하세요. 정답 후보가 여럿이면 acceptedAnswers로.
- **서술형 정답이 완전한 문장(주어+동사 포함, 마침표/물음표로 끝남)인 경우, 문제 지시문에 출력 형식을 반드시 명시하세요.** 지시문에 "전체 문장", "문장을 다시 쓰", "완전한 문장으로", "영작", "배열하여 완성" 같은 안내가 이미 있으면 그대로 두고, 없으면 question 끝에 " ※ 완전한 문장으로 쓰시오."를 추가하세요. (학생이 빈칸 부분만 써서 오답 처리되는 것을 방지)
- 해설이 없으면 explanation은 빈 문자열
- 문제 번호(number)는 원본에 적힌 원래 번호를 그대로 사용
- **★공통 지문 필수 복제 (가장 치명적인 추출 누락):** 시험지에서 "[4~6] 다음 글을 읽고 물음에 답하시오" 처럼 **번호 범위 머리글([N~M]/[N-M]) 아래에 지문·대화가 한 번만 인쇄**되고 그 아래 여러 문제가 딸린 경우, 그 지문을 **범위 내 모든 문제(N번~M번)의 question 앞에 각각 그대로 복제**해 넣으세요. 한 문제에만 넣고 나머지를 "위 글/위 대화" 참조로 비워두면 그 문제들은 지문이 없어 학생이 절대 못 풉니다.
  - 적용 대상: 긴 글(passage)뿐 아니라 **대화문(dialogue), 요약문, 도표/표**도 동일하게 전체 복제.
  - **지문 속 마커 보존 필수:** 지문에 ⓐ~ⓕ / ㉠~㉤ / (A)~(C) 같은 밑줄·빈칸 마커가 있고 문제가 그걸 가리키면(예: "밑줄 친 that의 쓰임", "위 대화의 (A)와 바꿔 쓸 수 있는 것", "㉠~㉤ 중 알맞지 않은 것"), 그 **마커가 표시된 채로** 지문을 복제하세요. 마커 없는 맨 지문만 넣으면 못 풉니다.
  - "위 글 / 위 대화 / 윗글"로 시작하거나 그것을 가리키는 문제는 **반드시 자기 question 안에 해당 지문 전체를 포함**해야 합니다(참조만 두면 안 됨).
  - 예: "[지문]\\nAcky: Someone who stole ⓐthat photo... ⓒthat is fake...\\n\\n위 대화의 밑줄 친 that의 쓰임이 같은 것끼리 짝지은 것은?"
- **★표(table)는 텍스트로 재현해 살리고, 그림·사진은 묘사하지 말 것:**
  - **표 / 표 형태 데이터**(시간표·가격표·일정표·정보표 등 글자·숫자로 된 표)는 **마크다운 파이프 표로 그대로 재현**해 question에 포함하세요. 표는 글로 정확히 옮길 수 있어 문항을 살립니다.
    예: "다음 표를 보고 물음에 답하시오.\\n\\n| 이름 | 나이 | 취미 |\\n| --- | --- | --- |\\n| Tom | 14 | soccer |\\n\\n..."
  - **그림·사진·삽화·지도·표지판·그래프/차트**처럼 시각 자료를 직접 봐야 풀 수 있는 문항은 \`(그림: ...)\` 같은 묘사로 살리려 하지 마세요. 묘사는 부정확해 학생이 오히려 못 풉니다. 이런 문항은 원문 그대로 추출하면 저장 시 자동 삭제됩니다(정상 동작). 보이지 않는 내용을 지어내지 마세요.
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
    const dedup = allQuestions
      .sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0))
      .filter((q) => {
        const num = Number(q.number);
        if (seen.has(num)) return false;
        seen.add(num);
        return true;
      });

    // 그림·사진·지도·그래프 의존 문항은 미리보기에 노출하지 않고 추출 단계에서 제거(표는 유지).
    const before = dedup.length;
    const questions = dedup.filter((q) => !isUnanswerableImageQuestion(String(q.question ?? '')));
    questions.forEach((q, i) => { q.number = i + 1; });
    const removedImageCount = before - questions.length;

    if (questions.length === 0) {
      return NextResponse.json(
        { error: '이미지에서 문제를 찾을 수 없습니다. 이미지를 확인해주세요.' },
        { status: 422 },
      );
    }

    logger.info('ai.extract_images.done', { count: questions.length, removedImageCount });
    return NextResponse.json({ questions, ...(removedImageCount > 0 && { removedImageCount }) });
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
