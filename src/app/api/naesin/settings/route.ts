import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { settingsSchema } from '@/lib/api/schemas';

export const POST = createApiHandler(
  { schema: settingsSchema },
  async ({ user, body, supabase }) => {
    const { textbookId } = body;

    const { error } = await supabase
      .from('naesin_student_settings')
      .upsert(
        { student_id: user.id, textbook_id: textbookId },
        { onConflict: 'student_id' }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
);
