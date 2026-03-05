import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { format } from 'date-fns';

export const GET = createApiHandler(
  {},
  async ({ user, supabase }) => {
    const today = format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('student_memory_progress')
      .select('*, memory_item:memory_items(*)')
      .eq('student_id', user.id)
      .eq('is_mastered', false)
      .lte('next_review_date', today)
      .order('next_review_date')
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data });
  }
);
