import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler } from '@/lib/api/handler';
import { createAdminClient } from '@/lib/supabase/admin';

const schema = z.object({
  mode: z.enum(['book', 'day']),
});

// PATCH — 학생 본인이 학습 모드 변경
export const PATCH = createApiHandler(
  { schema },
  async ({ user, body }) => {
    const admin = createAdminClient();

    // upsert: service_assignment 없으면 생성
    const { error } = await admin
      .from('service_assignments')
      .upsert(
        {
          student_id: user.id,
          service: 'voca',
          assigned_by: user.id,
          voca_round_mode: body.mode,
        },
        { onConflict: 'student_id,service' }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ mode: body.mode });
  }
);
