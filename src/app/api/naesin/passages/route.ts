import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler, dbResult } from '@/lib/api';
import { passageCreateSchema, idSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;
const AUTO_INTERVAL = { easy: 5, medium: 3, hard: 2 } as const;

/** 글자(영문/한글/숫자)가 하나라도 있어야 빈칸 대상 */
const HAS_LETTER = /[a-zA-Z0-9\uAC00-\uD7AF]/;

/** 타이포그래피 문자를 키보드 입력 가능 문자로 정규화 */
function normalizeTypography(s: string): string {
  return s
    .replace(/[\u2018\u2019\u0060\u00B4]/g, "'")  // 곡선 작은따옴표/백틱/악센트 → 직선
    .replace(/[\u201C\u201D]/g, '"')               // 곡선 큰따옴표 → 직선
    .replace(/[\u2013\u2014\u2212]/g, '-')         // 엔대시/엠대시/마이너스 → 하이픈
    .replace(/\u2026/g, '...');                    // 말줄임표 → 마침표 3개
}

function generateAutoBlanks(text: string, interval: number) {
  const words = text.trim().split(/\s+/);
  return words
    .map((w, i) => ({ index: i, answer: w }))
    .filter((_, i) => i % interval === interval - 1)
    .filter((b) => HAS_LETTER.test(b.answer));
}

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: passageCreateSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);

    // 타이포그래피 정규화: 곡선 따옴표/대시 등 → 키보드 문자
    const originalText = body.original_text ? normalizeTypography(body.original_text) : body.original_text;
    const koreanTranslation = body.korean_translation ? normalizeTypography(body.korean_translation) : body.korean_translation;
    const rawSentences = body.sentences as { original: string; korean: string; words?: string[] }[] | null | undefined;
    const sentences = rawSentences?.map((s) => ({
      ...s,
      original: normalizeTypography(s.original),
      korean: normalizeTypography(s.korean),
      words: normalizeTypography(s.original).split(/\s+/).filter(Boolean),
    })) || null;

    // Auto-generate blanks if not provided but original_text exists
    const text = originalText;
    const blanksEasy = body.blanks_easy || (text ? generateAutoBlanks(text, AUTO_INTERVAL.easy) : null);
    const blanksMedium = body.blanks_medium || (text ? generateAutoBlanks(text, AUTO_INTERVAL.medium) : null);
    const blanksHard = body.blanks_hard || (text ? generateAutoBlanks(text, AUTO_INTERVAL.hard) : null);

    const data = dbResult(await supabase
      .from('naesin_passages')
      .insert({
        unit_id: body.unit_id,
        title: body.title,
        original_text: originalText,
        korean_translation: koreanTranslation,
        blanks_easy: blanksEasy,
        blanks_medium: blanksMedium,
        blanks_hard: blanksHard,
        sentences: sentences,
        grammar_vocab_items: body.grammar_vocab_items || null,
        pdf_url: body.pdf_url || null,
        sort_order: body.sort_order || 0,
      })
      .select()
      .single());
    return NextResponse.json(data);
  }
);

const passageUpdateSchema = z.object({
  id: z.string().max(100),
  title: z.string().max(200).optional(),
  sentences: z.array(z.object({
    original: z.string(),
    korean: z.string(),
    acceptedAnswers: z.array(z.string()).optional(),
  })).optional(),
  grammar_vocab_items: z.unknown().nullish(),
  pdf_url: z.string().max(2000).nullish(),
});

export const PATCH = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: passageUpdateSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const updates: Record<string, unknown> = {};

    if (body.title) updates.title = body.title;
    if (body.grammar_vocab_items !== undefined) {
      updates.grammar_vocab_items = body.grammar_vocab_items || null;
    }
    if (body.pdf_url !== undefined) {
      updates.pdf_url = body.pdf_url || null;
    }

    if (body.sentences) {
      const sentences = body.sentences.map((s: { original: string; korean: string; acceptedAnswers?: string[] }) => ({
        original: normalizeTypography(s.original),
        korean: normalizeTypography(s.korean),
        words: normalizeTypography(s.original).split(/\s+/).filter(Boolean),
        ...(s.acceptedAnswers && s.acceptedAnswers.length > 0 ? { acceptedAnswers: s.acceptedAnswers } : {}),
      }));
      updates.sentences = sentences;
      const newOriginalText = sentences.map((s: { original: string }) => s.original).join(' ');
      updates.original_text = newOriginalText;
      updates.korean_translation = sentences.map((s: { korean: string }) => s.korean).join(' ');

      // Regenerate blanks based on new text
      updates.blanks_easy = generateAutoBlanks(newOriginalText, AUTO_INTERVAL.easy);
      updates.blanks_medium = generateAutoBlanks(newOriginalText, AUTO_INTERVAL.medium);
      updates.blanks_hard = generateAutoBlanks(newOriginalText, AUTO_INTERVAL.hard);
    }

    const data = dbResult(await supabase
      .from('naesin_passages')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single());
    return NextResponse.json(data);
  }
);

export const DELETE = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: idSchema, hasBody: true },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    dbResult(await supabase.from('naesin_passages').delete().eq('id', body.id));
    return NextResponse.json({ success: true });
  }
);
