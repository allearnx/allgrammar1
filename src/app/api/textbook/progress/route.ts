import { NextResponse } from 'next/server';
import { createApiHandler, ValidationError } from '@/lib/api';
import { textbookProgressSchema } from '@/lib/api/schemas';

interface ProgressTypeConfig {
  scoreField: string;
  attemptsField: string;
}

const PROGRESS_TYPES: Record<string, ProgressTypeConfig> = {
  ordering: { scoreField: 'ordering_score', attemptsField: 'ordering_attempts' },
  translation: { scoreField: 'translation_score', attemptsField: 'translation_attempts' },
};

function getProgressConfig(type: string): ProgressTypeConfig | undefined {
  if (type.startsWith('fill_blanks_')) {
    const difficulty = type.replace('fill_blanks_', '');
    return {
      scoreField: `fill_blanks_${difficulty}_score`,
      attemptsField: 'fill_blanks_attempts',
    };
  }
  return PROGRESS_TYPES[type];
}

export const POST = createApiHandler(
  { schema: textbookProgressSchema },
  async ({ user, body, supabase }) => {
    const { passageId, type, score } = body;

    const config = getProgressConfig(type);
    if (!config) throw new ValidationError('잘못된 유형입니다.');

    // Get current attempts to increment
    const { data: existing } = await supabase
      .from('student_textbook_progress')
      .select(config.attemptsField)
      .eq('student_id', user.id)
      .eq('passage_id', passageId)
      .single();

    const updates: Record<string, unknown> = {
      student_id: user.id,
      passage_id: passageId,
      [config.scoreField]: score,
      [config.attemptsField]: ((existing as Record<string, number> | null)?.[config.attemptsField] || 0) + 1,
    };

    const { error } = await supabase
      .from('student_textbook_progress')
      .upsert(updates, {
        onConflict: 'student_id,passage_id',
      });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
);
