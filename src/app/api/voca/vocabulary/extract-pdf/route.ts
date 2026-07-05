import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { logger } from '@/lib/logger';
import Anthropic from '@anthropic-ai/sdk';
import { parseAiJsonArray } from '@/lib/ai-json';

export const maxDuration = 120;

const anthropic = new Anthropic();

const COMMON_RULES = `## 필수 규칙
- 중복 없이 핵심 단어만 선별
- 관사(a, the), 전치사(in, on), 대명사(I, you) 등 기본 단어 제외
- 고유명사 제외

## 품사(p) 규칙
- 이미지·PDF에 품사가 표기되어 있으면 그대로 따라갈 것
- 이미지·PDF에 같은 단어가 품사별로 나뉘어 있으면 (예: run n. / run v.) 별도 항목으로 분리
- 이미지·PDF에 품사 구분 없이 한 단어로만 있으면 하나의 항목으로 합쳐서 p에 "n. v." 형태로 표기
- 이미지·PDF에 품사 자체가 없으면 가장 대표적인 품사 1개를 넣을 것

## 유의어(s)·반의어(a)·숙어(i) 규칙
- 원본에 있으면 그대로 사용
- 없으면 자연스럽게 떠오르는 것만 넣고, 억지로 만들지 않을 것
- 없으면 null`;

const EXAMPLE_RULES_GENERATED = `## 예문(e) 규칙 — 반드시 생성
- 원본에 예문이 있으면 그대로 사용
- 예문이 없으면 반드시 자연스러운 영어 예문을 만들어서 넣을 것
- 예문에 해당 단어가 반드시 포함되어야 함
- ⭐ 예문에는 표제어(w)를 **원형(기본형) 그대로** 넣을 것. 과거형·복수형 등 활용형으로
  바꾸지 말 것. (예: 표제어가 "freeze"면 "froze"가 아니라 "freeze/freezes/freezing"만 사용,
  표제어가 "child"면 "children"이 아니라 "child" 사용). 학생이 스펠링 시험에서 표제어를
  써야 하므로 예문 속 형태가 표제어와 어긋나면 안 됨
- 중학생 수준의 쉬운 문장으로 작성 (15단어 이내)
- e 필드가 null이면 안 됨`;

// 영한 교재 (definition_lang='ko'): 한글 뜻 + 예문 한글 해석
const PROMPT_KO = `이 이미지/PDF에서 영어 단어를 추출해주세요. (단어 목록 사진·스캔·표 등 무엇이든 보이는 영어 단어를 읽어낼 것)

${COMMON_RULES}

${EXAMPLE_RULES_GENERATED}

## 예문 한글 해석(ek) 규칙 — 반드시 생성
- 영어 예문(e)에 대응하는 자연스러운 한국어 해석
- ek 필드가 null이면 안 됨

JSON 배열로만 응답 (다른 텍스트 없이):
[{"w":"단어","m":"뜻","p":"n.","e":"The example sentence.","ek":"예문 해석.","s":"유의어1, 유의어2","a":"반의어1","i":[{"en":"숙어","ko":"뜻","example_en":"예문","example_ko":"해석"}]}]
w=단어, m=한글 뜻, p=품사(n./v./adj./adv./prep./conj.), e=영어 예문(필수!), ek=예문 한글 해석(필수!), s=유의어(쉼표 구분, 없으면 null), a=반의어(쉼표 구분, 없으면 null), i=숙어 배열(없으면 null)`;

