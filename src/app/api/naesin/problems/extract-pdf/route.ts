import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/api/rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import { parseAiJsonArray, parseAiJsonObject } from '@/lib/ai-json';
import { PDFDocument } from 'pdf-lib';
import { isUnanswerableImageQuestion, backfillSharedPassages } from '@/lib/validation/problem-validator';
import type { NaesinProblemQuestion } from '@/types/naesin';

export const maxDuration = 300;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
// pdf-lib copyPages가 한글 CID 폰트를 제대로 복사하지 못해 한글 깨짐 발생.
// 시험 문제지는 대부분 20페이지 이하이므로 분할 없이 통째로 Claude에 전달.
const PAGES_PER_CHUNK = 50;
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);

const anthropic = new Anthropic();

const EXTRACT_PROMPT_DEFAULT = `이 이미지/문서는 중학교 영어 시험 문제지입니다.
문제, 보기, 정답, 해설을 추출해주세요.

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
- **결합/연결 문항([A]와 [B]를 연결하여 ~ 한 문장으로 쓰시오 등)에서 [B]를 "자유롭게 작성"하라고 하지 마세요.** 자유 작문은 정답이 무한이라 자동채점이 불가능합니다(학생이 맞게 써도 오답 처리됨). [B]는 항상 구체적인 문장(영어 또는 한국어)으로 제시해 정답이 하나로 결정되게 하세요. 원본이 자유작문이면 [B]에 정답 문장에 대응하는 구체 문장을 넣어 고정 문항으로 만드세요.
- **서술형 정답이 완전한 문장(주어+동사 포함, 마침표/물음표로 끝남)인 경우, 문제 지시문에 출력 형식을 반드시 명시하세요.** 지시문에 "전체 문장", "문장을 다시 쓰", "완전한 문장으로", "영작", "배열하여 완성" 같은 안내가 이미 있으면 그대로 두고, 없으면 question 끝에 " ※ 완전한 문장으로 쓰시오."를 추가하세요. (학생이 빈칸 부분만 써서 오답 처리되는 것을 방지)
- **어법 오류 수정("틀린 부분을 찾아 고치시오") 문항의 answer는 "고친 형태"만 넣으세요.** "틀린단어 / 고친단어" 쌍(예: "be / is", "that / who")으로 만들지 마세요 — 슬래시가 빈칸 분할로 오인되고 학생이 형식을 몰라 오답 처리됩니다. 고친 단어/구만(예: "is"), 또는 더 명확하면 전체 고친 문장을 answer로 넣고, question 끝에 " ※ 고친 부분만 쓰시오." 안내를 추가하세요. 정답 후보가 여럿이면 acceptedAnswers 배열로 넣으세요.
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

const EXTRACT_PROMPT_ENG_ENG_DEF = `이 이미지/문서는 중학교 영어 영영풀이(English-English definition) 문제지입니다.
문제를 추출하되, 아래 3가지 유형을 정확히 구분해서 추출하세요.

## 유형별 추출 규칙

### 1. 객관식 (MCQ) — 영영 뜻을 보고 단어를 고르는 문제
- options: 4~5개 영어 단어 배열
- answer: 정답 번호 (문자열 "1"~"5")
- 예: "다음 영영 뜻에 해당하는 단어로 알맞은 것은?"

### 2. 서술형 (Writing) — 영영 뜻을 보고 단어를 직접 쓰는 문제
- options: null (반드시 null)
- answer: 정답 단어 (소문자)
- acceptedAnswers: 대소문자 변형, 관사 포함 등 허용 답안 배열
- 예: "다음 영영 뜻에 해당하는 단어를 쓰시오."

### 3. 문맥 빈칸 (Context) — 문장 속 빈칸에 영영 뜻 힌트가 있는 문제
- options: null (반드시 null)
- answer: 정답 단어 (소문자)
- acceptedAnswers: 대소문자/복수형 변형 배열
- 문장에서 빈칸(___)과 괄호 안 영영 뜻이 함께 제시됨
- 예: "The ___ was very impressive. (= the act of performing)"

## 공통 규칙
- 문제 번호(number)는 원본에 적힌 원래 번호를 그대로 사용
- explanation: 한국어로 간결한 해설 (영영 뜻 해석 + 정답 설명)
- 해설이 없으면 explanation은 빈 문자열
- 객관식이 아닌 문제(서술형/문맥빈칸)는 반드시 options를 null로 설정
- 반드시 JSON 배열로만 응답하세요. 앞뒤에 설명이나 마크다운 코드펜스 없이 순수 JSON만 출력

