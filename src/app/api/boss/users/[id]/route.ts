import { NextResponse } from 'next/server';
import { createApiHandler, NotFoundError, ValidationError } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { userPatchSchema } from '@/lib/api/schemas';

export const PATCH = createApiHandler(
  { roles: ['boss'], schema: userPatchSchema },
  async ({ body, params }) => {
    const admin = createAdminClient();
    const updates: Record<string, unknown> = {};

    if ('role' in body && body.role !== undefined) {
      updates.role = body.role;
    }

    if ('academy_id' in body) {
      if (body.academy_id !== null && body.academy_id !== undefined) {
        const { data: academy } = await admin
          .from('academies')
          .select('id')
          .eq('id', body.academy_id)
          .single();

        if (!academy) throw new NotFoundError('학원을 찾을 수 없습니다.');
      }
      updates.academy_id = body.academy_id;
    }

    if ('is_active' in body && body.is_active !== undefined) {
      updates.is_active = body.is_active;
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('수정할 항목이 없습니다.');
    }

    const { error } = await admin
      .from('users')
      .update(updates)
      .eq('id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
);
