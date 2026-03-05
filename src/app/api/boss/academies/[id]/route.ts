import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { academyCreateSchema } from '@/lib/api/schemas';

export const PATCH = createApiHandler(
  { roles: ['boss'], schema: academyCreateSchema },
  async ({ body, params }) => {
    const admin = createAdminClient();
    const { error } = await admin
      .from('academies')
      .update({ name: body.name.trim() })
      .eq('id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
);

export const DELETE = createApiHandler(
  { roles: ['boss'] },
  async ({ params }) => {
    const admin = createAdminClient();

    // Check if academy has users
    const { count } = await admin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', params.id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `학원에 ${count}명의 회원이 있습니다. 먼저 회원을 다른 학원으로 이동하세요.` },
        { status: 400 }
      );
    }

    const { error } = await admin
      .from('academies')
      .delete()
      .eq('id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
);
