import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ProgressTypeConfig {
  scoreField: string;
  attemptsField: string;
}

const PROGRESS_TYPES: Record<string, ProgressTypeConfig> = {
  ordering: { scoreField: 'ordering_score', attemptsField: 'ordering_attempts' },
  translation: { scoreField: 'translation_score', attemptsField: 'translation_attempts' },
};

function getProgressConfig(type: string): ProgressTypeConfig {
  if (type.startsWith('fill_blanks_')) {
    const difficulty = type.replace('fill_blanks_', '');
    return {
      scoreField: `fill_blanks_${difficulty}_score`,
      attemptsField: 'fill_blanks_attempts',
    };
  }
  return PROGRESS_TYPES[type];
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { passageId, type, score } = await request.json();

  if (!passageId || !type || score === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const config = getProgressConfig(type);
  if (!config) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