JSON 배열 형식:
[
  {
    "number": 1,
    "question": "다음 영영 뜻에 해당하는 단어로 알맞은 것은?\\n\\"to make something better\\"",
    "options": ["improve", "remove", "approve", "provide", "involve"],
    "answer": "1",
    "explanation": "improve: 개선하다. 'to make something better'에 해당합니다."
  },
  {
    "number": 2,
    "question": "다음 영영 뜻에 해당하는 단어를 쓰시오.\\n\\"a person who teaches\\"",
    "options": null,
    "answer": "teacher",
    "explanation": "'가르치는 사람'이라는 뜻으로 teacher가 정답입니다.",
    "acceptedAnswers": ["Teacher"]
  },
  {
    "number": 3,
    "question": "다음 빈칸에 알맞은 단어를 쓰시오.\\nThe ___ was very impressive. (= the act of performing in front of an audience)",
    "options": null,
    "answer": "performance",
    "explanation": "'관객 앞에서 하는 행위'라는 뜻으로 performance가 정답입니다.",
    "acceptedAnswers": ["Performance"]
  }
]`;

function getPromptForType(extractType: string | null): string {
  if (extractType === 'eng_eng_def') return EXTRACT_PROMPT_ENG_ENG_DEF;
  return EXTRACT_PROMPT_DEFAULT;
}

// ── 정답표(Answer Key) 전용 추출 프롬프트 ──
const ANSWER_KEY_PROMPT = `이 문서의 뒷부분에 정답표(정답, 정답지, 답안, Answer Key)가 있는지 확인하세요.

규칙:
- 문서 뒷부분에서 정답표/정답지 섹션을 찾으세요 (보통 마지막 페이지에 있음)
- 정답표가 있으면 {문제번호: 정답} 형태의 JSON 객체로 반환
- 정답표가 없으면 빈 객체 {} 를 반환
- 객관식 정답은 숫자 문자열로 ("1", "2", "3" 등)
- 원문자(①②③④⑤)는 숫자로 변환 (①→"1", ②→"2" 등)
- 서술형 정답은 텍스트 그대로
- 반드시 JSON 객체로만 응답하세요. 설명이나 마크다운 없이 순수 JSON만.

