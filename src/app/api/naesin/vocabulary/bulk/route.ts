import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/helpers';

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !['teacher', 'admin', 'boss'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = await createClient();

  const { unit_id, items } = await request.json();
  if (!unit_id || !items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Missing unit_id or items array' }, { status: 400 });
  }

  const rows = items.map((item: Record<string, unknown>, idx: number) => ({
    unit_id,
    front_text: item.front_text || '',
    back_text: item.back_text || '',
    part_of_speech: item.part_of_speech || null,
    example_sentence: item.example_sentence || null,
    synonyms: item.synonyms || null,
    antonyms: item.antonyms || null,
    spelling_answer: item.front_text || '',
    sort_order: idx,
  }));

  const { data, error } = await supabase
    .from('naesin_vocabulary')
    .insert(rows)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, count: data?.length || 0 });
}
