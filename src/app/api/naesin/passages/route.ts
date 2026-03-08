import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler } from '@/lib/api';
import { passageCreateSchema, idSchema } from '@/lib/api/schemas';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;
const AUTO_INTERVAL = { easy: 5, medium: 3, hard: 2 } as const;

function generateAutoBlanks(text: string, interval: number) {
  const words = text.trim().split(/\s+/);
  return words
    .map((w, i) => ({ index: i, answer: w }))
    .filter((_, i) => i % interval === interval - 1);
}

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: passageCreateSchema },
  async ({ body, supabase }) => {
    const { data, error } = await supabase
      .from('naesin_passages')
      .insert({
        unit_id: body.unit_id,
        title: body.title,
        original_text: body.original_text,
        korean_translation: body.korean_translation,
        blanks_easy: body.blanks_easy || null,
        blanks_medium: body.blanks_medium || null,
        blanks_hard: body.blanks_hard || null,
        sentences: body.sentences || null,
        grammar_vocab_items: body.grammar_vocab_items || null,
        sort_order: body.sort_order || 0,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
});

export const PATCH = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: passageUpdateSchema },
  async ({ body, supabase }) => {
    const updates: Record<string, unknown> = {};

    if (body.title) updates.title = body.title;
    if (body.grammar_vocab_items !== undefined) {
      updates.grammar_vocab_items = body.grammar_vocab_items || null;
    }

    if (body.sentences) {
      const sentences = body.sentences.map((s: { original: string; korean: string; acceptedAnswers?: string[] }) => ({
        original: s.original,
        korean: s.korean,
        words: s.original.split(/\s+/).filter(Boolean),
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

    const { data, error } = await supabase
      .from('naesin_passages')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
);

export const DELETE = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: idSchema, hasBody: true },
  async ({ body, supabase }) => {
    const { error } = await supabase.from('naesin_passages').delete().eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
);
