import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { passageProgressSchema } from '@/lib/api/schemas';

const PASS_THRESHOLD = 80;

export const POST = createApiHandler(
  { schema: passageProgressSchema },
  async ({ user, body, supabase }) => {
    const { unitId, type, score, difficulty } = body;

    // Record this attempt
    await supabase.from('naesin_passage_attempts').insert({
      student_id: user.id,
      unit_id: unitId,
      type,
      difficulty: difficulty || null,
      score,
    });

    const { data: existing } = await supabase
      .from('naesin_student_progress')
      .select('*')
      .eq('student_id', user.id)
      .eq('unit_id', unitId)
      .single();

    const updates: Record<string, unknown> = {
      student_id: user.id,
      unit_id: unitId,
    };

    if (type === 'fill_blanks') {
      const currentBest = existing?.passage_fill_blanks_best ?? 0;
      updates.passage_fill_blanks_best = Math.max(currentBest, score);
    } else if (type === 'ordering') {
      const currentBest = existing?.passage_ordering_best ?? 0;
      updates.passage_ordering_best = Math.max(currentBest, score);
    } else if (type === 'translation') {
      const currentBest = existing?.passage_translation_best ?? 0;
      updates.passage_translation_best = Math.max(currentBest, score);
    } else if (type === 'grammar_vocab') {
      const currentBest = existing?.passage_grammar_vocab_best ?? 0;
      updates.passage_grammar_vocab_best = Math.max(currentBest, score);
    }

    // Fetch student's required stages to determine completion
    const { data: settings } = await supabase
      .from('naesin_student_settings')
      .select('passage_required_stages')
      .eq('student_id', user.id)
      .single();

    const requiredStages: string[] =
      (settings?.passage_required_stages as string[] | null) ?? ['fill_blanks', 'translation'];
    const uniqueRequired = [...new Set(requiredStages)];

    const scoreMap: Record<string, number> = {
      fill_blanks: type === 'fill_blanks'
        ? Math.max(existing?.passage_fill_blanks_best ?? 0, score)
        : (existing?.passage_fill_blanks_best ?? 0),
      ordering: type === 'ordering'
        ? Math.max(existing?.passage_ordering_best ?? 0, score)
        : (existing?.passage_ordering_best ?? 0),
      translation: type === 'translation'
        ? Math.max(existing?.passage_translation_best ?? 0, score)
        : (existing?.passage_translation_best ?? 0),
      grammar_vocab: type === 'grammar_vocab'
        ? Math.max(existing?.passage_grammar_vocab_best ?? 0, score)
        : (existing?.passage_grammar_vocab_best ?? 0),
    };

    const passageCompleted = uniqueRequired.every((s) => (scoreMap[s] ?? 0) >= PASS_THRESHOLD);
    updates.passage_completed = passageCompleted;

    dbResult(await supabase
      .from('naesin_student_progress')
      .upsert(updates, { onConflict: 'student_id,unit_id' }));
    return NextResponse.json({ success: true, passageCompleted });
  }
);