예시 출력:
{"1": "3", "2": "1", "3": "4", "4": "swimming", "5": "2"}`;

/** PDF를 N페이지씩 청크로 분할하여 각각의 base64 반환 */
async function splitPdfIntoChunks(pdfBytes: ArrayBuffer, pagesPerChunk: number) {
  const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  if (totalPages <= pagesPerChunk) {
    return [{ base64: Buffer.from(pdfBytes).toString('base64'), pages: `1-${totalPages}` }];
  }

  const chunks: { base64: string; pages: string }[] = [];
  for (let start = 0; start < totalPages; start += pagesPerChunk) {
    const end = Math.min(start + pagesPerChunk, totalPages);
    const chunkDoc = await PDFDocument.create();
    const copiedPages = await chunkDoc.copyPages(srcDoc, Array.from({ length: end - start }, (_, i) => start + i));
    copiedPages.forEach((page) => chunkDoc.addPage(page));
    const chunkBytes = await chunkDoc.save();
    chunks.push({
      base64: Buffer.from(chunkBytes).toString('base64'),
      pages: `${start + 1}-${end}`,
    });
  }

  return chunks;
}

/** 단일 PDF 청크에 대해 Claude API 호출 */
async function extractFromPdfChunk(base64Data: string, chunkLabel: string, prompt: string) {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 16384,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64Data },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });

  const questions = parseAiJsonArray(message);
  logger.info('ai.pdf_extract.chunk_done', { chunk: chunkLabel, count: questions.length });
  return questions;
}

/** 이미지에 대해 Claude API 호출 */
async function extractFromImage(base64Data: string, mediaType: string, label: string, prompt: string) {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 16384,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif', data: base64Data },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });

  const questions = parseAiJsonArray(message);
  logger.info('ai.image_extract.done', { label, count: questions.length });
  return questions;
}

/** PDF base64에서 정답표만 추출 (병렬 호출용) */
async function extractAnswerKeyFromPdfChunk(base64Data: string): Promise<Record<string, string>> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } },
            { type: 'text', text: ANSWER_KEY_PROMPT },
          ],
        },
      ],
    });
    return parseAiJsonObject<Record<string, string>>(message) ?? {};
  } catch (e) {
    logger.warn('ai.answer_key_extract.failed', { error: String(e) });
    return {};
  }
}

/** URL 기반 PDF에서 정답표만 추출 (병렬 호출용) */
async function extractAnswerKeyFromPdfUrl(pdfUrl: string): Promise<Record<string, string>> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'document', source: { type: 'url', url: pdfUrl } },
            { type: 'text', text: ANSWER_KEY_PROMPT },
          ],
        },
      ],
    });
    return parseAiJsonObject<Record<string, string>>(message) ?? {};
  } catch (e) {
    logger.warn('ai.answer_key_extract.failed', { error: String(e) });
    return {};
  }
}

/** 정답표 결과를 추출된 문제에 머지. 정답표 답이 우선. */
function mergeAnswerKey(
  questions: Record<string, unknown>[],
  answerKey: Record<string, string>,
): number {
  const keyCount = Object.keys(answerKey).length;
  if (keyCount === 0) return 0;

  let merged = 0;
  for (const q of questions) {
    const num = String(q.number);
    if (num in answerKey && answerKey[num] !== '') {
      q.answer = answerKey[num];
      merged++;
    }
  }
  return merged;
}

/** URL 기반 PDF에 대해 Claude API 호출 (Vercel 본문 제한 우회) */
async function extractFromPdfUrl(pdfUrl: string, prompt: string) {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 16384,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'url', url: pdfUrl },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });

  const questions = parseAiJsonArray(message);
  logger.info('ai.pdf_extract.url_done', { count: questions.length });
  return questions;
}

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

  const limited = await checkRateLimit(user.id, 'naesin/problems/extract-pdf', 50);
  if (limited) return limited;

  try {
    const contentType = request.headers.get('content-type') || '';
    let allQuestions: Record<string, unknown>[];
    let answerKey: Record<string, string> = {};
    let storagePath: string | undefined;

    if (contentType.includes('application/json')) {
      // === URL 기반 추출 (Vercel 4.5MB 본문 제한 우회) ===
      const body = await request.json();
      const pdfUrl: string = body.pdfUrl;
      storagePath = body.storagePath;
      const extractType: string | null = body.extractType || null;
      const prompt = getPromptForType(extractType);

      if (!pdfUrl) {
        return NextResponse.json({ error: 'pdfUrl이 필요합니다.' }, { status: 400 });
      }

      logger.info('ai.extract.start', { userId: user.id, mode: 'url' });

      try {
        // 문제 추출 + 정답표 추출 병렬 실행
        const [urlQuestions, urlAnswerKey] = await Promise.all([
          extractFromPdfUrl(pdfUrl, prompt),
          extractAnswerKeyFromPdfUrl(pdfUrl),
        ]);
        allQuestions = urlQuestions as Record<string, unknown>[];
        answerKey = urlAnswerKey;
      } catch (apiError) {
        const apiMsg = apiError instanceof Error ? apiError.message : String(apiError);
        const apiStatus = (apiError as { status?: number })?.status;
        logger.error('ai.extract.api_error', { error: apiMsg, status: apiStatus, mode: 'url' });

        if (apiMsg.includes('too large') || apiMsg.includes('token') || apiMsg.includes('size')) {
          return NextResponse.json(
            { error: '파일이 너무 크거나 내용이 많습니다. 파일을 나눠서 다시 시도해주세요.' },
            { status: 400 },
          );
        }
        return NextResponse.json(
          { error: `AI 서버 연결에 실패했습니다. (${apiStatus ?? '?'}: ${apiMsg.slice(0, 120)})` },
          { status: 502 },
        );
      }
    } else {
      // === FormData 기반 추출 (기존 방식, 4.5MB 이하 파일) ===
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const extractType = formData.get('extractType') as string | null;
      const prompt = getPromptForType(extractType);
      const isPdf = file?.type === 'application/pdf';
      const isImage = file ? IMAGE_TYPES.has(file.type) : false;

      if (!file || (!isPdf && !isImage)) {
        return NextResponse.json({ error: 'PDF 또는 이미지 파일(PNG, JPG)을 업로드해주세요.' }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `파일이 너무 큽니다 (${(file.size / 1024 / 1024).toFixed(1)}MB). 20MB 이하만 가능합니다.` },
          { status: 400 },
        );
      }

      const arrayBuffer = await file.arrayBuffer();

      logger.info('ai.extract.start', {
        userId: user.id,
        fileType: file.type,
        fileSize: arrayBuffer.byteLength,
      });

      try {
        if (isImage) {
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          allQuestions = await extractFromImage(base64, file.type, file.name, prompt) as Record<string, unknown>[];
        } else {
          const fullBase64 = Buffer.from(arrayBuffer).toString('base64');
          // 정답표 추출을 문제 추출과 병렬로 시작
          const answerKeyPromise = extractAnswerKeyFromPdfChunk(fullBase64);

          const chunks = await splitPdfIntoChunks(arrayBuffer, PAGES_PER_CHUNK);
          logger.info('ai.pdf_extract.chunks', {
            totalChunks: chunks.length,
            pages: chunks.map((c) => c.pages).join(', '),
          });

          if (chunks.length === 1) {
            allQuestions = await extractFromPdfChunk(chunks[0].base64, chunks[0].pages, prompt) as Record<string, unknown>[];
          } else {
            const results = await Promise.all(
              chunks.map((chunk) => extractFromPdfChunk(chunk.base64, chunk.pages, prompt)),
            );
            allQuestions = results.flat() as Record<string, unknown>[];
          }

          answerKey = await answerKeyPromise;
        }
      } catch (apiError) {
        const apiMsg = apiError instanceof Error ? apiError.message : String(apiError);
        const apiStatus = (apiError as { status?: number })?.status;
        console.log(JSON.stringify({
          level: 'error',
          msg: 'ai.extract.api_error',
          ts: new Date().toISOString(),
          error: apiMsg,
          status: apiStatus,
          fileSize: arrayBuffer.byteLength,
          fileType: file.type,
        }));

        if (apiMsg.includes('too large') || apiMsg.includes('token') || apiMsg.includes('size')) {
          return NextResponse.json(
            { error: '파일이 너무 크거나 내용이 많습니다. 파일을 나눠서 다시 시도해주세요.' },
            { status: 400 },
          );
        }
        return NextResponse.json(
          { error: `AI 서버 연결에 실패했습니다. (${apiStatus ?? '?'}: ${apiMsg.slice(0, 120)})` },
          { status: 502 },
        );
      }
    }

    // 정답표에서 가져온 답을 문제에 머지 (정답표가 source of truth)
    const answerKeyCount = Object.keys(answerKey).length;
    const mergedCount = mergeAnswerKey(allQuestions, answerKey);
    if (answerKeyCount > 0) {
      logger.info('ai.answer_key_extract.merged', { keyCount: answerKeyCount, mergedCount, questionCount: allQuestions.length });
    }

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

    // 공통 지문 자동 복제: "위 글/위 대화" 후속 문항에 앞 지문을 복사(Haiku가 지문을 첫 문항에만 넣는 경우 보정).
    const passaged = backfillSharedPassages(dedup as unknown as NaesinProblemQuestion[]) as unknown as Record<string, unknown>[];

    // 그림·사진·지도·그래프 의존 문항은 미리보기에 노출하지 않고 추출 단계에서 제거(표는 마크다운 재현되어 유지).
    // 제거 개수는 응답에 담아 UI가 "그림 문항 N개 제외" 안내 — 조용한 누락 방지.
    const before = passaged.length;
    const questions = passaged.filter((q) => !isUnanswerableImageQuestion(String(q.question ?? '')));
    questions.forEach((q, i) => { q.number = i + 1; });
    const removedImageCount = before - questions.length;

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'PDF에서 문제를 찾을 수 없습니다. 문제가 포함된 PDF인지 확인해주세요.' },
        { status: 422 },
      );
    }

    // Storage 임시 파일 삭제
    if (storagePath) {
      import('@/lib/supabase/admin').then(({ createAdminClient }) => {
        createAdminClient().storage.from('public-images').remove([storagePath!]).catch(() => {});
      });
    }

    logger.info('ai.extract.done', { count: questions.length, answerKeyFound: answerKeyCount > 0, mergedCount, removedImageCount });
    return NextResponse.json({
      questions,
      ...(removedImageCount > 0 && { removedImageCount }),
      ...(answerKeyCount > 0 && { answerKeyFound: true, answerKeyMerged: mergedCount }),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('ai.pdf_extract', { error: msg });

    console.log(JSON.stringify({
      level: 'error',
      msg: 'ai.pdf_extract.outer_catch',
      ts: new Date().toISOString(),
      error: msg,
      stack: error instanceof Error ? error.stack?.slice(0, 300) : undefined,
    }));

    if (msg.includes('JSON')) {
      return NextResponse.json(
        { error: `AI가 문제를 추출했지만 형식 변환에 실패했습니다. (${msg.slice(0, 100)})` },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: `PDF 문제 추출 중 오류가 발생했습니다. (${msg.slice(0, 120)})` },
      { status: 500 },
    );
  }
}
