import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler, dbResult } from '@/lib/api';

const dialogueProgressSchema = z.object({
  unitId: z.string().max(100),
  score: z.number(),
  round: z.enum(['1', '2']).default('1'),
  type: z.enum(['ordering', 'first_letter', 'translation']).default('translation'),
});

const COL_MAP = {
  ordering: { r1: 'dialogue_ordering_best', r2: 'round2_dialogue_ordering_best' },
  first_letter: { r1: 'dialogue_first_letter_best', r2: 'round2_dialogue_first_letter_best' },
  translation: { r1: 'dialogue_translation_best', r2: 'round2_dialogue_translation_best' },
} as const;

export const POST = createApiHandler(
  { schema: dialogueProgressSchema },
  async ({ user, body, supabase }) => {
    const { unitId, score, round, type } = body;
    const isRound2 = round === '2';

    const colBest = isRound2 ? COL_MAP[type].r2 : COL_MAP[type].r1;
    const colCompleted = isRound2 ? 'round2_dialogue_completed' : 'dialogue_completed';

    const { data: existing } = await supabase
      .from('naesin_student_progress')
      .select(colBest)
      .eq('student_id', user.id)
      .eq('unit_id', unitId)
      .single<Record<string, number | null>>();

    const currentBest = (existing?.[colBest] as number | null) ?? 0;
    const newBest = Math.max(currentBest, score);

    // 영작 게이트 제거(2026-06-15): 영작 점수로 진급을 막지 않는다.
    // ordering/first_letter는 원래 워밍업, translation도 더 이상 게이트가 아니므로
    // 대화문 단계는 어떤 연습이든 수행하면(=이 POST 도달) 완료로 본다.
    const dialogueCompleted = true;

    dbResult(await supabase
      .from('naesin_student_progress')
      .upsert({
        student_id: user.id,
        unit_id: unitId,
        [colBest]: newBest,
        [colCompleted]: dialogueCompleted,
        current_round: isRound2 ? 2 : 1,
      }, { onConflict: 'student_id,unit_id' }));

    return NextResponse.json({ success: true, dialogueCompleted, round, type });
  }
);
