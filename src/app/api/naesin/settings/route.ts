import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { settingsSchema } from '@/lib/api/schemas';

export const POST = createApiHandler(
  { schema: settingsSchema },
  async ({ user, body, supabase }) => {
    const { textbookId } = body;

    dbResult(await supabase
      .from('naesin_student_settings')
      .upsert(
        { student_id: user.id, textbook_id: textbookId },
        { onConflict: 'student_id' }
      ));
    return NextResponse.json({ success: true });
  }
);