// 영영 교재 (definition_lang='en'): 영어 정의, 한글 해석 없음 — 국제학교·유학생용
// 원본 PDF에 정의·예문이 이미 있는 경우가 많으므로 "원문 그대로"가 최우선
const PROMPT_EN = `이 이미지/PDF에서 영어 단어를 추출해주세요. (단어 목록 사진·스캔·표 등 무엇이든 보이는 영어 단어를 읽어낼 것)
이 교재는 국제학교·유학생용 **영영(EN-EN) 단어장**입니다. 뜻(m)은 반드시 한국어가 아닌 영어 정의여야 합니다.

⭐ 최우선 원칙: 원본에 있는 영어 정의·예문·유의어·반의어는 **바꾸지 말고 그대로** 추출하세요.
새로 만드는 것은 원본에 없을 때만 합니다.

${COMMON_RULES}

## 영어 정의(m) 규칙 — 반드시 영어로
- 원본에 영어 정의가 있으면 **원문 그대로** 사용 (요약·변형 금지. 정의가 여러 개면 세미콜론으로 이어 모두 포함)
- 원본에 없을 때만 학습자 수준의 쉬운 영어로 간결한 정의를 만들 것 (예: abundant → "existing in large amounts; more than enough")
- 새로 만들 때 정의 안에 표제어(w) 자체를 쓰지 말 것 (circular definition 금지)
- 한국어를 섞지 말 것

## 예문(e) 규칙
- 원본에 예문이 있으면 **원문 그대로** 사용 — 단어가 과거형·복수형 등 활용형으로 쓰여 있어도 바꾸지 말 것
- 원본 예문에 빈칸(_____)이 있으면 표제어(활용형 포함)를 채워서 완전한 문장으로 만들 것
- 원본에 예문이 없을 때만 새로 만들되, 그때는 표제어를 원형 그대로 사용하고 쉬운 문장으로 (15단어 이내)
- e 필드가 null이면 안 됨

## 한글 해석(ek) — 만들지 말 것
- 영영 교재이므로 ek는 항상 null

## 숙어(i) 규칙 추가
- 숙어의 뜻(ko 필드)도 영어 정의로 쓸 것

JSON 배열로만 응답 (다른 텍스트 없이):
[{"w":"단어","m":"English definition from the book","p":"n.","e":"The example sentence.","ek":null,"s":"유의어1, 유의어2","a":"반의어1","i":[{"en":"숙어","ko":"English meaning","example_en":"예문","example_ko":null}]}]
w=단어, m=영어 정의(필수!), p=품사(n./v./adj./adv./prep./conj.), e=영어 예문(필수!), ek=null 고정, s=유의어(쉼표 구분, 없으면 null), a=반의어(쉼표 구분, 없으면 null), i=숙어 배열(없으면 null)`;

interface VocabExtractItem {
  w: string;
  m: string;
  p?: string;
  e?: string | null;
  ek?: string | null;
  s?: string | null;
  a?: string | null;
  i?: Array<{ en: string; ko: string; example_en?: string; example_ko?: string }> | null;
}

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], hasBody: false, rateLimit: { max: 100 } },
  async ({ request }) => {
  try {
    // FormData 업로드 시 PDF/이미지만 허용
    const ct = request.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const formData = await request.clone().formData();
      const file = formData.get('file') as File | null;
      const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
      if (file && !ALLOWED.includes(file.type)) {
        return NextResponse.json({ error: 'PDF 또는 이미지(PNG/JPG) 파일만 지원합니다.' }, { status: 400 });
      }
    }

    const { parseDocOrImageInput, cleanupStorage } = await import('@/lib/api/pdf-input');
    const { block, storagePath, extraFields } = await parseDocOrImageInput(request);

    // 교재 정의 언어에 따라 프롬프트 자동 분기 — bookId 또는 dayId(→교재 역추적).
    // 못 찾으면 영한 기본
    let definitionLang: 'ko' | 'en' = 'ko';
    if (extraFields.bookId || extraFields.dayId) {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const admin = createAdminClient();
      let bookId = extraFields.bookId || null;
      if (!bookId && extraFields.dayId) {
        const { data: day } = await admin
          .from('voca_days')
          .select('book_id')
          .eq('id', extraFields.dayId)
          .single();
        bookId = day?.book_id ?? null;
      }
      if (bookId) {
        const { data: book } = await admin
          .from('voca_books')
          .select('definition_lang')
          .eq('id', bookId)
          .single();
        if (book?.definition_lang === 'en') definitionLang = 'en';
      }
    }

    logger.info('ai.voca_extract', { mode: storagePath ? 'url' : 'formdata', blockType: block.type, definitionLang });

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 16384,
      messages: [
        {
          role: 'user',
          content: [
            block as Anthropic.Messages.ContentBlockParam,
            { type: 'text', text: definitionLang === 'en' ? PROMPT_EN : PROMPT_KO },
          ],
        },
      ],
    });

    const raw = parseAiJsonArray<VocabExtractItem>(message);
    const mapped = raw
      .filter((item) => item.w && item.m) // w, m 필수
      .map((item) => ({
        front_text: item.w.trim(),
        back_text: item.m.trim(),
        part_of_speech: item.p?.trim() || null,
        example_sentence: item.e?.trim() || null,
        example_sentence_ko: item.ek?.trim() || null,
        spelling_hint: item.m.trim() || null,
        spelling_answer: item.w.trim() || null,
        synonyms: item.s?.trim() || null,
        antonyms: item.a?.trim() || null,
        idioms: item.i || null,
      }));

    // 중복 제거 (front_text 기준)
    const seen = new Set<string>();
    const items = mapped.filter((item) => {
      const word = item.front_text?.toLowerCase();
      if (!word || seen.has(word)) return false;
      seen.add(word);
      return true;
    });

    cleanupStorage(storagePath);
    return NextResponse.json({ items });
  } catch (error) {
    logger.error('ai.pdf_extract', { error: error instanceof Error ? error.message : String(error) });
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `PDF 단어 추출 중 오류: ${message}` },
      { status: 500 }
    );
  }
  }
);
