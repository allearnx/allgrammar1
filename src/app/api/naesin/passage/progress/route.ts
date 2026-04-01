import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { passageProgressSchema } from '@/lib/api/schemas';

const PASS_THRESHOLD = 80;

export const POST = createApiHandler(
  { schema: passageProgressSchema },
  async ({ user, body, supabase }) => {
    const { unitId, type, score, difficulty, round } = body;
    const isRound2 = round === '2';

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

    // Column mapping based on round
    const colFillBlanks = isRound2 ? 'round2_passage_fill_blanks_best' : 'passage_fill_blanks_best';
    const colOrdering = isRound2 ? 'round2_passage_ordering_best' : 'passage_ordering_best';
    const colTranslation = isRound2 ? 'round2_passage_translation_best' : 'passage_translation_best';
    const colGrammarVocab = isRound2 ? 'round2_passage_grammar_vocab_best' : 'passage_grammar_vocab_best';
    const colCompleted = isRound2 ? 'round2_passage_completed' : 'passage_completed';

    if (type === 'fill_blanks') {
      const currentBest = existing?.[colFillBlanks] ?? 0;
      updates[colFillBlanks] = Math.max(currentBest, score);
    } else if (type === 'ordering') {
      const currentBest = existing?.[colOrdering] ?? 0;
      updates[colOrdering] = Math.max(currentBest, score);
    } else if (type === 'translation') {
      const currentBest = existing?.[colTranslation] ?? 0;
      updates[colTranslation] = Math.max(currentBest, score);
    } else if (type === 'grammar_vocab') {
      const currentBest = existing?.[colGrammarVocab] ?? 0;
      updates[colGrammarVocab] = Math.max(currentBest, score);
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
        ? Math.max(existing?.[colFillBlanks] ?? 0, score)
        : (existing?.[colFillBlanks] ?? 0),
      ordering: type === 'ordering'
        ? Math.max(existing?.[colOrdering] ?? 0, score)
        : (existing?.[colOrdering] ?? 0),
      translation: type === 'translation'
        ? Math.max(existing?.[colTranslation] ?? 0, score)
        : (existing?.[colTranslation] ?? 0),
      grammar_vocab: type === 'grammar_vocab'
        ? Math.max(existing?.[colGrammarVocab] ?? 0, score)
        : (existing?.[colGrammarVocab] ?? 0),
    };

    const passageCompleted = uniqueRequired.every((s) => (scoreMap[s] ?? 0) >= PASS_THRESHOLD);
    updates[colCompleted] = passageCompleted;

    dbResult(await supabase
      .from('naesin_student_progress')
      .upsert(updates, { onConflict: 'student_id,unit_id' }));
    return NextResponse.json({ success: true, passageCompleted, round });
  }
);
